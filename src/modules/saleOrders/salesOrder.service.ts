import { MovementType, PrismaClient, QuotationStatus, SalesOrderStatus } from "../../../prisma/generated/prisma/client";
import { ConvertToSalesOrderPayLoadType } from "./salesOrder.schema";

export class SalesOrderService {
    constructor(private prisma: PrismaClient) { }

    async create(payload: ConvertToSalesOrderPayLoadType, userId: string) {
        const quotationExists = await this.prisma.quotation.findUnique({
            where: { id: payload.quotationId },
            include: {
                items: true
            }
        });

        if (!quotationExists) {
            throw new Error(`Quotation with ID ${payload.quotationId} does not exist in this database.`);
        }

        if (!quotationExists) throw new Error("Quotation not found");

        const { clientId, items } = quotationExists;
        const { deliveryDate, deliveryAddress, paymentTerms } = payload;

        if (!clientId) {
            throw new Error("Sales Order creation failed: Missing Client ID");
        }

        return await this.prisma.$transaction(async (tx) => {
            const salesOrder = await tx.salesOrder.create({
                data: {
                    clientId: clientId,
                    quoteReferenceId: payload.quotationId,
                    status: SalesOrderStatus.Pending,
                    items: {
                        create: items.map((item) => ({
                            product: { connect: { id: item.productId } },
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.lineTotal
                        }))
                    },
                    deliveryDate: deliveryDate,
                    deliveryAddress: deliveryAddress,
                    paymentTerms: paymentTerms

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

            await tx.quotation.update({
                where: { id: payload.quotationId },
                data: {
                    status: QuotationStatus.Converted
                }
            })

            return salesOrder;
        });
    }
    
    fetch = async () => {
        const salesOrders = await this.prisma.salesOrder.findMany({
            include: {
                client: true,
                items: {
                    include: {
                        product: true 
                    }
                }
            }
        });

        return salesOrders;
    }

    fetchById = async (id: string) => {
        const salesOrder = await this.prisma.salesOrder.findUnique({
            where: { id },
            include: {
                client: true, 
                quoteReference: true, 
                items: {
                    include: {
                        product: true 
                    }
                }
            }
        });

        if (!salesOrder) {
            throw new Error(`Sales Order ${id} not found`);
        }

        return salesOrder;
    }

    update = async (data: {id: string, status: SalesOrderStatus}) => {
        const updatedSO = await this.prisma.salesOrder.update({
            where: {id: data.id},
            data: {
                status: data.status
            }
        });

        return updatedSO;
    }
}