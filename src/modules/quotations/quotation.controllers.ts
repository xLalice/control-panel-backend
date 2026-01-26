import { Request, Response } from "express";
import { createQuotationSchema } from "./quotation.schema";
import { QuotationService } from "./quotation.service";
import { getAuthUser } from "utils/auth.utils";
import { convertToSalesOrderPayload } from "modules/saleOrders/salesOrder.schema";

class QuotationController {
    constructor(private service: QuotationService) { }

    create = async (req: Request, res: Response) => {
        const validatedData = createQuotationSchema.parse(req.body);

        const quote = await this.service.createQuotation(validatedData, req.user!.id);

        res.status(201).json(quote);
    };

    fetch = async (req: Request, res: Response) => {
        const filters = req.query as unknown as Record<string, string>;

        const quotes = await this.service.fetchQuotations(filters);

        res.json(quotes);
    };

    fetchById = async (req: Request, res: Response) => {
        const { id } = req.params;

        const quote = await this.service.fetchQuotation(id);

        res.json(quote)
    };

    delete = async (req: Request, res: Response) => {
        const { id } = req.params;

        await this.service.deleteQuote(id);

        res.status(204).send();
    }

    update = async (req: Request, res: Response) => {
        const { id } = req.params;

        const user = getAuthUser(req);

        const validatedData = createQuotationSchema.partial().parse(req.body);

        const updatedQuote = await this.service.update(id, validatedData, user.id);

        res.json(updatedQuote);
    }

    getPdf = async (req: Request, res: Response) => {
        const { id } = req.params;
        const pdfBuffer = await this.service.getQuotationPdfById(id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="quotation-${id}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });

        res.send(pdfBuffer);
    };

    sendToCustomer = async (req: Request, res: Response) => {
        const { id } = req.params;
        const quote = await this.service.sendQuotation(id);
        res.json({ message: "Quotation sent successfully", quote });
    };

    convertToSalesOrder = async (req: Request, res: Response) => {
        const validatedData = convertToSalesOrderPayload.parse(req.body);
        const salesOrder = await this.service.convertToSalesOrder(validatedData, req.user!.id);
        res.status(201).json(salesOrder);
    }
}

export default QuotationController;