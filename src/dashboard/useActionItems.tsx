import * as React from 'react';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useProcurement } from '../procurement/store/ProcurementStore';
import { useInventory } from '../inventory/store/InventoryStore';
import { useFinance } from '../finance/store/FinanceStore';
import { daysUntil } from '../inventory/components/expiryUtils';

export interface ActionItem {
  module: 'Procurement' | 'Inventory' | 'Finance';
  moduleColor: string;
  icon: React.ReactElement;
  label: string;
  count: number;
  helper: string;
  path: string;
}

// Single source of truth for "what needs attention right now" - consumed by both
// the Action Center page and the notification bell, so the two never drift apart.
export function useActionItems() {
  const { requisitions, purchaseOrders, grns } = useProcurement();
  const { batches, items: inventoryItems } = useInventory();
  const { invoices, supplierBills } = useFinance();

  const pendingRequisitions = requisitions.filter((r) => ['Submitted', 'Pending Approval'].includes(r.status)).length;
  const posPendingApproval = purchaseOrders.filter((p) => p.status === 'Pending Approval').length;
  const grnsPending = grns.filter((g) => ['Pending', 'Inspection'].includes(g.status)).length;
  const pendingRelease = batches.filter((b) => b.qcStatus === 'Under Inspection').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue').length;
  const billsDue = supplierBills.filter((b) => ['Pending Verification', 'Approved', 'Partially Paid'].includes(b.status)).length;
  // Same "expiring within 30 days" window as ExpiryMonitoring's KPI tile: 0 <= days <= 30.
  const expiringBatches = batches.filter((b) => {
    const d = daysUntil(b.expiryDate);
    return d >= 0 && d <= 30;
  }).length;
  // Same "low stock" definition as StockAlerts: on hand > 0 but at/below reorder level.
  const belowReorderLevel = inventoryItems.filter((it) => {
    const onHand = batches.filter((b) => b.itemId === it.id).reduce((s, b) => s + b.availableQty, 0);
    return onHand > 0 && onHand <= it.reorderLevel;
  }).length;

  const items: ActionItem[] = [
    {
      module: 'Procurement', moduleColor: 'primary.main', icon: <AssignmentRoundedIcon />,
      label: 'Requisitions to approve', count: pendingRequisitions,
      helper: 'Material requests waiting on sign-off',
      path: '/procurement/requisitions',
    },
    {
      module: 'Procurement', moduleColor: 'primary.main', icon: <ShoppingCartRoundedIcon />,
      label: 'Purchase Orders to approve', count: posPendingApproval,
      helper: 'POs awaiting sign-off before they go to the vendor',
      path: '/procurement/purchase-orders',
    },
    {
      module: 'Procurement', moduleColor: 'primary.main', icon: <LocalShippingRoundedIcon />,
      label: 'Goods Receipts to process', count: grnsPending,
      helper: 'Deliveries logged but not yet completed',
      path: '/procurement/grn',
    },
    {
      module: 'Inventory', moduleColor: 'success.main', icon: <PendingActionsRoundedIcon />,
      label: 'Batches pending QC release', count: pendingRelease,
      helper: 'Received stock that isn’t usable yet',
      path: '/inventory/stock?level=Under Inspection',
    },
    {
      module: 'Inventory', moduleColor: 'success.main', icon: <EventBusyRoundedIcon />,
      label: 'Batches expiring within 30 days', count: expiringBatches,
      helper: 'Nearing expiry — plan clearance, transfer or rotation',
      path: '/inventory/expiry',
    },
    {
      module: 'Inventory', moduleColor: 'success.main', icon: <WarningAmberRoundedIcon />,
      label: 'Items below reorder level', count: belowReorderLevel,
      helper: 'On hand has dropped to or below the reorder threshold',
      path: '/inventory/alerts',
    },
    {
      module: 'Finance', moduleColor: 'warning.main', icon: <ReceiptLongRoundedIcon />,
      label: 'Overdue customer invoices', count: overdueInvoices,
      helper: 'Payments past due from customers',
      path: '/finance/invoices',
    },
    {
      module: 'Finance', moduleColor: 'warning.main', icon: <RequestQuoteRoundedIcon />,
      label: 'Supplier bills due', count: billsDue,
      helper: 'What you owe vendors, not yet paid off',
      path: '/finance/bills',
    },
  ];

  const openItems = items.filter((i) => i.count > 0);
  const totalOpen = openItems.reduce((s, i) => s + i.count, 0);

  return { items, openItems, totalOpen };
}
