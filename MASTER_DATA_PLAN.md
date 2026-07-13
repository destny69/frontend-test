# PharmaCo ERP — Phase 1 Recap + Hardcoded Dropdown → Master-Data Plan

## Context

Two things in one plan:
1. **Recap** of the Phase-1 vs Phase-2 split from the earlier gap analysis (Procurement / Inventory / Finance vs PMMS + Nepal compliance).
2. **New:** kill the hardcoded dropdowns. Forms like the Material Requisition "Department" select render from static arrays baked into the frontend (`Production, Quality Control, …`) instead of pulling from backend master data — even though the backend already serves that exact list. Same pattern repeats across ~40 dropdowns in all three modules.

Stack: React + Vite + MUI frontend at `Pharma/Pharma/Pharma/src`; Laravel 13 + Sanctum + spatie/laravel-permission backend at `divine-api` (API v1, `{status,message,data,meta}` envelope).

---

## Part A — Phase 1 recap (from the gap analysis)

**Phase 1 — quick wins (do now):**
- Trivial schema-field + template adds: PAN / company reg # / fiscal year on invoices; NPR symbol on printables; payment mode (advance/partial/credit) on PO; DDA fields (drug reg #, license #) on batch; storage-condition fields on batch; material category taxonomy.
- Easy CRUD/reports (data already exists): Warehouses admin screen; AR aging report; wastage % report; IND printout.
- Medium, bounded: **VAT @ 13% on invoices (do first — legal)**; Advances → real backend persistence; vendor file upload; damaged/rejected material tracking; bin/location on batch; QC as a dedicated procurement screen; GRN → Supplier Bill auto-post; delivery-overdue badge.

**Phase 2 — defer (foundational / rearchitecture):**
- Double-entry accounting / General Ledger (biggest gap — real VAT report + real financial statements block on it).
- Full IRD VAT report; Sales module + Invoice↔Inventory link; RBAC UI; audit-log screen; full notification system; reusable-material re-entry; advance-payment approval gate.

**Suggested start order:** VAT + PAN/fiscal-year fields → Advances backend → GRN→Bill auto-post → AR aging + wastage reports → batch DDA/storage/bin fields. GL rebuild is the item that reshapes downstream scope — decide its timing early.

> The master-data work below **overlaps** Phase 1: material-category taxonomy, currency, and payment-terms are all on both lists. Doing the master-data foundation first makes those Phase-1 items nearly free.

---

## Part B — Hardcoded dropdowns → master data

### The core finding

The backend is **ahead** of the frontend here. It already exposes and seeds:

| Endpoint (backend) | Seeded values | Frontend hardcodes the identical list at |
|---|---|---|
| `GET /v1/departments` | Production, Quality Control, Quality Assurance, Warehouse, R&D, Maintenance, Packaging | `procurement/data/mockData.ts:9` |
| `GET /v1/vendor-categories` | API Supplier, Excipients, Packaging, Lab Equipment, Logistics, MRO | inline in 4 files (VendorForm/List, RFQForm, Wizard) |
| `GET /v1/business-types` | Manufacturer, Distributor, Service Provider | `VendorForm.tsx:20` |
| `apiResource warehouses` (CRUD) | WH01–WH05 | `inventory/data/mockData.ts:6`, plus a *separate* inline list in `POForm.tsx:210` |

`/departments` is even fetched today (`procurement/store/requisitionApi.ts:86`) — but only cached as a name→id `Map` to resolve the id on POST (`ProcurementStore.tsx:206`). The `<MenuItem>` list the user sees is still the hardcoded array. **So for these four, there is zero backend work — it's a pure frontend swap.**

### Classification of every hardcoded list

**Category A — backend endpoint already exists → frontend-only swap (EASY, Phase 1)**
- Departments, Vendor/Purchase categories, Business types, Warehouses.
- ~20 render sites across procurement + inventory + POForm.

**Category B — no backend table yet → add a thin lookup table + copy `DepartmentsController` (SMALL, mostly Phase 1)**
- Units of measure (`ItemForm.tsx:34`: kg/g/pcs/roll/vial/box/litre — today a free-text DB column)
- Currencies (everywhere `['NPR']` — free-text DB column; ties to Phase-1 NPR work)
- Payment terms (VendorForm free-text "Net 30"; ties to Phase-1 PO payment-mode)
- Material/item categories & brands (`inventory/data/mockData.ts:3-4`; = Phase-1 "material category taxonomy")
- Cost centres (`finance/data/mockData.ts:18` — greenfield, nothing in backend)
- Banks (`finance` Nepal Investment Bank / Standard Chartered — seed objects)
- GRN inspection checks; stock-out issue reasons; adjustment reasons (adjustment reasons already a code enum — promote or expose).

Each read-only lookup = 1 migration + bare model + 5-line invokable controller (copy `DepartmentsController.php:15-20`) + 1 route line + 1 seeder. ~15–20 min each on the backend. Envelope + open-read policy are automatic.

**Category C — leave as code enums, do NOT turn into DB master data**
- All `*Status`, `Priority`, `PaymentMethod`, `PaymentType`, `MovementType`, `CostingMethod`, `AdjustmentType`. These are workflow state machines, already defined once in `divine-api/app/Enums/` (20 enums). The frontend duplicates them as filter arrays + TS unions in each `data/types.ts`.
- **Optional cleanup:** add one `GET /v1/enums` endpoint returning all enum cases, so the frontend stops re-typing status lists. Nice-to-have, not required.

