import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { ProductCreateInput, ProductUpdateInput } from "./product.types";
import { Category, Prisma } from "@prisma/client";
import { generateSKU } from "./product.utils";

export class ProductController {
  private transformProduct(product: any) {
    let extendedData = {};

    if (product.category === Category.AGGREGATE && product.aggregate) {
      extendedData = {
        source: product.aggregate.source,
        weightPerUnit: product.aggregate.weightPerUnit,
      };
    } else if (
      product.category === Category.HEAVY_EQUIPMENT &&
      product.heavyEquipment
    ) {
      extendedData = {
        equipmentType: product.heavyEquipment.equipmentType,
      };
    } else if (product.category === Category.STEEL && product.steel) {
      extendedData = {
        grade: product.steel.grade,
        length: product.steel.length,
        type: product.steel.type,
        color: product.steel.color,
        size: product.steel.size,
        additionalAttributes: product.steel.additionalAttributes,
      };
    }

    return {
      id: product.id,
      category: product.category,
      name: product.name,
      sku: product.sku,
      description: product.description,
      basePrice: product.basePrice,
      pricingUnit: product.pricingUnit,
      pricingDetails: product.pricingDetails,
      unit: product.unit,
      pickUpPrice: product.pickUpPrice,
      deliveryPrice: product.deliveryPrice,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      ...extendedData,
    };
  }

  getAllProducts = async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        aggregate: true,
        heavyEquipment: true,
        steel: true,
      },
    });

    const transformedProducts = products.map((product) =>
      this.transformProduct(product)
    );

    res.status(200).json(transformedProducts);
  };

  getProductById = async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        aggregate: true,
        heavyEquipment: true,
        steel: true,
      },
    });

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const transformedProduct = this.transformProduct(product);
    res.status(200).json(transformedProduct);
  };

  createProduct = async (req: Request, res: Response) => {
    const productData: ProductCreateInput = req.body;
    const sku = generateSKU(productData.category);

    const result = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          category: productData.category,
          name: productData.name,
          sku: sku,
          description: productData.description,
          basePrice: productData.basePrice,
          pricingUnit: productData.pricingUnit,
          pricingDetails: productData.pricingDetails as Prisma.InputJsonValue,
          unit: productData.unit,
          pickUpPrice: productData.pickUpPrice,
          deliveryPrice: productData.deliveryPrice,
        },
      });

      if (productData.category === Category.AGGREGATE) {
        await tx.aggregate.create({
          data: {
            source: productData.source || "",
            weightPerUnit: productData.weightPerUnit,
            product: { connect: { id: newProduct.id } },
          },
        });
      } else if (productData.category === Category.HEAVY_EQUIPMENT) {
        await tx.heavyEquipment.create({
          data: {
            equipmentType: productData.equipmentType,
            product: { connect: { id: newProduct.id } },
          },
        });
      } else if (productData.category === Category.STEEL) {
        await tx.steel.create({
          data: {
            grade: productData.grade,
            length: productData.length,
            type: productData.type,
            color: productData.color,
            size: productData.size,
            additionalAttributes:
              productData.additionalAttributes as Prisma.InputJsonValue,
            product: { connect: { id: newProduct.id } },
          },
        });
      }

      return newProduct;
    });

    res.status(201).json({
      message: "Product created successfully",
      productId: result.id,
    });
  };

  updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    const productData: ProductUpdateInput = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        aggregate: true,
        heavyEquipment: true,
        steel: true,
      },
    });

    if (!existingProduct) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: productData.name ?? existingProduct.name,
          description: productData.description ?? existingProduct.description,
          basePrice: productData.basePrice ?? existingProduct.basePrice,
          pricingUnit: productData.pricingUnit ?? existingProduct.pricingUnit,
          pricingDetails: productData.pricingDetails
            ? (productData.pricingDetails as Prisma.InputJsonValue)
            : (existingProduct.pricingDetails as Prisma.InputJsonValue),
          unit: productData.unit ?? existingProduct.unit,
          pickUpPrice: productData.pickUpPrice ?? existingProduct.pickUpPrice,
          deliveryPrice:
            productData.deliveryPrice ?? existingProduct.deliveryPrice,
        },
      });

      if (
        existingProduct.category === Category.AGGREGATE &&
        existingProduct.aggregate
      ) {
        await tx.aggregate.update({
          where: { productId: id },
          data: {
            source: productData.source ?? existingProduct.aggregate.source,
            weightPerUnit:
              productData.weightPerUnit ??
              existingProduct.aggregate.weightPerUnit,
          },
        });
      } else if (
        existingProduct.category === Category.HEAVY_EQUIPMENT &&
        existingProduct.heavyEquipment
      ) {
        await tx.heavyEquipment.update({
          where: { productId: id },
          data: {
            equipmentType:
              productData.equipmentType ??
              existingProduct.heavyEquipment.equipmentType,
          },
        });
      } else if (
        existingProduct.category === Category.STEEL &&
        existingProduct.steel
      ) {
        await tx.steel.update({
          where: { productId: id },
          data: {
            grade: productData.grade ?? existingProduct.steel.grade,
            length: productData.length ?? existingProduct.steel.length,
            type: productData.type ?? existingProduct.steel.type,
            color: productData.color ?? existingProduct.steel.color,
            size: productData.size ?? existingProduct.steel.size,
            additionalAttributes: productData.additionalAttributes
              ? (productData.additionalAttributes as Prisma.InputJsonValue)
              : (existingProduct.steel
                  .additionalAttributes as Prisma.InputJsonValue),
          },
        });
      }
    });

    res.status(200).json({
      message: "Product updated successfully",
    });
  };

  deleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await prisma.product.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    res.status(200).json({
      message: "Product deleted successfully",
    });
  };

  getProductsByCategory = async (req: Request, res: Response) => {
    const { category } = req.params;
    const validCategories = [
      Category.AGGREGATE,
      Category.HEAVY_EQUIPMENT,
      Category.STEEL,
    ];

    if (!validCategories.includes(category as Category)) {
      res.status(400).json({ error: "Invalid category" });
      return;
    }

    const products = await prisma.product.findMany({
      where: { category: category as Category },
      include: {
        aggregate: category === Category.AGGREGATE,
        heavyEquipment: category === Category.HEAVY_EQUIPMENT,
        steel: category === Category.STEEL,
      },
    });

    const transformedProducts = products.map((product) =>
      this.transformProduct(product)
    );

    res.status(200).json(transformedProducts);
  };

  searchProducts = async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      include: {
        aggregate: true,
        heavyEquipment: true,
        steel: true,
      },
    });

    const transformedProducts = products.map((product) =>
      this.transformProduct(product)
    );

    res.status(200).json(transformedProducts);
  };
}
