import { Router } from "express";
import { ProductsController } from "../controllers/products.controller";

const router = Router()

const controller = new ProductsController();
router.get("/", controller.getAllProducts)
router.get("/resync", controller.resyncProducts)
router.get("/check-new", controller.checkNewProduct)

export default router;
