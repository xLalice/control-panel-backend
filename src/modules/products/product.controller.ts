import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import {
  ProductCreateInput,
  ProductUpdateInput,
  ProductCategory,
} from "./product.types";

export class ProductController {
 

  async getAllProducts(req: Request, res: Response): Promise<any> {
    try {
      const products = await prisma.product.findMany({
        include: {
          aggregate: true,
          heavyEquipment: true,
          steel: true,
        },
      });

      // Transform the data for the frontend
      const transformedProducts = products.map((product) => {
        let extendedData = {};

        if (product.category === "Aggregates" && product.aggregate) {
          extendedData = { source: product.aggregate.source };
        } else if (
          product.category === "HeavyEquipment" &&
          product.heavyEquipment
        ) {
          extendedData = {
            equipmentType: product.heavyEquipment.equipmentType,
          };
        } else if (product.category === "Steel" && product.steel) {
          extendedData = {
            grade: product.steel.grade,
            length: product.steel.length,
          };
        }

        return {
          id: product.id,
          category: product.category,
          name: product.name,
          description: product.description,
          pricingModel: product.pricingModel,
          unit: product.unit,
          pickUpPrice: product.pickUpPrice,
          deliveryPrice: product.deliveryPrice,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          ...extendedData,
        };
      });

      return res.status(200).json(transformedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  // Get a single product by ID
  async getProductById(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          aggregate: true,
          heavyEquipment: true,
          steel: true,
        },
      });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Transform the data for the frontend
      let extendedData = {};

      if (product.category === "Aggregates" && product.aggregate) {
        extendedData = { source: product.aggregate.source };
      } else if (
        product.category === "HeavyEquipment" &&
        product.heavyEquipment
      ) {
        extendedData = { equipmentType: product.heavyEquipment.equipmentType };
      } else if (product.category === "Steel" && product.steel) {
        extendedData = {
          grade: product.steel.grade,
          length: product.steel.length,
        };
      }

      const transformedProduct = {
        id: product.id,
        category: product.category,
        name: product.name,
        description: product.description,
        pricingModel: product.pricingModel,
        unit: product.unit,
        pickUpPrice: product.pickUpPrice,
        deliveryPrice: product.deliveryPrice,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        ...extendedData,
      };

      return res.status(200).json(transformedProduct);
    } catch (error) {
      console.error("Error fetching product:", error);
      return res.status(500).json({ error: "Failed to fetch product" });
    }
  }

  // Create a new product
  async createProduct(req: Request, res: Response): Promise<any> {
    try {
      const productData: ProductCreateInput = req.body;

      const result = await prisma.$transaction(async (tx) => {
        const newProduct = await tx.product.create({
          data: {
            category: productData.category,
            name: productData.name,
            description: productData.description,
            pricingModel: productData.pricingModel,
            unit: productData.unit,
            pickUpPrice: productData.pickUpPrice,
            deliveryPrice: productData.deliveryPrice,
          },
        });

        if (productData.category === "Aggregates" && productData.source) {
          await tx.aggregate.create({
            data: {
              source: productData.source,
              product: { connect: { id: newProduct.id } },
            },
          });
        } else if (productData.category === "HeavyEquipment") {
          await tx.heavyEquipment.create({
            data: {
              equipmentType: productData.equipmentType,
              product: { connect: { id: newProduct.id } },
            },
          });
        } else if (productData.category === "Steel") {
          await tx.steel.create({
            data: {
              grade: productData.grade,
              length: productData.length,
              product: { connect: { id: newProduct.id } },
            },
          });
        }

        return newProduct;
      });

      return res.status(201).json({
        message: "Product created successfully",
        productId: result.id,
      });
    } catch (error) {
      console.error("Error creating product:", error);
      return res.status(500).json({ error: "Failed to create product" });
    }
  }

  // Update an existing product
  async updateProduct(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      const productData: ProductUpdateInput = req.body;

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: {
          aggregate: true,
          heavyEquipment: true,
          steel: true,
        },
      });

      if (!existingProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Start a transaction
      await prisma.$transaction(async (tx) => {
        // Update the base product
        await tx.product.update({
          where: { id },
          data: {
            name: productData.name ?? existingProduct.name,
            description: productData.description ?? existingProduct.description,
            pricingModel:
              productData.pricingModel ?? existingProduct.pricingModel,
            unit: productData.unit ?? existingProduct.unit,
            pickUpPrice: productData.pickUpPrice ?? existingProduct.pickUpPrice,
            deliveryPrice:
              productData.deliveryPrice ?? existingProduct.deliveryPrice,
          },
        });

        // Handle category-specific data
        if (
          existingProduct.category === "Aggregates" &&
          existingProduct.aggregate
        ) {
          if (productData.source) {
            await tx.aggregate.update({
              where: { productId: id },
              data: { source: productData.source },
            });
          }
        } else if (
          existingProduct.category === "HeavyEquipment" &&
          existingProduct.heavyEquipment
        ) {
          if (productData.equipmentType) {
            await tx.heavyEquipment.update({
              where: { productId: id },
              data: { equipmentType: productData.equipmentType },
            });
          }
        } else if (
          existingProduct.category === "Steel" &&
          existingProduct.steel
        ) {
          await tx.steel.update({
            where: { productId: id },
            data: {
              grade: productData.grade ?? existingProduct.steel.grade,
              length: productData.length ?? existingProduct.steel.length,
            },
          });
        }
      });

      return res.status(200).json({
        message: "Product updated successfully",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      return res.status(500).json({ error: "Failed to update product" });
    }
  }

  // Delete a product
  async deleteProduct(req: Request, res: Response): Promise<any> {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Delete the product (cascade will handle related records)
      await prisma.product.delete({
        where: { id },
      });

      return res.status(200).json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      return res.status(500).json({ error: "Failed to delete product" });
    }
  }

  // Get products filtered by category
  async getProductsByCategory(req: Request, res: Response): Promise<any> {
    try {
      const { category } = req.params;

      if (!["Aggregates", "HeavyEquipment", "Steel"].includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }

      const products = await prisma.product.findMany({
        where: { category: category as ProductCategory },
        include: {
          aggregate: category === "Aggregates",
          heavyEquipment: category === "HeavyEquipment",
          steel: category === "Steel",
        },
      });

      // Transform the data for the frontend
      const transformedProducts = products.map((product) => {
        let extendedData = {};

        if (product.category === "Aggregates" && product.aggregate) {
          extendedData = { source: product.aggregate.source };
        } else if (
          product.category === "HeavyEquipment" &&
          product.heavyEquipment
        ) {
          extendedData = {
            equipmentType: product.heavyEquipment.equipmentType,
          };
        } else if (product.category === "Steel" && product.steel) {
          extendedData = {
            grade: product.steel.grade,
            length: product.steel.length,
          };
        }

        return {
          id: product.id,
          category: product.category,
          name: product.name,
          description: product.description,
          pricingModel: product.pricingModel,
          unit: product.unit,
          pickUpPrice: product.pickUpPrice,
          deliveryPrice: product.deliveryPrice,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          ...extendedData,
        };
      });

      return res.status(200).json(transformedProducts);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  // Search products
  async searchProducts(req: Request, res: Response): Promise<any> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }

      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          aggregate: true,
          heavyEquipment: true,
          steel: true,
        },
      });

      // Transform the data for the frontend
      const transformedProducts = products.map((product) => {
        let extendedData = {};

        if (product.category === "Aggregates" && product.aggregate) {
          extendedData = { source: product.aggregate.source };
        } else if (
          product.category === "HeavyEquipment" &&
          product.heavyEquipment
        ) {
          extendedData = {
            equipmentType: product.heavyEquipment.equipmentType,
          };
        } else if (product.category === "Steel" && product.steel) {
          extendedData = {
            grade: product.steel.grade,
            length: product.steel.length,
          };
        }

        return {
          id: product.id,
          category: product.category,
          name: product.name,
          description: product.description,
          pricingModel: product.pricingModel,
          unit: product.unit,
          pickUpPrice: product.pickUpPrice,
          deliveryPrice: product.deliveryPrice,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          ...extendedData,
        };
      });

      return res.status(200).json(transformedProducts);
    } catch (error) {
      console.error("Error searching products:", error);
      return res.status(500).json({ error: "Failed to search products" });
    }
  }
}
