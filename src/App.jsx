import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Users, User, Plus, X, Trash2, Printer, Search, Barcode, TrendingUp, DollarSign, 
  Edit, Edit3, History, ArrowDownRight, ArrowUpRight, LogOut, Shield, Truck, FileText, CheckCircle, 
  UserPlus, Calendar, RotateCcw, Wrench, Bell, AlertTriangle, CheckSquare, Clock, Filter, Eye, 
  AlertCircle, Receipt, Globe, Camera, Image as ImageIcon, Share2, Languages,
  RefreshCw, PackageMinus, CheckCircle2, Wifi, Database 
} from 'lucide-react';
import LoginPage from './components/LoginPage';
import { translations } from './translations';
import ShareModal from './components/ShareModal';
import ImageViewModal from './components/ImageViewModal';
import WarrantySlipPrintModal from './components/WarrantySlipPrintModal';
import DashboardView from './components/DashboardView';
import WarrantyServiceModule from './components/WarrantyServiceModule';
import IspManagementModule from './components/IspManagementModule';
import DatabaseBackupModal from './components/DatabaseBackupModal';

const MASTER_CATEGORIES = [
  "General", "CC Camera", "Router", "Motherboard", "Keyboard", "Mouse", "Laptop", "Cable",
  "Speaker", "Casing", "Processor", "Ram", "SSD", "HDD", "Power Supply", "Printer",
  "Monitor", "UPS", "Adapter", "Video Baloon", "Servicing Charge", "Projector", "Photocopier",
  "IPS", "Battery", "Camera Accessories", "Wifi Dongle", "Mobile Charger", "Data/Charging Cable",
  "Hard drive Encloser", "Laptop Accessories", "DVR", "NVR", "POE Switch", "Desktop Switch",
  "Fingerprint device", "Brand PC", "TV Monitor", "Mouse Pad", "Desktop Accessories",
  "PABX", "IP Phone", "Telephone set", "Intercom Accessories", "Public Address"
];

const EXPENSE_CATEGORIES = [
  "দোকান ভাড়া", "বিদ্যুৎ বিল", "চা/নাস্তা ও আপ্যায়ন", "যাতায়াত/পরিবহন", 
  "স্টাফ বেতন", "ইন্টারনেট বিল", "মেরামত ও রক্ষণাবেক্ষণ", "অন্যান্য খরচ"
];

// স্বয়ংক্রিয় নেটওয়ার্ক/হোস্ট ডিটেকশন (দোকান, বাসা বা ভিপিএন থেকে একই সাথে চালানোর জন্য)
const API_HOST = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
const API_BASE = `http://${API_HOST}:5010/api`;

