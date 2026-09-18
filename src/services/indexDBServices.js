// src/services/indexDBServices.js
import { dbPromise } from '../utils/local_db';
import { v4 as uuidv4 } from 'uuid';

/**
 * ================================
 * Bills & Bill Items
 * ================================
 */

// Create a new bill with items
export const createBillIndexedDB = async (billData, items) => {
  const db = await dbPromise;
  const newBillUUID = billData.uuid || uuidv4();
  const createdAt = new Date().toISOString();

  const newBill = {
    ...billData,
    uuid: newBillUUID,
    sender_uuid: billData.sender,
    consignee_uuid: billData.consignee,
    service_type_uuid: billData.service_type,
    destiny_branch_uuid: billData.destiny_branch,
    status: billData.status || 'CREATED',
    created_at: billData.created_at || createdAt,
    updated_at: billData.updated_at || createdAt,
    syncStatus: billData.syncStatus || 'pending',
  };

  // Offline bill limit check
  const offlineLimit = JSON.parse(localStorage.getItem('company'))?.offline_bill_number_limit || 1000;
  const unsyncedCount = await db.countFromIndex('bills', 'syncStatus', 'pending');
  const failedCount = await db.countFromIndex('bills', 'syncStatus', 'failed');
  if (unsyncedCount >= offlineLimit) {
    throw new Error(`Offline bill limit of ${offlineLimit} reached. Unsynced: ${unsyncedCount}, Failed: ${failedCount}`);
  }

  // Save the bill
  const billTx = db.transaction('bills', 'readwrite');
  await billTx.store.put(newBill);
  await billTx.done;

  // Save the bill items
  if (items?.length > 0) {
    const itemTx = db.transaction('bill_items', 'readwrite');
    for (const item of items) {
      const itemUUID = item.uuid || uuidv4();
      await itemTx.store.put({
        id: item.id || itemUUID,
        uuid: itemUUID,
        bill_id: newBillUUID,
        description: item.description,
        quantity: item.quantity,
        weight: item.weight,
        price: item.price,
        item_type: item.item_type,
        unit: item.unit,
        created_at: item.created_at || createdAt,
        updated_at: item.updated_at || createdAt,
        syncStatus: item.syncStatus || 'pending',
      });
    }
    await itemTx.done;
  }

  return newBill;
};

// Update an existing bill and its items
export const updateBillIndexedDB = async (billData, items) => {
  const db = await dbPromise;
  const existing = await db.getFromIndex('bills', 'uuid', billData.uuid);
  if (!existing) throw new Error('Bill not found');

  const updatedBill = {
    ...existing,
    ...billData,
    updated_at: new Date().toISOString(),
  };

  const billTx = db.transaction('bills', 'readwrite');
  await billTx.store.put(updatedBill);
  await billTx.done;

  // Update or add items
  if (items?.length > 0) {
    const itemTx = db.transaction('bill_items', 'readwrite');
    for (const item of items) {
      const itemUUID = item.uuid || uuidv4();
      await itemTx.store.put({
        id: item.id || itemUUID,
        uuid: itemUUID,
        bill_id: updatedBill.uuid,
        description: item.description,
        quantity: item.quantity,
        weight: item.weight,
        price: item.price,
        item_type: item.item_type,
        unit: item.unit,
        created_at: item.created_at || updatedBill.created_at,
        updated_at: item.updated_at || new Date().toISOString(),
        syncStatus: item.syncStatus || 'pending',
      });
    }
    await itemTx.done;
  }

  return updatedBill;
};

// Get all bills
export const getAllBillsIndexedDB = async () => {
  const db = await dbPromise;
  return await db.getAll('bills');
};

// Get all bills with relations
export const getAllBillsWithRelationsIndexedDB = async () => {
  const db = await dbPromise;
  const bills = await db.getAll('bills');
  return Promise.all(bills.map(getBillRelations));
};

