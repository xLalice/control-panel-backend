import { PrismaClient, SalesOrderStatus, MovementType } from "@prisma/client";
import { CreateSalesOrderPayload } from "./salesOrder.schema";

export class SalesOrderService {
    constructor(private prisma: PrismaClient) { }

    async create(payload: CreateSalesOrderPayload) {
        
        if (!payload.clientId) {
            throw new Error("Sales Order creation failed: Missing Client ID");
        }
        const { quotationId, clientId, items, userId } = payload;

        return await this.prisma.$transaction(async (tx) => {
            
            const salesOrder = await tx.salesOrder.create({
                data: {
                    client: { connect: { id: clientId } }, 
                    quoteReference: { connect: { id: quotationId } },
                    status: SalesOrderStatus.Pending,
                    items: {
                        create: items.map((item) => ({
                            product: { connect: { id: item.productId } },
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.lineTotal
                        }))
                    }
                }
            });

            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { quantityOnHand: { decrement: item.quantity } }
                });

                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: MovementType.OUT,
                        quantity: item.quantity,
                        createdById: userId, 
                        reason: `Sales Order ${salesOrder.id}`
                    }
                })
            }

            return salesOrder;
        });
    }
}