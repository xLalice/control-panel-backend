export interface CreateSalesOrderPayload {
    quotationId: string;
    clientId: string; 
    items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
    }[];
    userId: string; 
}