// Get bill relations (sender, consignee, serviceType, branch)
export const getBillRelations = async (bill) => {
  if (!bill) return null;
  const db = await dbPromise;

  const [sender, consignee, serviceType, branch] = await Promise.all([
    db.get('senders', bill.sender_uuid),
    db.get('consignees', bill.consignee_uuid),
    db.get('serviceTypes', bill.service_type_uuid),
    db.get('branches', bill.destiny_branch_uuid),
  ]);

  return { ...bill, sender, consignee, serviceType, branch };
};

// Get single bill by UUID with relations
export const getBillByUUIDWithRelations = async (uuid) => {
  const db = await dbPromise;
  const bill = await db.get('bills', uuid);
  return getBillRelations(bill);
};

// Get all items of a bill
export const getBillItems = async (bill_uuid) => {
  const db = await dbPromise;
  return db.getAllFromIndex('bill_items', 'bill_id', bill_uuid);
};

/**
 * ================================
 * Senders
 * ================================
 */

// Create sender
export const createSenderIndexedDB = async (senderData) => {
  const db = await dbPromise;
  const newSender = {
    ...senderData,
    uuid: senderData.uuid || uuidv4(),
    created_at: senderData.created_at || new Date().toISOString(),
    updated_at: senderData.updated_at || new Date().toISOString(),
    syncStatus: senderData.syncStatus || 'pending',
  };
  const tx = db.transaction('senders', 'readwrite');
  await tx.store.put(newSender);
  await tx.done;
  return newSender;
};

// Create sender only if not exists
export const createOnlyNewSenderIndexedDB = async (senderData) => {
  const db = await dbPromise;
  const existing = await db.getFromIndex('senders', 'uuid', senderData.uuid);
  if (existing) return existing;
  return createSenderIndexedDB(senderData);
};

// Update sender
export const updateSenderIndexedDB = async (senderData) => {
  const db = await dbPromise;
  const existing = await db.getFromIndex('senders', 'uuid', senderData.uuid);
  if (!existing) throw new Error('Sender not found');
  const updatedSender = { ...existing, ...senderData, updated_at: new Date().toISOString() };
  const tx = db.transaction('senders', 'readwrite');
  await tx.store.put(updatedSender);
  await tx.done;
  return updatedSender;
};

// Get all senders
export const getAllSendersIndexedDB = async () => {
  const db = await dbPromise;
  return db.getAll('senders');
};

/**
 * ================================
 * Consignees
 * ================================
 */

export const createConsigneeIndexedDB = async (consigneeData) => {
  const db = await dbPromise;
  const newConsignee = {
    ...consigneeData,
    uuid: consigneeData.uuid || uuidv4(),
    created_at: consigneeData.created_at || new Date().toISOString(),
    updated_at: consigneeData.updated_at || new Date().toISOString(),
    syncStatus: consigneeData.syncStatus || 'pending',
  };
  const tx = db.transaction('consignees', 'readwrite');
  await tx.store.put(newConsignee);
  await tx.done;
  return newConsignee;
};

export const createOnlyNewConsigneeIndexedDB = async (consigneeData) => {
  const db = await dbPromise;
  const existing = await db.getFromIndex('consignees', 'uuid', consigneeData.uuid);
  if (existing) return existing;
  return createConsigneeIndexedDB(consigneeData);
};

export const updateConsigneeIndexedDB = async (consigneeData) => {
  const db = await dbPromise;
  const existing = await db.getFromIndex('consignees', 'uuid', consigneeData.uuid);
  if (!existing) throw new Error('Consignee not found');
  const updatedConsignee = { ...existing, ...consigneeData, updated_at: new Date().toISOString() };
  const tx = db.transaction('consignees', 'readwrite');
  await tx.store.put(updatedConsignee);
  await tx.done;
  return updatedConsignee;
};

export const getAllConsigneesIndexedDB = async () => {
  const db = await dbPromise;
  return db.getAll('consignees');
};

