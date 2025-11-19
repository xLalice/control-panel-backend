import { PrismaClient } from "@prisma/client";
import { CreateQuotationDTO } from "./quotation.schema";
import { QuotationViewModel, QuotationWithRelations } from "./quotation.types";
import { compileHandlebarsTemplate, transformClientToCustomer, transformLeadToCustomer } from "./quotation.utils";
import puppeteer from "puppeteer";


export class QuotationService {
    constructor(private prisma: PrismaClient) { }

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

        const htmlContent = await compileHandlebarsTemplate(pdfData);
        return this.generatePdfBuffer(htmlContent);
    }

    async generatePdfBuffer(html: string) {
        const browser = await puppeteer.launch({
            headless: true
        });

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        await browser.close();

        return pdfBuffer;
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