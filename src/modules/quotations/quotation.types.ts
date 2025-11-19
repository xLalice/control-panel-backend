import { Client, Lead, Quotation, QuotationItem } from "@prisma/client";

export interface QuotationViewModel {
    client: {
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        zip: string | null;
        email: string | null;
        phone: string | null;
    }
}

export type QuotationWithRelations = Quotation & {
    client: Client | null;
    lead: Lead | null;
    items: QuotationItem[];
};