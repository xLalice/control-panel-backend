import { Request, Response } from "express";
import { SalesOrderService } from "./salesOrder.service";
import { convertToSalesOrderPayload, fetchSalesOrdersQuerySchema, updateSalesOrderStatusPayload } from "./salesOrder.schema";

export class SalesOrderController {
  constructor(private salesOrderService: SalesOrderService) {}

  fetch = async (req: Request, res: Response) => {
    const query = fetchSalesOrdersQuerySchema.parse(req.query);

    const results = await this.salesOrderService.fetch(query);
    res.status(200).json(results);
  }

  fetchById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const salesOrder = await this.salesOrderService.fetchById(id);
    res.status(200).json(salesOrder);
  };

  create = async (req: Request, res: Response) => {
    const payload = convertToSalesOrderPayload.parse(req.body);
    const salesOrder = await this.salesOrderService.create(payload, req.user!.id);
    res.status(201).json(salesOrder);
  };

  update = async (req: Request, res: Response) => {
    const payload = updateSalesOrderStatusPayload.parse(req.body);
    const updatedSO = await this.salesOrderService.update(payload);
    res.status(200).json(updatedSO);
  }

}