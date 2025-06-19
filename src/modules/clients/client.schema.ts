import { z } from "zod";
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
export const EntityTypeEnum = ['Lead', 'Inquiry', 'Client'] as const;
export const EntityTypeSchema = z.enum(EntityTypeEnum, {
  message: `Invalid entity type. Expected one of: ${EntityTypeEnum.join(', ')}.`,
});


export const ContactMethodEnum = ['Call', 'Email', 'Meeting', 'SMS', 'In-Person'] as const;
export const ContactMethodSchema = z.enum(ContactMethodEnum, {
  message: `Invalid contact method. Expected one of: ${ContactMethodEnum.join(', ')}.`,
});


export const ContactOutcomeEnum = [
  'Successful',
  'No Answer',
  'Left Voicemail',
  'Follow-up Needed',
  'Next Steps Defined',
  'Not Interested'
] as const;
export const ContactOutcomeSchema = z.enum(ContactOutcomeEnum, {
  message: `Invalid contact outcome. Expected one of: ${ContactOutcomeEnum.join(', ')}.`,
}).optional(); 


export const LogContactHistorySchema = z.object({
  method: ContactMethodSchema,
  summary: z.string().min(1, 'Summary cannot be empty.').max(1000, 'Summary cannot exceed 1000 characters.'),
  outcome: ContactOutcomeSchema,
  timestamp: z.string().datetime({ message: 'Invalid timestamp format. Expected ISO 8601 string.' }),
  entityId: z.string().uuid('Invalid entity ID format.'),
  entityType: EntityTypeSchema,
});

export type LogContactHistoryInput = z.infer<typeof LogContactHistorySchema>;