function App() {
  // ভাষা স্টেট ও ট্রান্সলেশন হেল্পার (বাংলা এবং ইংরেজি সুইচিং)
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('pos_language') || 'bn';
    } catch {
      return 'bn';
    }
  });

  const t = (key) => {
    if (translations[lang] && translations[lang][key]) return translations[lang][key];
    if (translations['bn'] && translations['bn'][key]) return translations['bn'][key];
    return key;
  };

  const txt = (bn, en) => (lang === 'en' ? (en !== undefined ? en : bn) : bn);

  const getExpenseCategoryLabel = (cat) => {
    if (lang !== 'en') return cat;
    const map = {
      "দোকান ভাড়া": "Shop Rent",
      "বিদ্যুৎ বিল": "Electricity Bill",
      "চা/নাস্তা ও আপ্যায়ন": "Tea/Snacks & Refreshment",
      "যাতায়াত/পরিবহন": "Travel / Transport",
      "স্টাফ বেতন": "Staff Salary",
      "ইন্টারনেট বিল": "Internet Bill",
      "মেরামত ও রক্ষণাবেক্ষণ": "Repair & Maintenance",
      "অন্যান্য খরচ": "Other Expenses"
    };
    return map[cat] || cat;
  };

  const toggleLanguage = (targetLang) => {
    const next = typeof targetLang === 'string' ? targetLang : (lang === 'bn' ? 'en' : 'bn');
    setLang(next);
    try {
      localStorage.setItem('pos_language', next);
    } catch {}
  };

  // শেয়ার, ইমেজ ভিউ ও ওয়ারেন্টি স্লিপ স্টেট
  const [shareData, setShareData] = useState(null);
  const [activeImageView, setActiveImageView] = useState(null);
  const [activeWarrantySlip, setActiveWarrantySlip] = useState(null);
  const [editWarrantySlipDirect, setEditWarrantySlipDirect] = useState(null);

  // সাপ্লায়ার ক্রয় বিল সংযোজন স্টেট
  const [showSupplierPurchaseModal, setShowSupplierPurchaseModal] = useState(false);
  const [supplierPurchaseForm, setSupplierPurchaseForm] = useState({
    supplier_id: '',
    amount: '',
    note: '',
    bill_image: ''
  });
  const [stockInBillImage, setStockInBillImage] = useState('');

  // অথেন্টিকেশন ও ইউজার স্টেট (প্রথমবার বা ব্রাউজার লোড হলে অ্যাডমিনিস্ট্রেটর ও বিক্রয় প্রতিনিধির লগইন পেইজ আসবে)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pos_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const [quotationList, setQuotationList] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quotationSearch, setQuotationSearch] = useState('');
  
  // ইউজার ম্যানেজমেন্ট স্টেট
  const [usersList, setUsersList] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', fullname: '', role: 'sales' });

  // সার্ভিসিং স্টেট (ল্যাপটপ ও ডেস্কটপ সার্ভিসিং বিলের জন্য)
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    category: 'ল্যাপটপ সার্ভিসিং',
    title: '',
    model: '',
    charge: '',
    warranty: '1 month'
  });

  const [activeTab, setActiveTab] = useState('pos'); // pos, dashboard, warranty_service, isp_management, inventory, returns, barcode_search, quotation, customers, suppliers, expenses, reports
  const [ispAlertCount, setIspAlertCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [salesReports, setSalesReports] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // দৈনিক লাভ-ক্ষতি ও ব্যয় স্টেট
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailySummary, setDailySummary] = useState(null);
  const [expensesList, setExpensesList] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ category: 'চা/নাস্তা ও আপ্যায়ন', amount: '', note: '', receipt_image: '' });

  // নির্দিষ্ট বারকোড বিক্রয় ফেরত (Sales Return) স্টেট
  const [returnBarcodeScan, setReturnBarcodeScan] = useState('');
  const [verifiedBarcodeItem, setVerifiedBarcodeItem] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnForm, setReturnForm] = useState({
    refund_amount: '',
    refund_type: 'Deduce_Due',
    return_reason: 'পণ্য ত্রুটি / পরিবর্তন'
  });
  const [returnsHistoryList, setReturnsHistoryList] = useState([]);

  // প্রোডাক্ট এন্ট্রি ও এডিট স্টেট (একটি মাত্র বারকোড ফিল্ড)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', brand: '', model: '', category: 'CC Camera', barcode: '', warranty: '',
    purchase_price: '', selling_price: '', current_stock: '', alert_quantity: 5,
    supplier_id: '', bill_image: ''
  });

  // সিরিয়াল স্টক ইন স্টেট
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [stockInProduct, setStockInProduct] = useState(null);
  const [stockInSupplier, setStockInSupplier] = useState('');
  const [stockInPrice, setStockInPrice] = useState('');
  const [serialsInput, setSerialsInput] = useState('');

  // হিস্ট্রি ও প্রিন্ট মডাল স্টেট
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [productLifecycle, setProductLifecycle] = useState(null);
  const [showStockPrint, setShowStockPrint] = useState(false);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [supplierLedger, setSupplierLedger] = useState(null);
  const [supplierTransactions, setSupplierTransactions] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', company: '', mobile: '', address: '' });
  const [supplierPayModal, setSupplierPayModal] = useState(null);
  const [supplierPayAmount, setSupplierPayAmount] = useState('');

  // ডাটাবেজ ব্যাকআপ ও রিস্টোর মডাল স্টেট
  const [showBackupModal, setShowBackupModal] = useState(false);

  // কাস্টমার পেমেন্ট ও মানি রিসিপ্ট স্টেট
  const [payModal, setPayModal] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('Cash');
  const [collectNote, setCollectNote] = useState('');
  const [activeMoneyReceipt, setActiveMoneyReceipt] = useState(null);

  // POS কার্ট ও ইনভয়েস স্টেট (কাস্টমার অটো-সাজেশন সহ)
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [billNote, setBillNote] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [invoiceDocTitle, setInvoiceDocTitle] = useState('');
  const [showInvoiceTitlePresets, setShowInvoiceTitlePresets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef(null);

  // ইনভয়েস এডিট ও নতুন পণ্য সংযোজন স্টেট
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerMobile, setEditCustomerMobile] = useState('');
  const [editItems, setEditItems] = useState([]);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editAdditionalPaid, setEditAdditionalPaid] = useState('');
  const [editPaymentType, setEditPaymentType] = useState('Cash');
  const [editNote, setEditNote] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editProductSelectId, setEditProductSelectId] = useState('');
  const [editProductQty, setEditProductQty] = useState(1);
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductWarranty, setEditProductWarranty] = useState('');
  const [editProductModel, setEditProductModel] = useState('');
  const [editProductSerials, setEditProductSerials] = useState([]);
  const [editProductSerialInput, setEditProductSerialInput] = useState('');
  const [editProductSearch, setEditProductSearch] = useState('');

  // ইনভয়েসে ওয়ারেন্টি পণ্য সিরিয়াল পরিবর্তন স্টেট (পরিবর্তিত ট্যাগ সহ)
  const [changingSerialIndex, setChangingSerialIndex] = useState(null);
  const [oldSerialToReplace, setOldSerialToReplace] = useState('');
  const [newSerialInput, setNewSerialInput] = useState('');

  // নন-বারকোড পণ্য ফেরত স্টেট
  const [returnMode, setReturnMode] = useState('barcode'); // 'barcode' | 'manual'
  const [manualInvoiceSearch, setManualInvoiceSearch] = useState('');
  const [manualInvoiceData, setManualInvoiceData] = useState(null);
  const [selectedReturnItem, setSelectedReturnItem] = useState(null);
  const [manualReturnForm, setManualReturnForm] = useState({
    quantity: 1,
    refund_amount: '',
    refund_type: 'Deduce_Due',
    return_reason: 'পণ্য ফেরত / পরিবর্তন'
  });

  // তারিখ ফরম্যাট হেল্পার: সব জায়গায় date/month/year (DD/MM/YYYY)
  const formatDateDMY = (dateInput) => {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // তারিখ ও সময় ফরম্যাট হেল্পার
  const formatDateTimeDMY = (dateInput) => {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  // সংখ্যা থেকে বাংলায় কথায় রূপান্তর হেল্পার (Amount in Words)
  const numberToWordsBn = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '';
    const n = Math.floor(Number(num));
    if (n === 0) return 'শূন্য টাকা মাত্র';
    const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 
      'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
      'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ', 'ত্রিশ',
      'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্তিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ', 'চল্লিশ',
      'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ', 'পঞ্চাশ',
      'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট', 'ষাট',
      'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেচল্লিশ', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর', 'সত্তর',
      'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আঠাত্তর', 'ঊনআশি', 'আশি',
      'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'অষ্টআশি', 'ঊননব্বই', 'নব্বই',
      'একানব্বই', 'বানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'];

    const convertLessThanOneThousand = (val) => {
      let res = '';
      if (val >= 100) {
        const h = Math.floor(val / 100);
        res += (h === 1 ? 'একশত ' : units[h] + ' শত ');
        val %= 100;
      }
      if (val > 0) {
        res += units[val] + ' ';
      }
      return res;
    };

    let crore = Math.floor(n / 10000000);
    let remainder = n % 10000000;
    let lakh = Math.floor(remainder / 100000);
    remainder %= 100000;
    let thousand = Math.floor(remainder / 1000);
    remainder %= 1000;

    let words = '';
    if (crore > 0) words += convertLessThanOneThousand(crore) + 'কোটি ';
    if (lakh > 0) words += units[lakh] + ' লক্ষ ';
    if (thousand > 0) words += units[thousand] + ' হাজার ';
    if (remainder > 0) words += convertLessThanOneThousand(remainder);

    return words.trim() + ' টাকা মাত্র';
  };

  // বিভিন্ন ট্যাবের সার্চ ফিল্টার স্টেট
  const [customerSearch, setCustomerSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [reportSearch, setReportSearch] = useState('');

  // কোটেশন স্টেট
  const [quotationCustomer, setQuotationCustomer] = useState('');
  const [quotationMobile, setQuotationMobile] = useState('');
  const [quotationAddress, setQuotationAddress] = useState('');
  const [quotationSubject, setQuotationSubject] = useState('QUOTATION / মূল্য প্রস্তাবনা');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [quotationValid, setQuotationValid] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [quotationNote, setQuotationNote] = useState('');
  const [quotationTerms, setQuotationTerms] = useState(
`১. এই কোটেশনটি জমা দেওয়ার তারিখ থেকে এক (১) সপ্তাহ পর্যন্ত কার্যকর থাকবে।
২. পণ্য সরবরাহের সময় ৫০ শতাংশ এবং সরবরাহ ও ইনস্টলেশন সম্পন্ন হওয়ার পর সম্পূর্ণ অর্থ নগদে অথবা চেকের মাধ্যমে পরিশোধ করতে হবে।
৩. উপরোক্ত মূল্যসমূহ VAT এবং প্রযোজ্য সকল কর ব্যতীত।`
  );
  const [quotationItems, setQuotationItems] = useState([
    { id: 1, name: '', warranty: '1 Year', qty: 1, unit_price: '', total_price: '' }
  ]);
  const [quotationSubTab, setQuotationSubTab] = useState('create'); // 'create' | 'history'
  const [activeQuotationPrint, setActiveQuotationPrint] = useState(null);

  // চেক ট্র্যাকিং ও এলার্ট স্টেট
  const [chequeAlerts, setChequeAlerts] = useState([]);
  const [allCheques, setAllCheques] = useState([]);
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [chequeBank, setChequeBank] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().slice(0, 10));
  const [depositDate, setDepositDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  // ক্যাশ ড্রয়ার ও অমীমাংসিত হিসাব স্টেট
  const [actualCashInput, setActualCashInput] = useState('');
  const [unsettledNote, setUnsettledNote] = useState('');
  const [cashReconciliationsList, setCashReconciliationsList] = useState([]);

  // লেজার তারিখ ফিল্টার স্টেট
  const [custLedgerFromDate, setCustLedgerFromDate] = useState('');
  const [custLedgerToDate, setCustLedgerToDate] = useState('');
  const [suppLedgerFromDate, setSuppLedgerFromDate] = useState('');
  const [suppLedgerToDate, setSuppLedgerToDate] = useState('');

  // কথায় টাকার পরিমাণ (Number to Words Helper)
  const numberToWords = (num) => {
    if (!num || isNaN(num) || Number(num) <= 0) return 'Zero Taka Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n) => {
      let str = '';
      if (n > 9999999) {
        str += inWords(Math.floor(n / 10000000)) + 'Crore ';
        n %= 10000000;
      }
      if (n > 99999) {
        str += inWords(Math.floor(n / 100000)) + 'Lakh ';
        n %= 100000;
      }
      if (n > 999) {
        str += inWords(Math.floor(n / 1000)) + 'Thousand ';
        n %= 1000;
      }
      if (n > 99) {
        str += inWords(Math.floor(n / 100)) + 'Hundred ';
        n %= 100;
      }
      if (n > 0) {
        if (str !== '') str += 'and ';
        if (n < 20) str += a[n];
        else str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10].trim() + ' ' : ' ');
      }
      return str;
    };
    return inWords(Math.floor(Number(num))).trim() + ' Taka Only';
  };

  // ডেটা ফেচিং ফাংশনসমূহ
  const fetchProducts = () => fetch(`${API_BASE}/products`).then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : [])).catch(() => {});
  const fetchCustomers = () => fetch(`${API_BASE}/customers`).then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : [])).catch(() => {});
  const fetchSuppliers = () => fetch(`${API_BASE}/suppliers`).then(r => r.json()).then(d => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
  const fetchReports = () => fetch(`${API_BASE}/reports/sales`).then(r => r.json()).then(d => setSalesReports(Array.isArray(d) ? d : [])).catch(() => {});
  const fetchUsers = () => fetch(`${API_BASE}/users`).then(r => r.json()).then(d => setUsersList(Array.isArray(d) ? d : [])).catch(() => {});
  const fetchQuotations = () => fetch(`${API_BASE}/quotations`).then(r => r.json()).then(d => setQuotationList(Array.isArray(d) ? d : [])).catch(() => {});
  const fetchReturnsHistory = () => fetch(`${API_BASE}/returns`).then(r => r.json()).then(d => setReturnsHistoryList(Array.isArray(d) ? d : [])).catch(() => {});
  
  const fetchChequeAlerts = () => fetch(`${API_BASE}/cheques/alerts`).then(r => r.json()).then(d => setChequeAlerts(Array.isArray(d) ? d : [])).catch(() => {});
  const fetchAllCheques = () => fetch(`${API_BASE}/cheques`).then(r => r.json()).then(d => setAllCheques(Array.isArray(d) ? d : [])).catch(() => {});
  const fetchCashReconciliations = () => fetch(`${API_BASE}/cash-reconciliation`).then(r => r.json()).then(d => setCashReconciliationsList(Array.isArray(d) ? d : [])).catch(() => {});

  const fetchDailySummary = (date) => {
    fetch(`${API_BASE}/reports/daily-summary?date=${date}`)
      .then(r => r.json())
      .then(d => setDailySummary(d))
      .catch(() => {});
  };

  const fetchExpenses = (date) => {
    fetch(`${API_BASE}/expenses?date=${date}`)
      .then(r => r.json())
      .then(d => setExpensesList(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  const fetchIspAlertCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/isp/customers?filter=alert3days`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setIspAlertCount(data.length);
      }
    } catch {}
  };

  useEffect(() => {
    if (currentUser) {
      fetchProducts();
      fetchCustomers();
      fetchSuppliers();
      fetchReports();
      fetchUsers();
      fetchQuotations();
      fetchReturnsHistory();
      fetchChequeAlerts();
      fetchAllCheques();
      fetchCashReconciliations();
      fetchDailySummary(selectedDate);
      fetchExpenses(selectedDate);
      fetchIspAlertCount();
    }
  }, [currentUser, selectedDate]);

  // কাস্টমার নাম টাইপ করার সাথে সাথে অটো-সাজেশন ফিল্টার
  const customerSuggestions = customers.filter(c => {
    if (!customerName.trim()) return false;
    const q = customerName.toLowerCase();
    return (c.name && c.name.toLowerCase().includes(q)) || (c.mobile && c.mobile.includes(q));
  });

  const selectSuggestedCustomer = (c) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerMobile(c.mobile || '');
    setShowSuggestions(false);
  };

  // ১. নির্দিষ্ট বারকোড ভেরিফিকেশন (Sales Return)
  const handleVerifyReturnBarcode = async (e) => {
    e.preventDefault();
    if (!returnBarcodeScan.trim()) return;
    setReturnLoading(true);
    setVerifiedBarcodeItem(null);

    try {
      const res = await fetch(`http://127.0.0.1:5010/api/returns/verify-barcode/${encodeURIComponent(returnBarcodeScan.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setVerifiedBarcodeItem(data);
        setReturnForm({
          refund_amount: data.unit_price || data.selling_price || 0,
          refund_type: 'Deduce_Due',
          return_reason: txt('পণ্য ত্রুটি / পরিবর্তন', 'Defective / Exchange')
        });
      } else {
        alert(data.error || txt('বারকোডটি বিক্রিত হিসেবে পাওয়া যায়নি!', 'Barcode not found as sold!'));
      }
    } catch {
      alert(txt('সার্ভার যোগাযোগে সমস্যা হয়েছে', 'Server connection error'));
    } finally {
      setReturnLoading(false);
    }
  };

  // ২. নির্দিষ্ট বারকোড রিটার্ন নিশ্চিতকরণ ও ইনভয়েস থেকে মাইনাস করা
  const handleConfirmBarcodeReturn = async (e) => {
    e.preventDefault();
    if (!verifiedBarcodeItem) return;

    try {
      const res = await fetch('http://127.0.0.1:5010/api/returns/by-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: verifiedBarcodeItem.serial_number,
          refund_amount: returnForm.refund_amount,
          refund_type: returnForm.refund_type,
          return_reason: returnForm.return_reason
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setVerifiedBarcodeItem(null);
        setReturnBarcodeScan('');
        fetchProducts();
        fetchCustomers();
        fetchReturnsHistory();
        fetchReports();
        fetchDailySummary(selectedDate);
      } else {
        alert(txt('❌ এরর: ', '❌ Error: ') + data.error);
      }
    } catch (err) {
      alert(txt('সার্ভার এরর: ', 'Server error: ') + err.message);
    }
  };

  // ৩. নন-বারকোড পণ্য ফেরতের জন্য ইনভয়েস সার্চ ও ফেরত নিশ্চিতকরণ
  const handleSearchInvoiceForReturn = async (e) => {
    e.preventDefault();
    if (!manualInvoiceSearch.trim()) return;
    setReturnLoading(true);
    setManualInvoiceData(null);
    setSelectedReturnItem(null);

    try {
      const res = await fetch(`http://127.0.0.1:5010/api/returns/invoice-details/${encodeURIComponent(manualInvoiceSearch.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setManualInvoiceData(data);
      } else {
        alert(data.error || txt('ইনভয়েসটি পাওয়া যায়নি!', 'Invoice not found!'));
      }
    } catch {
      alert(txt('সার্ভার যোগাযোগে সমস্যা হয়েছে', 'Server connection error'));
    } finally {
      setReturnLoading(false);
    }
  };

  const handleConfirmManualReturn = async (e) => {
    e.preventDefault();
    if (!manualInvoiceData || !selectedReturnItem) return;

    try {
      const res = await fetch('http://127.0.0.1:5010/api/returns/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: manualInvoiceData.invoice.id,
          product_id: selectedReturnItem.product_id,
          invoice_item_id: selectedReturnItem.id,
          quantity: manualReturnForm.quantity,
          refund_amount: manualReturnForm.refund_amount,
          refund_type: manualReturnForm.refund_type,
          return_reason: manualReturnForm.return_reason
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setManualInvoiceData(null);
        setSelectedReturnItem(null);
        setManualInvoiceSearch('');
        fetchProducts();
        fetchCustomers();
        fetchReturnsHistory();
        fetchReports();
        fetchDailySummary(selectedDate);
      } else {
        alert(txt('❌ এরর: ', '❌ Error: ') + data.error);
      }
    } catch (err) {
      alert(txt('সার্ভার এরর: ', 'Server error: ') + err.message);
    }
  };

  // ব্যয় সাবমিট হ্যান্ডলার
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) return alert(txt('টাকার সঠিক পরিমাণ দিন!', 'Please enter a valid amount!'));

    try {
      const res = await fetch('http://127.0.0.1:5010/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expenseForm, expense_date: selectedDate })
      });
      const data = await res.json();
      if (res.ok) {
        alert(txt('✅ খরচ সফলভাবে যোগ হয়েছে!', '✅ Expense added successfully!'));
        setExpenseForm({ category: 'চা/নাস্তা ও আপ্যায়ন', amount: '', note: '' });
        fetchExpenses(selectedDate);
        fetchDailySummary(selectedDate);
      } else {
        alert(txt('এরর: ', 'Error: ') + data.error);
      }
    } catch {
      alert(txt('সার্ভার এরর', 'Server error'));
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm(txt('এই খরচের রেকর্ডটি মুছে ফেলতে চান?', 'Do you want to delete this expense record?'))) return;
    await fetch(`http://127.0.0.1:5010/api/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses(selectedDate);
    fetchDailySummary(selectedDate);
  };

  const viewQuotationDetails = async (id) => {
    handleViewSavedQuotation(id);
  };

  const handleDeleteQuotation = async (id, no) => {
    if (!window.confirm(txt(`আপনি কি "${no}" কোটেশনটি মুছে ফেলতে চান?`, `Do you want to delete quotation "${no}"?`))) return;
    try {
      const res = await fetch(`http://127.0.0.1:5010/api/quotations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      alert(data.message);
      fetchQuotations();
    } catch (err) {
      alert(txt('ডিলিট এরর: ', 'Delete error: ') + err.message);
    }
  };

  const handleViewInvoiceDetails = async (invoiceId) => {
    try {
      const res = await fetch(`http://127.0.0.1:5010/api/invoices/${invoiceId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const cust = customers.find(c => c.id === data.customer_id);
      const prevDue = cust ? Math.max(0, Number(cust.total_due || 0) - Number(data.due_amount || 0)) : 0;

      setCompletedInvoice({
        ...data,
        previous_due: prevDue,
        total_due_after: prevDue + Number(data.due_amount || 0)
      });
    } catch (err) {
      alert(txt('বিল লোড হতে সমস্যা: ', 'Failed to load bill: ') + err.message);
    }
  };

  // ইনভয়েস এডিট ও নতুন পণ্য সংযোজন হ্যান্ডলার
  const handleOpenEditInvoice = async (invoiceId) => {
    try {
      const res = await fetch(`http://127.0.0.1:5010/api/invoices/${invoiceId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEditingInvoice(data);
      setEditCustomerName(data.customer_name || '');
      setEditCustomerMobile(data.customer_mobile || '');
      setEditItems((data.items || []).map(it => {
        const rawSn = it.serial_numbers || '';
        const serialsArr = Array.isArray(it.selected_serials) && it.selected_serials.length > 0
          ? it.selected_serials
          : (rawSn ? rawSn.split(',').map(s => s.trim()).filter(Boolean) : []);
        return {
          ...it,
          id: it.id,
          is_existing: true,
          qty: Number(it.qty || it.quantity || 1),
          unit_price: Number(it.selling_price || it.unit_price || 0),
          selling_price: Number(it.selling_price || it.unit_price || 0),
          total_price: Number(it.total_price || ((it.unit_price || it.selling_price || 0) * (it.qty || 1))),
          selected_serials: serialsArr,
          serial_numbers: rawSn || serialsArr.join(', ')
        };
      }));
      setEditDiscount(Number(data.discount_amount || 0));
      setEditAdditionalPaid('');
      setEditPaymentType(data.payment_type || 'Cash');
      setEditNote(data.note || '');
      setEditProductSelectId('');
      setEditProductSearch('');
      setEditProductQty(1);
      setEditProductPrice('');
      setEditProductWarranty('');
      setEditProductModel('');
      setEditProductSerials([]);
      setEditProductSerialInput('');
      setChangingSerialIndex(null);
      setOldSerialToReplace('');
      setNewSerialInput('');
    } catch (err) {
      alert(txt('ইনভয়েস লোড হতে ব্যর্থ: ', 'Failed to load invoice: ') + err.message);
    }
  };

  const handleSelectProductForEdit = (prodId) => {
    setEditProductSelectId(prodId);
    const prod = products.find(p => p.id === Number(prodId));
    if (prod) {
      setEditProductPrice(prod.selling_price !== undefined ? prod.selling_price : '');
      setEditProductWarranty(prod.warranty || '');
      setEditProductModel(prod.model || '');
      setEditProductQty(1);
      setEditProductSerials([]);
      setEditProductSerialInput('');
    } else {
      setEditProductPrice('');
      setEditProductWarranty('');
      setEditProductModel('');
      setEditProductQty(1);
      setEditProductSerials([]);
      setEditProductSerialInput('');
    }
  };

  const handleAddProductToEditBill = () => {
    if (!editProductSelectId) {
      return alert(txt('দয়া করে ইনভেন্টরি থেকে একটি পণ্য সিলেক্ট করুন!', 'Please select a product from inventory!'));
    }
    const prod = products.find(p => p.id === Number(editProductSelectId));
    if (!prod) return alert(txt('পণ্যটি খুঁজে পাওয়া যায়নি!', 'Product not found!'));

    const qty = Number(editProductQty || 1);
    if (qty <= 0) return alert(txt('সঠিক পরিমাণ দিন!', 'Enter a valid quantity!'));

    const price = Number(editProductPrice);
    if (isNaN(price) || price < 0) return alert(txt('সঠিক বিক্রয়মূল্য দিন!', 'Enter a valid selling price!'));

    // সিরিয়াল প্রসেসিং
    let selectedSerials = [...editProductSerials];
    if (editProductSerialInput.trim()) {
      const parsed = editProductSerialInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      selectedSerials = [...new Set([...selectedSerials, ...parsed])];
    }

    const hasSerials = prod.available_serials && prod.available_serials.trim();
    if (hasSerials && selectedSerials.length > 0) {
      if (selectedSerials.length !== qty) {
        return alert(txt(`"${prod.name}" পণ্যের জন্য ${qty} টি সিরিয়াল প্রয়োজন, কিন্তু ${selectedSerials.length} টি দেওয়া হয়েছে!`, `"${prod.name}" requires ${qty} serials, but ${selectedSerials.length} provided!`));
      }
    }

    const newItem = {
      product_id: prod.id,
      name: prod.name,
      product_name: prod.name,
      model: editProductModel || prod.model || '',
      warranty: editProductWarranty || prod.warranty || '',
      qty: qty,
      unit_price: price,
      selling_price: price,
      total_price: price * qty,
      selected_serials: selectedSerials,
      serial_numbers: selectedSerials.join(', '),
      is_new: true
    };

    setEditItems(prev => [...prev, newItem]);

    // ফর্ম রিসেট
    setEditProductSelectId('');
    setEditProductSearch('');
    setEditProductQty(1);
    setEditProductPrice('');
    setEditProductWarranty('');
    setEditProductModel('');
    setEditProductSerials([]);
    setEditProductSerialInput('');
  };

  const handleRemoveEditItem = (index) => {
    const it = editItems[index];
    if (it.is_existing) {
      if (!window.confirm(txt(`আপনি কি বিলে থাকা "${it.name || it.product_name}" আইটেমটি বাদ দিতে চান? এটি সংরক্ষণ করলে পণ্যের স্টক ইনভেন্টরিতে ফেরত যুক্ত হবে।`, `Do you want to remove item "${it.name || it.product_name}" from bill? Saving will restore its stock to inventory.`))) return;
    }
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEditItemQty = (index, delta) => {
    setEditItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const newQ = Math.max(1, (Number(item.qty) || 1) + delta);
      const uPrice = Number(item.unit_price || item.selling_price || 0);
      return {
        ...item,
        qty: newQ,
        total_price: uPrice * newQ
      };
    }));
  };

  const handleSaveEditedInvoice = async () => {
    if (!editingInvoice) return;
    if (editItems.length === 0) return alert(txt('ইনভয়েসে অন্তত একটি পণ্য থাকতে হবে!', 'Invoice must have at least one product!'));

    setEditSaving(true);
    try {
      const editSubTotal = editItems.reduce((sum, it) => sum + (Number(it.unit_price || it.selling_price || 0) * Number(it.qty || 1)), 0);
      const editDiscountNum = Math.max(0, Number(editDiscount || 0));
      const editNetTotal = Math.max(0, editSubTotal - editDiscountNum);
      const editOldPaid = Number(editingInvoice.paid_amount || 0);
      const editAddPaidNum = Number(editAdditionalPaid || 0);
      const editCalculatedPaid = editOldPaid + editAddPaidNum;
      const editNewDue = Math.max(0, editNetTotal - editCalculatedPaid);

      const finalCustName = editCustomerName.trim() || 'নগদ ক্রেতা';
      const finalCustMobile = editCustomerMobile.trim();

      const payload = {
        customer_name: finalCustName,
        customer_mobile: finalCustMobile,
        items: editItems,
        discount_amount: editDiscountNum,
        additional_paid: editAddPaidNum,
        paid_amount: editCalculatedPaid,
        note: editNote.trim(),
        payment_type: editNewDue <= 0 ? (editPaymentType === 'Due' ? 'Cash' : editPaymentType) : (editCalculatedPaid <= 0 ? 'Due' : editPaymentType)
      };

      const res = await fetch(`http://127.0.0.1:5010/api/invoices/${editingInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✅ ${data.message || txt('ইনভয়েস সফলভাবে আপডেট হয়েছে এবং কাস্টমার লেজার সমন্বয় করা হয়েছে!', 'Invoice successfully updated and customer ledger adjusted!')}`);
      const savedInvoiceId = editingInvoice.id;
      const savedCustomerId = data.customer_id || editingInvoice.customer_id;
      setEditingInvoice(null);

      // যদি বর্তমানে সম্পন্ন ইনভয়েস প্রিভিউ ওপেন থাকে তবে তা আপডেট করুন
      setCompletedInvoice(prev => (prev && prev.id === savedInvoiceId) ? {
        ...prev,
        customer_name: finalCustName,
        customer_mobile: finalCustMobile,
        discount_amount: editDiscountNum,
        total_amount: data.total_amount ?? editNetTotal,
        paid_amount: data.paid_amount ?? editCalculatedPaid,
        due_amount: data.due_amount ?? editNewDue,
        items: editItems
      } : prev);

      // রিফ্রেশ ডাটা
      fetchReports();
      fetchProducts();
      fetchCustomers();

      // যদি কাস্টমার লেজার ওপেন থাকে তবে সমন্বয় রিলোড
      if (savedCustomerId) {
        handleFilterCustomerLedger(savedCustomerId);
        fetch('http://127.0.0.1:5010/api/customers')
          .then(r => r.json())
          .then(custs => {
            if (Array.isArray(custs)) {
              setCustomers(custs);
              if (ledgerCustomer && ledgerCustomer.id === savedCustomerId) {
                const updated = custs.find(c => c.id === savedCustomerId);
                if (updated) setLedgerCustomer(updated);
              }
            }
          })
          .catch(() => {});
      }

      // আপডেটকৃত ইনভয়েসটি প্রদর্শনের জন্য প্রিভিউ ওপেন করা
      handleViewInvoiceDetails(savedInvoiceId);
    } catch (err) {
      alert(txt('ইনভয়েস সংরক্ষণ ব্যর্থ: ', 'Failed to save invoice: ') + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem('pos_current_user', JSON.stringify(user));
    } catch {}
    if (user.role === 'sales') {
      setActiveTab('pos');
    }
  };

  const handleLogout = () => {
    if (window.confirm(txt('আপনি কি নিশ্চিতভাবে সফটওয়্যার থেকে লগআউট করতে চান?', 'Are you sure you want to logout?'))) {
      setCurrentUser(null);
      try {
        sessionStorage.removeItem('pos_current_user');
      } catch {}
      setShowLoginModal(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    fetch('http://127.0.0.1:5010/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          handleLoginSuccess(d.user);
          setShowLoginModal(false);
          setLoginForm({ username: '', password: '' });
        } else {
          alert(d.error || txt('লগইন ব্যর্থ হয়েছে', 'Login failed'));
        }
      })
      .catch(err => alert(txt('লগইন সার্ভার কানেকশন এরর: ', 'Login server connection error: ') + err.message));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        const res = await fetch(`http://127.0.0.1:5010/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUserForm)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || txt('ইউজার আপডেটে সমস্যা হয়েছে', 'User update failed'));

        alert(data.message || txt('ইউজার তথ্য সফলভাবে আপডেট হয়েছে!', 'User information updated successfully!'));
        // যদি বর্তমান লগইন করা ইউজারের তথ্য আপডেট করা হয়
        if (currentUser && currentUser.id === editingUserId) {
          const updatedCurrentUser = {
            ...currentUser,
            username: newUserForm.username,
            fullname: newUserForm.fullname,
            role: newUserForm.role
          };
          setCurrentUser(updatedCurrentUser);
          try {
            sessionStorage.setItem('pos_current_user', JSON.stringify(updatedCurrentUser));
          } catch {}
        }
        setEditingUserId(null);
      } else {
        const res = await fetch('http://127.0.0.1:5010/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUserForm)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || txt('ইউজার তৈরিতে সমস্যা হয়েছে', 'User creation failed'));

        alert(data.message || txt('নতুন ইউজার সফলভাবে তৈরি হয়েছে!', 'New user created successfully!'));
      }
      setNewUserForm({ username: '', password: '', fullname: '', role: 'sales' });
      fetchUsers();
    } catch (err) {
      alert(txt('এরর: ', 'Error: ') + err.message);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(txt(`আপনি কি নিশ্চিতভাবে "${username}" ইউজারটি মুছে ফেলতে চান?`, `Are you sure you want to delete user "${username}"?`))) return;
    try {
      const res = await fetch(`http://127.0.0.1:5010/api/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || txt('ডিলিট করতে সমস্যা হয়েছে', 'Failed to delete user'));
      alert(data.message || txt('ইউজার মুছে ফেলা হয়েছে!', 'User deleted successfully!'));
      if (editingUserId === userId) {
        setEditingUserId(null);
        setNewUserForm({ username: '', password: '', fullname: '', role: 'sales' });
      }
      fetchUsers();
    } catch (err) {
      alert(txt('ডিলিট এরর: ', 'Delete error: ') + err.message);
    }
  };

  const handleAddServiceToCart = (e) => {
    e.preventDefault();
    if (!serviceForm.title.trim()) {
      return alert(txt('কি সার্ভিসিং করা হয়েছে তার বিস্তারিত বিবরণ লিখুন!', 'Please enter detailed description of service!'));
    }
    const charge = Number(serviceForm.charge);
    if (isNaN(charge) || charge < 0) {
      return alert(txt('সঠিক সার্ভিসিং চার্জ প্রদান করুন!', 'Please enter a valid service charge!'));
    }

    const serviceItem = {
      id: 'srv_' + Date.now(),
      name: `${serviceForm.category}: ${serviceForm.title.trim()}`,
      model: serviceForm.model.trim() || '',
      selling_price: charge,
      sale_price: charge,
      purchase_price: 0,
      current_stock: 99999,
      qty: 1,
      discount: '',
      warranty: serviceForm.warranty || 'নন-ওয়ারেন্টি',
      is_service: true,
      selected_serials: []
    };

    setCart([...cart, serviceItem]);
    setShowServiceModal(false);
    setServiceForm({
      category: 'ল্যাপটপ সার্ভিসিং',
      title: '',
      model: '',
      charge: '',
      warranty: '1 month'
    });
  };

  const addToCart = (product, autoSerial = null) => {
    if (Number(product.current_stock) <= 0) return alert(txt('এই পণ্যটির স্টক শেষ!', 'This product is out of stock!'));
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.current_stock) return alert(txt('স্টকের চেয়ে বেশি বিক্রি সম্ভব নয়!', 'Cannot sell more than available stock!'));
      
      let updatedSerials = existing.selected_serials ? [...existing.selected_serials] : [];
      if (autoSerial && !updatedSerials.includes(autoSerial)) {
        updatedSerials.push(autoSerial);
      }
      setCart(cart.map(item => item.id === product.id ? { 
        ...item, 
        qty: item.qty + 1,
        selected_serials: updatedSerials,
        raw_serials_input: updatedSerials.join(', ')
      } : item));
    } else {
      const initSerials = autoSerial ? [autoSerial] : [];
      setCart([...cart, { 
        ...product, 
        qty: 1, 
        discount: '',
        selected_serials: initSerials, 
        raw_serials_input: initSerials.join(', ') 
      }]);
    }
  };

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeInput.trim();
      if (!code) return;
      
      // ১. হুবহু বারকোড মিল আছে কিনা
      let found = products.find(p => p.barcode && p.barcode.toLowerCase() === code.toLowerCase());
      let matchedSerial = null;

      // ২. যদি পণ্যের বারকোডে না মেলে, তাহলে স্টকে থাকা সিরিয়ালগুলোতে চেক করা
      if (!found) {
        for (const p of products) {
          if (p.available_serials) {
            const snList = p.available_serials.split(',').map(s => s.trim().toLowerCase());
            if (snList.includes(code.toLowerCase())) {
              found = p;
              matchedSerial = code;
              break;
            }
          }
        }
      }

      // ৩. পণ্যের নামের সাথে মিল
      if (!found) {
        found = products.find(p => p.name.toLowerCase().includes(code.toLowerCase()));
      }

      if (found) { 
        addToCart(found, matchedSerial); 
        setBarcodeInput(''); 
      } else { 
        alert(txt(`বারকোড বা সিরিয়াল "${code}" স্টকে নেই বা খুঁজে পাওয়া যায়নি!`, `Barcode or serial "${code}" not found in stock!`)); 
        setBarcodeInput(''); 
      }
    }
  };

  const handleSerialChange = (index, inputStr) => {
    const parsed = inputStr.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    setCart(prev => prev.map((c, i) => i === index ? { 
      ...c, 
      raw_serials_input: inputStr, 
      selected_serials: parsed 
    } : c));
  };

  const toggleCartSerial = (index, serial) => {
    const item = cart[index];
    const currentSerials = (typeof item.raw_serials_input === 'string' && item.raw_serials_input.trim())
      ? item.raw_serials_input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      : (Array.isArray(item.selected_serials) ? item.selected_serials : []);
    const cleanSerial = serial.trim();
    const isAlreadySelected = currentSerials.some(s => s.toUpperCase() === cleanSerial.toUpperCase());

    let newSerials;
    if (isAlreadySelected) {
      newSerials = currentSerials.filter(s => s.toUpperCase() !== cleanSerial.toUpperCase());
    } else {
      if (item.qty === 1) {
        newSerials = [cleanSerial];
      } else if (currentSerials.length >= item.qty) {
        alert(txt(`"${item.name}" পণ্যের জন্য ইতিমধ্যে ${item.qty} টি সিরিয়াল নির্বাচিত হয়েছে! অতিরিক্ত সিরিয়াল দিতে চাইলে আগে পণ্যের সংখ্যা (+) বাড়ান।`, `Already ${item.qty} serials selected for "${item.name}"! Increase quantity (+) to add more.`));
        return;
      } else {
        newSerials = [...currentSerials, cleanSerial];
      }
    }

    const rawInput = newSerials.join(', ');
    setCart(prev => prev.map((c, i) => i === index ? { ...c, raw_serials_input: rawInput, selected_serials: newSerials } : c));
  };

  const handleSerialKeyDown = (index, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = cart[index];
      const val = (item.raw_serials_input !== undefined ? item.raw_serials_input : (Array.isArray(item.selected_serials) ? item.selected_serials.join(', ') : '')).trim();
      if (val && !val.endsWith(',')) {
        const newVal = val + ', ';
        const parsed = newVal.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        setCart(prev => prev.map((c, i) => i === index ? { ...c, raw_serials_input: newVal, selected_serials: parsed } : c));
      }
    }
  };

  const subTotal = cart.reduce((sum, item) => sum + (Number(item.selling_price || item.sale_price || 0) * item.qty), 0);
  const itemDiscountsTotal = cart.reduce((sum, item) => sum + Math.max(0, Number(item.discount || 0)), 0);
  const extraDiscount = Math.max(0, Number(discountAmount || 0));
  const netDiscount = itemDiscountsTotal + extraDiscount;
  const netBillTotal = Math.max(0, subTotal - netDiscount);
  const actualPaidAmount = paidAmount === '' ? netBillTotal : Number(paidAmount || 0);
  const currentBillDue = Math.max(0, netBillTotal - actualPaidAmount);

  // কাস্টমারের পূর্বের বকেয়া ও সর্বমোট বকেয়া হিসাব
  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);
  const customerPreviousDue = selectedCustomerObj ? Number(selectedCustomerObj.total_due || 0) : 0;
  const totalDueWithPrevious = customerPreviousDue + currentBillDue;

  // ইনভয়েস ও চেকআউট হ্যান্ডলার
  const handleCheckout = async () => {
    if (cart.length === 0) return alert(txt('কার্ট খালি!', 'Cart is empty!'));

    // সিরিয়াল প্রয়োজনীয়তা ও সঠিকতা ভ্যালিডেশন (শুধুমাত্র যেসব পণ্যে স্টকে সিরিয়াল আছে)
    for (const item of cart) {
      const hasSerials = item.available_serials && item.available_serials.trim();
      if (hasSerials) {
        let serials = [];
        if (typeof item.raw_serials_input === 'string' && item.raw_serials_input.trim()) {
          serials = item.raw_serials_input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        } else if (Array.isArray(item.selected_serials)) {
          serials = item.selected_serials.map(s => String(s).trim()).filter(Boolean);
        }

        if (serials.length !== item.qty) {
          return alert(txt(`"${item.name}" পণ্যের জন্য ${item.qty} টি সিরিয়াল প্রয়োজন, কিন্তু ${serials.length} টি দেওয়া হয়েছে! স্টকে থাকা সঠিক সিরিয়াল দিন।`, `"${item.name}" requires ${item.qty} serials, but ${serials.length} provided! Provide valid stock serials.`));
        }

        const availableUpper = item.available_serials.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        for (const sn of serials) {
          if (!availableUpper.includes(sn.toUpperCase())) {
            return alert(txt(`⚠️ ওয়ার্নিং: "${sn}" সিরিয়ালটি "${item.name}" পণ্যের স্টকে নেই অথবা ভুল! সঠিক সিরিয়াল নির্বাচন বা স্ক্যান করুন।`, `⚠️ Warning: Serial "${sn}" is not in stock for "${item.name}"! Select or scan valid serial.`));
          }
        }

        const upperSet = new Set(serials.map(s => s.toUpperCase()));
        if (upperSet.size !== serials.length) {
          return alert(txt(`⚠️ "${item.name}" পণ্যে একই সিরিয়াল নম্বর একাধিকবার দেওয়া হয়েছে! প্রতিটি আইটেমের জন্য আলাদা সিরিয়াল দিন।`, `⚠️ Duplicate serial number provided for "${item.name}"! Each item must have a unique serial.`));
        }
      }
    }

    const payload = {
      customer_id: selectedCustomerId,
      customer_name: customerName.trim() || txt('নগদ ক্রেতা', 'Cash Customer'),
      customer_mobile: customerMobile.trim() || '',
      payment_type: paymentType || 'Cash',
      paid_amount: actualPaidAmount,
      discount_amount: netDiscount,
      note: billNote ? billNote.trim() : '',
      user_id: currentUser ? currentUser.id : null,
      salesman_name: currentUser ? (currentUser.fullname || currentUser.username) : 'Admin',
      items: cart.map(item => {
        let serials = [];
        if (typeof item.raw_serials_input === 'string' && item.raw_serials_input.trim()) {
          serials = item.raw_serials_input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        } else if (Array.isArray(item.selected_serials)) {
          serials = item.selected_serials.map(s => String(s).trim()).filter(Boolean);
        }

        return {
          id: item.is_service ? 0 : (Number(item.id) || 0),
          is_service: Boolean(item.is_service),
          name: item.name,
          model: item.model || '',
          qty: Number(item.qty || 1),
          selling_price: Number(item.selling_price || item.sale_price || 0),
          discount: Math.max(0, Number(item.discount || 0)),
          warranty: item.warranty || '',
          selected_serials: serials
        };
      })
    };

    try {
      const res = await fetch('http://127.0.0.1:5010/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || txt('ইনভয়েস সেভ হয়নি', 'Invoice not saved'));

      setCompletedInvoice({
        id: data.invoice_id,
        invoice_no: data.invoice_no,
        customer_name: payload.customer_name,
        customer_mobile: payload.customer_mobile,
        payment_type: payload.payment_type,
        items: payload.items,
        sub_total: subTotal,
        discount_amount: netDiscount,
        total_amount: data.current_bill,
        paid_amount: data.paid,
        due_amount: data.due,
        previous_due: data.previous_due,
        total_due_after: data.total_due_after,
        note: payload.note,
        salesman_name: payload.salesman_name,
        user_id: payload.user_id,
        date: formatDateDMY(new Date())
      });

      alert(txt(`✅ বিক্রি সম্পন্ন হয়েছে ও "${payload.customer_name}" এর লেজারে বিল যুক্ত হয়েছে!`, `✅ Sale completed & bill added to "${payload.customer_name}" ledger!`));
      setCart([]);
      setSelectedCustomerId(null);
      setCustomerName('');
      setCustomerMobile('');
      setPaidAmount('');
      setDiscountAmount('');
      setBillNote('');

      fetchProducts();
      fetchCustomers();
      fetchReports();
      fetchDailySummary(selectedDate);

    } catch (err) {
      console.error('Checkout error:', err);
      alert(txt('ইনভয়েস তৈরিতে এরর: ', 'Invoice creation error: ') + err.message);
    }
  };

  // নতুন পণ্য এন্ট্রিতে একক বা একাধিক বারকোড দিলে স্বয়ংক্রিয় স্টক কাউন্ট হওয়া
  const handleSingleBarcodeChange = (e) => {
    const val = e.target.value;
    const serialCount = val ? val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).length : 0;
    setFormData(prev => ({
      ...prev,
      barcode: val,
      current_stock: serialCount > 0 ? serialCount : prev.current_stock
    }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const url = editingProductId ? `http://127.0.0.1:5010/api/products/${editingProductId}` : 'http://127.0.0.1:5010/api/products';
    const method = editingProductId ? 'PUT' : 'POST';

    try {
      const payload = {
        ...formData,
        barcode: (formData.barcode && typeof formData.barcode === 'string' && formData.barcode.trim()) ? formData.barcode.trim() : null
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(txt(`সার্ভার থেকে সঠিক ফরম্যাটে উত্তর আসেনি: ${text.slice(0, 100)}`, `Server response format invalid: ${text.slice(0, 100)}`));
      }

      if (!res.ok) throw new Error(data.error || txt('পণ্য সংরক্ষণে সমস্যা হয়েছে', 'Product save failed'));

      alert(data.message || txt('পণ্য সফলভাবে সংরক্ষিত হয়েছে!', 'Product saved successfully!'));
      setShowProductModal(false);
      setEditingProductId(null);
      setFormData({
        name: '', brand: '', model: '', category: 'CC Camera', barcode: '', warranty: '',
        purchase_price: '', selling_price: '', current_stock: '', alert_quantity: 5,
        supplier_id: ''
      });
      fetchProducts();
      fetchSuppliers();
    } catch (err) {
      alert(txt('পণ্য সংরক্ষণে এরর: ', 'Product save error: ') + err.message);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(txt(`আপনি কি নিশ্চিতভাবে "${name}" পণ্যটি মুছে ফেলতে চান?`, `Are you sure you want to delete product "${name}"?`))) return;
    try {
      const res = await fetch(`http://127.0.0.1:5010/api/products/${id}`, { 
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(txt(`সার্ভার থেকে সঠিক ফরম্যাট আসেনি`, `Invalid server response format`));
      }

      if (!res.ok) throw new Error(data.error || txt('ডিলিট সম্পন্ন হয়নি', 'Failed to delete'));
      
      alert(data.message || txt('পণ্য সফলভাবে মুছে ফেলা হয়েছে!', 'Product deleted successfully!'));
      fetchProducts();
    } catch (err) {
      alert(txt('এরর: ', 'Error: ') + err.message);
    }
  };

  const handleDeleteSupplier = async (id, name) => {
    if (!window.confirm(txt(`আপনি কি "${name}" সাপ্লায়ারের রেকর্ড মুছে ফেলতে চান?`, `Are you sure you want to delete supplier "${name}"?`))) return;
    try {
      const res = await fetch(`http://127.0.0.1:5010/api/suppliers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message || txt('সাপ্লায়ার মুছে ফেলা হয়েছে!', 'Supplier deleted successfully!'));
      fetchSuppliers();
    } catch (err) {
      alert(txt('এরর: ', 'Error: ') + err.message);
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(txt(`আপনি কি "${name}" কাস্টমারের রেকর্ড মুছে ফেলতে চান?`, `Are you sure you want to delete customer "${name}"?`))) return;
    try {
      const res = await fetch(`http://127.0.0.1:5010/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message || txt('কাস্টমার মুছে ফেলা হয়েছে!', 'Customer deleted successfully!'));
      fetchCustomers();
    } catch (err) {
      alert(txt('এরর: ', 'Error: ') + err.message);
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:5010/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || txt('সাপ্লায়ার যুক্ত হতে ব্যর্থ হয়েছে', 'Failed to add supplier'));

      alert(data.message || txt('সাপ্লায়ার সফলভাবে যুক্ত হয়েছে!', 'Supplier added successfully!'));
      setShowSupplierModal(false);
      setSupplierForm({ name: '', company: '', mobile: '', address: '' });
      fetchSuppliers();
    } catch (err) {
      alert(txt('সাপ্লায়ার এন্ট্রিতে এরর: ', 'Supplier entry error: ') + err.message);
    }
  };

  const handleBarcodeSearch = (e) => {
    e.preventDefault();
    if (!barcodeSearch.trim()) return;
    fetch(`http://127.0.0.1:5010/api/serials/history/${encodeURIComponent(barcodeSearch.trim())}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) alert(d.error);
        else setProductLifecycle(d);
      })
      .catch(err => alert(txt('সার্চ এরর: ', 'Search error: ') + err.message));
  };

  const handleSerialStockIn = (e) => {
    e.preventDefault();
    const serialList = serialsInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (serialList.length === 0) return alert(txt('কমপক্ষে একটি সিরিয়াল নম্বর দিন', 'Enter at least one serial number'));

    fetch('http://127.0.0.1:5010/api/products/stock-in-serials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: stockInProduct.id,
        supplier_id: stockInSupplier || null,
        purchase_price: stockInPrice || stockInProduct.purchase_price,
        serials: serialList,
        bill_image: stockInBillImage || null
      })
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) alert(d.error);
        else {
          alert(d.message);
          setShowStockInModal(false);
          setSerialsInput('');
          setStockInBillImage('');
          fetchProducts();
          fetchSuppliers();
        }
      });
  };

  const handleDirectSupplierPurchase = async (e) => {
    e.preventDefault();
    if (!supplierPurchaseForm.supplier_id || !supplierPurchaseForm.amount || Number(supplierPurchaseForm.amount) <= 0) {
      alert(txt('সাপ্লায়ার এবং সঠিক টাকার পরিমাণ প্রদান করুন!', 'Please select supplier and valid amount!'));
      return;
    }
    try {
      const res = await fetch('http://127.0.0.1:5010/api/suppliers/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierPurchaseForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert(txt('✅ ক্রয় বিল সফলভাবে সংরক্ষিত হয়েছে!', '✅ Purchase bill saved successfully!'));
        setShowSupplierPurchaseModal(false);
        setSupplierPurchaseForm({ supplier_id: '', amount: '', note: '', bill_image: '' });
        fetchSuppliers();
      } else {
        alert(data.error || txt('সংরক্ষণে ব্যর্থ হয়েছে', 'Save failed'));
      }
    } catch {
      alert(txt('সার্ভার এরর', 'Server error'));
    }
  };

  // কোটেশন রো ম্যানেজমেন্ট ফাংশনসমূহ
  const handleAddQuotationRow = () => {
    setQuotationItems([
      ...quotationItems,
      { id: Date.now(), name: '', warranty: '1 Year', qty: 1, unit_price: '', total_price: '' }
    ]);
  };

  const handleQuotationItemChange = (index, field, value) => {
    const updated = [...quotationItems];
    updated[index][field] = value;
    if (field === 'qty' || field === 'unit_price') {
      const q = Number(field === 'qty' ? value : updated[index].qty) || 0;
      const p = Number(field === 'unit_price' ? value : updated[index].unit_price) || 0;
      updated[index].total_price = q * p;
    }
    setQuotationItems(updated);
  };

  const handleRemoveQuotationRow = (index) => {
    if (quotationItems.length <= 1) {
      setQuotationItems([{ id: Date.now(), name: '', warranty: '1 Year', qty: 1, unit_price: '', total_price: '' }]);
      return;
    }
    setQuotationItems(quotationItems.filter((_, i) => i !== index));
  };

  const handleImportCartToQuotation = () => {
    if (cart.length === 0) return alert(txt('POS কার্টে কোনো পণ্য নেই!', 'No products in POS cart!'));
    const newItems = cart.map(c => ({
      id: Date.now() + Math.random(),
      name: c.name + (c.model ? ` (${c.model})` : ''),
      warranty: c.warranty || '1 Year',
      qty: c.qty,
      unit_price: c.selling_price || c.sale_price,
      total_price: Math.max(0, ((c.selling_price || c.sale_price) * c.qty) - Number(c.discount || 0))
    }));
    setQuotationItems(newItems);
  };

  const quotationCalculatedTotal = quotationItems.reduce((sum, it) => sum + (Number(it.total_price) || (Number(it.qty || 1) * Number(it.unit_price || 0))), 0);

  const handleSaveAndPrintQuotation = async () => {
    if (!quotationCustomer.trim()) return alert(txt('কাস্টমার বা প্রতিষ্ঠানের নাম প্রদান করুন!', 'Please enter customer or company name!'));
    const validItems = quotationItems.filter(it => it.name && it.name.trim() !== '');
    if (validItems.length === 0) return alert(txt('অন্তত একটি পণ্যের নাম ও বিবরণ দিন!', 'Enter name and description for at least one item!'));

    const payload = {
      customer_name: quotationCustomer.trim(),
      customer_mobile: quotationMobile.trim(),
      customer_address: quotationAddress.trim(),
      subject: quotationSubject.trim() || 'QUOTATION / মূল্য প্রস্তাবনা',
      valid_until: quotationValid,
      terms: quotationTerms,
      note: quotationNote,
      items: validItems.map(it => ({
        name: it.name,
        warranty: it.warranty,
        qty: Number(it.qty) || 1,
        unit_price: Number(it.unit_price) || 0,
        total_price: Number(it.total_price) || (Number(it.qty || 1) * Number(it.unit_price || 0))
      }))
    };

    try {
      const res = await fetch('http://127.0.0.1:5010/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || txt('কোটেশন সেভ ব্যর্থ হয়েছে', 'Failed to save quotation'));

      setActiveQuotationPrint({
        quotation_no: data.quotation_no,
        date: formatDateDMY(new Date()),
        ...payload,
        total_amount: quotationCalculatedTotal
      });
      fetchQuotations();
    } catch (err) {
      alert(txt('এরর: ', 'Error: ') + err.message);
    }
  };

  const handleViewSavedQuotation = async (qId) => {
    try {
      const res = await fetch(`http://127.0.0.1:5010/api/quotations/${qId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActiveQuotationPrint({
        quotation_no: data.quotation_no,
        customer_name: data.customer_name,
        customer_mobile: data.customer_mobile,
        customer_address: data.customer_address || '',
        subject: data.subject || 'QUOTATION / মূল্য প্রস্তাবনা',
        valid_until: data.valid_until,
        date: formatDateDMY(data.created_at),
        terms: data.terms || quotationTerms,
        note: data.note || '',
        total_amount: Number(data.total_amount),
        items: (data.items || []).map(it => ({
          name: it.product_name,
          warranty: it.warranty,
          qty: it.quantity,
          unit_price: it.unit_price,
          total_price: it.total_price
        }))
      });
    } catch (err) {
      alert(txt('কোটেশন লোড ব্যর্থ: ', 'Failed to load quotation: ') + err.message);
    }
  };

  // ক্যাশ রিকনসিলিয়েশন ও অমীমাংসিত হিসাব সংরক্ষণ
  const handleSaveCashReconciliation = async () => {
    if (actualCashInput === '') return alert(txt('কাউন্টারের প্রকৃত ক্যাশের পরিমাণ লিখুন!', 'Enter actual cash in drawer!'));
    const actual = Number(actualCashInput);
    const expected = Number(dailySummary?.expected_cash || 0);
    const shortage = Math.max(0, expected - actual);

    try {
      const res = await fetch('http://127.0.0.1:5010/api/cash-reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reconciliation_date: selectedDate,
          expected_cash: expected,
          actual_cash: actual,
          shortage_amount: shortage,
          note: unsettledNote,
          recorded_by: currentUser?.fullname || currentUser?.username || 'Cashier'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      fetchDailySummary(selectedDate);
      fetchCashReconciliations();
      setUnsettledNote('');
    } catch (err) {
      alert(txt('সংরক্ষণে সমস্যা হয়েছে: ', 'Failed to save: ') + err.message);
    }
  };

  const handleToggleReconciliationStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'অমীমাংসিত' ? 'মীমাংসিত' : 'অমীমাংসিত';
    try {
      const res = await fetch(`http://127.0.0.1:5010/api/cash-reconciliation/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchDailySummary(selectedDate);
      fetchCashReconciliations();
    } catch (err) {
      alert(txt('স্ট্যাটাস পরিবর্তনে সমস্যা: ', 'Failed to toggle status: ') + err.message);
    }
  };

  const handleDeleteCashReconciliation = async (id) => {
    if (!window.confirm(txt('আপনি কি এই রিকনসিলিয়েশন রেকর্ডটি মুছে ফেলতে চান?', 'Do you want to delete this reconciliation record?'))) return;
    try {
      await fetch(`http://127.0.0.1:5010/api/cash-reconciliation/${id}`, { method: 'DELETE' });
      fetchDailySummary(selectedDate);
      fetchCashReconciliations();
    } catch (err) {
      alert(txt('ডিলিট এরর: ', 'Delete error: ') + err.message);
    }
  };

  // চেক স্ট্যাটাস পরিবর্তন
  const handleUpdateChequeStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://127.0.0.1:5010/api/cheques/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cheque_status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      fetchChequeAlerts();
      fetchAllCheques();
    } catch (err) {
      alert(txt('চেক আপডেট এরর: ', 'Cheque update error: ') + err.message);
    }
  };

  // মানি রিসিপ্ট দেখা ও প্রিন্ট করার হ্যান্ডলার
  const handleViewMoneyReceipt = async (t) => {
    try {
      if (t.id) {
        const res = await fetch(`http://127.0.0.1:5010/api/money-receipts/${t.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setActiveMoneyReceipt(data);
            return;
          }
        }
      }
      // ব্যাকএন্ডে না পাওয়া গেলে বর্তমান ডাটা থেকে রিসিপ্ট অবজেক্ট তৈরি
      setActiveMoneyReceipt({
        id: t.id,
        receipt_no: t.receipt_no || `MR-${t.id}`,
        customer_id: t.customer_id || ledgerCustomer?.id,
        customer_name: t.customer_name || ledgerCustomer?.name || txt('সম্মানিত গ্রাহক', 'Valued Customer'),
        customer_mobile: t.customer_mobile || ledgerCustomer?.mobile || '-',
        customer_address: t.customer_address || ledgerCustomer?.address || '',
        amount: t.amount,
        payment_method: t.payment_method || 'Cash',
        bank_name: t.bank_name || null,
        cheque_no: t.cheque_no || null,
        cheque_date: t.cheque_date || null,
        deposit_date: t.deposit_date || null,
        cheque_status: t.cheque_status || null,
        note: t.note || (t.payment_method === 'Cheque' ? txt(`চেক নং: ${t.cheque_no || ''}`, `Cheque No: ${t.cheque_no || ''}`) : txt('বকেয়া সমন্বয় বাবদ নগদ জমা', 'Cash received for due adjustment')),
        previous_due: t.previous_due ?? (ledgerCustomer?.total_due !== undefined ? (Number(ledgerCustomer.total_due) + Number(t.amount)) : t.amount),
        remaining_due: t.remaining_due ?? (ledgerCustomer?.total_due !== undefined ? Number(ledgerCustomer.total_due) : 0),
        received_by: t.received_by || 'Admin',
        created_at: t.created_at || new Date().toISOString()
      });
    } catch (err) {
      console.error('Money receipt load error:', err);
    }
  };

  // কাস্টমার লেজার ফিল্টার
  const handleFilterCustomerLedger = (customerId) => {
    const id = customerId || ledgerCustomer?.id;
    if (!id) return;
    fetch(`http://127.0.0.1:5010/api/customers/${id}/transactions?from_date=${custLedgerFromDate}&to_date=${custLedgerToDate}`)
      .then(r => r.json())
      .then(d => setTransactions(d || []));
  };

  const handleResetCustomerLedger = (customerId) => {
    setCustLedgerFromDate('');
    setCustLedgerToDate('');
    const id = customerId || ledgerCustomer?.id;
    if (!id) return;
    fetch(`http://127.0.0.1:5010/api/customers/${id}/transactions`)
      .then(r => r.json())
      .then(d => setTransactions(d || []));
  };

  // সাপ্লায়ার লেজার ফিল্টার
  const handleFilterSupplierLedger = (supplierId) => {
    const id = supplierId || supplierLedger?.id;
    if (!id) return;
    fetch(`http://127.0.0.1:5010/api/suppliers/${id}/ledger?from_date=${suppLedgerFromDate}&to_date=${suppLedgerToDate}`)
      .then(r => r.json())
      .then(d => setSupplierTransactions(d || []));
  };

  const handleResetSupplierLedger = (supplierId) => {
    setSuppLedgerFromDate('');
    setSuppLedgerToDate('');
    const id = supplierId || supplierLedger?.id;
    if (!id) return;
    fetch(`http://127.0.0.1:5010/api/suppliers/${id}/ledger`)
      .then(r => r.json())
      .then(d => setSupplierTransactions(d || []));
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (p.model && p.model.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || (p.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const filteredCustomers = customers.filter(c => 
    (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase())) ||
    (c.mobile && c.mobile.includes(customerSearch))
  );

  const filteredSuppliers = suppliers.filter(s => 
    (s.name && s.name.toLowerCase().includes(supplierSearch.toLowerCase())) ||
    (s.company && s.company.toLowerCase().includes(supplierSearch.toLowerCase())) ||
    (s.mobile && s.mobile.includes(supplierSearch))
  );

  const filteredInventoryProducts = products.filter(p => 
    (p.name && p.name.toLowerCase().includes(inventorySearch.toLowerCase())) ||
    (p.model && p.model.toLowerCase().includes(inventorySearch.toLowerCase())) ||
    (p.barcode && p.barcode.toLowerCase().includes(inventorySearch.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(inventorySearch.toLowerCase()))
  );

  // ব্যবহারকারী লগইন না থাকলে সরাসরি অ্যাডমিনিস্ট্রেটর ও বিক্রয় প্রতিনিধির লগইন পেইজ প্রদর্শিত হবে
  if (!currentUser) {
    return <LoginPage onLogin={handleLoginSuccess} lang={lang} onToggleLang={toggleLanguage} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060b19] via-[#091533] to-[#0d1d47] flex flex-col font-sans text-slate-100">
      {/* টপ কালারফুল অ্যাকসেন্ট বার */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-500 via-purple-500 via-pink-500 via-amber-500 to-emerald-500 print:hidden shrink-0"></div>

      {/* হেডার নেভবার - ডার্ক নেভি ব্লু */}
      <nav className="bg-[#0b1739]/95 backdrop-blur-md border-b border-blue-900/50 px-6 py-3 flex justify-between items-center shadow-lg shadow-black/30 print:hidden sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center shrink-0">
            <img 
              src="/fc_logo_icon.png" 
              alt="FC Logo" 
              className="w-10 h-10 object-contain rounded-[10px] bg-white p-0.5" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">FC TECHNOLOGY</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">POS & Inventory</span>
            </div>
            <p className="text-xs text-blue-200/70 font-medium">{t('brandTagline')}</p>
          </div>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {/* ড্যাশবোর্ড ট্যাব */}
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'dashboard' 
                ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white shadow-md shadow-indigo-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            📊 {t('tabDashboard')}
          </button>

          {/* POS কাউন্টার */}
          <button 
            onClick={() => setActiveTab('pos')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'pos' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            🛒 {t('tabPos')}
          </button>

          {/* ওয়ারেন্টি ও সার্ভিসিং ট্যাব */}
          <button 
            onClick={() => setActiveTab('warranty_service')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'warranty_service' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            <Wrench size={13} /> {t('tabWarrantyService')}
          </button>

          {/* আইএসপি ইন্টারনেট ম্যানেজমেন্ট ট্যাব */}
          <button 
            onClick={() => setActiveTab('isp_management')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 relative ${
              activeTab === 'isp_management' 
                ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            <Wifi size={13} /> {t('tabIsp')}
            {ispAlertCount > 0 && (
              <span className="bg-red-600 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black animate-pulse shadow-sm">
                {ispAlertCount}
              </span>
            )}
          </button>

          {/* ইনভেন্টরি স্টক */}
          <button 
            onClick={() => setActiveTab('inventory')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'inventory' || activeTab === 'dashboard_inventory'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            📦 {t('tabInventory')}
          </button>
          
          {/* নির্দিষ্ট বারকোড রিটার্ন ট্যাব */}
          <button 
            onClick={() => setActiveTab('returns')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'returns' 
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            <RotateCcw size={13} /> {t('tabReturns')}
          </button>

          <button 
            onClick={() => setActiveTab('barcode_search')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'barcode_search' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            🔍 {t('tabBarcodeHistory')}
          </button>

          <button 
            onClick={() => setActiveTab('quotation')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'quotation' 
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            📝 {t('tabQuotation')}
          </button>

          <button 
            onClick={() => setActiveTab('customers')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'customers' 
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            👥 {t('tabCustomers')}
          </button>

          <button 
            onClick={() => setActiveTab('suppliers')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'suppliers' 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            🚚 {t('tabSuppliers')}
          </button>

          <button 
            onClick={() => setActiveTab('expenses')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'expenses' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-md shadow-green-500/30 scale-[1.02]' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            💰 {t('tabExpenses')}
          </button>

          <button 
            onClick={() => { setShowChequeModal(true); fetchAllCheques(); }} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
              chequeAlerts.length > 0 
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md animate-pulse' 
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
            }`}
          >
            <Bell size={13} /> {t('tabCheques')}
            {chequeAlerts.length > 0 && (
              <span className="bg-red-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-black">
                {chequeAlerts.length}
              </span>
            )}
          </button>

          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('reports')} 
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
                activeTab === 'reports' 
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-500/30 scale-[1.02]' 
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
              }`}
            >
              📈 {t('tabReports')}
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setShowBackupModal(true)} 
              className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md shadow-emerald-700/20"
              title={txt("১-ক্লিকে ডাটাবেজ ব্যাকআপ ও রিস্টোর", "1-Click Database Backup & Restore")}
            >
              <Database size={13} /> {txt("ডাটা ব্যাকআপ", "Backup")}
            </button>
          )}

          {/* ভাষা পরিবর্তন বাটন (Bangla <-> English) */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/80 shadow-xs"
            title={lang === 'bn' ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
          >
            <Globe size={14} className="text-blue-400" />
            <span className={lang === 'bn' ? 'text-blue-400 font-bold' : 'text-slate-400 font-normal'}>বাংলা</span>
            <span className="text-slate-600">|</span>
            <span className={lang === 'en' ? 'text-blue-400 font-bold' : 'text-slate-400 font-normal'}>EN</span>
          </button>

          <div className="border-l border-slate-700/60 pl-3 ml-2 flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-xl font-bold border flex items-center gap-1.5 shadow-xs ${
              currentUser.role === 'admin' 
                ? 'bg-blue-950/70 text-blue-200 border-blue-800/60' 
                : 'bg-emerald-950/70 text-emerald-200 border-emerald-800/60'
            }`}>
              {currentUser.role === 'admin' ? '👑' : '👤'} {currentUser.fullname}
              <span className="text-[10px] font-normal opacity-80">
                ({currentUser.role === 'admin' ? t('userRoleAdmin') : t('userRoleSales')})
              </span>
            </span>

            {currentUser.role === 'admin' && (
              <button 
                onClick={() => setShowUserModal(true)} 
                className="p-1.5 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-800/60 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                title={txt("নতুন ইউজার তৈরি করুন", "Create new user")}
              >
                <UserPlus size={14} /> {t('addUser')}
              </button>
            )}

            <button 
              onClick={() => setShowLoginModal(true)} 
              className="p-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
              title={txt("ইউজার সুইচ করুন", "Switch user")}
            >
              {t('switchUser')}
            </button>

            <button 
              onClick={handleLogout} 
              className="p-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition"
              title={txt("সফটওয়্যার থেকে লগআউট করুন", "Logout")}
            >
              <LogOut size={14} /> {t('logout')}
            </button>
          </div>
        </div>
      </nav>

      {/* মূল কন্টেন্ট এরিয়া */}
      <div className="p-6 flex-1 max-w-7xl mx-auto w-full print:hidden">
        
        {/* চেক জমা দেওয়ার সতর্কতা ব্যানার (আগের দিন ও আজকের সতর্কতা) */}
        {chequeAlerts && chequeAlerts.length > 0 && (
          <div className="mb-5 bg-amber-50 border-2 border-amber-500 rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm animate-bounce">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                  <span>{txt('⚠️ চেক জমা দেওয়ার সতর্কতা / তাগিদ', '⚠️ Cheque Deposit Alert & Reminder')}</span>
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {chequeAlerts.length} {txt('টি চেক', 'Cheques')}
                  </span>
                </h4>
                <p className="text-xs text-amber-900 mt-0.5">
                  {chequeAlerts[0].days_until_deposit === 1 ? (
                    <>🔔 <strong>{txt('আগামীকাল', 'Tomorrow')} ({formatDateDMY(chequeAlerts[0].deposit_date)})</strong> {txt('কাস্টমার', 'Customer')} <strong>{chequeAlerts[0].customer_name}</strong>{txt('-এর', "'s")} {chequeAlerts[0].bank_name ? `(${chequeAlerts[0].bank_name})` : ''} {txt('চেক জমা দেওয়ার তারিখ!', 'cheque deposit date!')} ({txt('চেক নং:', 'Cheque No:')} {chequeAlerts[0].cheque_no || '-'}, ৳{Number(chequeAlerts[0].amount).toLocaleString()})</>
                  ) : chequeAlerts[0].days_until_deposit === 0 ? (
                    <>🚨 <strong>{txt('আজকেই', 'Today')} ({formatDateDMY(chequeAlerts[0].deposit_date)})</strong> {txt('কাস্টমার', 'Customer')} <strong>{chequeAlerts[0].customer_name}</strong>{txt('-এর চেক ব্যাংকে জমা দেওয়ার শেষ সময়!', "'s cheque deposit deadline today!")} (৳{Number(chequeAlerts[0].amount).toLocaleString()})</>
                  ) : (
                    <>⚠️ {txt('কাস্টমার', 'Customer')} <strong>{chequeAlerts[0].customer_name}</strong>{txt('-এর চেক জমা দেওয়ার মেয়াদ উত্তীর্ণ হয়েছে!', "'s cheque deposit date has passed!")}</>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setShowChequeModal(true); fetchAllCheques(); }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer shrink-0"
            >
              <Eye size={14} /> {txt('সমস্ত চেক খতিয়ান ও স্ট্যাটাস', 'All Cheques Ledger & Status')}
            </button>
          </div>
        )}

        {/* ১. POS কাউন্টার ট্যাব */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="relative">
                  <Barcode className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder={txt("বারকোড স্ক্যান করুন...", "Scan barcode...")}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeScan}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-blue-50/40 border-blue-200 focus:outline-blue-500"
                    autoFocus
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder={txt("পণ্য বা মডেল দিয়ে খুঁজুন...", "Search by product or model...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-blue-500"
                  />
                </div>
              </div>

              {/* ক্যাটাগরি ফিল্টার ও সার্ভিসিং বাটন */}
              <div className="flex justify-between items-center gap-2 pb-2 mb-2 border-b">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1">
                  {['All', ...MASTER_CATEGORIES].map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat === 'All' ? txt('সব পণ্য', 'All Products') : cat}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap shrink-0"
                  title={txt("ল্যাপটপ বা ডেস্কটপ সার্ভিসিং বিল তৈরি করুন", "Create laptop or desktop service bill")}
                >
                  <Wrench size={14} /> {txt('🔧 সার্ভিসিং বিল যোগ', '🔧 Add Service Bill')}
                </button>
              </div>

              {/* প্রোডাক্ট গ্রিড */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[58vh] overflow-y-auto pr-1">
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="p-3.5 border rounded-xl hover:border-blue-500 hover:shadow cursor-pointer transition flex flex-col justify-between bg-gray-50/50"
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">{p.category || 'General'}</span>
                        {p.model && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{p.model}</span>}
                      </div>
                      <h4 className="font-semibold text-gray-800 leading-tight mt-1.5 text-sm">{p.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.barcode || '-'}</p>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="font-bold text-blue-600 text-sm">৳ {p.selling_price}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${p.current_stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {txt('স্টক: ', 'Stock: ')}{p.current_stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* কার্ট সেকশন */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b pb-2 mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3 rounded-xl shadow-xs">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold flex items-center gap-1.5"><ShoppingCart size={16} /> {txt('বিক্রয় বিল / কার্ট', 'Sale Bill / Cart')}</h2>
                    <button
                      onClick={() => setShowServiceModal(true)}
                      className="px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                      title={txt("ল্যাপটপ/ডেস্কটপ সার্ভিসিং বিল যোগ করুন", "Add laptop/desktop service bill")}
                    >
                      <Wrench size={12} /> {txt('+ সার্ভিসিং', '+ Service')}
                    </button>
                  </div>
                  <span className="text-[11px] bg-white/20 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full font-bold border border-white/20">
                    {txt('সেলসম্যান: ', 'Salesman: ')}{currentUser.fullname}
                  </span>
                </div>
                
                {/* কাস্টমার অটো-সাজেশন */}
                <div className="space-y-2 mb-3 relative">
                  <div>
                    <input
                      type="text"
                      placeholder={txt("কাস্টমারের নাম লিখুন (পূর্বে থাকলে তালিকা আসবে)...", "Enter customer name (auto-suggests existing)...")}
                      value={customerName}
                      onChange={e => {
                        setCustomerName(e.target.value);
                        setSelectedCustomerId(null);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full text-xs border border-gray-300 p-2 rounded outline-none focus:border-blue-500 font-medium"
                    />

                    {showSuggestions && customerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-9 bg-white border border-blue-300 shadow-xl rounded-lg max-h-48 overflow-y-auto z-50 divide-y">
                        {customerSuggestions.map(c => (
                          <div
                            key={c.id}
                            onClick={() => selectSuggestedCustomer(c)}
                            className="p-2.5 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-xs"
                          >
                            <div>
                              <p className="font-bold text-gray-800">{c.name}</p>
                              <p className="text-[10px] text-gray-500">{txt('মোবাইল: ', 'Mobile: ')}{c.mobile || txt('নেই', 'None')}</p>
                            </div>
                            <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              {txt('পূর্বের বকেয়া: ৳', 'Previous Due: ৳')}{c.total_due}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder={txt("মোবাইল নম্বর", "Mobile number")}
                    value={customerMobile}
                    onChange={e => setCustomerMobile(e.target.value)}
                    className="w-full text-xs border border-gray-300 p-2 rounded outline-none focus:border-blue-500"
                  />
                  {selectedCustomerId && (
                    <div className="text-[11px] text-green-700 font-bold bg-green-50 p-1.5 rounded flex justify-between">
                      <span>✓ {txt('কাস্টমার নির্বাচিত: ', 'Customer Selected: ')}{customerName}</span>
                      <span className="text-red-600">{txt('পূর্বের বাকি: ৳', 'Previous Due: ৳')}{customerPreviousDue}</span>
                    </div>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-3 border-t pt-2">
                  {cart.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">{txt('কার্ট খালি', 'Cart is empty')}</p>
                  ) : (
                    cart.map((item, index) => (
                      <div key={item.id || index} className="border-b pb-2.5">
                        <div className="flex justify-between items-start text-xs">
                          <div className="flex-1 pr-1">
                            <p className="font-bold text-gray-800 flex items-center flex-wrap gap-1">
                              {item.is_service && (
                                <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold">
                                  🔧 {txt('সার্ভিসিং', 'Service')}
                                </span>
                              )}
                              <span>{item.name}</span>
                              {item.model && <span className="text-[11px] text-gray-500 font-mono font-normal">[{item.model}]</span>}
                            </p>
                            <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span>৳ {item.selling_price || item.sale_price} x {item.qty} = ৳ {(Number(item.selling_price || item.sale_price || 0) * item.qty)}</span>
                              {Number(item.discount || 0) > 0 && (
                                <span className="text-amber-700 font-bold text-[10px] bg-amber-100/80 px-1.5 py-0.2 rounded border border-amber-300">
                                  -৳{Number(item.discount).toLocaleString()} ({txt('নিট:', 'Net:')} ৳{Math.max(0, (Number(item.selling_price || item.sale_price || 0) * item.qty) - Number(item.discount)).toLocaleString()})
                                </span>
                              )}
                            </div>

                            {/* বিক্রয় বিলকার্টে পণ্যের ওয়ারেন্টি ও আলাদা ডিসকাউন্ট */}
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] flex-wrap">
                              <span className="text-gray-500 font-semibold whitespace-nowrap">{txt('ওয়ারেন্টি:', 'Warranty:')}</span>
                              <input
                                type="text"
                                placeholder={txt("ওয়ারেন্টি লিখুন...", "Enter warranty...")}
                                value={item.warranty || ''}
                                onChange={e => setCart(cart.map((c, i) => i === index ? { ...c, warranty: e.target.value } : c))}
                                className="border border-blue-200 bg-blue-50/40 rounded px-1.5 py-0.5 text-[11px] text-blue-800 font-medium w-24 outline-none focus:bg-white focus:border-blue-500"
                              />
                              <select
                                value={['1 month', '3 months', '6 months', '1 year', '2 years', '3 years', 'লাইফটাইম', 'নন-ওয়ারেন্টি'].includes(item.warranty) ? item.warranty : ''}
                                onChange={e => {
                                  if (e.target.value) {
                                    setCart(cart.map((c, i) => i === index ? { ...c, warranty: e.target.value } : c));
                                  }
                                }}
                                className="border border-gray-200 rounded px-1 py-0.5 text-[10px] bg-white text-gray-600 outline-none cursor-pointer"
                                title={txt("কুইক ওয়ারেন্টি সিলেক্ট", "Quick warranty select")}
                              >
                                <option value="">{txt('বাছাই', 'Select')}</option>
                                <option value="1 month">1 mo</option>
                                <option value="3 months">3 mo</option>
                                <option value="6 months">6 mo</option>
                                <option value="1 year">1 yr</option>
                                <option value="2 years">2 yr</option>
                                <option value="3 years">3 yr</option>
                                <option value="লাইফটাইম">{txt('লাইফটাইম', 'Lifetime')}</option>
                                <option value="নন-ওয়ারেন্টি">{txt('নন-ওয়ারেন্টি', 'None')}</option>
                              </select>

                              {/* প্রতিটি পণ্যের আলাদা ডিসকাউন্ট ইনপুট */}
                              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                                <span className="text-amber-800 font-bold text-[10px] whitespace-nowrap">{txt('ছাড় (৳):', 'Disc (৳):')}</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={item.discount !== undefined ? item.discount : ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setCart(cart.map((c, i) => i === index ? { ...c, discount: val } : c));
                                  }}
                                  className="w-16 border border-amber-300 bg-white rounded px-1 py-0.2 text-[11px] text-amber-900 font-mono font-bold text-right outline-none focus:border-amber-500"
                                  title={txt("এই নির্দিষ্ট পণ্যের জন্য আলাদা ছাড় / ডিসকাউন্ট (৳)", "Individual discount (৳) for this product")}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            <button onClick={() => setCart(cart.map((c, i) => i === index ? { ...c, qty: Math.max(1, c.qty - 1) } : c))} className="px-2 bg-gray-200 rounded font-bold cursor-pointer hover:bg-gray-300">-</button>
                            <span className="font-bold px-1">{item.qty}</span>
                            <button onClick={() => setCart(cart.map((c, i) => i === index ? { ...c, qty: Math.min(item.current_stock || 9999, c.qty + 1) } : c))} className="px-2 bg-gray-200 rounded font-bold cursor-pointer hover:bg-gray-300">+</button>
                            <button onClick={() => setCart(cart.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700 ml-1 cursor-pointer"><Trash2 size={14} /></button>
                          </div>
                        </div>

                        {/* সিরিয়াল ফিল্ড: শুধুমাত্র যেসব পণ্যে স্টকে সিরিয়াল রয়েছে */}
                        {item.available_serials ? (() => {
                          const availableList = item.available_serials.split(',').map(s => s.trim()).filter(Boolean);
                          const availableUpper = availableList.map(s => s.toUpperCase());
                          const currentSerials = (typeof item.raw_serials_input === 'string')
                            ? item.raw_serials_input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
                            : (Array.isArray(item.selected_serials) ? item.selected_serials : []);
                          const invalidSerials = currentSerials.filter(sn => !availableUpper.includes(sn.toUpperCase()));
                          const isCountMatch = currentSerials.length === item.qty && invalidSerials.length === 0;

                          return (
                            <div className="mt-1.5 space-y-1">
                              <input
                                type="text"
                                placeholder={txt("স্টকের সিরিয়াল স্ক্যান বা লিখুন (যেমন: SN01, SN02)...", "Scan or enter stock serials (e.g. SN01, SN02)...")}
                                value={item.raw_serials_input !== undefined ? item.raw_serials_input : (Array.isArray(item.selected_serials) ? item.selected_serials.join(', ') : '')}
                                onChange={(e) => handleSerialChange(index, e.target.value)}
                                onKeyDown={(e) => handleSerialKeyDown(index, e)}
                                className={`w-full text-xs border rounded p-1.5 font-mono outline-none shadow-inner transition ${
                                  invalidSerials.length > 0 
                                    ? 'border-red-400 bg-red-50 text-red-900 focus:border-red-600' 
                                    : isCountMatch
                                    ? 'border-green-400 bg-green-50/40 text-green-900 focus:border-green-600'
                                    : 'border-blue-300 bg-yellow-50 focus:bg-white focus:border-blue-600'
                                }`}
                              />
                              <div className="text-[10px] flex justify-between font-medium">
                                <span className="text-gray-500">{txt('প্রয়োজনীয়: ', 'Required: ')}<strong className="text-blue-600">{item.qty}</strong> {txt('টি', 'pcs')}</span>
                                <span className={isCountMatch ? 'text-green-700 font-bold' : invalidSerials.length > 0 ? 'text-red-600 font-bold' : 'text-orange-600 font-bold'}>
                                  {txt('যুক্ত হয়েছে: ', 'Added: ')}<strong>{currentSerials.length}</strong> {txt('টি', 'pcs')} {isCountMatch && '✓'}
                                </span>
                              </div>

                              {/* ভুল সিরিয়াল থাকলে ওয়ার্নিং মেসেজ */}
                              {invalidSerials.length > 0 && (
                                <p className="text-[10px] text-red-600 font-bold bg-red-50 p-1 rounded border border-red-200">
                                  ⚠️ {txt('স্টকে নেই বা ভুল সিরিয়াল: ', 'Not in stock or invalid serial: ')}"{invalidSerials.join(', ')}"
                                </p>
                              )}

                              {/* দ্রুত নির্বাচনের জন্য স্টকে থাকা সিরিয়াল ব্যাজ */}
                              {availableList.length > 0 && (
                                <div className="pt-0.5">
                                  <div className="text-[10px] text-gray-500 font-medium mb-1 flex items-center justify-between">
                                    <span>{txt('স্টক সিরিয়াল (ক্লিক করে নির্বাচন করুন):', 'Stock Serials (click to select):')}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto scrollbar-thin">
                                    {availableList.map((sn, sIdx) => {
                                      const isSelected = currentSerials.some(s => s.toUpperCase() === sn.toUpperCase());
                                      return (
                                        <button
                                          key={sIdx}
                                          type="button"
                                          onClick={() => toggleCartSerial(index, sn)}
                                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
                                            isSelected 
                                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs' 
                                              : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-400'
                                          }`}
                                          title={isSelected ? txt('বাদ দিতে ক্লিক করুন', 'Click to remove') : txt('যোগ করতে ক্লিক করুন', 'Click to add')}
                                        >
                                          {isSelected ? `✓ ${sn}` : `+ ${sn}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          <p className="text-[10px] text-gray-400 font-mono mt-1 bg-gray-50 p-1 rounded">✓ {txt('নন-বারকোড সাধারণ পণ্য (সিরিয়াল ছাড়া বিক্রয়যোগ্য)', 'Non-barcode regular item (sold without serial)')}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* বিল ক্যালকুলেশন, ডিসকাউন্ট, নোট ও ৫-পয়েন্ট ডিউ সামারি */}
              <div className="border-t pt-2 space-y-2 mt-2">
                {/* ডিসকাউন্ট ও পেমেন্ট মেথড */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700">{txt('অতিরিক্ত / বিশেষ ছাড় (৳):', 'Extra Special Discount (৳):')}</label>
                    <input
                      type="number"
                      min="0"
                      placeholder={txt("অতিরিক্ত ছাড়...", "Extra discount...")}
                      value={discountAmount}
                      onChange={e => setDiscountAmount(e.target.value)}
                      className="w-full text-xs border border-orange-300 bg-orange-50/50 p-1.5 rounded outline-none font-bold text-orange-700 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700">{txt('পেমেন্ট মেথড:', 'Payment Method:')}</label>
                    <select 
                      value={paymentType} 
                      onChange={e => {
                        const val = e.target.value;
                        setPaymentType(val);
                        if (val === 'Due') {
                          setPaidAmount('0');
                        }
                      }} 
                      className="w-full text-xs border p-1.5 rounded bg-white outline-none"
                    >
                      <option value="Cash">Cash {txt('(নগদ)', '(Cash)')}</option>
                      <option value="Due">Due {txt('(বাকি বিক্রয়)', '(Due Sale)')}</option>
                      <option value="Bank">Bank {txt('(ব্যাংক)', '(Bank)')}</option>
                      <option value="bKash">bKash {txt('(বিকাশ)', '(bKash)')}</option>
                    </select>
                  </div>
                </div>

                {/* বিল নোট */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700">{txt('ইনভয়েস বিশেষ নোট (ঐচ্ছিক):', 'Invoice Special Note (Optional):')}</label>
                  <input
                    type="text"
                    placeholder={txt('যেমন: ৩ দিন পর বাকি পরিশোধ / বিশেষ নির্দেশনা...', 'e.g. Due clearance in 3 days / special notes...')}
                    value={billNote}
                    onChange={e => setBillNote(e.target.value)}
                    className="w-full text-xs border border-gray-300 p-1.5 rounded outline-none focus:border-blue-500"
                  />
                </div>

                {/* ৫-পয়েন্ট পূর্ণাঙ্গ হিসাবের কার্ড */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-700">
                    <span>{txt('আইটেম মোট মূল্য:', 'Items Total Price:')}</span>
                    <span className="font-mono">৳ {subTotal.toLocaleString()}</span>
                  </div>
                  {itemDiscountsTotal > 0 && (
                    <div className="flex justify-between text-amber-700 font-medium">
                      <span>{txt('পণ্যের আলাদা ছাড় মোট:', 'Item Discounts Total:')}</span>
                      <span className="font-mono font-bold">- ৳ {itemDiscountsTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {extraDiscount > 0 && (
                    <div className="flex justify-between text-orange-600 font-medium">
                      <span>{txt('অতিরিক্ত বিশেষ ছাড়:', 'Extra Special Discount:')}</span>
                      <span className="font-mono font-bold">- ৳ {extraDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {netDiscount > 0 && (
                    <div className="flex justify-between text-orange-700 font-bold border-t border-orange-200 pt-0.5">
                      <span>{txt('সর্বমোট ছাড় (ডিসকাউন্ট):', 'Total Discount:')}</span>
                      <span className="font-mono font-black">- ৳ {netDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-blue-700 border-t pt-1">
                    <span>{txt('১. বর্তমান মোট বিল:', '1. Current Bill Total:')}</span>
                    <span className="font-mono">৳ {netBillTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-semibold text-gray-700 whitespace-nowrap">{txt('২. বর্তমান বিল বাবদ প্রদান:', '2. Paid for Current Bill:')}</span>
                    <input
                      type="number"
                      placeholder={txt('টাকার পরিমাণ...', 'Amount...')}
                      value={paidAmount}
                      onChange={e => setPaidAmount(e.target.value)}
                      className="w-28 text-xs border border-green-400 bg-green-50/50 p-1 rounded font-bold text-green-700 text-right outline-none"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-red-600">
                    <span>{txt('৩. বর্তমান বিলের বাকি:', '3. Current Bill Due:')}</span>
                    <span className="font-mono">৳ {currentBillDue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 border-t pt-1">
                    <span>{txt('৪. কাস্টমারের পূর্বের মোট বাকি:', '4. Customer Previous Due:')}</span>
                    <span className="font-mono font-bold">৳ {customerPreviousDue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-red-700 bg-red-50 p-1.5 rounded border border-red-200">
                    <span>{txt('৫. পূর্বের টাকাসহ মোট বাকি:', '5. Total Due with Previous:')}</span>
                    <span className="font-mono">৳ {totalDueWithPrevious.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> {txt('কনফার্ম ও ইনভয়েস প্রিন্ট', 'Confirm & Print Invoice')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ২. বিক্রয় ফেরত (Sales Return) ট্যাব: বারকোড ও নন-বারকোড পণ্য */}
        {activeTab === 'returns' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-3 border-b">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <RotateCcw className="text-rose-600" size={20} /> {txt('বিক্রিত পণ্য ফেরত ব্যবস্থাপনা (Sales Return)', 'Sales Return Management')}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {txt('বারকোডযুক্ত বা বারকোড ছাড়া সাধারণ যেকোনো পণ্য ফেরত নিয়ে ইনভয়েস ও কাস্টমার হিসাব সমন্বয় করুন।', 'Return barcoded or non-barcoded items and reconcile invoices and customer balance.')}
                  </p>
                </div>

                {/* রিটার্ন মোড বাটন (বারকোড বনাম বারকোড ছাড়া) */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setReturnMode('barcode'); setManualInvoiceData(null); setSelectedReturnItem(null); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${returnMode === 'barcode' ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {txt('১. বারকোড স্ক্যান করে ফেরত', '1. Return by Barcode Scan')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReturnMode('manual'); setVerifiedBarcodeItem(null); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${returnMode === 'manual' ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {txt('২. বারকোড ছাড়া পণ্য ফেরত (ইনভয়েস ভিত্তিক)', '2. Non-Barcode Return (Invoice Based)')}
                  </button>
                </div>
              </div>

              {/* মোড ১: নির্দিষ্ট বারকোড স্ক্যান করে ফেরত */}
              {returnMode === 'barcode' && (
                <div>
                  <form onSubmit={handleVerifyReturnBarcode} className="flex gap-2 mb-6 max-w-lg">
                    <div className="relative flex-1">
                      <Barcode className="absolute left-3 top-2.5 text-gray-400" size={18} />
                      <input
                        type="text"
                        required
                        placeholder={txt("ফেরত পণ্যের বারকোড / সিরিয়াল স্ক্যান করুন...", "Scan returned product barcode / serial...")}
                        value={returnBarcodeScan}
                        onChange={e => setReturnBarcodeScan(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg text-xs font-mono outline-none focus:border-rose-600 bg-rose-50/20"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={returnLoading}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition disabled:opacity-50"
                    >
                      {returnLoading ? txt('যাচাই হচ্ছে...', 'Verifying...') : txt('যাচাই করুন', 'Verify')}
                    </button>
                  </form>

                  {/* যাচাইকৃত পণ্যের তথ্য ও রিটার্ন কনফার্মেশন */}
                  {verifiedBarcodeItem && (
                    <div className="border border-rose-300 bg-rose-50/30 rounded-xl p-5 space-y-4 max-w-3xl">
                      <div className="flex justify-between items-start border-b border-rose-200 pb-3">
                        <div>
                          <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded uppercase">{txt('বিক্রিত পণ্যের বিবরণ', 'Sold Item Details')}</span>
                          <h3 className="font-bold text-base text-gray-900 mt-1">{verifiedBarcodeItem.product_name}</h3>
                          <p className="text-xs text-gray-600 font-mono">{txt('বারকোড: ', 'Barcode: ')}{verifiedBarcodeItem.serial_number} | {txt('মডেল: ', 'Model: ')}{verifiedBarcodeItem.product_model || '-'}</p>
                        </div>
                        <button onClick={() => setVerifiedBarcodeItem(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={18} /></button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-lg border border-gray-200">
                        <div>
                          <p className="flex items-center gap-2">
                            <strong>{txt('ইনভয়েস নং:', 'Invoice No:')}</strong> 
                            <span className="font-mono text-blue-600 font-bold">{verifiedBarcodeItem.invoice_no}</span>
                            {verifiedBarcodeItem.invoice_id && (
                              <button
                                type="button"
                                onClick={() => handleViewInvoiceDetails(verifiedBarcodeItem.invoice_id)}
                                className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[10px] font-bold cursor-pointer print:hidden inline-flex items-center gap-0.5"
                              >
                                📄 {txt('মূল বিল দেখুন', 'View Original Bill')}
                              </button>
                            )}
                          </p>
                          <p><strong>{txt('বিক্রির তারিখ:', 'Sale Date:')}</strong> {formatDateDMY(verifiedBarcodeItem.sold_date)}</p>
                          <p><strong>{txt('ইনভয়েস মোট বিল:', 'Invoice Total Bill:')}</strong> ৳{verifiedBarcodeItem.total_amount}</p>
                        </div>
                        <div>
                          <p><strong>{txt('ক্রেতার নাম:', 'Customer Name:')}</strong> {verifiedBarcodeItem.customer_name}</p>
                          <p><strong>{txt('মোবাইল:', 'Mobile:')}</strong> {verifiedBarcodeItem.customer_mobile}</p>
                          <p><strong>{txt('বর্তমান বকেয়া:', 'Current Due:')}</strong> ৳{verifiedBarcodeItem.due_amount}</p>
                        </div>
                      </div>

                      <form onSubmit={handleConfirmBarcodeReturn} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                        <div>
                          <label className="font-bold text-gray-700">{txt('ফেরত মূল্য (৳) *', 'Refund Amount (৳) *')}</label>
                          <input
                            type="number"
                            required
                            value={returnForm.refund_amount}
                            onChange={e => setReturnForm({ ...returnForm, refund_amount: e.target.value })}
                            className="w-full border p-2 rounded mt-1 outline-none focus:border-rose-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-gray-700">{txt('সমন্বয় মেথড', 'Adjustment Method')}</label>
                          <select
                            value={returnForm.refund_type}
                            onChange={e => setReturnForm({ ...returnForm, refund_type: e.target.value })}
                            className="w-full border p-2 rounded mt-1 bg-white outline-none focus:border-rose-500"
                          >
                            <option value="Deduce_Due">{txt('ইনভয়েস ও বকেয়া থেকে মাইনাস', 'Deduct from Invoice & Due')}</option>
                            <option value="Cash_Refund">{txt('নগদ মূল্য ফেরত প্রদান', 'Cash Refund to Customer')}</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-gray-700">{txt('ফেরতের কারণ', 'Return Reason')}</label>
                          <input
                            type="text"
                            placeholder={txt("যেমন: পণ্য নষ্ট / পরিবর্তন", "e.g. Defective item / exchange")}
                            value={returnForm.return_reason}
                            onChange={e => setReturnForm({ ...returnForm, return_reason: e.target.value })}
                            className="w-full border p-2 rounded mt-1 outline-none focus:border-rose-500"
                          />
                        </div>

                        <div className="md:col-span-3 pt-2">
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-md"
                          >
                            ✓ {txt('ইনভয়েস থেকে পণ্যটি মাইনাস করুন ও স্টকে ফেরত নিন', 'Deduct Item from Invoice & Return to Stock')}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* মোড ২: বারকোড ছাড়া পণ্য ফেরত (ইনভয়েস ভিত্তিক) */}
              {returnMode === 'manual' && (
                <div>
                  <form onSubmit={handleSearchInvoiceForReturn} className="flex gap-2 mb-6 max-w-lg">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                      <input
                        type="text"
                        required
                        placeholder={txt("ইনভয়েস নম্বর লিখুন (যেমন: INV-123456)...", "Enter invoice number (e.g. INV-123456)...")}
                        value={manualInvoiceSearch}
                        onChange={e => setManualInvoiceSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg text-xs font-mono outline-none focus:border-rose-600 bg-rose-50/20"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={returnLoading}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition disabled:opacity-50"
                    >
                      {returnLoading ? txt('খোঁজা হচ্ছে...', 'Searching...') : txt('ইনভয়েস খুঁজুন', 'Search Invoice')}
                    </button>
                  </form>

                  {/* ইনভয়েস ও পণ্যের তালিকা */}
                  {manualInvoiceData && (
                    <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-5 space-y-4 max-w-3xl">
                      <div className="flex justify-between items-start border-b border-rose-200 pb-3">
                        <div>
                          <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded uppercase">{txt('ইনভয়েসের তথ্য', 'Invoice Details')}</span>
                          <h3 className="font-bold text-base text-gray-900 mt-1">{txt('ইনভয়েস:', 'Invoice:')} {manualInvoiceData.invoice.invoice_no}</h3>
                          <p className="text-xs text-gray-600">{txt('গ্রাহক:', 'Customer:')} {manualInvoiceData.invoice.customer_name} | {txt('তারিখ:', 'Date:')} {formatDateDMY(manualInvoiceData.invoice.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewInvoiceDetails(manualInvoiceData.invoice.id)}
                            className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            📄 {txt('মূল বিল দেখুন', 'View Original Bill')}
                          </button>
                          <button onClick={() => { setManualInvoiceData(null); setSelectedReturnItem(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={18} /></button>
                        </div>
                      </div>

                      {/* ইনভয়েসের আইটেম টেবিল */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 mb-2">
                          {txt("এই ইনভয়েসের পণ্যসমূহ (ফেরত নিতে যেকোনো পণ্যের পাশে 'ফেরত নির্বাচন' ক্লিক করুন):", "Items in this invoice (click 'Select for Return' next to an item):")}
                        </h4>
                        <table className="w-full text-left border-collapse text-xs bg-white rounded-lg overflow-hidden border">
                          <thead>
                            <tr className="bg-gray-100 text-gray-700 border-b">
                              <th className="p-2">{txt('পণ্যের নাম ও মডেল', 'Product Name & Model')}</th>
                              <th className="p-2">{txt('ওয়ারেন্টি', 'Warranty')}</th>
                              <th className="p-2 text-center">{txt('বিক্রীত পরিমাণ', 'Sold Quantity')}</th>
                              <th className="p-2 text-right">{txt('একক দর', 'Unit Price')}</th>
                              <th className="p-2 text-right">{txt('মোট দর', 'Total Price')}</th>
                              <th className="p-2 text-center">{txt('অ্যাকশন', 'Action')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {manualInvoiceData.items.map(item => (
                              <tr key={item.id} className={selectedReturnItem?.id === item.id ? 'bg-rose-50' : 'hover:bg-gray-50'}>
                                <td className="p-2">
                                  <p className="font-bold text-gray-800">{item.product_name}</p>
                                  {item.model && <p className="text-[10px] text-gray-500 font-mono">{txt('মডেল: ', 'Model: ')}{item.model}</p>}
                                </td>
                                <td className="p-2">{item.warranty || txt('নন-ওয়ারেন্টি', 'Non-Warranty')}</td>
                                <td className="p-2 text-center font-bold">{item.quantity} {txt('টি', 'pcs')}</td>
                                <td className="p-2 text-right">৳ {Number(item.unit_price).toLocaleString()}</td>
                                <td className="p-2 text-right font-bold">৳ {Number(item.total_price).toLocaleString()}</td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedReturnItem(item);
                                      setManualReturnForm({
                                        quantity: 1,
                                        refund_amount: Number(item.unit_price),
                                        refund_type: 'Deduce_Due',
                                        return_reason: txt('নন-বারকোড পণ্য ফেরত', 'Non-barcode product return')
                                      });
                                    }}
                                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${selectedReturnItem?.id === item.id ? 'bg-rose-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                                  >
                                    {selectedReturnItem?.id === item.id ? txt('✓ নির্বাচিত', '✓ Selected') : txt('ফেরত নির্বাচন', 'Select for Return')}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* নির্বাচিত আইটেমের ফেরত ফরম */}
                      {selectedReturnItem && (
                        <div className="bg-white p-4 rounded-xl border border-rose-300 shadow-sm mt-3">
                          <h4 className="font-bold text-gray-800 text-xs border-b pb-2 mb-3 text-rose-700">
                            {txt('নির্বাচিত পণ্য ফেরত কনফার্মেশন: ', 'Confirm Return of Selected Product: ')}{selectedReturnItem.product_name}
                          </h4>
                          <form onSubmit={handleConfirmManualReturn} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <label className="font-bold text-gray-700">
                                {txt('ফেরত পরিমাণ (সর্বোচ্চ ', 'Return Quantity (Max ')}{selectedReturnItem.quantity}) *
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={selectedReturnItem.quantity}
                                required
                                value={manualReturnForm.quantity}
                                onChange={e => {
                                  const q = Math.min(selectedReturnItem.quantity, Math.max(1, Number(e.target.value)));
                                  setManualReturnForm({
                                    ...manualReturnForm,
                                    quantity: q,
                                    refund_amount: q * Number(selectedReturnItem.unit_price)
                                  });
                                }}
                                className="w-full border p-2 rounded mt-1 font-bold outline-none focus:border-rose-500"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-gray-700">{txt('ফেরত মূল্য (৳) *', 'Refund Amount (৳) *')}</label>
                              <input
                                type="number"
                                required
                                value={manualReturnForm.refund_amount}
                                onChange={e => setManualReturnForm({ ...manualReturnForm, refund_amount: e.target.value })}
                                className="w-full border p-2 rounded mt-1 font-bold outline-none focus:border-rose-500"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-gray-700">{txt('সমন্বয় মেথড', 'Adjustment Method')}</label>
                              <select
                                value={manualReturnForm.refund_type}
                                onChange={e => setManualReturnForm({ ...manualReturnForm, refund_type: e.target.value })}
                                className="w-full border p-2 rounded mt-1 bg-white outline-none focus:border-rose-500"
                              >
                                <option value="Deduce_Due">{txt('ইনভয়েস ও বকেয়া থেকে মাইনাস', 'Deduct from Invoice & Due')}</option>
                                <option value="Cash_Refund">{txt('নগদ মূল্য ফেরত প্রদান', 'Cash Refund to Customer')}</option>
                              </select>
                            </div>

                            <div>
                              <label className="font-bold text-gray-700">{txt('ফেরতের কারণ', 'Return Reason')}</label>
                              <input
                                type="text"
                                placeholder={txt("যেমন: পণ্য ত্রুটি / পরিবর্তন", "e.g. Defective item / exchange")}
                                value={manualReturnForm.return_reason}
                                onChange={e => setManualReturnForm({ ...manualReturnForm, return_reason: e.target.value })}
                                className="w-full border p-2 rounded mt-1 outline-none focus:border-rose-500"
                              />
                            </div>

                            <div className="md:col-span-4 pt-2">
                              <button
                                type="submit"
                                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-md"
                              >
                                ✓ {txt('নন-বারকোড পণ্যটি ফেরত নিন, স্টক বাড়ান ও ইনভয়েস সমন্বয় করুন', 'Return Non-Barcode Item, Restock & Reconcile Invoice')}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* পূর্বে ফেরত নেওয়া পণ্যের খতিয়ান (Return Logs) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base font-bold text-gray-800 mb-3">{txt('পণ্য ফেরতের খতিয়ান (Return Logs)', 'Product Return Logs')}</h3>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-600">
                    <th className="p-2.5">{txt('তারিখ', 'Date')}</th>
                    <th className="p-2.5">{txt('ইনভয়েস', 'Invoice')}</th>
                    <th className="p-2.5">{txt('পণ্য ও মডেল', 'Product & Model')}</th>
                    <th className="p-2.5">{txt('ফেরত বারকোড / সিরিয়াল', 'Return Barcode / Serial')}</th>
                    <th className="p-2.5">{txt('ক্রেতা', 'Customer')}</th>
                    <th className="p-2.5 text-right">{txt('ফেরত মূল্য', 'Refund Amount')}</th>
                    <th className="p-2.5">{txt('বর্তমান অবস্থা', 'Current Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {returnsHistoryList.map(ret => (
                    <tr key={ret.id} className="hover:bg-gray-50">
                      <td className="p-2.5">{formatDateDMY(ret.return_date)}</td>
                      <td className="p-2.5">
                        <span className="font-mono font-bold text-blue-600 mr-2">{ret.invoice_no}</span>
                        {ret.invoice_id && (
                          <button
                            type="button"
                            onClick={() => handleViewInvoiceDetails(ret.invoice_id)}
                            className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[10px] font-bold cursor-pointer print:hidden inline-flex items-center gap-0.5"
                            title={txt("সম্পূর্ণ বিক্রয় বিল দেখুন", "View full sale invoice")}
                          >
                            📄 {txt('বিল দেখুন', 'View Bill')}
                          </button>
                        )}
                      </td>
                      <td className="p-2.5 font-bold">
                        {ret.product_name}
                        {ret.product_model && <span className="text-[10px] text-gray-500 font-mono ml-1">[{ret.product_model}]</span>}
                      </td>
                      <td className="p-2.5 font-mono text-rose-600 font-bold">{ret.serial_number || txt('নন-বারকোড', 'Non-Barcode')}</td>
                      <td className="p-2.5">{ret.customer_name}</td>
                      <td className="p-2.5 text-right font-bold text-gray-800">৳ {Number(ret.refund_amount).toLocaleString()}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 font-bold rounded text-[10px]">
                          {txt('পুনরায় স্টকে মজুদ (Available)', 'Restocked (Available)')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {returnsHistoryList.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-gray-400">{txt('এখনো কোনো পণ্য ফেরত নেওয়া হয়নি', 'No products returned yet')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ৩. বারকোড লাইফসাইকেল ট্র্যাকার */}
        {activeTab === 'barcode_search' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
                <Search size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{txt('পণ্যের লাইফসাইকেল ট্র্যাকার', 'Product Lifecycle Tracker')}</h2>
                <p className="text-xs text-gray-500">{txt('বারকোড স্ক্যান করে পণ্যের সোর্সিং, বিক্রয়, ফেরত ও বর্তমান অবস্থান দেখুন', 'Scan barcode to view product sourcing, sale, return, and current location')}</p>
              </div>
            </div>
            
            <form onSubmit={handleBarcodeSearch} className="flex gap-2 mb-6">
              <input
                type="text"
                required
                placeholder={txt("সিরিয়াল নম্বর স্ক্যান করুন বা লিখুন...", "Scan or enter serial number...")}
                value={barcodeSearch}
                onChange={e => setBarcodeSearch(e.target.value)}
                className="flex-1 border border-purple-200 p-2.5 rounded-xl text-sm outline-none focus:border-purple-600 font-mono"
                autoFocus
              />
              <button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer shadow-md shadow-purple-500/20 transition">
                {txt('অনুসন্ধান', 'Search')}
              </button>
            </form>

            {productLifecycle && (
              <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-5 space-y-4">
                <div className="border-b border-blue-200 pb-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase text-blue-700">{txt('পণ্য বিবরণ:', 'Product Details:')}</span>
                    <h3 className="text-base font-bold text-gray-900">{productLifecycle.product_name}</h3>
                    <p className="text-xs text-gray-600 font-mono">{txt('সিরিয়াল: ', 'Serial: ')}{productLifecycle.serial_number}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${productLifecycle.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {productLifecycle.status === 'sold' ? txt('বিক্রিত (Sold)', 'Sold') : txt('স্টকে মজুদ (In Stock)', 'In Stock')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">📥 {txt('ক্রয় সংক্রান্ত ইতিহাস:', 'Purchase History:')}</h4>
                    <p><strong>{txt('সাপ্লায়ার:', 'Supplier:')}</strong> {productLifecycle.supplier_name || txt('সরাসরি কেনা', 'Direct Purchase')}</p>
                    <p><strong>{txt('কোম্পানি:', 'Company:')}</strong> {productLifecycle.supplier_company || '-'}</p>
                    <p><strong>{txt('মোবাইল:', 'Mobile:')}</strong> {productLifecycle.supplier_mobile || '-'}</p>
                    <p><strong>{txt('ক্রয়ের তারিখ:', 'Purchase Date:')}</strong> {formatDateDMY(productLifecycle.purchase_date)}</p>
                    {currentUser.role === 'admin' && <p><strong>{txt('ক্রয় মূল্য:', 'Purchase Price:')}</strong> ৳ {productLifecycle.purchase_price}</p>}
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">📤 {txt('বিক্রয় ও অবস্থানের ইতিহাস:', 'Sale & Location History:')}</h4>
                    {productLifecycle.status === 'sold' ? (
                      <>
                        <p><strong>{txt('বিক্রিত ক্রেতা:', 'Customer:')}</strong> {productLifecycle.customer_name || txt('নগদ ক্রেতা', 'Cash Customer')}</p>
                        <p><strong>{txt('মোবাইল:', 'Mobile:')}</strong> {productLifecycle.customer_mobile || '-'}</p>
                        <p className="flex items-center gap-1.5">
                          <strong>{txt('ইনভয়েস:', 'Invoice:')}</strong> 
                          <span className="font-mono text-blue-600 font-bold">{productLifecycle.invoice_no}</span>
                          {productLifecycle.invoice_id && (
                            <button
                              type="button"
                              onClick={() => handleViewInvoiceDetails(productLifecycle.invoice_id)}
                              className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[10px] font-bold cursor-pointer print:hidden inline-flex items-center gap-0.5"
                            >
                              📄 {txt('বিল দেখুন', 'View Bill')}
                            </button>
                          )}
                        </p>
                        <p><strong>{txt('বিক্রির তারিখ:', 'Sale Date:')}</strong> {formatDateDMY(productLifecycle.sold_date)}</p>
                        <p className="mt-1 text-red-600 font-bold">{txt('অবস্থান: গ্রাহকের নিকট রয়েছে', 'Location: With Customer')}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-green-700 font-bold">{txt('অবস্থান: শোরুম / ইনভেন্টরি স্টকে মজুদ', 'Location: In Stock at Showroom')}</p>
                        {productLifecycle.returned_date && (
                          <div className="mt-2 pt-2 border-t text-[11px] text-rose-700">
                            <p><strong>{txt('পূর্বে ফেরত নেওয়া হয়েছে:', 'Returned Date:')}</strong> {formatDateDMY(productLifecycle.returned_date)}</p>
                            <p><strong>{txt('নোট:', 'Note:')}</strong> {productLifecycle.return_note || txt('পণ্য ফেরত', 'Item Returned')}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ৪. কোটেশন তৈরি ও খতিয়ান ট্যাব */}
        {activeTab === 'quotation' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* সাব-ট্যাব ন্যাভিগেশন */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800">{txt('কাস্টমার ফরমাল কোটেশন সিস্টেম', 'Customer Formal Quotation System')}</h2>
                  <p className="text-xs text-gray-500">{txt('ইচ্ছামত পণ্য, পরিমাণ, দর লিখে প্রফেশনাল প্যাডে কোটেশন তৈরি ও সংরক্ষণ', 'Create and save professional letterhead quotations with customized products, quantities and rates')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuotationSubTab('create')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                    quotationSubTab === 'create' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Plus size={14} /> {txt('নতুন কোটেশন তৈরি', 'Create New Quotation')}
                </button>
                <button
                  type="button"
                  onClick={() => { setQuotationSubTab('history'); fetchQuotations(); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                    quotationSubTab === 'history' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <History size={14} /> {txt('সংরক্ষিত কোটেশন তালিকা', 'Saved Quotations List')} ({quotationList.length})
                </button>
              </div>
            </div>

            {/* ১. নতুন কোটেশন তৈরির ফর্ম */}
            {quotationSubTab === 'create' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
                {/* কাস্টমার ও মেটা তথ্য */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">{txt('কাস্টমার / প্রতিষ্ঠানের নাম *', 'Customer / Company Name *')}</label>
                    <input
                      type="text"
                      required
                      placeholder={txt("যেমন: প্রিমিয়াম সিগনেচার / রহিম আহমেদ", "e.g. Premium Signature / Rahim Ahmed")}
                      value={quotationCustomer}
                      onChange={e => setQuotationCustomer(e.target.value)}
                      className="w-full border p-2 rounded-lg text-xs outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">{txt('কোটেশনের বিষয় / শিরোনাম', 'Quotation Subject / Title')}</label>
                    <input
                      type="text"
                      placeholder={txt("যেমন: PABX QUOTATION / CCTV CAMERA INSTALLATION", "e.g. PABX QUOTATION / CCTV CAMERA INSTALLATION")}
                      value={quotationSubject}
                      onChange={e => setQuotationSubject(e.target.value)}
                      className="w-full border p-2 rounded-lg text-xs outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">{txt('মোবাইল নম্বর', 'Mobile Number')}</label>
                    <input
                      type="text"
                      placeholder={txt("যেমন: 01812-XXXXXX", "e.g. 01812-XXXXXX")}
                      value={quotationMobile}
                      onChange={e => setQuotationMobile(e.target.value)}
                      className="w-full border p-2 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">{txt('ঠিকানা / লোকেশন', 'Address / Location')}</label>
                    <input
                      type="text"
                      placeholder={txt("যেমন: খুলশী, চট্টগ্রাম", "e.g. Khulshi, Chattogram")}
                      value={quotationAddress}
                      onChange={e => setQuotationAddress(e.target.value)}
                      className="w-full border p-2 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">{txt('ইস্যুর তারিখ', 'Issue Date')}</label>
                    <input
                      type="date"
                      value={quotationDate}
                      onChange={e => setQuotationDate(e.target.value)}
                      className="w-full border p-2 rounded-lg text-xs outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">{txt('কার্যকারিতার মেয়াদ (Valid Until)', 'Valid Until')}</label>
                    <input
                      type="date"
                      value={quotationValid}
                      onChange={e => setQuotationValid(e.target.value)}
                      className="w-full border p-2 rounded-lg text-xs outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>
                </div>

                {/* নিজস্ব পণ্যের তালিকা টেবিল */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-800 text-white px-4 py-2.5 flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <FileText size={15} /> {txt('পণ্যের বিবরণ ও মূল্য তালিকা (নিজের ইচ্ছামত টাইপ করুন)', 'Items & Price Breakdown (Free-type description)')}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleImportCartToQuotation}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title={txt("বর্তমান POS কার্টের আইটেমগুলো যুক্ত করুন", "Import current POS cart items")}
                      >
                        <ShoppingCart size={13} /> {txt('কার্ট থেকে আনুন', 'Import from Cart')}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddQuotationRow}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> {txt('+ পণ্য যোগ', '+ Add Item')}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100 border-b text-gray-700">
                          <th className="p-2.5 text-center w-10">{txt('নং', 'SL')}</th>
                          <th className="p-2.5">{txt('পণ্যের নাম ও বিবরণ *', 'Product Name & Description *')}</th>
                          <th className="p-2.5 w-28">{txt('ওয়ারেন্টি', 'Warranty')}</th>
                          <th className="p-2.5 text-center w-24">{txt('পরিমাণ', 'Quantity')}</th>
                          <th className="p-2.5 text-right w-28">{txt('একক দর (৳)', 'Unit Price (৳)')}</th>
                          <th className="p-2.5 text-right w-32">{txt('মোট মূল্য (৳)', 'Total (৳)')}</th>
                          <th className="p-2.5 text-center w-12">{txt('মুছুন', 'Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {quotationItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-gray-50/80">
                            <td className="p-2 text-center text-gray-500 font-bold">{idx + 1}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                list="inventory-datalist"
                                placeholder={txt("পণ্যের নাম, মডেল ও পূর্ণ বিবরণ...", "Product name, model and detailed description...")}
                                value={item.name}
                                onChange={e => handleQuotationItemChange(idx, 'name', e.target.value)}
                                className="w-full border p-1.5 rounded text-xs outline-none focus:border-blue-500 font-semibold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder={txt("যেমন: 1 Year", "e.g. 1 Year")}
                                value={item.warranty}
                                onChange={e => handleQuotationItemChange(idx, 'warranty', e.target.value)}
                                className="w-full border p-1.5 rounded text-xs outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={e => handleQuotationItemChange(idx, 'qty', e.target.value)}
                                className="w-20 border p-1.5 rounded text-xs outline-none focus:border-blue-500 text-center font-bold"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={item.unit_price}
                                onChange={e => handleQuotationItemChange(idx, 'unit_price', e.target.value)}
                                className="w-24 border p-1.5 rounded text-xs outline-none focus:border-blue-500 text-right font-mono"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={item.total_price}
                                onChange={e => handleQuotationItemChange(idx, 'total_price', e.target.value)}
                                className="w-28 border p-1.5 rounded text-xs outline-none focus:border-blue-500 text-right font-mono font-bold text-blue-700 bg-gray-50"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveQuotationRow(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition"
                                title={txt("এই সারি মুছুন", "Delete this row")}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gray-50 p-2.5 border-t flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={handleAddQuotationRow}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> {txt('+ আরও একটি পণ্য যোগ করুন', '+ Add Another Item')}
                    </button>
                    <span className="text-gray-500 font-semibold">
                      {txt('মোট পণ্য সংখ্যা: ', 'Total Items: ')}{quotationItems.length} {txt('টি', 'pcs')}
                    </span>
                  </div>
                </div>

                {/* ইনভেন্টরি অটোফিল ড্রপডাউন ডাটা-লিস্ট */}
                <datalist id="inventory-datalist">
                  {products.map(p => (
                    <option key={p.id} value={`${p.name} ${p.model ? `(${p.model})` : ''}`}>
                      {txt('দর: ৳', 'Price: ৳')}{p.selling_price || 0}
                    </option>
                  ))}
                </datalist>

                {/* কোটেশন শর্তাবলী বক্স (প্রয়োজনীয় ৩টি শর্তাবলী প্রাক-পূরণকৃত) */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    {txt('শর্তাবলী (Terms and Conditions):', 'Terms and Conditions:')}
                  </label>
                  <textarea
                    rows="4"
                    value={quotationTerms}
                    onChange={e => setQuotationTerms(e.target.value)}
                    className="w-full border p-2.5 rounded-lg text-xs outline-none focus:border-blue-500 bg-white font-sans leading-relaxed text-gray-800"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {txt('* এই শর্তাবলীগুলো প্রিন্ট প্রিভিউতে স্পষ্টভাবে লিপিবদ্ধ থাকবে।', '* These terms will be printed clearly on the quotation.')}
                  </p>
                </div>

                {/* সর্বমোট হিসাব ও সেভ বাটন */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t pt-4">
                  <div>
                    <span className="text-xs text-gray-500 block">{txt('সর্বমোট প্রাক্কলিত মূল্য:', 'Grand Estimated Total:')}</span>
                    <h3 className="text-2xl font-black text-blue-700">
                      ৳ {quotationCalculatedTotal.toLocaleString()}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium italic mt-0.5">
                      {txt('কথায়: ', 'In Words: ')}{lang === 'en' ? numberToWords(quotationCalculatedTotal) : numberToWordsBn(quotationCalculatedTotal)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuotationCustomer('');
                        setQuotationMobile('');
                        setQuotationAddress('');
                        setQuotationItems([{ id: Date.now(), name: '', warranty: '1 Year', qty: 1, unit_price: '', total_price: '' }]);
                      }}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      {txt('ক্লিয়ার করুন', 'Clear')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAndPrintQuotation}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 hover:shadow-lg transition cursor-pointer"
                    >
                      <Printer size={16} /> 💾 {txt('কোটেশন সংরক্ষণ ও A4 প্রিন্ট প্রিভিউ', 'Save Quotation & A4 Print Preview')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ২. সংরক্ষিত কোটেশন তালিকা (Saved Quotations History) */}
            {quotationSubTab === 'history' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <h3 className="text-base font-bold text-gray-800">
                    {txt('পূর্বের প্রদানকৃত সকল কোটেশনের খতিয়ান', 'All Saved Quotations History')}
                  </h3>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder={txt("কোটেশন নং, গ্রাহক বা মোবাইল দিয়ে খুঁজুন...", "Search by quotation no, customer or mobile...")}
                      value={quotationSearch}
                      onChange={e => setQuotationSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-600">
                        <th className="p-3">{txt('কোটেশন নং', 'Quotation No')}</th>
                        <th className="p-3">{txt('তারিখ', 'Date')}</th>
                        <th className="p-3">{txt('গ্রাহক / প্রতিষ্ঠান', 'Customer / Company')}</th>
                        <th className="p-3">{txt('ঠিকানা ও মোবাইল', 'Address & Mobile')}</th>
                        <th className="p-3 text-right">{txt('মোট প্রাক্কলিত মূল্য', 'Total Amount')}</th>
                        <th className="p-3 text-center">{txt('কার্যকারিতা', 'Validity')}</th>
                        <th className="p-3 text-center">{txt('অ্যাকশন', 'Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {quotationList
                        .filter(q => {
                          if (!quotationSearch.trim()) return true;
                          const s = quotationSearch.toLowerCase();
                          return (q.quotation_no && q.quotation_no.toLowerCase().includes(s)) ||
                                 (q.customer_name && q.customer_name.toLowerCase().includes(s)) ||
                                 (q.customer_mobile && q.customer_mobile.includes(s));
                        })
                        .map(q => (
                          <tr key={q.id} className="hover:bg-gray-50">
                            <td className="p-3 font-mono font-bold text-blue-700">{q.quotation_no}</td>
                            <td className="p-3 text-gray-600">{formatDateDMY(q.created_at)}</td>
                            <td className="p-3 font-bold text-gray-900">{q.customer_name}</td>
                            <td className="p-3 text-gray-600">
                              <div>{q.customer_address || '-'}</div>
                              <div className="text-[11px] text-gray-500">{q.customer_mobile || '-'}</div>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-gray-900">
                              ৳ {Number(q.total_amount).toLocaleString()}
                            </td>
                            <td className="p-3 text-center">
                              {q.valid_until ? (
                                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold">
                                  {formatDateDMY(q.valid_until)} {txt('পর্যন্ত', 'Until')}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex justify-center items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleViewSavedQuotation(q.id)}
                                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
                                  title={txt("A4 ফরমাল প্যাডে কোটেশন প্রিন্ট প্রিভিউ দেখুন", "View A4 formal quotation print preview")}
                                >
                                  <Printer size={13} /> {txt('প্রিন্ট / দেখুন', 'Print / View')}
                                </button>
                                {currentUser.role === 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuotation(q.id, q.quotation_no)}
                                    className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                    title={txt("কোটেশন মুছে ফেলুন", "Delete quotation")}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      {quotationList.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-gray-400">
                            {txt('কোনো সংরক্ষিত কোটেশন পাওয়া যায়নি', 'No saved quotations found')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ৫. কাস্টমার খাতা ট্যাব */}
        {activeTab === 'customers' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{txt('কাস্টমার লেজার ও বাকি খাতা', 'Customer Ledger & Due Khata')}</h2>
                  <p className="text-xs text-gray-500">{txt('গ্রাহকদের লেনদেনের হিসাব ও রসিদ প্রিন্ট', 'Customer transaction records and receipt printing')}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-end md:items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder={txt("কাস্টমারের নাম বা মোবাইল...", "Customer name or mobile...")}
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-teal-200 rounded-xl text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 text-rose-700 font-black text-sm whitespace-nowrap shadow-xs">
                  {txt('মোট বকেয়া: ৳ ', 'Total Due: ৳ ')}{customers.reduce((sum, c) => sum + Number(c.total_due || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs border-b">
                  <th className="p-3">{txt('নাম', 'Name')}</th>
                  <th className="p-3">{txt('মোবাইল', 'Mobile')}</th>
                  <th className="p-3">{txt('বকেয়া (Due)', 'Due Balance')}</th>
                  <th className="p-3 text-center">{txt('অ্যাকশন', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold">{c.name}</td>
                    <td className="p-3">{c.mobile || '-'}</td>
                    <td className="p-3 font-bold text-red-600">৳ {Number(c.total_due).toLocaleString()}</td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setLedgerCustomer(c);
                          fetch(`http://127.0.0.1:5010/api/customers/${c.id}/transactions`).then(r => r.json()).then(d => setTransactions(d || []));
                        }}
                        className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold cursor-pointer"
                      >
                        {txt('লেজার / প্রিন্ট', 'Ledger / Print')}
                      </button>
                      {Number(c.total_due) > 0 && (
                        <button onClick={() => { setPayModal(c); setCollectAmount(''); setCollectNote(''); }} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-bold cursor-pointer flex items-center gap-1 shadow-xs transition">
                          <Receipt size={13} /> {txt('বকেয়া আদায় ও রিসিপ্ট', 'Collect Due & Receipt')}
                        </button>
                      )}
                      {currentUser.role === 'admin' && (
                        <button onClick={() => handleDeleteCustomer(c.id, c.name)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-400">{txt('কোনো কাস্টমার পাওয়া যায়নি', 'No customers found')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ৬. সাপ্লায়ার খাতা ট্যাব */}
        {activeTab === 'suppliers' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-cyan-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
                  <Truck size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{txt('সাপ্লায়ার হিসাব ও ক্রয় খাতা', 'Supplier Account & Purchase Khata')}</h2>
                  <p className="text-xs text-gray-500">{txt('মহাজনদের দেনা-পাওনার হিসাব ও রসিদ', 'Supplier payable balance and receipts')}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-60">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder={txt("সাপ্লায়ার, প্রতিষ্ঠান বা মোবাইল...", "Supplier, company or mobile...")}
                    value={supplierSearch}
                    onChange={e => setSupplierSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-cyan-200 rounded-xl text-xs outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 text-rose-700 font-black text-sm whitespace-nowrap shadow-xs">
                  {txt('মোট দেনা: ৳ ', 'Total Payable: ৳ ')}{suppliers.reduce((s, u) => s + Number(u.total_payable || 0), 0).toLocaleString()}
                </div>

                {currentUser.role === 'admin' && (
                  <>
                    <button onClick={() => setShowSupplierPurchaseModal(true)} className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-500/20">
                      <Camera size={14} /> {txt('+ ক্রয় বিল সংযোজন', '+ Add Purchase Bill')}
                    </button>
                    <button onClick={() => setShowSupplierModal(true)} className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md shadow-cyan-500/20">
                      <Plus size={14} /> {txt('নতুন সাপ্লায়ার', 'New Supplier')}
                    </button>
                  </>
                )}
              </div>
            </div>

            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs border-b">
                  <th className="p-3">{txt('সাপ্লায়ারের নাম', 'Supplier Name')}</th>
                  <th className="p-3">{txt('প্রতিষ্ঠান', 'Company')}</th>
                  <th className="p-3">{txt('মোবাইল', 'Mobile')}</th>
                  <th className="p-3">{txt('পাওনা ব্যালেন্স', 'Payable Balance')}</th>
                  <th className="p-3 text-center">{txt('অ্যাকশন', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filteredSuppliers.map(s => (
                  <tr key={s.id}>
                    <td className="p-3 font-bold">{s.name}</td>
                    <td className="p-3">{s.company || '-'}</td>
                    <td className="p-3">{s.mobile || '-'}</td>
                    <td className="p-3 font-bold text-red-600">৳ {Number(s.total_payable).toLocaleString()}</td>
                    <td className="p-3 text-center flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setSupplierLedger(s);
                          fetch(`http://127.0.0.1:5010/api/suppliers/${s.id}/ledger`).then(r => r.json()).then(d => setSupplierTransactions(d || []));
                        }}
                        className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold cursor-pointer"
                      >
                        {txt('লেনদেন খতিয়ান', 'Transaction Ledger')}
                      </button>
                      {currentUser.role === 'admin' && Number(s.total_payable) > 0 && (
                        <button onClick={() => { setSupplierPayModal(s); setSupplierPayAmount(''); }} className="px-3 py-1 bg-green-600 text-white rounded font-bold cursor-pointer">
                          {txt('পেমেন্ট পরিশোধ', 'Make Payment')}
                        </button>
                      )}
                      {currentUser.role === 'admin' && (
                        <button onClick={() => handleDeleteSupplier(s.id, s.name)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-400">{txt('কোনো সাপ্লায়ার পাওয়া যায়নি', 'No suppliers found')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ড্যাশবোর্ড ওভারভিউ হাব (FC Technology ওয়াটারমার্ক ও বর্ণিল অপশন কার্ডসমূহ) */}
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(targetTab) => {
              if (targetTab === 'supplier_warranty') {
                setActiveTab('warranty_service');
              } else {
                setActiveTab(targetTab);
              }
            }}
            currentUser={currentUser}
            stats={{
              todaySales: dailySummary?.total_sales || 0,
              todayCash: dailySummary?.total_collected || 0,
              totalCustomerDue: customers.reduce((s, c) => s + Number(c.total_due || 0), 0),
              todayNetProfit: dailySummary?.net_profit || 0,
              totalProducts: products.length,
              lowStockCount: products.filter(p => Number(p.current_stock || 0) <= Number(p.alert_quantity || 5)).length,
              activeWarrantyCount: 0,
              supplierDue: suppliers.reduce((s, sup) => s + Number(sup.total_payable || 0), 0),
              pendingChequesCount: chequeAlerts.length
            }}
            lang={lang}
            t={t}
          />
        )}

        {/* ওয়ারেন্টি ও সার্ভিসিং ব্যবস্থাপনা মডিউল */}
        {activeTab === 'warranty_service' && (
          <WarrantyServiceModule
            currentUser={currentUser}
            products={products}
            onStockUpdated={() => { fetchProducts(); fetchReports(); }}
            onOpenSlip={(slip) => setActiveWarrantySlip(slip)}
            onShareSlip={(slip) => {
              setActiveWarrantySlip(slip);
              setShareData({
                type: 'warranty',
                title: txt('ওয়ারেন্টি ও সার্ভিসিং গ্রহণ স্লিপ', 'Warranty & Servicing Intake Slip'),
                number: slip.token_no,
                date: formatDateDMY(slip.received_date),
                customerName: slip.customer_name,
                customerMobile: slip.customer_mobile,
                amount: slip.estimated_cost,
                filename: `FC_Technology_Warranty_Slip_${slip.token_no}`,
                elementId: 'printable-content',
                raw: slip,
                details: txt(
                  `পণ্য: ${slip.product_name} (${slip.model_no || '-'})\nসিরিয়াল: ${slip.serial_no || '-'}\nসমস্যা: ${slip.problem_description}\nআনুষঙ্গিক: ${slip.accessories_received || (slip.has_accessories === 'হ্যাঁ' ? 'আছে' : 'নেই')}\nসম্ভাব্য ফেরত: ${formatDateDMY(slip.estimated_delivery_date)}`,
                  `Product: ${slip.product_name} (${slip.model_no || '-'})\nSerial: ${slip.serial_no || '-'}\nIssue: ${slip.problem_description}\nAccessories: ${slip.accessories_received || (slip.has_accessories === 'হ্যাঁ' ? 'Yes' : 'None')}\nEst. Delivery: ${formatDateDMY(slip.estimated_delivery_date)}`
                )
              });
            }}
            onViewImage={(imgSrc, title) => {
              setActiveImageView({ src: imgSrc, title: title || txt('সাপ্লায়ার ওয়ারেন্টি স্লিপ', 'Supplier Warranty Slip') });
            }}
            suppliers={suppliers}
            editSlipDirect={editWarrantySlipDirect}
            onClearEditSlipDirect={() => setEditWarrantySlipDirect(null)}
            lang={lang}
            t={t}
          />
        )}

        {/* আইএসপি ইন্টারনেট ম্যানেজমেন্ট মডিউল */}
        {activeTab === 'isp_management' && (
          <IspManagementModule
            currentUser={currentUser}
            lang={lang}
            t={t}
          />
        )}

        {/* ৭. ইনভেন্টরি ও স্টক তালিকা ট্যাব (পণ্য নামের নিচে স্টকে থাকা বারকোড তালিকা সহ) */}
        {(activeTab === 'inventory' || activeTab === 'dashboard_inventory') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{txt("ইনভেন্টরি ও স্টক ব্যবস্থাপনা", "Inventory & Stock Management")}</h2>
                  <p className="text-xs text-gray-500">
                    {lang === 'en' 
                      ? `Total ${products.length} products in stock (Showing ${filteredInventoryProducts.length})`
                      : `মোট ${products.length} টি পণ্য স্টকে রয়েছে (দেখাচ্ছে ${filteredInventoryProducts.length} টি)`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder={txt("পণ্য, মডেল, ক্যাটাগরি বা বারকোড...", "Product, model, category or barcode...")}
                    value={inventorySearch}
                    onChange={e => setInventorySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-indigo-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                <button onClick={() => setShowStockPrint(true)} className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition">
                  <Printer size={14} /> {txt("স্টক রিপোর্ট প্রিন্ট", "Print Stock Report")}
                </button>
                <button 
                  onClick={() => setActiveTab('warranty_service')} 
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  title={txt("নতুন নষ্ট পণ্য বিক্রয় না করে ওয়ারেন্টিতে পাঠান", "Send unsold defective stock to warranty")}
                >
                  <PackageMinus size={14} className="text-amber-700" /> {txt("নষ্ট পণ্য ওয়ারেন্টিতে পাঠান", "Defective Stock to Warranty")}
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setEditingProductId(null);
                      setFormData({ 
                        name: '', brand: '', model: '', category: 'CC Camera', barcode: '', warranty: '', 
                        purchase_price: '', selling_price: '', current_stock: '', alert_quantity: 5,
                        supplier_id: '' 
                      });
                      setShowProductModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <Plus size={14} /> {txt("নতুন পণ্য যোগ", "Add New Product")}
                  </button>
                )}
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b uppercase text-[11px] text-gray-500">
                  <th className="p-3">{txt("নাম ও মডেল", "Name & Model")}</th>
                  <th className="p-3">{txt("ক্যাটাগরি", "Category")}</th>
                  <th className="p-3">{txt("বারকোড (মূল)", "Barcode (Primary)")}</th>
                  {currentUser.role === 'admin' && <th className="p-3">{txt("ক্রয় মূল্য", "Purchase Price")}</th>}
                  <th className="p-3">{txt("বিক্রয় মূল্য", "Selling Price")}</th>
                  <th className="p-3">{txt("বর্তমান স্টক", "Current Stock")}</th>
                  <th className="p-3 text-center">{txt("অ্যাকশন", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInventoryProducts.map(p => (
                  <tr key={p.id}>
                    <td className="p-3">
                      <p className="font-bold text-gray-800">{p.name}</p>
                      {p.model && <p className="text-[11px] text-gray-500 font-mono">Model: {p.model}</p>}
                      
                      {/* স্টকে থাকা সব বারকোডগুলো ছোট ট্যাগ আকারে প্রদর্শন */}
                      {p.available_serials ? (
                        <div className="mt-1.5 flex flex-wrap gap-1 max-w-sm">
                          <span className="text-[10px] font-bold text-gray-500 mr-1 self-center">{txt("স্টক বারকোড:", "Stock Barcodes:")}</span>
                          {p.available_serials.split(', ').map((sn, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
                              {sn}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{txt("সিরিয়াল নেই (সাধারণ পণ্য)", "No serial (Standard product)")}</p>
                      )}

                      {/* ক্রয়কৃত পণ্যের বিলের ছবি বা মেমো দেখার বাটন */}
                      {p.bill_image && (
                        <div className="mt-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveImageView({ src: p.bill_image, title: `${txt("ক্রয় বিল", "Purchase Bill")} - ${p.name}` })}
                            className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded cursor-pointer font-bold transition shadow-2xs"
                            title={txt("সাপ্লায়ার কর্তৃক প্রদত্ত বিলের ছবি দেখুন", "View supplier purchase bill image")}
                          >
                            <Camera size={11} /> {txt("বিল মেমো দেখুন", "View Bill Memo")}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">{p.category || 'General'}</span></td>
                    <td className="p-3 font-mono text-gray-500">{p.barcode || '-'}</td>
                    {currentUser.role === 'admin' && <td className="p-3">৳ {p.purchase_price}</td>}
                    <td className="p-3 font-bold text-green-600">৳ {p.selling_price}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded font-bold ${p.current_stock <= p.alert_quantity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.current_stock} {txt("টি", "pcs")}</span></td>
                    <td className="p-3 text-center flex justify-center gap-1.5">
                      {currentUser.role === 'admin' ? (
                        <>
                          <button
                            onClick={() => {
                              setStockInProduct(p);
                              setStockInPrice(p.purchase_price);
                              setShowStockInModal(true);
                            }}
                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold cursor-pointer"
                          >
                            {txt("+ সিরিয়াল স্টক ইন", "+ Serial Stock-In")}
                          </button>
                          <button
                            onClick={() => { 
                              setEditingProductId(p.id); 
                              setFormData({
                                ...p,
                                model: p.model || '',
                                supplier_id: p.supplier_id || '',
                                bill_image: p.bill_image || ''
                              }); 
                              setShowProductModal(true); 
                            }}
                            className="px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-300 rounded font-bold cursor-pointer"
                          >
                            {txt("এডিট", "Edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-bold cursor-pointer hover:bg-red-100 flex items-center gap-1"
                            title={txt("পণ্য ডিলিট করুন", "Delete Product")}
                          >
                            <Trash2 size={13} /> {txt("ডিলিট", "Delete")}
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-[11px]">{txt("অনুমতি নেই", "No permission")}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredInventoryProducts.length === 0 && (
                  <tr>
                    <td colSpan={currentUser.role === 'admin' ? 7 : 6} className="text-center py-6 text-gray-400">{txt("কোনো পণ্য পাওয়া যায়নি", "No products found")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ৮. দৈনিক লাভ-ক্ষতি ও ব্যয় ব্যবস্থাপনা ট্যাব */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* তারিখ সিলেক্টর ও ড্যাশবোর্ড ওভারভিউ */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{txt("দৈনিক লাভ-ক্ষতি নিরূপণ ও হিসাব", "Daily Profit & Loss Analysis")}</h2>
                  <p className="text-xs text-gray-500">{txt("তারিখ নির্বাচন করে নির্দিষ্ট দিনের মোট বিক্রি, খরচ ও নিট লাভ দেখুন", "Select date to view total sales, expenses and net profit for that day")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-emerald-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="border border-emerald-300 rounded-xl p-2 text-xs font-bold outline-none focus:border-emerald-600 bg-emerald-50/30"
                />
              </div>
            </div>

            {/* লাভ ক্ষতি কার্ডসমূহ */}
            {dailySummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 p-4 rounded-2xl border border-blue-200 shadow-sm">
                  <p className="text-xs text-blue-700 font-bold">{txt("মোট বিক্রয় (Sales)", "Total Sales")}</p>
                  <h3 className="text-xl font-black text-blue-900 mt-1">৳ {dailySummary.total_sales.toLocaleString()}</h3>
                  <p className="text-[10px] text-blue-600 mt-1">{txt("নগদ আদায়: ৳", "Cash Collected: ৳")}{dailySummary.total_collected.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 rounded-2xl border border-amber-200 shadow-sm">
                  <p className="text-xs text-amber-700 font-bold">{txt("পণ্যের ক্রয় খরচ (COGS)", "Cost of Goods Sold (COGS)")}</p>
                  <h3 className="text-xl font-black text-amber-900 mt-1">৳ {dailySummary.total_cogs.toLocaleString()}</h3>
                  <p className="text-[10px] text-amber-600 mt-1">{txt("বিক্রিত পণ্যের আসল দাম", "Actual purchase cost of sold items")}</p>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-red-50/40 p-4 rounded-2xl border border-rose-200 shadow-sm">
                  <p className="text-xs text-rose-700 font-bold">{txt("দৈনিক দোকান খরচ (Expenses)", "Daily Shop Expenses")}</p>
                  <h3 className="text-xl font-black text-rose-900 mt-1">৳ {dailySummary.total_expense.toLocaleString()}</h3>
                  <p className="text-[10px] text-rose-600 mt-1">{txt("যাবতীয় ব্যয়ের মোট হিসাব", "Total of all operating expenditures")}</p>
                </div>

                <div className={`p-4 rounded-2xl border shadow-sm ${dailySummary.net_profit >= 0 ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-300' : 'bg-gradient-to-br from-rose-50 to-red-50/50 border-rose-300'}`}>
                  <p className="text-xs font-bold text-gray-700">{txt("আজকের নিট লাভ (Net Profit)", "Today's Net Profit")}</p>
                  <h3 className={`text-2xl font-black mt-1 ${dailySummary.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {dailySummary.net_profit >= 0 ? '+' : ''}৳ {dailySummary.net_profit.toLocaleString()}
                  </h3>
                  <p className="text-[10px] text-gray-600 mt-1">{txt("(বিক্রয় লাভ - মোট দোকান খরচ)", "(Gross Profit - Total Expenses)")}</p>
                </div>
              </div>
            )}

            {/* ব্যয় এন্ট্রি ফর্ম ও ব্যয়ের তালিকা */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ব্যয় সংযোজন ফর্ম */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">{txt("নতুন দৈনিক ব্যয় সংযোজন", "Add New Daily Expense")}</h3>
                <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-700">{txt("খরচের খাত *", "Expense Category *")}</label>
                    <select
                      value={expenseForm.category}
                      onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full border p-2 rounded mt-1 bg-white outline-none focus:border-blue-500 font-medium"
                    >
                      {EXPENSE_CATEGORIES.map((cat, i) => <option key={i} value={cat}>{getExpenseCategoryLabel(cat)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">{txt("টাকার পরিমাণ (৳) *", "Amount (৳) *")}</label>
                    <input
                      type="number"
                      required
                      placeholder={txt("টাকার পরিমাণ লিখুন", "Enter expense amount")}
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full border p-2 rounded mt-1 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">{txt("বিবরণ / নোট (ঐচ্ছিক)", "Description / Note (Optional)")}</label>
                    <textarea
                      rows="2"
                      placeholder={txt("খরচের বিস্তারিত বিবরণ...", "Detailed expense note...")}
                      value={expenseForm.note}
                      onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })}
                      className="w-full border p-2 rounded mt-1 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* দোকান ভাড়ার ব্যাংক রশিদ বা খরচের ভাউচার ইমেজ আপলোড */}
                  <div className={`p-2.5 rounded-xl border ${expenseForm.category === 'দোকান ভাড়া' ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Camera size={13} className="text-emerald-600" />
                        {expenseForm.category === 'দোকান ভাড়া' 
                          ? txt('🏦 দোকান ভাড়ার ব্যাংক রশিদ ছবি (Bank Deposit Slip)', '🏦 Shop Rent Bank Deposit Slip') 
                          : txt('ব্যাংক রশিদ / ভাউচার স্লিপ ইমেজ', 'Bank Slip / Voucher Image')}
                      </span>
                      {expenseForm.receipt_image && (
                        <button
                          type="button"
                          onClick={() => setExpenseForm(prev => ({ ...prev, receipt_image: '' }))}
                          className="text-[10px] text-red-600 hover:underline cursor-pointer font-bold"
                        >
                          {txt("ছবি মুছুন", "Remove")}
                        </button>
                      )}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          setExpenseForm(prev => ({ ...prev, receipt_image: reader.result }));
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-600 file:text-white file:cursor-pointer hover:file:bg-emerald-700 cursor-pointer"
                    />
                    {expenseForm.receipt_image && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <img
                          src={expenseForm.receipt_image}
                          alt="Receipt Preview"
                          className="h-10 w-14 object-contain rounded border border-slate-300 bg-white"
                        />
                        <span className="text-[10px] text-emerald-700 font-bold">{txt("রশিদ সংযুক্ত হয়েছে", "Receipt attached")}</span>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition">
                    {txt("+ খরচ সেভ করুন", "+ Save Expense")}
                  </button>
                </form>
              </div>

              {/* খরচের টেবিল */}
              <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">
                  {txt("নির্বাচিত তারিখের খরচের তালিকা", "Expenses List for Selected Date")} ({selectedDate})
                </h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-600">
                      <th className="p-2.5">{txt("খাত", "Category")}</th>
                      <th className="p-2.5">{txt("নোট", "Note")}</th>
                      <th className="p-2.5 text-right">{txt("পরিমাণ (৳)", "Amount (৳)")}</th>
                      <th className="p-2.5 text-center">{txt("ব্যাংক রশিদ", "Bank Receipt")}</th>
                      <th className="p-2.5 text-center">{txt("মুছুন", "Delete")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expensesList.map(exp => (
                      <tr key={exp.id} className="hover:bg-gray-50">
                        <td className="p-2.5 font-bold text-gray-800">{getExpenseCategoryLabel(exp.category)}</td>
                        <td className="p-2.5 text-gray-500">{exp.note || '-'}</td>
                        <td className="p-2.5 text-right font-bold text-red-600">৳ {Number(exp.amount).toLocaleString()}</td>
                        <td className="p-2.5 text-center">
                          {exp.receipt_image ? (
                            <button
                              type="button"
                              onClick={() => setActiveImageView({ 
                                src: exp.receipt_image, 
                                title: `${getExpenseCategoryLabel(exp.category)} - ${txt("ব্যাংক রশিদ / ভাউচার", "Bank Receipt / Voucher")} (${formatDateDMY(exp.expense_date)})` 
                              })}
                              className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                            >
                              <ImageIcon size={12} /> {txt("রশিদ দেখুন", "View Receipt")}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <button onClick={() => handleDeleteExpense(exp.id)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer" title={txt("মুছুন", "Delete")}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {expensesList.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-gray-400">{txt("এই তারিখে কোনো খরচের এন্ট্রি নেই", "No expense entries on this date")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ক্যাশ ড্রয়ার রিকনসিলিয়েশন ও অমীমাংসিত হিসাব ট্র্যাকিং */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="text-emerald-600" size={18} />
                    {txt("ক্যাশ ড্রয়ার হিসাব ও অমীমাংসিত হিসাব (Cash Reconciliation)", "Cash Drawer Reconciliation & Shortage Tracker")}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {txt("নগদ বিক্রয় এবং দৈনিক ব্যয়ের সমন্বয়ে ক্যাশে কত টাকা থাকার কথা ও প্রকৃত জমার হিসাব", "Calculates expected cash from sales and expenses vs actual drawer count")}
                  </p>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {txt("নির্বাচিত তারিখ:", "Selected Date:")} <span className="font-bold text-gray-800">{selectedDate}</span>
                </div>
              </div>

              {/* ক্যাশ ফ্লো সামারি কার্ডস */}
              {dailySummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                    <p className="text-gray-600 font-semibold">{txt("১. মোট নগদ ইনফ্লো (Cash In)", "1. Total Cash Inflow")}</p>
                    <p className="text-lg font-black text-emerald-700 mt-0.5">৳ {Number(dailySummary.total_cash_in || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">
                      {txt("নগদ বিক্রি", "Cash Sales")} ৳{Number(dailySummary.cash_sales || 0).toLocaleString()} + {txt("বাকি আদায়", "Due Collected")} ৳{Number(dailySummary.cash_due_collected || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50">
                    <p className="text-gray-600 font-semibold">{txt("২. মোট নগদ আউটফ্লো (Cash Out)", "2. Total Cash Outflow")}</p>
                    <p className="text-lg font-black text-rose-700 mt-0.5">৳ {Number(dailySummary.total_cash_out || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">
                      {txt("দোকান খরচ", "Shop Expense")} ৳{Number(dailySummary.total_expense || 0).toLocaleString()} + {txt("নগদ রিফান্ড", "Cash Refund")} ৳{Number(dailySummary.cash_refund || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/60">
                    <p className="text-gray-700 font-bold">{txt("৩. ক্যাশে প্রত্যাশিত টাকা (Expected)", "3. Expected Cash in Drawer")}</p>
                    <p className="text-xl font-black text-blue-800 mt-0.5">৳ {Number(dailySummary.expected_cash || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-blue-600 font-semibold">{txt("(ইনফ্লো - আউটফ্লো)", "(Inflow - Outflow)")}</p>
                  </div>

                  <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/40">
                    <label className="text-gray-700 font-bold block mb-1">{txt("৪. কাউন্টারে প্রকৃত ক্যাশ (Actual)", "4. Actual Cash in Drawer")}</label>
                    <input
                      type="number"
                      placeholder={txt("হাতে থাকা টাকা...", "Cash in hand...")}
                      value={actualCashInput}
                      onChange={e => setActualCashInput(e.target.value)}
                      className="w-full border border-purple-300 rounded px-2.5 py-1 text-sm font-black text-purple-900 bg-white outline-none focus:border-purple-600"
                    />
                    <p className="text-[10px] text-gray-500 mt-0.5">{txt("ড্রয়ারের ক্যাশ গুনে লিখুন", "Count drawer cash and enter")}</p>
                  </div>
                </div>
              )}

              {/* ক্যাশ অমিল / অমীমাংসিত হিসাব ডিটেকশন */}
              {actualCashInput !== '' && (
                <div className={`p-4 rounded-xl border text-xs ${
                  Number(actualCashInput) < Number(dailySummary?.expected_cash || 0)
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : Number(actualCashInput) > Number(dailySummary?.expected_cash || 0)
                    ? 'bg-blue-50 border-blue-300 text-blue-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      {Number(actualCashInput) < Number(dailySummary?.expected_cash || 0) ? (
                        <div>
                          <h4 className="text-sm font-black flex items-center gap-1.5 text-rose-700">
                            <AlertTriangle size={18} />
                            {lang === 'en' 
                              ? `⚠️ Cash Shortage Detected: ৳ ${(Number(dailySummary?.expected_cash || 0) - Number(actualCashInput)).toLocaleString()} short!`
                              : `⚠️ ক্যাশ ঘাটতি সনাক্ত হয়েছে: ৳ ${(Number(dailySummary?.expected_cash || 0) - Number(actualCashInput)).toLocaleString()} টাকা কম!`}
                          </h4>
                          <p className="text-[11px] text-rose-600 mt-0.5">
                            {txt('ক্যাশ কম থাকায় এটি "অমীমাংসিত হিসাব" হিসেবে নথিবদ্ধ হবে। নিচের বক্সে কারণ বা বিবরণ উল্লেখ করে সংরক্ষণ করুন।', 'Due to shortage, this will be recorded as an "Unsettled Account". Enter reason below and save.')}
                          </p>
                        </div>
                      ) : Number(actualCashInput) > Number(dailySummary?.expected_cash || 0) ? (
                        <div>
                          <h4 className="text-sm font-black flex items-center gap-1.5 text-blue-700">
                            <CheckSquare size={18} />
                            {lang === 'en'
                              ? `Cash Surplus: ৳ ${(Number(actualCashInput) - Number(dailySummary?.expected_cash || 0)).toLocaleString()} excess cash in drawer.`
                              : `ক্যাশ উদ্বৃত্ত: ৳ ${(Number(actualCashInput) - Number(dailySummary?.expected_cash || 0)).toLocaleString()} টাকা অতিরিক্ত জমা আছে।`}
                          </h4>
                          <p className="text-[11px] text-blue-600 mt-0.5">{txt("ড্রয়ারের ক্যাশ প্রত্যাশিত টাকার চেয়ে বেশি রয়েছে।", "Drawer cash is higher than expected amount.")}</p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-black flex items-center gap-1.5 text-emerald-700">
                            <CheckSquare size={18} />
                            {txt("✅ ক্যাশ হিসাব ১০০% সঠিক ও মিলেছে! (কোনো ঘাটতি নেই)", "✅ Cash 100% Balanced! (No discrepancy)")}
                          </h4>
                          <p className="text-[11px] text-emerald-600 mt-0.5">{txt("প্রত্যাশিত ক্যাশ এবং কাউন্টারের প্রকৃত ক্যাশ সমপরিমাণ রয়েছে।", "Expected cash and actual drawer cash match exactly.")}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder={Number(actualCashInput) < Number(dailySummary?.expected_cash || 0) ? txt("অমীমাংসিত হিসাবের কারণ...", "Reason for cash shortage / unsettled...") : txt("মন্তব্য / নোট (ঐচ্ছিক)...", "Comments / Note (Optional)...")}
                        value={unsettledNote}
                        onChange={e => setUnsettledNote(e.target.value)}
                        className="border p-2 rounded-lg text-xs flex-1 md:w-64 bg-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCashReconciliation}
                        className={`px-4 py-2 font-bold rounded-lg text-xs cursor-pointer text-white shadow transition shrink-0 ${
                          Number(actualCashInput) < Number(dailySummary?.expected_cash || 0)
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {Number(actualCashInput) < Number(dailySummary?.expected_cash || 0)
                          ? txt('📌 অমীমাংসিত হিসাব লিপিবদ্ধ করুন', '📌 Record Unsettled Account')
                          : txt('💾 ক্যাশ মিল সেভ করুন', '💾 Save Cash Reconciliation')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* পূর্বের রেকর্ডকৃত ক্যাশ রিকনসিলিয়েশন ও অমীমাংসিত তালিকা */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {txt("ক্যাশ রিকনসিলিয়েশন ও অমীমাংসিত হিসাব হিস্ট্রি", "Cash Reconciliation & Unsettled History")} ({cashReconciliationsList.length} {txt("টি", "")})
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-600">
                        <th className="p-2.5">{txt("তারিখ", "Date")}</th>
                        <th className="p-2.5 text-right">{txt("প্রত্যাশিত ক্যাশ", "Expected Cash")}</th>
                        <th className="p-2.5 text-right">{txt("প্রকৃত ক্যাশ", "Actual Cash")}</th>
                        <th className="p-2.5 text-right">{txt("ঘাটতি (Shortage)", "Discrepancy / Shortage")}</th>
                        <th className="p-2.5 text-center">{txt("হিসাবের অবস্থা", "Status")}</th>
                        <th className="p-2.5">{txt("কারণ / নোট", "Reason / Note")}</th>
                        <th className="p-2.5">{txt("দায়িত্বপ্রাপ্ত", "Recorded By")}</th>
                        <th className="p-2.5 text-center">{txt("অ্যাকশন", "Action")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cashReconciliationsList.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-2.5 font-mono text-gray-700">{item.reconciliation_date}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                            ৳ {Number(item.expected_cash).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-gray-800">
                            ৳ {Number(item.actual_cash).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold">
                            {Number(item.shortage_amount) > 0 ? (
                              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                -৳ {Number(item.shortage_amount).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">{txt("৳ 0 (মিল)", "৳ 0 (Matched)")}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              item.status === 'অমীমাংসিত'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {item.status === 'অমীমাংসিত' ? txt('⚠️ অমীমাংসিত', '⚠️ Unsettled') : txt('✅ মীমাংসিত', '✅ Settled')}
                            </span>
                          </td>
                          <td className="p-2.5 text-gray-600 max-w-xs truncate" title={item.note || ''}>
                            {item.note || '-'}
                          </td>
                          <td className="p-2.5 text-gray-600">{item.recorded_by || 'Admin'}</td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleReconciliationStatus(item.id, item.status)}
                                className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition ${
                                  item.status === 'অমীমাংসিত'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                                }`}
                                title={txt("স্ট্যাটাস পরিবর্তন করুন", "Toggle Status")}
                              >
                                {item.status === 'অমীমাংসিত' ? txt('মীমাংসা করুন', 'Settle') : txt('অমীমাংসিত করুন', 'Unsettle')}
                              </button>
                              {currentUser.role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCashReconciliation(item.id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 rounded cursor-pointer"
                                  title={txt("মুছুন", "Delete")}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {cashReconciliationsList.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center py-6 text-gray-400">
                            {txt("এখনও কোনো ক্যাশ রিকনসিলিয়েশন বা অমীমাংসিত হিসাবের এন্ট্রি নেই", "No cash reconciliation or unsettled entries yet")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ৯. সেলস ও প্রফিট রিপোর্ট (ইনভয়েস দেখা ও প্রিন্ট করার সুবিধাসহ) */}
        {activeTab === 'reports' && currentUser.role === 'admin' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-fuchsia-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/20 shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{txt("বিক্রয় ও লাভ রিপোর্ট (ইনভয়েস তালিকা)", "Sales & Profit Report (Invoices)")}</h2>
                  <p className="text-xs text-gray-500">{txt("প্রতিটি বিক্রয়ের পূর্ণ বিবরণ, ইনভয়েস দেখা, প্রিন্ট এবং লাভ-ক্ষতির হিসাব", "Complete sales details, view invoice, print and profit/loss calculation")}</p>
                </div>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={txt("ইনভয়েস নং, ক্রেতা, মোবাইল বা সেলসম্যান...", "Invoice No, customer, mobile or salesman...")}
                  value={reportSearch}
                  onChange={e => setReportSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-fuchsia-200 rounded-xl text-xs outline-none focus:border-fuchsia-500"
                />
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-700">
                  <th className="p-3">{txt("ইনভয়েস নং", "Invoice No")}</th>
                  <th className="p-3">{txt("তারিখ", "Date")}</th>
                  <th className="p-3">{txt("ক্রেতার তথ্য", "Customer Info")}</th>
                  <th className="p-3">{txt("সেলসম্যান", "Salesman")}</th>
                  <th className="p-3 text-right">{txt("মোট বিল", "Total Bill")}</th>
                  <th className="p-3 text-right">{txt("নিট লাভ", "Net Profit")}</th>
                  <th className="p-3 text-center">{txt("পরিশোধের অবস্থা", "Payment Status")}</th>
                  <th className="p-3 text-center">{txt("অ্যাকশন", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {salesReports
                  .filter(r => 
                    (r.invoice_no && r.invoice_no.toLowerCase().includes(reportSearch.toLowerCase())) ||
                    (r.customer_name && r.customer_name.toLowerCase().includes(reportSearch.toLowerCase())) ||
                    (r.customer_mobile && r.customer_mobile.includes(reportSearch)) ||
                    (r.salesman_name && r.salesman_name.toLowerCase().includes(reportSearch.toLowerCase()))
                  )
                  .map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-blue-600">{r.invoice_no}</td>
                      <td className="p-3">{formatDateDMY(r.created_at)}</td>
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{r.customer_name}</p>
                        <p className="text-[11px] text-gray-500">{r.customer_mobile || '-'}</p>
                      </td>
                      <td className="p-3 font-medium text-gray-700">{r.salesman_name || 'Admin'}</td>
                      <td className="p-3 text-right font-bold text-gray-900">
                        ৳ {Number(r.total_amount).toLocaleString()}
                        {Number(r.discount_amount) > 0 && (
                          <span className="block text-[10px] text-orange-600 font-normal">
                            ({txt("ছাড়: ৳", "Discount: ৳")}{r.discount_amount})
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-green-600">+৳ {Number(r.net_profit).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        {Number(r.due_amount) > 0 ? (
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-bold text-[10px]">
                            {txt("বকেয়া: ৳ ", "Due: ৳ ")}{r.due_amount}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded font-bold text-[10px]">
                            {txt("পরিশোধিত (Paid)", "Paid")}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleViewInvoiceDetails(r.id)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition shadow-sm"
                            title={txt("সম্পূর্ণ ইনভয়েসটি দেখুন ও প্রিন্ট করুন", "View full invoice and print")}
                          >
                            <FileText size={13} /> {txt("ইনভয়েস দেখুন", "View Invoice")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditInvoice(r.id)}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition shadow-sm"
                            title={txt("এই ইনভয়েস এডিট করে নতুন পণ্য অ্যাড করুন বা সংশোধন করুন", "Edit this invoice and add or update items")}
                          >
                            <Edit size={13} /> {txt("ইনভয়েস এডিট", "Edit Invoice")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {salesReports.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-6 text-gray-400">{txt("কোনো বিক্রয় রিপোর্ট পাওয়া যায়নি", "No sales reports found")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== সব প্রিন্ট ও পপ-আপ মডালসমূহ ===================== */}

      {/* পণ্য এন্ট্রি ও এডিট মডাল */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowProductModal(false)} className="absolute top-4 right-4 text-gray-400 cursor-pointer"><X size={20} /></button>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingProductId ? txt('পণ্য সংশোধন', 'Edit Product') : txt('নতুন পণ্য যোগ', 'Add New Product')}</h2>
            
            <form onSubmit={handleProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold">{txt("পণ্যের নাম *", "Product Name *")}</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border p-2 rounded mt-1" />
              </div>

              <div>
                <label className="font-bold text-gray-700">{txt("সাপ্লায়ার / মহাজন (যার থেকে কেনা হয়েছে)", "Supplier (Purchased From)")}</label>
                <select
                  value={formData.supplier_id || ''}
                  onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-xs bg-white mt-1 outline-none focus:border-blue-500"
                >
                  <option value="">{txt("-- কোনো সাপ্লায়ার নেই (Direct / Cash Purchase) --", "-- No Supplier (Direct / Cash Purchase) --")}</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} {sup.company ? `(${sup.company})` : ''} - {txt("মোবাইল:", "Mobile:")} {sup.mobile || txt('নেই', 'None')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold">{txt("ক্যাটাগরি *", "Category *")}</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border p-2 rounded mt-1 bg-white">
                    {MASTER_CATEGORIES.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold">{txt("ব্র্যান্ড", "Brand")}</label>
                  <input type="text" placeholder={txt("যেমন: Dahua", "e.g. Dahua")} value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full border p-2 rounded mt-1" />
                </div>
                <div>
                  <label className="font-bold">{txt("মডেল", "Model")}</label>
                  <input type="text" placeholder={txt("যেমন: B1A21P", "e.g. B1A21P")} value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="w-full border p-2 rounded mt-1" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-700">{txt("বারকোড / ইউনিক সিরিয়াল নম্বরসমূহ", "Barcodes / Unique Serial Numbers")}</label>
                  {formData.barcode && (
                    <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                      {txt("গণনাকৃত স্টক:", "Calculated Stock:")} {formData.barcode.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).length} {txt("টি", "pcs")}
                    </span>
                  )}
                </div>
                <textarea
                  rows="2"
                  placeholder={txt("একটি বারকোড স্ক্যান করুন অথবা একাধিক ইউনিক সিরিয়াল হলে কমা দিয়ে লিখুন (যেমন: SN01, SN02, SN03)", "Scan a barcode or enter multiple unique serials separated by comma (e.g. SN01, SN02, SN03)")}
                  value={formData.barcode}
                  onChange={handleSingleBarcodeChange}
                  className="w-full border border-blue-300 rounded p-2 text-xs font-mono bg-white outline-none focus:border-blue-600 shadow-inner"
                />
              </div>

              <div>
                <label className="font-bold">{txt("ওয়ারেন্টি", "Warranty")}</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <select
                    value={['1 month', '3 months', '6 months', '1 year', '2 years', '3 years', 'ওয়ারেন্টি নেই'].includes(formData.warranty) ? formData.warranty : (formData.warranty ? 'custom' : 'ওয়ারেন্টি নেই')}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setFormData({ ...formData, warranty: '' });
                      } else if (val === 'ওয়ারেন্টি নেই') {
                        setFormData({ ...formData, warranty: '' });
                      } else {
                        setFormData({ ...formData, warranty: val });
                      }
                    }}
                    className="border p-2 rounded text-xs bg-white outline-none cursor-pointer"
                  >
                    <option value="ওয়ারেন্টি নেই">{txt("ওয়ারেন্টি নেই (নন-ওয়ারেন্টি)", "No Warranty (Non-warranty)")}</option>
                    <option value="1 month">1 month</option>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                    <option value="2 years">2 years</option>
                    <option value="3 years">3 years</option>
                    <option value="custom">{txt("অন্যান্য / কাস্টম ওয়ারেন্টি...", "Other / Custom Warranty...")}</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder={txt("কাস্টম ওয়ারেন্টি লিখুন...", "Enter custom warranty...")} 
                    value={formData.warranty} 
                    onChange={e => setFormData({ ...formData, warranty: e.target.value })} 
                    className="border p-2 rounded text-xs outline-none focus:border-blue-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold">{txt("ক্রয় মূল্য", "Purchase Price")}</label>
                  <input type="number" required value={formData.purchase_price} onChange={e => setFormData({ ...formData, purchase_price: e.target.value })} className="w-full border p-2 rounded mt-1" />
                </div>
                <div>
                  <label className="font-bold">{txt("বিক্রয় মূল্য", "Selling Price")}</label>
                  <input type="number" required value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} className="w-full border p-2 rounded mt-1" />
                </div>
                <div>
                  <label className="font-bold">{txt("প্রাথমিক স্টক", "Initial Stock")}</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.current_stock} 
                    onChange={e => setFormData({ ...formData, current_stock: e.target.value })} 
                    className="w-full border p-2 rounded mt-1 bg-gray-50 font-bold" 
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5"><Camera size={14} className="text-blue-600" /> {txt("সাপ্লায়ার ক্রয় বিল / চালান ছবি (ঐচ্ছিক)", "Supplier Purchase Bill / Memo Image (Optional)")}</span>
                  {formData.bill_image && (
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, bill_image: '' })} 
                      className="text-[11px] text-red-600 hover:underline cursor-pointer"
                    >
                      {txt("ছবি মুছুন", "Remove")}
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setFormData(prev => ({ ...prev, bill_image: reader.result }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                    className="text-xs border p-1.5 rounded-lg flex-1 bg-white cursor-pointer" 
                  />
                  {formData.bill_image && (
                    <div className="shrink-0 text-center">
                      <img 
                        src={formData.bill_image} 
                        alt="Bill Preview" 
                        onClick={() => setActiveImageView({ src: formData.bill_image, title: `${txt("ক্রয় বিল", "Purchase Bill")} - ${formData.name || 'পণ্য'}` })}
                        className="w-12 h-12 object-cover rounded-lg border border-blue-400 cursor-pointer shadow hover:scale-105 transition" 
                        title={txt("বড় করে দেখতে ক্লিক করুন", "Click to view large")}
                      />
                      <span className="text-[10px] text-blue-600 font-bold block mt-0.5">{txt("প্রিভিউ", "Preview")}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{txt("সাপ্লায়ার কর্তৃক প্রদত্ত মেমো বা ইনভয়েস রসিদ ছবি আপলোড করুন", "Upload memo or invoice receipt photo provided by supplier")}</p>
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg mt-3 cursor-pointer">
                {editingProductId ? txt('আপডেট করুন', 'Update Product') : txt('সংরক্ষণ ও স্টক আপডেট করুন', 'Save & Update Stock')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* নতুন সাপ্লায়ার যোগ মডাল */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowSupplierModal(false)} className="absolute top-4 right-4 text-gray-400 cursor-pointer"><X size={20} /></button>
            <h3 className="text-lg font-bold text-gray-800 mb-3">{txt("নতুন সাপ্লায়ার এন্ট্রি", "Add New Supplier")}</h3>
            <form onSubmit={handleSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold">{txt("সাপ্লায়ারের নাম *", "Supplier Name *")}</label>
                <input type="text" required placeholder={txt("নাম লিখুন", "Enter name")} value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} className="w-full border p-2 rounded mt-1" />
              </div>
              <div>
                <label className="font-bold">{txt("কোম্পানি / প্রতিষ্ঠান", "Company / Organization")}</label>
                <input type="text" placeholder={txt("প্রতিষ্ঠানের নাম", "Company name")} value={supplierForm.company} onChange={e => setSupplierForm({ ...supplierForm, company: e.target.value })} className="w-full border p-2 rounded mt-1" />
              </div>
              <div>
                <label className="font-bold">{txt("মোবাইল নম্বর", "Mobile Number")}</label>
                <input type="text" placeholder="০১৭১১-xxxxxx" value={supplierForm.mobile} onChange={e => setSupplierForm({ ...supplierForm, mobile: e.target.value })} className="w-full border p-2 rounded mt-1" />
              </div>
              <div>
                <label className="font-bold">{txt("ঠিকানা", "Address")}</label>
                <textarea placeholder={txt("ঠিকানা", "Address")} value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} className="w-full border p-2 rounded mt-1" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer">
                {txt("সংরক্ষণ করুন", "Save Supplier")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ইউজার ও স্টাফ ম্যানেজমেন্ট মডাল (এডমিন ও সেলস পাসওয়ার্ড/ইউজারনেম পরিবর্তন) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setShowUserModal(false); setEditingUserId(null); }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="text-purple-600" size={20} /> {txt("ইউজার ও স্টাফ একাউন্ট ম্যানেজমেন্ট", "User & Staff Account Management")}
              </h3>
              <p className="text-xs text-gray-500">{txt("Shop Admin এবং বিক্রয় প্রতিনিধির ইউজারনেম, পাসওয়ার্ড পরিবর্তন ও নতুন ইউজার যোগ", "Manage shop admin & sales executive accounts, passwords and create users")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* বাম পাশ: বর্তমান ইউজারদের তালিকা */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  {txt("বর্তমান ইউজার তালিকা", "Current Users List")} ({usersList.length} {txt("জন", "users")})
                </h4>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {usersList.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">{txt("কোনো ইউজার পাওয়া যায়নি", "No users found")}</p>
                  ) : (
                    usersList.map(u => (
                      <div 
                        key={u.id} 
                        className={`p-2.5 rounded-lg border text-xs flex justify-between items-center transition ${editingUserId === u.id ? 'border-purple-500 bg-purple-50/50 shadow-xs' : 'border-gray-200 bg-gray-50'}`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900">{u.fullname}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {u.role === 'admin' ? '👑 Admin' : '👤 Sales'}
                            </span>
                          </div>
                          <p className="text-gray-500 font-mono text-[11px] mt-0.5">ID: @{u.username}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setNewUserForm({
                                username: u.username,
                                password: '',
                                fullname: u.fullname,
                                role: u.role
                              });
                            }}
                            className="px-2 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-bold text-[11px] cursor-pointer transition flex items-center gap-1"
                          >
                            <Edit size={12} /> {txt("এডিট", "Edit")}
                          </button>
                          {usersList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer transition"
                              title={txt("ইউজার মুছুন", "Delete User")}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ডান পাশ: এডিট অথবা নতুন ইউজার ফর্ম */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-gray-800">
                    {editingUserId ? txt('✏️ ইউজার ও পাসওয়ার্ড এডিট', '✏️ Edit User & Password') : txt('➕ নতুন ইউজার তৈরি', '➕ Create New User')}
                  </h4>
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUserId(null);
                        setNewUserForm({ username: '', password: '', fullname: '', role: 'sales' });
                      }}
                      className="text-[11px] text-purple-600 hover:underline font-semibold cursor-pointer"
                    >
                      {txt("+ নতুন তৈরি মোড", "+ Create New Mode")}
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-700">{txt("পূর্ণ নাম *", "Full Name *")}</label>
                    <input 
                      type="text" 
                      required 
                      placeholder={txt("যেমন: Shop Admin বা বিক্রয় প্রতিনিধি", "e.g. Shop Admin or Sales Representative")} 
                      value={newUserForm.fullname} 
                      onChange={e => setNewUserForm({ ...newUserForm, fullname: e.target.value })} 
                      className="w-full border p-2 rounded mt-1 bg-white outline-none focus:border-purple-600" 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">{txt("ইউজারনেম (লগইন আইডি) *", "Username (Login ID) *")}</label>
                    <input 
                      type="text" 
                      required 
                      placeholder={txt("যেমন: admin বা sales", "e.g. admin or sales")} 
                      value={newUserForm.username} 
                      onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })} 
                      className="w-full border p-2 rounded mt-1 bg-white outline-none focus:border-purple-600 font-mono" 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">
                      {editingUserId ? txt('নতুন পাসওয়ার্ড (পরিবর্তন না চাইলে ফাঁকা রাখুন)', 'New Password (Leave blank to keep unchanged)') : txt('পাসওয়ার্ড *', 'Password *')}
                    </label>
                    <input 
                      type="password" 
                      required={!editingUserId} 
                      placeholder={editingUserId ? txt('নতুন পাসওয়ার্ড লিখুন (ঐচ্ছিক)', 'Enter new password (optional)') : txt('গোপন পাসওয়ার্ড দিন', 'Enter secure password')} 
                      value={newUserForm.password} 
                      onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} 
                      className="w-full border p-2 rounded mt-1 bg-white outline-none focus:border-purple-600" 
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700">{txt("পদবী / অ্যাক্সেস রোল", "Designation / Access Role")}</label>
                    <select 
                      value={newUserForm.role} 
                      onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })} 
                      className="w-full border p-2 rounded mt-1 bg-white outline-none"
                    >
                      <option value="sales">{txt("Sales (বিক্রয় প্রতিনিধি - শুধুমাত্র বিল ও POS)", "Sales (Sales Rep - Billing & POS only)")}</option>
                      <option value="admin">{txt("Admin (শপ অ্যাডমিন - পূর্ণ নিয়ন্ত্রণ ও রিপোর্ট)", "Admin (Shop Admin - Full Control & Reports)")}</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className={`w-full py-2.5 text-white font-bold rounded-lg text-xs cursor-pointer transition shadow-sm ${editingUserId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                  >
                    {editingUserId ? txt('ইউজার তথ্য ও পাসওয়ার্ড আপডেট করুন', 'Update User & Password') : txt('নতুন ইউজার একাউন্ট তৈরি করুন', 'Create User Account')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ল্যাপটপ ও ডেস্কটপ সার্ভিসিং বিল মডাল */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowServiceModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Wrench size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">{txt("ল্যাপটপ / ডেস্কটপ সার্ভিসিং বিল যোগ", "Add Laptop / Desktop Service Bill")}</h3>
                <p className="text-xs text-gray-500">{txt("সার্ভিসিং এর বিবরণ ও চার্জ লিখে সরাসরি বিল-কার্টে যোগ করুন", "Enter service details and charge to add directly to sale cart")}</p>
              </div>
            </div>

            <form onSubmit={handleAddServiceToCart} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-bold text-gray-700">{txt("ডিভাইস / সার্ভিসিং ক্যাটাগরি *", "Device / Service Category *")}</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['ল্যাপটপ সার্ভিসিং', 'ডেস্কটপ সার্ভিসিং', 'সাধারণ সার্ভিসিং'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setServiceForm({ ...serviceForm, category: cat })}
                      className={`py-1.5 px-2 rounded-lg font-bold border text-center transition cursor-pointer ${serviceForm.category === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                    >
                      {cat === 'ল্যাপটপ সার্ভিসিং' ? txt('ল্যাপটপ সার্ভিসিং', 'Laptop Service') : cat === 'ডেস্কটপ সার্ভিসিং' ? txt('ডেস্কটপ সার্ভিসিং', 'Desktop Service') : txt('সাধারণ সার্ভিসিং', 'General Service')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">{txt("কি সার্ভিসিং করা হয়েছে (বিস্তারিত পণ্যের নামের মতো) *", "Work Performed (Detailed Service Title) *")}</label>
                <textarea
                  required
                  rows={2}
                  placeholder={txt("যেমন: মাদারবোর্ড চিপ রিপেয়ার, ডিসপ্লে হিঞ্জ সার্ভিসিং, উইন্ডোজ ও ড্রাইভার সেটআপ...", "e.g. Motherboard chip repair, display hinge service, Windows & driver setup...")}
                  value={serviceForm.title}
                  onChange={e => setServiceForm({ ...serviceForm, title: e.target.value })}
                  className="w-full border p-2 rounded-lg mt-1 outline-none focus:border-indigo-600 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700">{txt("ডিভাইস মডেল / সিরিয়াল (ঐচ্ছিক)", "Device Model / Serial (Optional)")}</label>
                  <input
                    type="text"
                    placeholder={txt("যেমন: HP Pavilion 15 / Core i5", "e.g. HP Pavilion 15 / Core i5")}
                    value={serviceForm.model}
                    onChange={e => setServiceForm({ ...serviceForm, model: e.target.value })}
                    className="w-full border p-2 rounded mt-1 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">{txt("সার্ভিসিং চার্জ / মূল্য (৳) *", "Service Charge (৳) *")}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder={txt("যেমন: 1200", "e.g. 1200")}
                    value={serviceForm.charge}
                    onChange={e => setServiceForm({ ...serviceForm, charge: e.target.value })}
                    className="w-full border border-indigo-300 bg-indigo-50/30 p-2 rounded mt-1 outline-none font-bold text-indigo-700 text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">{txt("সার্ভিস ওয়ারেন্টি", "Service Warranty")}</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <select
                    value={serviceForm.warranty}
                    onChange={e => setServiceForm({ ...serviceForm, warranty: e.target.value })}
                    className="border p-2 rounded bg-white outline-none text-xs cursor-pointer"
                  >
                    <option value="1 month">1 month</option>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                    <option value="নন-ওয়ারেন্টি">{txt("নন-ওয়ারেন্টি", "Non-Warranty")}</option>
                    <option value="7 days">7 days</option>
                  </select>
                  <input
                    type="text"
                    placeholder={txt("কাস্টম ওয়ারেন্টি...", "Custom warranty...")}
                    value={serviceForm.warranty}
                    onChange={e => setServiceForm({ ...serviceForm, warranty: e.target.value })}
                    className="border p-2 rounded outline-none text-xs"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-tight">
                {txt("💡 এটি বিল-কার্টে আইটেম হিসেবে যুক্ত হবে। আপনি চাইলে শুধুমাত্র সার্ভিসিং এর বিল করতে পারেন, অথবা চাইলে এর সাথে দোকান থেকে অন্যান্য পার্টস/পণ্যও কার্টে যোগ করে একসাথে ফুল বিল করতে পারেন।", "💡 This will be added as an item in the sale cart. You can bill servicing alone or bundle it together with parts/products from shop inventory.")}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> {txt("বিল-কার্টে সার্ভিসিং যোগ করুন", "Add Service to Cart")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* মাল্টিপল সিরিয়াল স্টক ইন মডাল */}
      {showStockInModal && stockInProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowStockInModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{txt("আলাদা সিরিয়াল বারকোড সহ স্টক ইন", "Stock-In with Unique Serial Barcodes")}</h3>
            <p className="text-xs text-gray-500 mb-4">{stockInProduct.name} ({txt("বর্তমান স্টক:", "Current Stock:")} {stockInProduct.current_stock})</p>

            <form onSubmit={handleSerialStockIn} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700">{txt("সাপ্লায়ার সিলেক্ট করুন", "Select Supplier")}</label>
                <select value={stockInSupplier} onChange={e => setStockInSupplier(e.target.value)} className="w-full border p-2 rounded text-xs mt-1 bg-white">
                  <option value="">{txt("সাপ্লায়ার ছাড়া (Direct/Own)", "Without Supplier (Direct/Own)")}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">{txt("একক ক্রয় মূল্য (৳)", "Unit Purchase Price (৳)")}</label>
                <input type="number" required value={stockInPrice} onChange={e => setStockInPrice(e.target.value)} className="w-full border p-2 rounded text-xs mt-1" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">{txt("প্রতিটি ইউনিটের আলাদা বারকোড/সিরিয়াল স্ক্যান করুন (Enter বা কমা দিয়ে)", "Scan individual barcode/serials (Enter or comma separated)")}</label>
                <textarea
                  rows="6"
                  required
                  placeholder={txt("বারকোড স্ক্যানার দিয়ে স্ক্যান করুন:\nSN100234\nSN100235\nSN100236", "Scan with barcode scanner:\nSN100234\nSN100235\nSN100236")}
                  value={serialsInput}
                  onChange={e => setSerialsInput(e.target.value)}
                  className="w-full border p-2 rounded text-xs font-mono mt-1 focus:border-blue-600 outline-none"
                />
                <span className="text-[11px] text-gray-500">{txt("মোট স্ক্যান করা পরিমাণ:", "Total Scanned Quantity:")} {serialsInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).length} {txt("টি", "pcs")}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1"><Camera size={13} className="text-blue-600" /> {txt("সাপ্লায়ার ক্রয় বিল / মেমোর ছবি (ঐচ্ছিক)", "Supplier Purchase Bill / Memo Photo (Optional)")}</span>
                  {stockInBillImage && (
                    <button 
                      type="button" 
                      onClick={() => setStockInBillImage('')} 
                      className="text-[10px] text-red-600 hover:underline cursor-pointer"
                    >
                      {txt("মুছুন", "Remove")}
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setStockInBillImage(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }} 
                    className="text-xs border p-1 rounded flex-1 bg-white cursor-pointer" 
                  />
                  {stockInBillImage && (
                    <img 
                      src={stockInBillImage} 
                      alt="Preview" 
                      onClick={() => setActiveImageView({ src: stockInBillImage, title: txt('স্টক-ইন সাপ্লায়ার বিল', 'Stock-In Supplier Bill') })}
                      className="w-10 h-10 object-cover rounded border border-blue-400 cursor-pointer shadow hover:scale-105 transition" 
                      title={txt("ক্লিক করে বড় করুন", "Click to enlarge")}
                    />
                  )}
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition cursor-pointer">
                {txt("স্টক ইন কনফার্ম করুন", "Confirm Stock-In")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* সাপ্লায়ার সরাসরি ক্রয় বিল এন্ট্রি ও ইমেজ আপলোড মডাল */}
      {showSupplierPurchaseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowSupplierPurchaseModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X size={20} />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Camera size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">{lang === 'en' ? 'Supplier Purchase Bill Entry' : 'সাপ্লায়ার ক্রয় বিল এন্ট্রি'}</h3>
                <p className="text-[11px] text-gray-500">{lang === 'en' ? 'Upload and save supplier bill/invoice photo' : 'সাপ্লায়ারের বিল বা মেমো ছবি সংরক্ষণ ও পাওনা সমন্বয়'}</p>
              </div>
            </div>

            <form onSubmit={handleDirectSupplierPurchase} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">{lang === 'en' ? 'Select Supplier *' : 'সাপ্লায়ার নির্বাচন করুন *'}</label>
                <select 
                  required 
                  value={supplierPurchaseForm.supplier_id} 
                  onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, supplier_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="">{lang === 'en' ? '-- Select Supplier --' : '-- সাপ্লায়ার সিলেক্ট করুন --'}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.company ? `(${s.company})` : ''} - {txt("দেনা:", "Payable:")} ৳{Number(s.total_payable || 0).toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">{lang === 'en' ? 'Purchase Bill Amount (৳) *' : 'ক্রয় বিলের মোট টাকার পরিমাণ (৳) *'}</label>
                <input 
                  type="number" 
                  required 
                  placeholder="0.00" 
                  value={supplierPurchaseForm.amount} 
                  onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold font-mono outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">{lang === 'en' ? 'Invoice / Memo No / Details' : 'চালান / মেমো নম্বর বা পণ্যের বিবরণ'}</label>
                <input 
                  type="text" 
                  placeholder={lang === 'en' ? 'e.g. Memo #1024 / 5 pcs Monitor' : 'যেমন: মেমো #১০২৪ / ৫টি মনিটর'}
                  value={supplierPurchaseForm.note} 
                  onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5"><Camera size={14} className="text-emerald-600" /> {lang === 'en' ? 'Bill Image / Memo Photo' : 'সাপ্লায়ার কর্তৃক প্রদত্ত বিলের ছবি'}</span>
                  {supplierPurchaseForm.bill_image && (
                    <button 
                      type="button" 
                      onClick={() => setSupplierPurchaseForm({ ...supplierPurchaseForm, bill_image: '' })}
                      className="text-[11px] text-red-600 hover:underline cursor-pointer"
                    >
                      {lang === 'en' ? 'Remove' : 'ছবি মুছুন'}
                    </button>
                  )}
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setSupplierPurchaseForm(prev => ({ ...prev, bill_image: reader.result }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs border border-gray-300 p-2 rounded-lg w-full bg-white cursor-pointer"
                />
                {supplierPurchaseForm.bill_image && (
                  <div className="mt-2 flex items-center gap-2">
                    <img 
                      src={supplierPurchaseForm.bill_image} 
                      alt="Bill Preview" 
                      onClick={() => setActiveImageView({ src: supplierPurchaseForm.bill_image, title: txt('সাপ্লায়ার ক্রয় বিল', 'Supplier Purchase Bill') })}
                      className="w-16 h-16 object-cover rounded-lg border border-emerald-400 cursor-pointer shadow hover:opacity-90"
                      title={txt("ক্লিক করে বড় করুন", "Click to enlarge")}
                    />
                    <span className="text-[11px] text-gray-500">{lang === 'en' ? 'Click image to preview large' : 'ছবিতে ক্লিক করে বড় করে দেখুন'}</span>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-md shadow-emerald-600/20"
              >
                {lang === 'en' ? 'Save Purchase Bill' : 'ক্রয় বিল সংরক্ষণ ও লেজারে যোগ করুন'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* সাপ্লায়ার পেমেন্ট পরিশোধ মডাল */}
      {supplierPayModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
            <button onClick={() => setSupplierPayModal(null)} className="absolute top-4 right-4 text-gray-400 cursor-pointer"><X size={20} /></button>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{txt("সাপ্লায়ারকে পরিশোধ", "Pay Supplier")}</h3>
            <p className="text-xs text-gray-500 mb-4">{supplierPayModal.name} ({txt("বকেয়া পাওনা: ৳ ", "Payable Balance: ৳ ")}{supplierPayModal.total_payable})</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              fetch('http://127.0.0.1:5010/api/suppliers/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supplier_id: supplierPayModal.id, amount: supplierPayAmount, payment_method: 'Cash', note: txt('সাপ্লায়ার দেনা পরিশোধ', 'Supplier Payment') })
              }).then(() => {
                setSupplierPayModal(null);
                setSupplierPayAmount('');
                fetchSuppliers();
              });
            }} className="space-y-3">
              <input
                type="number"
                required
                placeholder={txt("পরিশোধের পরিমাণ (৳)", "Payment Amount (৳)")}
                value={supplierPayAmount}
                onChange={e => setSupplierPayAmount(e.target.value)}
                className="w-full border p-2 rounded text-sm outline-none"
              />
              <button type="submit" className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm cursor-pointer">
                {txt("পরিশোধ নিশ্চিত করুন", "Confirm Payment")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* কাস্টমার বকেয়া গ্রহণ মডাল (নগদ, বিকাশ, ব্যাংক ও চেক রিসিভ সহ এবং মানি রিসিপ্ট তৈরি) */}
      {payModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => {
                setPayModal(null);
                setCollectAmount('');
                setCollectNote('');
                setChequeBank('');
                setChequeNo('');
              }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Receipt size={16} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">{txt("বকেয়া জমা ও মানি রিসিপ্ট প্রদান", "Receive Customer Due & Issue Receipt")}</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">{payModal.name} ({txt("বর্তমান মোট বকেয়া: ৳ ", "Current Total Due: ৳ ")}{Number(payModal.total_due).toLocaleString()})</p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const payingCustId = payModal.id;
                const paidAmtNum = Number(collectAmount);

                const res = await fetch('http://127.0.0.1:5010/api/customers/pay', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    customer_id: payingCustId, 
                    amount: collectAmount, 
                    payment_method: collectMethod, 
                    note: collectNote || (collectMethod === 'Cheque' ? txt(`চেক নং: ${chequeNo} (${chequeBank})`, `Cheque No: ${chequeNo} (${chequeBank})`) : txt('বকেয়া সমন্বয় বাবদ নগদ জমা', 'Cash received for due adjustment')),
                    bank_name: collectMethod === 'Cheque' ? chequeBank : null,
                    cheque_no: collectMethod === 'Cheque' ? chequeNo : null,
                    cheque_date: collectMethod === 'Cheque' ? chequeDate : null,
                    deposit_date: collectMethod === 'Cheque' ? depositDate : null,
                    received_by: currentUser?.name || 'Admin'
                  })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                // স্টেট রিসেট
                setPayModal(null);
                setCollectAmount('');
                setCollectNote('');
                setChequeBank('');
                setChequeNo('');

                // সরাসরি কাস্টমার লিস্ট ও চেক এলার্ট রিফ্রেশ
                fetchCustomers();
                fetchChequeAlerts();
                fetchAllCheques();

                // যদি কাস্টমার লেজার (খাতা) ওপেন থাকে, সরাসরি সমন্বয় ও আপডেট
                if (ledgerCustomer && ledgerCustomer.id === payingCustId) {
                  setLedgerCustomer(prev => ({
                    ...prev,
                    total_due: Math.max(0, Number(prev.total_due || 0) - paidAmtNum)
                  }));
                  fetch(`http://127.0.0.1:5010/api/customers/${payingCustId}/transactions?from_date=${custLedgerFromDate}&to_date=${custLedgerToDate}`)
                    .then(r => r.json())
                    .then(d => setTransactions(d || []));
                }

                // মানি রিসিপ্ট প্রিন্ট প্রিভিউ মডাল সক্রিয় করা
                if (data.receipt) {
                  setActiveMoneyReceipt(data.receipt);
                } else {
                  alert(data.message || txt('বকেয়া সমন্বয় সফল হয়েছে', 'Due adjustment successful'));
                }
              } catch (err) {
                alert(txt('পেমেন্ট নিতে ব্যর্থ: ', 'Payment failed: ') + err.message);
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">{txt("টাকার পরিমাণ (৳) *", "Amount (৳) *")}</label>
                <input
                  type="number"
                  required
                  max={payModal.total_due}
                  value={collectAmount}
                  onChange={e => setCollectAmount(e.target.value)}
                  className="w-full border p-2.5 rounded-lg text-sm font-bold outline-none focus:border-emerald-600"
                  placeholder={txt("টাকার পরিমাণ লিখুন", "Enter amount")}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">{txt("পরিশোধের মাধ্যম (Payment Method) *", "Payment Method *")}</label>
                <select 
                  value={collectMethod} 
                  onChange={e => setCollectMethod(e.target.value)} 
                  className="w-full border p-2.5 rounded-lg text-xs bg-white outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="Cash">{txt("Cash (নগদ টাকা)", "Cash")}</option>
                  <option value="Cheque">{txt("Cheque (চেক - ব্যাংক জমার সতর্কতা সহ)", "Cheque (With bank deposit alert)")}</option>
                  <option value="bKash">{txt("bKash (বিকাশ)", "bKash")}</option>
                  <option value="Bank">{txt("Bank Transfer (ব্যাংক ট্রান্সফার)", "Bank Transfer")}</option>
                </select>
              </div>

              {/* চেক সিলেক্ট করা হলে অতিরিক্ত ফিল্ডসমূহ */}
              {collectMethod === 'Cheque' && (
                <div className="bg-amber-50/70 border border-amber-300 p-3 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold border-b border-amber-200 pb-1">
                    <AlertCircle size={15} /> {txt("চেক লেনদেনের তথ্যাবলি (কাউন্টারে অগ্রিম সতর্কবার্তা)", "Cheque Details (Advance Counter Alert)")}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-700">{txt("ব্যাংকের নাম *", "Bank Name *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={txt("যেমন: Islami Bank / DBBL", "e.g. Islami Bank / DBBL")}
                        value={chequeBank}
                        onChange={e => setChequeBank(e.target.value)}
                        className="w-full border p-2 rounded bg-white mt-1 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700">{txt("চেক নম্বর *", "Cheque No *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={txt("যেমন: CHQ-849201", "e.g. CHQ-849201")}
                        value={chequeNo}
                        onChange={e => setChequeNo(e.target.value)}
                        className="w-full border p-2 rounded bg-white mt-1 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-700">{txt("চেকের তারিখ *", "Cheque Date *")}</label>
                      <input
                        type="date"
                        required
                        value={chequeDate}
                        onChange={e => setChequeDate(e.target.value)}
                        className="w-full border p-2 rounded bg-white mt-1 outline-none focus:border-amber-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-amber-900">{txt("🔔 ব্যাংকে জমার তারিখ *", "🔔 Bank Deposit Date *")}</label>
                      <input
                        type="date"
                        required
                        value={depositDate}
                        onChange={e => setDepositDate(e.target.value)}
                        className="w-full border border-amber-400 p-2 rounded bg-white mt-1 outline-none focus:border-amber-600 font-bold text-amber-900"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-800 italic">
                    {txt("💡 এই চেকটি ব্যাংকে জমা দেওয়ার ১ দিন আগে স্বয়ংক্রিয়ভাবে POS কাউন্টারে এলার্ট করবে।", "💡 System will automatically alert the POS counter 1 day before deposit date.")}
                  </p>
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">{txt("বিবরণ / নোট (মন্তব্য)", "Description / Note (Comments)")}</label>
                <input
                  type="text"
                  value={collectNote}
                  onChange={e => setCollectNote(e.target.value)}
                  className="w-full border p-2.5 rounded-lg text-xs outline-none focus:border-emerald-600"
                  placeholder={collectMethod === 'Cheque' ? txt('যেমন: চেক বাবদ জমা গ্রহণ', 'e.g. Received via cheque') : txt('যেমন: বকেয়া সমন্বয় বাবদ নগদ জমা', 'e.g. Cash received for due adjustment')}
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm cursor-pointer shadow transition mt-2 flex items-center justify-center gap-1.5">
                <Receipt size={16} /> {txt("জমা নিশ্চিত ও মানি রিসিপ্ট প্রদান করুন", "Confirm Receipt & Issue Money Receipt")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* গ্রাহকদের চেক রসিদ ও ব্যাংকে জমা ট্র্যাকিং মডাল */}
      {showChequeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowChequeModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Bell className="text-amber-500" size={20} />
                  {txt("গ্রাহকদের চেক রসিদ ও ব্যাংকে জমা এলার্ট", "Customer Cheque Tracker & Deposit Alerts")}
                </h3>
                <p className="text-xs text-gray-500">
                  {txt("বকেয়া আদায়ের গৃহীত চেক, ব্যাংকে জমা দেওয়ার তারিখ এবং ১ দিন পূর্বের আগাম সতর্কতা", "Received due cheques, bank deposit dates, and 1-day advance counter alerts")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  chequeAlerts.length > 0 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  <AlertCircle size={14} />
                  {chequeAlerts.length > 0 
                    ? (lang === 'en' ? `🚨 Alert: ${chequeAlerts.length} cheques due for deposit!` : `🚨 সতর্কতা: ${chequeAlerts.length} টি চেক জমা দেওয়ার সময় হয়েছে!`)
                    : txt('✅ বর্তমানে কোনো জরুরি চেক পেন্ডিং নেই', '✅ No urgent pending cheques at this time')}
                </span>
              </div>
            </div>

            {/* চেকের তালিকা টেবিল */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-600">
                    <th className="p-2.5">{txt("গ্রাহকের নাম ও মোবাইল", "Customer Name & Mobile")}</th>
                    <th className="p-2.5">{txt("ব্যাংকের নাম ও চেক নং", "Bank Name & Cheque No")}</th>
                    <th className="p-2.5">{txt("ইস্যু তারিখ", "Issue Date")}</th>
                    <th className="p-2.5">{txt("ব্যাংকে জমার তারিখ", "Bank Deposit Date")}</th>
                    <th className="p-2.5 text-right">{txt("টাকার পরিমাণ (৳)", "Amount (৳)")}</th>
                    <th className="p-2.5 text-center">{txt("জমার সময় বাকি", "Days to Deposit")}</th>
                    <th className="p-2.5 text-center">{txt("বর্তমান অবস্থা", "Status")}</th>
                    <th className="p-2.5 text-center">{txt("অ্যাকশন", "Action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allCheques.map(c => {
                    const daysRemaining = c.days_until_deposit !== undefined
                      ? c.days_until_deposit
                      : (c.days_remaining !== undefined 
                        ? c.days_remaining 
                        : (c.deposit_date ? Math.ceil((new Date(c.deposit_date) - new Date(new Date().toDateString())) / (1000 * 60 * 60 * 24)) : null));
                    const isAlertDue = daysRemaining !== null && daysRemaining <= 1 && c.cheque_status === 'Pending';

                    return (
                      <tr key={c.id} className={`hover:bg-gray-50 ${isAlertDue ? 'bg-amber-50/60 font-medium' : ''}`}>
                        <td className="p-2.5">
                          <p className="font-bold text-gray-900">{c.customer_name || txt('গ্রাহক', 'Customer')}</p>
                          <p className="text-[11px] text-gray-500">{c.customer_mobile || '-'}</p>
                        </td>
                        <td className="p-2.5">
                          <p className="font-bold text-gray-800">{c.bank_name || 'Bank'}</p>
                          <p className="font-mono text-blue-700 text-[11px]">{txt("নং: ", "No: ")}{c.cheque_no || '-'}</p>
                        </td>
                        <td className="p-2.5 text-gray-600">{formatDateDMY(c.cheque_date)}</td>
                        <td className="p-2.5 font-bold text-gray-900">
                          {formatDateDMY(c.deposit_date)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                          ৳ {Number(c.amount).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          {c.cheque_status === 'Deposited' ? (
                            <span className="text-emerald-700 font-semibold text-[11px]">{txt("জমা সম্পন্ন", "Deposited")}</span>
                          ) : c.cheque_status === 'Bounced' ? (
                            <span className="text-rose-700 font-semibold text-[11px]">{txt("বাউন্স হয়েছে", "Bounced")}</span>
                          ) : daysRemaining !== null ? (
                            daysRemaining < 0 ? (
                              <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                {lang === 'en' ? `❌ ${Math.abs(daysRemaining)} days overdue` : `❌ ${Math.abs(daysRemaining)} দিন ওভারডিউ`}
                              </span>
                            ) : daysRemaining === 0 ? (
                              <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                                {txt("🚨 আজই জমার দিন!", "🚨 Deposit Due Today!")}
                              </span>
                            ) : daysRemaining === 1 ? (
                              <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                                {txt("⚠️ আগামীকাল জমা দিন!", "⚠️ Deposit Tomorrow!")}
                              </span>
                            ) : (
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                {lang === 'en' ? `⏳ ${daysRemaining} days left` : `⏳ ${daysRemaining} দিন বাকি`}
                              </span>
                            )
                          ) : '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.cheque_status === 'Deposited'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : c.cheque_status === 'Bounced'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {c.cheque_status === 'Deposited' ? '✅ Deposited' : c.cheque_status === 'Bounced' ? '❌ Bounced' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleViewMoneyReceipt(c)}
                              className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-xs"
                              title={txt("এই চেকের মানি রিসিপ্ট দেখুন ও প্রিন্ট করুন", "View and print money receipt for this cheque")}
                            >
                              <Receipt size={11} /> {txt("রিসিপ্ট", "Receipt")}
                            </button>
                            {c.cheque_status !== 'Deposited' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateChequeStatus(c.id, 'Deposited')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition shadow-xs"
                                title={txt("ব্যাংকে টাকা জমা হয়েছে হিসেবে চিহ্নিত করুন", "Mark as deposited in bank")}
                              >
                                {txt("✅ জমা সম্পন্ন", "✅ Deposited")}
                              </button>
                            )}
                            {c.cheque_status !== 'Bounced' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateChequeStatus(c.id, 'Bounced')}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold cursor-pointer transition"
                                title={txt("চেক বাউন্স হয়েছে চিহ্নিত করুন", "Mark cheque as bounced")}
                              >
                                {txt("❌ বাউন্স", "❌ Bounce")}
                              </button>
                            )}
                            {c.cheque_status !== 'Pending' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateChequeStatus(c.id, 'Pending')}
                                className="px-1.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10px] font-bold cursor-pointer transition"
                                title={txt("আবার পেন্ডিং করুন", "Revert back to pending")}
                              >
                                {txt("রিভার্ট", "Revert")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {allCheques.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-gray-400">
                        {txt("কোনো চেক লেনদেনের তথ্য পাওয়া যায়নি", "No cheque transaction records found")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ১. A4 ইনভয়েস প্রিন্ট ভিউ */}
      {completedInvoice && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 py-6 md:py-8 z-50 overflow-y-auto print:static print:bg-white print:p-0">
          <div className="print-card-wrapper bg-white rounded-xl shadow-2xl w-full max-w-3xl my-2 relative flex flex-col print:shadow-none print:w-full print:m-0 print:border-none">
            <div className="sticky top-0 z-30 flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl shadow-xs print:hidden">
              <span className="font-bold text-gray-700">{txt("A4 ইনভয়েস প্রিন্ট প্রিভিউ", "A4 Invoice Print Preview")}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShareData({
                      type: 'invoice',
                      title: invoiceDocTitle || txt('বিক্রয় বিল / ক্যাশ মেমো', 'Sales Invoice / Cash Memo'),
                      number: completedInvoice.invoice_no,
                      date: formatDateDMY(completedInvoice.date || completedInvoice.created_at),
                      customerName: completedInvoice.customer_name,
                      customerMobile: completedInvoice.customer_mobile,
                      amount: completedInvoice.total_amount,
                      filename: `FC_Technology_Invoice_${completedInvoice.invoice_no}`,
                      elementId: 'printable-content',
                      raw: completedInvoice,
                      details: lang === 'en' 
                        ? `Paid: ৳${Number(completedInvoice.paid_amount || 0).toLocaleString()} | Due: ৳${Number(completedInvoice.due_amount || 0).toLocaleString()}`
                        : `পরিশোধিত: ৳${Number(completedInvoice.paid_amount || 0).toLocaleString()} | বকেয়া: ৳${Number(completedInvoice.due_amount || 0).toLocaleString()}`
                    });
                  }} 
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <Share2 size={15} /> {lang === 'en' ? 'Share' : 'শেয়ার করুন'}
                </button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Printer size={15} /> {txt("প্রিন্ট / সেভ PDF", "Print / Save PDF")}</button>
                {currentUser?.role === 'admin' && (
                  <button 
                    onClick={() => {
                      const id = completedInvoice.id;
                      setCompletedInvoice(null);
                      handleOpenEditInvoice(id);
                    }}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    title={txt("এই ইনভয়েস এডিট করে নতুন পণ্য যুক্ত করুন", "Edit this invoice and add products")}
                  >
                    <Edit size={15} /> {txt("ইনভয়েস এডিট", "Edit Invoice")}
                  </button>
                )}
                <button onClick={() => { setCompletedInvoice(null); setShowInvoiceTitlePresets(false); }} className="p-2 text-gray-400 cursor-pointer"><X size={20} /></button>
              </div>
            </div>

            <div id="printable-content" className="invoice-printable p-6 md:p-7 bg-white text-gray-900 text-xs font-sans flex flex-col justify-between min-h-[950px] max-h-[1123px] box-border print:p-0 print:m-0 relative overflow-hidden">


              {/* সেন্টারে FC Technology লোগো জলছাপ (Watermark - লেখার কারণে মুছে না গিয়ে স্পষ্ট দৃশ্যমান) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none">
                <img 
                  src="/fc_logo_watermark.png" 
                  alt="Watermark" 
                  className="w-96 md:w-[460px] max-w-[85%] opacity-[0.22] md:opacity-[0.24] select-none object-contain print:opacity-[0.22]" 
                  onError={(e) => { e.target.src = '/fc_brand_watermark.png'; }}
                />
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div>
                  {/* ইনভয়েস হেডার */}
                  <div className="flex justify-between items-start border-b-2 border-gray-900 pb-2.5 mb-2">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src="/fc_logo_icon.png" 
                        alt="FC Technology Logo" 
                        className="h-16 w-16 object-contain shrink-0" 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-950 uppercase tracking-tight">FC Technology</h1>
                        <p className="text-gray-600 text-[11px] mt-0.5 font-medium">{txt("কম্পিউটার(ডেস্কটপ, ল্যাপটপ), সিসি ক্যামেরা ও আইটি পণ্যের বিশ্বস্ত প্রতিষ্ঠান", "Computer (Desktop, Laptop), CC Camera & Trusted IT Products Shop")}</p>
                        <p className="text-[11px] text-gray-500">{txt("দোকান নং #১৮, আর এফ জোহরা টাওয়ার, নীচ তলা, চৌমুহনী, আগ্রাবাদ, চট্টগ্রাম।", "Shop #18, RF Zohura Tower, Ground Floor, Chowmuhani, Agrabad, Chattogram.")}</p>
                        <p className="text-[11px] text-gray-500">{txt("হটলাইন: 09613-181920, 01812-091939", "Hotline: 09613-181920, 01812-091939")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {/* কালো কালীর ঘরে ইনভয়েস / ক্যাশ মেমো / ওয়ারেন্টি স্লিপ লেখাটি এডিটেবল */}
                      <div className="relative inline-block text-right group mb-1">
                        <div className="flex items-center justify-end gap-1">
                          <span 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const val = e.currentTarget.textContent?.trim();
                              if (val) setInvoiceDocTitle(val);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                            title={txt("ক্লিক করে শিরোনাম পরিবর্তন করুন", "Click to edit title")}
                            className="inline-block bg-slate-800 text-white font-bold text-[11px] px-2.5 py-0.5 uppercase rounded cursor-text hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                          >
                            {invoiceDocTitle || txt("ইনভয়েস / ক্যাশ মেমো", "INVOICE / CASH MEMO")}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowInvoiceTitlePresets(!showInvoiceTitlePresets)}
                            className="print:hidden p-1 text-gray-400 hover:text-blue-600 rounded cursor-pointer transition"
                            title={txt("শিরোনাম অপশন ও পরিবর্তন", "Title presets & edit")}
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                        <span className="print:hidden text-[9px] text-gray-400 block -mt-0.5 group-hover:text-blue-600 transition select-none">
                          ✏️ {txt("ক্লিক করে এডিট করুন", "Click text to edit")}
                        </span>

                        {showInvoiceTitlePresets && (
                          <div className="print:hidden absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 text-left">
                            <p className="text-[10px] font-bold text-gray-500 uppercase px-1 mb-1">
                              {txt("শিরোনাম নির্বাচন করুন:", "Select Title:")}
                            </p>
                            <div className="space-y-1">
                              {[
                                'ইনভয়েস / ক্যাশ মেমো',
                                'ওয়ারেন্টি ও সার্ভিসিং স্লিপ',
                                'বিক্রয় ইনভয়েস',
                                'ক্যাশ মেমো',
                                'বিল / চালান',
                                'INVOICE / CASH MEMO'
                              ].map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => {
                                    setInvoiceDocTitle(t);
                                    setShowInvoiceTitlePresets(false);
                                  }}
                                  className={`w-full text-left px-2 py-1 rounded text-xs transition cursor-pointer ${(invoiceDocTitle || txt("ইনভয়েস / ক্যাশ মেমো", "INVOICE / CASH MEMO")) === t ? 'bg-blue-50 font-bold text-blue-700' : 'hover:bg-gray-100 text-gray-800'}`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100 flex gap-1">
                              <input
                                type="text"
                                value={invoiceDocTitle}
                                onChange={(e) => setInvoiceDocTitle(e.target.value)}
                                placeholder={txt("কাস্টম শিরোনাম...", "Custom title...")}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setShowInvoiceTitlePresets(false)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold cursor-pointer hover:bg-blue-700"
                              >
                                OK
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold">{txt("ইনভয়েস নং:", "Invoice No:")} <span className="font-mono text-blue-600">{completedInvoice.invoice_no}</span></p>
                      <p className="text-[11px] text-gray-600">{txt("তারিখ:", "Date:")} {formatDateDMY(completedInvoice.date || completedInvoice.created_at)}</p>
                      <p className="text-[11px] font-bold text-gray-700 mt-0.5">
                        {txt("সেলসম্যান:", "Salesman:")} {completedInvoice.salesman_name || 'Admin'} {completedInvoice.user_id ? `(ID: #${completedInvoice.user_id})` : ''}
                      </p>
                    </div>
                  </div>

                {/* ক্রেতার তথ্য ও পেমেন্ট মেথড */}
                <div className="invoice-transparent-box bg-gray-50/60 p-2.5 rounded-lg border border-gray-200 mb-2 flex justify-between items-center print:bg-transparent">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500">{txt("ক্রেতার তথ্য:", "Customer Info:")}</span>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{completedInvoice.customer_name}</h3>
                    {completedInvoice.customer_mobile && <p className="text-[11px] text-gray-600">{txt("মোবাইল:", "Mobile:")} {completedInvoice.customer_mobile}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500">{txt("পেমেন্ট মেথড:", "Payment Method:")}</span>
                    <p className="text-xs font-bold text-gray-800">
                      {completedInvoice.payment_type === 'Due' ? txt('বাকি বিক্রয় (Due)', 'Credit / Due') : (completedInvoice.payment_type || 'Cash')}
                    </p>
                  </div>
                </div>

                {/* আইটেম টেবিল (ঝাপসা কালো হেডার ও প্রতিটি রোতে লেখাগুলো মাঝ বরাবর) */}
                <table className="w-full text-left border-collapse mb-2 text-xs">
                  <thead>
                    <tr className="bg-slate-700 text-white text-[11px] uppercase align-middle print:bg-slate-700 print:text-white">
                      <th className="py-1.5 px-2 text-center w-9 align-middle"><div className="flex items-center justify-center min-h-[22px]">{txt("নং", "SL")}</div></th>
                      <th className="py-1.5 px-2 align-middle"><div className="flex items-center min-h-[22px]">{txt("পণ্যের বিবরণ, মডেল, ওয়ারেন্টি ও সিরিয়াল", "Product Description, Model, Warranty & Serial")}</div></th>
                      <th className="py-1.5 px-2 text-center w-14 align-middle"><div className="flex items-center justify-center min-h-[22px]">{txt("পরিমাণ", "Qty")}</div></th>
                      <th className="py-1.5 px-2 text-right w-24 align-middle"><div className="flex items-center justify-end min-h-[22px]">{txt("দর (৳)", "Rate (৳)")}</div></th>
                      <th className="py-1.5 px-2 text-right w-24 align-middle"><div className="flex items-center justify-end min-h-[22px]">{txt("মোট মূল্য (৳)", "Total (৳)")}</div></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 border-b">
                    {completedInvoice.items.map((it, idx) => (
                      <tr key={idx} className="align-middle">
                        <td className="py-1.5 px-2 text-center align-middle">
                          <div className="flex items-center justify-center min-h-[24px] text-[11px] font-medium leading-none">
                            {idx + 1}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 align-middle">
                          <div className="flex flex-col justify-center min-h-[24px]">
                            <div className="font-bold leading-snug">
                              {it.name || it.product_name}
                              {it.model && <span className="ml-1 text-[11px] text-gray-600 font-mono font-normal">[{it.model}]</span>}
                              {it.warranty ? (
                                <span className="ml-1 text-[11px] font-normal text-blue-600">({it.warranty})</span>
                              ) : (
                                <span className="ml-1 text-[11px] font-normal text-gray-400">({txt("নন-ওয়ারেন্টি", "Non-warranty")})</span>
                              )}
                              {Number(it.discount || 0) > 0 && (
                                <span className="ml-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 px-1 py-0.2 rounded border border-orange-200">
                                  {txt("ছাড়:", "Disc:")} -৳{Number(it.discount).toLocaleString()}
                                </span>
                              )}
                            </div>
                            {((it.selected_serials && it.selected_serials.length > 0) || it.serial_numbers) && (
                              <div className="text-[10px] font-mono text-gray-700 mt-0.5 leading-snug">
                                <strong>S/N: </strong>
                                {Array.isArray(it.selected_serials) 
                                  ? it.selected_serials.join(', ') 
                                  : (it.selected_serials || it.serial_numbers)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center align-middle">
                          <div className="flex items-center justify-center min-h-[24px] font-bold text-[11px] leading-none">
                            {it.qty || it.quantity}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-right align-middle">
                          <div className="flex items-center justify-end min-h-[24px] font-mono text-[11px] leading-none">
                            ৳ {Number(it.selling_price || it.unit_price).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-right align-middle">
                          <div className="flex items-center justify-end min-h-[24px] font-mono font-bold text-[11px] leading-none">
                            ৳ {((it.selling_price || it.unit_price) * (it.qty || it.quantity)).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* শর্তাবলী (বামে) এবং ৫-পয়েন্ট পূর্ণাঙ্গ হিসাব সামারি (ডানে) */}
                <div className="flex flex-row justify-between items-start gap-3 mb-2">
                  {/* বাম পাশে: বিক্রয়ের শর্তাবলী ও ইনভয়েস নোট */}
                  <div className="flex-1 space-y-1.5 pr-2">
                    {completedInvoice.note && (
                      <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-[11px] text-gray-800">
                        <strong>{txt("ইনভয়েস বিশেষ নোট:", "Invoice Note:")}</strong> {completedInvoice.note}
                      </div>
                    )}
                    <div className="invoice-transparent-box border border-gray-200 rounded-lg p-2 text-[10px] text-gray-600 bg-gray-50/40 print:bg-transparent space-y-0.5">
                      <p className="font-bold text-gray-800 underline">{txt("বিক্রয়ের শর্তাবলী (Terms & Conditions):", "Terms & Conditions:")}</p>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                        <li>{txt("উপযুক্ত কারণ প্রদর্শনপূর্বক বিক্রয়কৃত মাল ফেরত নেয়া হয় (শর্ত সাপেক্ষে ৩ দিনের মধ্যে)।", "Sold items may be returned within 3 days subject to valid reasons and condition.")}</li>
                        <li>{txt("ওয়ারেন্টি সেবার জন্য বিক্রয় ইনভয়েস এবং প্যাকেট অবশ্যই সাথে আনতে হবে।", "Original sales invoice and product packaging must be provided for warranty.")}</li>
                        <li>{txt("বারকোড বা সিরিয়াল স্টিকার ছেঁড়া, পোড়া, ভাঙ্গা, শর্ট সার্কিটে ক্ষতিগ্রস্ত বা পানিতে ভেজা পণ্যের ওয়ারেন্টি বাতিল বলে গণ্য হবে।", "Warranty is void if barcode/serial is damaged, broken, burnt, or affected by water/short circuit.")}</li>
                      </ul>
                    </div>

                    {/* পরিশোধিত নীল রংয়ের সিলটি বিক্রয়ের শর্তাবলির নিচে বসবে */}
                    {(completedInvoice.payment_type === 'Cash' || Number(completedInvoice.due_amount || 0) <= 0) && (
                      <div className="pt-2 flex items-center justify-start pl-6 select-none pointer-events-none">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-dashed border-blue-600 flex flex-col items-center justify-center p-1 text-center bg-blue-50/20 backdrop-blur-[0.5px] transform -rotate-12">
                          <div className="w-full h-full rounded-full border-2 border-blue-600 flex flex-col items-center justify-center p-0.5">
                            <span className="text-[8px] md:text-[9px] font-black tracking-widest text-blue-600 uppercase">FC TECHNOLOGY</span>
                            <span className="text-lg md:text-xl font-black text-blue-600 tracking-wider my-0.5">{txt("পরিশোধিত", "PAID")}</span>
                            <span className="text-[8px] md:text-[9px] font-black tracking-widest text-blue-600 uppercase border-t border-blue-400 pt-0.5">PAID</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ডান পাশে: মোট আইটেম মূল্য ও ৫-পয়েন্ট পূর্ণাঙ্গ হিসাব (প্রতিটি রো মাঝ বরাবর) */}
                  <div className="w-72 shrink-0 space-y-1 text-xs border border-gray-300 rounded-lg p-2.5 bg-gray-50/40 print:bg-transparent invoice-subtotal-box invoice-transparent-box">
                    <div className="flex justify-between items-center py-0.5 text-gray-600">
                      <span className="leading-snug">{txt("আইটেম মোট মূল্য:", "Item Subtotal:")}</span>
                      <span className="font-mono font-medium leading-snug">৳ {Number(completedInvoice.sub_total || (completedInvoice.total_amount + Number(completedInvoice.discount_amount || 0))).toLocaleString()}</span>
                    </div>
                    {Number(completedInvoice.discount_amount || 0) > 0 && (
                      <div className="flex justify-between items-center py-0.5 text-orange-600 font-semibold border-b pb-0.5">
                        <span className="leading-snug">{txt("বিশেষ ছাড় / ডিসকাউন্ট:", "Special Discount:")}</span>
                        <span className="font-mono leading-snug">- ৳ {Number(completedInvoice.discount_amount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-0.5 font-bold text-gray-900 border-b">
                      <span className="leading-snug">{txt("১. বর্তমান মোট বিল:", "1. Current Net Bill:")}</span>
                      <span className="font-mono leading-snug">৳ {Number(completedInvoice.total_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 text-green-700 font-medium">
                      <span className="leading-snug">{txt("২. বর্তমান প্রদানকৃত টাকা:", "2. Current Paid Amount:")}</span>
                      <span className="font-mono font-bold leading-snug">৳ {Number(completedInvoice.paid_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 text-red-600 font-bold border-b pb-0.5">
                      <span className="leading-snug">{txt("৩. বর্তমান বিলের বাকি:", "3. Current Bill Due:")}</span>
                      <span className="font-mono leading-snug">৳ {Number(completedInvoice.due_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 text-gray-700">
                      <span className="leading-snug">{txt("৪. কাস্টমারের পূর্বের মোট বাকি:", "4. Customer Previous Due:")}</span>
                      <span className="font-mono font-bold leading-snug">৳ {Number(completedInvoice.previous_due || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 bg-red-50/70 border border-red-200 px-2 rounded font-black text-xs text-red-700 mt-0.5 print:bg-transparent">
                      <span className="leading-snug">{txt("৫. পূর্বের টাকাসহ মোট বাকি:", "5. Grand Total Due:")}</span>
                      <span className="font-mono leading-snug">৳ {Number(completedInvoice.total_due_after ?? (Number(completedInvoice.previous_due || 0) + Number(completedInvoice.due_amount || 0))).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* স্বাক্ষর সেকশন (ইনভয়েসের একদম নিচে) */}
              <div className="invoice-signatures flex justify-between items-end pt-4 mt-auto text-xs pb-2">
                <div className="text-center w-44">
                  <div className="border-t border-gray-400 pt-1.5 font-semibold text-gray-800">{txt("গ্রাহকের স্বাক্ষর", "Customer's Signature")}</div>
                </div>
                <div className="text-center w-48">
                  <div className="border-t border-gray-400 pt-1.5 font-semibold text-gray-800">{txt("কর্তৃপক্ষের স্বাক্ষর ও সিল", "Authorized Signature & Seal")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ইনভয়েস এডিট ও নতুন পণ্য সংযোজন এবং লেজার সমন্বয় মডাল */}
      {editingInvoice && (() => {
        const editSubTotal = editItems.reduce((sum, it) => sum + (Number(it.unit_price || it.selling_price || 0) * Number(it.qty || 1)), 0);
        const editDiscountNum = Math.max(0, Number(editDiscount || 0));
        const editNetTotal = Math.max(0, editSubTotal - editDiscountNum);
        const editOldPaid = Number(editingInvoice.paid_amount || 0);
        const editAddPaidNum = Number(editAdditionalPaid || 0);
        const editCalculatedPaid = editOldPaid + editAddPaidNum;
        const editNewDue = Math.max(0, editNetTotal - editCalculatedPaid);
        const editDueDiff = editNewDue - Number(editingInvoice.due_amount || 0);

        // ফিল্টারকৃত পণ্যসমূহ (সার্চ অনুযায়ী)
        const filteredProductsForEdit = products.filter(p => {
          if (!editProductSearch.trim()) return true;
          const q = editProductSearch.toLowerCase();
          return (
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.model && p.model.toLowerCase().includes(q)) ||
            (p.barcode && p.barcode.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q))
          );
        });

        // সিলেক্টেড প্রোডাক্ট অবজেক্ট
        const selectedProd = products.find(p => p.id === Number(editProductSelectId));
        const availableSerialsList = selectedProd?.available_serials 
          ? selectedProd.available_serials.split(',').map(s => s.trim()).filter(Boolean)
          : [];

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 flex flex-col max-h-[92vh] border border-gray-200 overflow-hidden">
              
              {/* মডাল হেডার */}
              <div className="flex justify-between items-center p-4 md:p-5 border-b bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20 shrink-0">
                    <Edit size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base md:text-lg">{txt("ইনভয়েস এডিট ও নতুন পণ্য সংযোজন", "Edit Invoice & Add New Products")}</h3>
                      <span className="font-mono bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-xs border border-amber-300">
                        {editingInvoice.invoice_no}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {txt("গ্রাহক:", "Customer:")} <strong className="text-gray-900">{editCustomerName || editingInvoice.customer_name}</strong> {editCustomerMobile ? `(${editCustomerMobile})` : (editingInvoice.customer_mobile ? `(${editingInvoice.customer_mobile})` : '')} | 
                      {" "}{txt("তারিখ:", "Date:")} {formatDateDMY(editingInvoice.date || editingInvoice.created_at)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingInvoice(null)} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer transition"
                  title={txt("বন্ধ করুন", "Close")}
                >
                  <X size={20} />
                </button>
              </div>

              {/* মডাল বডি (স্ক্রলেবল) */}
              <div className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1 text-xs text-gray-800">
                
                {/* ১. কাস্টমারের তথ্য ও বিশেষ ছাড় (ডিসকাউন্ট) এডিট */}
                <div className="bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <User size={16} className="text-amber-700" />
                      {txt("গ্রাহকের নাম, মোবাইল নম্বর ও বিশেষ ছাড় (ডিসকাউন্ট) এডিট", "Edit Customer Name, Mobile & Special Discount")}
                    </h4>
                    <span className="text-[11px] text-amber-900 font-mono font-bold bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
                      {editingInvoice.invoice_no}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        {txt("কাস্টমারের নাম *", "Customer Name *")}
                      </label>
                      <input
                        type="text"
                        value={editCustomerName}
                        onChange={(e) => setEditCustomerName(e.target.value)}
                        placeholder={txt("কাস্টমারের নাম লিখুন...", "Enter customer name...")}
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white text-xs font-bold text-gray-900 outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        {txt("মোবাইল নম্বর", "Mobile Number")}
                      </label>
                      <input
                        type="text"
                        value={editCustomerMobile}
                        onChange={(e) => setEditCustomerMobile(e.target.value)}
                        placeholder={txt("০১xxxxxxxxx", "01xxxxxxxxx")}
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white text-xs font-mono font-bold text-gray-900 outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        {txt("বিশেষ ছাড় / ডিসকাউন্ট (৳)", "Special Discount (৳)")}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editDiscount}
                        onChange={(e) => setEditDiscount(e.target.value)}
                        placeholder="০"
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white text-xs font-mono font-bold text-right text-orange-600 outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* ২. বর্তমান ইনভয়েসের আইটেম তালিকা */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      <ShoppingCart size={16} className="text-blue-600" />
                      {txt(`বিলে বিদ্যমান পণ্যসমূহ (${editItems.length} টি)`, `Items in Bill (${editItems.length})`)}
                    </h4>
                    <span className="text-[11px] text-gray-500">
                      {txt("* প্রয়োজন হলে সংখ্যা (+) / (-) পরিবর্তন করুন বা বাদ দিন", "* Adjust quantity (+) / (-) or remove items if needed")}
                    </span>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b text-gray-700">
                          <th className="py-2.5 px-3 text-center w-8">#</th>
                          <th className="py-2.5 px-3">{txt("পণ্যের বিবরণ, মডেল ও ওয়ারেন্টি", "Product Description, Model & Warranty")}</th>
                          <th className="py-2.5 px-3 text-center w-28">{txt("পরিমাণ", "Qty")}</th>
                          <th className="py-2.5 px-3 text-right w-24">{txt("দর (৳)", "Rate (৳)")}</th>
                          <th className="py-2.5 px-3 text-right w-28">{txt("মোট মূল্য (৳)", "Total Price (৳)")}</th>
                          <th className="py-2.5 px-3 text-center w-16">{txt("অ্যাকশন", "Action")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {editItems.map((it, idx) => (
                          <tr key={idx} className={it.is_new ? "bg-emerald-50/40 hover:bg-emerald-50/70" : "hover:bg-gray-50"}>
                            <td className="py-2 px-3 text-center font-bold text-gray-500">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 leading-tight">
                                  {it.name || it.product_name}
                                </span>
                                {it.is_new ? (
                                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-black border border-emerald-300">
                                    {txt("✨ নতুন যুক্ত", "✨ Newly Added")}
                                  </span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    {txt("মূল বিল", "Original Bill")}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                {it.model && <span className="font-mono bg-gray-100 px-1.5 py-0.2 rounded text-gray-700">{txt("মডেল:", "Model:")} {it.model}</span>}
                                {it.warranty && <span className="text-blue-600">{txt("ওয়ারেন্টি:", "Warranty:")} {it.warranty}</span>}
                              </div>
                              {/* সিরিয়াল প্রদর্শন ও হাইলাইটিং */}
                              {((it.selected_serials && it.selected_serials.length > 0) || it.serial_numbers) && (
                                <div className="text-[10px] font-mono text-gray-700 mt-1">
                                  <strong>S/N: </strong>
                                  <div className="inline-flex flex-wrap gap-1 mt-0.5">
                                    {(Array.isArray(it.selected_serials) && it.selected_serials.length > 0
                                      ? it.selected_serials 
                                      : (it.serial_numbers ? String(it.serial_numbers).split(',').map(s => s.trim()).filter(Boolean) : [])
                                    ).map((sn, sIdx) => {
                                      const isReplaced = sn.includes('পরিবর্তিত') || sn.includes('পূর্বে:');
                                      return (
                                        <span 
                                          key={sIdx} 
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                            isReplaced 
                                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' 
                                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                                          }`}
                                        >
                                          {sn}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* ওয়ারেন্টি রিপ্লেসমেন্ট: সিরিয়াল পরিবর্তন বাটন */}
                              <div className="mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (changingSerialIndex === idx) {
                                      setChangingSerialIndex(null);
                                      setOldSerialToReplace('');
                                      setNewSerialInput('');
                                    } else {
                                      setChangingSerialIndex(idx);
                                      const rawSerials = Array.isArray(it.selected_serials) && it.selected_serials.length > 0
                                        ? it.selected_serials
                                        : (it.serial_numbers ? String(it.serial_numbers).split(',').map(s => s.trim()).filter(Boolean) : []);
                                      const firstSn = rawSerials[0] || '';
                                      // পূর্বে রিপ্লেস করা থাকলে মূল সিরিয়াল এক্সট্র্যাক্ট করা
                                      const match = firstSn.match(/^([^(]+)/);
                                      setOldSerialToReplace(match ? match[1].trim() : firstSn);
                                      setNewSerialInput('');
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition cursor-pointer"
                                  title={txt("ওয়ারেন্টি থেকে আসা নতুন পণ্যের সিরিয়াল পরিবর্তন করুন", "Change serial for warranty replaced product")}
                                >
                                  <RefreshCw size={11} /> {txt("🔄 সিরিয়াল পরিবর্তন (ওয়ারেন্টি)", "🔄 Change Serial (Warranty)")}
                                </button>
                              </div>

                              {/* ইনলাইন সিরিয়াল পরিবর্তন ফর্ম */}
                              {changingSerialIndex === idx && (
                                <div className="mt-2 p-2.5 bg-amber-50/90 border border-amber-300 rounded-lg text-xs space-y-2">
                                  <div className="font-bold text-amber-900 flex items-center justify-between">
                                    <span>{txt("সিরিয়াল পরিবর্তন (পূর্বে সিরিয়াল সংরক্ষিত থাকবে):", "Change Serial (Previous serial retained):")}</span>
                                    <button 
                                      type="button" 
                                      onClick={() => setChangingSerialIndex(null)}
                                      className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                                        {txt("পূর্বের সিরিয়াল নম্বর:", "Previous Serial:")}
                                      </label>
                                      <input
                                        type="text"
                                        value={oldSerialToReplace}
                                        onChange={e => setOldSerialToReplace(e.target.value)}
                                        placeholder={txt("পূর্বের সিরিয়াল...", "Previous serial...")}
                                        className="w-full px-2 py-1 border border-amber-300 rounded bg-white text-xs font-mono font-bold outline-none focus:border-amber-600"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                                        {txt("নতুন সিরিয়াল নম্বর *:", "New Serial Number *:")}
                                      </label>
                                      <input
                                        type="text"
                                        value={newSerialInput}
                                        onChange={e => setNewSerialInput(e.target.value)}
                                        placeholder={txt("নতুন সিরিয়াল লিখুন...", "Enter new serial...")}
                                        className="w-full px-2 py-1 border border-amber-300 rounded bg-white text-xs font-mono font-bold outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
                                        autoFocus
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setChangingSerialIndex(null)}
                                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 rounded text-[11px] font-medium cursor-pointer"
                                    >
                                      {txt("বাতিল", "Cancel")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSn = newSerialInput.trim();
                                        const oldSn = oldSerialToReplace.trim();
                                        if (!newSn) {
                                          return alert(txt("নতুন সিরিয়াল নম্বরটি প্রদান করুন!", "Please enter new serial number!"));
                                        }

                                        // ইউজার রিকোয়ারমেন্ট:
                                        // "ওয়ারেন্টি থেকে আসা কোন পণ্য পরিবর্তন করে নতুন পণ্য দিলে ইনভয়েস এডিট অপশনে গিয়ে নতুন সিরিয়াল পরিবর্তন করা যাবে। এবং পূর্বের সিরিয়ালটি ও থাকবে লেখা থাকবে পরিবর্তিত"
                                        const replacementText = oldSn ? `${newSn} (পূর্বে: ${oldSn} - পরিবর্তিত)` : `${newSn} (পরিবর্তিত)`;

                                        setEditItems(prev => prev.map((item, itemIdx) => {
                                          if (itemIdx !== idx) return item;

                                          let currentSerials = Array.isArray(item.selected_serials) && item.selected_serials.length > 0
                                            ? [...item.selected_serials]
                                            : (item.serial_numbers ? String(item.serial_numbers).split(',').map(s => s.trim()).filter(Boolean) : []);

                                          let updatedSerials;
                                          if (currentSerials.length === 0) {
                                            updatedSerials = [replacementText];
                                          } else {
                                            let replaced = false;
                                            updatedSerials = currentSerials.map(sn => {
                                              if (!replaced && (sn.includes(oldSn) || sn.trim().toUpperCase() === oldSn.toUpperCase())) {
                                                replaced = true;
                                                return replacementText;
                                              }
                                              return sn;
                                            });
                                            if (!replaced) {
                                              updatedSerials[0] = replacementText;
                                            }
                                          }

                                          return {
                                            ...item,
                                            selected_serials: updatedSerials,
                                            serial_numbers: updatedSerials.join(', ')
                                          };
                                        }));

                                        setChangingSerialIndex(null);
                                        setOldSerialToReplace('');
                                        setNewSerialInput('');
                                      }}
                                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                                    >
                                      <CheckCircle2 size={12} />
                                      {txt("সিরিয়াল আপডেট করুন", "Update Serial")}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateEditItemQty(idx, -1)}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer disabled:opacity-40"
                                  disabled={it.qty <= 1}
                                >
                                  -
                                </button>
                                <span className="px-3 py-1 font-bold text-gray-900 min-w-[28px]">
                                  {it.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateEditItemQty(idx, 1)}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                value={it.unit_price}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setEditItems(prev => prev.map((item, i) => i === idx ? {
                                    ...item,
                                    unit_price: val,
                                    selling_price: val,
                                    total_price: val * Number(item.qty || 1)
                                  } : item));
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-right font-mono font-bold text-xs"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                              ৳ {Number(it.total_price || (it.unit_price * it.qty)).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveEditItem(idx)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition"
                                title={txt("আইটেমটি বিল থেকে বাদ দিন", "Remove item from bill")}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {editItems.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center py-6 text-gray-400">
                              {txt("বিলে কোনো পণ্য নেই! নিচে থেকে নতুন পণ্য যোগ করুন।", "No items in bill! Add new products below.")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ২. একই বিলে নতুন পণ্য অ্যাড করার বক্স */}
                <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border-2 border-dashed border-emerald-300 rounded-2xl p-4 md:p-5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black">
                        <Plus size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-950 text-sm">{txt("একই বিলে নতুন পণ্য অ্যাড করুন", "Add New Product to Current Bill")}</h4>
                        <p className="text-[11px] text-emerald-800/80">{txt("দোকানের ইনভেন্টরি থেকে যে কোনো পণ্য নির্বাচন করে এই ইনভয়েসে যুক্ত করুন", "Select any product from store inventory and add to this invoice")}</p>
                      </div>
                    </div>

                    <div className="relative w-full sm:w-60">
                      <Search size={13} className="absolute left-2.5 top-2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={txt("পণ্য সার্চ করুন...", "Search product...")}
                        value={editProductSearch}
                        onChange={(e) => setEditProductSearch(e.target.value)}
                        className="w-full pl-7 pr-2.5 py-1.5 border border-emerald-300 rounded-lg bg-white text-xs outline-none focus:border-emerald-600 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* পণ্য সিলেক্টর */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-6">
                      <label className="block font-bold text-gray-700 mb-1">
                        {txt("ইনভেন্টরি পণ্য সিলেক্ট করুন *", "Select Inventory Product *")}
                      </label>
                      <select
                        value={editProductSelectId}
                        onChange={(e) => handleSelectProductForEdit(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs font-medium outline-none focus:border-emerald-600 shadow-xs"
                      >
                        <option value="">{txt(`-- পণ্য নির্বাচন করুন (${filteredProductsForEdit.length} টি পাওয়া গেছে) --`, `-- Select Product (${filteredProductsForEdit.length} available) --`)}</option>
                        {filteredProductsForEdit.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.model ? `[${p.model}]` : ''} - {txt("স্টক:", "Stock:")} {p.current_stock} {txt("টি", "pcs")} - ৳{Number(p.selling_price).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-bold text-gray-700 mb-1">
                        {txt("পরিমাণ (Qty) *", "Quantity (Qty) *")}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedProd ? Math.max(1, selectedProd.current_stock) : undefined}
                        value={editProductQty}
                        onChange={(e) => setEditProductQty(Math.max(1, Number(e.target.value)))}
                        className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs font-bold text-center outline-none focus:border-emerald-600 shadow-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-bold text-gray-700 mb-1">
                        {txt("একক বিক্রয় দর (৳) *", "Unit Selling Price (৳) *")}
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={txt("৳ দর", "৳ Price")}
                        value={editProductPrice}
                        onChange={(e) => setEditProductPrice(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs font-bold text-right outline-none focus:border-emerald-600 shadow-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddProductToEditBill}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 transition"
                      >
                        <Plus size={15} /> {txt("বিলে যোগ করুন", "Add to Bill")}
                      </button>
                    </div>
                  </div>

                  {/* সিলেক্টেড পণ্যের অতিরিক্ত তথ্য ও সিরিয়াল */}
                  {selectedProd && (
                    <div className="bg-white/80 border border-emerald-200 rounded-xl p-3 space-y-2 mt-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div>
                          <span className="font-bold text-gray-800">{txt("মডেল:", "Model:")} </span>
                          <input
                            type="text"
                            value={editProductModel}
                            onChange={(e) => setEditProductModel(e.target.value)}
                            placeholder={txt("মডেল", "Model")}
                            className="border border-gray-300 rounded px-2 py-0.5 font-mono text-xs ml-1"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-gray-800">{txt("ওয়ারেন্টি:", "Warranty:")} </span>
                          <input
                            type="text"
                            value={editProductWarranty}
                            onChange={(e) => setEditProductWarranty(e.target.value)}
                            placeholder={txt("যেমন: ১ বছর", "e.g. 1 Year")}
                            className="border border-gray-300 rounded px-2 py-0.5 text-xs ml-1"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-gray-700">{txt("বর্তমান স্টক:", "Current Stock:")} </span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded ${selectedProd.current_stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {selectedProd.current_stock} {txt("টি", "pcs")}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-700">{txt("আইটেম মোট:", "Item Total:")} </span>
                          <span className="font-mono font-bold text-emerald-700 text-xs">
                            ৳ {(Number(editProductPrice || 0) * Number(editProductQty || 1)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* সিরিয়াল নম্বর সিলেকশন বা স্ক্যান */}
                      {availableSerialsList.length > 0 && (
                        <div className="pt-2 border-t border-emerald-100 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="font-bold text-gray-800 flex items-center gap-1">
                              <Barcode size={13} className="text-blue-600" />
                              {txt(`স্টকে থাকা সিরিয়াল নির্বাচন করুন (প্রয়োজন: ${editProductQty} টি, নির্বাচিত: ${editProductSerials.length} টি)`, `Select Serials from Stock (Required: ${editProductQty}, Selected: ${editProductSerials.length})`)}
                            </label>
                            {editProductSerials.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setEditProductSerials([])}
                                className="text-[10px] text-red-600 hover:underline cursor-pointer"
                              >
                                {txt("সিরিয়াল ক্লিয়ার করুন", "Clear Serials")}
                              </button>
                            )}
                          </div>

                          {/* চিপস হিসেবে সিরিয়াল নম্বর */}
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                            {availableSerialsList.map(sn => {
                              const isSelected = editProductSerials.includes(sn);
                              return (
                                <button
                                  type="button"
                                  key={sn}
                                  onClick={() => {
                                    if (isSelected) {
                                      setEditProductSerials(prev => prev.filter(s => s !== sn));
                                    } else {
                                      if (editProductSerials.length >= editProductQty) {
                                        alert(txt(`ইতিমধ্যে ${editProductQty} টি সিরিয়াল নির্বাচিত হয়েছে!`, `Already ${editProductQty} serials selected!`));
                                        return;
                                      }
                                      setEditProductSerials(prev => [...prev, sn]);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition border ${
                                    isSelected 
                                      ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs' 
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                                  }`}
                                >
                                  {sn} {isSelected ? '✓' : '+'}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={txt("অথবা সিরিয়াল স্ক্যান বা টাইপ করুন (কমা দিয়ে আলাদা করুন)", "Or scan/type serials (separated by comma)")}
                              value={editProductSerialInput}
                              onChange={(e) => setEditProductSerialInput(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-mono bg-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ৩. হিসাব, পেমেন্ট ও লেজার সমন্বয় সামারি */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  
                  {/* বাম সাইড: নোট, পেমেন্ট টাইপ ও লেজার রিকনসিলিয়েশন নোটিশ */}
                  <div className="md:col-span-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">{txt("পেমেন্ট মেথড", "Payment Method")}</label>
                        <select
                          value={editPaymentType}
                          onChange={(e) => setEditPaymentType(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs outline-none focus:border-blue-500 font-bold"
                        >
                          <option value="Cash">{txt("নগদ (Cash)", "Cash")}</option>
                          <option value="Due">{txt("বাকি বিক্রয় (Due)", "Due Sale")}</option>
                          <option value="bKash">{txt("বিকাশ (bKash)", "bKash")}</option>
                          <option value="Nagad">{txt("নগদ মোবাইল ব্যাংকিং (Nagad)", "Nagad")}</option>
                          <option value="Bank">{txt("ব্যাংক ট্রান্সফার (Bank)", "Bank Transfer")}</option>
                          <option value="Cheque">{txt("চেক (Cheque)", "Cheque")}</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">{txt("বিশেষ ছাড় / ডিসকাউন্ট (৳)", "Special Discount (৳)")}</label>
                        <input
                          type="number"
                          min="0"
                          value={editDiscount}
                          onChange={(e) => setEditDiscount(e.target.value)}
                          className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs outline-none focus:border-blue-500 font-mono font-bold text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">{txt("ইনভয়েস বিশেষ নোট", "Invoice Special Note")}</label>
                      <textarea
                        rows="2"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder={txt("ইনভয়েস নোট বা সংশোধনের কারণ লিখুন...", "Enter invoice note or reason for edit...")}
                        className="w-full border border-gray-300 rounded-xl p-2 bg-white text-xs outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* লেজার সমন্বয় অ্যালার্ট কার্ড */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 text-blue-950 space-y-1.5 shadow-xs">
                      <div className="font-bold flex items-center gap-1.5 text-xs text-blue-900">
                        <RotateCcw size={14} className="text-blue-600 shrink-0" />
                        {txt("কাস্টমার লেজার স্বয়ংক্রিয় সমন্বয় নীতি:", "Customer Ledger Automatic Reconciliation Policy:")}
                      </div>
                      <p className="text-[11px] leading-relaxed text-blue-900/90">
                        {txt(
                          `এই ইনভয়েসটি সংরক্ষণ করলে নতুন পণ্যের জন্য ইনভেন্টরি স্টক কমে যাবে এবং ক্রেতা "${editingInvoice.customer_name}"-এর লেজারের বকেয়া এবং লেনদেন খতিয়ান স্বয়ংক্রিয়ভাবে সমন্বয় হয়ে যাবে।`,
                          `Saving this invoice will deduct inventory stock for new items and automatically adjust customer "${editingInvoice.customer_name}"'s ledger balance and transaction records.`
                        )}
                      </p>
                      <div className="text-[11px] pt-1.5 border-t border-blue-200/80 flex justify-between font-bold">
                        <span>{txt("লেজারে বকেয়া পরিবর্তন:", "Ledger Due Change:")}</span>
                        <span className={`font-mono text-xs ${editDueDiff > 0 ? "text-red-700" : editDueDiff < 0 ? "text-green-700" : "text-gray-700"}`}>
                          {editDueDiff > 0 
                            ? `+ ৳ ${editDueDiff.toLocaleString()} ${txt('(বকেয়া বৃদ্ধি পাবে)', '(Due will increase)')}` 
                            : editDueDiff < 0 
                            ? `- ৳ ${Math.abs(editDueDiff).toLocaleString()} ${txt('(বকেয়া হ্রাস পাবে)', '(Due will decrease)')}` 
                            : `৳ ০ ${txt('(বকেয়া অপরিবর্তিত)', '(Due unchanged)')}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ডান সাইড: ফিন্যান্সিয়াল হিসাব ক্যালকুলেশন */}
                  <div className="md:col-span-6 bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 text-gray-600">
                      <span>{txt("আইটেম মোট মূল্য (Sub Total):", "Items Sub Total:")}</span>
                      <span className="font-mono font-bold">৳ {editSubTotal.toLocaleString()}</span>
                    </div>

                    {editDiscountNum > 0 && (
                      <div className="flex justify-between py-1 text-orange-600 font-semibold border-b pb-1">
                        <span>{txt("বিশেষ ছাড় / ডিসকাউন্ট:", "Special Discount:")}</span>
                        <span className="font-mono">- ৳ {editDiscountNum.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1.5 font-bold text-gray-900 border-b text-sm">
                      <span>{txt("১. সংশোধিত মোট বিল:", "1. Revised Net Total:")}</span>
                      <span className="font-mono text-blue-700">৳ {editNetTotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-1 text-gray-700">
                      <span>{txt("২. পূর্বে পরিশোধিত টাকা:", "2. Previously Paid Amount:")}</span>
                      <span className="font-mono font-bold">৳ {editOldPaid.toLocaleString()}</span>
                    </div>

                    {/* অতিরিক্ত নগদ প্রদান ইনপুট */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-emerald-900 text-xs">
                          {txt("৩. নতুন পণ্যের জন্য অতিরিক্ত নগদ জমা:", "3. Additional Cash for New Items:")}
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-emerald-700">+ ৳</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="০"
                            value={editAdditionalPaid}
                            onChange={(e) => setEditAdditionalPaid(e.target.value)}
                            className="w-24 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-right font-mono font-bold text-xs outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-700 leading-tight">
                        {txt("* ক্রেতা যদি নতুন পণ্যের বাবদ এখনই নগদ টাকা প্রদান করে, তবে সেই টাকার পরিমাণ এখানে লিখুন", "* If customer is paying additional cash right now for the added items, enter the amount here")}
                      </p>
                    </div>

                    <div className="flex justify-between py-1 text-green-700 font-bold border-b pb-1">
                      <span>{txt("৪. সর্বমোট পরিশোধিত টাকা:", "4. Total Paid Amount:")}</span>
                      <span className="font-mono">৳ {editCalculatedPaid.toLocaleString()}</span>
                    </div>

                    <div className={`flex justify-between py-1.5 px-2.5 rounded-xl font-black text-sm ${
                      editNewDue > 0 ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-green-100 text-green-800 border border-green-300'
                    }`}>
                      <span>{txt("৫. সংশোধিত অবশিষ্ট বাকি:", "5. Revised Remaining Due:")}</span>
                      <span className="font-mono">৳ {editNewDue.toLocaleString()}</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* মডাল ফুটার */}
              <div className="p-4 border-t bg-gray-50 flex justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  {txt("বাতিল করুন", "Cancel")}
                </button>

                <button
                  type="button"
                  onClick={handleSaveEditedInvoice}
                  disabled={editSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-amber-600/20 transition disabled:opacity-50"
                >
                  {editSaving ? (
                    <>{txt("সংরক্ষণ ও লেজার সমন্বয় হচ্ছে...", "Saving & Adjusting Ledger...")}</>
                  ) : (
                    <>{txt("💾 ইনভয়েস সংরক্ষণ ও লেজার সমন্বয় করুন", "💾 Save Invoice & Adjust Ledger")}</>
                  )}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* মানি রিসিপ্ট প্রিন্ট ও প্রিভিউ মডাল (বকেয়া কাস্টমার টাকা বা চেক জমা সমন্বয়) */}
      {activeMoneyReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 py-6 md:py-8 z-50 overflow-y-auto print:static print:bg-white print:p-0">
          <div className="print-card-wrapper bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-2 relative flex flex-col print:shadow-none print:w-full print:m-0 print:border-none">
            {/* স্ক্রিন কন্ট্রোল হেডার */}
            <div className="sticky top-0 z-30 flex justify-between items-center p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-2xl shadow-xs print:hidden">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{txt("মানি রিসিপ্ট প্রিন্ট প্রিভিউ (Money Receipt)", "Money Receipt Print Preview")}</h3>
                  <p className="text-[11px] text-gray-500">{txt("বকেয়া কাস্টমার টাকা বা চেক জমা সমন্বয় রসিদ", "Customer Due Payment & Cheque Adjustment Receipt")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setShareData({
                      type: 'receipt',
                      title: txt('মানি রিসিপ্ট / টাকা জমার রসিদ', 'Money Receipt / Payment Voucher'),
                      number: activeMoneyReceipt.receipt_no || `MR-${activeMoneyReceipt.id}`,
                      date: formatDateTimeDMY(activeMoneyReceipt.created_at),
                      customerName: activeMoneyReceipt.customer_name,
                      customerMobile: activeMoneyReceipt.customer_mobile,
                      amount: activeMoneyReceipt.amount,
                      filename: `FC_Technology_MoneyReceipt_${activeMoneyReceipt.receipt_no || activeMoneyReceipt.id}`,
                      elementId: 'printable-content',
                      raw: activeMoneyReceipt,
                      details: lang === 'en'
                        ? `Amount Paid: ৳${Number(activeMoneyReceipt.amount || 0).toLocaleString()} | Payment Mode: ${activeMoneyReceipt.payment_method || 'Cash'}${activeMoneyReceipt.note ? ` | Note: ${activeMoneyReceipt.note}` : ''}`
                        : `জমা পরিমাণ: ৳${Number(activeMoneyReceipt.amount || 0).toLocaleString()} | মাধ্যম: ${activeMoneyReceipt.payment_method || 'ক্যাশ'}${activeMoneyReceipt.note ? ` | নোট: ${activeMoneyReceipt.note}` : ''}`
                    });
                  }} 
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <Share2 size={15} /> {lang === 'en' ? 'Share' : 'শেয়ার করুন'}
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 transition"
                >
                  <Printer size={15} /> {txt("প্রিন্ট মানি রিসিপ্ট / Save PDF", "Print Money Receipt / Save PDF")}
                </button>
                <button 
                  onClick={() => setActiveMoneyReceipt(null)} 
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* প্রিন্ট উপযোগী কন্টেন্ট */}
            <div id="printable-content" className="money-receipt-printable p-6 md:p-8 bg-white text-gray-900 text-xs font-sans flex flex-col justify-between min-h-[580px] print:p-4 print:m-0 relative overflow-hidden border border-gray-100 rounded-b-2xl print:border-none">
              {/* সেন্টার ওয়াটারমার্ক - লেখার কারণে মুছে না গিয়ে স্পষ্ট দৃশ্যমান */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none">
                <img 
                  src="/fc_logo_watermark.png" 
                  alt="Watermark" 
                  className="w-80 md:w-[420px] max-w-[85%] opacity-[0.22] md:opacity-[0.24] select-none object-contain print:opacity-[0.22]" 
                  onError={(e) => { e.target.src = '/fc_brand_watermark.png'; }}
                />
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  {/* ১. শীর্ষ হেডার ও শপ ইনফো */}
                  <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src="/fc_logo_icon.png" 
                        alt="FC Technology Logo" 
                        className="h-14 w-14 object-contain shrink-0" 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-950 uppercase tracking-tight">FC Technology</h1>
                        <p className="text-gray-600 text-[10px] font-medium">{txt("কম্পিউটার (ডেস্কটপ, ল্যাপটপ), সিসি ক্যামেরা ও আইটি পণ্যের পাইকারি ও খুচরা বিক্রেতা", "Wholesale & Retail Seller of Computers (Desktop, Laptop), CCTV & IT Products")}</p>
                        <p className="text-[10px] text-gray-500">{txt("দোকান নং #১৮, আর এফ জোহরা টাওয়ার, নীচ তলা, চৌমুহনী, আগ্রাবাদ, চট্টগ্রাম।", "Shop #18, RF Zohura Tower, Ground Floor, Chowmuhani, Agrabad, Chattogram.")}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{txt("হটলাইন: 09613-181920, 01812-091939", "Hotline: 09613-181920, 01812-091939")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-emerald-800 text-white font-black text-[11px] px-3 py-1 uppercase rounded-md tracking-wider mb-1">
                        {txt("মানি রিসিপ্ট / MONEY RECEIPT", "MONEY RECEIPT")}
                      </span>
                      <p className="text-xs font-bold text-gray-800 mt-1">
                        {txt("রিসিপ্ট নং:", "Receipt No:")} <span className="font-mono text-emerald-700 font-black">{activeMoneyReceipt.receipt_no || `MR-${activeMoneyReceipt.id}`}</span>
                      </p>
                      <p className="text-[11px] text-gray-600">
                        {txt("তারিখ ও সময়:", "Date & Time:")} {formatDateTimeDMY(activeMoneyReceipt.created_at)}
                      </p>
                      <p className="text-[11px] text-gray-700 font-semibold">
                        {txt("আদায়কারী:", "Received By:")} {activeMoneyReceipt.received_by || 'Admin'}
                      </p>
                    </div>
                  </div>

                  {/* ২. গ্রাহকের তথ্য বক্স */}
                  <div className="invoice-transparent-box mt-3 bg-slate-50/60 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 print:bg-transparent print:border-gray-300">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{txt("গ্রাহকের বিবরণ:", "Customer Details:")}</span>
                      <h2 className="text-base font-black text-gray-900">{activeMoneyReceipt.customer_name}</h2>
                      {activeMoneyReceipt.customer_mobile && (
                        <p className="text-xs text-gray-600 font-medium">{txt("মোবাইল:", "Mobile:")} {activeMoneyReceipt.customer_mobile}</p>
                      )}
                      {activeMoneyReceipt.customer_address && (
                        <p className="text-[11px] text-gray-500">{txt("ঠিকানা:", "Address:")} {activeMoneyReceipt.customer_address}</p>
                      )}
                    </div>
                    <div className="sm:text-right bg-white/70 p-2 rounded-lg border border-slate-200 print:bg-transparent print:border-none">
                      <span className="text-[10px] uppercase font-bold text-gray-500">{txt("পরিশোধের মাধ্যম:", "Payment Method:")}</span>
                      <p className="text-xs font-black text-emerald-800 flex items-center sm:justify-end gap-1">
                        {activeMoneyReceipt.payment_method === 'Cheque' ? txt('🏦 ব্যাংক চেক (Cheque)', '🏦 Bank Cheque') : 
                         activeMoneyReceipt.payment_method === 'bKash' ? txt('📱 বিকাশ (bKash)', '📱 bKash') : 
                         activeMoneyReceipt.payment_method === 'Bank' ? txt('🏛️ ব্যাংক ট্রান্সফার (Bank Transfer)', '🏛️ Bank Transfer') : txt('💵 নগদ অর্থ (Cash)', '💵 Cash')}
                      </p>
                    </div>
                  </div>

                  {/* ৩. চেকের বিস্তারিত (যদি চেক হয়) */}
                  {activeMoneyReceipt.payment_method === 'Cheque' && (
                    <div className="invoice-transparent-box mt-2.5 bg-amber-50/60 border border-amber-300 rounded-xl p-3 text-xs print:bg-transparent print:border-amber-400">
                      <div className="font-bold text-amber-900 border-b border-amber-200 pb-1 mb-2 flex items-center justify-between">
                        <span>{txt("🏦 চেকের বিবরণী (Bank Cheque Details)", "🏦 Bank Cheque Details")}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-semibold">
                          {txt("স্ট্যাটাস:", "Status:")} {activeMoneyReceipt.cheque_status === 'Deposited' ? txt('জমা সম্পন্ন', 'Deposited') : activeMoneyReceipt.cheque_status === 'Bounced' ? txt('বাউন্সড', 'Bounced') : txt('গৃহীত / জমাপ্রক্রিয়াধীন', 'Pending / Under Process')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-gray-500 block text-[10px]">{txt("ব্যাংকের নাম:", "Bank Name:")}</span>
                          <span className="font-bold text-gray-900">{activeMoneyReceipt.bank_name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px]">{txt("চেক নম্বর:", "Cheque No:")}</span>
                          <span className="font-mono font-bold text-blue-700">{activeMoneyReceipt.cheque_no || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px]">{txt("চেকের ইস্যু তারিখ:", "Cheque Issue Date:")}</span>
                          <span className="font-bold text-gray-800">{formatDateDMY(activeMoneyReceipt.cheque_date)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px]">{txt("ব্যাংকে জমার নির্ধারিত তারিখ:", "Deposit Date:")}</span>
                          <span className="font-bold text-amber-900">{formatDateDMY(activeMoneyReceipt.deposit_date)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ৪. সমন্বয় ও টাকার হিসাব টেবিল */}
                  <div className="invoice-transparent-box mt-3 overflow-hidden rounded-xl border border-gray-300 print:bg-transparent">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-emerald-800 text-white font-bold uppercase print:bg-emerald-800 print:text-white">
                          <th className="p-2.5 w-10 text-center">{txt("নং", "SL")}</th>
                          <th className="p-2.5">{txt("বিবরণ / লেনদেনের খাত", "Description / Account Head")}</th>
                          <th className="p-2.5 text-right w-36">{txt("টাকার পরিমাণ (৳)", "Amount (৳)")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="p-2.5 text-center font-bold">01</td>
                          <td className="p-2.5">
                            <p className="font-bold text-gray-900">
                              {activeMoneyReceipt.note || (activeMoneyReceipt.payment_method === 'Cheque' ? txt(`চেক নং: ${activeMoneyReceipt.cheque_no || ''} বাবদ গ্রহণ`, `Received against Cheque No: ${activeMoneyReceipt.cheque_no || ''}`) : txt('পূর্বের বকেয়া হিসাব সমন্বয় বাবদ নগদ/চেক জমা গ্রহণ', 'Received against previous due balance adjustment'))}
                            </p>
                            <p className="text-[11px] text-gray-500">{txt("সরাসরি গ্রাহকের মূল খতিয়ান / খাতা থেকে সমন্বয়কৃত", "Adjusted directly from customer general ledger")}</p>
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-sm text-emerald-700">
                            ৳ {Number(activeMoneyReceipt.amount).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* ৫. পূর্বের বকেয়া, জমাকৃত টাকা ও বর্তমান অবশিষ্ট বকেয়া বিশ্লেষণ */}
                  <div className="mt-3 grid grid-cols-3 gap-2.5 text-center">
                    <div className="invoice-transparent-box p-2.5 rounded-xl border border-gray-200 bg-gray-50/60 print:bg-transparent">
                      <span className="text-[10px] text-gray-500 font-semibold block uppercase">{txt("১. পূর্বের মোট বকেয়া", "1. Previous Total Due")}</span>
                      <span className="text-sm md:text-base font-black font-mono text-gray-800">
                        ৳ {Number(activeMoneyReceipt.previous_due || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="invoice-transparent-box p-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 print:bg-transparent shadow-xs">
                      <span className="text-[10px] text-emerald-800 font-bold block uppercase">{txt("২. অত্র রসিদে জমাকৃত", "2. Amount Received")}</span>
                      <span className="text-base md:text-lg font-black font-mono text-emerald-700">
                        ৳ {Number(activeMoneyReceipt.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="invoice-transparent-box p-2.5 rounded-xl border border-rose-300 bg-rose-50/60 print:bg-transparent">
                      <span className="text-[10px] text-rose-800 font-bold block uppercase">{txt("৩. বর্তমান অবশিষ্ট বকেয়া", "3. Current Remaining Due")}</span>
                      <span className="text-sm md:text-base font-black font-mono text-rose-700">
                        ৳ {Number(activeMoneyReceipt.remaining_due || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* কথায় টাকার পরিমাণ */}
                  <div className="invoice-transparent-box mt-3 p-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs flex items-center justify-between print:bg-transparent print:border-gray-300">
                    <p className="text-gray-800 font-semibold">
                      <strong className="text-gray-900">{txt("কথায় (In Words): ", "In Words: ")}</strong>
                      <span className="italic font-bold text-emerald-900">
                        {lang === 'en' ? numberToWords(activeMoneyReceipt.amount) : numberToWordsBn(activeMoneyReceipt.amount)}
                      </span>
                    </p>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase print:hidden">
                      {txt("পরিশোধিত", "PAID")}
                    </span>
                  </div>

                  {/* নোট / শর্তাবলী */}
                  <div className="mt-2.5 p-2 bg-yellow-50/60 border border-yellow-200 rounded-lg text-[10px] text-gray-600 print:bg-white print:border-none">
                    <p>
                      <strong>{txt("বিশেষ জ্ঞাতব্য:", "Special Note:")}</strong> {txt("চেক প্রদান করা হয়ে থাকলে, ব্যাংকে চেক পাস বা ক্লিয়ারিং সাপেক্ষে সমন্বয় চূড়ান্ত বলে গণ্য হবে। কম্পিউটার দ্বারা প্রস্তুতকৃত রশিদ।", "If paid via cheque, settlement is subject to cheque realization/clearing in bank. This is a computer generated receipt.")}
                    </p>
                  </div>
                </div>

                {/* ৬. স্বাক্ষর সেকশন (একদম নিচে) */}
                <div className="money-receipt-signatures flex justify-between items-end pt-8 mt-auto text-xs pb-3 border-t border-gray-200 print:border-gray-400">
                  <div className="text-center w-40">
                    <div className="border-t border-gray-400 pt-1 font-semibold text-gray-800">
                      {txt("গ্রাহকের স্বাক্ষর", "Customer's Signature")}
                    </div>
                  </div>
                  <div className="text-center w-48">
                    <div className="border-t border-gray-400 pt-1 font-semibold text-gray-800">
                      {txt("আদায়কারী ক্যাশিয়ার স্বাক্ষর", "Collecting Cashier's Signature")}
                    </div>
                  </div>
                  <div className="text-center w-52">
                    <img 
                      src="/authority_seal_signature.png" 
                      alt="Seal & Signature" 
                      className="h-14 object-contain mx-auto mb-1 select-none"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="border-t border-gray-400 pt-1 font-semibold text-gray-800">
                      {txt("কর্তৃপক্ষের স্বাক্ষর ও সিল", "Authorized Signature & Seal")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ২. A4 ফরমাল কোটেশন প্রিন্ট প্রিভিউ */}
      {activeQuotationPrint && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 py-6 md:py-8 z-50 overflow-y-auto print:static print:bg-white print:p-0">
          <div className="print-card-wrapper bg-white rounded-xl shadow-2xl w-full max-w-4xl my-2 relative flex flex-col print:shadow-none print:w-full print:m-0 print:border-none">
            <div className="sticky top-0 z-30 flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl shadow-xs print:hidden">
              <span className="font-bold text-gray-700">{txt("A4 ফরমাল কোটেশন প্রিন্ট প্রিভিউ", "A4 Formal Quotation Print Preview")}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShareData({
                      type: 'quotation',
                      title: txt('মূল্য উদ্ধৃতি / কোটেশন', 'Price Quotation'),
                      number: activeQuotationPrint.quotation_no,
                      date: formatDateDMY(activeQuotationPrint.date),
                      customerName: activeQuotationPrint.customer_name,
                      customerMobile: activeQuotationPrint.customer_mobile,
                      amount: activeQuotationPrint.total_amount,
                      filename: `FC_Technology_Quotation_${activeQuotationPrint.quotation_no}`,
                      elementId: 'printable-content',
                      raw: activeQuotationPrint,
                      details: lang === 'en'
                        ? `Validity: ${activeQuotationPrint.valid_until ? formatDateDMY(activeQuotationPrint.valid_until) : '7 Days'}\nItems: ${activeQuotationPrint.items ? activeQuotationPrint.items.length : 0}`
                        : `মেয়াদ: ${activeQuotationPrint.valid_until ? formatDateDMY(activeQuotationPrint.valid_until) : '৭ দিন'}\nআইটেম সংখ্যা: ${activeQuotationPrint.items ? activeQuotationPrint.items.length : 0} টি`
                    });
                  }} 
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
                >
                  <Share2 size={15} /> {lang === 'en' ? 'Share' : 'শেয়ার করুন'}
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
                >
                  <Printer size={15} /> {txt("প্রিন্ট কোটেশন / Save PDF", "Print Quotation / Save PDF")}
                </button>
                <button 
                  onClick={() => setActiveQuotationPrint(null)} 
                  className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div id="printable-content" className="quotation-printable p-6 md:p-8 bg-white text-gray-900 text-xs font-sans flex flex-col justify-between min-h-[950px] max-h-[1123px] box-border print:p-0 print:m-0 relative overflow-hidden">
              {/* সেন্টারে FC Technology লোগো জলছাপ (Watermark) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img 
                  src="/fc_logo_watermark.png" 
                  alt="Watermark" 
                  className="w-96 md:w-[440px] max-w-[80%] opacity-[0.12] select-none object-contain print:opacity-[0.14]" 
                />
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
                <div>
                  {/* প্যাড লেটারহেড হেডার */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5 mb-2.5">
                    <div className="flex items-start gap-3">
                      <img 
                        src="/fc_logo_icon.png" 
                        alt="FC Logo" 
                        className="h-16 w-16 object-contain shrink-0 mt-0.5" 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <h1 className="text-3xl font-black text-gray-950 uppercase tracking-tight">FC TECHNOLOGY</h1>
                        <p className="text-xs text-blue-700 font-bold mt-0.5">{txt("কম্পিউটার, সিসিটিভি ক্যামেরা ও পূর্ণাঙ্গ আইটি সলিউশন", "Computers, CCTV Camera & Complete IT Solutions")}</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">{txt("দোকান নং #১৮, আর এফ জোহরা টাওয়ার, নীচ তলা, চৌমুহনী, আগ্রাবাদ, চট্টগ্রাম।", "Shop #18, RF Zohura Tower, Ground Floor, Chowmuhani, Agrabad, Chattogram.")}</p>
                        <p className="text-[11px] text-gray-600 font-medium">{txt("হটলাইন: 09613-181920, 01812-091939 | fctechnologist@gmail.com | www.fctechbd.com", "Hotline: 09613-181920, 01812-091939 | info@fctechbd.com | www.fctechbd.com")}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block bg-slate-900 text-white font-bold text-xs px-3 py-1 uppercase rounded mb-1.5 tracking-wider">
                        {txt("মূল্য প্রস্তাবনা / QUOTATION", "PRICE QUOTATION")}
                      </span>
                      <p className="text-xs font-bold text-gray-800">
                        {txt("কোটেশন নং:", "Quotation No:")} <span className="font-mono text-blue-700">{activeQuotationPrint.quotation_no}</span>
                      </p>
                      <p className="text-[11px] text-gray-600">{txt("তারিখ:", "Date:")} {activeQuotationPrint.date}</p>
                      <p className="text-[11px] font-bold text-rose-600">
                        {txt("মেয়াদ:", "Validity:")} {activeQuotationPrint.valid_until ? formatDateDMY(activeQuotationPrint.valid_until) : txt('জমা থেকে ১ সপ্তাহ', '1 Week from Issue')}
                      </p>
                    </div>
                  </div>

                  {/* কোটেশন প্রাপক ও বিষয় */}
                  <div className="quotation-transparent-box bg-transparent p-3 rounded-lg border border-gray-300 mb-2.5 print:bg-transparent">
                    <div className="flex flex-row justify-between items-start gap-4 text-xs">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">{txt("কোটেশন প্রাপক:", "Quotation For:")}</span>
                        <h3 className="text-sm font-bold text-gray-950 mt-0.5">{activeQuotationPrint.customer_name}</h3>
                        {activeQuotationPrint.customer_address && (
                          <p className="text-[11px] text-gray-600 mt-0.5">{activeQuotationPrint.customer_address}</p>
                        )}
                        {activeQuotationPrint.customer_mobile && (
                          <p className="text-[11px] text-gray-600 font-medium mt-0.5">{txt("মোবাইল:", "Mobile:")} {activeQuotationPrint.customer_mobile}</p>
                        )}
                      </div>
                      <div className="flex-1 text-right flex flex-col justify-start items-end">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">{txt("বিষয় (Subject):", "Subject:")}</span>
                        <p className="text-xs font-bold text-gray-900 mt-0.5 max-w-md">
                          {activeQuotationPrint.subject || txt('পণ্য সরবরাহ ও সার্ভিসিং সংক্রান্ত আনুষ্ঠানিক মূল্য প্রস্তাবনা', 'Official price quotation for IT products supply & services')}
                        </p>
                      </div>
                    </div>
                  </div>

                {/* আইটেম টেবিল (প্রতিটি রোতে লেখাগুলো মাঝ বরাবর) */}
                <table className="w-full text-left border-collapse border border-gray-300 mb-2 text-xs bg-transparent">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[11px] uppercase align-middle print:bg-slate-800 print:text-white">
                      <th className="py-1.5 px-2 text-center w-10 border border-slate-700 align-middle"><div className="flex items-center justify-center min-h-[22px]">{txt("নং", "SL")}</div></th>
                      <th className="py-1.5 px-3 border border-slate-700 align-middle"><div className="flex items-center min-h-[22px]">{txt("পণ্যের বিবরণ ও স্পেসিফিকেশন", "Product Description & Specification")}</div></th>
                      <th className="py-1.5 px-2 text-center w-24 border border-slate-700 align-middle"><div className="flex items-center justify-center min-h-[22px]">{txt("ওয়ারেন্টি", "Warranty")}</div></th>
                      <th className="py-1.5 px-2 text-center w-16 border border-slate-700 align-middle"><div className="flex items-center justify-center min-h-[22px]">{txt("পরিমাণ", "Qty")}</div></th>
                      <th className="py-1.5 px-3 text-right w-28 border border-slate-700 align-middle"><div className="flex items-center justify-end min-h-[22px]">{txt("একক দর (৳)", "Unit Price (৳)")}</div></th>
                      <th className="py-1.5 px-3 text-right w-32 border border-slate-700 align-middle"><div className="flex items-center justify-end min-h-[22px]">{txt("মোট মূল্য (৳)", "Total Price (৳)")}</div></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 bg-transparent">
                    {activeQuotationPrint.items.map((it, idx) => (
                      <tr key={idx} className="bg-transparent hover:bg-transparent align-middle">
                        <td className="py-1.5 px-2 text-center align-middle border-r border-gray-200">
                          <div className="flex items-center justify-center min-h-[24px] font-mono text-[11px] leading-none">{idx + 1}</div>
                        </td>
                        <td className="py-1.5 px-3 align-middle border-r border-gray-200">
                          <div className="flex items-center min-h-[24px] font-bold text-gray-900 leading-snug">{it.name}</div>
                        </td>
                        <td className="py-1.5 px-2 text-center align-middle border-r border-gray-200">
                          <div className="flex items-center justify-center min-h-[24px]">
                            {it.warranty ? (
                              <span className="text-blue-700 font-semibold text-[11px]">{it.warranty}</span>
                            ) : (
                              <span className="text-gray-400 text-[11px]">{txt("নন-ওয়ারেন্টি", "Non-warranty")}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-center align-middle border-r border-gray-200">
                          <div className="flex items-center justify-center min-h-[24px] font-bold font-mono text-[11px] leading-none">{it.qty}</div>
                        </td>
                        <td className="py-1.5 px-3 text-right align-middle border-r border-gray-200">
                          <div className="flex items-center justify-end min-h-[24px] font-mono text-[11px] leading-none">৳ {Number(it.unit_price).toLocaleString()}</div>
                        </td>
                        <td className="py-1.5 px-3 text-right align-middle border-r border-gray-200">
                          <div className="flex items-center justify-end min-h-[24px] font-mono font-bold text-gray-950 text-[11px] leading-none">৳ {Number(it.total_price || (it.unit_price * it.qty)).toLocaleString()}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-900 bg-transparent print:bg-transparent font-bold">
                    <tr className="align-middle">
                      <td colSpan={5} className="py-2 px-3 text-right font-black text-xs text-gray-800 align-middle">
                        <div className="flex items-center justify-end min-h-[22px]">
                          {txt("সর্বমোট প্রাক্কলিত মূল্য (Grand Total):", "Grand Total (Estimated):")}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-black text-sm text-blue-900 align-middle">
                        <div className="flex items-center justify-end min-h-[22px]">
                          ৳ {Number(activeQuotationPrint.total_amount).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* কথায় টাকার পরিমাণ (ট্রান্সপারেন্ট বক্স) */}
                <div className="quotation-transparent-box bg-transparent border border-blue-300/80 rounded-lg p-2 mb-2 text-xs print:bg-transparent">
                  <span className="font-bold text-gray-700">{txt("কথায় (In Words): ", "In Words: ")}</span>
                  <span className="font-semibold text-blue-950 italic">
                    {lang === 'en' ? numberToWords(activeQuotationPrint.total_amount) : numberToWordsBn(activeQuotationPrint.total_amount)}
                  </span>
                </div>

                {/* ৩টি বাধ্যতামূলক শর্তাবলী (ট্রান্সপারেন্ট বক্স যাতে জলছাপ ঢেকে না যায়) */}
                <div className="quotation-transparent-box border border-gray-300 rounded-lg p-2.5 bg-transparent print:bg-transparent space-y-1 text-xs">
                  <p className="font-bold text-gray-900 underline">{txt("শর্তাবলী / Terms & Conditions:", "Terms & Conditions:")}</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-gray-700 font-medium">
                    <li>{txt("এই কোটেশনটি জমা দেওয়ার তারিখ থেকে এক (১) সপ্তাহ পর্যন্ত কার্যকর থাকবে।", "This quotation is valid for one (1) week from the date of submission.")}</li>
                    <li>{txt("পণ্য সরবরাহের সময় ৫০ শতাংশ এবং সরবরাহ ও ইনস্টলেশন সম্পন্ন হওয়ার পর সম্পূর্ণ অর্থ নগদে অথবা চেকের মাধ্যমে পরিশোধ করতে হবে।", "50% advance payment upon work order, remaining 50% payable in cash or cheque upon delivery & installation completion.")}</li>
                    <li>{txt("উপরোক্ত মূল্যসমূহ VAT এবং প্রযোজ্য সকল কর ব্যতীত।", "The above prices exclude VAT and applicable government taxes.")}</li>
                  </ol>
                  {activeQuotationPrint.note && (
                    <div className="pt-1 text-gray-700 border-t mt-1">
                      <strong>{txt("বিশেষ নোট:", "Special Note:")}</strong> {activeQuotationPrint.note}
                    </div>
                  )}
                </div>
              </div>

              {/* স্বাক্ষর সেকশন (কর্তৃপক্ষের স্বাক্ষর ও সিলের ছবি সহ - একদম নিচে) */}
              <div className="quotation-signatures flex justify-between items-end pt-4 mt-auto text-xs w-full pb-2">
                {/* গ্রাহকের স্বাক্ষর */}
                <div className="text-center w-52">
                  <div className="border-t border-gray-500 pt-1.5 font-bold text-gray-800">
                    {txt("গ্রাহকের স্বাক্ষর ও সিল", "Customer's Signature & Seal")}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{txt("গৃহীত ও অনুমোদিত", "Accepted & Approved")}</p>
                </div>

                {/* কর্তৃপক্ষের স্বাক্ষর ও সিল (ইমেজ সহ) */}
                <div className="text-center w-60">
                  <img 
                    src="/authority_seal_signature.png" 
                    alt="Authorized Seal & Signature" 
                    className="h-16 object-contain mx-auto mb-1 select-none"
                  />
                  <div className="border-t border-gray-600 pt-1 font-bold text-gray-900">
                    {txt("কর্তৃপক্ষের স্বাক্ষর ও সিল", "Authorized Signature & Seal")}
                  </div>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                    FC TECHNOLOGY
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ৩. সমস্ত পণ্যের স্টক তালিকা প্রিন্ট */}
      {showStockPrint && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 py-6 md:py-8 z-50 overflow-y-auto print:static print:bg-white print:p-0">
          <div className="print-card-wrapper bg-white rounded-xl shadow-2xl w-full max-w-4xl my-2 relative flex flex-col print:shadow-none print:w-full print:m-0 print:border-none">
            <div className="sticky top-0 z-30 flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl shadow-xs print:hidden">
              <span className="font-bold text-gray-700">{txt("স্টক ও ইনভেন্টরি সামগ্রিক রিপোর্ট", "Overall Stock & Inventory Report")}</span>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Printer size={15} /> {txt("প্রিন্ট স্টক রিপোর্ট", "Print Stock Report")}</button>
                <button onClick={() => setShowStockPrint(false)} className="p-2 text-gray-400 cursor-pointer"><X size={20} /></button>
              </div>
            </div>

            <div id="printable-content" className="p-6 md:p-8 bg-white text-gray-900 text-xs font-sans flex flex-col justify-between min-h-0 print:min-h-0 print:p-0 print:m-0">
              <div>
                <div className="border-b-2 border-gray-900 pb-3 mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black">FC Technology</h2>
                    <p className="text-xs text-gray-500">{txt("ইনভেন্টরি সামগ্রিক স্টক ও মূল্যায়ন রিপোর্ট", "Overall Inventory Stock & Valuation Report")}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">{txt("তারিখ:", "Date:")} {formatDateDMY(new Date())}</p>
                    <p className="text-gray-500">{txt("মোট আইটেম:", "Total Items:")} {products.length} {txt("প্রকার", "Types")}</p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse text-xs mb-4">
                  <thead>
                    <tr className="bg-slate-700 text-white text-[11px] uppercase print:bg-slate-700 print:text-white">
                      <th className="py-2 px-2 text-center w-10">SL</th>
                      <th className="py-2 px-2">{txt("পণ্যের নাম", "Product Name")}</th>
                      <th className="py-2 px-2">{txt("মডেল", "Model")}</th>
                      <th className="py-2 px-2">{txt("ক্যাটাগরি", "Category")}</th>
                      <th className="py-2 px-2 text-right">{txt("ক্রয় দর", "Cost Price")}</th>
                      <th className="py-2 px-2 text-right">{txt("বিক্রয় দর", "Sale Price")}</th>
                      <th className="py-2 px-2 text-center">{txt("বর্তমান স্টক", "Stock")}</th>
                      <th className="py-2 px-2 text-right">{txt("মোট ক্রয়মূল্য", "Total Cost")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((p, idx) => {
                      const itemStock = Number(p.current_stock || 0);
                      const itemPurchase = Number(p.purchase_price || 0);
                      const itemTotalPurchase = itemStock * itemPurchase;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="py-1.5 px-2 text-center text-gray-500">{idx + 1}</td>
                          <td className="py-1.5 px-2 font-bold">{p.name}</td>
                          <td className="py-1.5 px-2 font-mono text-[11px]">{p.model || '-'}</td>
                          <td className="py-1.5 px-2 text-[11px]">{p.category || 'General'}</td>
                          <td className="py-1.5 px-2 text-right font-mono">৳ {itemPurchase.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold">৳ {Number(p.selling_price || 0).toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-center font-bold">{itemStock} {txt("টি", "pcs")}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-800">৳ {itemTotalPurchase.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-800 bg-gray-50 font-bold print:bg-white text-xs">
                    <tr>
                      <td colSpan={4} className="py-2 px-2 text-right font-black">{txt("সর্বমোট পরিমাণ ও ক্রয়মূল্য:", "Grand Total Qty & Cost:")}</td>
                      <td colSpan={2} className="py-2 px-2 text-right text-gray-500 font-normal">
                        {txt("গড় দর", "Avg Rate")}
                      </td>
                      <td className="py-2 px-2 text-center font-black text-blue-700">
                        {products.reduce((acc, p) => acc + Number(p.current_stock || 0), 0)} {txt("টি", "pcs")}
                      </td>
                      <td className="py-2 px-2 text-right font-black text-rose-700 text-sm">
                        ৳ {products.reduce((acc, p) => acc + (Number(p.purchase_price || 0) * Number(p.current_stock || 0)), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* ক্রয় দরে মোট স্টক মূল্যের হাইলাইটেড সামারি কার্ড */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-slate-300 rounded-xl p-3.5 bg-slate-50/50 print:bg-white mt-4">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-center print:border">
                    <span className="text-[11px] font-semibold text-gray-500 block mb-0.5">{txt("মোট মজুত পণ্য (Stock Quantity)", "Total Stock Quantity")}</span>
                    <strong className="text-base font-black text-gray-800">
                      {products.reduce((acc, p) => acc + Number(p.current_stock || 0), 0)} {txt("টি", "pcs")}
                    </strong>
                    <span className="text-[10px] text-gray-400 block mt-0.5">({products.length} {txt("ধরণের পণ্য", "product types")})</span>
                  </div>

                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-center print:bg-white print:border">
                    <span className="text-[11px] font-bold text-rose-700 block mb-0.5">
                      {txt("★ ক্রয় দরে সর্বমোট স্টক মূল্য", "★ Total Stock Valuation (at Cost)")}
                    </span>
                    <strong className="text-lg font-black text-rose-700">
                      ৳ {products.reduce((acc, p) => acc + (Number(p.purchase_price || 0) * Number(p.current_stock || 0)), 0).toLocaleString()}
                    </strong>
                    <span className="text-[10px] text-rose-500 block mt-0.5">{txt("বর্তমানে দোকানে থাকা সমস্ত পণ্যের ইনভেস্টমেন্ট", "Shop's total inventory capital at cost")}</span>
                  </div>

                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-center print:bg-white print:border">
                    <span className="text-[11px] font-bold text-blue-700 block mb-0.5">
                      {txt("বিক্রয় দরে মোট সম্ভাব্য মূল্য", "Total Stock Valuation (at Retail)")}
                    </span>
                    <strong className="text-lg font-black text-blue-700">
                      ৳ {products.reduce((acc, p) => acc + (Number(p.selling_price || 0) * Number(p.current_stock || 0)), 0).toLocaleString()}
                    </strong>
                    <span className="text-[10px] text-blue-500 block mt-0.5">
                      {txt("সম্ভাব্য লাভ:", "Potential Profit:")} ৳ {(products.reduce((acc, p) => acc + (Number(p.selling_price || 0) * Number(p.current_stock || 0)), 0) - products.reduce((acc, p) => acc + (Number(p.purchase_price || 0) * Number(p.current_stock || 0)), 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* সিগনেচার */}
              <div className="flex justify-between items-end pt-6 mt-6 text-xs border-t border-gray-200">
                <div className="text-center w-40">
                  <div className="border-t border-gray-400 pt-1 font-semibold text-gray-700">{txt("স্টক নিরীক্ষকের স্বাক্ষর", "Stock Auditor's Signature")}</div>
                </div>
                <div className="text-center w-40">
                  <div className="border-t border-gray-400 pt-1 font-semibold text-gray-700">{txt("ম্যানেজার / প্রোপ্রাইটর", "Manager / Proprietor")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ৪. কাস্টমার লেনদেন হিস্ট্রি ও প্রিন্ট মডাল */}
      {ledgerCustomer && (
        <div className={`fixed inset-0 bg-black/60 flex items-start justify-center p-4 py-6 md:py-8 z-50 overflow-y-auto print:static print:bg-white print:p-0 ${activeMoneyReceipt ? 'print:hidden' : ''}`}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-2 relative flex flex-col print:shadow-none print:w-full print:m-0">
            <div className="sticky top-0 z-30 flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl shadow-xs print:hidden">
              <span className="font-bold text-gray-700">{ledgerCustomer.name} - {txt("এর লেনদেন খতিয়ান", "'s Ledger Statement")}</span>
              <div className="flex items-center gap-2">
                {Number(ledgerCustomer.total_due) > 0 && (
                  <button 
                    onClick={() => { setPayModal(ledgerCustomer); setCollectAmount(''); setCollectNote(''); }} 
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
                  >
                    <Receipt size={15} /> {txt("বকেয়া গ্রহণ ও মানি রিসিপ্ট", "Collect Due & Money Receipt")}
                  </button>
                )}
                <button 
                  onClick={() => {
                    setShareData({
                      type: 'ledger',
                      title: txt('কাস্টমার লেজার বিবরণী', 'Customer Ledger Statement'),
                      number: `CUST-${ledgerCustomer.id}`,
                      date: formatDateDMY(new Date()),
                      customerName: ledgerCustomer.name,
                      customerMobile: ledgerCustomer.mobile,
                      amount: ledgerCustomer.total_due,
                      filename: `FC_Technology_Customer_Ledger_${ledgerCustomer.name?.replace(/\s+/g, '_') || ledgerCustomer.id}`,
                      elementId: 'printable-content',
                      raw: ledgerCustomer,
                      details: lang === 'en'
                        ? `Address: ${ledgerCustomer.address || '-'}\nTotal Outstanding Due: ৳${Number(ledgerCustomer.total_due || 0).toLocaleString()}`
                        : `ঠিকানা: ${ledgerCustomer.address || '-'}\nসর্বমোট বকেয়া পাওনা: ৳${Number(ledgerCustomer.total_due || 0).toLocaleString()}`
                    });
                  }} 
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
                >
                  <Share2 size={15} /> {lang === 'en' ? 'Share' : 'শেয়ার করুন'}
                </button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"><Printer size={15} /> {txt("প্রিন্ট লেজার", "Print Ledger")}</button>
                <button onClick={() => setLedgerCustomer(null)} className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
              </div>
            </div>

            {/* তারিখ রেঞ্জ ফিল্টার কন্ট্রোল (স্ক্রিনে দৃশ্যমান, প্রিন্টে লুকানো) */}
            <div className="p-3.5 bg-blue-50/60 border-b flex flex-wrap items-center justify-between gap-2.5 text-xs print:hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-800 flex items-center gap-1">
                  <Filter size={15} className="text-blue-600" /> {txt("কত তারিখ থেকে কত তারিখের লেজার দেখবেন:", "Filter ledger by date range:")}
                </span>
                <input
                  type="date"
                  value={custLedgerFromDate}
                  onChange={e => setCustLedgerFromDate(e.target.value)}
                  className="border border-blue-300 rounded px-2.5 py-1.5 bg-white outline-none focus:border-blue-600 font-semibold"
                  title={txt("শুরুর তারিখ", "Start Date")}
                />
                <span className="text-gray-500 font-bold">{txt("হতে", "to")}</span>
                <input
                  type="date"
                  value={custLedgerToDate}
                  onChange={e => setCustLedgerToDate(e.target.value)}
                  className="border border-blue-300 rounded px-2.5 py-1.5 bg-white outline-none focus:border-blue-600 font-semibold"
                  title={txt("শেষের তারিখ", "End Date")}
                />
                <button
                  type="button"
                  onClick={() => handleFilterCustomerLedger(ledgerCustomer.id)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded cursor-pointer transition shadow-xs"
                >
                  {txt("ফিল্টার করুন", "Filter")}
                </button>
                {(custLedgerFromDate || custLedgerToDate) && (
                  <button
                    type="button"
                    onClick={() => handleResetCustomerLedger(ledgerCustomer.id)}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded cursor-pointer transition"
                  >
                    {txt("সব দেখুন (রিসেট)", "Reset (View All)")}
                  </button>
                )}
              </div>
              <div className="text-gray-600 text-[11px] font-medium">
                {txt("ফিল্টারকৃত লেনদেন:", "Filtered Transactions:")} <span className="font-bold text-blue-700">{transactions.length}</span> {txt("টি", "")}
              </div>
            </div>

            <div id="printable-content" className="statement-printable p-8 bg-white text-gray-900 text-sm font-sans flex flex-col justify-between min-h-[950px] print:p-0">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="border-b-2 border-gray-900 pb-3 mb-4 flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-black">FC Technology</h2>
                      <p className="text-xs text-gray-500">{txt("গ্রাহক লেনদেন খতিয়ান বিবরণী / Customer Statement", "Customer Account Statement / Ledger")}</p>
                      <p className="text-[11px] text-gray-500">{txt("দোকান নং #১৮, আর এফ জোহরা টাওয়ার, আগ্রাবাদ, চট্টগ্রাম।", "Shop #18, RF Zohura Tower, Agrabad, Chattogram.")}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-bold text-sm text-gray-900">{txt("গ্রাহক:", "Customer:")} {ledgerCustomer.name}</p>
                      <p className="text-gray-600">{txt("মোবাইল:", "Mobile:")} {ledgerCustomer.mobile || '-'}</p>
                      <p className="font-bold text-red-600">{txt("বর্তমান মোট বকেয়া:", "Current Total Due:")} ৳ {Number(ledgerCustomer.total_due).toLocaleString()}</p>
                      {(custLedgerFromDate || custLedgerToDate) && (
                        <p className="text-[11px] font-bold text-blue-700 mt-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                          {txt("সময়কাল:", "Period:")} {custLedgerFromDate || txt('শুরু', 'Start')} {txt("হতে", "to")} {custLedgerToDate || txt('আজ পর্যন্ত', 'Today')}
                        </p>
                      )}
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse text-xs mb-4">
                    <thead>
                      <tr className="bg-gray-900 text-white uppercase print:bg-gray-900 print:text-white">
                        <th className="p-2.5">{txt("তারিখ", "Date")}</th>
                        <th className="p-2.5">{txt("লেনদেনের ধরন", "Type")}</th>
                        <th className="p-2.5">{txt("বিবরণ / ইনভয়েস নং / মানি রিসিপ্ট", "Description / Ref No")}</th>
                        <th className="p-2.5 text-right">{txt("দেনা / মোট বিল (৳)", "Debit / Bill (৳)")}</th>
                        <th className="p-2.5 text-right">{txt("পরিশোধিত (৳)", "Credit / Paid (৳)")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactions.map((t, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2.5">{formatDateDMY(t.created_at)}</td>
                          <td className="p-2.5 font-bold">
                            {t.type === 'Invoice' ? (
                              <span className="text-blue-700">{txt("বিক্রয় বিল", "Sales Invoice")}</span>
                            ) : (
                              <span className="text-emerald-700">{txt("বকেয়া জমা", "Due Received")}</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {t.type === 'Invoice' ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-blue-700">{t.invoice_no}</span>
                                <button
                                  type="button"
                                  onClick={() => handleViewInvoiceDetails(t.id)}
                                  className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[11px] font-bold cursor-pointer print:hidden flex items-center gap-1"
                                  title={txt("এই বিক্রয়ের মেমো ও পণ্যের তালিকা দেখুন", "View invoice memo and items")}
                                >
                                  📄 {txt("বিল দেখুন", "View Bill")}
                                </button>
                                {currentUser?.role === 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditInvoice(t.id)}
                                    className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-[11px] font-bold cursor-pointer print:hidden flex items-center gap-1"
                                    title={txt("এই ইনভয়েস এডিট করে নতুন পণ্য যোগ করুন", "Edit invoice & add products")}
                                  >
                                    ✏️ {txt("এডিট", "Edit")}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      {t.receipt_no || `MR-${t.id}`}
                                    </span>
                                    <span className="text-[11px] font-semibold text-gray-700">
                                      {t.payment_method === 'Cheque' ? (
                                        <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                          {txt("চেক:", "Cheque:")} {t.cheque_no || '-'} ({t.bank_name || 'Bank'})
                                        </span>
                                      ) : t.payment_method === 'bKash' ? (
                                        <span className="text-pink-800 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">{txt("বিকাশ", "bKash")}</span>
                                      ) : t.payment_method === 'Bank' ? (
                                        <span className="text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">{txt("ব্যাংক ট্রান্সফার", "Bank Transfer")}</span>
                                      ) : (
                                        <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{txt("নগদ গ্রহণ", "Cash")}</span>
                                      )}
                                    </span>
                                  </div>
                                  {t.note && <p className="text-[11px] text-gray-500 mt-0.5">{t.note}</p>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleViewMoneyReceipt(t)}
                                  className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[11px] font-bold cursor-pointer print:hidden flex items-center gap-1 shrink-0 self-start sm:self-center"
                                  title={txt("এই জমার মানি রিসিপ্ট দেখুন ও প্রিন্ট করুন", "View & print money receipt")}
                                >
                                  <Receipt size={12} /> {txt("মানি রিসিপ্ট", "Receipt")}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-gray-800">
                            {t.type === 'Invoice' ? `৳ ${Number(t.total_amount).toLocaleString()}` : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-green-600">
                            {t.type === 'Invoice' ? `৳ ${Number(t.paid_amount).toLocaleString()}` : `৳ ${Number(t.amount).toLocaleString()}`}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-6 text-gray-400">
                            {txt("নির্বাচিত তারিখের মধ্যে কোনো লেনদেন পাওয়া যায়নি", "No transactions found within selected date range")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {transactions.length > 0 && (
                      <tfoot className="border-t-2 border-gray-900 bg-gray-50 font-bold text-xs print:bg-white">
                        <tr>
                          <td colSpan={3} className="p-2.5 text-right font-black">
                            {(custLedgerFromDate || custLedgerToDate) ? txt('নির্বাচিত সময়ের সর্বমোট:', 'Total in Selected Period:') : txt('সর্বমোট হিসাব:', 'Grand Total:')}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-gray-900">
                            ৳ {transactions.reduce((acc, t) => acc + (t.type === 'Invoice' ? Number(t.total_amount || 0) : 0), 0).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-green-700">
                            ৳ {transactions.reduce((acc, t) => acc + (t.type === 'Invoice' ? Number(t.paid_amount || 0) : Number(t.amount || 0)), 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* গ্রাহক লেজার সিগনেচার সেকশন - একদম নিচে */}
                <div className="statement-signatures flex justify-between items-end pt-8 mt-auto text-xs pb-3 border-t border-gray-200 print:border-gray-400">
                  <div className="text-center w-40">
                    <div className="border-t border-gray-400 pt-1 font-semibold text-gray-800">
                      {txt("গ্রাহকের স্বাক্ষর", "Customer's Signature")}
                    </div>
                  </div>
                  <div className="text-center w-48">
                    <div className="border-t border-gray-400 pt-1 font-semibold text-gray-800">
                      {txt("কর্তৃপক্ষের স্বাক্ষর ও সিল", "Authorized Signature & Seal")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ৫. সাপ্লায়ার লেনদেন খতিয়ান ও প্রিন্ট মডাল */}
      {supplierLedger && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 py-6 md:py-8 z-50 overflow-y-auto print:static print:bg-white print:p-0">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-2 relative flex flex-col print:shadow-none print:w-full print:m-0">
            <div className="sticky top-0 z-30 flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl shadow-xs print:hidden">
              <span className="font-bold text-gray-700">{supplierLedger.name} ({supplierLedger.company}) - {txt("এর খতিয়ান", "'s Ledger Statement")}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShareData({
                      type: 'ledger',
                      title: `${supplierLedger.name} - ${txt("এর মহাজন লেজার", "'s Supplier Statement")}`,
                      number: `SUPP-${supplierLedger.id}`,
                      date: formatDateDMY(new Date()),
                      customerName: supplierLedger.name,
                      customerMobile: supplierLedger.mobile,
                      amount: supplierLedger.total_payable,
                      filename: `FC_Technology_Supplier_Ledger_${supplierLedger.name?.replace(/\s+/g, '_') || supplierLedger.id}`,
                      elementId: 'printable-content',
                      raw: supplierLedger,
                      details: lang === 'en'
                        ? `Company: ${supplierLedger.company || '-'}\nTotal Outstanding Payable: ৳${Number(supplierLedger.total_payable || 0).toLocaleString()}`
                        : `প্রতিষ্ঠান: ${supplierLedger.company || '-'}\nসর্বমোট বকেয়া দেনা: ৳${Number(supplierLedger.total_payable || 0).toLocaleString()}`
                    });
                  }} 
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
                >
                  <Share2 size={15} /> {lang === 'en' ? 'Share' : 'শেয়ার করুন'}
                </button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"><Printer size={15} /> {txt("প্রিন্ট খতিয়ান", "Print Statement")}</button>
                <button onClick={() => setSupplierLedger(null)} className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
              </div>
            </div>

            {/* তারিখ রেঞ্জ ফিল্টার কন্ট্রোল (স্ক্রিনে দৃশ্যমান, প্রিন্টে লুকানো) */}
            <div className="p-3.5 bg-blue-50/60 border-b flex flex-wrap items-center justify-between gap-2.5 text-xs print:hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-800 flex items-center gap-1">
                  <Filter size={15} className="text-blue-600" /> {txt("কত তারিখ থেকে কত তারিখের লেজার দেখবেন:", "Filter statement by date range:")}
                </span>
                <input
                  type="date"
                  value={suppLedgerFromDate}
                  onChange={e => setSuppLedgerFromDate(e.target.value)}
                  className="border border-blue-300 rounded px-2.5 py-1.5 bg-white outline-none focus:border-blue-600 font-semibold"
                  title={txt("শুরুর তারিখ", "Start Date")}
                />
                <span className="text-gray-500 font-bold">{txt("হতে", "to")}</span>
                <input
                  type="date"
                  value={suppLedgerToDate}
                  onChange={e => setSuppLedgerToDate(e.target.value)}
                  className="border border-blue-300 rounded px-2.5 py-1.5 bg-white outline-none focus:border-blue-600 font-semibold"
                  title={txt("শেষের তারিখ", "End Date")}
                />
                <button
                  type="button"
                  onClick={() => handleFilterSupplierLedger(supplierLedger.id)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded cursor-pointer transition shadow-xs"
                >
                  {txt("ফিল্টার করুন", "Filter")}
                </button>
                {(suppLedgerFromDate || suppLedgerToDate) && (
                  <button
                    type="button"
                    onClick={() => handleResetSupplierLedger(supplierLedger.id)}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded cursor-pointer transition"
                  >
                    {txt("সব দেখুন (রিসেট)", "Reset (View All)")}
                  </button>
                )}
              </div>
              <div className="text-gray-600 text-[11px] font-medium">
                {txt("ফিল্টারকৃত লেনদেন:", "Filtered Transactions:")} <span className="font-bold text-blue-700">{supplierTransactions.length}</span> {txt("টি", "")}
              </div>
            </div>

            <div id="printable-content" className="statement-printable p-8 bg-white text-gray-900 text-sm font-sans flex flex-col justify-between min-h-[950px] print:p-0">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="border-b-2 border-gray-900 pb-3 mb-4 flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-black">FC Technology</h2>
                      <p className="text-xs text-gray-500">{txt("মহাজন / সাপ্লায়ার হিসাব বিবরণী / Supplier Statement", "Supplier Account Statement / Ledger")}</p>
                      <p className="text-[11px] text-gray-500">{txt("দোকান নং #১৮, আর এফ জোহরা টাওয়ার, আগ্রাবাদ, চট্টগ্রাম।", "Shop #18, RF Zohura Tower, Agrabad, Chattogram.")}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-bold text-sm text-gray-900">{txt("সাপ্লায়ার:", "Supplier:")} {supplierLedger.name} ({supplierLedger.company})</p>
                      <p className="text-gray-600">{txt("মোবাইল:", "Mobile:")} {supplierLedger.mobile || '-'}</p>
                      <p className="font-bold text-red-600">{txt("বর্তমান মোট পাওনা:", "Current Total Payable:")} ৳ {Number(supplierLedger.total_payable).toLocaleString()}</p>
                      {(suppLedgerFromDate || suppLedgerToDate) && (
                        <p className="text-[11px] font-bold text-blue-700 mt-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                          {txt("সময়কাল:", "Period:")} {suppLedgerFromDate || txt('শুরু', 'Start')} {txt("হতে", "to")} {suppLedgerToDate || txt('আজ পর্যন্ত', 'Today')}
                        </p>
                      )}
                    </div>
                  </div>

                  <table className="w-full text-left border-collapse text-xs mb-4">
                    <thead>
                      <tr className="bg-gray-900 text-white uppercase print:bg-gray-900 print:text-white">
                        <th className="p-2.5">{txt("তারিখ", "Date")}</th>
                        <th className="p-2.5">{txt("লেনদেনের ধরন", "Type")}</th>
                        <th className="p-2.5">{txt("বিবরণ / নোট", "Description / Note")}</th>
                        <th className="p-2.5 text-right">{txt("টাকার পরিমাণ (৳)", "Amount (৳)")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {supplierTransactions.map((st, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2.5">{formatDateDMY(st.created_at)}</td>
                          <td className="p-2.5 font-bold">
                            {st.type === 'নতুন পণ্য ওয়ারেন্টি পেন্ডিং' ? (
                              <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 font-bold text-[11px]">
                                ⚠️ {txt("নতুন পণ্য ওয়ারেন্টি পেন্ডিং", "Defective Stock Warranty Pending")}
                              </span>
                            ) : st.type === 'সাপ্লায়ার পণ্য পরিবর্তন' ? (
                              <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-300 font-bold text-[11px]">
                                🔄 {txt("সাপ্লায়ার পণ্য পরিবর্তন", "Supplier Warranty Replaced")}
                              </span>
                            ) : st.type === 'Purchase' ? (
                              <span className="text-rose-700">{txt("পণ্য ক্রয় (+)", "Purchase (+)")}</span>
                            ) : (
                              <span className="text-emerald-700">{txt("পেমেন্ট পরিশোধ (-)", "Payment (-)")}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-gray-700">
                            <div className="flex items-center justify-between gap-2">
                              <span>{st.note || '-'}</span>
                              {st.bill_image && (
                                <button 
                                  type="button" 
                                  onClick={() => setActiveImageView({ src: st.bill_image, title: `${supplierLedger.name} (${formatDateDMY(st.created_at)})` })}
                                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer print:hidden shrink-0 transition"
                                  title={txt("বিল বা মেমোর ছবি দেখুন", "View bill or memo image")}
                                >
                                  <Camera size={11} /> {txt("বিল দেখুন", "View Bill")}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className={`p-2.5 text-right font-mono font-bold ${
                            st.type === 'Purchase' ? 'text-red-600' :
                            st.type === 'নতুন পণ্য ওয়ারেন্টি পেন্ডিং' ? 'text-amber-700' :
                            st.type === 'সাপ্লায়ার পণ্য পরিবর্তন' ? 'text-blue-700' :
                            'text-green-600'
                          }`}>
                            ৳ {Number(st.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {supplierTransactions.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-6 text-gray-400">
                            {txt("নির্বাচিত তারিখের মধ্যে কোনো লেনদেন পাওয়া যায়নি", "No transactions found within selected date range")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {supplierTransactions.length > 0 && (
                      <tfoot className="border-t-2 border-gray-900 bg-gray-50 font-bold text-xs print:bg-white">
                        <tr>
                          <td colSpan={3} className="p-2.5 text-right font-black">
                            {(suppLedgerFromDate || suppLedgerToDate) ? txt('নির্বাচিত সময়ের মোট ক্রয় / প্রাপ্তি:', 'Total Purchase in Period:') : txt('মোট ক্রয়:', 'Total Purchase:')}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-rose-700">
                            ৳ {supplierTransactions.reduce((acc, st) => acc + (st.type === 'Purchase' ? Number(st.amount || 0) : 0), 0).toLocaleString()}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="p-2.5 text-right font-black">
                            {(suppLedgerFromDate || suppLedgerToDate) ? txt('নির্বাচিত সময়ের মোট পরিশোধ:', 'Total Payment in Period:') : txt('মোট পরিশোধ:', 'Total Payment:')}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-green-700">
                            ৳ {supplierTransactions.reduce((acc, st) => acc + (st.type === 'Payment' ? Number(st.amount || 0) : 0), 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* সাপ্লায়ার লেজার সিগনেচার সেকশন - একদম নিচে */}
                <div className="statement-signatures flex justify-between items-end pt-8 mt-auto text-xs pb-3 border-t border-gray-200 print:border-gray-400">
                  <div className="text-center w-40">
                    <div className="border-t border-gray-400 pt-1 font-semibold text-gray-800">
                      {txt("সাপ্লায়ারের স্বাক্ষর", "Supplier's Signature")}
                    </div>
                  </div>
                  <div className="text-center w-48">
                    <div className="border-t border-gray-400 pt-1 font-semibold text-gray-800">
                      {txt("কর্তৃপক্ষের স্বাক্ষর ও সিল", "Authorized Signature & Seal")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* লগইন / ইউজার সুইচ মডাল */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{txt("ইউজার পরিবর্তন / লগইন", "Switch User / Login")}</h3>
            <p className="text-xs text-gray-500 mb-4">{txt("অ্যাডমিনিস্ট্রেটর অথবা বিক্রয় প্রতিনিধি একাউন্টে সুইচ করুন", "Switch to Administrator or Sales Executive account")}</p>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setLoginForm({ username: 'admin', password: 'admin123' })}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-bold cursor-pointer transition text-center"
              >
                {txt("👑 অ্যাডমিন", "👑 Admin")}
              </button>
              <button
                type="button"
                onClick={() => setLoginForm({ username: 'sales', password: 'sales123' })}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-bold cursor-pointer transition text-center"
              >
                {txt("👤 বিক্রয় প্রতিনিধি", "👤 Sales Rep")}
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 text-xs">
              <div>
                <label className="font-bold">{txt("ইউজারনেম", "Username")}</label>
                <input type="text" required placeholder={txt("admin অথবা sales", "admin or sales")} value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} className="w-full border p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="font-bold">{txt("পাসওয়ার্ড", "Password")}</label>
                <input type="password" required placeholder={txt("পাসওয়ার্ড দিন", "Enter password")} value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full border p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition cursor-pointer">
                {txt("সুইচ / লগইন করুন", "Switch / Login")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* শেয়ার মডাল (হোয়াটসঅ্যাপ, ওয়েব শেয়ার ও ক্লিপবোর্ড কপি) */}
      <ShareModal
        isOpen={!!shareData}
        onClose={() => setShareData(null)}
        data={shareData}
        lang={lang}
      />

      {/* ফুলস্ক্রিন ইমেজ ভিউয়ার ও জুম মডাল (সাপ্লায়ার বিল, ব্যাংক রশিদ ও ওয়ারেন্টি স্লিপ) */}
      <ImageViewModal
        isOpen={!!activeImageView}
        onClose={() => setActiveImageView(null)}
        imageSrc={activeImageView?.src}
        title={activeImageView?.title}
        lang={lang}
      />

      {/* ওয়ারেন্টি ও সার্ভিসিং গ্রহণ স্লিপ প্রিন্ট ও শেয়ার প্রিভিউ মডাল */}
      <WarrantySlipPrintModal
        slip={activeWarrantySlip}
        onClose={() => setActiveWarrantySlip(null)}
        onShare={(slip) => {
          setShareData({
            type: 'warranty',
            title: slip.custom_title || txt('ওয়ারেন্টি ও সার্ভিসিং গ্রহণ স্লিপ', 'Warranty & Servicing Intake Slip'),
            number: slip.token_no,
            date: formatDateDMY(slip.received_date),
            customerName: slip.customer_name,
            customerMobile: slip.customer_mobile,
            amount: slip.estimated_cost,
            filename: `FC_Technology_Warranty_Slip_${slip.token_no}`,
            elementId: 'printable-content',
            raw: slip,
            details: txt(
              `পণ্য: ${slip.product_name} (${slip.model_no || '-'})\nসিরিয়াল: ${slip.serial_no || '-'}\nসমস্যা: ${slip.problem_description}\nআনুষঙ্গিক: ${slip.accessories_received || (slip.has_accessories === 'হ্যাঁ' ? 'আছে' : 'নেই')}\nসম্ভাব্য ডেলিভারি: ${formatDateDMY(slip.estimated_delivery_date)}\nগ্রহণকারী: ${slip.received_by || '-'}`,
              `Product: ${slip.product_name} (${slip.model_no || '-'})\nSerial: ${slip.serial_no || '-'}\nIssue: ${slip.problem_description}\nAccessories: ${slip.accessories_received || (slip.has_accessories === 'হ্যাঁ' ? 'Yes' : 'None')}\nEst. Delivery: ${formatDateDMY(slip.estimated_delivery_date)}\nReceived By: ${slip.received_by || '-'}`
            )
          });
        }}
        onEdit={(slip) => {
          setActiveWarrantySlip(null);
          setActiveTab('warranty_service');
          setEditWarrantySlipDirect(slip);
        }}
        lang={lang}
      />

      {/* ১-ক্লিক ডাটাবেজ ব্যাকআপ ও রিস্টোর মডাল */}
      <DatabaseBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        lang={lang}
        onRestoreSuccess={() => {
          fetchProducts();
          fetchCustomers();
          fetchSuppliers();
          fetchReports();
        }}
      />
    </div>
  );
}

export default App;