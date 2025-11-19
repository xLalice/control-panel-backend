import { z } from 'zod';


export const createQuotationItemSchema = z.object({
    productId: z.string(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    lineTotal: z.number(),
})

export const createQuotationSchema = z.object({
    validUntil: z.coerce.date().refine((date) => date > new Date(), {
        message: "validUntil must be in the future"
    }),
    leadId: z.string().optional(),
    clientId: z.string().optional(),
    subtotal: z.number(),
    discount: z.number().optional(),
    tax: z.number().optional(),
    total: z.number(),
    notesToCustomer: z.string().optional(),
    internalNotes: z.string().optional(),

    preparedById: z.string(),
    items: z.array(createQuotationItemSchema)
})

export type CreateQuotationDTO = z.infer<typeof createQuotationSchema>

