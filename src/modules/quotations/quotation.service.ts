import { PrismaClient, QuotationStatus } from "@prisma/client";
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

    async createDraft(data: CreateQuotationDTO, userId: string) {
        return this.prisma.quotation.create({
            data: {
                ...data,
                status: QuotationStatus.Draft,
                quotationNumber: await this.generateQuotationNumber(),
                items: {
                    create: data.items
                },
                preparedById: userId
            }
        });
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

    async createQuotation(data: CreateQuotationDTO) {
        const quotationNumber = await this.generateQuotationNumber();

        const quotation = await this.prisma.quotation.create({
            data: {
                ...data,
                quotationNumber,
                items: { create: data.items }
            },
            include: {
                client: true,
                lead: true,
                items: true
            }
        });

        const pdfBuffer = await this.generatePdfFromData(quotation);

        return pdfBuffer;
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