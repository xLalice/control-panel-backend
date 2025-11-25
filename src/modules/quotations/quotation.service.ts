import { Prisma, PrismaClient, QuotationStatus } from "@prisma/client";
import { CreateQuotationDTO } from "./quotation.schema";
import { QuotationViewModel, QuotationWithRelations } from "./quotation.types";
import { compileTemplate, transformClientToCustomer, transformLeadToCustomer } from "./quotation.utils";
import puppeteer from "puppeteer";
import { StorageService } from "modules/storage/storage.service";
import { EmailService } from "modules/email/email.service";


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
            search
        } = filters;

        const pageNum = parseInt(page);
        const sizeNum = parseInt(pageSize);
        const skip = (pageNum - 1) * sizeNum;

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
                orderBy: { createdAt: 'desc' },
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
    }


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

        return this.generatePdfFromData(quotation);
    }

    private async generatePdfFromData(quotation: QuotationWithRelations) {
        let customerData: QuotationViewModel;

        if (quotation.clientId && quotation.client) {
            customerData = transformClientToCustomer(quotation.client);
        } else if (quotation.leadId && quotation.lead) {
            customerData = transformLeadToCustomer(quotation.lead);
        } else {
            throw new Error("Quotation must be linked to a Client or Lead");
        }

        const pdfData = {
            ...quotation,
            issueDateFormatted: quotation.issueDate.toLocaleDateString(),
            validUntilFormatted: quotation.validUntil.toLocaleDateString(),
            customer: customerData,
        };

        const htmlContent = await compileTemplate('quotation', pdfData);
        return this.generatePdfBuffer(htmlContent);
    }

    async generatePdfBuffer(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true
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

}