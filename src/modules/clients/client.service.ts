import { PrismaClient, ContactHistory as PrismaContactHistory } from '@prisma/client';
import {AddContactHistoryData, ContactHistory} from "./client.types";

const prisma = new PrismaClient();

export const addContactHistory = async (
  clientId: string, 
  data: Omit<AddContactHistoryData, 'entity'> 
): Promise<ContactHistory> => {
  try {
    const createdContact = await prisma.contactHistory.create({
      data: {
        method: data.method,
        summary: data.summary,
        outcome: data.outcome,
        timestamp: data.timestamp,
        userId: data.userId, 
        clientId: clientId,
        leadId: null,
      },
      include: {
        user: { select: { id: true, name: true } }, 
        client: { select: { id: true, clientName: true } },
      },
    });

    const formattedContact: ContactHistory = {
      id: createdContact.id,
      method: createdContact.method,
      summary: createdContact.summary,
      outcome: createdContact.outcome ?? undefined, 
      timestamp: createdContact.timestamp,
      user: createdContact.user
        ? { id: createdContact.user.id, name: createdContact.user.name }
        : undefined,
      client: createdContact.client
        ? { id: createdContact.client.id, name: createdContact.client.clientName }
        : undefined,
      lead: undefined,
      inquiry: undefined,
    };

    return formattedContact;
  } catch (error) {
    console.error(`Error adding contact history for client ${clientId}:`, error);
    throw new Error(`Failed to add contact history for client.`);
  }
}