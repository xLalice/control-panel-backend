import { QuotationStatus } from '@prisma/client';
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
    leadId: z.string().nullable().optional(),
    clientId: z.string().nullable().optional(),
    subtotal: z.number(),
    discount: z.number().optional(),
    tax: z.number().optional(),
    total: z.number(),
    notesToCustomer: z.string().optional(),
    internalNotes: z.string().optional(),
    items: z.array(createQuotationItemSchema),
    status: z.nativeEnum(QuotationStatus).optional()
})

export type CreateQuotationDTO = z.infer<typeof createQuotationSchema>

