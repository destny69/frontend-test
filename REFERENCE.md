# PharmaCo ERP — Complete Reference

Full detail: every module, every screen, and every data field with what it means.
For the quick tour see `WALKTHROUGH.md`; for requirement coverage see `FLOW.md`.

- **Live:** https://pharmamntr.vercel.app · **Repo:** https://github.com/saliltimalsina/Pharma

**Conventions**
- In-memory app (no backend). Data seeds on load; new records persist as you click; a refresh resets.
- IDs shown as `REQ-001`; document numbers as `REQ-2026-0142`.
- "Derived" = calculated from other records, never stored/typed.

---

# 1 · Procurement

**Screens**

| Screen | Route | What it does |
|---|---|---|
| Dashboard | `/procurement` | KPIs (pending requisitions, POs, GRNs) + quick actions + recent activity |
| Material Requisition (list / new / detail) | `/procurement/requisitions` | Raise & approve internal item requests |
| Vendors (list / new / profile) | `/procurement/vendors` | Supplier directory, documents, derived performance |
| RFQs (list / new / detail) | `/procurement/rfqs` | Request & compare vendor quotes, award |
| Purchase Orders (list / new / detail) | `/procurement/purchase-orders` | Create, approve, amend, send, track receipt |
| Goods Receipt / GRN (list / new / detail) | `/procurement/grn` | Record & inspect received goods |
| Procurement Reports | `/procurement/reports` | Pending, vendor performance, cost analysis, audit log |

## Requisition
| Field | Type | Meaning |
|---|---|---|
| id | string | Internal id (`REQ-001`) |
| requestNo | string | Human number (`REQ-2026-0142`) |
| department | string | Requesting department |
| requestedBy | string | Person raising it |
| requestDate | date | When raised |
| requiredDate | date | When items are needed |
| priority | Low·Medium·High·Urgent | Urgency |
| purpose | string | Why it's needed |
| notes | string? | Extra notes; also holds rejection reason |
| status | see below | Workflow state |
| approvedBy | string? | Approver (set on approve/reject) |
| items | RequisitionItem[] | Lines requested |

**RequisitionItem:** `item` (name), `description`, `requiredQty`, `unit`, `currentStock` (on-hand at request time), `requiredDate`, `remarks?`.
**RequisitionStatus:** Draft · Submitted · Pending Approval · Approved · Rejected · Cancelled · Completed.

## Vendor
| Field | Type | Meaning |
|---|---|---|
| id / vendorCode | string | Internal id / supplier code (`VEN-1001`) |
| name | string | Company name |
| category | VendorCategory | API Supplier · Excipients · Packaging · Lab Equipment · Logistics · MRO |
| phone / email / website | string | Contact |
| address / country | string | Location |
| status | Active · On Hold · Blacklisted · Pending Approval | Standing |
| registrationNumber / vatNumber | string | Legal/tax registration |
| businessType | string | e.g. Manufacturer, Distributor |
| establishedDate | date | Founded |
| primaryContact | string | Main contact person |
| paymentTerms | string | e.g. "Net 30" |
| currency | string | Trading currency |
| bankAccount | string | Payout account |
| creditLimit | number | Approved credit |
| outstandingBalance | number | What you currently owe them |
| documents | VendorDoc[] | Compliance docs |

**VendorDoc:** `name`, `status` (Valid·Expiring·Expired·Missing), `expiry?`.
**Performance & rating** are **derived** (not stored) from real POs + GRNs: total orders, total purchase, on-time %, avg lead days, rejected %, and a 0–5 composite rating. No receipts yet → "Not yet rated".

## RFQ
| Field | Type | Meaning |
|---|---|---|
| id / rfqNo | string | Ids |
| title | string | What's being sourced |
| category | VendorCategory | Purchase category |
| createdDate / closingDate | date | Opened / quote deadline |
| currency | string | Quote currency |
| status | RfqStatus | Draft · Sent · Receiving Quotes · Closed · Awarded · Cancelled |
| invitedVendors | string[] | Vendor ids invited |
| items | RequisitionItem[] | Items to quote |
| quotes | RfqQuote[] | Received quotes |
| awardedVendor | string? | Winning vendor id |

**RfqQuote:** `vendorId`, `vendorName`, `price`, `deliveryDays`, `qualityRating`, `paymentTerms`, `score` (auto min-max score), `submitted`.

