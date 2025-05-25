import { Request, Response } from "express";
import { CreateClientSchema, UpdateClientSchema } from "./client.schema";
import { handleZodError } from "../../utils/zod";
import { prisma } from "../../config/prisma";

export const createClient = async (req: Request, res: Response) => {
  try {
    const result = CreateClientSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Validation failed",
        error: handleZodError(result.error),
      });

      return;
    }

    const existingClient = await prisma.client.findUnique({
      where: { clientName: result.data.clientName },
    });

    if (existingClient) {
      res.status(400).json({ error: "Client already exists." });
      return;
    };

    const client = await prisma.client.create({
      data: result.data,
    });

    res
      .status(201)
      .json({ client, message: "Successfully created the client" });
  } catch (error) {
    console.error("Error", error);
    res.status(500).json({ error: "Error creating client." });
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({ where: { isActive: true } });
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error during authentication", error);
    res.status(500).json("Error fetching clients");
  }
};

export const getClient = async (req: Request, res: Response) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
    });
    res.status(200).json(client);
  } catch (error) {
    console.error("Error during authentication", error);
    res.status(500).json("Error fetching client");
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const result = UpdateClientSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Validation failed",
        error: handleZodError(result.error),
      });

      return;
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: result.data,
    });

    res
      .status(201)
      .json({ client, message: "Successfully updated the client" });
  } catch (error) {}
};
