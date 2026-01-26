import { Router } from 'express';
import { ProductController } from './product.controller';
import { checkPermission } from '../../middlewares/authorization';

const router = Router();
const productController = new ProductController();

router.get("/", checkPermission("read:products"), productController.getAllProducts);
router.get("/:id", checkPermission("read:products"), productController.getProductById);
router.get("/category/:category", checkPermission("read:products"), productController.getProductsByCategory);
router.get("/search", checkPermission("read:products"), productController.searchProducts);

router.post("/", checkPermission("manage:products"), productController.createProduct);
router.put("/:id", checkPermission("manage:products"), productController.updateProduct);
router.delete("/:id", checkPermission("manage:products"), productController.deleteProduct);

router.post("/:id/stock/adjust", productController.adjustStock);

export default router;