## Purchase Order
| Field | Type | Meaning |
|---|---|---|
| id / poNumber | string | Ids (`PO-2026-0512`) |
| vendorId / vendorName | string | Supplier |
| date / expectedDelivery | date | Ordered / promised |
| currency | string | Currency |
| warehouse | string | Receiving warehouse |
| department | string | Owning department |
| amount | number | Order total (qty·price − discount + VAT) |
| status | PoStatus | Draft · Pending Approval · Approved · Sent · Partially Received · Completed · Cancelled |
| createdBy | string | Creator/approver |
| items | PoItem[] | Order lines |
| amendments | PoAmendment[]? | Change history |

**PoItem:** `product`, `description`, `qty`, `unit`, `unitPrice`, `discount`, `vat`, `receivedQty?` (filled by GRNs).
**PoAmendment:** `date`, `note`, `changedBy`.

## GRN (Goods Receipt Note)
| Field | Type | Meaning |
|---|---|---|
| id / grnNumber | string | Ids (`GRN-2026-0311`) |
| poNumber | string | Source PO |
| vendorName | string | Supplier |
| warehouse | string | Where received |
| receivedDate | date | Arrival date (drives on-time vs PO) |
| receivedBy | string | Receiver |
| deliveryNote | string | Supplier's delivery-note ref |
| status | GrnStatus | Pending · Inspection · Accepted · Rejected · Completed |
| items | GrnItem[] | Received lines |
| inspection | GrnInspectionResult[]? | Per-check pass/fail |

**GrnItem:** `product`, `orderedQty`, `receivedQty`, `acceptedQty`, `rejectedQty`, `batchNumber`, `expiryDate`.
**GrnInspectionResult:** `check` (e.g. Packaging, Temperature), `result` (pass/fail).
On **Complete Receipt**: accepted qty → PO `receivedQty` + status, and cascades into Inventory as batches.

## ProcurementEvent (audit log)
`id`, `date`, `type` (Created·Submitted·Approved·Rejected·Completed·Amended·Awarded·Sent·Received·Quote Submitted·Document Added/Removed), `entity` (Requisition·RFQ·Purchase Order·GRN·Vendor), `ref`, `by`.

---

# 2 · Inventory

**Screens**

| Screen | Route | What it does |
|---|---|---|
| Dashboard | `/inventory` | Stock value, low-stock/expiry counts, by-type breakdown, shortcuts |
| Item Master (list / new / detail) | `/inventory/items` | Product catalog; barcode; FEFO/FIFO; stock levels |
| Warehouses (list / profile) | `/inventory/warehouses` | Storage locations |
| Stock (list / Stock-In / Stock-Out / detail) | `/inventory/stock` | On-hand by item; receive & issue |
| Batch Management (list / new / detail) | `/inventory/batches` | Lots with expiry; recall/dispose; bin |
| Transfers (list / new / detail) | `/inventory/transfers` | Move stock between warehouses |
| Stock Adjustment (list / new / detail) | `/inventory/adjustments` | Reconcile counts |
| Expiry Monitoring | `/inventory/expiry` | Expiring buckets; recall/dispose |
| Stock Ledger | `/inventory/ledger` | Every movement, filterable |
| Stock Monitoring | `/inventory/alerts` | Low / safety / overstock alerts |
| Inventory Reports | `/inventory/reports` | Stock, movement, batch, expiry |

## Item
| Field | Type | Meaning |
|---|---|---|
| id / sku | string | Ids (`ITM-001`, SKU) |
| name | string | Product name |
| category / brand / manufacturer | string | Classification |
| description | string | Details |
| uom | string | Unit of measure (kg, box…) |
| reorderLevel | number | Reorder trigger |
| safetyStock | number | Minimum buffer |
| maximumStock | number | Overstock ceiling |
| storageCondition | string | e.g. "2–8 °C" |
| batchTracking / expiryTracking | boolean | Whether lots/expiry are tracked |
| shelfLifeMonths | number | Shelf life |
| costingMethod | FEFO · FIFO | Picking order for issues |
| stockType | Raw Material · Packaging · Work-in-Progress · Finished Goods | Material class |
| barcode | string | Barcode value (rendered + printable) |
| preferredSupplier | string | Default vendor |
| purchasePrice | number | Buy price |
| averageCost | number | Weighted cost — drives valuation |
| currency | string | Currency |
| status | Active · Inactive | Active flag |

