export const getInvoiceBalance = (invoice) => (
  Math.max(0, Number(invoice?.total || 0) - Number(invoice?.paid || 0))
);

export const getUnpaidInvoices = (invoices = []) => (
  invoices.filter((invoice) => getInvoiceBalance(invoice) > 0)
);

export const getUnpaidInvoiceTotal = (invoices = []) => (
  getUnpaidInvoices(invoices).reduce((sum, invoice) => sum + getInvoiceBalance(invoice), 0)
);
