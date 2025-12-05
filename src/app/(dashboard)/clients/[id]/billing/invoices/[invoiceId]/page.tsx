




import ClientInvoiceDetail from "@/components/ClientInvoiceDetail";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/services/auth/session";

interface InvoiceDetailPageProps { params: Promise<{ id: string; invoiceId: string }> }

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id, invoiceId } = await params;
  const { orgId, role } = await getSessionProfile();
  if (!orgId || !role) return null;
  if (!can(role, "read", "finance")) return null;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true, client: true } });
  if (!invoice || invoice.orgId !== orgId || invoice.clientId !== id) return null;

  // Convert Decimal to number for type compatibility
  const normalizedInvoice = {
    ...invoice,
    total: Number(invoice.total),
    subtotal: Number(invoice.subtotal),
    discount: Number(invoice.discount),
    tax: Number(invoice.tax),
    items: invoice.items.map(item => ({
      ...item,
      unitAmount: Number(item.unitAmount),
      total: Number(item.total),
    })),
  };

  return <ClientInvoiceDetail invoice={normalizedInvoice} role={role} />;
}
