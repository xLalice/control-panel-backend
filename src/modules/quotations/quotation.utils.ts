import { Client, Lead } from "@prisma/client";
import { QuotationViewModel } from "./quotation.types";
import * as fs from "fs/promises";
import * as path from "path";
import Handlebars from "handlebars";

const templatePath = path.join(__dirname, "..", 'templates', 'quotation.hbs');

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

export const compileHandlebarsTemplate = async (data: any): Promise<string> => {
    const source = await fs.readFile(templatePath, 'utf-8');

    const template = Handlebars.compile(source);

    return template(data);
}