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

router.get("/", checkPermission("read:quotations"), isAuthenticated);

router.post(
    "/", 
    isAuthenticated, 
    checkPermission("create:quotation"), 
    quotationController.createQuotation
);

router.get(
    "/:id/pdf", 
    isAuthenticated, 
    checkPermission("read:quotations"), 
    quotationController.getQuotationPdf
);

