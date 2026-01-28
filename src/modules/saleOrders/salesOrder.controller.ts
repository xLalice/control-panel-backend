import { Request, Response } from "express";
import { SalesOrderService } from "./salesOrder.service";
import { convertToSalesOrderPayload, updateSalesOrderStatusPayload } from "./salesOrder.schema";

export class SalesOrderController {
  constructor(private salesOrderService: SalesOrderService) {}

  fetch = async (req: Request, res: Response) => {
    const salesOrders = await this.salesOrderService.fetch();
    res.status(200).json(salesOrders);
  }

  create = async (req: Request, res: Response) => {
    const payload = convertToSalesOrderPayload.parse(req.body);
    const salesOrder = await this.salesOrderService.create(payload, req.user!.id);
    res.status(201).json(salesOrder);
  };

  update = async (req: Request, res: Response) => {
    const payload = updateSalesOrderStatusPayload.parse(req.body);
    await this.salesOrderService.update(payload);
    res.status(201);
  }

}