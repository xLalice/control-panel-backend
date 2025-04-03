"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const prisma_1 = require("../../config/prisma");
const client_1 = require("@prisma/client");
class ProductController {
    getAllProducts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const products = yield prisma_1.prisma.product.findMany({
                    include: {
                        aggregate: true,
                        heavyEquipment: true,
                        steel: true,
                    },
                });
                const transformedProducts = products.map((product) => {
                    let extendedData = {};
                    if (product.category === client_1.Category.AGGREGATE && product.aggregate) {
                        extendedData = {
                            source: product.aggregate.source,
                            weightPerUnit: product.aggregate.weightPerUnit,
                        };
                    }
                    else if (product.category === client_1.Category.HEAVY_EQUIPMENT &&
                        product.heavyEquipment) {
                        extendedData = {
                            equipmentType: product.heavyEquipment.equipmentType,
                        };
                    }
                    else if (product.category === client_1.Category.STEEL && product.steel) {
                        extendedData = {
                            grade: product.steel.grade,
                            length: product.steel.length,
                            type: product.steel.type,
                            color: product.steel.color,
                            size: product.steel.size,
                            additionalAttributes: product.steel.additionalAttributes,
                        };
                    }
                    return Object.assign({ id: product.id, category: product.category, name: product.name, description: product.description, basePrice: product.basePrice, pricingUnit: product.pricingUnit, pricingDetails: product.pricingDetails, unit: product.unit, pickUpPrice: product.pickUpPrice, deliveryPrice: product.deliveryPrice, createdAt: product.createdAt, updatedAt: product.updatedAt }, extendedData);
                });
                return res.status(200).json(transformedProducts);
            }
            catch (error) {
                console.error("Error fetching products:", error);
                return res.status(500).json({ error: "Failed to fetch products" });
            }
        });
    }
    // Get a single product by ID
    getProductById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const product = yield prisma_1.prisma.product.findUnique({
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
                let extendedData = {};
                if (product.category === client_1.Category.AGGREGATE && product.aggregate) {
                    extendedData = {
                        source: product.aggregate.source,
                        weightPerUnit: product.aggregate.weightPerUnit,
                    };
                }
                else if (product.category === client_1.Category.HEAVY_EQUIPMENT &&
                    product.heavyEquipment) {
                    extendedData = {
                        equipmentType: product.heavyEquipment.equipmentType,
                    };
                }
                else if (product.category === client_1.Category.STEEL && product.steel) {
                    extendedData = {
                        grade: product.steel.grade,
                        length: product.steel.length,
                        type: product.steel.type,
                        color: product.steel.color,
                        size: product.steel.size,
                        additionalAttributes: product.steel.additionalAttributes,
                    };
                }
                const transformedProduct = Object.assign({ id: product.id, category: product.category, name: product.name, description: product.description, basePrice: product.basePrice, pricingUnit: product.pricingUnit, pricingDetails: product.pricingDetails, unit: product.unit, pickUpPrice: product.pickUpPrice, deliveryPrice: product.deliveryPrice, createdAt: product.createdAt, updatedAt: product.updatedAt }, extendedData);
                return res.status(200).json(transformedProduct);
            }
            catch (error) {
                console.error("Error fetching product:", error);
                return res.status(500).json({ error: "Failed to fetch product" });
            }
        });
    }
    // Create a new product
    createProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const productData = req.body;
                const result = yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const newProduct = yield tx.product.create({
                        data: {
                            category: productData.category,
                            name: productData.name,
                            description: productData.description,
                            basePrice: productData.basePrice,
                            pricingUnit: productData.pricingUnit,
                            pricingDetails: productData.pricingDetails,
                            unit: productData.unit,
                            pickUpPrice: productData.pickUpPrice,
                            deliveryPrice: productData.deliveryPrice,
                        },
                    });
                    if (productData.category === client_1.Category.AGGREGATE) {
                        yield tx.aggregate.create({
                            data: {
                                source: productData.source || "", // Fix for error #1 - providing default value
                                weightPerUnit: productData.weightPerUnit,
                                product: { connect: { id: newProduct.id } },
                            },
                        });
                    }
                    else if (productData.category === client_1.Category.HEAVY_EQUIPMENT) {
                        yield tx.heavyEquipment.create({
                            data: {
                                equipmentType: productData.equipmentType,
                                product: { connect: { id: newProduct.id } },
                            },
                        });
                    }
                    else if (productData.category === client_1.Category.STEEL) {
                        yield tx.steel.create({
                            data: {
                                grade: productData.grade,
                                length: productData.length,
                                type: productData.type,
                                color: productData.color,
                                size: productData.size,
                                additionalAttributes: productData.additionalAttributes,
                                product: { connect: { id: newProduct.id } },
                            },
                        });
                    }
                    return newProduct;
                }));
                return res.status(201).json({
                    message: "Product created successfully",
                    productId: result.id,
                });
            }
            catch (error) {
                console.error("Error creating product:", error);
                return res.status(500).json({ error: "Failed to create product" });
            }
        });
    }
    // Update an existing product
    updateProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const productData = req.body;
                // Check if product exists
                const existingProduct = yield prisma_1.prisma.product.findUnique({
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
                yield prisma_1.prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
                    yield tx.product.update({
                        where: { id },
                        data: {
                            name: (_a = productData.name) !== null && _a !== void 0 ? _a : existingProduct.name,
                            description: (_b = productData.description) !== null && _b !== void 0 ? _b : existingProduct.description,
                            basePrice: (_c = productData.basePrice) !== null && _c !== void 0 ? _c : existingProduct.basePrice,
                            pricingUnit: (_d = productData.pricingUnit) !== null && _d !== void 0 ? _d : existingProduct.pricingUnit,
                            pricingDetails: productData.pricingDetails
                                ? productData.pricingDetails
                                : existingProduct.pricingDetails,
                            unit: (_e = productData.unit) !== null && _e !== void 0 ? _e : existingProduct.unit,
                            pickUpPrice: (_f = productData.pickUpPrice) !== null && _f !== void 0 ? _f : existingProduct.pickUpPrice,
                            deliveryPrice: (_g = productData.deliveryPrice) !== null && _g !== void 0 ? _g : existingProduct.deliveryPrice,
                        },
                    });
                    if (existingProduct.category === client_1.Category.AGGREGATE &&
                        existingProduct.aggregate) {
                        yield tx.aggregate.update({
                            where: { productId: id },
                            data: {
                                source: (_h = productData.source) !== null && _h !== void 0 ? _h : existingProduct.aggregate.source,
                                weightPerUnit: (_j = productData.weightPerUnit) !== null && _j !== void 0 ? _j : existingProduct.aggregate.weightPerUnit,
                            },
                        });
                    }
                    else if (existingProduct.category === client_1.Category.HEAVY_EQUIPMENT &&
                        existingProduct.heavyEquipment) {
                        yield tx.heavyEquipment.update({
                            where: { productId: id },
                            data: {
                                equipmentType: (_k = productData.equipmentType) !== null && _k !== void 0 ? _k : existingProduct.heavyEquipment.equipmentType,
                            },
                        });
                    }
                    else if (existingProduct.category === client_1.Category.STEEL &&
                        existingProduct.steel) {
                        yield tx.steel.update({
                            where: { productId: id },
                            data: {
                                grade: (_l = productData.grade) !== null && _l !== void 0 ? _l : existingProduct.steel.grade,
                                length: (_m = productData.length) !== null && _m !== void 0 ? _m : existingProduct.steel.length,
                                type: (_o = productData.type) !== null && _o !== void 0 ? _o : existingProduct.steel.type,
                                color: (_p = productData.color) !== null && _p !== void 0 ? _p : existingProduct.steel.color,
                                size: (_q = productData.size) !== null && _q !== void 0 ? _q : existingProduct.steel.size,
                                additionalAttributes: productData.additionalAttributes
                                    ? productData.additionalAttributes
                                    : existingProduct.steel
                                        .additionalAttributes,
                            },
                        });
                    }
                }));
                return res.status(200).json({
                    message: "Product updated successfully",
                });
            }
            catch (error) {
                console.error("Error updating product:", error);
                return res.status(500).json({ error: "Failed to update product" });
            }
        });
    }
    // Delete a product
    deleteProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                // Check if product exists
                const existingProduct = yield prisma_1.prisma.product.findUnique({
                    where: { id },
                });
                if (!existingProduct) {
                    return res.status(404).json({ error: "Product not found" });
                }
                // Delete the product (cascade will handle related records)
                yield prisma_1.prisma.product.delete({
                    where: { id },
                });
                return res.status(200).json({
                    message: "Product deleted successfully",
                });
            }
            catch (error) {
                console.error("Error deleting product:", error);
                return res.status(500).json({ error: "Failed to delete product" });
            }
        });
    }
    // Get products filtered by category
    getProductsByCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { category } = req.params;
                const validCategories = [
                    client_1.Category.AGGREGATE,
                    client_1.Category.HEAVY_EQUIPMENT,
                    client_1.Category.STEEL,
                ];
                if (!validCategories.includes(category)) {
                    return res.status(400).json({ error: "Invalid category" });
                }
                const products = yield prisma_1.prisma.product.findMany({
                    where: { category: category },
                    include: {
                        aggregate: category === client_1.Category.AGGREGATE,
                        heavyEquipment: category === client_1.Category.HEAVY_EQUIPMENT,
                        steel: category === client_1.Category.STEEL,
                    },
                });
                // Transform the data for the frontend
                const transformedProducts = products.map((product) => {
                    let extendedData = {};
                    if (product.category === client_1.Category.AGGREGATE && product.aggregate) {
                        extendedData = {
                            source: product.aggregate.source,
                            weightPerUnit: product.aggregate.weightPerUnit,
                        };
                    }
                    else if (product.category === client_1.Category.HEAVY_EQUIPMENT &&
                        product.heavyEquipment) {
                        extendedData = {
                            equipmentType: product.heavyEquipment.equipmentType,
                        };
                    }
                    else if (product.category === client_1.Category.STEEL && product.steel) {
                        extendedData = {
                            grade: product.steel.grade,
                            length: product.steel.length,
                            type: product.steel.type,
                            color: product.steel.color,
                            size: product.steel.size,
                            additionalAttributes: product.steel.additionalAttributes,
                        };
                    }
                    return Object.assign({ id: product.id, category: product.category, name: product.name, description: product.description, basePrice: product.basePrice, pricingUnit: product.pricingUnit, pricingDetails: product.pricingDetails, unit: product.unit, pickUpPrice: product.pickUpPrice, deliveryPrice: product.deliveryPrice, createdAt: product.createdAt, updatedAt: product.updatedAt }, extendedData);
                });
                return res.status(200).json(transformedProducts);
            }
            catch (error) {
                console.error("Error fetching products by category:", error);
                return res.status(500).json({ error: "Failed to fetch products" });
            }
        });
    }
    // Search products
    searchProducts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { query } = req.query;
                if (!query || typeof query !== "string") {
                    return res.status(400).json({ error: "Search query is required" });
                }
                const products = yield prisma_1.prisma.product.findMany({
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
                    if (product.category === client_1.Category.AGGREGATE && product.aggregate) {
                        extendedData = {
                            source: product.aggregate.source,
                            weightPerUnit: product.aggregate.weightPerUnit,
                        };
                    }
                    else if (product.category === client_1.Category.HEAVY_EQUIPMENT &&
                        product.heavyEquipment) {
                        extendedData = {
                            equipmentType: product.heavyEquipment.equipmentType,
                        };
                    }
                    else if (product.category === client_1.Category.STEEL && product.steel) {
                        extendedData = {
                            grade: product.steel.grade,
                            length: product.steel.length,
                            type: product.steel.type,
                            color: product.steel.color,
                            size: product.steel.size,
                            additionalAttributes: product.steel.additionalAttributes,
                        };
                    }
                    return Object.assign({ id: product.id, category: product.category, name: product.name, description: product.description, basePrice: product.basePrice, pricingUnit: product.pricingUnit, pricingDetails: product.pricingDetails, unit: product.unit, pickUpPrice: product.pickUpPrice, deliveryPrice: product.deliveryPrice, createdAt: product.createdAt, updatedAt: product.updatedAt }, extendedData);
                });
                return res.status(200).json(transformedProducts);
            }
            catch (error) {
                console.error("Error searching products:", error);
                return res.status(500).json({ error: "Failed to search products" });
            }
        });
    }
}
exports.ProductController = ProductController;