*On-hand quantity is not stored on the item — it's the sum of its batches.*

## Warehouse
`id`, `code`, `name`, `location`, `address`, `manager`, `phone`, `email`, `description`, `totalCapacity`, `occupied`, `temperatureControlled`, `coldStorage`, `hazardStorage`, `zones` (string[]).

## Batch (the source of truth for stock quantity)
| Field | Type | Meaning |
|---|---|---|
| id / batchNumber | string | Ids (`LM-26061`) |
| itemId | string | Product it belongs to |
| supplierName / poNumber / grnNumber | string | Origin references |
| warehouseId / bin | string | Location |
| manufacturingDate / expiryDate | date | Lot dates |
| shelfLifeMonths | number | Shelf life |
| countryOfOrigin | string | Origin |
| qcStatus | BatchStatus | Available · Quarantined · Under Inspection · Released · Expired · Recalled |
| inspectionResult | string | Pass/Pending etc. |
| approvedBy / releasedDate | string / date | QC release |
| receivedQty | number | Total received |
| availableQty | number | Free to use |
| reservedQty | number | Held/allocated |
| damagedQty | number | Written off |
| returnedQty | number | Returned to supplier |

## StockEntry (derived view of batches, per bin)
`id`, `itemId`, `batchNumber`, `warehouseId`, `bin`, `availableQty`, `reservedQty`, `damagedQty`, `pendingInspectionQty`, `expiryDate`, `supplierName`, `poNumber`, `grnNumber`. *Auto-computed from batches — mirrors their quantities.*

## Transfer
`id`, `transferNumber`, `fromWarehouseId`, `toWarehouseId`, `reason`, `requestedBy`, `approver?`, `transferDate`, `status` (TransferStatus: Draft · Pending Approval · Approved · In Transit · Completed · Cancelled), `items`.
**TransferItem:** `itemId`, `batchNumber`, `currentBin`, `quantity`, `destinationBin`. *Completing moves quantity between warehouses.*

## Adjustment
`id`, `adjustmentNo`, `warehouseId`, `type` (Increase/Decrease), `reason` (Damage·Loss·Theft·Counting Error·Expired Items·Quality Rejection), `reference`, `notes`, `date`, `createdBy`, `status` (Pending Approval·Approved·Rejected), `approver`, `items`.
**AdjustmentItem:** `itemId`, `batchNumber`, `currentQty` (system), `actualQty` (counted). *Approving applies the difference to the batch.*

## StockMovement (the ledger — one row per quantity change)
`id`, `date`, `type` (In·Out·Transfer·Adjustment·Reserve·Return·Write-off), `itemId`, `batchNumber`, `warehouseId`, `qty` (signed: + in / − out), `reference`, `by`.

---

# 3 · Billing & Finance

**Screens**

| Screen | Route | What it does |
|---|---|---|
| Dashboard | `/finance` | Receivables, payables, cash & bank, shortcuts |
| Customer Invoices (list / new / detail) | `/finance/invoices` | Bill customers |
| Credit Notes (list / new) | `/finance/credit-notes` | Reduce an invoice |
| Supplier Bills (list / new / detail) | `/finance/bills` | Amounts owed to vendors |
| Debit Notes (list / new) | `/finance/debit-notes` | Adjust a bill |
| Payments (list / new / detail / voucher) | `/finance/payments` | Money in / out; printable vouchers |
| Advances | `/finance/advances` | Prepayments; apply later |
| Accounting (hub / journal new) | `/finance/accounting` | Chart of accounts, journal, GL, AR/AP |
| Banking | `/finance/banking` | Accounts, transactions, reconciliation |
| Cash Book | `/finance/cash-book` | Cash in/out running balance |
| Taxes | `/finance/taxes` | VAT summary + report |
| Financial Reports | `/finance/reports` | Trial Balance, P&L, Balance Sheet, Cash Flow, outstanding |
| Analytics | `/finance/analytics` | Revenue / expense / cost-center |
| Audit Report | `/finance/audit` | Log of every finance action |

## Customer
`id`, `name`, `type` (e.g. Hospital, Pharmacy), `email`, `phone`, `billingAddress`, `shippingAddress`, `paymentTerms`.

