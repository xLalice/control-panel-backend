import { z } from "zod/v4";
import { ClientStatus } from "@prisma/client";

export const CreateClientSchema = z.object({
  companyId: z.string().uuid().optional().nullable(),

  clientName: z.string().min(1, "Client name is required"),

  accountNumber: z.string().optional().nullable(),
  primaryEmail: z.string().email().optional().nullable(),
  primaryPhone: z.string().optional().nullable(),

  billingAddressStreet: z.string().optional().nullable(),
  billingAddressCity: z.string().optional().nullable(),
  billingAddressRegion: z.string().optional().nullable(),
  billingAddressPostalCode: z.string().optional().nullable(),
  billingAddressCountry: z.string().optional().nullable(),

  shippingAddressStreet: z.string().optional().nullable(),
  shippingAddressCity: z.string().optional().nullable(),
  shippingAddressRegion: z.string().optional().nullable(),
  shippingAddressPostalCode: z.string().optional().nullable(),
  shippingAddressCountry: z.string().optional().nullable(),

  status: z.nativeEnum(ClientStatus).optional().default("Active"),
  notes: z.string().optional().nullable(),

  convertedFromLeadId: z.string().uuid().optional().nullable(),
});

export const UpdateClientSchema = CreateClientSchema.partial();

