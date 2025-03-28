import { Router } from 'express';
import { ProductController } from './product.controller';
import { createRoleMiddleware } from '../../middlewares/rbac';

const router = Router();
const productController = new ProductController();

router.get("/", createRoleMiddleware("READ_PRODUCTS"), productController.getAllProducts);
router.get("/:id", createRoleMiddleware("READ_PRODUCTS"), productController.getProductById);
router.get("/category/:category", createRoleMiddleware("READ_PRODUCTS"), productController.getProductsByCategory);
router.get("/search", createRoleMiddleware("READ_PRODUCTS"), productController.searchProducts);

router.post("/", createRoleMiddleware("WRITE_PRODUCTS"), productController.createProduct);
router.put("/:id", createRoleMiddleware("UPDATE_PRODUCTS"), productController.updateProduct);
router.delete("/:id", createRoleMiddleware("DELETE_PRODUCTS"), productController.deleteProduct);

export default router;