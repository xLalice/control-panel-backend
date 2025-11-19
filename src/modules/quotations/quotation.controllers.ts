import { Request, Response } from "express";
import { createQuotationSchema } from "./quotation.schema";
import { QuotationService } from "./quotation.service";

class QuotationController {
    constructor(private quotationService: QuotationService) {}
    
    async createQuotation(req: Request, res: Response) {
        const validatedData = createQuotationSchema.parse(req.body);

        const pdfBuffer = await this.quotationService.createQuotation(validatedData);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="quotation-new.pdf"',
            'Content-Length': pdfBuffer.length.toString(),
        });

        res.send(pdfBuffer);

    }

    async getQuotationPdf(req: Request, res: Response) {
        const { id } = req.params;
        
        const pdfBuffer = await this.quotationService.getQuotationPdfById(id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="quotation-${id}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });

        res.send(pdfBuffer);
    };

}


export default QuotationController;