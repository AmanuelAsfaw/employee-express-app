// src/utils/offline_db_service_utils.js
import { dbPromise } from './local_db'
import api from './axioServices'
import { v4 as uuidv4 } from 'uuid'
import { createOnlyNewBranchIndexedDB, createOnlyNewConsigneeIndexedDB, createOnlyNewSenderIndexedDB, createOnlyNewServiceTypeIndexedDB, getAllBillsWithRelationsIndexedDB, getAllBranchesIndexedDB, getAllConsigneesIndexedDB, getAllSendersIndexedDB, getAllServiceTypesIndexedDB, updateSyncedDataIndexedDB } from '../services/indexDBServices'

import { ToastAndroid, Platform } from 'react-native'

export const showToast = (message, type = 'info') => {
  if (Platform.OS === 'android') {
    ToastAndroid.showWithGravity(message, ToastAndroid.LONG, ToastAndroid.BOTTOM)
  } else {
    console.log(`${type.toUpperCase()}: ${message}`) // fallback for iOS
  }
}

/**
 * BULK SYNC OFFLINE DATA
 */
export const syncBills = async () => {
  const db = await dbPromise

  const pendingBills = await db.getAllFromIndex(
    'bills',
    'syncStatus',
    'pending'
  )

  if (!pendingBills.length) {
    showToast('No pending bills to sync', 'info')
    return
  }

  const payload = []

  for (const bill of pendingBills) {
    const items = await db.getAllFromIndex('bill_items', 'bill_id', bill.uuid)

    payload.push({
      ...bill,
      uuid: bill.uuid,
      sender_uuid: bill.sender_uuid,
      consignee_uuid: bill.consignee_uuid,
      description_of_goods: bill.description_of_goods,
      amount_received: bill.amount_received,
      payment_method: bill.payment_method,
      status: bill.status || 'CREATED',
      items: items.map((i) => ({
        uuid: i.uuid,
        description: i.description,
        quantity: i.quantity,
        price: i.price,
      })),
    })
  }

  try {
    const res = await api.post('/express-api/api/bills/bulk_sync/', {
      bills: payload,
    })

    const failed = res.data?.bills?.failed || [];
    const synced =res.data?.bills?.synced || [];
    console.log('bulk-sync', { failed, synced });
    
    for (const uuid of synced) {
      const bill = pendingBills.find((b) => b.uuid === uuid && b.syncStatus != 'synced')
      if (bill) {
        await db.put('bills', { ...bill, syncStatus: 'synced' })
      }
    }

    for (const f of failed) {
      const bill = pendingBills.find((b) => b.uuid === f.uuid && b.syncStatus != 'synced')
      if (bill) {
        await db.put('bills', { ...bill, syncStatus: 'failed' })
      }
    }
  } catch (err) {
    console.error('Sync failed', err)
    for (const bill of pendingBills) {
      await db.put('bills', { ...bill, syncStatus: 'pending' })
    }
  }
}

/**
 * 🔵 SYNC SENDERS
 */
export const syncSenders = async () => {
  const db = await dbPromise
  const res = await api.get('/express-api/api/senders/')
  const senders = res.data.results || res.data

  const tx = db.transaction('senders', 'readwrite')
  for (const s of senders) {
    await tx.store.put(s)
  }
  await tx.done

  showToast('Senders synced successfully', 'success')
}

/**
 * 🔵 SYNC CONSIGNEES
 */
export const syncConsignees = async () => {
  const db = await dbPromise
  const res = await api.get('/express-api/api/consignees/')
  const data = res.data.results || res.data

  const tx = db.transaction('consignees', 'readwrite')
  for (const c of data) {
    await tx.store.put(c)
  }
  await tx.done

  showToast('Consignees synced successfully', 'success')
}

/**
 * 🔵 SYNC SERVICE TYPES
 */

export const syncServiceTypes = async () => {
  const db = await dbPromise

  const res = await api.get('/express-api/api/service-types/')
  const data = res.data.results || res.data

  const tx = db.transaction('serviceTypes', 'readwrite')

  for (const s of data) {
    await tx.store.put(s)
  }

  await tx.done

  showToast('Service types synced successfully', 'success')
}

export const syncReferenceData = async () => {
  await syncReferenceDataToServer();
  const db = await dbPromise

  try {
    const res = await api.get('/express-api/api/bills/sync_master_data/')

    const { senders, consignees, service_types, branches } = res.data

    for (const s of senders) {
      await createOnlyNewSenderIndexedDB({ ...s, syncStatus: 'synced' })
      console.log('Synced sender', s.name, '✅', s.uuid)
    }

    for (const c of consignees) {
      await createOnlyNewConsigneeIndexedDB({ ...c, syncStatus: 'synced' })
      console.log('Synced consignee', c.name, '✅', c.uuid)
    }

    for (const st of service_types) {
      await createOnlyNewServiceTypeIndexedDB({ ...st, syncStatus: 'synced' })
      console.log('Synced service type', st.name, '✅', st.uuid)
    }

    for (const b of branches) {
      await createOnlyNewBranchIndexedDB({ ...b, syncStatus: 'synced' })
      console.log('Synced branch', b.name, '✅', b.code)
    }

    await AsyncStorage.setItem('company', JSON.stringify(res.data.company))

    showToast(`Reference data synced from server to offline storage ✅`, 'success')
    console.log('✅ Master data synced')
  } catch (err) {
    console.error('❌ Master sync failed', err)
    showToast(`Reference data sync failed ❌, ${err}`, 'error')
  }
}

