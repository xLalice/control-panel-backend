import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuotationService } from './quotation.service';
import { mockDeep, DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

vi.mock('puppeteer', () => ({
    default: {
      launch: () => ({
        newPage: () => ({
          setContent: vi.fn(),
          pdf: vi.fn().mockResolvedValue(Buffer.from('fake-pdf')),
        }),
        close: vi.fn(),
      }),
    },
}));

vi.mock('fs/promises', () => ({
    readFile: vi.fn().mockResolvedValue("<html>{{customer.customerName}}</html>"),
}));

describe("Quotation Service", () => {
    let prismaMock: DeepMockProxy<PrismaClient>;
    let service: QuotationService;

    beforeEach(() => {
        prismaMock = mockDeep<PrismaClient>();
        service = new QuotationService(prismaMock);
        
        prismaMock.sequence.upsert.mockResolvedValue({
            name: 'QUOTATION',
            current: 1
        } as any);
    });

    it('should generate a sequential ID and create quotation with PDF', async () => {
        const inputData: any = { 
            leadId: 'lead-123', 
            items: [{ productId: 'p1', quantity: 1, unitPrice: 100 }] 
        };

        prismaMock.quotation.create.mockResolvedValue({
            id: 'quote-1',
            quotationNumber: 'QTN-2025-0001', 
            leadId: 'lead-123',
            lead: { name: 'John Doe', email: 'john@example.com' },
            client: null,
            items: [],
            issueDate: new Date(),
            validUntil: new Date(),
        } as any);

        const result = await service.createQuotation(inputData);

        expect(prismaMock.sequence.upsert).toHaveBeenCalled();
        
        expect(prismaMock.quotation.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                quotationNumber: expect.stringMatching(/QTN-\d{4}-0001/) 
            })
        }));

        expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should use Client data for PDF when Client is present', async () => {
        const quoteWithClient = {
            id: 'quote-2',
            clientId: 'client-123',
            client: { clientName: 'Big Corp', billingAddressStreet: 'Wall St' },
            lead: null,
            items: [],
            issueDate: new Date(),
            validUntil: new Date(),
        };

        prismaMock.quotation.findUnique.mockResolvedValue(quoteWithClient as any);

        const result = await service.getQuotationPdfById('quote-2');

        expect(result).toBeDefined();
    });

    it('should throw error if Quotation has no Client AND no Lead', async () => {
        const orphanQuote = {
            id: 'quote-orphan',
            client: null,
            lead: null,   
            items: [],
            issueDate: new Date(),
            validUntil: new Date(),
        };

        prismaMock.quotation.findUnique.mockResolvedValue(orphanQuote as any);

        await expect(service.getQuotationPdfById('quote-orphan'))
            .rejects
            .toThrow("Quotation must be linked to a Client or Lead");
    });
});