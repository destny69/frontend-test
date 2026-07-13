import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import {
  requisitions as seedRequisitions,
  vendors as seedVendors,
  rfqs as seedRfqs,
  purchaseOrders as seedPurchaseOrders,
  grns as seedGrns,
} from '../data/mockData';
import {
  fetchVendors,
  fetchVendorCategories,
  fetchBusinessTypes,
  createVendor,
  updateVendorStatus,
  addVendorDocumentApi,
  removeVendorDocumentApi,
} from './vendorApi';
import {
  fetchRequisitions,
  fetchDepartments,
  createRequisition,
  approveRequisitionApi,
  rejectRequisitionApi,
  submitRequisitionApi,
  completeRequisitionApi,
  type CreateRequisitionInput,
} from './requisitionApi';
import { fetchRfqs, createRfq, submitRfqQuote, awardRfqApi, inviteRfqVendorsApi } from './rfqApi';
import {
  fetchPurchaseOrders,
  createPurchaseOrder,
  approvePurchaseOrderApi,
  sendPurchaseOrderApi,
  amendPurchaseOrderApi,
  cancelPurchaseOrderApi,
} from './poApi';
import { fetchGrns, createGrn, completeGrnApi, type GrnItemInput } from './grnApi';
import { fetchProcurementEvents } from './procurementEventApi';
import type {
  Requisition,
  Vendor,
  VendorDoc,
  Rfq,
  RfqQuote,
  PurchaseOrder,
  PoItem,
  Grn,
  GrnItem,
  GrnInspectionResult,
  ProcurementEvent,
  ProcurementEventType,
  ProcurementEntity,
} from '../data/types';

type NewVendorInput = Omit<Vendor, 'id' | 'vendorCode' | 'outstandingBalance'>;

type NewRequisitionInput = Omit<Requisition, 'id' | 'requestNo' | 'status'>;
type NewRfqInput = Omit<Rfq, 'id' | 'rfqNo' | 'status' | 'quotes' | 'awardedVendor'> & {
  quotes?: RfqQuote[];
};
type NewPoInput = Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>;
// vendorName/poNumber/warehouse label aren't sent - the backend resolves them from
// poId/warehouseId and returns the full nested record.
type NewGrnInput = {
  poId: string;
  warehouseId: string;
  receivedDate: string;
  deliveryNote: string;
  items: GrnItem[];
  inspection: GrnInspectionResult[];
};

// A quote as entered by a user on RFQDetail; score/submitted are derived by the store.
type QuoteInput = Pick<
  RfqQuote,
  'vendorId' | 'vendorName' | 'price' | 'deliveryDays' | 'paymentTerms' | 'qualityRating'
>;

interface ProcurementContextValue {
  loading: boolean;
  requisitions: Requisition[];
  vendors: Vendor[];
  rfqs: Rfq[];
  purchaseOrders: PurchaseOrder[];
  grns: Grn[];
  procurementEvents: ProcurementEvent[];
  addRequisition: (input: NewRequisitionInput, submit: boolean) => Promise<string>;
  submitRequisition: (id: string) => Promise<void>;
  approveRequisition: (id: string, approver: string) => Promise<void>;
  rejectRequisition: (id: string, approver: string, reason: string) => Promise<void>;
  completeRequisition: (id: string) => Promise<void>;
  addVendor: (input: NewVendorInput) => Promise<string>;
  setVendorStatus: (vendorId: string, status: Vendor['status']) => Promise<void>;
  addVendorDoc: (vendorId: string, doc: VendorDoc) => Promise<void>;
  removeVendorDoc: (vendorId: string, documentId: string) => Promise<void>;
  addRfq: (input: NewRfqInput, send: boolean) => Promise<string>;
  submitQuote: (rfqId: string, quote: QuoteInput) => Promise<void>;
  awardRfq: (id: string, vendorId: string) => Promise<void>;
  inviteRfqVendors: (rfqId: string, vendorIds: string[]) => Promise<void>;
  addPurchaseOrder: (input: NewPoInput, submit: boolean) => Promise<string>;
  approvePurchaseOrder: (id: string) => Promise<void>;
  sendPurchaseOrder: (id: string) => Promise<void>;
  amendPurchaseOrder: (id: string, updatedItems: PoItem[], note: string) => Promise<void>;
  cancelPurchaseOrder: (id: string) => Promise<void>;
  addGrn: (input: NewGrnInput, complete: boolean) => Promise<Grn>;
  acceptGrn: (id: string) => Promise<void>;
}