export const syncReferenceDataToServer = async () => {
  const senders = await getAllSendersIndexedDB()
  const consignees = await getAllConsigneesIndexedDB()  
  const serviceTypes = await getAllServiceTypesIndexedDB()
  const branches = await getAllBranchesIndexedDB()
  
  const payload = {
    senders: senders.filter(s => s.syncStatus === 'pending' || s.syncStatus === 'failed'),
    consignees: consignees.filter(c => c.syncStatus === 'pending' || c.syncStatus === 'failed'),
    service_types: serviceTypes.filter(st => st.syncStatus === 'pending' || st.syncStatus === 'failed'),
    branches: branches.filter(b => b.syncStatus === 'pending' || b.syncStatus === 'failed'),
  }

  try {
    if (!payload.senders.length && !payload.consignees.length && !payload.service_types.length && !payload.branches.length) {
      showToast(`No new reference data to sync to server`, 'info')
      return
    }

    const res = await api.post('/express-api/api/bills/bulk_sync/', payload)

    if (res.data?.success) {
      const { senders: syncedSenders, consignees: syncedConsignees, service_types: syncedServiceTypes, branches: syncedBranches } = res.data

      await updateSyncedDataIndexedDB(
        syncedSenders.synced.map(s => ({ uuid: s, syncStatus: 'synced' })),
        syncedConsignees.synced.map(c => ({ uuid: c, syncStatus: 'synced' })),
        syncedServiceTypes.synced.map(st => ({ uuid: st, syncStatus: 'synced' })),
        syncedBranches.synced
      )
    }

    console.log('✅ Master data sync to server successful')
    showToast(`Reference data synced to server ✅`, 'success')
  } catch (err) {
    console.error('Master sync push failed', err)
    showToast(`Reference data sync to server failed ❌, ${err}`, 'error')
  }
}

export const syncMasterDataToServer = async (payload) => {
  try {
    await api.post('/express-api/api/bills/bulk_sync_master_data/', payload)
    console.log('✅ Master data sync to server successful')
    showToast(`✅ Bulk Master data sync to server successful`, 'success')
  } catch (err) {
    console.error('Master sync push failed', err)
    showToast(`Bulk Master data sync to server failed ❌, ${err}`, 'error')
  }
}

export const fetchEmployeeDashboard = async () => {
  const db = await dbPromise

  const bills = await db.getAll('bills')

  const today = new Date().toISOString().split('T')[0]

  const todayBills = bills.filter((b) =>
    b.created_at?.startsWith(today)
  )

  return {
    stats: {
      todayBills: todayBills.length,
      totalRevenue: bills.reduce(
        (sum, b) => sum + Number(b.amount_received || 0),
        0
      ),
      inTransit: bills.filter((b) => b.status === 'IN_TRANSIT').length,
      deliveredToday: todayBills.filter(
        (b) => b.status === 'DELIVERED'
      ).length,
    },
    bills,
  }
}

export const fetchEmployeeBills = async (
  page = 1,
  search,
  statusFilter
) => {
  let bills = await getAllBillsWithRelationsIndexedDB()
  console.log("Offline Bills FetchEmployee Bills ", bills);

  if (search) {
    const s = search.toLowerCase()
    bills = bills.filter(
      (b) =>
        b.tracking_no?.toLowerCase().includes(s) ||
        b.sender_name?.toLowerCase().includes(s)
    )
  }

  if (statusFilter) {
    bills = bills.filter((b) => b.status === statusFilter)
  }

  const pageSize = 10

  return {
    results: bills.slice((page - 1) * pageSize, page * pageSize),
    count: bills.length,
  }
}

export const fetchEmployeeBillsData = async (setSenders, setConsignees, setServiceTypes, setBranchList, setError) => {
  try {
    const senders = await getAllSendersIndexedDB()
    const consignees = await getAllConsigneesIndexedDB()  
    const serviceTypes = await getAllServiceTypesIndexedDB()
    const branches = await getAllBranchesIndexedDB()

    console.log('Fetching bills data from IndexedDB...', { senders, consignees, serviceTypes, branches })

    if (senders.length > 0) setSenders(senders)
    if (consignees.length > 0) setConsignees(consignees)
    if (serviceTypes.length > 0) setServiceTypes(serviceTypes)
    if (branches.length > 0) setBranchList(branches)

    return {
      senders,
      consignees,
      serviceTypes,
      branches
    }
  } catch (err) {
    console.error('Error fetching employee bills data', err)
    if (setError) setError(err)
    return {
      senders: [],
      consignees: [],
      serviceTypes: [],
      branches: []
    }
  }
}

