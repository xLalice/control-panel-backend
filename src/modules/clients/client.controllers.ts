import { Request, Response } from "express";
import {
  CreateClientSchema,
  LogContactHistoryInput,
  LogContactHistorySchema,
  UpdateClientSchema,
} from "./client.schema";
import { handleZodError } from "../../utils/zod";
import { prisma } from "../../config/prisma";
import { generateNextAccountNumber } from "./client.utils";
import { addContactHistory } from "./client.service";

const createActivityLog = async (
  clientId: string,
  userId: string,
  action: string,
  description: string,
  metadata?: any
) => {
  try {
    await prisma.activityLog.create({
      data: {
        clientId,
        userId,
        action,
        description,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error("Failed to create activity log:", error);
  }
};

export const createClient = async (req: Request, res: Response) => {
  const result = CreateClientSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      message: "Validation failed",
      error: handleZodError(result.error),
    });
    return;
  }

  const existingClient = await prisma.client.findFirst({
    where: { clientName: result.data.clientName },
  });

  if (existingClient) {
    res.status(400).json({ error: "Client already exists." });
    return;
  }

  const accountNumber = await generateNextAccountNumber(prisma);

  const client = await prisma.client.create({
    data: {
      ...result.data,
      accountNumber,
    },
  });

  if (req.user?.id) {
    await createActivityLog(
      client.id,
      req.user.id,
      "Created",
      `Client "${client.clientName}" was created`,
      {
        clientName: client.clientName,
        accountNumber: client.accountNumber,
        status: client.status,
        createdData: result.data,
      }
    );
  }

  res.status(201).json({ client, message: "Successfully created the client" });
};

export const getClients = async (req: Request, res: Response) => {
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(clients);
};

export const getClient = async (req: Request, res: Response) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: {
      activityLog: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.status(200).json(client);
};

export const updateClient = async (req: Request, res: Response) => {
  const result = UpdateClientSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      message: "Validation failed",
      error: handleZodError(result.error),
    });
    return;
  }

  const currentClient = await prisma.client.findUnique({
    where: { id: req.params.id },
  });

  if (!currentClient) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const changedFields: Record<string, { old: any; new: any }> = {};
  Object.keys(result.data).forEach((key) => {
    const oldValue = currentClient[key as keyof typeof currentClient];
    const newValue = result.data[key as keyof typeof result.data];

    if (oldValue !== newValue) {
      changedFields[key] = { old: oldValue, new: newValue };
    }
  });

  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: result.data,
  });

  if (req.user?.id && Object.keys(changedFields).length > 0) {
    const fieldNames = Object.keys(changedFields).join(", ");
    await createActivityLog(
      client.id,
      req.user.id,
      "Updated",
      `Client "${client.clientName}" was updated. Changed fields: ${fieldNames}`,
      {
        clientName: client.clientName,
        changedFields,
        updateTimestamp: new Date().toISOString(),
      }
    );
  }

  res
    .status(200)
    .json({ client, message: "Successfully updated the client" });
  };

export const deleteClient = async (req: Request, res: Response) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
  });

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const updatedClient = await prisma.client.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  if (req.user?.id) {
    await createActivityLog(
      client.id,
      req.user.id,
      "Deleted",
      `Client "${client.clientName}" was deactivated/deleted`,
      {
        clientName: client.clientName,
        accountNumber: client.accountNumber,
        deletionType: "soft_delete",
      }
    );
  }

  res.status(200).json({
    message: "Client successfully deactivated",
    client: updatedClient,
  });
};

export const restoreClient = async (req: Request, res: Response) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
  });

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  if (client.isActive) {
    res.status(400).json({ error: "Client is already active" });
    return;
  }

  const restoredClient = await prisma.client.update({
    where: { id: req.params.id },
    data: { isActive: true },
  });

  if (req.user?.id) {
    await createActivityLog(
      client.id,
      req.user.id,
      "Restored",
      `Client "${client.clientName}" was restored/reactivated`,
      {
        clientName: client.clientName,
        accountNumber: client.accountNumber,
      }
    );
  }

  res.status(200).json({
    message: "Client successfully restored",
    client: restoredClient,
  });
};

export const getClientActivityLog = async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const activities = await prisma.activityLog.findMany({
    where: { clientId: req.params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: Number(limit),
  });

  res.status(200).json(activities);
};

export const getClientContactHistory = async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const contactHistory = await prisma.contactHistory.findMany({
    where: { clientId: req.params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { timestamp: "desc" },
    skip,
    take: Number(limit),
  });

  res.status(200).json(contactHistory);
};

export const logContactHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized: User not authenticated." });
    return;
  }
  const dataToValidate = {
    ...req.body,
    entityId: id,
  };

  const validatedData: LogContactHistoryInput =
    LogContactHistorySchema.parse(dataToValidate);

  const { method, summary, outcome, timestamp, entityType } = validatedData;

  const parsedTimestamp = new Date(timestamp);

  const newContactData = {
    method,
    summary,
    outcome,
    timestamp: parsedTimestamp,
    entity: {
      entityId: id,
      entityType: entityType,
    },
    userId: userId,
  };

  const createdContact = await addContactHistory(id, newContactData);

  res.status(201).json(createdContact);
};