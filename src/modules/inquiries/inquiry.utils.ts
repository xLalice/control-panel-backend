import { Inquiry, InquiryStatus } from "@prisma/client";

/**
 * Calculates the time an inquiry has been in its current status
 * @param inquiry The inquiry object
 * @returns Time in current status in milliseconds
 */
export function getTimeInStatus(inquiry: Inquiry): number {
  const now = new Date();
  return now.getTime() - inquiry.updatedAt.getTime();
}

/**
 * Determines if an inquiry needs attention based on status and time in that status
 * @param inquiry The inquiry object
 * @returns Boolean indicating if the inquiry needs attention
 */
export function needsAttention(inquiry: Inquiry): boolean {
  const timeInStatus = getTimeInStatus(inquiry);
  const oneDayInMs = 24 * 60 * 60 * 1000;

  if (inquiry.status === InquiryStatus.New && timeInStatus > oneDayInMs) {
    return true;
  }

  if (
    inquiry.status === InquiryStatus.QuotationGenerated &&
    timeInStatus > 3 * oneDayInMs
  ) {
    return true;
  }

  return false;
}

/**
 * Calculates conversion rates for inquiries
 * @param inquiries Array of inquiry objects
 * @returns Object with conversion rate statistics
 */
export function calculateConversionRates(
  inquiries: Inquiry[]
): Record<string, number> {
  const total = inquiries.length;
  if (total === 0) return { overall: 0 };

  const converted = inquiries.filter(
    (i) => i.status === InquiryStatus.Closed
  ).length;
  const bySource: Record<string, { total: number; converted: number }> = {};

  inquiries.forEach((inquiry) => {
    const source = inquiry.referenceSource;
    if (!bySource[source]) {
      bySource[source] = { total: 0, converted: 0 };
    }

    bySource[source].total++;
    if (inquiry.status === InquiryStatus.Closed) {
      bySource[source].converted++;
    }
  });

  const rates: Record<string, number> = {
    overall: (converted / total) * 100,
  };

  Object.entries(bySource).forEach(([source, data]) => {
    rates[source] = (data.converted / data.total) * 100;
  });

  return rates;
}