export const isSameDayToToday = (dateStr) => {
  const d = new Date(dateStr)
  const now = new Date()

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export const toDate = (value) => {
  return value instanceof Date ? value : new Date(value)
}

// Normalize to start of day (local)
export const startOfDay = (date) => {
  const d = toDate(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Normalize to end of day (local)
export const endOfDay = (date) => {
  const d = toDate(date)
  d.setHours(23, 59, 59, 999)
  return d
}

// Check if two dates are same calendar day
export const isSameDay = (a, b) => {
  const d1 = toDate(a)
  const d2 = toDate(b)

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

// Generic range checker (inclusive)
export const isWithinRange = (date, start, end) => {
  const d = toDate(date).getTime()

  if (start && d < startOfDay(start).getTime()) return false
  if (end && d > endOfDay(end).getTime()) return false

  return true
}

export const fetchOfflineSummary = async () => {
  const bills = await getAllBillsWithRelationsIndexedDB()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0] // yyyy-mm-dd
  console.log("todaystr", todayStr);
  

  // =========================
  // FILTER TODAY BILLS
  // =========================
  // const todayBills = bills.filter((b) => {
  //   if (!b.created_at) return false
  //   return b.created_at.startsWith(todayStr)
  // })
  

  const todayBills = bills.filter((b) => isSameDayToToday(b.created_at))
  console.log("todayBills", todayBills);

  // =========================
  // CALCULATIONS
  // =========================

  const today_bills = todayBills.length

  const today_revenue = todayBills.reduce(
    (sum, b) => sum + Number(b.amount_received || 0),
    0
  )

  const in_transit = bills.filter(
    (b) => b.status === 'IN_TRANSIT'
  ).length

  const delivered_today = todayBills.filter(
    (b) => b.status === 'DELIVERED'
  ).length

  console.log("Fetch offline summary ",  {
    today_bills,
    today_revenue,
    in_transit,
    delivered_today,
    bills,
 
  });
  
  return {
    today_bills,
    today_revenue,
    in_transit,
    delivered_today,
    bills,
 
  }
}
export const fetchOfflineBillsReport = async ({
  page = 1,
  search = '',
  status = '',
  start_date,
  end_date,
  sender,
  consignee,
  service_type,
}) => {
  let bills = await getAllBillsWithRelationsIndexedDB()

  // =========================
  // DATE NORMALIZATION
  // =========================
  let startTime = null
  let endTime = null

  if (start_date) {
    const start = new Date(start_date)
    start.setHours(0, 0, 0, 0)
    startTime = start.getTime()
  }

  if (end_date) {
    const end = new Date(end_date)
    end.setHours(23, 59, 59, 999) // ✅ FIX: include full day
    endTime = end.getTime()
  }

  // =========================
  // FILTERS (optimized)
  // =========================
  bills = bills.filter((b) => {
    const createdTime = new Date(b.created_at).getTime()

    // Date range filter
    if (startTime && createdTime < startTime) return false
    if (endTime && createdTime > endTime) return false

    // Sender
    if (sender && b.sender?.uuid !== sender) return false

    // Consignee
    if (consignee && b.consignee?.uuid !== consignee) return false

    // Service type
    if (service_type && b.serviceType?.uuid !== service_type) return false

    // Status
    if (status && b.status !== status) return false

    // Search
    if (search) {
      const s = search.toLowerCase()
      const match =
        b.tracking_no?.toLowerCase().includes(s) ||
        b.uuid?.toLowerCase().includes(s) ||
        b.sender?.name?.toLowerCase().includes(s) ||
        b.consignee?.name?.toLowerCase().includes(s)

      if (!match) return false
    }

    return true
  })

  // =========================
  // SORT (latest first)
  // =========================
  bills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  // =========================
  // SUMMARY
  // =========================
  const total_bills = bills.length

  const total_revenue = bills.reduce(
    (sum, b) => sum + Number(b.amount_received || 0),
    0
  )

  const statusCounts = bills.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1
    return acc
  }, {})

  const summary = {
    total_bills,
    total_revenue,
    in_transit: statusCounts['IN_TRANSIT'] || 0,
    delivered: statusCounts['DELIVERED'] || 0,
    created: statusCounts['CREATED'] || 0,
    returned: statusCounts['RETURNED'] || 0,
  }

  // =========================
  // PAGINATION
  // =========================
  const pageSize = 10
  const paginated = bills.slice((page - 1) * pageSize, page * pageSize)

  // =========================
  // COMPANY (optional cache)
  // =========================
  let company = null
  try {
    const db = await dbPromise
    company = await db.get('meta', 'company')
  } catch {
    company = null
  }

  return {
    count: total_bills,
    results: paginated,
    summary,
    company,
  }
}