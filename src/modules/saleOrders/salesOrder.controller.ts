import { Request, Response } from "express";
import { SalesOrderService } from "./salesOrder.service";
import { convertToSalesOrderPayload } from "./salesOrder.schema";

export class SalesOrderController {
  constructor(private salesOrderService: SalesOrderService) {}

  createSalesOrder = async (req: Request, res: Response) => {
    console.log(req.body);
    const payload = convertToSalesOrderPayload.parse(req.body);

    const salesOrder = await this.salesOrderService.create(payload, req.user!.id);
    res.status(201).json(salesOrder);
  }

}