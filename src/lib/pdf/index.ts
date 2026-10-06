import type { Branding, Estimate } from '../models';

/** Loaded on demand so jsPDF stays out of the main bundle. */
export async function downloadCustomerPdf(e: Estimate, b: Branding) {
  const m = await import('./customerPdf');
  m.buildCustomerPdf(e, b).save(m.customerPdfFilename(e));
}

export async function downloadCostSheetPdf(e: Estimate, b: Branding) {
  const m = await import('./costSheetPdf');
  m.buildCostSheetPdf(e, b).save(m.costSheetFilename(e));
}
