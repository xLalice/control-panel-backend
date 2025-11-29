import express from 'express';
import { isAuthenticated } from 'middlewares/isAuthenticated';
import { checkPermission } from 'middlewares/authorization';
import { QuotationService } from './quotation.service';
import { prisma } from 'config/prisma';
import QuotationController from './quotation.controllers';
import { EmailService } from 'modules/email/email.service';
import { StorageService } from 'modules/storage/storage.service';


const router = express.Router();
const storageService = new StorageService();
const emailService = new EmailService();
const quotationService = new QuotationService(prisma, storageService, emailService);
const quotationController = new QuotationController(quotationService);

router.post(
    "/", 
    isAuthenticated,
    quotationController.create 
);

router.get("/",
    isAuthenticated,
    checkPermission("read:quotations"),
    quotationController.fetch
)

router.get("/:id",
    isAuthenticated,
    checkPermission("read:quotations"),
    quotationController.fetchById
)

router.get(
    "/:id/pdf", 
    isAuthenticated, 
    checkPermission("read:quotations"), 
    quotationController.getPdf
);

router.post(
    "/:id/send",
    isAuthenticated,
    checkPermission("create:quotation"), 
    quotationController.sendToCustomer
);

router.delete(
    "/:id",
    isAuthenticated,
    checkPermission("delete:quotations"),
    quotationController.delete
);

router.patch( 
    "/:id",
    isAuthenticated,
    checkPermission("update:quotations"),
    quotationController.update
);

export default router;