**Category D — bigger, Phase 2**
- Approvers dropdowns (`Grace Liu`, `Marcus Webb`, etc. hardcoded in Wizard/POForm/TransferForm) → should come from the users+roles directory (backend has `/users`, `/roles`). Needs a "users by permission" query.
- Full master-data **admin/settings UI** (create/edit/deactivate lookups) — none exists today; no Settings nav item.
- RBAC UI (Phase-1 recap already lists this as Phase 2).

### Implementation approach (frontend)

The win is a **single reference-data layer**, then a mechanical swap. Do not scatter fetches.

1. **`src/shared/api/referenceApi.ts`** — thin fetchers for each lookup, reusing the existing `api.get` client (`shared/api/client.ts`). Map snake_case → `{id, name}` like the existing `*Api.ts` files do.
2. **`src/shared/store/ReferenceDataProvider.tsx`** (or extend each module store) — one context that loads all lookups once on app mount via `Promise.allSettled`, exposes `{ departments, vendorCategories, businessTypes, warehouses, unitsOfMeasure, currencies, paymentTerms, itemCategories, … , loading }`. Mirror the existing store pattern (`ProcurementStore.tsx:116-173`).
3. **`useReference()` hook** — components read lists from here instead of importing from `mockData.ts`.
4. **Swap each dropdown**: replace `import { departments } from '../data/mockData'` + `.map(<MenuItem>)` with `const { departments } = useReference()`. Keep a small `<Select>`-with-loading wrapper so lists that are still loading don't flash empty. The id→name resolution the store already does for POST stays as-is (or move it into the provider).
5. **Delete** the reference arrays from `mockData.ts` once all sites are migrated (leave transactional seed arrays alone — those are already API-fed).

### Implementation approach (backend, Category B only)

For each new lookup (units-of-measure, currencies, payment-terms, cost-centres, item-categories, brands, banks):
- Copy the Department triplet: migration (`id`, `name` unique, timestamps), bare model (global `unguard` means no `$fillable`), invokable controller returning `Response::success(Model::orderBy('name')->get(['id','name']))`.
- Add route under the `auth:sanctum`+`verified` group in `routes/api/v1.php`.
- Add a seeder with the current frontend values (listed in Category B) and register it in `DatabaseSeeder`.
- Read stays open (`viewAny => true` convention); no new permission needed for read. If/when the admin UI (Phase 2) manages these, add a Policy + `*.create/update/delete` permissions to `PermissionSeeder`.

Where a value is currently a free-text column (unit_of_measure, currency, payment_terms on raw_materials/vendors/rfqs/POs), a **later** migration can FK it to the new table — but that is not required for the dropdown swap; the form can keep sending the string. Keep the FK migration in Phase 2 alongside the item-master rework (`PROCUREMENT_INVENTORY_FINANCE_PLAN.md:182` already flags product free-text → items FK).

### Phasing the dropdown work

**Phase 1 (do now):**
- Build the frontend reference-data layer (steps 1–3).
- Swap Category A dropdowns (zero backend work).
- Add Category B thin tables that overlap Phase-1 compliance: **item/material categories** (taxonomy gap), **currencies** (NPR), **payment-terms/modes**, **units of measure**. Swap their dropdowns.

**Phase 2 (defer):**
- Cost centres, banks (greenfield, lower urgency).
- Approvers-from-users-directory.
- Master-data **admin/settings UI** to create/edit/deactivate lookups.
- Optional `/enums` endpoint to de-duplicate status lists.
- FK migration of free-text columns to master tables (with item-master rework).

---

## Verification

**Frontend swap:**
- `npm run dev` in `Pharma/Pharma/Pharma`; log in (demo `admin@gmail.com`).
- Open Material Requisition wizard → Department dropdown now shows the API list. Add a department via API/seed → it appears without a code change.
- Repeat for vendor category, business type, warehouse, and each migrated Category-B field.
- Confirm existing save still works (id resolves correctly on POST) and no dropdown flashes empty while loading.

**Backend lookups:**
- `php artisan migrate --seed` in `divine-api`; `curl` each new `GET /v1/<lookup>` and confirm the `{status,message,data}` envelope with seeded values.
- Run existing backend tests (`phpunit.xml`) to confirm no regression.

## Files to touch (representative)

- Frontend new: `src/shared/api/referenceApi.ts`, `src/shared/store/ReferenceDataProvider.tsx`, `useReference` hook.
- Frontend edits (pattern repeats): `procurement/pages/requisitions/RequisitionForm.tsx:152`, `wizard/ProcurementWizard.tsx:138`, `purchase-orders/POForm.tsx:210/217`, `vendors/VendorForm.tsx:19-21`, `inventory/pages/items/ItemForm.tsx:33-34`, all `*List.tsx` filter selects; then trim `*/data/mockData.ts` reference arrays.
- Backend new per Category-B lookup: `database/migrations/*`, `app/Models/*`, `app/Http/Controllers/Api/V1/*Controller.php` (copy `DepartmentsController`), `routes/api/v1.php`, `database/seeders/*Seeder.php` + `DatabaseSeeder.php`.
