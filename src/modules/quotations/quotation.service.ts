import { Prisma, PrismaClient, QuotationStatus } from "@prisma/client";
import { CreateQuotationDTO } from "./quotation.schema";
import { QuotationViewModel, QuotationWithRelations } from "./quotation.types";
import { compileTemplate, transformClientToCustomer, transformLeadToCustomer } from "./quotation.utils";
import puppeteer from "puppeteer";
import { StorageService } from "modules/storage/storage.service";
import { EmailService } from "modules/email/email.service";
import { formatCurrency, getBase64Logo } from "utils/common";


export class QuotationService {
    constructor(
        private prisma: PrismaClient,
        private storageService: StorageService,
        private emailService: EmailService
    ) { }

    fetchQuotations = async (filters: Record<string, string>) => {
        const {
            page = '1',
            pageSize = '20',
            leadId,
            clientId,
            status,
            search,
            sort
        } = filters;

        const pageNum = parseInt(page);
        const sizeNum = parseInt(pageSize);
        const skip = (pageNum - 1) * sizeNum;

        const orderByClause = this.parseSortParams(sort);

        const whereClause: Prisma.QuotationWhereInput = {
            ...(leadId && { leadId }),
            ...(clientId && { clientId }),
            ...(status && { status: status as QuotationStatus }),
            ...(search && {
                quotationNumber: { contains: search, mode: 'insensitive' }
            })
        }

        const [quotations, total] = await Promise.all([
            this.prisma.quotation.findMany({
                where: whereClause,
                skip,
                take: sizeNum,
                orderBy: orderByClause,
                include: {
                    client: { select: { clientName: true } },
                    lead: { select: { name: true } }
                }
            }),
            this.prisma.quotation.count({ where: whereClause })
        ]);

        return {
            data: quotations,
            meta: {
                total,
                page: pageNum,
                pageSize: sizeNum,
                totalPages: Math.ceil(total / sizeNum)
            }
        };
    };

    async fetchQuotation(id: string) {
        const quotation = await this.prisma.quotation.findUnique({
            where: { id }
        });

        return quotation;
    };

    async sendQuotation(quotationId: string) {
        const quotation = await this.prisma.quotation.findUnique({
            where: { id: quotationId },
            include: { client: true, lead: true, items: true }
        });

        if (!quotation) throw new Error("Not found");
        if (quotation.status === QuotationStatus.Sent) throw new Error("Quotation already sent.");

        const pdfBuffer = await this.generatePdfFromData(quotation);

        const fileName = `${quotation.quotationNumber}.pdf`;
        const publicUrl = await this.storageService.uploadQuotationPdf(fileName, pdfBuffer);

        const recipientEmail = quotation.client?.primaryEmail || quotation.lead?.email;
        const recipientName = quotation.client?.clientName || quotation.lead?.name;

        if (!recipientEmail) throw new Error("Client/Lead has no email address");

        await this.emailService.sendQuotation(
            recipientEmail,
            recipientName!,
            quotation.quotationNumber,
            pdfBuffer
        );

        return this.prisma.quotation.update({
            where: { id: quotationId },
            data: {
                status: QuotationStatus.Sent,
                issueDate: new Date(),
                pdfUrl: publicUrl
            }
        });
    }

    async createQuotation(data: CreateQuotationDTO, userId: string) {
        const quotationNumber = await this.generateQuotationNumber();


        return this.prisma.quotation.create({
            data: {
                ...data,
                status: QuotationStatus.Draft,
                quotationNumber,
                items: {
                    create: data.items
                },
                preparedById: userId
            }
        });
    }

    async getQuotationPdfById(id: string) {
        const quotation = await this.prisma.quotation.findUnique({
            where: { id },
            include: {
                client: true,
                lead: true,
                items: true
            }
        });

        if (!quotation) throw new Error("Quotation not found");

        if (quotation.pdfUrl) {
            try {
                const response = await fetch(quotation.pdfUrl);

                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    return Buffer.from(arrayBuffer);
                }

                console.warn("Stored PDF found but failed to download. Regenerating...");
            } catch (err) {
                console.error("Error fetching stored PDF", err);
            }
        }

        const pdfBuffer = await this.generatePdfFromData(quotation);

        const fileName = `${quotation.quotationNumber}.pdf`;

        const publicUrl = await this.storageService.uploadQuotationPdf(fileName, pdfBuffer);

