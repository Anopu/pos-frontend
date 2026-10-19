import React, { useState, useEffect } from 'react';
import { 
  Wifi, Users, UserPlus, Search, Filter, Phone, Calendar, 
  DollarSign, CheckCircle2, AlertTriangle, AlertCircle, Clock, 
  MessageCircle, Printer, Download, Share2, Plus, Edit, Trash2, 
  RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  Building2, Server, Shield, FileText, Check, X, ChevronRight,
  Sparkles, HelpCircle, Layers, PieChart, CreditCard, Send
} from 'lucide-react';
import IspReceiptPrintModal from './IspReceiptPrintModal';
import { API_BASE } from '../utils/apiConfig';

const SPEED_PRESETS = [
  '5 Mbps', '10 Mbps', '15 Mbps', '20 Mbps', '25 Mbps', 
  '30 Mbps', '40 Mbps', '50 Mbps', '60 Mbps', '100 Mbps'
];

const EXPENSE_CATEGORIES = [
  'ফাইবার অপটিক কেবল ও ড্রপ তার',
  'অনু (ONU) ও রাউটার সরঞ্জাম',
  'টিজে বক্স ও স্প্লিটার',
  'সংযোগ ও লাইন রক্ষণাবেক্ষণ',
  'টেকনিশিয়ান/টিম কনভেন্স',
  'সার্ভার/সুইচ ইলেকট্রিসিটি ব্যাকআপ',
  'অন্যান্য আইএসপি খরচ'
];

