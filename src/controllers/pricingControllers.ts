import { prisma } from "../config/prisma";
import { z } from "zod";
import { Request, Response } from "express";

const priceSchema = z.object({
  productId: z.string(),
  price: z.number().positive(),
  unit: z.string().min(1),
  updatedBy: z.string(),
});


export const getAllPrices = async (req: Request, res: Response): Promise<any> => {
  try {
    const prices = await prisma.pricing.findMany({
      include: { product: true },
    });
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching prices", error });
  }
};


export const getPriceByCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { category } = req.params;
    const products = await prisma.product.findMany({
      where: { category: { name: category } },
      include: { pricing: true },
    });

    if (!products.length) return res.status(404).json({ message: "No products found in this category" });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching category prices", error });
  }
};


export const addPrice = async (req: Request, res: Response): Promise<any> => {
  try {
    const validation = priceSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ message: "Invalid data", errors: validation.error });

    const { productId, price, unit, updatedBy } = req.body;

    const newPrice = await prisma.pricing.create({
      data: { productId, price, unit, updatedBy },
    });

    res.status(201).json(newPrice);
  } catch (error) {
    res.status(500).json({ message: "Error adding price", error });
  }
};


export const updatePrice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { price, updatedBy } = req.body;

    // Fetch the existing price
    const existingPrice = await prisma.pricing.findUnique({ where: { id } });
    if (!existingPrice) return res.status(404).json({ message: "Price not found" });

    // Log the price change
    await prisma.priceHistory.create({
      data: {
        productId: existingPrice.productId,
        oldPrice: existingPrice.price,
        newPrice: price,
        changedBy: updatedBy,
      },
    });

    // Update the price
    const updatedPrice = await prisma.pricing.update({
      where: { id },
      data: { price, updatedBy },
    });

    res.json(updatedPrice);
  } catch (error) {
    res.status(500).json({ message: "Error updating price", error });
  }
};


export const deletePrice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    await prisma.pricing.delete({ where: { id } });
    res.json({ message: "Price deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting price", error });
  }
};


export const getPriceHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { productId } = req.params;
    const history = await prisma.priceHistory.findMany({ where: { productId } });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching price history", error });
  }
};


