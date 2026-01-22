import z from "zod";

export const convertToSalesOrderPayload = z.object({
    quotationId: z.string(),
    deliveryDate: z.coerce.date({
        required_error: "A delivery date is required.",
    }),
    deliveryAddress: z.string().min(5, {
        message: "Delivery address is required (min 5 chars).",
    }),
    paymentTerms: z.string().min(2, {
        message: "Payment terms are required (e.g. COD, 30 Days).",
    }),
    notes: z.string().optional(),
});

export type ConvertToSalesOrderPayLoadType = z.infer<typeof convertToSalesOrderPayload>;