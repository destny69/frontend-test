# PharmaCo ERP — Simple Walkthrough

A plain-English guide: what every screen is, what it does, and how the work flows.
No jargon. Live app: https://pharmamntr.vercel.app

---

## The big picture

The app has **three areas**, shown as groups in the left menu:

1. **Procurement** — buying goods from suppliers.
2. **Inventory** — the stock you hold.
3. **Billing & Finance** — the money side.

They connect in one chain:

> **Buy** goods (Procurement) → they land in **Stock** (Inventory) → you **pay** the supplier and later **invoice** customers (Finance).

You move around with the **left sidebar**. Each group opens to its screens. Lists have a **Create** button (top-right); click a **row** to open its detail page; detail pages have the **next-step** buttons.

---

## 1. Procurement — buying goods

**What each screen is:**
- **Dashboard** — quick numbers + shortcut buttons.
- **Material Requisition** — an internal request: "we need these items."
- **Vendors** — your supplier list. Ratings are calculated automatically from real deliveries (on-time %, rejects, lead time). A brand-new vendor shows "Not yet rated."
- **RFQs** — asking vendors to quote a price.
- **Purchase Orders (PO)** — the official order you send a vendor.
- **Goods Receipt (GRN)** — recording what actually arrived.
- **Procurement Reports** — pending items, vendor performance, cost, and an audit log.

**The flow (follow the buttons):**
1. **Material Requisition → Create.** Fill items, **Submit for Approval**. A manager opens it and clicks **Approve**.
2. On the approved requisition, click **Create RFQ**. Pick vendors, then on the RFQ enter each vendor's **quote**, compare, and click **Award Vendor**.
3. On the RFQ, click **Generate Purchase Order**. Open the PO, **Approve**, then **Send to Vendor**. (Need a change first? **Amend** it.)
4. When the goods arrive, open the PO and click **Receive Goods**. Enter received / accepted quantities + batch/expiry, then **Complete Receipt**.
5. ✅ Completing the GRN **automatically adds the stock to Inventory** and updates the PO's status.

---

## 2. Inventory — your stock

**What each screen is:**
- **Dashboard** — stock value, low-stock and expiry counts, shortcuts.
- **Item Master** — the product catalog (name, category, unit, barcode, reorder/safety/max levels).
- **Warehouses** — your storage locations.
- **Stock** — how much of each item you have and where. Buttons: **Stock In** (receive) and **Stock Out** (issue/consume).
- **Batch Management** — track each lot with its manufacturing/expiry dates.
- **Transfers** — move stock from one warehouse to another.
- **Stock Adjustment** — correct the system count after a physical count.
- **Expiry Monitoring** — what's expiring soon; **Recall** or **Dispose** a batch.
- **Stock Ledger** — the full history of every stock movement.
- **Stock Monitoring** — alerts: low stock, below safety, overstock.
- **Inventory Reports** — stock, movement, batch, expiry.

**The flow:**
1. Stock **comes in** two ways: **Stock In** (manual) or **automatically from a completed GRN** (see Procurement step 5). It's stored as **batches**.
2. Stock **moves**: **Stock Out** to issue it (uses first-expiry-first), **Transfers** between warehouses (Create → Approve → Mark In Transit → **Mark Completed** actually moves the quantity), or **Stock Adjustment** (Create → **Approve** applies the counted change).
3. Every one of those moves is written to the **Stock Ledger**, so you always see the history.
4. **Stock Monitoring** and **Expiry Monitoring** warn you when to reorder or act.

> Note: quantity lives on **batches**. Everything else (item on-hand, stock value, alerts) is calculated from them — so it's always in sync.

---

## 3. Billing & Finance — the money

**What each screen is:**
- **Dashboard** — receivables, payables, cash/bank balances, shortcuts.
- **Customer Invoices** — bills you send customers. **Credit Notes** reduce an invoice.
- **Supplier Bills** — what you owe vendors (built from a PO/GRN). **Debit Notes** adjust a bill.
- **Payments** — record money in (from customers) or out (to suppliers).
- **Advances** — prepayments held as credit, applied to a bill/invoice later.
- **Accounting** — Chart of Accounts, Journal Entries, General Ledger, AR & AP.
- **Banking** — bank accounts, transactions, and reconciliation.
- **Cash Book** — cash in/out with a running balance.
- **Taxes** — VAT collected vs paid, VAT report.
- **Financial Reports** — Trial Balance, Profit & Loss, Balance Sheet, Cash Flow.
- **Analytics** — revenue, expense, and cost-center breakdowns.
- **Audit Report** — a log of every finance action.

**The flow:**
1. **You sell:** create a **Customer Invoice**. On it, click **Record Payment** — the invoice's balance drops, its status updates, and a **bank transaction** is created.
2. **You buy:** a **Supplier Bill** comes from your PO/GRN. Open it, **Approve**, then **Pay Bill** — same effect on the payable side and the bank.
3. **Adjustments:** issue a **Credit/Debit Note** to correct an invoice/bill; record an **Advance** and **Apply** it later.
4. **Accounting:** post a **Journal Entry** — it moves two account balances (double-entry), which flow into the **Trial Balance, P&L, and Balance Sheet**.
5. **Banking:** payments show up as transactions; tick them off in **Reconciliation**; cash shows in the **Cash Book**; VAT rolls up in the **Tax report**.

---

## How the three connect (the full loop)

1. **Procurement** raises a PO and receives goods (GRN).
2. That GRN **pushes stock into Inventory** — and the same PO/GRN becomes a **Supplier Bill** in Finance.
3. You **pay** the bill (Finance → bank).
4. Later you **sell** that stock: raise a **Customer Invoice**, the customer **pays**, cash comes into the bank.
5. Every step leaves a real record — stock ledger, journal, bank transactions, audit logs — so the reports always reflect what actually happened.

---

## Good to know

- **No login/backend.** Everything runs in the browser. What you create during a visit is saved as you click, but a **page refresh resets** it to the sample data.
- **Nothing is faked.** Every number is either something you entered or calculated from real records. If there's no data yet, a screen says so (e.g. "Not yet rated") instead of showing a made-up figure.
- **Getting around:** left sidebar = the three areas; **Create** button on lists; click a **row** to open it; **next-step** buttons live on the detail pages.
