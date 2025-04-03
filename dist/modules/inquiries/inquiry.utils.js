"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeInStatus = getTimeInStatus;
exports.needsAttention = needsAttention;
exports.formatForExport = formatForExport;
exports.calculateConversionRates = calculateConversionRates;
const client_1 = require("@prisma/client");
/**
 * Calculates the time an inquiry has been in its current status
 * @param inquiry The inquiry object
 * @returns Time in current status in milliseconds
 */
function getTimeInStatus(inquiry) {
    const now = new Date();
    return now.getTime() - inquiry.updatedAt.getTime();
}
/**
 * Determines if an inquiry needs attention based on status and time in that status
 * @param inquiry The inquiry object
 * @returns Boolean indicating if the inquiry needs attention
 */
function needsAttention(inquiry) {
    const timeInStatus = getTimeInStatus(inquiry);
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    // Rules for different statuses
    if (inquiry.status === client_1.InquiryStatus.New && timeInStatus > oneDayInMs) {
        return true;
    }
    if (inquiry.status === client_1.InquiryStatus.Quoted && timeInStatus > 3 * oneDayInMs) {
        return true;
    }
    return false;
}
/**
 * Formats the inquiry data for export (e.g., CSV, Excel)
 * @param inquiries Array of inquiry objects to format
 * @returns Formatted data for export
 */
function formatForExport(inquiries) {
    return inquiries.map(inquiry => ({
        'Customer Name': inquiry.customerName,
        'Email': inquiry.email,
        'Phone': inquiry.phoneNumber,
        'Product Type': inquiry.productType,
        'Quantity': inquiry.quantity,
        'Preferred Date': inquiry.preferredDate.toLocaleDateString(),
        'Status': inquiry.status,
        'Source': inquiry.referenceSource,
        'Created At': inquiry.createdAt.toLocaleDateString(),
        'Company': inquiry.isCompany ? inquiry.companyName : 'N/A'
    }));
}
/**
 * Calculates conversion rates for inquiries
 * @param inquiries Array of inquiry objects
 * @returns Object with conversion rate statistics
 */
function calculateConversionRates(inquiries) {
    const total = inquiries.length;
    if (total === 0)
        return { overall: 0 };
    const converted = inquiries.filter(i => i.status === client_1.InquiryStatus.Fulfilled).length;
    const bySource = {};
    // Calculate by source
    inquiries.forEach(inquiry => {
        const source = inquiry.referenceSource;
        if (!bySource[source]) {
            bySource[source] = { total: 0, converted: 0 };
        }
        bySource[source].total++;
        if (inquiry.status === client_1.InquiryStatus.Fulfilled) {
            bySource[source].converted++;
        }
    });
    // Calculate rates
    const rates = {
        overall: (converted / total) * 100
    };
    Object.entries(bySource).forEach(([source, data]) => {
        rates[source] = (data.converted / data.total) * 100;
    });
    return rates;
}