## Invoice
| Field | Type | Meaning |
|---|---|---|
| id / invoiceNo | string | Ids (`INV-2026-1043`) |
| customerId | string | Customer |
| invoiceDate / dueDate | date | Issued / due |
| salesperson | string | Owner |
| referenceNumber | string | External ref |
| paymentMethod | PaymentMethod | Expected method |
| status | InvoiceStatus | Draft · Proforma · Sent · Partially Paid · Paid · Overdue · Cancelled |
| amount | number | Invoice total |
| paid | number | Paid so far |
| credited | number? | Neutralised by credit notes / applied advances |
| lines | InvoiceLine[] | Products billed |

**InvoiceLine:** `product`, `batchNumber`, `quantity`, `unitPrice`, `discount`, `vat`.
*Outstanding = amount − paid − credited. Proforma is excluded from receivables until converted.*

## SupplierBill
| Field | Type | Meaning |
|---|---|---|
| id / billNo | string | Ids |
| vendorId / vendorName | string | Supplier |
| poNumber / grnNumber | string | Source PO/GRN |
| invoiceDate / dueDate | date | Dates |
| status | BillStatus | Draft · Pending Verification · Approved · Partially Paid · Paid · Cancelled |
| amount / paid | number | Total / paid |
| poMatch / grnMatch / invoiceMatch | boolean | 3-way match indicators |
| difference | number | Match variance |
| credited | number? | Neutralised by debit notes / applied advances |
| lines | BillLine[] | Lines |

**BillLine:** `product`, `batchNumber`, `quantity`, `unitCost`, `vat`.

## Payment
`id`, `paymentNo`, `date`, `type` (PaymentType: Customer Payment · Supplier Payment · Advance Payment · Refund · Adjustment), `partyName`, `invoiceOrBillRef`, `method` (PaymentMethod: Cash · Bank Transfer · Cheque · Credit Card · Online Payment · Mobile Wallet), `outstandingBalance`, `amount`, `remainingBalance`, `bank`, `referenceNumber`, `transactionId`, `notes`, `status` (Completed·Pending·Failed).
*A payment updates the invoice/bill paid+status and creates a bank transaction.*

## Account (Chart of Accounts)
`code` (e.g. 1010), `name`, `type` (Asset·Liability·Equity·Revenue·Expense), `balance`, `status`. *Journal entries move these balances; statements derive from them.*

## JournalEntry
`id`, `journalNo`, `date`, `reference`, `description`, `debitAccount` (name), `creditAccount` (name), `amount`, `costCenter?`, `status` (Draft·Posted). *Posting applies double-entry to the two accounts.*

## BankAccount
`id`, `bankName`, `accountNumber`, `currency`, `balance`, `status`.

## BankTransaction
`id`, `bankAccountId`, `transactionId`, `date`, `description`, `debit`, `credit`, `balance` (running), `reconciled` (toggle in Reconciliation).

## CreditNote
`id`, `creditNoteNo`, `date`, `customerId`, `invoiceNo`, `reason`, `amount`, `status` (Issued). *Reduces the invoice's outstanding + posts AR↓/Revenue↓.*

## DebitNote
`id`, `debitNoteNo`, `date`, `vendorId`, `vendorName`, `billNo`, `reason`, `amount`, `status` (Issued). *Reduces the bill's outstanding + posts AP↓/COGS↓.*

## Advance
`id`, `advanceNo`, `date`, `direction` (Customer/Supplier), `partyName`, `method`, `bank`, `amount`, `allocated` (applied so far), `notes`. Remaining = amount − allocated.
**AdvanceApplication:** `id`, `advanceId`, `advanceNo`, `date`, `targetRef` (invoice/bill), `amount`.

## FinanceEvent (audit log)
`id`, `date`, `type` (Created·Approved·Paid·Posted·Credited·Debited·Advance·Applied·Reconciled·Converted…), `entity`, `ref`, `by`.

---

## Shared conventions

- **Statuses** drive which buttons appear (e.g. "Approve" only when Pending; "Receive Goods" only when a PO is Sent/Partially Received).
- **Document numbers** auto-increment from the seed data per type.
- **Money** is single-currency in display; each record still stores its `currency`.
- **History** (stock ledger, audit logs, bank transactions) grows as you act and is the basis for every report — reset on refresh, since there's no backend.