export default function IspManagementModule({
  currentUser = { role: 'admin', fullname: 'Admin' },
  lang = 'bn',
  t = (k) => k
}) {
  const [activeSubTab, setActiveSubTab] = useState('customers'); // 'customers' | 'bills_receipts' | 'suppliers' | 'ledger' | 'profit_loss'
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const txt = (bn, en) => (lang === 'en' ? (en !== undefined ? en : bn) : bn);
  const isAdmin = currentUser && currentUser.role === 'admin';

  // মাসের নাম তৈরির হেল্পার ফাংশন (বাংলা ও ইংরেজি)
  const getMonthYearName = (dateObj = new Date(), isNextMonth = false, language = lang) => {
    const d = new Date(dateObj || new Date());
    if (isNextMonth) {
      d.setMonth(d.getMonth() + 1);
    }
    const bnMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const enMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const m = d.getMonth();
    const y = d.getFullYear();
    if (language === 'en') {
      return `${enMonths[m]} ${y}`;
    }
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const bnYear = String(y).split('').map(c => bnDigits[parseInt(c)] || c).join('');
    return `${bnMonths[m]} ${bnYear}`;
  };

  // গ্রাহকের সংযোগ তারিখ বা পূর্ববর্তী পেমেন্ট থেকে সঞ্চিত মোট বকেয়া ও মাসের হিসাব
  const calculateCustomerDues = (c) => {
    if (!c) return { unpaid_months: 1, monthly_due: 0, unpaid_line_charge: 0, total_due: 0, billing_month_range: 'চলতি মাস' };
    
    const monthlyFee = parseFloat(c.monthly_fee) || 0;
    const lineCharge = parseFloat(c.line_charge) || 0;
    const lineChargePaid = parseFloat(c.line_charge_paid) || 0;
    const unpaidLineCharge = Math.max(0, lineCharge - lineChargePaid);
    const isPaid = (c.payment_status === 'Paid');
    const today = new Date();

    const connDate = c.connection_date ? new Date(c.connection_date) : today;
    
    if (isPaid && (c.days_remaining > 0 || c.days_remaining === null || c.days_remaining === undefined)) {
      return {
        unpaid_months: 0,
        monthly_due: 0,
        unpaid_line_charge: unpaidLineCharge,
        total_due: unpaidLineCharge,
        billing_month_range: getMonthYearName(today, c.billing_type === 'prepaid', lang),
        start_date: c.connection_date,
        end_date: c.billing_cycle_end
      };
    }
    
    let baseDate = connDate;
    if (c.last_payment_date) {
      const lastPay = new Date(c.last_payment_date);
      if (!isNaN(lastPay.getTime()) && lastPay > connDate) {
        baseDate = lastPay;
      }
    }
    
    const diffYears = today.getFullYear() - baseDate.getFullYear();
    const diffMonths = (diffYears * 12) + (today.getMonth() - baseDate.getMonth());
    
    let unpaidMonths = 1;
    if (diffMonths > 0) {
      unpaidMonths = diffMonths + (today.getDate() >= baseDate.getDate() ? 1 : 0);
    } else {
      unpaidMonths = 1;
    }
    if (unpaidMonths < 1) unpaidMonths = 1;
    
    const monthlyDue = unpaidMonths * monthlyFee;
    const totalDue = monthlyDue + unpaidLineCharge;
    
    let rangeText = '';
    const startMonthName = getMonthYearName(baseDate, false, lang);
    const endMonthName = getMonthYearName(today, false, lang);
    if (unpaidMonths > 1) {
      rangeText = lang === 'en'
        ? `${startMonthName} to ${endMonthName} (${unpaidMonths} Months Due)`
        : `${startMonthName} হতে ${endMonthName} (${unpaidMonths} মাসের মোট বকেয়া)`;
    } else {
      rangeText = (c.billing_type === 'prepaid') 
        ? getMonthYearName(today, true, lang) 
        : getMonthYearName(today, false, lang);
    }
    
    return {
      unpaid_months: unpaidMonths,
      monthly_due: monthlyDue,
      unpaid_line_charge: unpaidLineCharge,
      total_due: totalDue,
      billing_month_range: rangeText,
      start_date: c.connection_date,
      end_date: c.billing_cycle_end
    };
  };

  // ================= গ্রাহক ম্যানেজমেন্ট স্টেট =================
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all'); // 'all' | 'alert3days' | 'paid' | 'due'
  const [speedFilter, setSpeedFilter] = useState('all');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // কাস্টমার ফর্ম স্টেট
  const [customerForm, setCustomerForm] = useState({
    customer_user_id: '',
    customer_name: '',
    contact_person: '',
    mobile: '',
    address: '',
    speed: '10 Mbps',
    connection_date: new Date().toISOString().slice(0, 10),
    line_charge: 1000,
    line_charge_paid: 1000,
    monthly_fee: 800,
    billing_type: 'prepaid',
    billing_cycle_end: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().slice(0, 10);
    })(),
    supplier_id: '',
    supplier_name: '',
    supplier_cost: 450,
    ip_address: '',
    pppoe_username: '',
    payment_status: 'Due',
    status: 'Active',
    note: ''
  });

  // ================= কুইক বিল ও মানি রিসিপ্ট পেমেন্ট স্টেট =================
  const [payingCustomer, setPayingCustomer] = useState(null);
  const [payFormData, setPayFormData] = useState({
    amount: '',
    payment_type: 'monthly_fee',
    billing_type: 'prepaid', // 'prepaid' | 'postpaid'
    doc_type: 'receipt', // 'receipt' | 'bill'
    payment_status: 'Paid', // 'Paid' | 'Due'
    billing_month: '',
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'Cash',
    next_billing_cycle_end: '',
    note: ''
  });

  // ================= সংরক্ষিত বিল ও মানি রিসিপ্ট স্টেট =================
  const [savedPayments, setSavedPayments] = useState([]);
  const [savedPaymentsLoading, setSavedPaymentsLoading] = useState(false);
  const [savedPaymentsSearch, setSavedPaymentsSearch] = useState('');
  const [savedPaymentsFilter, setSavedPaymentsFilter] = useState('all'); // 'all' | 'receipt' | 'bill' | 'prepaid' | 'postpaid' | 'paid' | 'due'
  const [editingPayment, setEditingPayment] = useState(null);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editPaymentForm, setEditPaymentForm] = useState({
    id: '',
    receipt_no: '',
    customer_name: '',
    customer_mobile: '',
    customer_address: '',
    speed: '10 Mbps',
    monthly_fee: '',
    line_charge: '',
    amount: '',
    payment_type: 'monthly_fee',
    billing_type: 'prepaid',
    doc_type: 'receipt',
    payment_status: 'Paid',
    billing_month: '',
    cycle_start: '',
    cycle_end: '',
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'Cash',
    received_by: currentUser.fullname || 'Admin',
    note: ''
  });

  // ================= প্রিন্ট / রিসিপ্ট মোডাল স্টেট =================
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // ================= আপস্ট্রিম সাপ্লায়ার স্টেট =================
  const [suppliers, setSuppliers] = useState([]);
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showPaySupplierModal, setShowPaySupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingSupplierPayment, setEditingSupplierPayment] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    supplier_name: '',
    contact_person: '',
    mobile: '',
    address: '',
    note: ''
  });
  const [supplierPayForm, setSupplierPayForm] = useState({
    supplier_id: '',
    supplier_name: '',
    customer_id: '',
    customer_name: '',
    bandwidth_package: '',
    amount: '',
    billing_month: 'চলতি মাস',
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'Bank',
    paid_by: currentUser.fullname || 'Admin',
    note: ''
  });

  // ================= লেজার স্টেট =================
  const [ledgerData, setLedgerData] = useState({
    ledger: [],
    total_inflow: 0,
    total_outflow: 0,
    total_billed: 0,
    total_collected: 0,
    net_balance: 0,
    customer_due: 0
  });
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('all');
  const [ledgerCustomerFilter, setLedgerCustomerFilter] = useState('');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  // ================= লাভ-ক্ষতি ও ব্যয় স্টেট =================
  const [profitLossData, setProfitLossData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [plStartDate, setPlStartDate] = useState('');
  const [plEndDate, setPlEndDate] = useState('');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    expense_title: '',
    category: 'সংযোগ ও লাইন রক্ষণাবেক্ষণ',
    amount: '',
    expense_date: new Date().toISOString().slice(0, 10),
    paid_by: currentUser.fullname || 'Admin',
    note: ''
  });

  // ================= ডাটা ফেচিং =================

  // ১. কাস্টমার তালিকা ফেচ
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/isp/customers?filter=${customerFilter}`;
      if (customerSearch) url += `&search=${encodeURIComponent(customerSearch)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch ISP customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // ২. আপস্ট্রিম সাপ্লায়ার ফেচ
  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_BASE}/isp/suppliers`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuppliers(data);
      }
    } catch (err) {
      console.error('Failed to fetch ISP suppliers:', err);
    }
  };

  // ৩. সাপ্লায়ার পেমেন্ট তালিকা ফেচ
  const fetchSupplierPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/isp/supplier-payments`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSupplierPayments(data);
      }
    } catch (err) {
      console.error('Failed to fetch ISP supplier payments:', err);
    }
  };

  // ৪. আইএসপি পৃথক ও সমন্বিত লেজার ফেচ
  const fetchLedger = async () => {
    try {
      let url = `${API_BASE}/isp/ledger?type=${ledgerTypeFilter}`;
      if (ledgerCustomerFilter) url += `&customer_id=${ledgerCustomerFilter}`;
      if (ledgerStartDate) url += `&start_date=${ledgerStartDate}`;
      if (ledgerEndDate) url += `&end_date=${ledgerEndDate}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.ledger) {
        setLedgerData(data);
      }
    } catch (err) {
      console.error('Failed to fetch ISP ledger:', err);
    }
  };

  // ৫. আইএসপি পৃথক লাভ-ক্ষতি ফেচ
  const fetchProfitLoss = async () => {
    try {
      let url = `${API_BASE}/isp/profit-loss`;
      const params = [];
      if (plStartDate) params.push(`start_date=${plStartDate}`);
      if (plEndDate) params.push(`end_date=${plEndDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data) {
        setProfitLossData(data);
      }
    } catch (err) {
      console.error('Failed to fetch ISP profit loss:', err);
    }
  };

  // ৬. আইএসপি পৃথক খরচ তালিকা ফেচ
  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_BASE}/isp/expenses`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setExpenses(data);
      }
    } catch (err) {
      console.error('Failed to fetch ISP expenses:', err);
    }
  };

  // ৭. সংরক্ষিত বিল ও মানি রিসিপ্ট তালিকা ফেচ
  const fetchSavedPayments = async () => {
    try {
      setSavedPaymentsLoading(true);
      let url = `${API_BASE}/isp/payments`;
      const params = [];
      if (savedPaymentsSearch) params.push(`search=${encodeURIComponent(savedPaymentsSearch)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedPayments(data);
      }
    } catch (err) {
      console.error('Failed to fetch ISP saved payments:', err);
    } finally {
      setSavedPaymentsLoading(false);
    }
  };

  // ইনিশিয়াল লোড ও সাব-ট্যাব ভিত্তিক লোড
  useEffect(() => {
    fetchCustomers();
    fetchSuppliers();
    fetchSavedPayments();
  }, [refreshTrigger, customerFilter]);

  useEffect(() => {
    if (activeSubTab === 'customers') {
      fetchCustomers();
    } else if (activeSubTab === 'bills_receipts') {
      fetchSavedPayments();
    } else if (activeSubTab === 'suppliers') {
      fetchSuppliers();
      fetchSupplierPayments();
    } else if (activeSubTab === 'ledger') {
      fetchLedger();
    } else if (activeSubTab === 'profit_loss') {
      fetchProfitLoss();
      fetchExpenses();
    }
  }, [activeSubTab, savedPaymentsSearch, ledgerTypeFilter, ledgerCustomerFilter, ledgerStartDate, ledgerEndDate, plStartDate, plEndDate]);

  // ফিল্টার্ড কাস্টমার লিস্ট (স্পিড ইত্যাদি ক্লায়েন্ট সাইড ফিল্টার)
  const filteredCustomers = customers.filter(c => {
    if (speedFilter !== 'all' && c.speed !== speedFilter) return false;
    return true;
  });

  // ৩ দিনের অ্যালার্টে থাকা কাস্টমার গণনা (যার বিলের মেয়াদ ৩ দিন বা কম সময় বাকি এবং এখনো অপরিশোধিত)
  const alert3DaysCount = customers.filter(c => c.is_alert_active === 1 || (c.days_remaining <= 3 && c.payment_status !== 'Paid')).length;
  const paidCustomersCount = customers.filter(c => c.payment_status === 'Paid').length;
  const totalMonthlyPotential = customers.reduce((sum, c) => sum + (parseFloat(c.monthly_fee) || 0), 0);

  // ================= কাস্টমার অ্যাকশনস =================

  // কাস্টমার সেভ বা আপডেট
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.customer_name || !customerForm.mobile || !customerForm.speed) {
      alert(txt('দয়া করে কাস্টমারের নাম, মোবাইল ও স্পিড ফিল্ড পূরণ করুন!', 'Please enter customer name, mobile and speed!'));
      return;
    }

    try {
      setLoading(true);
      const url = editingCustomer 
        ? `${API_BASE}/isp/customers/${editingCustomer.id}`
        : `${API_BASE}/isp/customers`;
      const method = editingCustomer ? 'PUT' : 'POST';

      // যদি কাস্টমার অপরিশোধিত (Due) হয় এবং সংযোগ তারিখ অতীতের হয়, তবে billing_cycle_end সংযোগ তারিখের ১ মাস পরের সাইকেল হবে
      let finalForm = { ...customerForm };
      if (!editingCustomer && finalForm.payment_status !== 'Paid' && finalForm.connection_date) {
        const connD = new Date(finalForm.connection_date);
        if (connD < new Date()) {
          const nextCycle = new Date(connD);
          nextCycle.setMonth(nextCycle.getMonth() + 1);
          finalForm.billing_cycle_end = nextCycle.toISOString().slice(0, 10);
        }
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalForm)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'সংরক্ষণ ব্যর্থ হয়েছে!');

      alert(data.message || txt('গ্রাহক সফলভাবে সংরক্ষিত হয়েছে!', 'Customer saved successfully!'));
      setShowAddCustomerModal(false);
      setEditingCustomer(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // কাস্টমার এডিট মোড ওপেন
  const handleEditCustomer = (c) => {
    setEditingCustomer(c);
    setCustomerForm({
      customer_user_id: c.customer_user_id || '',
      customer_name: c.customer_name || '',
      contact_person: c.contact_person || '',
      mobile: c.mobile || '',
      address: c.address || '',
      speed: c.speed || '10 Mbps',
      connection_date: c.connection_date ? c.connection_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      line_charge: c.line_charge || 0,
      line_charge_paid: c.line_charge_paid || 0,
      monthly_fee: c.monthly_fee || 0,
      billing_cycle_end: c.billing_cycle_end ? c.billing_cycle_end.slice(0, 10) : '',
      supplier_id: c.supplier_id || '',
      supplier_name: c.supplier_name || '',
      supplier_cost: c.supplier_cost || 0,
      ip_address: c.ip_address || '',
      pppoe_username: c.pppoe_username || '',
      payment_status: c.payment_status || 'Due',
      status: c.status || 'Active',
      note: c.note || ''
    });
    setShowAddCustomerModal(true);
  };

  // কাস্টমার ডিলিট (শুধুমাত্র অ্যাডমিন)
  const handleDeleteCustomer = async (c) => {
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন গ্রাহককে মুছে ফেলতে পারবেন!', 'Only admin can delete customers!'));
      return;
    }
    if (!window.confirm(txt(`আপনি কি নিশ্চিত যে "${c.customer_name}" গ্রাহককে মুছে ফেলতে চান?`, `Are you sure you want to delete customer "${c.customer_name}"?`))) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/isp/customers/${c.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ডিলিট ব্যর্থ হয়েছে!');
      alert(data.message || txt('গ্রাহক সফলভাবে মুছে ফেলা হয়েছে!', 'Customer deleted successfully!'));
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // কাস্টমার পেমেন্ট / মানি রিসিপ্ট ডিলিট (শুধুমাত্র অ্যাডমিন)
  const handleDeleteCustomerPayment = async (paymentId) => {
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন পেমেন্ট মুছে ফেলতে পারবেন!', 'Only admin can delete payments!'));
      return;
    }
    if (!window.confirm(txt('আপনি কি নিশ্চিত যে এই পেমেন্ট/রিসিট রেকর্ডটি মুছে ফেলতে চান?', 'Are you sure you want to delete this payment record?'))) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/isp/payments/${paymentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'মুছে ফেলা ব্যর্থ হয়েছে!');
      alert(data.message || txt('পেমেন্ট রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!', 'Payment deleted successfully!'));
      fetchSavedPayments();
      fetchCustomers();
      fetchLedger();
      fetchProfitLoss();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // সংরক্ষিত বিল / মানি রিসিপ্ট এডিট মোডাল ওপেন
  const handleOpenEditPayment = (p) => {
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন বিল/রিসিপ্ট তথ্য এডিট করতে পারবেন!', 'Only admin can edit bill/receipt!'));
      return;
    }
    setEditingPayment(p);
    setEditPaymentForm({
      id: p.id,
      receipt_no: p.receipt_no || '',
      customer_id: p.customer_id,
      customer_user_id: p.customer_user_id || '',
      customer_name: p.customer_name || '',
      customer_mobile: p.customer_mobile || '',
      customer_address: p.customer_address || '',
      speed: p.speed || '10 Mbps',
      monthly_fee: p.monthly_fee || 0,
      line_charge: p.line_charge || 0,
      amount: p.amount || '',
      payment_type: p.payment_type || 'monthly_fee',
      billing_type: p.billing_type || 'prepaid',
      doc_type: p.doc_type || (p.receipt_no?.startsWith('ISP-BILL') ? 'bill' : 'receipt'),
      payment_status: p.payment_status || 'Paid',
      billing_month: p.billing_month || '',
      cycle_start: p.cycle_start ? p.cycle_start.slice(0, 10) : '',
      cycle_end: p.cycle_end ? p.cycle_end.slice(0, 10) : '',
      payment_date: p.payment_date ? p.payment_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      payment_method: p.payment_method || 'Cash',
      received_by: p.received_by || (currentUser.fullname || 'Admin'),
      note: p.note || ''
    });
    setShowEditPaymentModal(true);
  };

  // সংরক্ষিত বিল / মানি রিসিপ্ট এডিট সাবমিট
  const handleSaveEditPayment = async (e) => {
    e.preventDefault();
    if (!editingPayment) return;
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন বিল/রিসিপ্ট তথ্য এডিট করতে পারবেন!', 'Only admin can edit bill/receipt!'));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/isp/payments/${editingPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPaymentForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'আপডেট ব্যর্থ হয়েছে!');

      alert(data.message || txt('বিল / রিসিপ্ট সফলভাবে আপডেট হয়েছে!', 'Bill / Receipt updated successfully!'));
      setShowEditPaymentModal(false);
      setEditingPayment(null);
      fetchSavedPayments();
      fetchCustomers();
      fetchLedger();
      fetchProfitLoss();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // সাপ্লায়ার ডিলিট (শুধুমাত্র অ্যাডমিন)
  const handleDeleteSupplier = async (s) => {
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন সাপ্লায়ার মুছে ফেলতে পারবেন!', 'Only admin can delete suppliers!'));
      return;
    }
    if (!window.confirm(txt(`আপনি কি নিশ্চিত যে "${s.supplier_name}" সাপ্লায়ারটি মুছে ফেলতে চান?`, `Are you sure you want to delete supplier "${s.supplier_name}"?`))) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/isp/suppliers/${s.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সাপ্লায়ার মুছে ফেলা ব্যর্থ হয়েছে!');
      alert(data.message || txt('সাপ্লায়ার সফলভাবে মুছে ফেলা হয়েছে!', 'Supplier deleted successfully!'));
      fetchSuppliers();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // সাপ্লায়ার পেমেন্ট ভাউচার ডিলিট (শুধুমাত্র অ্যাডমিন)
  const handleDeleteSupplierPayment = async (p) => {
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন ভাউচার মুছে ফেলতে পারবেন!', 'Only admin can delete vouchers!'));
      return;
    }
    const pid = typeof p === 'object' ? p.id : p;
    if (!window.confirm(txt('আপনি কি নিশ্চিত যে এই সাপ্লায়ার পেমেন্ট ভাউচারটি মুছে ফেলতে চান?', 'Are you sure you want to delete this supplier payment voucher?'))) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/isp/supplier-payments/${pid}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'মুছে ফেলা ব্যর্থ হয়েছে!');
      alert(data.message || txt('ভাউচার সফলভাবে মুছে ফেলা হয়েছে!', 'Voucher deleted successfully!'));
      fetchSupplierPayments();
      fetchLedger();
      fetchProfitLoss();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // সাপ্লায়ার পেমেন্ট ভাউচার এডিট (শুধুমাত্র অ্যাডমিন)
  const handleEditSupplierPayment = (p) => {
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন ভাউচার এডিট করতে পারবেন!', 'Only admin can edit vouchers!'));
      return;
    }
    setEditingSupplierPayment(p);
    setSupplierPayForm({
      supplier_id: p.supplier_id,
      supplier_name: p.supplier_name,
      customer_id: p.customer_id || '',
      customer_name: p.customer_name || '',
      bandwidth_package: p.bandwidth_package || '',
      amount: p.amount,
      billing_month: p.billing_month || 'চলতি মাস',
      payment_date: p.payment_date ? p.payment_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      payment_method: p.payment_method || 'Bank',
      paid_by: p.paid_by || (currentUser.fullname || 'Admin'),
      note: p.note || ''
    });
    setShowPaySupplierModal(true);
  };

  // আইএসপি খরচ মুছে ফেলা (শুধুমাত্র অ্যাডমিন)
  const handleDeleteExpense = async (exp) => {
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন খরচ রেকর্ড মুছে ফেলতে পারবেন!', 'Only admin can delete expense records!'));
      return;
    }
    const eid = typeof exp === 'object' ? exp.id : exp;
    if (!window.confirm(txt('আপনি কি নিশ্চিত যে এই খরচের রেকর্ডটি মুছে ফেলতে চান?', 'Are you sure you want to delete this expense record?'))) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/isp/expenses/${eid}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'মুছে ফেলা ব্যর্থ হয়েছে!');
      alert(data.message || txt('খরচ রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!', 'Expense deleted successfully!'));
      fetchProfitLoss();
      fetchExpenses();
      fetchLedger();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // আইএসপি খরচ এডিট (শুধুমাত্র অ্যাডমিন)
  const handleEditExpense = (exp) => {
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন খরচ রেকর্ড এডিট করতে পারবেন!', 'Only admin can edit expenses!'));
      return;
    }
    setEditingExpense(exp);
    setExpenseForm({
      expense_title: exp.expense_title,
      category: exp.category || 'সংযোগ ও লাইন রক্ষণাবেক্ষণ',
      amount: exp.amount,
      expense_date: exp.expense_date ? exp.expense_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      paid_by: exp.paid_by || (currentUser.fullname || 'Admin'),
      note: exp.note || ''
    });
    setShowAddExpenseModal(true);
  };

  // সরাসরি WhatsApp সতর্কতা মেসেজ ও বিল পাঠানোর লিংক
  const handleSendWhatsAppAlert = (c) => {
    const cleanMobile = (c.mobile || '').replace(/[^0-9]/g, '');
    if (!cleanMobile) {
      alert(txt('গ্রাহকের মোবাইল নম্বর নেই!', 'Customer has no valid mobile number!'));
      return;
    }
    const targetMobile = cleanMobile.startsWith('88') ? cleanMobile : `88${cleanMobile}`;

    const days = c.days_remaining;
    const dues = calculateCustomerDues(c);

    let timingNotice = '';
    if (days <= 0) {
      timingNotice = '⚠️ আপনার বিলের মেয়াদ ইতোমধ্যে উত্তীর্ণ হয়েছে।';
    } else if (days <= 3) {
      timingNotice = `🚨 আপনার বিল পরিশোধের মেয়াদ শেষ হতে আর মাত্র ${days} দিন বাকি আছে!`;
    } else {
      timingNotice = `বিলের মেয়াদ শেষ হবে আগামী ${c.billing_cycle_end ? c.billing_cycle_end.slice(0, 10) : ''} তারিখে।`;
    }

    let dueBreakdown = '';
    if (dues.unpaid_months > 1) {
      dueBreakdown = `⚠️ বকেয়া সময়কাল: ${dues.billing_month_range}\n⚠️ মোট বকেয়া সাবস্ক্রিপশন ফি (${dues.unpaid_months} মাস): ৳ ${dues.monthly_due.toLocaleString()}\n`;
    }
    if (dues.unpaid_line_charge > 0) {
      dueBreakdown += `🔌 বকেয়া লাইন চার্জ: ৳ ${dues.unpaid_line_charge.toLocaleString()}\n`;
    }

    const customerUserId = c.customer_user_id || c.pppoe_username || ('FC-' + c.id);

    const message = `*FC TECHNOLOGY - ISP INTERNET BILL ALERT*
----------------------------------------
আসসালামু আলাইকুম ${c.customer_name} ভাই/ম্যাডাম,
FC Technology হাই-স্পিড ব্রডব্যান্ড সার্ভিসের পক্ষ থেকে শুভেচ্ছা।

আপনার ইন্টারনেট সংযোগের বিবরণ:
🆔 কাস্টমার ইউজার আইডি: ${customerUserId}
📡 প্যাকেজ / স্পিড: ${c.speed}
💰 মাসিক সাবস্ক্রিপশন ফি: ৳ ${Number(c.monthly_fee).toLocaleString()}
📅 মাস পূর্ণের তারিখ: ${c.billing_cycle_end ? c.billing_cycle_end.slice(0, 10) : '-'}
${dueBreakdown}💵 এক বিলে সর্বমোট প্রদেয় বকেয়া: ৳ ${grandDue.toLocaleString()}

${timingNotice}

*যেভাবে বিল পরিশোধ করবেন :*
আপনার বিকাশের সেন্ড মানি অপশনে গিয়ে আমাদের বিকাশ নাম্বার 01812-091939 টি উল্লেখ করুন, আপনার বিলের টাকার অ্যামাউন্ট দিন এবং রেফারেন্সে আপনার ইউজার আইডিটি প্রদান করুন, (ইউজার আইডিটি আপনার বিলের উপরে দেওয়া আছে)। অথবা আমাদের সাপোর্ট প্রতিনিধির কাছে ফোন করে আপনার বিল প্রদানের অন্যান্য মাধ্যমগুলো জেনে নিন। ধন্যবাদ

দোকান নং #১৮, আর এফ জোহরা টাওয়ার, আগ্রাবাদ, চট্টগ্রাম।
হটলাইন: 09613-181920, 01812-091939
ধন্যবাদ, FC Technology`;

    const url = `https://wa.me/${targetMobile}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // মাসের সংখ্যা পরিবর্তন ও স্বয়ংক্রিয় পরিমাণ ও সাইকেল হিসাব
  const handleSelectMonthCount = (count, currentDocType = payFormData.doc_type) => {
    if (!payingCustomer) return;
    const numMonths = Math.max(1, parseInt(count) || 1);
    const mFee = parseFloat(payingCustomer.monthly_fee) || 0;
    const dues = calculateCustomerDues(payingCustomer);
    const unpaidLc = dues.unpaid_line_charge || 0;
    const isBoth = (payFormData.payment_type === 'both' || payFormData.payment_type === 'line_charge');
    const lineChargeToAdd = isBoth ? unpaidLc : 0;
    const totalAmt = (numMonths * mFee) + lineChargeToAdd;

    const today = new Date();
    let baseCycle = payingCustomer.billing_cycle_end ? new Date(payingCustomer.billing_cycle_end) : today;
    if (isNaN(baseCycle.getTime()) || baseCycle < today) {
      baseCycle = today;
    }
    const connDay = payingCustomer.connection_date ? new Date(payingCustomer.connection_date).getDate() : baseCycle.getDate();
    const nextEndObj = new Date(baseCycle.getFullYear(), baseCycle.getMonth() + numMonths, connDay);
    const nextEndDate = nextEndObj.toISOString().slice(0, 10);

    const startMonth = getMonthYearName(baseCycle, false, lang);
    const endMonthObj = new Date(baseCycle.getFullYear(), baseCycle.getMonth() + numMonths - 1, 1);
    const endMonth = getMonthYearName(endMonthObj, false, lang);

    let rangeStr = '';
    if (numMonths === 1) {
      rangeStr = (payFormData.billing_type === 'prepaid') 
        ? getMonthYearName(baseCycle, true, lang) 
        : getMonthYearName(baseCycle, false, lang);
    } else {
      rangeStr = `${startMonth} হতে ${endMonth} (${numMonths} মাস)`;
    }

    setPayFormData(prev => ({
      ...prev,
      months_count: numMonths,
      amount: totalAmt,
      billing_month: rangeStr,
      next_billing_cycle_end: nextEndDate,
      note: currentDocType === 'bill'
        ? (numMonths > 1 ? `ইন্টারনেট বকেয়া বিল চালান (${numMonths} মাস - ${rangeStr})` : txt('মাসিক ইন্টারনেট বিল চালান', 'Monthly internet bill invoice'))
        : (numMonths > 1 ? `ইন্টারনেট সাবস্ক্রিপশন ফি পরিশোধ (${numMonths} মাস - ${rangeStr})` : txt('মাসিক ইন্টারনেট সাবস্ক্রিপশন ফি পরিশোধ', 'Monthly internet subscription fee paid'))
    }));
  };

  // কুইক বিল ও মানি রিসিপ্ট পেমেন্ট মোডাল ওপেন
  const handleOpenPayModal = (c, initialDocType = 'receipt') => {
    setPayingCustomer(c);
    const billingType = c.billing_type || 'prepaid';
    const dues = calculateCustomerDues(c);

    const initialMonths = (initialDocType === 'bill' && dues.unpaid_months > 1) ? dues.unpaid_months : 1;

    // পরবর্তী মাস পূর্ণের তারিখ (+মাস সংখ্যা স্বয়ংক্রিয় - একই তারিখ বজায় রাখা)
    const today = new Date();
    let baseCycle = c.billing_cycle_end ? new Date(c.billing_cycle_end) : today;
    if (isNaN(baseCycle.getTime()) || baseCycle < today) {
      baseCycle = today;
    }
    const connDay = c.connection_date ? new Date(c.connection_date).getDate() : today.getDate();
    const futureEnd = new Date(baseCycle.getFullYear(), baseCycle.getMonth() + initialMonths, connDay);
    const nextEndDate = futureEnd.toISOString().slice(0, 10);

    const initialMonth = (initialDocType === 'bill' && dues.unpaid_months > 1)
      ? dues.billing_month_range
      : (billingType === 'prepaid' ? getMonthYearName(today, true, lang) : getMonthYearName(today, false, lang));

    const initialAmount = (initialDocType === 'bill' && dues.unpaid_months > 1)
      ? dues.total_due
      : ((parseFloat(c.monthly_fee) || 0) + (dues.unpaid_line_charge > 0 ? dues.unpaid_line_charge : 0));

    setPayFormData({
      amount: initialAmount,
      months_count: initialMonths,
      payment_type: dues.unpaid_line_charge > 0 ? 'both' : 'monthly_fee',
      billing_type: billingType,
      doc_type: initialDocType,
      payment_status: initialDocType === 'bill' ? 'Due' : 'Paid',
      billing_month: initialMonth,
      payment_date: today.toISOString().slice(0, 10),
      payment_method: 'Cash',
      next_billing_cycle_end: nextEndDate,
      unpaid_months: dues.unpaid_months,
      monthly_due: dues.monthly_due,
      unpaid_line_charge: dues.unpaid_line_charge,
      total_due: dues.total_due,
      note: initialDocType === 'bill' 
        ? (initialMonths > 1 ? `ইন্টারনেট বকেয়া বিল চালান (${initialMonths} মাস - ${initialMonth})` : txt('মাসিক ইন্টারনেট বিল চালান', 'Monthly internet bill invoice'))
        : (initialMonths > 1 ? `ইন্টারনেট সাবস্ক্রিপশন ফি পরিশোধ (${initialMonths} মাস - ${initialMonth})` : txt('মাসিক ইন্টারনেট সাবস্ক্রিপশন ফি পরিশোধ', 'Monthly internet subscription fee paid'))
    });
  };

  // সাবস্ক্রিপশন ফি ও বিল তৈরি সাবমিট
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payingCustomer || !payFormData.amount) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/isp/customers/${payingCustomer.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payFormData,
          months_count: payFormData.months_count || 1,
          speed: payingCustomer.speed,
          monthly_fee: payingCustomer.monthly_fee,
          line_charge: payingCustomer.line_charge,
          customer_address: payingCustomer.address,
          received_by: currentUser.fullname || 'Admin'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'পেমেন্ট ব্যর্থ হয়েছে!');

      // রিসিট ডেটা তৈরি ও প্রিন্ট/শেয়ার মোডাল ওপেন
      if (data.receipt) {
        setActiveReceipt({
          ...data.receipt,
          customer_user_id: payingCustomer.customer_user_id || payingCustomer.pppoe_username || ('FC-' + payingCustomer.id),
          contact_person: payingCustomer.contact_person || '',
          customer_address: payingCustomer.address,
          speed: payingCustomer.speed,
          monthly_fee: payingCustomer.monthly_fee,
          months_count: payFormData.months_count || 1,
          unpaid_months: payFormData.months_count || payFormData.unpaid_months || 1,
          monthly_due: payFormData.monthly_due || payFormData.amount,
          unpaid_line_charge: payFormData.unpaid_line_charge || 0,
          total_due: payFormData.total_due || payFormData.amount,
          billing_type: payFormData.billing_type,
          doc_type: payFormData.doc_type,
          payment_status: payFormData.payment_status
        });
        setIsReceiptModalOpen(true);
      }

      setPayingCustomer(null);
      fetchSavedPayments();
      fetchCustomers();
      fetchLedger();
      fetchProfitLoss();
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // কাস্টমারের জন্য রিসিট / বিল ভিউ মোডাল ওপেন করা
  const handleViewCustomerReceipt = (c) => {
    const dues = calculateCustomerDues(c);
    const isUnpaid = (c.payment_status !== 'Paid' || dues.total_due > 0);
    const userIdVal = c.customer_user_id || c.pppoe_username || ('FC-' + c.id);

    // যদি গ্রাহক সম্পূর্ণ পরিশোধিত থাকে এবং কোনো বকেয়া না থাকে, তবে সেভ করা রিসিট দেখানো যেতে পারে
    if (!isUnpaid) {
      const latestPayment = savedPayments.find(p => p.customer_id === c.id);
      if (latestPayment) {
        setActiveReceipt({
          ...latestPayment,
          customer_user_id: latestPayment.customer_user_id || userIdVal
        });
        setIsReceiptModalOpen(true);
        return;
      }
    }

    // অন্যথায় গ্রাহকের সম্পূর্ণ বকেয়া হিসাব সহ এক বিল / রিসিট ভিউ করা
    setActiveReceipt({
      receipt_no: `ISP-BILL-${c.id}-${Date.now().toString().slice(-4)}`,
      customer_id: c.id,
      customer_user_id: userIdVal,
      customer_name: c.customer_name,
      contact_person: c.contact_person || '',
      customer_mobile: c.mobile,
      customer_address: c.address,
      speed: c.speed,
      amount: dues.total_due || c.monthly_fee,
      monthly_fee: c.monthly_fee,
      line_charge: dues.unpaid_line_charge,
      line_charge_paid: c.line_charge_paid || 0,
      unpaid_months: dues.unpaid_months,
      monthly_due: dues.monthly_due,
      unpaid_line_charge: dues.unpaid_line_charge,
      total_due: dues.total_due,
      payment_type: dues.unpaid_line_charge > 0 ? 'both' : 'monthly_fee',
      billing_type: c.billing_type || 'prepaid',
      doc_type: isUnpaid ? 'bill' : 'receipt',
      payment_status: c.payment_status || 'Due',
      billing_month: dues.billing_month_range,
      cycle_start: c.connection_date ? c.connection_date.slice(0, 10) : '',
      cycle_end: c.billing_cycle_end ? c.billing_cycle_end.slice(0, 10) : '',
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'Cash',
      received_by: currentUser.fullname || 'Admin',
      ip_address: c.ip_address,
      pppoe_username: c.pppoe_username,
      note: isUnpaid 
        ? `ইন্টারনেট বকেয়া বিল (${dues.billing_month_range})` 
        : (c.note || 'মাসিক ইন্টারনেট সাবস্ক্রিপশন ফি পরিশোধ')
    });
    setIsReceiptModalOpen(true);
  };

  // ================= আপস্ট্রিম সাপ্লায়ার অ্যাকশনস =================

  // নতুন সাপ্লায়ার যোগ বা এডিট
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.supplier_name) return;

    try {
      const url = editingSupplier 
        ? `${API_BASE}/isp/suppliers/${editingSupplier.id}` 
        : `${API_BASE}/isp/suppliers`;
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      setShowAddSupplierModal(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // কাস্টমার ভিত্তিক বা বাল্ক সাপ্লায়ার বিল পরিশোধ সাবমিট
  const handlePaySupplierSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন সাপ্লায়ার পেমেন্ট সংরক্ষণ করতে পারবেন!', 'Only admin can submit supplier payments!'));
      return;
    }
    if (!supplierPayForm.supplier_id || !supplierPayForm.amount) {
      alert(txt('দয়া করে সাপ্লায়ার ও টাকার পরিমাণ দিন!', 'Please select supplier and enter amount!'));
      return;
    }

    try {
      const url = editingSupplierPayment 
        ? `${API_BASE}/isp/supplier-payments/${editingSupplierPayment.id}`
        : `${API_BASE}/isp/supplier-payments`;
      const method = editingSupplierPayment ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...supplierPayForm,
          paid_by: currentUser.fullname || 'Admin'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message || txt('সাপ্লায়ার বিল পরিশোধ সফল হয়েছে!', 'Supplier bill paid successfully!'));
      setShowPaySupplierModal(false);
      setEditingSupplierPayment(null);
      fetchSuppliers();
      fetchSupplierPayments();
      fetchLedger();
      fetchProfitLoss();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // কাস্টমার থেকে সরাসরি সাপ্লায়ার পে মোডাল ওপেন
  const handleOpenPaySupplierForCustomer = (c) => {
    setEditingSupplierPayment(null);
    setSupplierPayForm({
      supplier_id: c.supplier_id || (suppliers[0] ? suppliers[0].id : ''),
      supplier_name: c.supplier_name || (suppliers[0] ? suppliers[0].supplier_name : ''),
      customer_id: c.id,
      customer_name: c.customer_name,
      bandwidth_package: c.speed,
      amount: c.supplier_cost || '',
      billing_month: 'চলতি মাস',
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'Bank',
      paid_by: currentUser.fullname || 'Admin',
      note: `গ্রাহক ${c.customer_name} (${c.speed}) এর আপস্ট্রিম ব্যান্ডউইথ বিল পরিশোধ`
    });
    setShowPaySupplierModal(true);
  };

  // ================= আইএসপি ব্যয় যোগ / এডিট করা =================
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert(txt('শুধুমাত্র অ্যাডমিন খরচ রেকর্ড সংরক্ষণ করতে পারবেন!', 'Only admin can record expenses!'));
      return;
    }
    if (!expenseForm.expense_title || !expenseForm.amount) return;

    try {
      const url = editingExpense 
        ? `${API_BASE}/isp/expenses/${editingExpense.id}`
        : `${API_BASE}/isp/expenses`;
      const method = editingExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          paid_by: currentUser.fullname || 'Admin'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message || txt('আইএসপি খরচ সংরক্ষিত হয়েছে!', 'ISP expense saved successfully!'));
      setShowAddExpenseModal(false);
      setEditingExpense(null);
      setExpenseForm({
        expense_title: '',
        category: 'সংযোগ ও লাইন রক্ষণাবেক্ষণ',
        amount: '',
        expense_date: new Date().toISOString().slice(0, 10),
        paid_by: currentUser.fullname || 'Admin',
        note: ''
      });
      fetchProfitLoss();
      fetchExpenses();
      fetchLedger();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ১. টপ ব্যানার ও সাব-ট্যাব ন্যাভিগেশন */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 text-white">
              <Wifi size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">
                  {txt('আইএসপি ইন্টারনেট ম্যানেজমেন্ট', 'ISP Internet Management')}
                </h1>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">
                  FC TECHNOLOGY
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-1">
                {txt('গ্রাহক বিলিং, স্বয়ংক্রিয় ৩ দিনের লাল সতর্কতা, আলাদা লেজার ও স্বতন্ত্র লাভ-ক্ষতি হিসাব', 'ISP Billing, 3-day alert, isolated ledger & independent profit-loss')}
              </p>
            </div>
          </div>

          {/* নতুন কাস্টমার যোগ করার প্রাইমারি বাটন */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setEditingCustomer(null);
                setCustomerForm({
                  customer_user_id: '',
                  customer_name: '',
                  contact_person: '',
                  mobile: '',
                  address: '',
                  speed: '10 Mbps',
                  connection_date: new Date().toISOString().slice(0, 10),
                  line_charge: 1000,
                  line_charge_paid: 1000,
                  monthly_fee: 800,
                  billing_cycle_end: (() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 1);
                    return d.toISOString().slice(0, 10);
                  })(),
                  supplier_id: suppliers[0] ? suppliers[0].id : '',
                  supplier_name: suppliers[0] ? suppliers[0].supplier_name : '',
                  supplier_cost: 450,
                  ip_address: '',
                  pppoe_username: '',
                  payment_status: 'Due',
                  status: 'Active',
                  note: ''
                });
                setShowAddCustomerModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-sky-500/25 cursor-pointer"
            >
              <UserPlus size={16} />
              {txt('নতুন আইএসপি গ্রাহক যোগ করুন', 'Add New ISP Customer')}
            </button>

            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition cursor-pointer"
              title={txt('রিফ্রেশ করুন', 'Refresh')}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* সাব-ট্যাবস মেনু */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/10 text-xs">
          <button
            onClick={() => setActiveSubTab('customers')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'customers'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Users size={15} />
            {txt('গ্রাহক তালিকা ও বিলিং', 'Customers & Billing')}
            {alert3DaysCount > 0 && (
              <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse shadow-sm">
                {alert3DaysCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('bills_receipts')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'bills_receipts'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText size={15} />
            {txt('বিল ও মানি রিসিপ্ট (সংরক্ষিত)', 'Saved Bills & Receipts')}
            {savedPayments.length > 0 && (
              <span className="bg-sky-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm font-mono">
                {savedPayments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'suppliers'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Server size={15} />
            {txt('আপস্ট্রিম সাপ্লায়ার বিল', 'ISP Upstream Suppliers')}
          </button>

          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <FileText size={15} />
            {txt('আইএসপি খতিয়ান / লেজার (আলাদা)', 'ISP Dedicated Ledger')}
          </button>

          <button
            onClick={() => setActiveSubTab('profit_loss')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'profit_loss'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <PieChart size={15} />
            {txt('আইএসপি লাভ-ক্ষতি হিসাব (আলাদা)', 'ISP Separate Profit & Loss')}
          </button>
        </div>
      </div>

      {/* ২. সারাংশ স্ট্যাটাস কার্ডস */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* মোট গ্রাহক */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {txt('মোট সক্রিয় গ্রাহক', 'Total Active Customers')}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {customers.length}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {txt('সম্ভাব্য বিল: ৳', 'Potential: ৳')}{totalMonthlyPotential.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={22} />
          </div>
        </div>

        {/* ৩ দিনের লাল সতর্কতা অ্যালার্ট কার্ড */}
        <div 
          onClick={() => { setCustomerFilter('alert3days'); setActiveSubTab('customers'); }}
          className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition ${
            alert3DaysCount > 0 
              ? 'bg-red-50/90 border-red-300 text-red-950 shadow-red-200/50 hover:bg-red-100/90 ring-2 ring-red-400/50' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              <p className="text-[11px] font-black uppercase tracking-wider text-red-700">
                {txt('৩ দিনের লাল সতর্কতা', '3-Day Red Alert')}
              </p>
            </div>
            <h3 className="text-2xl font-black text-red-950 mt-1 font-mono">
              {alert3DaysCount} <span className="text-xs font-normal">{txt(' জন গ্রাহক', ' users')}</span>
            </h3>
            <p className="text-[11px] text-red-800 font-semibold mt-0.5">
              {txt('মেয়াদ শেষ হতে ৩ দিন বা কম বাকি', 'Renewal in <= 3 days')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-600/30">
            <AlertTriangle size={22} className="animate-bounce" />
          </div>
        </div>

        {/* পরিশোধিত গ্রাহক (নীল স্ট্যাটাস) */}
        <div 
          onClick={() => { setCustomerFilter('paid'); setActiveSubTab('customers'); }}
          className="bg-blue-50/70 border border-blue-200/90 p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-blue-100/80 transition"
        >
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-blue-700">
              {txt('পরিশোধিত গ্রাহক (নীল)', 'Paid Customers (Blue)')}
            </p>
            <h3 className="text-2xl font-black text-blue-950 mt-1 font-mono">
              {paidCustomersCount} <span className="text-xs font-normal">{txt(' জন গ্রাহক', ' users')}</span>
            </h3>
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">
              {txt('লাল সতর্কতা মুক্ত ও সক্রিয়', 'Active & Red alert cleared')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* আপস্ট্রিম সাপ্লায়ার সংখ্যা */}
        <div 
          onClick={() => setActiveSubTab('suppliers')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {txt('আপস্ট্রিম প্রোভাইডার', 'Upstream Providers')}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {suppliers.length}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {txt('কাস্টমার ভিত্তিক ব্যান্ডউইথ ফিড', 'Customer-wise bandwidth feed')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Server size={22} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ================= সাব-ট্যাব ১: গ্রাহক তালিকা ও বিলিং ===================== */}
      {/* ========================================================================= */}
      {activeSubTab === 'customers' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
          
          {/* সার্চ ও ফিল্টার কন্ট্রোল বার */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* সার্চ ইনপুট */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={txt('গ্রাহকের নাম, মোবাইল, ঠিকানা বা আইপি দিয়ে খুঁজুন...', 'Search by customer name, mobile, address or IP...')}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* ফিল্টার পিলস (অল, ৩ দিনের লাল সতর্কতা, নীল পরিশোধিত, বকেয়া) */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setCustomerFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  customerFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {txt('সব গ্রাহক', 'All')} ({customers.length})
              </button>

              <button
                onClick={() => setCustomerFilter('alert3days')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  customerFilter === 'alert3days'
                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400/50'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <AlertTriangle size={13} />
                {txt('🚨 ৩ দিনের লাল সতর্কতা', '🚨 3-Day Red Alert')} ({alert3DaysCount})
              </button>

              <button
                onClick={() => setCustomerFilter('paid')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  customerFilter === 'paid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <CheckCircle2 size={13} />
                {txt('💙 পরিশোধিত (নীল)', '💙 Paid (Blue)')} ({paidCustomersCount})
              </button>

              <button
                onClick={() => setCustomerFilter('due')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  customerFilter === 'due'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                {txt('বকেয়া গ্রাহক', 'Due Customers')}
              </button>

              {/* স্পিড ফিল্টার সিলেক্টর */}
              <select
                value={speedFilter}
                onChange={(e) => setSpeedFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="all">{txt('সকল স্পিড', 'All Speeds')}</option>
                {SPEED_PRESETS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* গ্রাহক টেবিল */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center">{txt('স্ট্যাটাস', 'Status')}</th>
                  <th className="py-3 px-3">{txt('গ্রাহকের নাম ও মোবাইল', 'Customer Name & Mobile')}</th>
                  <th className="py-3 px-3">{txt('ঠিকানা', 'Address')}</th>
                  <th className="py-3 px-3 text-center">{txt('স্পিড', 'Speed')}</th>
                  <th className="py-3 px-3 text-center">{txt('সংযোগ তারিখ', 'Connection Date')}</th>
                  <th className="py-3 px-3 text-right">{txt('লাইন চার্জ', 'Line Charge')}</th>
                  <th className="py-3 px-3 text-right">{txt('মাসিক ফি', 'Monthly Fee')}</th>
                  <th className="py-3 px-3 text-center">{txt('মাস পূর্ণের তারিখ', 'Due Date')}</th>
                  <th className="py-3 px-3 text-center">{txt('অবশিষ্ট দিন', 'Remaining Days')}</th>
                  <th className="py-3 px-3">{txt('আপস্ট্রিম প্রোভাইডার', 'Upstream Provider')}</th>
                  <th className="py-3 px-3 text-center">{txt('অ্যাকশন', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="py-8 text-center text-slate-500 font-medium">
                      {txt('কোনো আইএসপি গ্রাহক পাওয়া যায়নি।', 'No ISP customers found.')}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const dues = calculateCustomerDues(c);
                    const days = c.days_remaining;
                    const isAlert = c.is_alert_active === 1 || (days <= 3 && c.payment_status !== 'Paid') || (dues.unpaid_months > 1 && c.payment_status !== 'Paid');
                    const isPaid = c.payment_status === 'Paid';

                    // কালার থিমিং:
                    // ৩ দিন বাকি থাকলে বা মেয়াদ উত্তীর্ণ হলে: স্পষ্ট লাল ব্যাকগ্রাউন্ড ও বর্ডার
                    // বিল পরিশোধ করা হলে: লাল সতর্কতা মুছে সুন্দর শান্ত নীল ব্যাকগ্রাউন্ড
                    let rowBgClass = 'bg-white hover:bg-slate-50 text-slate-800';
                    if (isAlert) {
                      rowBgClass = 'bg-red-50/90 hover:bg-red-100/90 text-red-950 border-l-4 border-l-red-600 font-medium';
                    } else if (isPaid) {
                      rowBgClass = 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-950 border-l-4 border-l-blue-600 font-medium';
                    }

                    return (
                      <tr key={c.id} className={`${rowBgClass} transition`}>
                        {/* স্ট্যাটাস ব্যাজ (লাল অ্যালার্ট vs নীল পরিশোধিত) */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          {isAlert ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse shadow-sm">
                              <AlertTriangle size={11} />
                              {days <= 0 ? txt('⚠️ মেয়াদ উত্তীর্ণ', '⚠️ Expired') : `🚨 ${days} ${txt('দিন বাকি', 'days left')}`}
                            </span>
                          ) : isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-sm">
                              <CheckCircle2 size={11} />
                              {txt('✓ পরিশোধিত', '✓ Paid')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              <Clock size={11} />
                              {txt('চলতি', 'Current')} ({days} {txt('দিন', 'd')})
                            </span>
                          )}
                        </td>

                        {/* নাম ও মোবাইল */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm">{c.customer_name}</span>
                            {(c.customer_user_id || c.pppoe_username) && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                ID: {c.customer_user_id || c.pppoe_username}
                              </span>
                            )}
                          </div>
                          {c.contact_person && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                              <span className="text-slate-400">👤 {txt('কন্টাক্ট:', 'Contact:')}</span>
                              <span className="text-slate-800">{c.contact_person}</span>
                            </div>
                          )}
                          <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {c.mobile}
                          </span>
                        </td>

                        {/* ঠিকানা */}
                        <td className="py-3 px-3 max-w-[160px] truncate text-[11px]" title={c.address}>
                          {c.address || '-'}
                        </td>

                        {/* স্পিড */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="font-black px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 border border-sky-300 text-[11px]">
                            {c.speed}
                          </span>
                        </td>

                        {/* লাইন দেয়ার তারিখ */}
                        <td className="py-3 px-3 text-center font-mono text-[11px] whitespace-nowrap">
                          {c.connection_date ? c.connection_date.slice(0, 10) : '-'}
                        </td>

                        {/* লাইন চার্জ ও পরিশোধিত স্ট্যাটাস */}
                        <td className="py-3 px-3 text-right font-mono text-[11px] whitespace-nowrap">
                          <div className="font-bold text-slate-900">৳ {Number(c.line_charge || 0).toLocaleString()}</div>
                          {Number(c.line_charge || 0) > 0 && (
                            <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                              Number(c.line_charge_paid || 0) >= Number(c.line_charge || 0)
                                ? 'bg-emerald-100 text-emerald-800'
                                : Number(c.line_charge_paid || 0) <= 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {Number(c.line_charge_paid || 0) >= Number(c.line_charge || 0)
                                ? txt('✓ পরিশোধিত', '✓ Paid')
                                : Number(c.line_charge_paid || 0) <= 0
                                ? txt('⚠️ অপরিশোধিত', '⚠️ Unpaid')
                                : `${txt('বাকি: ৳', 'Due: ৳')}${(Number(c.line_charge) - Number(c.line_charge_paid)).toLocaleString()}`}
                            </span>
                          )}
                        </td>

                        {/* মাসিক সাবস্ক্রিপশন ফি ও মোট বকেয়া */}
                        <td className="py-3 px-3 text-right font-mono text-[11px] whitespace-nowrap">
                          <div className="font-bold text-sm text-blue-900">৳ {Number(c.monthly_fee).toLocaleString()}</div>
                          {dues.unpaid_months > 1 && !isPaid && (
                            <div className="mt-1">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                                ⚠️ {dues.unpaid_months} {txt('মাসের বকেয়া:', 'mo due:')} ৳ {dues.monthly_due.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {dues.total_due > 0 && !isPaid && (
                            <div className="mt-0.5 text-[11px] font-black text-rose-700">
                              {txt('মোট ডিউ: ৳ ', 'Total Due: ৳')}{dues.total_due.toLocaleString()}
                            </div>
                          )}
                        </td>

                        {/* মাস পূর্ণ হবে কখন (Due Date) */}
                        <td className="py-3 px-3 text-center font-mono text-[11px] whitespace-nowrap">
                          <span className={isAlert ? 'font-bold text-red-700 underline' : 'font-semibold'}>
                            {c.billing_cycle_end ? c.billing_cycle_end.slice(0, 10) : '-'}
                          </span>
                        </td>

                        {/* অবশিষ্ট দিন কাউন্টডাউন */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-xs whitespace-nowrap">
                          {days <= 0 ? (
                            <span className="text-red-600 font-black">{txt('০ দিন (মেয়াদ শেষ)', '0 days (Expired)')}</span>
                          ) : (
                            <span className={days <= 3 ? 'text-red-600 animate-pulse' : 'text-slate-700'}>
                              {days} {txt('দিন', 'days')}
                            </span>
                          )}
                        </td>

                        {/* আপস্ট্রিম সাপ্লায়ার */}
                        <td className="py-3 px-3 text-[11px]">
                          <span className="font-semibold block truncate max-w-[120px]" title={c.supplier_name}>
                            {c.supplier_name || 'Summit/General'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {txt('খরচ: ৳', 'Cost: ৳')}{Number(c.supplier_cost || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* অ্যাকশন বাটনসমূহ (WhatsApp, Pay, Receipt, Supplier Pay, Edit, Delete) */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* সরাসরি WhatsApp সতর্কতা ও বিল বাটন */}
                            <button
                              onClick={() => handleSendWhatsAppAlert(c)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-sm"
                              title={txt('সরাসরি WhatsApp-এ বিল সতর্কতা পাঠান', 'Send bill alert directly via WhatsApp')}
                            >
                              <MessageCircle size={14} />
                            </button>

                            {/* বিল পরিশোধ গ্রহণ বাটন (Pay Quick) */}
                            <button
                              onClick={() => handleOpenPayModal(c)}
                              className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition cursor-pointer shadow-sm flex items-center gap-1"
                              title={txt('সাবস্ক্রিপশন ফি পরিশোধ গ্রহণ করুন (নীল হবে)', 'Collect subscription fee')}
                            >
                              <DollarSign size={13} />
                              {txt('বিল নিন', 'Pay')}
                            </button>

                            {/* মানি রিসিপ্ট দেখুন ও শেয়ার করুন */}
                            <button
                              onClick={() => handleViewCustomerReceipt(c)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer shadow-sm"
                              title={txt('মানি রিসিপ্ট / বিল দেখুন, প্রিন্ট বা শেয়ার করুন', 'View/Print/Share Money Receipt')}
                            >
                              <Printer size={14} />
                            </button>

                            {/* সাপ্লায়ার বিল পরিশোধ শর্টকাট */}
                            <button
                              onClick={() => handleOpenPaySupplierForCustomer(c)}
                              className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer shadow-sm"
                              title={txt('এই গ্রাহকের জন্য আপস্ট্রিম সাপ্লায়ারকে বিল পরিশোধ', 'Pay upstream supplier for this customer')}
                            >
                              <Server size={14} />
                            </button>

                            {/* এডিট ও ডিলিট বাটন (শুধুমাত্র অ্যাডমিন এর জন্য) */}
                            <button
                              onClick={() => handleEditCustomer(c)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition cursor-pointer"
                              title={txt('গ্রাহকের তথ্য এডিট করুন', 'Edit Customer Info')}
                            >
                              <Edit size={14} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteCustomer(c)}
                                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition cursor-pointer"
                                title={txt('মুছে ফেলুন', 'Delete')}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= সাব-ট্যাব: সংরক্ষিত বিল ও মানি রিসিপ্ট তালিকা ============= */}
      {/* ========================================================================= */}
      {activeSubTab === 'bills_receipts' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
          
          {/* সার্চ ও ফিল্টার কন্ট্রোল বার */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* সার্চ ইনপুট */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={txt('রশিদ নং, বিল নং, গ্রাহকের নাম বা মোবাইল দিয়ে খুঁজুন...', 'Search by receipt no, bill no, name or mobile...')}
                value={savedPaymentsSearch}
                onChange={(e) => setSavedPaymentsSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSavedPayments()}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* ফিল্টার পিলস */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setSavedPaymentsFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  savedPaymentsFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {txt('সকল রেকর্ড', 'All')} ({savedPayments.length})
              </button>

              <button
                onClick={() => setSavedPaymentsFilter('receipt')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  savedPaymentsFilter === 'receipt'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                🧾 {txt('মানি রিসিপ্ট', 'Receipts')}
              </button>

              <button
                onClick={() => setSavedPaymentsFilter('bill')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  savedPaymentsFilter === 'bill'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                📄 {txt('মাসিক বিল', 'Bills')}
              </button>

              <button
                onClick={() => setSavedPaymentsFilter('prepaid')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  savedPaymentsFilter === 'prepaid'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                }`}
              >
                ⚡ {txt('প্রিপেইড', 'Prepaid')}
              </button>

              <button
                onClick={() => setSavedPaymentsFilter('postpaid')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  savedPaymentsFilter === 'postpaid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                📅 {txt('পোস্টপেইড', 'Postpaid')}
              </button>

              <button
                onClick={() => setSavedPaymentsFilter('paid')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  savedPaymentsFilter === 'paid'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                ✓ {txt('পরিশোধিত', 'Paid')}
              </button>

              <button
                onClick={() => setSavedPaymentsFilter('due')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  savedPaymentsFilter === 'due'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                ⚠️ {txt('বকেয়া', 'Due')}
              </button>
            </div>
          </div>

          {/* সংরক্ষিত বিল ও মানি রিসিপ্ট টেবিল */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center">{txt('নং', 'SL')}</th>
                  <th className="py-3 px-3">{txt('রশিদ / বিল নং ও তারিখ', 'Receipt / Bill No & Date')}</th>
                  <th className="py-3 px-3">{txt('গ্রাহকের নাম ও যোগাযোগ', 'Customer & Contact')}</th>
                  <th className="py-3 px-3 text-center">{txt('ডকুমেন্ট ধরণ', 'Document Type')}</th>
                  <th className="py-3 px-3 text-center">{txt('বিলিং ধরণ', 'Billing Type')}</th>
                  <th className="py-3 px-3 text-center">{txt('বিলিং মাস', 'Billing Month')}</th>
                  <th className="py-3 px-3 text-right">{txt('টাকার পরিমাণ', 'Amount (BDT)')}</th>
                  <th className="py-3 px-3 text-center">{txt('পেমেন্ট স্ট্যাটাস', 'Payment Status')}</th>
                  <th className="py-3 px-3">{txt('মাধ্যম ও আদায়কারী', 'Method & Collector')}</th>
                  <th className="py-3 px-3 text-center">{txt('অ্যাকশন', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {savedPaymentsLoading ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-500 font-medium">
                      {txt('ডাটা লোড হচ্ছে...', 'Loading data...')}
                    </td>
                  </tr>
                ) : (() => {
                  const filtered = savedPayments.filter(p => {
                    if (savedPaymentsFilter === 'receipt' && p.doc_type !== 'receipt') return false;
                    if (savedPaymentsFilter === 'bill' && p.doc_type !== 'bill') return false;
                    if (savedPaymentsFilter === 'prepaid' && p.billing_type !== 'prepaid') return false;
                    if (savedPaymentsFilter === 'postpaid' && p.billing_type !== 'postpaid') return false;
                    if (savedPaymentsFilter === 'paid' && (p.payment_status || '').toLowerCase() === 'due') return false;
                    if (savedPaymentsFilter === 'due' && (p.payment_status || '').toLowerCase() !== 'due') return false;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan="10" className="py-8 text-center text-slate-500 font-medium">
                          {txt('কোনো সংরক্ষিত বিল বা মানি রিসিপ্ট পাওয়া যায়নি।', 'No saved bills or receipts found.')}
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((p, idx) => {
                    const isDue = (p.payment_status || '').toLowerCase() === 'due';
                    const isBill = p.doc_type === 'bill' || (p.receipt_no && p.receipt_no.startsWith('ISP-BILL'));
                    const isPrepaid = p.billing_type === 'prepaid' || !p.billing_type;

                    return (
                      <tr key={p.id || idx} className="hover:bg-slate-50 transition text-slate-800">
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-blue-900 block text-xs">
                            {p.receipt_no}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                            <Calendar size={11} /> {p.payment_date ? p.payment_date.slice(0, 10) : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold block text-sm">{p.customer_name || txt('গ্রাহক', 'Customer')}</span>
                          <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {p.customer_mobile || '-'}
                          </span>
                          {p.speed && (
                            <span className="inline-block mt-0.5 text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              {p.speed}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            isBill ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          }`}>
                            {isBill ? `📄 ${txt('মাসিক বিল', 'Monthly Bill')}` : `🧾 ${txt('মানি রিসিপ্ট', 'Money Receipt')}`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            isPrepaid ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {isPrepaid ? `⚡ ${txt('প্রিপেইড', 'Prepaid')}` : `📅 ${txt('পোস্টপেইড', 'Postpaid')}`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                          {p.billing_month || '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-sm whitespace-nowrap text-blue-900">
                          ৳ {Number(p.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            isDue ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {isDue ? `⚠️ ${txt('বকেয়া', 'Due')}` : `✓ ${txt('পরিশোধিত', 'Paid')}`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          <span className="font-semibold text-slate-800 block">{p.payment_method || 'Cash'}</span>
                          <span className="text-slate-500 text-[10px]">{txt('আদায়কারী:', 'By:')} {p.received_by || 'Admin'}</span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setActiveReceipt(p);
                                setIsReceiptModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer shadow-sm"
                              title={txt('দেখুন ও প্রিন্ট / শেয়ার করুন', 'View & Print / Share')}
                            >
                              <Printer size={14} />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenEditPayment(p)}
                                  className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer border border-indigo-200"
                                  title={txt('বিল / রিসিপ্ট এডিট করুন', 'Edit Bill / Receipt')}
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCustomerPayment(p.id)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer border border-rose-200"
                                  title={txt('মুছে ফেলুন', 'Delete')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= সাব-ট্যাব ২: আপস্ট্রিম সাপ্লায়ার ও ব্যান্ডউইথ বিল ======== */}
      {/* ========================================================================= */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-6">
          {/* হেডার ও অ্যাকশন বার */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server size={18} className="text-purple-600" />
                {txt('আপস্ট্রিম ব্যান্ডউইথ সাপ্লায়ার ম্যানেজমেন্ট', 'ISP Upstream Bandwidth Suppliers')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {txt('যাদের কাছ থেকে মূল ইন্টারনেট ব্যান্ডউইথ সংযোগ নেওয়া হয় (কাস্টমার ভিত্তিক বা বাল্ক বিল পরিশোধ)', 'Upstream ISP suppliers and customer-wise bill payment')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSupplierPayForm({
                    supplier_id: suppliers[0] ? suppliers[0].id : '',
                    supplier_name: suppliers[0] ? suppliers[0].supplier_name : '',
                    customer_id: '',
                    customer_name: '',
                    bandwidth_package: '',
                    amount: '',
                    billing_month: 'চলতি মাস',
                    payment_date: new Date().toISOString().slice(0, 10),
                    payment_method: 'Bank',
                    paid_by: currentUser.fullname || 'Admin',
                    note: ''
                  });
                  setShowPaySupplierModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <DollarSign size={15} />
                {txt('সাপ্লায়ার বিল পরিশোধ করুন', 'Pay Supplier Bill')}
              </button>

              <button
                onClick={() => {
                  setEditingSupplier(null);
                  setSupplierForm({ supplier_name: '', contact_person: '', mobile: '', address: '', note: '' });
                  setShowAddSupplierModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus size={15} />
                {txt('নতুন সাপ্লায়ার যোগ করুন', 'Add Supplier')}
              </button>
            </div>
          </div>

          {/* সাপ্লায়ার কার্ড গ্রিড */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Server size={20} />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    ID #{s.id}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-sm">{s.supplier_name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {txt('যোগাযোগ:', 'Contact:')} {s.contact_person || txt('অফিস', 'Office')} | {s.mobile || '-'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{s.address || '-'}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>{txt('সংযুক্ত সক্রিয় গ্রাহক:', 'Connected Active Customers:')}</span>
                    <span className="font-bold text-slate-900 font-mono">{s.assigned_customers || 0} {txt('জন', 'users')}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>{txt('মাসিক ব্যান্ডউইথ খরচ:', 'Monthly Bandwidth Cost:')}</span>
                    <span className="font-bold text-purple-700 font-mono">৳ {Number(s.total_monthly_cost || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSupplierPayForm({
                        supplier_id: s.id,
                        supplier_name: s.supplier_name,
                        customer_id: '',
                        customer_name: '',
                        bandwidth_package: '',
                        amount: s.total_monthly_cost || '',
                        billing_month: getMonthYearName(new Date(), false, lang),
                        payment_date: new Date().toISOString().slice(0, 10),
                        payment_method: 'Bank',
                        paid_by: currentUser.fullname || 'Admin',
                        note: `${s.supplier_name} ${txt('ব্যান্ডউইথ বিল পরিশোধ', 'bandwidth bill payment')}`
                      });
                      setShowPaySupplierModal(true);
                    }}
                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition text-center cursor-pointer shadow-sm"
                  >
                    {txt('বিল পে করুন', 'Pay Bill')}
                  </button>
                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingSupplier(s);
                          setSupplierForm({
                            supplier_name: s.supplier_name,
                            contact_person: s.contact_person || '',
                            mobile: s.mobile || '',
                            address: s.address || '',
                            note: s.note || ''
                          });
                          setShowAddSupplierModal(true);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                        title={txt('সাপ্লায়ার এডিট করুন', 'Edit Supplier')}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(s)}
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition cursor-pointer"
                        title={txt('সাপ্লায়ার মুছে ফেলুন', 'Delete Supplier')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* সাপ্লায়ার পেমেন্ট হিস্ট্রি টেবিল */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText size={16} className="text-slate-600" />
              {txt('আপস্ট্রিম সাপ্লায়ার বিল পরিশোধ ইতিহাস (পেমেন্ট ভাউচার)', 'Upstream Supplier Payment History')}
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">{txt('ভাউচার নং', 'Voucher No')}</th>
                    <th className="py-2.5 px-3">{txt('তারিখ', 'Date')}</th>
                    <th className="py-2.5 px-3">{txt('সাপ্লায়ার', 'Supplier')}</th>
                    <th className="py-2.5 px-3">{txt('কাস্টমার ভিত্তিক / বিবরণ', 'Customer-wise / Particulars')}</th>
                    <th className="py-2.5 px-3">{txt('প্যাকেজ', 'Package')}</th>
                    <th className="py-2.5 px-3 text-right">{txt('টাকার পরিমাণ', 'Amount (BDT)')}</th>
                    <th className="py-2.5 px-3">{txt('বিলিং মাস', 'Billing Month')}</th>
                    <th className="py-2.5 px-3">{txt('মাধ্যম', 'Method')}</th>
                    <th className="py-2.5 px-3">{txt('পরিশোধকারী', 'Paid By')}</th>
                    {isAdmin && <th className="py-2.5 px-3 text-center">{txt('অ্যাকশন', 'Action')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {supplierPayments.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 10 : 9} className="py-6 text-center text-slate-500">
                        {txt('কোনো সাপ্লায়ার পেমেন্ট হিস্ট্রি নেই।', 'No supplier payment history.')}
                      </td>
                    </tr>
                  ) : (
                    supplierPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{p.voucher_no}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">{p.payment_date ? p.payment_date.slice(0, 10) : '-'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{p.supplier_name}</td>
                        <td className="py-2.5 px-3">
                          {p.customer_name ? (
                            <span className="font-semibold text-blue-800">{txt('গ্রাহক: ', 'Customer: ')}{p.customer_name}</span>
                          ) : (
                            <span className="text-slate-500">{txt('বাল্ক ব্যান্ডউইথ', 'Bulk Bandwidth')}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">{p.bandwidth_package || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">৳ {Number(p.amount).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-semibold">{p.billing_month || '-'}</td>
                        <td className="py-2.5 px-3">{p.payment_method}</td>
                        <td className="py-2.5 px-3 text-slate-600">{p.paid_by || 'Admin'}</td>
                        {isAdmin && (
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditSupplierPayment(p)}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                                title={txt('এডিট করুন', 'Edit')}
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplierPayment(p)}
                                className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition cursor-pointer"
                                title={txt('মুছে ফেলুন', 'Delete')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= সাব-ট্যাব ৩: আইএসপি পৃথক লেজার (দোকান থেকে আলাদা) ==== */}
      {/* ========================================================================= */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          
          {/* লেজার নোটিশ বার */}
          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-3.5 flex items-start gap-3 text-amber-900 text-xs">
            <Shield size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {txt('আইএসপি ইন্টারনেট ম্যানেজমেন্ট সিস্টেমের লেজার দোকানের মূল লেজার ও হিসাব থেকে সম্পূর্ণ আলাদা।', 'ISP Internet Management ledger is completely separated from the store\'s main ledger.')}
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {txt('এই খতিয়ান শুধুমাত্র আইএসপি কালেকশন, আপস্ট্রিম ব্যান্ডউইথ সাপ্লায়ার পেমেন্ট এবং আইএসপি রক্ষণাবেক্ষণ খরচের সমন্বিত হিসাব প্রদর্শন করে।', 'This ledger displays only ISP customer collections, upstream bandwidth supplier payments, and ISP maintenance expenses.')}
              </p>
            </div>
          </div>

          {/* ফিল্টার বার */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setLedgerTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  ledgerTypeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {txt('সকল লেনদেন', 'All Transactions')}
              </button>
              <button
                onClick={() => setLedgerTypeFilter('bills')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  ledgerTypeFilter === 'bills' ? 'bg-purple-700 text-white shadow-sm' : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                📄 {txt('গ্রাহক বিল ধার্য (ডেবিট)', 'Customer Bills (Debit)')}
              </button>
              <button
                onClick={() => setLedgerTypeFilter('income')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  ledgerTypeFilter === 'income' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                📥 {txt('গ্রাহক কালেকশন (জমা)', 'Customer Inflow (Credit)')}
              </button>
              <button
                onClick={() => setLedgerTypeFilter('supplier')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  ledgerTypeFilter === 'supplier' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                }`}
              >
                📤 {txt('সাপ্লায়ার পেমেন্ট', 'Supplier Payment')}
              </button>
              <button
                onClick={() => setLedgerTypeFilter('expense')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  ledgerTypeFilter === 'expense' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                🛠️ {txt('রক্ষণাবেক্ষণ খরচ', 'Maintenance Expenses')}
              </button>
            </div>

            {/* গ্রাহক ফিল্টার ও তারিখ রেঞ্জ */}
            <div className="flex flex-wrap items-center gap-2">
              {/* গ্রাহক সিলেকশন ড্রপডাউন (সমন্বিত গ্রাহক খতিয়ান) */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1">
                <Users size={14} className="text-slate-500 shrink-0" />
                <select
                  value={ledgerCustomerFilter}
                  onChange={(e) => setLedgerCustomerFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none max-w-[180px] sm:max-w-xs truncate cursor-pointer"
                  title={txt('গ্রাহক ভিত্তিক সমন্বিত বিল ও কালেকশন খতিয়ান', 'Customer integrated ledger')}
                >
                  <option value="">{txt('সকল গ্রাহক ও সাধারণ খতিয়ান', 'All Customers & General Ledger')}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      👤 {c.customer_name} ({c.customer_user_id || c.pppoe_username || c.mobile})
                    </option>
                  ))}
                </select>
                {ledgerCustomerFilter && (
                  <button
                    type="button"
                    onClick={() => setLedgerCustomerFilter('')}
                    className="text-slate-400 hover:text-slate-700 text-xs font-black cursor-pointer ml-1"
                    title={txt('গ্রাহক ফিল্টার বাতিল করুন', 'Clear customer filter')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <input
                type="date"
                value={ledgerStartDate}
                onChange={(e) => setLedgerStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <span className="text-slate-400">{txt('হতে', 'to')}</span>
              <input
                type="date"
                value={ledgerEndDate}
                onChange={(e) => setLedgerEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <button
                onClick={fetchLedger}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition cursor-pointer"
              >
                {txt('ফিল্টার', 'Filter')}
              </button>
            </div>
          </div>

          {/* লেজার সারাংশ বক্স */}
          {ledgerCustomerFilter ? (
            /* গ্রাহকভিত্তিক সমন্বিত খতিয়ান সারাংশ (Customer Integrated Ledger Summary) */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-purple-700 uppercase">{txt('মোট বিল ধার্য (দেনা / ডেবিট)', 'Total Billed (Debit)')}</p>
                  <h3 className="text-xl font-black text-purple-950 font-mono mt-0.5">
                    ৳ {Number(ledgerData.total_billed || 0).toLocaleString()}
                  </h3>
                </div>
                <FileText size={24} className="text-purple-600" />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-emerald-700 uppercase">{txt('মোট কালেকশন / জমা (পরিশোধ / ক্রেডিট)', 'Total Collected (Credit)')}</p>
                  <h3 className="text-xl font-black text-emerald-950 font-mono mt-0.5">
                    ৳ {Number(ledgerData.total_collected || ledgerData.total_inflow || 0).toLocaleString()}
                  </h3>
                </div>
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-rose-700 uppercase">{txt('গ্রাহকের বর্তমান বকেয়া (Customer Due)', 'Customer Current Due')}</p>
                  <h3 className="text-xl font-black text-rose-950 font-mono mt-0.5">
                    ৳ {Number(ledgerData.customer_due !== undefined ? ledgerData.customer_due : Math.max(0, (ledgerData.total_billed || 0) - (ledgerData.total_collected || 0))).toLocaleString()}
                  </h3>
                </div>
                <DollarSign size={24} className="text-rose-600" />
              </div>
            </div>
          ) : (
            /* সার্বিক আইএসপি লেজার সারাংশ */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-purple-700 uppercase">{txt('মোট গ্রাহক বিল ধার্য', 'Total Bills Issued')}</p>
                  <h3 className="text-lg font-black text-purple-950 font-mono mt-0.5">
                    ৳ {Number(ledgerData.total_billed || 0).toLocaleString()}
                  </h3>
                </div>
                <FileText size={20} className="text-purple-600" />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">{txt('মোট গ্রাহক কালেকশন (জমা)', 'Total Inflow (Collections)')}</p>
                  <h3 className="text-lg font-black text-emerald-950 font-mono mt-0.5">
                    ৳ {Number(ledgerData.total_collected || ledgerData.total_inflow || 0).toLocaleString()}
                  </h3>
                </div>
                <ArrowDownRight size={20} className="text-emerald-600" />
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-rose-700 uppercase">{txt('মোট আইএসপি ব্যয় (আউটফ্লো)', 'Total Expenses & Outflow')}</p>
                  <h3 className="text-lg font-black text-rose-950 font-mono mt-0.5">
                    ৳ {Number(ledgerData.total_outflow || 0).toLocaleString()}
                  </h3>
                </div>
                <ArrowUpRight size={20} className="text-rose-600" />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-blue-700 uppercase">{txt('নিট ব্যালেন্স (ক্যাশ ইন হ্যান্ড)', 'Net Cash Balance')}</p>
                  <h3 className="text-lg font-black text-blue-950 font-mono mt-0.5">
                    ৳ {Number(ledgerData.net_balance || 0).toLocaleString()}
                  </h3>
                </div>
                <DollarSign size={20} className="text-blue-600" />
              </div>
            </div>
          )}

          {/* লেজার টেবিল */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-700 text-white text-[11px] uppercase tracking-wider print:bg-gray-700 print:text-white">
                  <th className="py-2.5 px-3">{txt('তারিখ', 'Date')}</th>
                  <th className="py-2.5 px-3">{txt('ভাউচার / রিসিট নং', 'Voucher / Receipt No')}</th>
                  <th className="py-2.5 px-3">{txt('লেনদেনের ধরন', 'Type')}</th>
                  <th className="py-2.5 px-3">{txt('বিবরণ', 'Particulars')}</th>
                  <th className="py-2.5 px-3">{txt('গ্রাহক / পার্টি', 'Customer / Party')}</th>
                  <th className="py-2.5 px-3 text-right text-rose-200">{txt('দেনা / বিল ধার্য (৳)', 'Debit / Bill (৳)')}</th>
                  <th className="py-2.5 px-3 text-right text-emerald-200">{txt('পরিশোধ / কালেকশন (৳)', 'Credit / Paid (৳)')}</th>
                  <th className="py-2.5 px-3 text-right text-blue-200">{txt('ব্যালেন্স (৳)', 'Balance (৳)')}</th>
                  <th className="py-2.5 px-3">{txt('মাধ্যম', 'Method')}</th>
                  {isAdmin && <th className="py-2.5 px-3 text-center">{txt('অ্যাকশন', 'Action')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {ledgerData.ledger.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 9} className="py-8 text-center text-slate-500">
                      {txt('কোনো লেজার লেনদেন এন্ট্রি নেই।', 'No ledger entries.')}
                    </td>
                  </tr>
                ) : (
                  ledgerData.ledger.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition border-b border-slate-100">
                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-slate-600">
                        {row.trans_date ? row.trans_date.slice(0, 10) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {row.ref_no}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-[11px]">
                        {row.trans_type === 'CUSTOMER_BILL' ? (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                            📄 {txt('বিল ধার্য', 'Customer Bill')}
                          </span>
                        ) : row.trans_type === 'CUSTOMER_INCOME' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            📥 {txt('কালেকশন জমা', 'Collection')}
                          </span>
                        ) : row.trans_type === 'SUPPLIER_PAYMENT' ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                            📤 {txt('ব্যান্ডউইথ বিল', 'Bandwidth')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            🛠️ {txt('মেইনটেন্যান্স', 'Expense')}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{row.particulars}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.party_name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                        {row.debit_amount > 0 ? `৳ ${Number(row.debit_amount).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {row.credit_amount > 0 ? `৳ ${Number(row.credit_amount).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700 bg-blue-50/50 whitespace-nowrap">
                        ৳ {Number(row.balance).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600">{row.payment_method || 'Cash'}</td>
                      {isAdmin && (
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (row.trans_type === 'CUSTOMER_INCOME' || row.trans_type === 'CUSTOMER_BILL') {
                                handleDeleteCustomerPayment(row.id);
                              } else if (row.trans_type === 'SUPPLIER_PAYMENT') {
                                handleDeleteSupplierPayment(row.id);
                              } else if (row.trans_type === 'ISP_EXPENSE') {
                                handleDeleteExpense(row.id);
                              }
                            }}
                            className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition cursor-pointer"
                            title={txt('লেজার থেকে এই লেনদেন রেকর্ডটি মুছে ফেলুন', 'Delete transaction from ledger')}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              {ledgerData.ledger.length > 0 && (
                <tfoot className="border-t-2 border-gray-700 bg-slate-50 font-bold text-xs print:bg-white">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-3 text-right font-black">
                      {ledgerCustomerFilter 
                        ? txt('গ্রাহক খতিয়ানের সর্বমোট হিসাব:', 'Customer Ledger Grand Total:') 
                        : txt('লেজারের সর্বমোট হিসাব:', 'Ledger Grand Total:')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-rose-700">
                      ৳ {ledgerData.ledger.reduce((acc, r) => acc + (parseFloat(r.debit_amount) || 0), 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">
                      ৳ {ledgerData.ledger.reduce((acc, r) => acc + (parseFloat(r.credit_amount) || 0), 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-blue-800 bg-blue-100/60">
                      ৳ {Number(ledgerData.ledger[ledgerData.ledger.length - 1].balance).toLocaleString()}
                    </td>
                    <td colSpan={isAdmin ? 2 : 1}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= সাব-ট্যাব ৪: আইএসপি স্বতন্ত্র লাভ-ক্ষতি হিসাব =========== */}
      {/* ========================================================================= */}
      {activeSubTab === 'profit_loss' && (
        <div className="space-y-6">
          
          {/* হেডার ও খরচ যুক্ত করার বাটন */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChart size={18} className="text-emerald-600" />
                {txt('আইএসপি স্বতন্ত্র লাভ-ক্ষতি হিসাব (Profit & Loss Statement)', 'ISP Separate Profit & Loss')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {txt('দোকানের মূল লাভ ক্ষতির সাথে যোগ হবে না, এটি আইএসপি সেবার স্বতন্ত্র লাভ-ক্ষতি', 'Dedicated ISP Profit & Loss isolated from main store')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus size={15} />
                {txt('আইএসপি রক্ষণাবেক্ষণ খরচ যুক্ত করুন', 'Add ISP Expense')}
              </button>
            </div>
          </div>

          {/* লাভ ক্ষতি সারাংশ কার্ডস */}
          {profitLossData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* মোট আয় */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                <p className="text-[11px] font-bold text-emerald-800 uppercase">{txt('মোট আইএসপি আয়', 'Total ISP Revenue')}</p>
                <h3 className="text-2xl font-black text-emerald-950 font-mono mt-1">
                  ৳ {Number(profitLossData.revenue.total).toLocaleString()}
                </h3>
                <div className="text-[11px] text-emerald-700 mt-1 space-y-0.5">
                  <p>{txt('সাবস্ক্রিপশন ফি: ৳', 'Monthly Fee: ৳')}{Number(profitLossData.revenue.monthly_fees).toLocaleString()}</p>
                  <p>{txt('লাইন চার্জ: ৳', 'Line Charge: ৳')}{Number(profitLossData.revenue.line_charges).toLocaleString()}</p>
                </div>
              </div>

              {/* সাপ্লায়ার ব্যান্ডউইথ খরচ */}
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl">
                <p className="text-[11px] font-bold text-purple-800 uppercase">{txt('সাপ্লায়ার ব্যান্ডউইথ ব্যয়', 'Supplier Bandwidth Cost')}</p>
                <h3 className="text-2xl font-black text-purple-950 font-mono mt-1">
                  ৳ {Number(profitLossData.costs.supplier_bandwidth).toLocaleString()}
                </h3>
                <p className="text-[11px] text-purple-700 mt-1">
                  {txt('আপস্ট্রিম প্রোভাইডার ব্যান্ডউইথ ফি', 'Upstream provider bandwidth fee')}
                </p>
              </div>

              {/* অবকাঠামো ও রক্ষণাবেক্ষণ খরচ */}
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
                <p className="text-[11px] font-bold text-rose-800 uppercase">{txt('লাইন ও রক্ষণাবেক্ষণ খরচ', 'Line & Maintenance Cost')}</p>
                <h3 className="text-2xl font-black text-rose-950 font-mono mt-1">
                  ৳ {Number(profitLossData.costs.maintenance_expenses).toLocaleString()}
                </h3>
                <p className="text-[11px] text-rose-700 mt-1">
                  {txt('ফাইবার তার, অনু, সরঞ্জাম ও টেকনিক্যাল', 'Fiber cable, ONU, tools & technical')}
                </p>
              </div>

              {/* নিট আইএসপি লাভ */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/20">
                <p className="text-[11px] font-bold text-blue-200 uppercase">{txt('নিট আইএসপি লাভ (Net Profit)', 'Net ISP Profit')}</p>
                <h3 className="text-2xl font-black font-mono mt-1">
                  ৳ {Number(profitLossData.profit.net_profit).toLocaleString()}
                </h3>
                <p className="text-[11px] text-blue-100 mt-1 font-semibold">
                  {txt('প্রফিট মার্জিন:', 'Profit Margin:')} {profitLossData.profit.margin_percentage}%
                </p>
              </div>
            </div>
          )}

          {/* কাস্টমার ভিত্তিক লাভ মার্জিন বিশ্লেষণ টেবিল */}
          {profitLossData && profitLossData.customer_margins && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                {txt('কাস্টমার ভিত্তিক লাভ মার্জিন বিশ্লেষণ (Customer-wise Profitability)', 'Customer-wise Profit Margin')}
              </h3>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">{txt('গ্রাহকের নাম ও মোবাইল', 'Customer Name & Mobile')}</th>
                      <th className="py-2.5 px-3 text-center">{txt('স্পিড', 'Speed')}</th>
                      <th className="py-2.5 px-3">{txt('আপস্ট্রিম প্রোভাইডার', 'Upstream Provider')}</th>
                      <th className="py-2.5 px-3 text-right">{txt('গ্রাহক ফি (আয়)', 'Customer Fee (Rev)')}</th>
                      <th className="py-2.5 px-3 text-right">{txt('সাপ্লায়ার ফি (ব্যয়)', 'Supplier Fee (Cost)')}</th>
                      <th className="py-2.5 px-3 text-right text-emerald-300">{txt('মাসিক নিট লাভ', 'Monthly Net Profit')}</th>
                      <th className="py-2.5 px-3 text-right">{txt('মোট আদায়কৃত', 'Total Collected')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {profitLossData.customer_margins.map((cm) => {
                      const margin = parseFloat(cm.estimated_monthly_margin) || 0;
                      return (
                        <tr key={cm.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block">{cm.customer_name}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{cm.mobile}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700">{cm.speed}</td>
                          <td className="py-2.5 px-3 font-semibold">{cm.supplier_name || 'Summit/General'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">৳ {Number(cm.monthly_fee).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-purple-700">৳ {Number(cm.supplier_cost).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                            ৳ {Number(margin).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">৳ {Number(cm.total_collected).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* আইএসপি রক্ষণাবেক্ষণ ও লাইন খরচ তালিকা (হিস্ট্রি) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText size={16} className="text-rose-600" />
                {txt('আইএসপি রক্ষণাবেক্ষণ ও লাইন খরচ তালিকা (Expense History)', 'ISP Maintenance & Line Expense History')}
              </h3>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    setExpenseForm({
                      expense_title: '',
                      category: 'সংযোগ ও লাইন রক্ষণাবেক্ষণ',
                      amount: '',
                      expense_date: new Date().toISOString().slice(0, 10),
                      paid_by: currentUser.fullname || 'Admin',
                      note: ''
                    });
                    setShowAddExpenseModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  {txt('নতুন খরচ যুক্ত করুন', 'Add Expense')}
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">{txt('তারিখ', 'Date')}</th>
                    <th className="py-2.5 px-3">{txt('খরচের বিবরণ', 'Expense Details')}</th>
                    <th className="py-2.5 px-3">{txt('ক্যাটাগরি', 'Category')}</th>
                    <th className="py-2.5 px-3 text-right">{txt('পরিমাণ (টাকা)', 'Amount (BDT)')}</th>
                    <th className="py-2.5 px-3">{txt('পরিশোধকারী', 'Paid By')}</th>
                    <th className="py-2.5 px-3">{txt('নোট', 'Note')}</th>
                    {isAdmin && <th className="py-2.5 px-3 text-center">{txt('অ্যাকশন', 'Action')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="py-6 text-center text-slate-500">
                        {txt('কোনো আইএসপি খরচ রেকর্ড নেই।', 'No ISP expenses recorded.')}
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          {exp.expense_date ? exp.expense_date.slice(0, 10) : '-'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{exp.expense_title}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{exp.category}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                          ৳ {Number(exp.amount).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{exp.paid_by || 'Admin'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{exp.note || '-'}</td>
                        {isAdmin && (
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditExpense(exp)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                                title={txt('এডিট করুন', 'Edit')}
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp)}
                                className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition cursor-pointer"
                                title={txt('মুছে ফেলুন', 'Delete')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= মোডাল ১: নতুন গ্রাহক যোগ / এডিট মোডাল =================== */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    {editingCustomer ? txt('গ্রাহকের তথ্য এডিট করুন', 'Edit ISP Customer') : txt('নতুন আইএসপি গ্রাহক যোগ করুন', 'Add New ISP Customer')}
                  </h3>
                  <p className="text-[11px] text-sky-200/80">
                    {txt('ইন্টারনেট সংযোগ, প্যাকেজ স্পিড, লাইন চার্জ ও মাসিক সাবস্ক্রিপশন ফি', 'Internet connection, package speed, line charge & monthly subscription fee')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {/* কাস্টমার ইউজার আইডি, নাম, কন্টাক্ট পারসন ও মোবাইল */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{txt('কাস্টমার ইউজার আইডি', 'Customer User ID')}</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{txt('(বিলের রেফারেন্স)', 'Bill Ref')}</span>
                  </label>
                  <input
                    type="text"
                    placeholder={txt('যেমন: FC-1024 বা USER01', 'e.g. FC-1024')}
                    value={customerForm.customer_user_id}
                    onChange={(e) => setCustomerForm({ ...customerForm, customer_user_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-blue-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold text-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('কাস্টমারের নাম', 'Customer Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={txt('যেমন: মোরশেদ আলম', 'e.g. Morshed Alam')}
                    value={customerForm.customer_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, customer_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('কন্টাক্ট পারসন', 'Contact Person')}
                  </label>
                  <input
                    type="text"
                    placeholder={txt('যেমন: ম্যানেজার / দায়িত্বপ্রাপ্ত ব্যক্তি', 'e.g. Manager / Rep')}
                    value={customerForm.contact_person || ''}
                    onChange={(e) => setCustomerForm({ ...customerForm, contact_person: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('মোবাইল নাম্বার', 'Mobile Number')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={txt('যেমন: 01812091939', 'e.g. 01812091939')}
                    value={customerForm.mobile}
                    onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* ঠিকানা */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('গ্রাহকের ঠিকানা', 'Customer Address')}</label>
                <input
                  type="text"
                  placeholder={txt('যেমন: বাড়ি নং ১২, রোড ৩, আগ্রাবাদ, চট্টগ্রাম', 'e.g. Agrabad, Chattogram')}
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* ইন্টারনেট স্পিড ও লাইন দেয়ার তারিখ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('ইন্টারনেট স্পিড', 'Internet Speed')} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={customerForm.speed}
                      onChange={(e) => setCustomerForm({ ...customerForm, speed: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-bold text-blue-900"
                    >
                      {SPEED_PRESETS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="Custom">{txt('কাস্টম স্পিড...', 'Custom speed...')}</option>
                    </select>
                    {customerForm.speed === 'Custom' && (
                      <input
                        type="text"
                        placeholder={txt('যেমন: 25 Mbps', 'e.g. 25 Mbps')}
                        onChange={(e) => setCustomerForm({ ...customerForm, speed: e.target.value })}
                        className="px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('লাইন দেয়ার তারিখ', 'Connection Date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={customerForm.connection_date}
                    onChange={(e) => setCustomerForm({ ...customerForm, connection_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                {/* সংযোগ তারিখ ৩-৪ মাস বা তার বেশি আগের হলে লাইভ বকেয়া নোটিশ */}
                {customerForm.payment_status !== 'Paid' && (() => {
                  const modalLiveDues = calculateCustomerDues(customerForm);
                  if (modalLiveDues.unpaid_months > 1) {
                    return (
                      <div className="col-span-1 md:col-span-2 p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 text-xs">
                        <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                          <span>{txt(`সংযোগ তারিখ ${modalLiveDues.unpaid_months} মাস আগের (${customerForm.connection_date}) - সঞ্চিত বকেয়া হিসাব`, `Connection date is ${modalLiveDues.unpaid_months} months ago`)}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-amber-200 font-mono text-[11px]">
                          <div>
                            <span className="text-slate-600 text-[10px] block font-sans">{txt('বকেয়া মাস:', 'Due Months:')}</span>
                            <span className="font-bold text-amber-900">{modalLiveDues.unpaid_months} {txt('মাস', 'months')}</span>
                          </div>
                          <div>
                            <span className="text-slate-600 text-[10px] block font-sans">{txt('মাসিক সাবস্ক্রিপশন ডিউ:', 'Monthly Due:')}</span>
                            <span className="font-bold text-amber-900">৳ {modalLiveDues.monthly_due.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-600 text-[10px] block font-sans">{txt('লাইন চার্জ ডিউ:', 'Line Charge Due:')}</span>
                            <span className="font-bold text-amber-900">৳ {modalLiveDues.unpaid_line_charge.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-600 text-[10px] block font-sans">{txt('সর্বমোট ডিউ (এক বিলে):', 'Total Due (One Bill):')}</span>
                            <span className="font-black text-rose-700 text-sm">৳ {modalLiveDues.total_due.toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-amber-800 mt-1.5 font-medium font-sans">
                          ✓ {txt('গ্রাহক যুক্ত হওয়ার পর এই সম্পূর্ণ বকেয়া এক বিলে ও মানি রিসিপ্টে স্বয়ংক্রিয়ভাবে দেখাবে।', 'This full accumulated due will show automatically in one bill.')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* লাইন চার্জ ও পরিশোধিত স্ট্যাটাস এবং মাসিক ফি */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <DollarSign size={14} className="text-blue-600" />
                    {txt('লাইন সংযোগ চার্জ ও সাবস্ক্রিপশন ফি', 'Line Charge & Monthly Fee')}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">{txt('লাইন চার্জ স্ট্যাটাস:', 'Line Charge Status:')}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full ${
                      Number(customerForm.line_charge_paid || 0) >= Number(customerForm.line_charge || 0)
                        ? 'bg-emerald-100 text-emerald-800'
                        : Number(customerForm.line_charge_paid || 0) <= 0
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {Number(customerForm.line_charge_paid || 0) >= Number(customerForm.line_charge || 0)
                        ? txt('✓ সম্পূর্ণ পরিশোধিত', '✓ Fully Paid')
                        : Number(customerForm.line_charge_paid || 0) <= 0
                        ? txt('⚠️ অপরিশোধিত (Unpaid)', '⚠️ Unpaid / Due')
                        : `${txt('আংশিক (বাকি: ৳', 'Partial (Due: ৳')}${(Number(customerForm.line_charge || 0) - Number(customerForm.line_charge_paid || 0)).toLocaleString()})`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {txt('লাইন চার্জ (টাকা)', 'Line Charge (BDT)')}
                    </label>
                    <input
                      type="number"
                      value={customerForm.line_charge}
                      onChange={(e) => setCustomerForm({ ...customerForm, line_charge: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {txt('পরিশোধিত লাইন চার্জ', 'Paid Line Charge')}
                    </label>
                    <input
                      type="number"
                      value={customerForm.line_charge_paid}
                      onChange={(e) => setCustomerForm({ ...customerForm, line_charge_paid: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none font-mono font-bold"
                    />
                    {/* কুইক টগল বাটন: পরিশোধিত vs অপরিশোধিত */}
                    <div className="flex gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setCustomerForm({ ...customerForm, line_charge_paid: customerForm.line_charge || 1000 })}
                        className={`flex-1 py-1 px-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center justify-center gap-1 ${
                          Number(customerForm.line_charge_paid || 0) > 0
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        <Check size={11} /> {txt('পরিশোধিত', 'Paid')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerForm({ ...customerForm, line_charge_paid: 0 })}
                        className={`flex-1 py-1 px-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center justify-center gap-1 ${
                          Number(customerForm.line_charge_paid || 0) <= 0
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        <X size={11} /> {txt('অপরিশোধিত', 'Unpaid')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {txt('মাসিক সাবস্ক্রিপশন ফি', 'Monthly Fee')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={customerForm.monthly_fee}
                      onChange={(e) => setCustomerForm({ ...customerForm, monthly_fee: e.target.value })}
                      className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-xl focus:bg-white focus:outline-none font-mono font-bold text-blue-900"
                    />
                  </div>
                </div>

                {/* বিলিং ধরণ: প্রিপেইড vs পোস্টপেইড */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs">
                    {txt('গ্রাহকের বিলিং ধরণ:', 'Customer Billing Type:')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomerForm({ ...customerForm, billing_type: 'prepaid' })}
                      className={`px-3 py-1 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                        customerForm.billing_type === 'prepaid'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      ⚡ {txt('প্রিপেইড (Prepaid)', 'Prepaid')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerForm({ ...customerForm, billing_type: 'postpaid' })}
                      className={`px-3 py-1 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                        customerForm.billing_type === 'postpaid'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      📅 {txt('পোস্টপেইড (Postpaid)', 'Postpaid')}
                    </button>
                  </div>
                </div>
              </div>

              {/* মাস পূর্ণ হবে কখন (Billing Cycle End Date) */}
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-2xl">
                <label className="block font-black text-red-900 mb-1 flex items-center gap-1.5">
                  <Clock size={14} className="text-red-600" />
                  {txt('মাস পূর্ণ হবে কখন (Due / Renewal Date)', 'Billing Cycle End / Renewal Date')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={customerForm.billing_cycle_end}
                  onChange={(e) => setCustomerForm({ ...customerForm, billing_cycle_end: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl focus:outline-none font-mono font-bold text-red-950"
                />
                <p className="text-[11px] text-red-700 mt-1 font-medium">
                  {txt('📌 এই তারিখের ৩ দিন আগে উক্ত কাস্টমারের ঘর লাল হয়ে স্বয়ংক্রিয় সতর্কতা দেখাবে।', '📌 3 days before this date, customer row turns red with automated alert.')}
                </p>
              </div>

              {/* আপস্ট্রিম সাপ্লায়ার ও কাস্টমার ভিত্তিক খরচ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('আপস্ট্রিম ব্যান্ডউইথ প্রোভাইডার', 'Upstream Bandwidth Provider')}</label>
                  <select
                    value={customerForm.supplier_id}
                    onChange={(e) => {
                      const selectedSup = suppliers.find(s => s.id === parseInt(e.target.value));
                      setCustomerForm({
                        ...customerForm,
                        supplier_id: e.target.value,
                        supplier_name: selectedSup ? selectedSup.supplier_name : ''
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="">{txt('সাপ্লায়ার নির্বাচন করুন...', 'Select supplier...')}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('কাস্টমার ভিত্তিক সাপ্লায়ার খরচ (টাকা)', 'Customer-wise Supplier Cost (BDT)')}</label>
                  <input
                    type="number"
                    value={customerForm.supplier_cost}
                    onChange={(e) => setCustomerForm({ ...customerForm, supplier_cost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* আইপি ও PPPoE ইউজারনেম */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('আইপি এড্রেস (IP Address)', 'IP Address')}</label>
                  <input
                    type="text"
                    placeholder={txt('যেমন: 192.168.10.45', 'e.g. 192.168.10.45')}
                    value={customerForm.ip_address}
                    onChange={(e) => setCustomerForm({ ...customerForm, ip_address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('PPPoE ইউজারনেম', 'PPPoE Username')}</label>
                  <input
                    type="text"
                    placeholder={txt('যেমন: user_morshed', 'e.g. user_morshed')}
                    value={customerForm.pppoe_username}
                    onChange={(e) => setCustomerForm({ ...customerForm, pppoe_username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* প্রারম্ভিক পেমেন্ট স্ট্যাটাস */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('সাবস্ক্রিপশন স্ট্যাটাস', 'Subscription Status')}</label>
                  <select
                    value={customerForm.payment_status}
                    onChange={(e) => setCustomerForm({ ...customerForm, payment_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-bold"
                  >
                    <option value="Due">{txt('বকেয়া (Due)', 'Due / Unpaid')}</option>
                    <option value="Paid">{txt('পরিশোধিত (Paid - নীল ঘর)', 'Paid (Blue Row)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('সংযোগ স্ট্যাটাস', 'Connection Status')}</label>
                  <select
                    value={customerForm.status}
                    onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="Active">{txt('সক্রিয় (Active)', 'Active')}</option>
                    <option value="Suspended">{txt('সাময়িক বন্ধ (Suspended)', 'Suspended')}</option>
                  </select>
                </div>
              </div>

              {/* সাবমিট বাটনসমূহ */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? txt('সংরক্ষণ হচ্ছে...', 'Saving...') : txt('সংরক্ষণ করুন', 'Save Customer')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= মোডাল ২: সাবস্ক্রিপশন ফি ও বিল তৈরি (Quick Pay & Bill) ====== */}
      {/* ========================================================================= */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <DollarSign size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    {payFormData.doc_type === 'bill' 
                      ? txt('মাসিক ইন্টারনেট বিল তৈরি ও সেভ', 'Generate & Save Monthly Internet Bill') 
                      : txt('সাবস্ক্রিপশন ফি ও মানি রিসিপ্ট প্রদান', 'Subscription Fee Payment & Receipt')}
                  </h3>
                  <p className="text-[11px] text-blue-200/80">
                    {txt('প্রিপেইড/পোস্টপেইড নির্বাচন ও স্বয়ংক্রিয় মাসের নাম সমন্বয়', 'Prepaid/Postpaid selection & automatic month naming')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayingCustomer(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              
              {/* গ্রাহকের সংক্ষিপ্ত ইনফো */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 flex justify-between items-center text-blue-950">
                <div>
                  <h4 className="font-black text-sm">{payingCustomer.customer_name}</h4>
                  <p className="text-[11px] text-blue-700 font-mono mt-0.5">📞 {payingCustomer.mobile}</p>
                  {payingCustomer.address && (
                    <p className="text-[10px] text-slate-600 mt-0.5 truncate max-w-xs">{payingCustomer.address}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-black px-2.5 py-1 rounded-lg bg-blue-200/80 text-blue-900 text-xs font-mono">
                    {payingCustomer.speed}
                  </span>
                  <p className="text-[11px] text-blue-700 mt-1 font-mono">
                    {txt('বর্তমান মেয়াদ: ', 'Current Due: ')}{payingCustomer.billing_cycle_end ? payingCustomer.billing_cycle_end.slice(0, 10) : '-'}
                  </p>
                </div>
              </div>

              {/* মাসের সংখ্যা ও বিল/পেমেন্ট নির্ধারণ (১ মাস, নির্ধারিত ২ মাস, ৩ মাস, পূর্ণ বকেয়া ইত্যাদি) */}
              {(() => {
                const dues = calculateCustomerDues(payingCustomer);
                const currentMonths = payFormData.months_count || 1;
                return (
                  <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3 text-amber-950 space-y-2.5">
                    <div className="flex items-center justify-between font-bold text-xs pb-1.5 border-b border-amber-200">
                      <span className="flex items-center gap-1.5 text-amber-900">
                        <Calendar size={15} className="text-amber-600 shrink-0" />
                        {payFormData.doc_type === 'bill'
                          ? txt('বিলিং মাসের সংখ্যা ও হিসাব নির্ধারণ:', 'Select Billing Months & Dues:')
                          : txt('কালেকশন / পেমেন্ট গ্রহণের মাসের সংখ্যা:', 'Select Months for Payment Collection:')}
                      </span>
                      {dues.unpaid_months > 1 && (
                        <span className="font-mono text-rose-700 font-black bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                          {dues.unpaid_months} {txt('মাসের বকেয়া জমা আছে', 'months accumulated due')}
                        </span>
                      )}
                    </div>

                    {/* বকেয়া ও মাসিক ফি সারাংশ */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono bg-white/70 p-2 rounded-xl border border-amber-200/70">
                      <div>
                        <span className="text-slate-600 text-[10px] block font-sans">{txt('প্রতি মাসের ফি:', 'Monthly Fee:')}</span>
                        <span className="font-bold text-slate-800">৳ {Number(payingCustomer.monthly_fee).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 text-[10px] block font-sans">{txt('নির্ধারিত মাস:', 'Selected Months:')}</span>
                        <span className="font-black text-indigo-700">{currentMonths} {txt('মাস', 'Month(s)')}</span>
                      </div>
                      {dues.unpaid_line_charge > 0 && (
                        <div>
                          <span className="text-slate-600 text-[10px] block font-sans">{txt('বকেয়া লাইন চার্জ:', 'Unpaid Line Charge:')}</span>
                          <span className="font-bold text-amber-700">৳ {dues.unpaid_line_charge.toLocaleString()}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-600 text-[10px] block font-sans">{txt('মোট হিসাব (Total):', 'Total Calculated:')}</span>
                        <span className="font-black text-rose-700 text-xs">৳ {Number(payFormData.amount || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* দ্রুত মাস সিলেকশন বাটন: ১ মাস, নির্ধারিত ২ মাস, ৩ মাস, সম্পূর্ণ বকেয়া */}
                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 mb-1.5">
                        {payFormData.doc_type === 'bill'
                          ? txt('কয় মাসের বিল তৈরি করতে চান নির্বাচন করুন (নির্ধারিত ২ মাস অপশন সহ):', 'Select billing duration (including fixed 2 months option):')
                          : txt('কয় মাসের পেমেন্ট গ্রহণ করতে চান নির্বাচন করুন:', 'Select payment duration:')}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* ১ মাস */}
                        <button
                          type="button"
                          onClick={() => handleSelectMonthCount(1)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                            Number(currentMonths) === 1
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>📅 {txt('১ মাস', '1 Month')}</span>
                          <span className="text-[10px] opacity-90 font-mono">৳ {Number(payingCustomer.monthly_fee).toLocaleString()}</span>
                        </button>

                        {/* নির্ধারিত ২ মাসের বিল / পেমেন্ট */}
                        <button
                          type="button"
                          onClick={() => handleSelectMonthCount(2)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 border relative ${
                            Number(currentMonths) === 2
                              ? 'bg-purple-700 text-white border-purple-700 shadow-sm ring-2 ring-purple-300'
                              : 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                          }`}
                          title={txt('নির্ধারিত ২ মাসের বিল বা কালেকশন তৈরি করুন', 'Bill or collect exactly 2 months')}
                        >
                          <span className="flex items-center gap-1 font-black">
                            ⚡ {txt('নির্ধারিত ২ মাস', 'Fixed 2 Months')}
                          </span>
                          <span className="text-[10px] opacity-90 font-mono font-bold">
                            ৳ {(Number(payingCustomer.monthly_fee) * 2).toLocaleString()}
                          </span>
                        </button>

                        {/* ৩ মাস */}
                        <button
                          type="button"
                          onClick={() => handleSelectMonthCount(3)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                            Number(currentMonths) === 3
                              ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>📅 {txt('৩ মাস', '3 Months')}</span>
                          <span className="text-[10px] opacity-90 font-mono">৳ {(Number(payingCustomer.monthly_fee) * 3).toLocaleString()}</span>
                        </button>

                        {/* সম্পূর্ণ বকেয়া অথবা ৬ মাস */}
                        {dues.unpaid_months > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleSelectMonthCount(dues.unpaid_months)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                              Number(currentMonths) === dues.unpaid_months
                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                            }`}
                          >
                            <span>🔥 {txt(`পূর্ণ বকেয়া (${dues.unpaid_months} মাস)`, `Full Due (${dues.unpaid_months}M)`)}</span>
                            <span className="text-[10px] opacity-90 font-mono">৳ {dues.total_due.toLocaleString()}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectMonthCount(6)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                              Number(currentMonths) === 6
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span>📅 {txt('৬ মাস', '6 Months')}</span>
                            <span className="text-[10px] opacity-90 font-mono">৳ {(Number(payingCustomer.monthly_fee) * 6).toLocaleString()}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* কাস্টম মাসের সংখ্যা ইনপুট ও স্টিপার */}
                    <div className="flex items-center justify-between pt-2 border-t border-amber-200 text-xs">
                      <span className="text-amber-900 font-bold">
                        {txt('অথবা কাস্টম কয় মাসের যুক্ত করতে চান:', 'Or enter custom month count:')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectMonthCount(Math.max(1, currentMonths - 1))}
                          className="w-7 h-7 bg-white border border-amber-300 rounded-lg font-black text-amber-900 hover:bg-amber-100 flex items-center justify-center cursor-pointer shadow-2xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="36"
                          value={currentMonths}
                          onChange={(e) => handleSelectMonthCount(e.target.value)}
                          className="w-14 px-2 py-1 text-center bg-white border border-amber-300 rounded-lg font-mono font-black text-indigo-950 focus:outline-none"
                        />
                        <span className="font-bold text-amber-900">{txt('মাস', 'Months')}</span>
                        <button
                          type="button"
                          onClick={() => handleSelectMonthCount(currentMonths + 1)}
                          className="w-7 h-7 bg-white border border-amber-300 rounded-lg font-black text-amber-900 hover:bg-amber-100 flex items-center justify-center cursor-pointer shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ১. ডকুমেন্ট টাইপ ও বিলিং ধরণ সিলেকশন (প্রিপেইড vs পোস্টপেইড) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {/* ডকুমেন্ট মোড */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('ডকুমেন্টের ধরণ:', 'Document Type:')}
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPayFormData({ ...payFormData, doc_type: 'receipt', payment_status: 'Paid' })}
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                        payFormData.doc_type === 'receipt'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      🧾 {txt('মানি রিসিপ্ট', 'Receipt')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayFormData({ ...payFormData, doc_type: 'bill' })}
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                        payFormData.doc_type === 'bill'
                          ? 'bg-purple-700 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      📄 {txt('মাসিক বিল', 'Bill')}
                    </button>
                  </div>
                </div>

                {/* বিলিং ধরণ: প্রিপেইড vs পোস্টপেইড */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('বিলিং মোড (Billing Type):', 'Billing Mode:')}
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextM = getMonthYearName(new Date(), true, lang);
                        setPayFormData({ 
                          ...payFormData, 
                          billing_type: 'prepaid',
                          billing_month: nextM
                        });
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                        payFormData.billing_type === 'prepaid'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ⚡ {txt('প্রিপেইড (Prepaid)', 'Prepaid')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currM = getMonthYearName(new Date(), false, lang);
                        setPayFormData({ 
                          ...payFormData, 
                          billing_type: 'postpaid',
                          billing_month: currM
                        });
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                        payFormData.billing_type === 'postpaid'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      📅 {txt('পোস্টপেইড (Postpaid)', 'Postpaid')}
                    </button>
                  </div>
                </div>
              </div>

              {/* ২. টাকার পরিমাণ ও বিলিং মাস */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('টাকার পরিমাণ (টাকা)', 'Amount (BDT)')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={payFormData.amount}
                    onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-xl focus:outline-none font-mono font-black text-sm text-blue-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('বিলিং মাস (Billing Month)', 'Billing Month')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={payFormData.billing_month}
                    onChange={(e) => setPayFormData({ ...payFormData, billing_month: e.target.value })}
                    placeholder={txt('যেমন: নভেম্বর ২০২৬', 'e.g. November 2026')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-bold text-indigo-950"
                  />
                  {/* অটো-ফিল কুইক বাটন */}
                  <div className="flex gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => setPayFormData({ ...payFormData, billing_month: getMonthYearName(new Date(), true, lang) })}
                      className="text-[10px] text-indigo-700 hover:underline font-bold bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                    >
                      ⚡ {txt('পরবর্তী মাস', 'Next Month')} ({getMonthYearName(new Date(), true, lang)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayFormData({ ...payFormData, billing_month: getMonthYearName(new Date(), false, lang) })}
                      className="text-[10px] text-blue-700 hover:underline font-bold bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
                    >
                      📅 {txt('চলতি মাস', 'Current')} ({getMonthYearName(new Date(), false, lang)})
                    </button>
                  </div>
                </div>
              </div>

              {/* প্রিপেইড / পোস্টপেইড নোটিশ বক্স */}
              <div className={`p-2.5 rounded-xl text-[11px] font-medium border ${
                payFormData.billing_type === 'prepaid' 
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900' 
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}>
                {payFormData.billing_type === 'prepaid' ? (
                  <span>
                    ⚡ <strong>{txt('প্রিপেইড সংযোগ:', 'Prepaid Service:')}</strong> {txt(
                      `বিলের মাস পরবর্তী মাস (${payFormData.billing_month || getMonthYearName(new Date(), true, lang)}) উল্লেখ করা হয়েছে। সংযোগ পূর্বে পরিশোধ নিশ্চিত করতে হবে।`,
                      `Billing month is set to Next Month (${payFormData.billing_month || getMonthYearName(new Date(), true, lang)}). Payment must be collected in advance.`
                    )}
                  </span>
                ) : (
                  <span>
                    📅 <strong>{txt('পোস্টপেইড সংযোগ:', 'Postpaid Service:')}</strong> {txt(
                      `বিলের মাস চলতি মাস (${payFormData.billing_month || getMonthYearName(new Date(), false, lang)}) উল্লেখ করা হয়েছে। ব্যবহার শেষে বিল পরিশোধ করা হবে।`,
                      `Billing month is set to Current Month (${payFormData.billing_month || getMonthYearName(new Date(), false, lang)}). Payment is collected after usage.`
                    )}
                  </span>
                )}
              </div>

              {/* ৩. পেমেন্ট তারিখ, মেথড ও পেমেন্ট স্ট্যাটাস */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('তারিখ', 'Date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={payFormData.payment_date}
                    onChange={(e) => setPayFormData({ ...payFormData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('পরিশোধের মাধ্যম', 'Payment Method')}
                  </label>
                  <select
                    value={payFormData.payment_method}
                    onChange={(e) => setPayFormData({ ...payFormData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-bold text-slate-800"
                  >
                    <option value="Cash">{txt('ক্যাশ (Cash)', 'Cash')}</option>
                    <option value="bKash">{txt('বিকাশ (bKash)', 'bKash')}</option>
                    <option value="Nagad">{txt('নগদ (Nagad)', 'Nagad')}</option>
                    <option value="Bank">{txt('ব্যাংক (Bank Transfer)', 'Bank Transfer')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('পেমেন্ট স্ট্যাটাস', 'Payment Status')}
                  </label>
                  <select
                    value={payFormData.payment_status}
                    onChange={(e) => setPayFormData({ ...payFormData, payment_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-bold text-slate-800"
                  >
                    <option value="Paid">{txt('✓ পরিশোধিত (Paid)', 'Paid')}</option>
                    <option value="Due">{txt('⚠️ অপরিশোধিত / বকেয়া (Due)', 'Due / Unpaid')}</option>
                  </select>
                </div>
              </div>

              {/* ৪. পরবর্তী মাস পূর্ণের তারিখ (+১ মাস স্বয়ংক্রিয়) */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                <label className="block font-bold text-emerald-900 mb-1">
                  {txt('পরবর্তী মাস পূর্ণের তারিখ (New Billing Cycle End Date) *', 'New Billing Cycle End Date *')}
                </label>
                <input
                  type="date"
                  required
                  value={payFormData.next_billing_cycle_end}
                  onChange={(e) => setPayFormData({ ...payFormData, next_billing_cycle_end: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:outline-none font-mono font-bold text-emerald-950"
                />
                <p className="text-[11px] text-emerald-700 mt-1">
                  {txt(
                    '✓ পেমেন্ট রেকর্ড করার সাথে সাথে গ্রাহকের লাল সতর্কতা মুছে নীল হয়ে যাবে এবং স্থায়ী বিল/মানি রিসিপ্ট হিসেবে সংরক্ষিত থাকবে।',
                    '✓ Recording payment clears the red alert and permanently stores the bill/receipt.'
                  )}
                </p>
              </div>

              {/* সাবমিট বাটনসমূহ */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  {loading 
                    ? txt('সংরক্ষণ হচ্ছে...', 'Saving...') 
                    : (payFormData.doc_type === 'bill' 
                        ? txt('📄 বিল সেভ ও প্রিভিউ করুন', '📄 Save Bill & Preview') 
                        : txt('🧾 পেমেন্ট সম্পন্ন ও রিসিপ্ট দেখুন', '🧾 Save Payment & View Receipt'))}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= মোডাল ৩: আপস্ট্রিম সাপ্লায়ার যোগ / এডিট ================ */}
      {/* ========================================================================= */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingSupplier ? txt('সাপ্লায়ার তথ্য এডিট', 'Edit Supplier') : txt('নতুন আপস্ট্রিম সাপ্লায়ার যোগ', 'Add Upstream Supplier')}
              </h3>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('সাপ্লায়ার / প্রোভাইডারের নাম *', 'Supplier / Provider Name *')}</label>
                <input
                  type="text"
                  required
                  placeholder={txt('যেমন: Summit Communications Ltd.', 'e.g. Summit Communications Ltd.')}
                  value={supplierForm.supplier_name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, supplier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('যোগাযোগের ব্যক্তি (Contact Person)', 'Contact Person')}</label>
                <input
                  type="text"
                  placeholder={txt('যেমন: আরমান হোসেন', 'e.g. Arman Hossain')}
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('মোবাইল নম্বর', 'Mobile Number')}</label>
                <input
                  type="text"
                  placeholder={txt('যেমন: 01711000001', 'e.g. 01711000001')}
                  value={supplierForm.mobile}
                  onChange={(e) => setSupplierForm({ ...supplierForm, mobile: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('ঠিকানা', 'Address')}</label>
                <input
                  type="text"
                  placeholder={txt('যেমন: আগ্রাবাদ, চট্টগ্রাম', 'e.g. Agrabad, Chattogram')}
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {txt('সংরক্ষণ করুন', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= মোডাল ৪: সাপ্লায়ার বিল পরিশোধ (কাস্টমার ভিত্তিক বা বাল্ক) = */}
      {/* ========================================================================= */}
      {showPaySupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
            <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    {editingSupplierPayment ? txt('আপস্ট্রিম সাপ্লায়ার বিল পেমেন্ট এডিট', 'Edit Supplier Payment Voucher') : txt('আপস্ট্রিম সাপ্লায়ার বিল পরিশোধ (কাস্টমার ভিত্তিক / ব্যান্ডউইথ)', 'Pay Upstream Supplier')}
                  </h3>
                  <p className="text-[11px] text-purple-200/80">
                    {txt('ইন্টারনেট প্রোভাইডারকে পেমেন্ট ও আইএসপি লেজারে ডেবিট এন্ট্রি', 'Payment to bandwidth provider & ISP ledger debit')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPaySupplierModal(false);
                  setEditingSupplierPayment(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePaySupplierSubmit} className="p-6 space-y-4 text-xs">
              
              {/* সাপ্লায়ার নির্বাচন */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('আপস্ট্রিম সাপ্লায়ার *', 'Upstream Supplier *')}</label>
                <select
                  required
                  value={supplierPayForm.supplier_id}
                  onChange={(e) => {
                    const sup = suppliers.find(s => s.id === parseInt(e.target.value));
                    setSupplierPayForm({
                      ...supplierPayForm,
                      supplier_id: e.target.value,
                      supplier_name: sup ? sup.supplier_name : ''
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="">{txt('সাপ্লায়ার নির্বাচন করুন...', 'Select supplier...')}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.supplier_name}</option>
                  ))}
                </select>
              </div>

              {/* কাস্টমার ভিত্তিক নির্বাচন (ঐচ্ছিক) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {txt('কাস্টমার ভিত্তিক পরিশোধ (ঐচ্ছিক)', 'Customer-wise Payment (Optional)')}
                </label>
                <select
                  value={supplierPayForm.customer_id}
                  onChange={(e) => {
                    const cust = customers.find(c => c.id === parseInt(e.target.value));
                    setSupplierPayForm({
                      ...supplierPayForm,
                      customer_id: e.target.value,
                      customer_name: cust ? cust.customer_name : '',
                      bandwidth_package: cust ? cust.speed : '',
                      amount: cust && cust.supplier_cost ? cust.supplier_cost : supplierPayForm.amount
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">{txt('বাল্ক ব্যান্ডউইথ (কোনো নির্দিষ্ট কাস্টমার নয়)', 'Bulk Bandwidth (No specific customer)')}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.customer_name} ({c.speed} - {txt('খরচ ৳', 'Cost ৳')}{c.supplier_cost})
                    </option>
                  ))}
                </select>
              </div>

              {/* টাকার পরিমাণ ও বিলিং মাস */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('পরিশোধের পরিমাণ (টাকা) *', 'Payment Amount (BDT) *')}</label>
                  <input
                    type="number"
                    required
                    value={supplierPayForm.amount}
                    onChange={(e) => setSupplierPayForm({ ...supplierPayForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-300 rounded-xl font-mono font-bold text-sm text-purple-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('বিলিং মাস', 'Billing Month')}</label>
                  <input
                    type="text"
                    value={supplierPayForm.billing_month}
                    onChange={(e) => setSupplierPayForm({ ...supplierPayForm, billing_month: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* তারিখ ও মাধ্যম */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('পরিশোধের তারিখ', 'Payment Date')}</label>
                  <input
                    type="date"
                    required
                    value={supplierPayForm.payment_date}
                    onChange={(e) => setSupplierPayForm({ ...supplierPayForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('পরিশোধের মাধ্যম', 'Payment Method')}</label>
                  <select
                    value={supplierPayForm.payment_method}
                    onChange={(e) => setSupplierPayForm({ ...supplierPayForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Bank">{txt('ব্যাংক (Bank Transfer)', 'Bank Transfer')}</option>
                    <option value="bKash">{txt('বিকাশ (bKash)', 'bKash')}</option>
                    <option value="Nagad">{txt('নগদ (Nagad)', 'Nagad')}</option>
                    <option value="Cash">{txt('ক্যাশ (Cash)', 'Cash')}</option>
                  </select>
                </div>
              </div>

              {/* নোট */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('মন্তব্য / রেফারেন্স', 'Note / Reference')}</label>
                <input
                  type="text"
                  placeholder={txt('যেমন: চেক নং #12345 বা অনলাইন ট্রানজেকশন', 'e.g. Cheque #12345 or Online TXN')}
                  value={supplierPayForm.note}
                  onChange={(e) => setSupplierPayForm({ ...supplierPayForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              {/* সাবমিট */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaySupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  {editingSupplierPayment ? txt('আপডেট নিশ্চিত করুন', 'Confirm Update') : txt('পরিশোধ সম্পন্ন করুন', 'Complete Payment')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= মোডাল ৫: আইএসপি রক্ষণাবেক্ষণ খরচ যুক্ত / এডিট করা ======= */}
      {/* ========================================================================= */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingExpense ? txt('আইএসপি রক্ষণাবেক্ষণ খরচ এডিট করুন', 'Edit ISP Maintenance Expense') : txt('আইএসপি রক্ষণাবেক্ষণ ও লাইন খরচ যুক্ত করুন', 'Add ISP Maintenance Expense')}
              </h3>
              <button
                onClick={() => {
                  setShowAddExpenseModal(false);
                  setEditingExpense(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('খরচের বিবরণ / টাইটেল *', 'Expense Description / Title *')}</label>
                <input
                  type="text"
                  required
                  placeholder={txt('যেমন: ফাইবার প্যাচ কর্ড ও স্প্লিটার ক্রয়', 'e.g. Fiber patch cord & splitter purchase')}
                  value={expenseForm.expense_title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('ক্যাটাগরি', 'Category')}</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('খরচের পরিমাণ (টাকা) *', 'Expense Amount (BDT) *')}</label>
                  <input
                    type="number"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{txt('খরচের তারিখ', 'Expense Date')}</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('নোট / মন্তব্য', 'Note / Remarks')}</label>
                <input
                  type="text"
                  placeholder={txt('অতিরিক্ত কোনো তথ্য থাকলে লিখুন', 'Optional remarks')}
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExpenseModal(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  {editingExpense ? txt('আপডেট নিশ্চিত করুন', 'Confirm Update') : txt('সংরক্ষণ করুন', 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= মোডাল ৬: মানি রিসিপ্ট ও বিল প্রিন্ট / শেয়ার মোডাল ====== */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && activeReceipt && (
        <IspReceiptPrintModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          receiptData={activeReceipt}
          lang={lang}
          onEdit={(receipt) => handleOpenEditPayment(receipt)}
        />
      )}

      {/* ========================================================================= */}
      {/* ================= মোডাল ৭: সংরক্ষিত বিল / মানি রিসিপ্ট এডিট মোডাল ========== */}
      {/* ========================================================================= */}
      {showEditPaymentModal && editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-sky-950 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Edit size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    {txt('সংরক্ষিত বিল / মানি রিসিপ্ট এডিট করুন', 'Edit Saved Bill / Money Receipt')}
                  </h3>
                  <p className="text-[11px] text-indigo-200/80">
                    {txt('রশিদ নং: ', 'Receipt/Bill No: ')}<span className="font-mono text-white font-bold">{editPaymentForm.receipt_no}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditPaymentModal(false);
                  setEditingPayment(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditPayment} className="p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              {/* গ্রাহকের নাম, ইউজার আইডি ও মোবাইল */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('ইউজার আইডি', 'User ID')}
                  </label>
                  <input
                    type="text"
                    value={editPaymentForm.customer_user_id || ''}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, customer_user_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-mono font-bold text-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('গ্রাহকের নাম', 'Customer Name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPaymentForm.customer_name}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, customer_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('মোবাইল নম্বর', 'Mobile Number')}
                  </label>
                  <input
                    type="text"
                    value={editPaymentForm.customer_mobile}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, customer_mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* ঠিকানা */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {txt('গ্রাহকের ঠিকানা', 'Customer Address')}
                </label>
                <input
                  type="text"
                  value={editPaymentForm.customer_address}
                  onChange={(e) => setEditPaymentForm({ ...editPaymentForm, customer_address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              {/* প্যাকেজ / স্পিড ও টাকার পরিমাণ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('প্যাকেজ / স্পিড', 'Package / Speed')}
                  </label>
                  <select
                    value={editPaymentForm.speed}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, speed: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-bold text-blue-900"
                  >
                    {SPEED_PRESETS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('টাকার পরিমাণ (টাকা)', 'Amount (BDT)')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={editPaymentForm.amount}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-blue-50 border border-blue-300 rounded-xl focus:outline-none font-mono font-black text-sm text-blue-950"
                  />
                </div>
              </div>

              {/* ডকুমেন্ট টাইপ, বিলিং মোড ও পেমেন্ট স্ট্যাটাস */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('ডকুমেন্ট ধরণ', 'Document Type')}
                  </label>
                  <select
                    value={editPaymentForm.doc_type}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, doc_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="receipt">🧾 {txt('মানি রিসিপ্ট', 'Receipt')}</option>
                    <option value="bill">📄 {txt('মাসিক বিল', 'Bill')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('বিলিং ধরণ', 'Billing Type')}
                  </label>
                  <select
                    value={editPaymentForm.billing_type}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, billing_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="prepaid">⚡ {txt('প্রিপেইড (Prepaid)', 'Prepaid')}</option>
                    <option value="postpaid">📅 {txt('পোস্টপেইড (Postpaid)', 'Postpaid')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('পেমেন্ট স্ট্যাটাস', 'Payment Status')}
                  </label>
                  <select
                    value={editPaymentForm.payment_status}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, payment_status: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Paid">✓ {txt('পরিশোধিত (Paid)', 'Paid')}</option>
                    <option value="Due">⚠️ {txt('বকেয়া (Due)', 'Due / Unpaid')}</option>
                  </select>
                </div>
              </div>

              {/* বিলিং মাস ও অটো ফিল বাটন */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {txt('বিলিং মাস (Billing Month)', 'Billing Month')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPaymentForm.billing_month}
                  onChange={(e) => setEditPaymentForm({ ...editPaymentForm, billing_month: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-indigo-950 focus:outline-none"
                />
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditPaymentForm({ ...editPaymentForm, billing_month: getMonthYearName(new Date(), true, lang) })}
                    className="text-[10px] text-indigo-700 hover:underline font-bold bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                  >
                    ⚡ {txt('পরবর্তী মাস', 'Next Month')} ({getMonthYearName(new Date(), true, lang)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPaymentForm({ ...editPaymentForm, billing_month: getMonthYearName(new Date(), false, lang) })}
                    className="text-[10px] text-blue-700 hover:underline font-bold bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
                  >
                    📅 {txt('চলতি মাস', 'Current')} ({getMonthYearName(new Date(), false, lang)})
                  </button>
                </div>
              </div>

              {/* তারিখ, মাধ্যম ও আদায়কারী */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('তারিখ', 'Date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={editPaymentForm.payment_date}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('মাধ্যম', 'Method')}
                  </label>
                  <select
                    value={editPaymentForm.payment_method}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-bold"
                  >
                    <option value="Cash">{txt('ক্যাশ (Cash)', 'Cash')}</option>
                    <option value="bKash">{txt('বিকাশ (bKash)', 'bKash')}</option>
                    <option value="Nagad">{txt('নগদ (Nagad)', 'Nagad')}</option>
                    <option value="Bank">{txt('ব্যাংক (Bank Transfer)', 'Bank Transfer')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {txt('আদায়কারী', 'Received By')}
                  </label>
                  <input
                    type="text"
                    value={editPaymentForm.received_by}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, received_by: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none font-semibold"
                  />
                </div>
              </div>

              {/* নোট */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{txt('নোট / বিবরণ', 'Note / Remarks')}</label>
                <input
                  type="text"
                  value={editPaymentForm.note}
                  onChange={(e) => setEditPaymentForm({ ...editPaymentForm, note: e.target.value })}
                  placeholder={txt('অতিরিক্ত কোনো তথ্য থাকলে লিখুন', 'Optional remarks')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              {/* সাবমিট বাটনসমূহ */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPaymentModal(false);
                    setEditingPayment(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  {loading ? txt('আপডেট হচ্ছে...', 'Updating...') : txt('পরিবর্তন সংরক্ষণ করুন', 'Save Changes')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
