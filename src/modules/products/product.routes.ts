import { Router } from 'express';
import { ProductController } from './product.controller';
import { middlewares } from '../../middlewares/rbac';

const router = Router();
const productController = new ProductController();

router.get("/", middlewares.productRead, productController.getAllProducts);
router.get("/:id", middlewares.productRead, productController.getProductById);
router.get("/category/:category", middlewares.productRead, productController.getProductsByCategory);
router.get("/search", middlewares.productRead, productController.searchProducts);

router.post("/", middlewares.productWrite, productController.createProduct);
router.put("/:id", middlewares.productUpdate, productController.updateProduct);
router.delete("/:id", middlewares.productDelete, productController.deleteProduct);

export default router;