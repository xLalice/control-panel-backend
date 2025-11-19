import express from 'express';
import { isAuthenticated } from 'middlewares/isAuthenticated';
import { checkPermission } from 'middlewares/authorization';
import { QuotationService } from './quotation.service';
import { prisma } from 'config/prisma';
import QuotationController from './quotation.controllers';


const router = express.Router();
const quotationService = new QuotationService(prisma);
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