const ProcurementContext = createContext<ProcurementContextValue | null>(null);

// Actor used for audit events that carry no explicit user (approvals, sends, etc.).
const SYSTEM_ACTOR = 'Procurement Officer';

let eventSeq = 0;

export function ProcurementProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<Requisition[]>(seedRequisitions);
  const [vendors, setVendors] = useState<Vendor[]>(seedVendors);
  const [rfqs, setRfqs] = useState<Rfq[]>(seedRfqs);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(seedPurchaseOrders);
  const [grns, setGrns] = useState<Grn[]>(seedGrns);
  const [procurementEvents, setProcurementEvents] = useState<ProcurementEvent[]>([]);

  // Vendors are backed by the real API; category/business-type name -> id
  // lookups are cached here for addVendor (the form only knows names).
  // Cached as pending promises rather than plain maps so a submit that
  // races the initial fetch awaits the same in-flight request instead of
  // reading an empty map.
  const categoryIdsPromise = useRef<Promise<Map<string, number>> | null>(null);
  const businessTypeIdsPromise = useRef<Promise<Map<string, number>> | null>(null);
  const departmentIdsPromise = useRef<Promise<Map<string, number>> | null>(null);

  const loadCategoryIds = () => {
    if (!categoryIdsPromise.current) {
      categoryIdsPromise.current = fetchVendorCategories().then(
        (rows) => new Map(rows.map((r) => [r.name, r.id])),
      );
    }
    return categoryIdsPromise.current;
  };

  const loadBusinessTypeIds = () => {
    if (!businessTypeIdsPromise.current) {
      businessTypeIdsPromise.current = fetchBusinessTypes().then(
        (rows) => new Map(rows.map((r) => [r.name, r.id])),
      );
    }
    return businessTypeIdsPromise.current;
  };

  const loadDepartmentIds = () => {
    if (!departmentIdsPromise.current) {
      departmentIdsPromise.current = fetchDepartments().then(
        (rows) => new Map(rows.map((r) => [r.name, r.id])),
      );
    }
    return departmentIdsPromise.current;
  };

  useEffect(() => {
    loadCategoryIds().catch((e) => console.error('Failed to load vendor categories', e));
    loadBusinessTypeIds().catch((e) => console.error('Failed to load business types', e));
    loadDepartmentIds().catch((e) => console.error('Failed to load departments', e));
    Promise.allSettled([
      fetchVendors().then(setVendors).catch((e) => console.error('Failed to load vendors', e)),
      fetchRequisitions().then(setRequisitions).catch((e) => console.error('Failed to load requisitions', e)),
      fetchRfqs().then(setRfqs).catch((e) => console.error('Failed to load RFQs', e)),
      fetchPurchaseOrders().then(setPurchaseOrders).catch((e) => console.error('Failed to load purchase orders', e)),
      fetchGrns().then(setGrns).catch((e) => console.error('Failed to load GRNs', e)),
      fetchProcurementEvents().then(setProcurementEvents).catch((e) => console.error('Failed to load procurement events', e)),
    ]).then(() => setLoading(false));
  }, []);

  // Append an audit-trail entry. In-memory only (resets on refresh).
  const logEvent = (
    type: ProcurementEventType,
    entity: ProcurementEntity,
    ref: string,
    by: string,
  ) => {
    eventSeq += 1;
    const event: ProcurementEvent = {
      id: `EVT-${String(eventSeq).padStart(4, '0')}`,
      date: new Date().toISOString(),
      type,
      entity,
      ref,
      by,
    };
    setProcurementEvents((prev) => [event, ...prev]);
  };

  const PRIORITY_VALUE: Record<Requisition['priority'], CreateRequisitionInput['priority']> = {
    Low: 'low',
    Medium: 'medium',
    High: 'high',
    Urgent: 'urgent',
  };

  // Items come from the form with `item` holding the selected raw_material_id
  // (a real select now, sourced from the live Item catalog - not free text).
  const addRequisition: ProcurementContextValue['addRequisition'] = async (input, submit) => {
    const departmentIds = await loadDepartmentIds();
    const requisition = await createRequisition({
      departmentId: departmentIds.get(input.department) ?? 0,
      requiredByDate: input.requiredDate || undefined,
      priority: PRIORITY_VALUE[input.priority],
      purposeRemarks: input.notes ? `${input.purpose}\n\n${input.notes}` : input.purpose,
      submit,
      items: input.items.map((it) => ({
        rawMaterialId: it.item,
        quantityRequested: it.requiredQty,
        unit: it.unit,
      })),
    });
    setRequisitions((prev) => [requisition, ...prev]);
    logEvent(submit ? 'Submitted' : 'Created', 'Requisition', requisition.requestNo, input.requestedBy);
    return requisition.id;
  };

  const submitRequisition: ProcurementContextValue['submitRequisition'] = async (id) => {
    const updated = await submitRequisitionApi(id);
    setRequisitions((prev) => prev.map((r) => (r.id === id ? updated : r)));
    logEvent('Submitted', 'Requisition', updated.requestNo, updated.requestedBy);
  };

  const approveRequisition: ProcurementContextValue['approveRequisition'] = async (id, approver) => {
    const updated = await approveRequisitionApi(id);
    setRequisitions((prev) => prev.map((r) => (r.id === id ? updated : r)));
    logEvent('Approved', 'Requisition', updated.requestNo, approver);
  };

  const rejectRequisition: ProcurementContextValue['rejectRequisition'] = async (id, approver, reason) => {
    const updated = await rejectRequisitionApi(id, reason);
    setRequisitions((prev) => prev.map((r) => (r.id === id ? { ...updated, notes: reason } : r)));
    logEvent('Rejected', 'Requisition', updated.requestNo, approver);
  };

  const completeRequisition: ProcurementContextValue['completeRequisition'] = async (id) => {
    const updated = await completeRequisitionApi(id);
    setRequisitions((prev) => prev.map((r) => (r.id === id ? updated : r)));
    logEvent('Completed', 'Requisition', updated.requestNo, SYSTEM_ACTOR);
  };

  const addVendor: ProcurementContextValue['addVendor'] = async (input) => {
    const [categoryIds, businessTypeIds] = await Promise.all([loadCategoryIds(), loadBusinessTypeIds()]);
    const vendor = await createVendor({
      name: input.name,
      vendorCategoryId: categoryIds.get(input.category) ?? 0,
      businessTypeId: businessTypeIds.get(input.businessType),
      phone: input.phone,
      email: input.email,
      website: input.website,
      address: input.address,
      country: input.country,
      registrationNumber: input.registrationNumber,
      vatNumber: input.vatNumber,
      establishedDate: input.establishedDate || undefined,
      primaryContact: input.primaryContact,
      paymentTerms: input.paymentTerms,
      currency: input.currency,
      creditLimit: input.creditLimit,
    });
    setVendors((prev) => [vendor, ...prev]);
    logEvent('Created', 'Vendor', vendor.name, SYSTEM_ACTOR);
    return vendor.id;
  };

  const setVendorStatus: ProcurementContextValue['setVendorStatus'] = async (vendorId, status) => {
    const updated = await updateVendorStatus(vendorId, status);
    setVendors((prev) => prev.map((v) => (v.id === vendorId ? updated : v)));
    logEvent(status === 'Active' ? 'Approved' : status === 'Blacklisted' ? 'Rejected' : 'Submitted', 'Vendor', updated.name, SYSTEM_ACTOR);
  };

  const addVendorDoc: ProcurementContextValue['addVendorDoc'] = async (vendorId, doc) => {
    const updated = await addVendorDocumentApi(vendorId, doc);
    setVendors((prev) => prev.map((v) => (v.id === vendorId ? updated : v)));
    logEvent('Document Added', 'Vendor', `${updated.name} · ${doc.name}`, SYSTEM_ACTOR);
  };

  const removeVendorDoc: ProcurementContextValue['removeVendorDoc'] = async (vendorId, documentId) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    const docName = vendor?.documents.find((d) => d.id === documentId)?.name ?? '';
    const updated = await removeVendorDocumentApi(vendorId, documentId);
    setVendors((prev) => prev.map((v) => (v.id === vendorId ? updated : v)));
    logEvent('Document Removed', 'Vendor', `${updated.name} · ${docName}`, SYSTEM_ACTOR);
  };

  const addRfq: ProcurementContextValue['addRfq'] = async (input, send) => {
    const categoryIds = await loadCategoryIds();
    const rfq = await createRfq({
      requisitionId: input.requisitionId ? Number(input.requisitionId) : undefined,
      title: input.title,
      vendorCategoryId: categoryIds.get(input.category) ?? 0,
      closingDate: input.closingDate,
      currency: input.currency,
      send,
      items: input.items.map((it) => ({
        rawMaterialId: it.item,
        quantityRequested: it.requiredQty,
        unit: it.unit,
      })),
      invitedVendorIds: input.invitedVendors.map(Number),
    });
    setRfqs((prev) => [rfq, ...prev]);
    logEvent(send ? 'Sent' : 'Created', 'RFQ', rfq.rfqNo, SYSTEM_ACTOR);
    return rfq.id;
  };

  // Upsert a vendor's quote - the backend recomputes every submitted quote's
  // score from the real entered values, matching the old client-side logic.
  const submitQuote: ProcurementContextValue['submitQuote'] = async (rfqId, quote) => {
    const updated = await submitRfqQuote(rfqId, {
      vendorId: Number(quote.vendorId),
      price: quote.price,
      deliveryDays: quote.deliveryDays,
      qualityRating: quote.qualityRating,
      paymentTerms: quote.paymentTerms,
    });
    setRfqs((prev) => prev.map((r) => (r.id === rfqId ? updated : r)));
    logEvent('Quote Submitted', 'RFQ', updated.rfqNo, quote.vendorName);
  };

  const awardRfq: ProcurementContextValue['awardRfq'] = async (id, vendorId) => {
    const updated = await awardRfqApi(id, Number(vendorId));
    setRfqs((prev) => prev.map((r) => (r.id === id ? updated : r)));
    const vendorName = vendors.find((v) => v.id === vendorId)?.name ?? vendorId;
    logEvent('Awarded', 'RFQ', `${updated.rfqNo} → ${vendorName}`, SYSTEM_ACTOR);
  };

  const inviteRfqVendors: ProcurementContextValue['inviteRfqVendors'] = async (rfqId, vendorIds) => {
    const updated = await inviteRfqVendorsApi(rfqId, vendorIds.map(Number));
    setRfqs((prev) => prev.map((r) => (r.id === rfqId ? updated : r)));
    logEvent('Vendors Invited', 'RFQ', updated.rfqNo, SYSTEM_ACTOR);
  };

  const addPurchaseOrder: ProcurementContextValue['addPurchaseOrder'] = async (input, submit) => {
    const departmentIds = await loadDepartmentIds();
    const po = await createPurchaseOrder({
      rfqId: input.rfqId ? Number(input.rfqId) : undefined,
      vendorId: Number(input.vendorId),
      orderDate: input.date,
      expectedDelivery: input.expectedDelivery,
      currency: input.currency,
      warehouse: input.warehouse,
      departmentId: departmentIds.get(input.department) ?? undefined,
      submit,
      items: input.items.map((it) => ({
        rawMaterialId: it.product,
        qty: it.qty,
        unit: it.unit,
        unitPrice: it.unitPrice,
        discountPercent: it.discount,
        vatPercent: it.vat,
      })),
    });
    setPurchaseOrders((prev) => [po, ...prev]);
    logEvent(submit ? 'Submitted' : 'Created', 'Purchase Order', po.poNumber, input.createdBy);
    return po.id;
  };

  const approvePurchaseOrder: ProcurementContextValue['approvePurchaseOrder'] = async (id) => {
    const updated = await approvePurchaseOrderApi(id);
    setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? updated : p)));
    logEvent('Approved', 'Purchase Order', updated.poNumber, SYSTEM_ACTOR);
  };

  const sendPurchaseOrder: ProcurementContextValue['sendPurchaseOrder'] = async (id) => {
    const updated = await sendPurchaseOrderApi(id);
    setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? updated : p)));
    logEvent('Sent', 'Purchase Order', updated.poNumber, SYSTEM_ACTOR);
  };

  // Amend line quantities/prices while a PO is still Draft or Pending Approval -
  // the backend recomputes the amount and appends to the amendment trail.
  const amendPurchaseOrder: ProcurementContextValue['amendPurchaseOrder'] = async (
    id,
    updatedItems,
    note,
  ) => {
    const updated = await amendPurchaseOrderApi(
      id,
      note,
      updatedItems.map((it) => ({
        rawMaterialId: it.product,
        qty: it.qty,
        unit: it.unit,
        unitPrice: it.unitPrice,
        discountPercent: it.discount,
        vatPercent: it.vat,
      })),
    );
    setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? updated : p)));
    logEvent('Amended', 'Purchase Order', updated.poNumber, updated.createdBy);
  };

  const cancelPurchaseOrder: ProcurementContextValue['cancelPurchaseOrder'] = async (id) => {
    const updated = await cancelPurchaseOrderApi(id);
    setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? updated : p)));
    logEvent('Cancelled', 'Purchase Order', updated.poNumber, SYSTEM_ACTOR);
  };

  // Refetch POs so a just-completed GRN's roll-up (receivedQty / Partially
  // Received / Completed) shows up without a full page reload.
  const refreshPurchaseOrders = () => {
    fetchPurchaseOrders()
      .then(setPurchaseOrders)
      .catch((e) => console.error('Failed to refresh purchase orders', e));
  };

  // Persist a GRN - completing it rolls accepted quantities onto the PO and
  // creates under-inspection batches, all server-side in one transaction.
  const addGrn: ProcurementContextValue['addGrn'] = async (input, complete) => {
    const grn = await createGrn({
      purchaseOrderId: Number(input.poId),
      receivedDate: input.receivedDate,
      warehouseId: Number(input.warehouseId),
      deliveryNote: input.deliveryNote || undefined,
      complete,
      items: input.items.map(
        (it): GrnItemInput => ({
          rawMaterialId: it.product,
          orderedQty: it.orderedQty,
          receivedQty: it.receivedQty,
          acceptedQty: it.acceptedQty,
          rejectedQty: it.rejectedQty,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate || undefined,
        }),
      ),
      inspection: input.inspection,
    });
    setGrns((prev) => [grn, ...prev]);
    if (complete) refreshPurchaseOrders();
    logEvent(complete ? 'Received' : 'Created', 'GRN', grn.grnNumber, SYSTEM_ACTOR);
    return grn;
  };

  const acceptGrn: ProcurementContextValue['acceptGrn'] = async (id) => {
    const grn = await completeGrnApi(id);
    setGrns((prev) => prev.map((g) => (g.id === id ? grn : g)));
    refreshPurchaseOrders();
    logEvent('Received', 'GRN', grn.grnNumber, SYSTEM_ACTOR);
  };

  return (
    <ProcurementContext.Provider
      value={{
        loading,
        requisitions,
        vendors,
        rfqs,
        purchaseOrders,
        grns,
        procurementEvents,
        addRequisition,
        submitRequisition,
        approveRequisition,
        rejectRequisition,
        completeRequisition,
        addVendor,
        setVendorStatus,
        addVendorDoc,
        removeVendorDoc,
        addRfq,
        submitQuote,
        awardRfq,
        inviteRfqVendors,
        addPurchaseOrder,
        approvePurchaseOrder,
        sendPurchaseOrder,
        amendPurchaseOrder,
        cancelPurchaseOrder,
        addGrn,
        acceptGrn,
      }}
    >
      {children}
    </ProcurementContext.Provider>
  );
}

export function useProcurement() {
  const ctx = useContext(ProcurementContext);
  if (!ctx) throw new Error('useProcurement must be used within ProcurementProvider');
  return ctx;
}