/**
 * ================================
 * Service Types
 * ================================
 */

export const createServiceTypeIndexedDB = async (serviceTypeData) => {
  const db = await dbPromise;
  const newServiceType = {
    ...serviceTypeData,
    uuid: serviceTypeData.uuid || uuidv4(),
    created_at: serviceTypeData.created_at || new Date().toISOString(),
    updated_at: serviceTypeData.updated_at || new Date().toISOString(),
    syncStatus: serviceTypeData.syncStatus || 'pending',
  };
  const tx = db.transaction('serviceTypes', 'readwrite');
  await tx.store.put(newServiceType);
  await tx.done;
  return newServiceType;
};

export const createOnlyNewServiceTypeIndexedDB = async (serviceTypeData) => {
  const db = await dbPromise;
  const existing = await db.getFromIndex('serviceTypes', 'uuid', serviceTypeData.uuid);
  if (existing) return existing;
  return createServiceTypeIndexedDB(serviceTypeData);
};

export const updateServiceTypeIndexedDB = async (serviceTypeData) => {
  const db = await dbPromise;
  const existing = await db.getFromIndex('serviceTypes', 'uuid', serviceTypeData.uuid);
  if (!existing) throw new Error('Service Type not found');
  const updatedServiceType = { ...existing, ...serviceTypeData, updated_at: new Date().toISOString() };
  const tx = db.transaction('serviceTypes', 'readwrite');
  await tx.store.put(updatedServiceType);
  await tx.done;
  return updatedServiceType;
};

export const getAllServiceTypesIndexedDB = async () => {
  const db = await dbPromise;
  return db.getAll('serviceTypes');
};

/**
 * ================================
 * Branches
 * ================================
 */

export const createBranchIndexedDB = async (branchData) => {
  const db = await dbPromise;
  const newBranch = {
    ...branchData,
    created_at: branchData.created_at || new Date().toISOString(),
    updated_at: branchData.updated_at || new Date().toISOString(),
    syncStatus: branchData.syncStatus || 'pending',
  };
  const tx = db.transaction('branches', 'readwrite');
  await tx.store.put(newBranch);
  await tx.done;
  return newBranch;
};

export const createOnlyNewBranchIndexedDB = async (branchData) => {
  const db = await dbPromise;
  const existing = await db.getFromIndex('branches', 'id', branchData.id);
  if (existing) return existing;
  return createBranchIndexedDB(branchData);
};

export const updateBranchIndexedDB = async (branchData) => {
  const db = await dbPromise;
  const existing = await db.getFromIndex('branches', 'id', branchData.id);
  if (!existing) throw new Error('Branch not found');
  const updatedBranch = { ...existing, ...branchData, updated_at: new Date().toISOString() };
  const tx = db.transaction('branches', 'readwrite');
  await tx.store.put(updatedBranch);
  await tx.done;
  return updatedBranch;
};

export const getAllBranchesIndexedDB = async () => {
  const db = await dbPromise;
  return db.getAll('branches');
};

/**
 * ================================
 * Update synced data
 * ================================
 */

export const updateSyncedDataIndexedDB = async (syncedSenders, syncedConsignees, syncedServiceTypes, syncedBranches) => {
  const db = await dbPromise;

  try {
    for (const s of syncedSenders) await updateSenderIndexedDB({ uuid: s.uuid, syncStatus: 'synced' });
    for (const c of syncedConsignees) await updateConsigneeIndexedDB({ ...c, syncStatus: 'synced' });
    for (const st of syncedServiceTypes) await updateServiceTypeIndexedDB({ ...st, syncStatus: 'synced' });
    for (const b of (syncedBranches || [])) await updateBranchIndexedDB({ ...b, syncStatus: 'synced' });
  } catch (err) {
    console.error('Failed to update synced data in IndexedDB', err);
  }
};
