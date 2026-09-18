// src/utils/bills/bills_hybrid_utils.js
import {
  createBillIndexedDB,
  createConsigneeIndexedDB,
  createSenderIndexedDB,
  createServiceTypeIndexedDB,
  getBillByUUIDWithRelations,
} from "../../services/indexDBServices.js";

import { fetchEmployeeBillsData } from "../../utils/employe_api_utils";
import {
  fetchEmployeeBillsData as fetchEmployeeBillsDataOffline,
  fetchOfflineSummary,
} from "../offline_db_service_utils";

/**
 * Fetch employee bills in hybrid mode (online/offline)
 */
export const fetchEmployeeBillsData_Hybrid = async (
  isConnected,
  setSenders,
  setConsignees,
  setServiceTypes,
  setBranchList,
  setError,
  setChartData,
  setLoading
) => {
  if (isConnected) {
    fetchEmployeeBillsData(
      setSenders,
      setConsignees,
      setServiceTypes,
      setBranchList,
      setError
    );
  } else {
    fetchEmployeeBillsDataOffline(
      setSenders,
      setConsignees,
      setServiceTypes,
      setBranchList,
      setError
    );
  }
};

/**
 * Save a sender offline
 */
export const saveSenderOffline = async (
  modalForm,
  setSenders,
  setFormData,
  setError,
  setSuccess
) => {
  try {
    const savedSender = await createSenderIndexedDB(modalForm);
    setSenders((prev) => [...prev, savedSender]);
    setFormData({
      name: "",
      phone: "",
      country: "",
      tin_number: "",
    });
    setSuccess("Sender saved offline");
  } catch (err) {
    console.error("Failed to save sender offline", err);
    setError("Failed to save sender offline");
  }
};

/**
 * Save a consignee offline
 */
export const saveConsigneeOffline = async (
  modalForm,
  setConsignees,
  setFormData,
  setError,
  setSuccess
) => {
  try {
    const savedConsignee = await createConsigneeIndexedDB(modalForm);
    setConsignees((prev) => [...prev, savedConsignee]);
    setFormData({
      name: "",
      phone: "",
      country: "",
      tin_number: "",
    });
    setSuccess("Consignee saved offline");
  } catch (err) {
    console.error("Failed to save consignee offline", err);
    setError("Failed to save consignee offline");
  }
};

/**
 * Save a service type offline
 */
export const saveServiceTypeOffline = async (
  modalForm,
  setServiceTypes,
  setFormData,
  setError,
  setSuccess
) => {
  try {
    const savedServiceType = await createServiceTypeIndexedDB(modalForm);
    setServiceTypes((prev) => [...prev, savedServiceType]);
    setFormData({
      name: "",
      description: "",
      company: "",
    });
    setSuccess("Service type saved offline");
  } catch (err) {
    console.error("Failed to save service type offline", err);
    setError("Failed to save service type offline");
  }
};

/**
 * Save a bill offline
 */
export const saveBillOffline = async (formData, items, setError, setSuccess) => {
  try {
    const savedBill = await createBillIndexedDB(formData, items);
    setSuccess("Bill saved offline");
    return savedBill;
  } catch (err) {
    console.error("Failed to save bill offline", err);
    setError(err.message); // Send real error message
    return null;
  }
};

/**
 * Fetch a single bill offline by UUID
 */
export const fetchOfflineBill = async (uuid) => {
  const bill = await getBillByUUIDWithRelations(uuid);
  if (!bill) return null;
  return bill;
};

/**
 * Fetch employee dashboard offline summary
 */
export const fetchEmployeeDashboardOffline = async (
  setStats,
  setRecentBills,
  setChartData,
  setLoading,
  setError
) => {
  try {
    const res = await fetchOfflineSummary();

    // ✅ Stats
    setStats({
      todayBills: res.today_bills,
      totalRevenue: res.today_revenue,
      todayRevenue: res.today_revenue,
      inTransit: res.in_transit,
      deliveredToday: res.delivered_today,
    });

    // ✅ Recent Bills
    setRecentBills(res.bills.slice(0, 5));

    // ✅ Chart (last 7 days)
    const grouped = {};
    res.bills.forEach((b) => {
      const date = new Date(b.created_at).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + 1;
    });

    const labels = Object.keys(grouped).slice(-7);
    const data = Object.values(grouped).slice(-7);

    setChartData({ labels, data });
  } catch (err) {
    console.error(err);
    setError("Failed to fetch offline summary");
  } finally {
    setLoading(false);
  }
};
