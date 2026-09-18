// src/utils/employe_api_utils.js
import api from "./axioServices";
import { Alert } from "react-native";

export const fetchEmployeeDashboardAPI = async (setStats, setRecentBills, setChartData, setLoading) => {
  try {
    const [billsRes, summaryRes] = await Promise.all([
      api.get('/express-api/api/bills/?limit=10'),
      api.get('/express-api/api/bills/summary/')
    ]);

    const bills = billsRes.data.results || billsRes.data;
    const today_revenue = summaryRes.data.today_revenue || 0;
    const total_revenue = summaryRes.data.total_revenue || 0;
    
    setRecentBills(bills);

    const today = new Date().toISOString().split('T')[0];
    const todayBills = bills.filter(b => b.created_at?.startsWith(today));

    setStats({
      todayBills: todayBills.length,
      todayRevenue: parseFloat(today_revenue),
      totalRevenue: parseFloat(total_revenue),
      inTransit: bills.filter(b => b.status === 'IN_TRANSIT').length,
      deliveredToday: todayBills.filter(b => b.status === 'DELIVERED').length,
    });

    // Chart data formatted for react-native-chart-kit
    setChartData({
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [12, 19, 15, 25, 18, 30, 22]
    });

  } catch (err) {
    console.error('Failed to load dashboard:', err);
    // Silent fail or alert based on UX preference
  } finally {
    setLoading(false);
  }
};

export const fetchEmployeeBillsAPI = async (page = 1, search, statusFilter, setBills, setTotalPages, setCurrentPage, setLoading) => {
  setLoading(true);
  try {
    let url = `express-api/api/bills/my_bills/?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    const res = await api.get(url);
    const data = res.data.results || res.data;
    
    setBills(data);
    setTotalPages(Math.ceil((res.data.count || data.length) / 10));
    setCurrentPage(page);
  } catch (err) {
    console.error("Fetch Bills Error:", err);
    Alert.alert("Error", "Could not fetch bills. Please check your connection.");
  } finally {
    setLoading(false);
  }
};

export const fetchEmployeeBillsData = async (setSenders, setConsignees, setServiceTypes, setBranchList, setError) => {
  try {
    const [senderRes, consigneeRes, serviceRes, branchRes] = await Promise.all([
      api.get('/express-api/api/senders/'),
      api.get('/express-api/api/consignees/'),
      api.get('/express-api/api/service-types/'),
      api.get('/express-api/api/branches/'),
    ]);

    setSenders(senderRes.data.results || senderRes.data);
    setConsignees(consigneeRes.data.results || consigneeRes.data);
    setServiceTypes(serviceRes.data.results || serviceRes.data);
    setBranchList(branchRes.data.results || branchRes.data);
  } catch (err) {
    setError('Failed to load form data.');
    console.error(err);
  }
};

export const updateReceivedBillByEmployeeAPI = async (id, data) => {
  try {
    const res = await api.patch(`/express-api/api/bills/${id}/update_status/`, data);
    return res;
  } catch (err) {
    console.error("Update Status Error:", err);
    throw err; // Allow the screen to handle the specific error
  }
};

export const fetchUserAPI = async (setUser, setForm, setError, setLoading, setRefreshing, isRefresh = false) => {
  try {
    if (setError) setError('');

    if (isRefresh && setRefreshing) {
      setRefreshing(true);
    } else if (setLoading) {
      setLoading(true);
    }

    // Axios automatically handles the Base URL and Auth headers via interceptors
    const response = await api.get('/usr-mngmnt/api/user-profile/');
    const data = response.data;

    setUser(data);
    if (setForm) setForm(data);
  } catch (err) {
    const errorMsg = 
      err.response?.data?.detail || 
      err.response?.data?.message || 
      err.message || 
      'Failed to load user profile.';
    
    if (setError) setError(errorMsg);
    console.error('Fetch User Error:', err);
  } finally {
    if (setLoading) setLoading(false);
    if (setRefreshing) setRefreshing(false);
  }
};

export const fetchCompanyAPI = async (setCompany, setForm, setError, setLoading, setRefreshing, isRefresh = false) => {
  try {
    if (setError) setError('');

    if (isRefresh && setRefreshing) {
      setRefreshing(true);
    } else if (setLoading) {
      setLoading(true);
    }

    // Axios handles base URL and headers via interceptors
    const response = await api.get('/usr-mngmnt/api/company-profile/');
    const data = response.data;

    if (setCompany) setCompany(data);
    if (setForm) setForm(data);
  } catch (err) {
    const errorMsg = 
      err.response?.data?.detail || 
      err.response?.data?.message || 
      err.message || 
      'Failed to load company profile.';
    
    if (setError) setError(errorMsg);
    console.error('Fetch Company Error:', err);
  } finally {
    if (setLoading) setLoading(false);
    if (setRefreshing) setRefreshing(false);
  }
};

export const getConsigneesAPI = async (search = '') => {
  const res = await api.get('/express-api/api/consignees/', {
    params: {
      search,
    },
  })

  return res.data.results || res.data || []
}

export const createConsigneeAPI = async (data) => {
  const res = await api.post(
    '/express-api/api/consignees/',
    data
  )

  return res.data
}

export const updateConsigneeAPI = async (id, data) => {
  const res = await api.put(
    `/express-api/api/consignees/${id}/`,
    data
  )

  return res.data
}

export const deleteConsigneeAPI = async (id) => {
  const res = await api.delete(
    `/express-api/api/consignees/${id}/`
  )

  return res.data
}