        await this.prisma.quotation.update({
            where: { id },
            data: { pdfUrl: publicUrl }
        });

        return pdfBuffer;
    }

    deleteQuote = async (id: string) => {
        const current = await this.prisma.quotation.findUnique({
            where: { id },
            select: { status: true }
        });

        if (!current) throw new Error("Quotation not found");

        if (current.status === QuotationStatus.Sent) {
            throw new Error("Cannot delete a quotation that has already been sent.");
        }

        return this.prisma.quotation.delete({
            where: { id }
        });
    }

    update = async (id: string, data: Partial<CreateQuotationDTO>) => {
        const current = await this.prisma.quotation.findUnique({
            where: { id },
            select: { status: true }
        });

        if (!current) throw new Error("Quotation not found");

        if (current.status === QuotationStatus.Sent) {
            throw new Error("Cannot edit a quotation that has already been sent. Create a revision instead.");
        }

        const { leadId, clientId, items, ...scalarData } = data;

        return this.prisma.quotation.update({
            where: { id },
            data: {
                ...scalarData,

                pdfUrl: null,

                ...(leadId ? { lead: { connect: { id: leadId } } } : {}),
                ...(clientId ? { client: { connect: { id: clientId } } } : {}),

                ...(items ? {
                    items: {
                        deleteMany: {},
                        create: items
                    }
                } : {})
            },
            include: {
                items: true
            }
        });
    }



    async generatePdfBuffer(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });

        const pdfUint8Array = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        await browser.close();

        return Buffer.from(pdfUint8Array);
    };

    private async generateQuotationNumber() {
        const currentYear = new Date().getFullYear();
        const sequence = await this.prisma.sequence.upsert({
            where: { name: "QUOTATION" },
            update: { current: { increment: 1 } },
            create: {
                name: "QUOTATION",
                current: 1
            }
        })

        const seqString = sequence.current.toString().padStart(4, "0");

        return `QTN-${currentYear}-${seqString}`;
    }

    private async generatePdfFromData(quotation: QuotationWithRelations): Promise<Buffer> {
        let customerData: QuotationViewModel;

        if (quotation.clientId && quotation.client) {
            customerData = transformClientToCustomer(quotation.client);
        } else if (quotation.leadId && quotation.lead) {
            customerData = transformLeadToCustomer(quotation.lead);
        } else {
            throw new Error("Quotation must be linked to a Client or Lead");
        }

        const logoBase64 = await getBase64Logo();

        const pdfData = {
            ...quotation,

            issueDateFormatted: quotation.issueDate.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            }),
            validUntilFormatted: quotation.validUntil.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            }),

            subtotalFormatted: formatCurrency(Number(quotation.subtotal)),
            taxFormatted: quotation.tax ? formatCurrency(Number(quotation.tax)) : "0.00",
            discountFormatted: quotation.discount ? formatCurrency(Number(quotation.discount)) : "0.00",
            totalFormatted: formatCurrency(Number(quotation.total)),

            items: quotation.items.map(item => ({
                ...item,
                unitPriceFormatted: formatCurrency(Number(item.unitPrice)),
                lineTotalFormatted: formatCurrency(Number(item.lineTotal)),
                productId: item.productId.substring(0, 8).toUpperCase()
            })),

            client: customerData,
            logoSrc: logoBase64 ? `data:image/png;base64,${logoBase64}` : "",
            currentYear: new Date().getFullYear()
        };

        const htmlContent = await compileTemplate('quotation.hbs', pdfData);
        return await this.generatePdfBuffer(htmlContent);
    }

    private parseSortParams(sortParam?: string): Prisma.QuotationOrderByWithRelationInput[] {
        if (!sortParam) {
            return [{ createdAt: 'desc' }];
        }

        const sortRules = sortParam.split(',');

        const orderBy = sortRules.map((rule) => {
            const [field, dir] = rule.split(':');
            const sort = dir === 'desc' ? 'desc' : 'asc';

            switch (field) {
                case 'quotationNumber': return { quotationNumber: sort };
                case 'status': return { status: sort };
                case 'total': return { total: sort };
                case 'validUntil': return { validUntil: sort };
                case 'createdAt': return { createdAt: sort };
                case 'customer': return [
                    { client: { clientName: sort } },
                    { lead: { name: sort } }
                ];

                default: return undefined;
            }
        });

        return orderBy.filter((item) => item !== undefined) as Prisma.QuotationOrderByWithRelationInput[];
    }
}