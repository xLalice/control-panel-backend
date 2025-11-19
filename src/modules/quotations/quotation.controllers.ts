import { Request, Response } from "express";
import { createQuotationSchema } from "./quotation.schema";
import { QuotationService } from "./quotation.service";

class QuotationController {
    constructor(private service: QuotationService) { }

    async createQuotation(req: Request, res: Response) {
        const validatedData = createQuotationSchema.parse(req.body);

        const pdfBuffer = await this.service.createQuotation(validatedData);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="quotation-new.pdf"',
            'Content-Length': pdfBuffer.length.toString(),
        });

        res.send(pdfBuffer);

    }

    async createDraft(req: Request, res: Response) {
        const data = createQuotationSchema.parse(req.body);
        const quote = await this.service.createDraft(data, req.user!.id);
        res.json(quote);

    }

    async sendToCustomer(req: Request, res: Response) {
        const { id } = req.params;
        const quote = await this.service.sendQuotation(id);
        res.json({ message: "Quotation sent successfully", quote });
    };

    async getQuotationPdf(req: Request, res: Response) {
        const { id } = req.params;

        const pdfBuffer = await this.service.getQuotationPdfById(id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="quotation-${id}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });

        res.send(pdfBuffer);
    };



}


export default QuotationController;