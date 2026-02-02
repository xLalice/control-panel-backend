import { Client, Lead } from "../../../prisma/generated/prisma/client";
import { QuotationViewModel } from "./quotation.types";
import * as fs from "fs/promises";
import * as path from "path";
import Handlebars from "handlebars";

export function transformLeadToCustomer(lead: Lead): QuotationViewModel {
    return {
        client: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            address: null,
            city: null,
            state: null,
            zip: null
        },
    };
}

export function transformClientToCustomer(client: Client): QuotationViewModel {
    return {
        client: {
            name: client.clientName,
            address: client.billingAddressCity,
            city: client.billingAddressCity,
            state: client.billingAddressRegion,
            zip: client.billingAddressPostalCode,
            email: client.primaryEmail,
            phone: client.primaryPhone
        },
    };
}

export const compileTemplate = async (templateName: string, data: any): Promise<string> => {
    const filePath = path.join(process.cwd(), 'src', 'templates', templateName);
    
    const source = await fs.readFile(filePath, 'utf8');
    const template = Handlebars.compile(source);
    
    return template(data);
};