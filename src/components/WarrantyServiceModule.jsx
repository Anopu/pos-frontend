import React, { useState, useEffect } from 'react';
import { 
  Wrench, Shield, Plus, Search, Filter, Printer, Share2, 
  Trash2, Edit, CheckCircle, Clock, Truck, Eye, AlertCircle, 
  Calendar, User, Phone, Package, Camera, ExternalLink, Image as ImageIcon,
  RefreshCw, PackageMinus, CheckCircle2, RotateCcw, X
} from 'lucide-react';
import { API_BASE } from '../utils/apiConfig';

export const DEVICE_CATEGORIES = [
  { bn: 'প্রিন্টার সার্ভিস', en: 'Printer Service' },
  { bn: 'ক্যামেরা ইনস্টলেশন', en: 'Camera Installation' },
  { bn: 'ক্যামেরা সার্ভিস', en: 'Camera Service' },
  { bn: 'ইউপিএস সার্ভিস', en: 'UPS Service' },
  { bn: 'ল্যাপটপ সার্ভিস', en: 'Laptop Service' },
  { bn: 'ডেস্কটপ সার্ভিস', en: 'Desktop Service' },
  { bn: 'সাধারণ সার্ভিস', en: 'General Service' },
  { bn: 'অন্যান্য', en: 'Other' }
];

export const formatDeviceCategory = (cat, currentLang = 'bn') => {
  if (!cat) return '';
  const item = DEVICE_CATEGORIES.find(c => 
    c.bn === cat || 
    c.en === cat || 
    c.en.toLowerCase() === String(cat).toLowerCase() ||
    (cat === 'ল্যাপটপ সার্ভিসিং' && c.bn === 'ল্যাপটপ সার্ভিস') ||
    (cat === 'ডেস্কটপ সার্ভিসিং' && c.bn === 'ডেস্কটপ সার্ভিস') ||
    (cat === 'সাধারণ সার্ভিসিং' && c.bn === 'সাধারণ সার্ভিস')
  );
  if (!item) return cat;
  return currentLang === 'en' ? item.en : item.bn;
};

export default function WarrantyServiceModule({
  currentUser,
  onOpenSlip,
  onShareSlip,
  onViewImage,
  suppliers = [],
  products = [],
  onStockUpdated,
  openDefectiveModalDirect = false,
  onCloseDefectiveModalDirect,
  editSlipDirect = null,
  onClearEditSlipDirect,
  lang = 'bn',
  t = (k) => k
}) {
  const [activeSubTab, setActiveSubTab] = useState('customer'); // 'customer' | 'supplier'
  const txt = (bn, en) => (lang === 'en' ? (en !== undefined ? en : bn) : bn);
  const formatStatus = (st) => {
    if (lang !== 'en') return st;
    const map = {
      'গ্রহণকৃত': 'Received',
      'প্রক্রিয়াধীন': 'In Progress',
      'সার্ভিসিং সম্পন্ন': 'Ready for Delivery',
      'সম্পন্ন': 'Completed',
      'ডেলিভারি সম্পন্ন': 'Delivered',
      'ফেরত প্রদানকৃত': 'Returned',
      'বাতিল': 'Cancelled',
      'সাপ্লায়ারের নিকট প্রেরিত': 'Sent to Supplier',
      'সাপ্লায়ার থেকে ফেরত এসেছে': 'Returned from Supplier',
      'রিপ্লেসমেন্ট প্রাপ্ত': 'Replacement Received'
    };
    return map[st] || st;
  };

  // কাস্টমার ওয়ারেন্টি স্টেট
  const [warrantyList, setWarrantyList] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingSlip, setEditingSlip] = useState(null);
  const [loading, setLoading] = useState(false);

  // কাস্টমার ইনটেক ফর্ম
  const [customerForm, setCustomerForm] = useState({
    customer_name: '',
    customer_mobile: '',
    customer_address: '',
    product_name: '',
    model_no: '',
    serial_no: '',
    device_category: 'সাধারণ সার্ভিস',
    problem_description: '',
    has_accessories: 'না',
    accessories_received: '',
    received_date: new Date().toISOString().slice(0, 10),
    estimated_delivery_date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().slice(0, 10);
    })(),
    received_by: currentUser?.fullname || 'Admin',
    service_type: 'ওয়ারেন্টি',
    estimated_cost: '',
    advance_paid: '',
    final_cost: '',
    paid_amount: '',
    due_amount: '',
    payment_status: 'অপেক্ষমান',
    payment_method: 'Cash',
    status: 'গ্রহণকৃত',
    delivery_date: '',
    delivery_note: ''
  });

  // স্ট্যাটাস আপডেট মডাল স্টেট
  const [statusUpdateItem, setStatusUpdateItem] = useState(null);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: 'প্রক্রিয়াধীন',
    delivery_note: '',
    delivery_date: new Date().toISOString().slice(0, 10),
    final_cost: '',
    payment_status: 'নগদ',
    payment_method: 'Cash',
    paid_amount: '',
    due_amount: 0
  });

  // সার্ভিসিং বকেয়া আদায় মডাল স্টেট
  const [collectDueItem, setCollectDueItem] = useState(null);
  const [collectDueForm, setCollectDueForm] = useState({
    amount: '',
    payment_method: 'Cash',
    collection_date: new Date().toISOString().slice(0, 10),
    note: ''
  });

  // সাপ্লায়ার ওয়ারেন্টি স্টেট
  const [supplierWarrantyList, setSupplierWarrantyList] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState('All');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierSlipImagePreview, setSupplierSlipImagePreview] = useState(null);

  // সাপ্লায়ার ওয়ারেন্টি ফর্ম
  const [supplierForm, setSupplierForm] = useState({
    supplier_id: '',
    supplier_name: '',
    product_name: '',
    brand: '',
    model: '',
    serial_number: '',
    problem_description: '',
    sent_date: new Date().toISOString().slice(0, 10),
    expected_return_date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 15);
      return d.toISOString().slice(0, 10);
    })(),
    status: 'সাপ্লায়ারের নিকট প্রেরিত',
    supplier_slip_no: '',
    warranty_slip_image: '',
    action_taken: ''
  });

  // নতুন নষ্ট পণ্য ওয়ারেন্টি স্টেট
  const [showDefectiveStockModal, setShowDefectiveStockModal] = useState(false);
  const [defectiveSlipImagePreview, setDefectiveSlipImagePreview] = useState(null);
  const [defectiveStockForm, setDefectiveStockForm] = useState({
    product_id: '',
    supplier_id: '',
    supplier_name: '',
    quantity: 1,
    serial_number: '',
    problem_description: '',
    supplier_slip_no: '',
    expected_return_date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 15);
      return d.toISOString().slice(0, 10);
    })(),
    warranty_slip_image: ''
  });

  // সাপ্লায়ার হতে পরিবর্তিত পণ্য গ্রহণ ও নতুন সিরিয়াল স্টেট
  const [showReplaceSerialModal, setShowReplaceSerialModal] = useState(false);
  const [selectedWarrantyForReplace, setSelectedWarrantyForReplace] = useState(null);
  const [newReplacementSerialInput, setNewReplacementSerialInput] = useState('');
  const [replacementActionNote, setReplacementActionNote] = useState('');

  // লোকাল প্রোডাক্টস ক্যাশ
  const [localProducts, setLocalProducts] = useState(products || []);
  useEffect(() => {
    if (products && products.length > 0) {
      setLocalProducts(products);
    } else {
      fetch(`${API_BASE}/products`)
        .then(r => r.json())
        .then(d => setLocalProducts(Array.isArray(d) ? d : []))
        .catch(err => console.error('Products load error:', err));
    }
  }, [products]);

  // ডিরেক্ট ডিফেক্টিভ মোডাল ওপেন ট্রিগার
  useEffect(() => {
    if (openDefectiveModalDirect) {
      setActiveSubTab('supplier');
      setShowDefectiveStockModal(true);
      if (typeof onCloseDefectiveModalDirect === 'function') {
        onCloseDefectiveModalDirect();
      }
    }
  }, [openDefectiveModalDirect]);

  // ডেটা লোড
  const fetchCustomerWarranties = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/warranty-services`);
      const data = await res.json();
      setWarrantyList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierWarranties = async () => {
    try {
      const res = await fetch(`${API_BASE}/supplier-warranties`);
      const data = await res.json();
      setSupplierWarrantyList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomerWarranties();
    fetchSupplierWarranties();
  }, []);

  const resetCustomerForm = () => {
    setEditingSlip(null);
    setCustomerForm({
      customer_name: '',
      customer_mobile: '',
      customer_address: '',
      product_name: '',
      model_no: '',
      serial_no: '',
      device_category: 'সাধারণ সার্ভিস',
      problem_description: '',
      has_accessories: 'না',
      accessories_received: '',
      received_date: new Date().toISOString().slice(0, 10),
      estimated_delivery_date: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
      })(),
      received_by: currentUser?.fullname || 'Admin',
      service_type: 'ওয়ারেন্টি',
      estimated_cost: '',
      advance_paid: '',
      final_cost: '',
      paid_amount: '',
      due_amount: '',
      payment_status: 'অপেক্ষমান',
      payment_method: 'Cash',
      status: 'গ্রহণকৃত',
      delivery_date: '',
      delivery_note: ''
    });
  };

  const handleOpenEditSlip = (slip) => {
    setEditingSlip(slip);
    const cost = slip.final_cost !== null && slip.final_cost !== undefined ? slip.final_cost : (slip.estimated_cost || '');
    const paid = slip.paid_amount !== null && slip.paid_amount !== undefined ? slip.paid_amount : (slip.advance_paid || '');
    const due = slip.due_amount !== null && slip.due_amount !== undefined ? slip.due_amount : '';
    setCustomerForm({
      customer_name: slip.customer_name || '',
      customer_mobile: slip.customer_mobile || '',
      customer_address: slip.customer_address || '',
      product_name: slip.product_name || '',
      model_no: slip.model_no || '',
      serial_no: slip.serial_no || '',
      device_category: slip.device_category || 'সাধারণ সার্ভিস',
      problem_description: slip.problem_description || '',
      has_accessories: slip.has_accessories || 'না',
      accessories_received: slip.accessories_received || '',
      received_date: slip.received_date ? slip.received_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      estimated_delivery_date: slip.estimated_delivery_date ? slip.estimated_delivery_date.slice(0, 10) : '',
      received_by: slip.received_by || currentUser?.fullname || 'Admin',
      service_type: slip.service_type || 'ওয়ারেন্টি',
      estimated_cost: slip.estimated_cost !== null && slip.estimated_cost !== undefined ? slip.estimated_cost : '',
      advance_paid: slip.advance_paid !== null && slip.advance_paid !== undefined ? slip.advance_paid : '',
      final_cost: cost,
      paid_amount: paid,
      due_amount: due,
      payment_status: slip.payment_status || (Number(due) > 0 ? 'বাকি' : 'নগদ'),
      payment_method: slip.payment_method || 'Cash',
      status: slip.status || 'গ্রহণকৃত',
      delivery_date: slip.delivery_date ? slip.delivery_date.slice(0, 10) : '',
      delivery_note: slip.delivery_note || ''
    });
    setShowCustomerModal(true);
  };

  useEffect(() => {
    if (editSlipDirect) {
      setActiveSubTab('customer');
      handleOpenEditSlip(editSlipDirect);
      if (typeof onClearEditSlipDirect === 'function') {
        onClearEditSlipDirect();
      }
    }
  }, [editSlipDirect]);

  // কাস্টমার ওয়ারেন্টি সাবমিট (নতুন তৈরি অথবা এডিট সংরক্ষণ)
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerForm.customer_name || !customerForm.customer_mobile || !customerForm.product_name || !customerForm.problem_description) {
      alert(lang === 'en' ? 'Please fill in customer name, mobile, product and problem description!' : 'অনুগ্রহ করে কাস্টমারের নাম, মোবাইল, পণ্য এবং সমস্যার বিবরণ দিন!');
      return;
    }

    try {
      const isDelivered = customerForm.status === 'ডেলিভারি সম্পন্ন' || customerForm.status === 'সম্পন্ন';
      const submitPayload = {
        ...customerForm,
        final_cost: isDelivered ? (customerForm.final_cost || customerForm.estimated_cost || 0) : 0,
        paid_amount: isDelivered ? (customerForm.payment_status === 'নগদ' ? (customerForm.final_cost || customerForm.estimated_cost || 0) : (customerForm.paid_amount || 0)) : 0,
        due_amount: isDelivered ? (customerForm.due_amount || 0) : 0,
        delivery_date: isDelivered ? (customerForm.delivery_date || new Date().toISOString().slice(0, 10)) : '',
        payment_status: isDelivered ? customerForm.payment_status : 'অপেক্ষমান'
      };

      if (editingSlip) {
        // এডিট মোড (PUT)
        const res = await fetch(`${API_BASE}/warranty-services/${editingSlip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitPayload)
        });
        const data = await res.json();
        if (res.ok) {
          alert(lang === 'en' ? `Warranty slip updated successfully! (Token: ${editingSlip.token_no})` : `ওয়ারেন্টি স্লিপ সফলভাবে আপডেট হয়েছে! (টোকেন নং: ${editingSlip.token_no})`);
          setShowCustomerModal(false);
          resetCustomerForm();
          fetchCustomerWarranties();
          if (typeof onStockUpdated === 'function') onStockUpdated();
        } else {
          alert(data.error || (lang === 'en' ? 'Failed to update warranty slip!' : 'স্লিপ তথ্য আপডেটে ব্যর্থ হয়েছে!'));
        }
      } else {
        // নতুন তৈরি মোড (POST)
        const res = await fetch(`${API_BASE}/warranty-services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitPayload)
        });
        const data = await res.json();
        if (res.ok) {
          alert(lang === 'en' ? `Successfully saved! Token No: ${data.token_no}` : `সফলভাবে সংরক্ষিত হয়েছে! স্লিপ/টোকেন নং: ${data.token_no}`);
          setShowCustomerModal(false);
          fetchCustomerWarranties();
          if (typeof onStockUpdated === 'function') onStockUpdated();

          // অবিলম্বে স্লিপ ওপেন করে দেখানো
          const createdSlip = {
            ...customerForm,
            id: data.id,
            token_no: data.token_no,
            created_at: new Date()
          };
          if (onOpenSlip) onOpenSlip(createdSlip);

          resetCustomerForm();
        } else {
          alert(data.error || (lang === 'en' ? 'Failed to save!' : 'সংরক্ষণে ব্যর্থ হয়েছে!'));
        }
      }
    } catch {
      alert(lang === 'en' ? 'Server communication error!' : 'সার্ভার যোগাযোগে সমস্যা হয়েছে');
    }
  };

  // স্ট্যাটাস আপডেট মডাল ওপেন
  const handleOpenStatusUpdateModal = (item) => {
    setStatusUpdateItem(item);
    const cost = item.final_cost !== null && item.final_cost !== undefined && item.final_cost !== ''
      ? item.final_cost
      : (item.estimated_cost || '');
    const paid = item.paid_amount !== null && item.paid_amount !== undefined && item.paid_amount !== ''
      ? item.paid_amount
      : (item.advance_paid || '');
    const due = item.due_amount !== null && item.due_amount !== undefined && item.due_amount !== ''
      ? item.due_amount
      : Math.max(0, Number(cost || 0) - Number(paid || 0));

    setStatusUpdateForm({
      status: item.status || 'প্রক্রিয়াধীন',
      delivery_note: item.delivery_note || '',
      delivery_date: item.delivery_date ? item.delivery_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      final_cost: cost,
      payment_status: item.payment_status || (Number(due) > 0 ? 'বাকি' : 'নগদ'),
      payment_method: item.payment_method || 'Cash',
      paid_amount: paid,
      due_amount: due
    });
  };

  // স্ট্যাটাস আপডেট সাবমিট
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusUpdateItem) return;

    try {
      const isDelivered = statusUpdateForm.status === 'ডেলিভারি সম্পন্ন' || statusUpdateForm.status === 'সম্পন্ন';
      const cost = Number(statusUpdateForm.final_cost || 0);
      const paid = statusUpdateForm.payment_status === 'নগদ' ? cost : Number(statusUpdateForm.paid_amount || 0);
      const due = Math.max(0, cost - paid);

      const payload = {
        customer_name: statusUpdateItem.customer_name,
        customer_mobile: statusUpdateItem.customer_mobile,
        customer_address: statusUpdateItem.customer_address,
        status: statusUpdateForm.status,
        delivery_note: statusUpdateForm.delivery_note,
        delivery_date: isDelivered ? statusUpdateForm.delivery_date : null,
        final_cost: isDelivered ? cost : (statusUpdateItem.final_cost !== undefined ? statusUpdateItem.final_cost : undefined),
        paid_amount: isDelivered ? paid : (statusUpdateItem.paid_amount !== undefined ? statusUpdateItem.paid_amount : undefined),
        due_amount: isDelivered ? due : (statusUpdateItem.due_amount !== undefined ? statusUpdateItem.due_amount : undefined),
        payment_status: isDelivered ? (due > 0 ? 'বাকি' : 'নগদ') : (statusUpdateItem.payment_status || undefined),
        payment_method: isDelivered ? statusUpdateForm.payment_method : (statusUpdateItem.payment_method || undefined)
      };

      const res = await fetch(`${API_BASE}/warranty-services/${statusUpdateItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(lang === 'en' ? 'Status and delivery info updated successfully!' : 'স্ট্যাটাস ও ডেলিভারি তথ্য সফলভাবে আপডেট হয়েছে!');
        setStatusUpdateItem(null);
        fetchCustomerWarranties();
        if (typeof onStockUpdated === 'function') onStockUpdated();
      } else {
        const errData = await res.json();
        alert(errData.error || (lang === 'en' ? 'Failed to update!' : 'আপডেট করতে ব্যর্থ হয়েছে'));
      }
    } catch {
      alert(lang === 'en' ? 'Server communication error!' : 'আপডেট হতে সমস্যা হয়েছে');
    }
  };

  // বকেয়া কালেকশন মডাল ওপেন
  const handleOpenCollectDueModal = (item) => {
    setCollectDueItem(item);
    setCollectDueForm({
      amount: item.due_amount || '',
      payment_method: item.payment_method || 'Cash',
      collection_date: new Date().toISOString().slice(0, 10),
      note: ''
    });
  };

  // বকেয়া কালেকশন সাবমিট
  const handleCollectDueSubmit = async (e) => {
    e.preventDefault();
    if (!collectDueItem) return;
    const payAmt = Number(collectDueForm.amount);
    if (!payAmt || payAmt <= 0) {
      alert(lang === 'en' ? 'Please enter a valid amount' : 'সঠিক টাকার পরিমাণ দিন!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/warranty-services/${collectDueItem.id}/collect-due`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectDueForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || (lang === 'en' ? 'Due collected successfully!' : 'বকেয়া টাকা সফলভাবে আদায় হয়েছে!'));
        setCollectDueItem(null);
        fetchCustomerWarranties();
        if (typeof onStockUpdated === 'function') onStockUpdated();
      } else {
        alert(data.error || (lang === 'en' ? 'Failed to collect due' : 'বকেয়া আদায়ে সমস্যা হয়েছে'));
      }
    } catch {
      alert(lang === 'en' ? 'Server communication error!' : 'সার্ভার যোগাযোগে সমস্যা হয়েছে');
    }
  };

  // কাস্টমার স্লিপ ডিলিট
  const handleDeleteCustomerSlip = async (id, tokenNo) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে স্লিপ #${tokenNo} মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch(`${API_BASE}/warranty-services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCustomerWarranties();
      }
    } catch {
      alert('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  // সাপ্লায়ার স্লিপ ইমেজ আপলোড হ্যান্ডলার (Base64)
  const handleSupplierImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSupplierForm(prev => ({ ...prev, warranty_slip_image: reader.result }));
      setSupplierSlipImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // সাপ্লায়ার ওয়ারেন্টি সাবমিট
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!supplierForm.supplier_name || !supplierForm.product_name || !supplierForm.problem_description) {
      alert('সাপ্লায়ারের নাম, পণ্যের নাম এবং সমস্যার বিবরণ দিন!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/supplier-warranties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert(`সাপ্লায়ার ওয়ারেন্টি সফলভাবে সংরক্ষিত হয়েছে! ক্লেইম নং: ${data.claim_no}`);
        setShowSupplierModal(false);
        fetchSupplierWarranties();
        setSupplierSlipImagePreview(null);
        setSupplierForm({
          supplier_id: '',
          supplier_name: '',
          product_name: '',
          brand: '',
          model: '',
          serial_number: '',
          problem_description: '',
          sent_date: new Date().toISOString().slice(0, 10),
          expected_return_date: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 15);
            return d.toISOString().slice(0, 10);
          })(),
          status: 'সাপ্লায়ারের নিকট প্রেরিত',
          supplier_slip_no: '',
          warranty_slip_image: '',
          action_taken: ''
        });
      } else {
        alert(data.error || 'সংরক্ষণে ব্যর্থ হয়েছে!');
      }
    } catch {
      alert('সার্ভার যোগাযোগে সমস্যা হয়েছে');
    }
  };

  // ডিফেক্টিভ স্লিপ ইমেজ হ্যান্ডলার
  const handleDefectiveImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDefectiveStockForm(prev => ({ ...prev, warranty_slip_image: reader.result }));
      setDefectiveSlipImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // নষ্ট পণ্যের ড্রপডাউন সিলেক্ট
  const handleSelectProductForDefectiveStock = (prodId) => {
    const prod = (localProducts || []).find(p => p.id === Number(prodId));
    if (prod) {
      let suppId = prod.supplier_id || '';
      let suppName = '';
      if (suppId) {
        const foundSupp = (suppliers || []).find(s => s.id === Number(suppId));
        if (foundSupp) suppName = foundSupp.name;
      }
      setDefectiveStockForm(prev => ({
        ...prev,
        product_id: prod.id,
        supplier_id: suppId,
        supplier_name: suppName || prev.supplier_name,
        serial_number: ''
      }));
    } else {
      setDefectiveStockForm(prev => ({ ...prev, product_id: '', serial_number: '' }));
    }
  };

  // নতুন নষ্ট পণ্য ওয়ারেন্টিতে পাঠানো সাবমিট
  const handleDefectiveStockSubmit = async (e) => {
    e.preventDefault();
    if (!defectiveStockForm.product_id) {
      alert(txt('দয়া করে স্টক থেকে একটি পণ্য নির্বাচন করুন!', 'Please select a product from stock!'));
      return;
    }
    if (!defectiveStockForm.supplier_name.trim()) {
      alert(txt('সাপ্লায়ার বা মহাজনের নাম প্রদান করুন!', 'Please provide supplier name!'));
      return;
    }
    if (!defectiveStockForm.problem_description.trim()) {
      alert(txt('পণ্যের ত্রুটি বা নষ্টের বিবরণ লিখুন!', 'Please describe product defect!'));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/stock-defective-warranty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defectiveStockForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✅ ${data.message || txt('নতুন নষ্ট পণ্য সফলভাবে ওয়ারেন্টিতে পাঠানো হয়েছে এবং স্টক থেকে ১টি মাইনাস হয়েছে!', 'Product sent to warranty and deducted from stock!')}\nক্লেইম নং: ${data.claim_no}`);
      setShowDefectiveStockModal(false);
      setDefectiveSlipImagePreview(null);
      setDefectiveStockForm({
        product_id: '',
        supplier_id: '',
        supplier_name: '',
        quantity: 1,
        serial_number: '',
        problem_description: '',
        supplier_slip_no: '',
        expected_return_date: (() => {
          const d = new Date();
          d.setDate(d.getDate() + 15);
          return d.toISOString().slice(0, 10);
        })(),
        warranty_slip_image: ''
      });
      fetchSupplierWarranties();
      if (typeof onStockUpdated === 'function') onStockUpdated();
    } catch (err) {
      alert(txt('ব্যর্থ হয়েছে: ', 'Failed: ') + err.message);
    }
  };

  // সাপ্লায়ার রিপ্লেস মোডাল ওপেন
  const handleOpenReplaceModal = (item) => {
    setSelectedWarrantyForReplace(item);
    setNewReplacementSerialInput('');
    setReplacementActionNote(txt('সাপ্লায়ার নষ্ট পণ্য পরিবর্তন করে নতুন দিয়েছে', 'Supplier replaced defective product with new item'));
    setShowReplaceSerialModal(true);
  };

  // সাপ্লায়ার হতে পরিবর্তিত পণ্য গ্রহণ ও স্টকে নতুন সিরিয়াল দিয়ে অ্যাড
  const handleConfirmSupplierReplace = async (e) => {
    if (e) e.preventDefault();
    if (!selectedWarrantyForReplace) return;

    try {
      const res = await fetch(`${API_BASE}/supplier-warranty-replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_warranty_id: selectedWarrantyForReplace.id,
          new_serial_number: newReplacementSerialInput.trim(),
          action_taken: replacementActionNote.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`✅ ${data.message || txt('সাপ্লায়ার থেকে পরিবর্তিত পণ্য সফলভাবে নতুন সিরিয়ালসহ স্টকে যুক্ত হয়েছে!', 'Replaced product successfully added to stock with new serial!')}`);
      setShowReplaceSerialModal(false);
      setSelectedWarrantyForReplace(null);
      setNewReplacementSerialInput('');
      fetchSupplierWarranties();
      if (typeof onStockUpdated === 'function') onStockUpdated();
    } catch (err) {
      alert(txt('সংরক্ষণে ব্যর্থ: ', 'Save failed: ') + err.message);
    }
  };

  // ফিল্টারকৃত কাস্টমার লিস্ট
  const filteredCustomerList = warrantyList.filter(item => {
    const matchesSearch = 
      (item.customer_name && item.customer_name.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (item.customer_mobile && item.customer_mobile.includes(customerSearch)) ||
      (item.token_no && item.token_no.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (item.product_name && item.product_name.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (item.device_category && item.device_category.toLowerCase().includes(customerSearch.toLowerCase())) ||
      (item.serial_no && item.serial_no.toLowerCase().includes(customerSearch.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ফিল্টারকৃত সাপ্লায়ার লিস্ট
  const filteredSupplierList = supplierWarrantyList.filter(item => {
    const matchesSearch = 
      (item.supplier_name && item.supplier_name.toLowerCase().includes(supplierSearch.toLowerCase())) ||
      (item.product_name && item.product_name.toLowerCase().includes(supplierSearch.toLowerCase())) ||
      (item.serial_number && item.serial_number.toLowerCase().includes(supplierSearch.toLowerCase())) ||
      (item.claim_no && item.claim_no.toLowerCase().includes(supplierSearch.toLowerCase())) ||
      (item.supplier_slip_no && item.supplier_slip_no.toLowerCase().includes(supplierSearch.toLowerCase()));

    const matchesStatus = supplierStatusFilter === 'All' || item.status === supplierStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ডেলিভারি সম্পন্ন':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'সার্ভিসিং সম্পন্ন':
      case 'সম্পন্ন':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'প্রক্রিয়াধীন':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'সাপ্লায়ারের নিকট প্রেরিত':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'সাপ্লায়ার থেকে ফেরত এসেছে':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'নতুন পণ্য ওয়ারেন্টি পেন্ডিং':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-black';
      case 'সাপ্লায়ার পণ্য পরিবর্তন করেছে':
      case 'পরিবর্তন সম্পন্ন':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black';
      case 'ফেরত প্রদানকৃত':
      case 'বাতিল':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* শীর্ষ সাব-ট্যাব ন্যাভিগেশন */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubTab('customer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-2 ${
              activeSubTab === 'customer'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Wrench size={15} />
            {lang === 'en' ? 'Customer Warranty & Servicing' : 'কাস্টমার ওয়ারেন্টি ও সার্ভিসিং স্লিপ'}
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px]">
              {warrantyList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('supplier')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-2 ${
              activeSubTab === 'supplier'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Truck size={15} />
            {lang === 'en' ? 'Supplier Warranty Tracking' : 'সাপ্লায়ার ওয়ারেন্টি ট্র্যাকিং ও স্লিপ'}
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px]">
              {supplierWarrantyList.length}
            </span>
          </button>
        </div>

        <div>
          {activeSubTab === 'customer' ? (
            <button
              onClick={() => {
                resetCustomerForm();
                setShowCustomerModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Plus size={15} /> {lang === 'en' ? '+ New Customer Intake Slip' : '+ নতুন সার্ভিসিং/ওয়ারেন্টি স্লিপ গ্রহণ'}
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowDefectiveStockModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20 transition"
                title={txt("নতুন পণ্য নষ্ট পড়লে বিক্রয় না করে ওয়ারেন্টিতে পাঠান (স্টক থেকে মাইনাস হবে)", "Send new defective product to warranty (deducts from stock)")}
              >
                <PackageMinus size={15} /> {lang === 'en' ? '+ Defective Stock to Warranty' : '+ নতুন নষ্ট পণ্য ওয়ারেন্টিতে পাঠান'}
              </button>
              <button
                onClick={() => setShowSupplierModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20"
              >
                <Plus size={15} /> {lang === 'en' ? '+ New Supplier Claim Entry' : '+ সাধারণ ক্লেইম এন্ট্রি'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= ১. কাস্টমার ওয়ারেন্টি ও সার্ভিসিং টেবিল ================= */}
      {activeSubTab === 'customer' && (
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-amber-100 space-y-4">
          {/* সার্চ ও ফিল্টার কন্ট্রোল বার */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={t('wsSearchPlaceholder')}
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                <Filter size={13} /> {lang === 'en' ? 'Status Filter:' : 'স্ট্যাটাস ফিল্টার:'}
              </span>
              {[
                { val: 'All', labelBn: 'সকল', labelEn: 'All' },
                { val: 'গ্রহণকৃত', labelBn: 'গ্রহণকৃত', labelEn: 'Received' },
                { val: 'প্রক্রিয়াধীন', labelBn: 'প্রক্রিয়াধীন', labelEn: 'In Progress' },
                { val: 'সার্ভিসিং সম্পন্ন', labelBn: 'সার্ভিসিং সম্পন্ন', labelEn: 'Ready for Delivery' },
                { val: 'ডেলিভারি সম্পন্ন', labelBn: 'ডেলিভারি সম্পন্ন', labelEn: 'Delivered' }
              ].map(st => (
                <button
                  key={st.val}
                  onClick={() => setStatusFilter(st.val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                    statusFilter === st.val
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'en' ? st.labelEn : st.labelBn}
                </button>
              ))}
            </div>
          </div>

          {/* টেবিল */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                  <th className="p-3 w-32">{t('wsColToken')}</th>
                  <th className="p-3">{t('wsColCustomer')}</th>
                  <th className="p-3">{t('wsColProduct')}</th>
                  <th className="p-3 max-w-xs">{t('wsColIssue')}</th>
                  <th className="p-3">{t('wsColAccessories')}</th>
                  <th className="p-3">{t('wsColDates')}</th>
                  <th className="p-3 text-center">{t('wsColStatus')}</th>
                  <th className="p-3 text-center w-36">{t('wsColAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomerList.map(item => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-3">
                      <span className="font-mono font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block text-[11px]">
                        {item.token_no}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {lang === 'en' ? 'By: ' : 'বাই: '}{item.received_by || 'Admin'}
                      </span>
                    </td>

                    <td className="p-3">
                      <p className="font-black text-slate-900">{item.customer_name}</p>
                      <p className="text-slate-600 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone size={11} className="text-blue-500" /> {item.customer_mobile}
                      </p>
                    </td>

                    <td className="p-3">
                      <p className="font-bold text-slate-800">{item.product_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.model_no && `Model: ${item.model_no} `}
                        {item.serial_no && `| S/N: ${item.serial_no}`}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {item.device_category && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                            {formatDeviceCategory(item.device_category, lang)}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-blue-600 uppercase">
                          [{item.service_type === 'ওয়ারেন্টি' || item.service_type === 'Warranty' ? (lang === 'en' ? 'Warranty' : 'ওয়ারেন্টি') : (lang === 'en' ? 'Paid Service' : (item.service_type || 'সার্ভিসিং'))}]
                        </span>
                      </div>
                    </td>

                    <td className="p-3 max-w-xs">
                      <p className="text-slate-700 line-clamp-2 leading-relaxed" title={item.problem_description}>
                        {item.problem_description}
                      </p>
                    </td>

                    <td className="p-3">
                      {item.has_accessories === 'হ্যাঁ' || item.has_accessories === 'Yes' || (item.accessories_received && item.accessories_received.trim() !== '') ? (
                        <span className="text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold block max-w-xs truncate" title={item.accessories_received}>
                          ✓ {item.accessories_received || (lang === 'en' ? 'Accessories present' : 'আনুষঙ্গিক সামগ্রী আছে')}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">{lang === 'en' ? 'None' : 'কোনো কিছু নেই'}</span>
                      )}
                    </td>

                    <td className="p-3 text-[11px]">
                      <p className="text-slate-600">{lang === 'en' ? 'Received: ' : 'গ্রহণ: '}<strong>{item.received_date}</strong></p>
                      <p className="text-rose-700 font-bold">{lang === 'en' ? 'Promised: ' : 'সম্ভাব্য: '}<strong>{item.estimated_delivery_date || '-'}</strong></p>
                      {item.delivery_date && (
                        <p className="text-emerald-700 font-bold mt-0.5">
                          {lang === 'en' ? 'Delivered: ' : 'ডেলিভারি: '}<strong>{item.delivery_date.slice(0, 10)}</strong>
                        </p>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getStatusBadge(item.status)}`}>
                        {formatStatus(item.status)}
                      </span>
                      {(item.status === 'ডেলিভারি সম্পন্ন' || item.status === 'সম্পন্ন') && (
                        <div className="mt-1">
                          {Number(item.due_amount || 0) > 0 || item.payment_status === 'বাকি' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200" title={`পরিশোধিত: ৳${item.paid_amount || 0}`}>
                              বাকি: ৳{Number(item.due_amount || 0).toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              নগদ: ৳{Number(item.paid_amount || item.final_cost || item.estimated_cost || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* স্লিপ ভিউ ও প্রিন্ট */}
                        <button
                          onClick={() => onOpenSlip && onOpenSlip(item)}
                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition"
                          title={lang === 'en' ? 'Print Slip' : 'স্লিপ প্রিন্ট করুন'}
                        >
                          <Printer size={13} />
                        </button>

                        {/* শেয়ার */}
                        <button
                          onClick={() => onShareSlip && onShareSlip(item)}
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition"
                          title={lang === 'en' ? 'Share Slip' : 'স্লিপ শেয়ার করুন'}
                        >
                          <Share2 size={13} />
                        </button>

                        {/* স্লিপের তথ্য এডিট */}
                        <button
                          onClick={() => handleOpenEditSlip(item)}
                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition"
                          title={lang === 'en' ? 'Edit Slip' : 'স্লিপ এডিট করুন'}
                        >
                          <Edit size={13} />
                        </button>

                        {/* স্ট্যাটাস আপডেট */}
                        <button
                          onClick={() => handleOpenStatusUpdateModal(item)}
                          className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer transition"
                          title={lang === 'en' ? 'Change Status' : 'স্ট্যাটাস পরিবর্তন'}
                        >
                          <Clock size={13} />
                        </button>

                        {/* বকেয়া টাকা আদায় বাটন */}
                        {(item.status === 'ডেলিভারি সম্পন্ন' || item.status === 'সম্পন্ন') && (Number(item.due_amount || 0) > 0 || item.payment_status === 'বাকি') && (
                          <button
                            onClick={() => handleOpenCollectDueModal(item)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition flex items-center gap-1 font-bold text-[10px] shadow-xs"
                            title={lang === 'en' ? 'Collect Servicing Due' : 'বকেয়া টাকা আদায় করুন'}
                          >
                            💰 আদায়
                          </button>
                        )}

                        {/* ডিলিট (Admin) */}
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteCustomerSlip(item.id, item.token_no)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer transition"
                            title={lang === 'en' ? 'Delete' : 'মুছে ফেলুন'}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCustomerList.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-slate-400">
                      {lang === 'en' ? 'No warranty or servicing intake slips found.' : 'কোনো ওয়ারেন্টি বা সার্ভিসিং স্লিপ রেকর্ড পাওয়া যায়নি।'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ২. সাপ্লায়ার ওয়ারেন্টি ট্র্যাকিং টেবিল ================= */}
      {activeSubTab === 'supplier' && (
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-purple-100 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={txt("সাপ্লায়ার, পণ্য, সিরিয়াল বা ক্লেইম নং...", "Supplier, product, serial or claim no...")}
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                <Filter size={13} /> {txt("ফিল্টার:", "Filter:")}
              </span>
              {[
                { val: 'All', labelBn: 'সকল', labelEn: 'All' },
                { val: 'নতুন পণ্য ওয়ারেন্টি পেন্ডিং', labelBn: 'নতুন নষ্ট পণ্য পেন্ডিং', labelEn: 'New Defective Pending' },
                { val: 'সাপ্লায়ারের নিকট প্রেরিত', labelBn: 'সাপ্লায়ারের নিকট প্রেরিত', labelEn: 'Sent to Supplier' },
                { val: 'সাপ্লায়ার পণ্য পরিবর্তন করেছে', labelBn: 'পণ্য পরিবর্তন সম্পন্ন', labelEn: 'Supplier Replaced' },
                { val: 'সাপ্লায়ার থেকে ফেরত এসেছে', labelBn: 'সাপ্লায়ার থেকে ফেরত এসেছে', labelEn: 'Returned from Supplier' },
                { val: 'রিপ্লেসমেন্ট প্রাপ্ত', labelBn: 'রিপ্লেসমেন্ট প্রাপ্ত', labelEn: 'Replacement Received' }
              ].map(st => (
                <button
                  key={st.val}
                  onClick={() => setSupplierStatusFilter(st.val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                    supplierStatusFilter === st.val
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'en' ? st.labelEn : st.labelBn}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                  <th className="p-3 w-32">{t('swColClaim')}</th>
                  <th className="p-3">{t('swColSupplier')}</th>
                  <th className="p-3">{t('swColProduct')}</th>
                  <th className="p-3 max-w-xs">{t('wsColIssue')}</th>
                  <th className="p-3">{t('swColSentDate')}</th>
                  <th className="p-3 text-center">{t('swColSlipImage')}</th>
                  <th className="p-3 text-center">{t('wsColStatus')}</th>
                  <th className="p-3 text-center">{txt('অ্যাকশন', 'Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSupplierList.map(item => (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition">
                    <td className="p-3">
                      <span className="font-mono font-black text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 block text-[11px]">
                        {item.claim_no}
                      </span>
                      {item.supplier_slip_no && (
                        <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
                          {txt('স্লিপ: #', 'Slip: #')}{item.supplier_slip_no}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <p className="font-black text-slate-900">{item.supplier_name}</p>
                    </td>

                    <td className="p-3">
                      <p className="font-bold text-slate-800">{item.product_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.model && `Model: ${item.model} `}
                        {item.serial_number && `| S/N: ${item.serial_number}`}
                      </p>
                    </td>

                    <td className="p-3 max-w-xs">
                      <p className="text-slate-700 line-clamp-2" title={item.problem_description}>
                        {item.problem_description}
                      </p>
                      {item.action_taken && (
                        <p className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1 inline-block font-medium">
                          {item.action_taken}
                        </p>
                      )}
                    </td>

                    <td className="p-3 text-[11px]">
                      <p className="text-slate-600">{txt('প্রেরণ: ', 'Sent: ')}<strong>{item.sent_date}</strong></p>
                      <p className="text-purple-700 font-bold">{txt('প্রত্যাশিত: ', 'Expected: ')}<strong>{item.expected_return_date || '-'}</strong></p>
                    </td>

                    <td className="p-3 text-center">
                      {item.warranty_slip_image ? (
                        <button
                          onClick={() => onViewImage && onViewImage(item.warranty_slip_image, `${item.supplier_name} - ${txt('ওয়ারেন্টি স্লিপ', 'Warranty Slip')} (${item.claim_no})`)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <ImageIcon size={13} /> {t('swViewSlipBtn')}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">{txt('ছবি নেই', 'No image')}</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getStatusBadge(item.status)}`}>
                        {formatStatus(item.status)}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      {(item.status === 'নতুন পণ্য ওয়ারেন্টি পেন্ডিং' || item.status === 'সাপ্লায়ারের নিকট প্রেরিত') ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReplaceModal(item)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition shadow-xs"
                          title={txt("সাপ্লায়ার পণ্য পরিবর্তন করে দিলে নতুন সিরিয়াল দিয়ে স্টকে অ্যাড করুন", "Receive replaced product from supplier and add to stock with new serial")}
                        >
                          <RefreshCw size={12} /> {txt("পণ্য পরিবর্তন ও সিরিয়াল যোগ", "Replace & Add Serial")}
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={12} /> {txt("পরিবর্তিত / সম্পন্ন", "Replaced / Done")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredSupplierList.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      {txt('কোনো সাপ্লায়ার ওয়ারেন্টি রেকর্ড পাওয়া যায়নি।', 'No supplier warranty records found.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ৩. কাস্টমার ওয়ারেন্টি ও সার্ভিসিং ইনটেক ফর্ম মডাল ================= */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wrench size={18} />
                <h3 className="font-bold text-sm">
                  {editingSlip 
                    ? (lang === 'en' ? `Edit Warranty & Servicing Slip (#${editingSlip.token_no})` : `ওয়ারেন্টি ও সার্ভিসিং স্লিপ এডিট করুন (#${editingSlip.token_no})`)
                    : txt('ওয়ারেন্টি ও সার্ভিসিং এর জন্য পণ্য গ্রহণ এন্ট্রি', 'Customer Product Intake for Warranty & Servicing')}
                </h3>
              </div>
              <button 
                onClick={() => {
                  resetCustomerForm();
                  setShowCustomerModal(false);
                }} 
                className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCustomerSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* কাস্টমার নাম */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('কাস্টমারের নাম *', 'Customer Name *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={txt('কাস্টমারের পূর্ণ নাম...', 'Customer full name...')}
                    value={customerForm.customer_name}
                    onChange={e => setCustomerForm({ ...customerForm, customer_name: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>

                {/* মোবাইল নাম্বার */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('মোবাইল নম্বর *', 'Mobile Number *')}</label>
                  <input
                    type="text"
                    required
                    placeholder="01XXXXXXXXX"
                    value={customerForm.customer_mobile}
                    onChange={e => setCustomerForm({ ...customerForm, customer_mobile: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* কাস্টমার ঠিকানা */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">{txt('কাস্টমারের ঠিকানা (ঐচ্ছিক)', 'Customer Address (Optional)')}</label>
                <input
                  type="text"
                  placeholder={txt('ঠিকানা...', 'Address...')}
                  value={customerForm.customer_address}
                  onChange={e => setCustomerForm({ ...customerForm, customer_address: e.target.value })}
                  className="w-full border p-2 rounded-xl outline-none focus:border-amber-500"
                />
              </div>

              {/* ডিভাইস / সার্ভিস ক্যাটাগরি */}
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                <label className="font-bold text-amber-950 block mb-1.5 flex items-center justify-between">
                  <span>{txt('ডিভাইস / সার্ভিস ক্যাটাগরি *', 'Device / Service Category *')}</span>
                  <span className="text-[10px] text-amber-800 font-semibold">{txt('ক্যাটাগরি নির্বাচন করুন', 'Select Category')}</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {DEVICE_CATEGORIES.map(cat => {
                    const label = lang === 'en' ? cat.en : cat.bn;
                    const isSelected = formatDeviceCategory(customerForm.device_category, 'bn') === cat.bn;
                    return (
                      <button
                        key={cat.bn}
                        type="button"
                        onClick={() => setCustomerForm(prev => ({ ...prev, device_category: label }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white hover:bg-amber-100 text-slate-700 border border-amber-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <select
                  value={formatDeviceCategory(customerForm.device_category, lang) || (lang === 'en' ? 'General Service' : 'সাধারণ সার্ভিস')}
                  onChange={e => setCustomerForm({ ...customerForm, device_category: e.target.value })}
                  className="w-full border p-2 rounded-xl bg-white outline-none focus:border-amber-500 font-bold text-slate-800"
                >
                  {DEVICE_CATEGORIES.map(cat => {
                    const label = lang === 'en' ? cat.en : cat.bn;
                    return (
                      <option key={cat.bn} value={label}>{label}</option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* পণ্যের নাম */}
                <div className="md:col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">{txt('পণ্যের নাম *', 'Product Name *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={txt('ল্যাপটপ, সিসি ক্যামেরা, ইত্যাদি', 'Laptop, CCTV Camera, etc.')}
                    value={customerForm.product_name}
                    onChange={e => setCustomerForm({ ...customerForm, product_name: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>

                {/* মডেল */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('মডেল নম্বর', 'Model Number')}</label>
                  <input
                    type="text"
                    placeholder={txt('মডেল (Model No)', 'Model No')}
                    value={customerForm.model_no}
                    onChange={e => setCustomerForm({ ...customerForm, model_no: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>

                {/* সিরিয়াল / বারকোড */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('সিরিয়াল নম্বর / বারকোড', 'Serial Number / Barcode')}</label>
                  <input
                    type="text"
                    placeholder="Serial Number / S/N"
                    value={customerForm.serial_no}
                    onChange={e => setCustomerForm({ ...customerForm, serial_no: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* সমস্যা */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">{txt('সমস্যা / ত্রুটির বিস্তারিত বিবরণ *', 'Problem / Defect Description *')}</label>
                <textarea
                  required
                  rows="2"
                  placeholder={txt('পণ্যটিতে কী কী সমস্যা দেখা যাচ্ছে বিস্তারিত লিখুন...', 'Describe the issues with the product...')}
                  value={customerForm.problem_description}
                  onChange={e => setCustomerForm({ ...customerForm, problem_description: e.target.value })}
                  className="w-full border p-2 rounded-xl outline-none focus:border-amber-500"
                />
              </div>

              {/* পন্যের সাথে আনুষঙ্গিক কিছু গ্রহণ করা হয়েছে কিনা */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950">
                    {txt('পন্যের সাথে আনুষঙ্গিক কিছু গ্রহণ করা হয়েছে কিনা?', 'Any accessories received with the product?')}
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="has_accessories"
                        value="না"
                        checked={customerForm.has_accessories === 'না' || customerForm.has_accessories === 'No'}
                        onChange={() => setCustomerForm({ ...customerForm, has_accessories: 'না', accessories_received: '' })}
                      />
                      {txt('না', 'No')}
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer font-bold text-blue-700">
                      <input
                        type="radio"
                        name="has_accessories"
                        value="হ্যাঁ"
                        checked={customerForm.has_accessories === 'হ্যাঁ' || customerForm.has_accessories === 'Yes'}
                        onChange={() => setCustomerForm({ ...customerForm, has_accessories: 'হ্যাঁ' })}
                      />
                      {txt('হ্যাঁ', 'Yes')}
                    </label>
                  </div>
                </div>

                {(customerForm.has_accessories === 'হ্যাঁ' || customerForm.has_accessories === 'Yes') && (
                  <input
                    type="text"
                    placeholder={txt('গ্রহণকৃত আনুষঙ্গিক জিনিসের বিবরণ দিন (যেমন: অ্যাডাপ্টার, পাওয়ার কর্ড, ব্যাগ ইত্যাদি)', 'Describe accessories received (e.g. Adapter, Power cord, Bag, etc.)')}
                    value={customerForm.accessories_received}
                    onChange={e => setCustomerForm({ ...customerForm, accessories_received: e.target.value })}
                    className="w-full border border-amber-300 p-2 rounded-xl bg-white outline-none focus:border-amber-600 text-xs"
                  />
                )}
              </div>

              {/* তারিখ ও গ্রহণকারী ব্যক্তি */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('গ্রহণের তারিখ', 'Received Date')}</label>
                  <input
                    type="date"
                    value={customerForm.received_date}
                    onChange={e => setCustomerForm({ ...customerForm, received_date: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-rose-700 block mb-1">{txt('সম্ভাব্য প্রদানের তারিখ', 'Estimated Delivery Date')}</label>
                  <input
                    type="date"
                    value={customerForm.estimated_delivery_date}
                    onChange={e => setCustomerForm({ ...customerForm, estimated_delivery_date: e.target.value })}
                    className="w-full border border-rose-300 p-2 rounded-xl outline-none focus:border-rose-500 font-semibold text-rose-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('গ্রহণকারী ব্যক্তি', 'Received By')}</label>
                  <input
                    type="text"
                    value={customerForm.received_by}
                    onChange={e => setCustomerForm({ ...customerForm, received_by: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              {/* সার্ভিস টাইপ ও সম্ভাব্য খরচ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('সেবার ধরণ', 'Service Type')}</label>
                  <select
                    value={customerForm.service_type}
                    onChange={e => setCustomerForm({ ...customerForm, service_type: e.target.value })}
                    className="w-full border p-2 rounded-xl bg-white outline-none focus:border-amber-500"
                  >
                    <option value="ওয়ারেন্টি">{txt('ওয়ারেন্টি (Warranty Claim)', 'Warranty Claim')}</option>
                    <option value="পেইড সার্ভিসিং">{txt('পেইড সার্ভিসিং (Paid Service)', 'Paid Service')}</option>
                    <option value="চেকআপ ও টেস্ট">{txt('প্রাথমিক টেস্ট ও চেকআপ', 'Primary Test & Checkup')}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('সম্ভাব্য চার্জ (৳)', 'Estimated Charge (৳)')}</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={customerForm.estimated_cost}
                    onChange={e => setCustomerForm({ ...customerForm, estimated_cost: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('অগ্রিম জমা (৳)', 'Advance Paid (৳)')}</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={customerForm.advance_paid}
                    onChange={e => setCustomerForm({ ...customerForm, advance_paid: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* এডিট মোডে স্ট্যাটাস ও ডেলিভারি বিবরণ */}
              {editingSlip && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-amber-900 block mb-1">{txt('বর্তমান স্ট্যাটাস', 'Current Status')}</label>
                      <select
                        value={customerForm.status}
                        onChange={e => {
                          const newStatus = e.target.value;
                          setCustomerForm(prev => ({
                            ...prev,
                            status: newStatus,
                            delivery_date: newStatus === 'ডেলিভারি সম্পন্ন' && !prev.delivery_date
                              ? new Date().toISOString().slice(0, 10)
                              : prev.delivery_date,
                            final_cost: newStatus === 'ডেলিভারি সম্পন্ন' && !prev.final_cost
                              ? prev.estimated_cost || ''
                              : prev.final_cost
                          }));
                        }}
                        className="w-full border p-2 rounded-xl bg-white outline-none focus:border-amber-500 font-bold"
                      >
                        <option value="গ্রহণকৃত">{txt('গ্রহণকৃত', 'Received')}</option>
                        <option value="প্রক্রিয়াধীন">{txt('প্রক্রিয়াধীন', 'In Progress')}</option>
                        <option value="সার্ভিসিং সম্পন্ন">{txt('সার্ভিসিং সম্পন্ন', 'Ready for Delivery')}</option>
                        <option value="ডেলিভারি সম্পন্ন">{txt('ডেলিভারি সম্পন্ন', 'Delivered')}</option>
                        <option value="ফেরত প্রদানকৃত">{txt('ফেরত প্রদানকৃত', 'Returned')}</option>
                        <option value="বাতিল">{txt('বাতিল', 'Cancelled')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">{txt('ডেলিভারি তারিখ', 'Delivery Date')}</label>
                      <input
                        type="date"
                        value={customerForm.delivery_date || ''}
                        onChange={e => setCustomerForm({ ...customerForm, delivery_date: e.target.value })}
                        className="w-full border p-2 rounded-xl bg-white outline-none focus:border-amber-500 font-bold"
                      />
                    </div>
                  </div>

                  {/* ডেলিভারি সম্পন্ন হলে বিল ও পেমেন্ট বিবরণ */}
                  {(customerForm.status === 'ডেলিভারি সম্পন্ন' || customerForm.status === 'সম্পন্ন') && (
                    <div className="p-3 bg-white border border-amber-300 rounded-xl space-y-2.5">
                      <span className="font-bold text-amber-900 text-xs block border-b border-amber-100 pb-1">
                        {txt('ডেলিভারি বিল ও পেমেন্ট তথ্য', 'Delivery Bill & Payment Information')}
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">{txt('চূড়ান্ত বিল / সার্ভিস চার্জ (৳)', 'Final Bill / Service Cost (৳)')}</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={customerForm.final_cost}
                            onChange={e => {
                              const val = e.target.value;
                              const cost = Number(val || 0);
                              if (customerForm.payment_status === 'নগদ') {
                                setCustomerForm({ ...customerForm, final_cost: val, paid_amount: cost, due_amount: 0 });
                              } else {
                                const paid = Number(customerForm.paid_amount || 0);
                                setCustomerForm({ ...customerForm, final_cost: val, due_amount: Math.max(0, cost - paid) });
                              }
                            }}
                            className="w-full border p-2 rounded-xl bg-white outline-none focus:border-amber-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">{txt('টাকা বাকি না নগদ?', 'Payment Status (Cash or Due)?')}</label>
                          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const cost = Number(customerForm.final_cost || customerForm.estimated_cost || 0);
                                setCustomerForm({
                                  ...customerForm,
                                  payment_status: 'নগদ',
                                  paid_amount: cost,
                                  due_amount: 0
                                });
                              }}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                customerForm.payment_status === 'নগদ'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {txt('🟢 নগদ', 'Cash')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const cost = Number(customerForm.final_cost || customerForm.estimated_cost || 0);
                                const currentPaid = Number(customerForm.advance_paid || 0);
                                setCustomerForm({
                                  ...customerForm,
                                  payment_status: 'বাকি',
                                  paid_amount: currentPaid,
                                  due_amount: Math.max(0, cost - currentPaid)
                                });
                              }}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                                customerForm.payment_status === 'বাকি'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {txt('🔴 বাকি', 'Due')}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">{txt('পরিশোধিত টাকা (৳)', 'Paid Amount (৳)')}</label>
                          <input
                            type="number"
                            min="0"
                            disabled={customerForm.payment_status === 'নগদ'}
                            value={customerForm.paid_amount}
                            onChange={e => {
                              const paid = Number(e.target.value || 0);
                              const cost = Number(customerForm.final_cost || 0);
                              setCustomerForm({
                                ...customerForm,
                                paid_amount: e.target.value,
                                due_amount: Math.max(0, cost - paid)
                              });
                            }}
                            className={`w-full border p-2 rounded-xl outline-none font-bold ${
                              customerForm.payment_status === 'নগদ' ? 'bg-slate-100' : 'bg-white focus:border-amber-500 text-emerald-800'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="font-bold text-rose-700 block mb-1">{txt('বকেয়া টাকা (৳)', 'Due Amount (৳)')}</label>
                          <input
                            type="number"
                            readOnly
                            value={customerForm.due_amount}
                            className="w-full border border-rose-200 bg-rose-50/60 p-2 rounded-xl text-rose-700 font-bold outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">{txt('পেমেন্ট মাধ্যম', 'Payment Method')}</label>
                          <select
                            value={customerForm.payment_method || 'Cash'}
                            onChange={e => setCustomerForm({ ...customerForm, payment_method: e.target.value })}
                            className="w-full border p-2 rounded-xl bg-white outline-none focus:border-amber-500 font-semibold"
                          >
                            <option value="Cash">{txt('নগদ ক্যাশ (Cash)', 'Cash')}</option>
                            <option value="bKash">{txt('বিকাশ (bKash)', 'bKash')}</option>
                            <option value="Nagad">{txt('নগদ (Nagad)', 'Nagad')}</option>
                            <option value="Rocket">{txt('রকেট (Rocket)', 'Rocket')}</option>
                            <option value="Bank">{txt('ব্যাংক ট্রান্সফার (Bank Transfer)', 'Bank')}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">{txt('ডেলিভারি / সার্ভিস নোট', 'Delivery / Service Note')}</label>
                    <input
                      type="text"
                      placeholder={txt('ডেলিভারি সংক্রান্ত মন্তব্য...', 'Delivery note...')}
                      value={customerForm.delivery_note || ''}
                      onChange={e => setCustomerForm({ ...customerForm, delivery_note: e.target.value })}
                      className="w-full border p-2 rounded-xl bg-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetCustomerForm();
                    setShowCustomerModal(false);
                  }}
                  className="px-4 py-2 border rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold cursor-pointer shadow-md transition"
                >
                  {editingSlip 
                    ? (lang === 'en' ? 'Save Slip Changes' : 'স্লিপ আপডেট সংরক্ষণ করুন') 
                    : txt('সংরক্ষণ করুন ও স্লিপ তৈরি করুন', 'Save & Generate Slip')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ৪. স্ট্যাটাস আপডেট মডাল ================= */}
      {statusUpdateItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-amber-600 p-3.5 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {txt('স্ট্যাটাস আপডেট', 'Status Update')} - #{statusUpdateItem.token_no}
              </h3>
              <button onClick={() => setStatusUpdateItem(null)} className="p-1 hover:bg-white/20 rounded cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleStatusUpdate} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{txt('বর্তমান অবস্থা নির্বাচন করুন', 'Select Current Status')}</label>
                <select
                  value={statusUpdateForm.status}
                  onChange={e => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
                  className="w-full border p-2 rounded-xl bg-white outline-none focus:border-amber-500 font-bold"
                >
                  <option value="গ্রহণকৃত">{txt('গ্রহণকৃত (Received)', 'Received')}</option>
                  <option value="প্রক্রিয়াধীন">{txt('প্রক্রিয়াধীন (In Progress)', 'In Progress')}</option>
                  <option value="সার্ভিসিং সম্পন্ন">{txt('সার্ভিসিং সম্পন্ন (Ready for Delivery)', 'Ready for Delivery')}</option>
                  <option value="ডেলিভারি সম্পন্ন">{txt('ডেলিভারি সম্পন্ন (Delivered)', 'Delivered')}</option>
                  <option value="ফেরত প্রদানকৃত">{txt('ফেরত প্রদানকৃত (Returned without repair)', 'Returned without repair')}</option>
                </select>
              </div>

              {statusUpdateForm.status === 'ডেলিভারি সম্পন্ন' && (
                <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-950 font-bold border-b border-amber-200 pb-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>{txt('পণ্য ডেলিভারি ও বিল/পেমেন্ট হিসাব', 'Product Delivery & Payment Settlement')}</span>
                  </div>

                  {/* ডেলিভারির তারিখ */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {txt('ডেলিভারির তারিখ *', 'Delivery Date *')}
                    </label>
                    <input
                      type="date"
                      required
                      value={statusUpdateForm.delivery_date}
                      onChange={e => setStatusUpdateForm({ ...statusUpdateForm, delivery_date: e.target.value })}
                      className="w-full border border-amber-300 p-2 rounded-xl bg-white outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  {/* মোট চার্জ / সার্ভিসিং বিল */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {txt('মোট সার্ভিস চার্জ / বিল (৳) *', 'Total Service Charge / Bill (৳) *')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={statusUpdateForm.final_cost}
                      onChange={e => {
                        const val = e.target.value;
                        const costNum = Number(val || 0);
                        if (statusUpdateForm.payment_status === 'নগদ') {
                          setStatusUpdateForm({
                            ...statusUpdateForm,
                            final_cost: val,
                            paid_amount: costNum,
                            due_amount: 0
                          });
                        } else {
                          const paid = Number(statusUpdateForm.paid_amount || 0);
                          setStatusUpdateForm({
                            ...statusUpdateForm,
                            final_cost: val,
                            due_amount: Math.max(0, costNum - paid)
                          });
                        }
                      }}
                      className="w-full border border-amber-300 p-2 rounded-xl bg-white outline-none focus:border-amber-500 font-black text-amber-900"
                    />
                  </div>

                  {/* পেমেন্টের ধরন: নগদ না বাকি */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">
                      {txt('টাকা বাকি না নগদ? *', 'Payment Status (Cash or Due)? *')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const cost = Number(statusUpdateForm.final_cost || 0);
                          setStatusUpdateForm({
                            ...statusUpdateForm,
                            payment_status: 'নগদ',
                            paid_amount: cost,
                            due_amount: 0
                          });
                        }}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
                          statusUpdateForm.payment_status === 'নগদ'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle size={14} /> {txt('🟢 নগদ পরিশোধ (Cash)', 'Cash Paid')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cost = Number(statusUpdateForm.final_cost || 0);
                          const currentPaid = Number(statusUpdateItem.advance_paid || 0);
                          setStatusUpdateForm({
                            ...statusUpdateForm,
                            payment_status: 'বাকি',
                            paid_amount: currentPaid,
                            due_amount: Math.max(0, cost - currentPaid)
                          });
                        }}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
                          statusUpdateForm.payment_status === 'বাকি'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-rose-50'
                        }`}
                      >
                        <AlertCircle size={14} /> {txt('🔴 টাকা বাকি (Due)', 'Due Payment')}
                      </button>
                    </div>
                  </div>

                  {/* পেইড ও বকেয়া হিসাব */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {txt('আদায়কৃত টাকা (৳)', 'Paid Amount (৳)')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={statusUpdateForm.paid_amount}
                        disabled={statusUpdateForm.payment_status === 'নগদ'}
                        onChange={e => {
                          const paid = Number(e.target.value || 0);
                          const cost = Number(statusUpdateForm.final_cost || 0);
                          setStatusUpdateForm({
                            ...statusUpdateForm,
                            paid_amount: e.target.value,
                            due_amount: Math.max(0, cost - paid)
                          });
                        }}
                        className={`w-full border p-2 rounded-xl outline-none font-bold ${
                          statusUpdateForm.payment_status === 'নগদ' ? 'bg-slate-100 text-slate-700' : 'bg-white border-amber-300 focus:border-amber-500 text-emerald-800'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="font-bold text-rose-700 block mb-1">
                        {txt('বকেয়া টাকা (৳)', 'Due Amount (৳)')}
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={statusUpdateForm.due_amount}
                        className="w-full border border-rose-200 bg-rose-50/60 p-2 rounded-xl text-rose-700 font-black outline-none"
                      />
                    </div>
                  </div>

                  {/* পেমেন্ট মাধ্যম */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {txt('টাকা আদায়ের মাধ্যম', 'Payment Method')}
                    </label>
                    <select
                      value={statusUpdateForm.payment_method}
                      onChange={e => setStatusUpdateForm({ ...statusUpdateForm, payment_method: e.target.value })}
                      className="w-full border p-2 rounded-xl bg-white outline-none focus:border-amber-500 font-semibold"
                    >
                      <option value="Cash">{txt('নগদ ক্যাশ (Cash)', 'Cash')}</option>
                      <option value="bKash">{txt('বিকাশ (bKash)', 'bKash')}</option>
                      <option value="Nagad">{txt('নগদ (Nagad)', 'Nagad')}</option>
                      <option value="Rocket">{txt('রকেট (Rocket)', 'Rocket')}</option>
                      <option value="Bank">{txt('ব্যাংক ট্রান্সফার (Bank Transfer)', 'Bank')}</option>
                    </select>
                  </div>

                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                    <span>💡 নগদ আদায়কৃত অর্থ ডেলিভারির তারিখে ক্যাশ ড্রয়ার ও দৈনিক লাভ-ক্ষতিতে সমন্বয় হয়ে যাবে।</span>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">{txt('ডেলিভারি / সার্ভিসিং নোট', 'Delivery / Service Note')}</label>
                <textarea
                  rows="2"
                  placeholder={txt('কী কাজ করা হয়েছে বা ডেলিভারি নোট...', 'Work done or delivery note...')}
                  value={statusUpdateForm.delivery_note}
                  onChange={e => setStatusUpdateForm({ ...statusUpdateForm, delivery_note: e.target.value })}
                  className="w-full border p-2 rounded-xl outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusUpdateItem(null)}
                  className="px-3.5 py-1.5 border rounded-lg font-bold"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 text-white rounded-lg font-bold cursor-pointer"
                >
                  {txt('আপডেট করুন', 'Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ৪.১. সার্ভিসিং বকেয়া টাকা আদায় মডাল ================= */}
      {collectDueItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wrench size={18} />
                <h3 className="font-bold text-sm">
                  {txt('সার্ভিসিং বকেয়া টাকা আদায়', 'Collect Servicing Due')} - #{collectDueItem.token_no}
                </h3>
              </div>
              <button onClick={() => setCollectDueItem(null)} className="p-1 hover:bg-white/20 rounded cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCollectDueSubmit} className="p-4 space-y-3.5 text-xs">
              {/* কাস্টমার ও পণ্য সংক্ষিপ্ত তথ্য */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="font-bold text-slate-800">
                  {txt('গ্রাহক:', 'Customer:')} <span className="text-slate-900 font-black">{collectDueItem.customer_name}</span> ({collectDueItem.customer_mobile})
                </p>
                <p className="text-slate-600">
                  {txt('পণ্য:', 'Product:')} <strong>{collectDueItem.product_name}</strong> {collectDueItem.device_category && `[${formatDeviceCategory(collectDueItem.device_category, lang)}]`}
                </p>
                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-200 text-center font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">{txt('মোট বিল', 'Total Bill')}</span>
                    <span className="font-bold text-slate-800">৳{collectDueItem.final_cost || collectDueItem.estimated_cost || 0}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px]">{txt('পূর্বে আদায়', 'Previously Paid')}</span>
                    <span className="font-bold text-emerald-700">৳{collectDueItem.paid_amount || 0}</span>
                  </div>
                  <div>
                    <span className="text-rose-700 block text-[10px]">{txt('বর্তমান বকেয়া', 'Current Due')}</span>
                    <span className="font-black text-rose-700">৳{collectDueItem.due_amount || 0}</span>
                  </div>
                </div>
              </div>

              {/* কালেকশন তারিখ */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {txt('টাকা আদায়ের তারিখ *', 'Collection Date *')}
                </label>
                <input
                  type="date"
                  required
                  value={collectDueForm.collection_date}
                  onChange={e => setCollectDueForm({ ...collectDueForm, collection_date: e.target.value })}
                  className="w-full border p-2 rounded-xl outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              {/* আদায়কৃত টাকা */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {txt('আদায়কৃত টাকার পরিমাণ (৳) *', 'Amount Collected (৳) *')}
                </label>
                <input
                  type="number"
                  min="1"
                  max={collectDueItem.due_amount || undefined}
                  required
                  value={collectDueForm.amount}
                  onChange={e => setCollectDueForm({ ...collectDueForm, amount: e.target.value })}
                  className="w-full border border-emerald-300 p-2 rounded-xl bg-white outline-none focus:border-emerald-500 font-black text-emerald-800 text-sm"
                />
              </div>

              {/* পেমেন্ট মাধ্যম */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {txt('পেমেন্ট মাধ্যম', 'Payment Method')}
                </label>
                <select
                  value={collectDueForm.payment_method}
                  onChange={e => setCollectDueForm({ ...collectDueForm, payment_method: e.target.value })}
                  className="w-full border p-2 rounded-xl bg-white outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Cash">{txt('নগদ ক্যাশ (Cash)', 'Cash')}</option>
                  <option value="bKash">{txt('বিকাশ (bKash)', 'bKash')}</option>
                  <option value="Nagad">{txt('নগদ (Nagad)', 'Nagad')}</option>
                  <option value="Rocket">{txt('রকেট (Rocket)', 'Rocket')}</option>
                  <option value="Bank">{txt('ব্যাংক ট্রান্সফার (Bank Transfer)', 'Bank')}</option>
                </select>
              </div>

              {/* নোট */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {txt('মন্তব্য / নোট (ঐচ্ছিক)', 'Note (Optional)')}
                </label>
                <input
                  type="text"
                  placeholder={txt('বকেয়া আদায় সংক্রান্ত নোট...', 'Note...')}
                  value={collectDueForm.note}
                  onChange={e => setCollectDueForm({ ...collectDueForm, note: e.target.value })}
                  className="w-full border p-2 rounded-xl bg-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                <span>💡 উক্ত তারিখে ক্যাশ ড্রয়ার ও দৈনিক লাভ-ক্ষতিতে এই টাকা সরাসরি সমন্বয় হয়ে যাবে।</span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setCollectDueItem(null)}
                  className="px-3.5 py-1.5 border rounded-lg font-bold"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition shadow-xs"
                >
                  {txt('টাকা আদায় নিশ্চিত করুন', 'Confirm Collection')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ৫. নতুন সাপ্লায়ার ওয়ারেন্টি এন্ট্রি ও স্লিপ ইমেজ মডাল ================= */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck size={18} />
                <h3 className="font-bold text-sm">
                  {txt('সাপ্লায়ারদের নিকট ওয়ারেন্টি পণ্য প্রেরণ ও স্লিপ এন্ট্রি', 'Supplier Warranty Service & Claim Slip')}
                </h3>
              </div>
              <button onClick={() => setShowSupplierModal(false)} className="p-1 hover:bg-white/20 rounded cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* সাপ্লায়ার নির্বাচন */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('সাপ্লায়ার নির্বাচন বা নাম *', 'Select Supplier *')}</label>
                  <select
                    value={supplierForm.supplier_name}
                    onChange={e => {
                      const selected = suppliers.find(s => s.name === e.target.value);
                      setSupplierForm({
                        ...supplierForm,
                        supplier_name: e.target.value,
                        supplier_id: selected ? selected.id : ''
                      });
                    }}
                    className="w-full border p-2 rounded-xl bg-white outline-none focus:border-purple-500 font-semibold"
                  >
                    <option value="">{txt('সাপ্লায়ার নির্বাচন করুন...', 'Select Supplier...')}</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} {s.company ? `(${s.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* সাপ্লায়ারের নিজস্ব স্লিপ নম্বর */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('সাপ্লায়ার প্রদত্ত স্লিপ / ক্লেইম নম্বর', 'Supplier Slip / Claim Number')}</label>
                  <input
                    type="text"
                    placeholder={txt('সাপ্লায়ারের ভাউচার/স্লিপ নম্বর', 'Supplier voucher/slip no')}
                    value={supplierForm.supplier_slip_no}
                    onChange={e => setSupplierForm({ ...supplierForm, supplier_slip_no: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('পণ্যের নাম *', 'Product Name *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={txt('মাদারবোর্ড, রাউটার, ইত্যাদি', 'Motherboard, Router, etc.')}
                    value={supplierForm.product_name}
                    onChange={e => setSupplierForm({ ...supplierForm, product_name: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('ব্র্যান্ড / মডেল', 'Brand / Model')}</label>
                  <input
                    type="text"
                    placeholder={txt('ব্র্যান্ড ও মডেল', 'Brand & Model')}
                    value={supplierForm.model}
                    onChange={e => setSupplierForm({ ...supplierForm, model: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('সিরিয়াল নম্বর', 'Serial Number')}</label>
                  <input
                    type="text"
                    placeholder="Serial Number"
                    value={supplierForm.serial_number}
                    onChange={e => setSupplierForm({ ...supplierForm, serial_number: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{txt('সমস্যার বিবরণ *', 'Problem Description *')}</label>
                <textarea
                  required
                  rows="2"
                  placeholder={txt('সাপ্লায়ারকে জানানোর জন্য পণ্যের ত্রুটি বর্ণনা করুন...', 'Describe product defect for supplier...')}
                  value={supplierForm.problem_description}
                  onChange={e => setSupplierForm({ ...supplierForm, problem_description: e.target.value })}
                  className="w-full border p-2 rounded-xl outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('প্রেরণের তারিখ', 'Sent Date')}</label>
                  <input
                    type="date"
                    value={supplierForm.sent_date}
                    onChange={e => setSupplierForm({ ...supplierForm, sent_date: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-purple-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{txt('প্রত্যাশিত ফেরত পাওয়ার তারিখ', 'Expected Return Date')}</label>
                  <input
                    type="date"
                    value={supplierForm.expected_return_date}
                    onChange={e => setSupplierForm({ ...supplierForm, expected_return_date: e.target.value })}
                    className="w-full border p-2 rounded-xl outline-none focus:border-purple-500 font-semibold"
                  />
                </div>
              </div>

              {/* সাপ্লায়ার কর্তৃক প্রদত্ত ওয়ারেন্টি স্লিপ ইমেজ আপলোড */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <label className="font-bold text-purple-900 block flex items-center gap-1.5">
                  <Camera size={14} /> {txt('সাপ্লায়ার কর্তৃক প্রদত্ত ওয়ারেন্টি স্লিপ ইমেজ আপলোড', 'Upload Supplier Warranty Slip Image')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSupplierImageChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700 cursor-pointer"
                />
                {supplierSlipImagePreview && (
                  <div className="mt-2 flex items-center gap-3 bg-white p-2 rounded-lg border border-purple-200">
                    <img
                      src={supplierSlipImagePreview}
                      alt="Supplier Slip Preview"
                      className="h-16 w-20 object-contain rounded border border-slate-200"
                    />
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-purple-800">{txt('ওয়ারেন্টি স্লিপ ইমেজ সংযুক্ত হয়েছে', 'Warranty slip image attached')}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSupplierForm({ ...supplierForm, warranty_slip_image: '' });
                          setSupplierSlipImagePreview(null);
                        }}
                        className="text-[10px] text-red-600 font-bold hover:underline mt-0.5 cursor-pointer"
                      >
                        {txt('ছবি সরিয়ে ফেলুন', 'Remove Image')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-md transition"
                >
                  {txt('সাপ্লায়ার ওয়ারেন্টি সেভ করুন', 'Save Supplier Warranty')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ৪. নতুন নষ্ট পণ্য ওয়ারেন্টিতে প্রেরণ মডাল ================= */}
      {showDefectiveStockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-6 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PackageMinus size={18} />
                <h3 className="font-bold text-sm">
                  {txt('নতুন নষ্ট পণ্য সরাসরি ওয়ারেন্টিতে প্রেরণ (স্টক হতে মাইনাস)', 'Send Defective Stock to Warranty (Deduct Stock)')}
                </h3>
              </div>
              <button 
                onClick={() => { setShowDefectiveStockModal(false); setDefectiveSlipImagePreview(null); }} 
                className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDefectiveStockSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-xs">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={15} className="text-amber-600 shrink-0" />
                  {txt('স্টক ও লেজার সমন্বয় সংক্রান্ত তথ্য:', 'Stock & Ledger Deduction Notice:')}
                </p>
                <p className="text-[11px] mt-1 text-amber-800 leading-relaxed">
                  {txt(
                    'নতুন পণ্য নষ্ট/ডিফেক্টিভ পাওয়া গেলে তা বিক্রয় না করে সরাসরি ওয়ারেন্টিতে পাঠানোর জন্য এই অপশন। এটি সাবমিট করার সাথে সাথে পণ্যটির মজুদ (স্টক) থেকে ১টি মাইনাস হবে এবং নির্বাচিত সাপ্লায়ার লেজারে "নতুন পণ্য ওয়ারেন্টি পেন্ডিং" নামে নিবন্ধিত হবে।',
                    'Use this when a new unsold product is found defective. Saving will deduct 1 unit from stock and register in supplier ledger as "New Product Warranty Pending".'
                  )}
                </p>
              </div>

              {/* পণ্য নির্বাচন */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {txt('স্টক থেকে নষ্ট পণ্য নির্বাচন করুন *', 'Select Defective Product from Stock *')}
                </label>
                <select
                  required
                  value={defectiveStockForm.product_id}
                  onChange={e => handleSelectProductForDefectiveStock(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-red-500 font-medium"
                >
                  <option value="">{txt('পণ্য নির্বাচন করুন...', 'Select Product...')}</option>
                  {(localProducts || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.model ? `[${p.model}]` : ''} - (স্টক: {p.current_stock} টি)
                    </option>
                  ))}
                </select>
              </div>

              {/* সাপ্লায়ার / মহাজন */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {txt('সাপ্লায়ার / মহাজন *', 'Supplier *')}
                  </label>
                  <select
                    value={defectiveStockForm.supplier_id}
                    onChange={e => {
                      const sel = (suppliers || []).find(s => s.id === Number(e.target.value));
                      setDefectiveStockForm(prev => ({
                        ...prev,
                        supplier_id: e.target.value,
                        supplier_name: sel ? sel.name : prev.supplier_name
                      }));
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-red-500 font-medium"
                  >
                    <option value="">{txt('সাপ্লায়ার নির্বাচন করুন...', 'Select Supplier...')}</option>
                    {(suppliers || []).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.company || 'Shop'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {txt('সাপ্লায়ারের নাম (ম্যানুয়াল)', 'Supplier Name (Manual)')}
                  </label>
                  <input
                    type="text"
                    required
                    value={defectiveStockForm.supplier_name}
                    onChange={e => setDefectiveStockForm(prev => ({ ...prev, supplier_name: e.target.value }))}
                    placeholder={txt('সাপ্লায়ার বা প্রতিষ্ঠানের নাম', 'Supplier or firm name')}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* সিরিয়াল নম্বর (যদি পণ্যে সিরিয়াল থাকে) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {txt('নষ্ট পণ্যের সিরিয়াল নম্বর (Serial No)', 'Defective Product Serial Number')}
                </label>
                {(() => {
                  const selProd = (localProducts || []).find(p => p.id === Number(defectiveStockForm.product_id));
                  const serialsList = selProd?.available_serials ? selProd.available_serials.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];
                  if (serialsList.length > 0) {
                    return (
                      <div className="space-y-1.5">
                        <select
                          value={defectiveStockForm.serial_number}
                          onChange={e => setDefectiveStockForm(prev => ({ ...prev, serial_number: e.target.value }))}
                          className="w-full p-2.5 border border-amber-300 bg-amber-50/50 rounded-xl font-mono text-xs"
                        >
                          <option value="">{txt('স্টকে থাকা সিরিয়াল থেকে সিলেক্ট করুন...', 'Select from available serials...')}</option>
                          {serialsList.map((sn, sIdx) => (
                            <option key={sIdx} value={sn}>{sn}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder={txt('অথবা সরাসরি সিরিয়াল নম্বর লিখুন', 'Or type serial number manually')}
                          value={defectiveStockForm.serial_number}
                          onChange={e => setDefectiveStockForm(prev => ({ ...prev, serial_number: e.target.value }))}
                          className="w-full p-2 border border-slate-200 rounded-xl font-mono text-xs"
                        />
                      </div>
                    );
                  }
                  return (
                    <input
                      type="text"
                      placeholder={txt('নষ্ট পণ্যের সিরিয়াল নম্বর লিখুন (যদি থাকে)', 'Enter serial number if available')}
                      value={defectiveStockForm.serial_number}
                      onChange={e => setDefectiveStockForm(prev => ({ ...prev, serial_number: e.target.value }))}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                    />
                  );
                })()}
              </div>

              {/* সমস্যার বিবরণ */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {txt('নষ্ট/ত্রুটির সুনির্দিষ্ট বিবরণ *', 'Specific Defect/Problem Description *')}
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder={txt('যেমন: পাওয়ার অন হয় না, ডিসপ্লে কালো, শর্ট সার্কিট ইত্যাদি...', 'e.g. No power, display glitch, hardware failure...')}
                  value={defectiveStockForm.problem_description}
                  onChange={e => setDefectiveStockForm(prev => ({ ...prev, problem_description: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              {/* স্লিপ নম্বর ও প্রত্যাশিত ফেরত তারিখ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {txt('সাপ্লায়ার স্লিপ / চালান নং', 'Supplier Slip / Memo No')}
                  </label>
                  <input
                    type="text"
                    placeholder={txt('স্লিপ নম্বর (যদি থাকে)', 'Slip No (optional)')}
                    value={defectiveStockForm.supplier_slip_no}
                    onChange={e => setDefectiveStockForm(prev => ({ ...prev, supplier_slip_no: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {txt('প্রত্যাশিত ফেরত তারিখ', 'Expected Return Date')}
                  </label>
                  <input
                    type="date"
                    value={defectiveStockForm.expected_return_date}
                    onChange={e => setDefectiveStockForm(prev => ({ ...prev, expected_return_date: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* স্লিপ ছবি আপলোড */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {txt('ওয়ারেন্টি স্লিপ বা রসিদের ছবি (ঐচ্ছিক)', 'Upload Slip / Memo Image (Optional)')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDefectiveImageChange}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                />
                {defectiveSlipImagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={defectiveSlipImagePreview} alt="Slip" className="h-20 w-auto rounded-lg border object-cover" />
                    <button
                      type="button"
                      onClick={() => { setDefectiveSlipImagePreview(null); setDefectiveStockForm(prev => ({ ...prev, warranty_slip_image: '' })); }}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDefectiveStockModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl font-bold cursor-pointer shadow-md transition flex items-center gap-1.5"
                >
                  <PackageMinus size={15} /> {txt('ওয়ারেন্টিতে পাঠান ও স্টক মাইনাস করুন', 'Send to Warranty & Deduct Stock')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ৫. সাপ্লায়ার থেকে পণ্য পরিবর্তন ও নতুন সিরিয়াল যোগ মডাল ================= */}
      {showReplaceSerialModal && selectedWarrantyForReplace && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-6 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <RefreshCw size={18} />
                <h3 className="font-bold text-sm">
                  {txt('সাপ্লায়ার থেকে পরিবর্তিত পণ্য গ্রহণ ও নতুন সিরিয়াল যোগ', 'Receive Replaced Product & Add New Serial')}
                </h3>
              </div>
              <button 
                onClick={() => { setShowReplaceSerialModal(false); setSelectedWarrantyForReplace(null); }} 
                className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSupplierReplace} className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">{txt('সাপ্লায়ার:', 'Supplier:')}</span>
                  <span className="font-bold">{selectedWarrantyForReplace.supplier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">{txt('পণ্য:', 'Product:')}</span>
                  <span className="font-black text-slate-900">{selectedWarrantyForReplace.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">{txt('পূর্বের নষ্ট সিরিয়াল:', 'Old Defective Serial:')}</span>
                  <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                    {selectedWarrantyForReplace.serial_number || txt('নেই', 'None')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">{txt('ক্লেইম নং:', 'Claim No:')}</span>
                  <span className="font-mono font-bold text-purple-700">{selectedWarrantyForReplace.claim_no}</span>
                </div>
              </div>

              {/* নতুন সিরিয়াল নম্বর ইনপুট */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {txt('সাপ্লায়ারের প্রদানকৃত নতুন সিরিয়াল নম্বর (New Serial) *', 'New Serial Number from Supplier *')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={txt('যেমন: SN-987654321', 'e.g. SN-987654321')}
                  value={newReplacementSerialInput}
                  onChange={e => setNewReplacementSerialInput(e.target.value)}
                  className="w-full p-2.5 border-2 border-emerald-400 bg-emerald-50/30 rounded-xl font-mono font-bold text-sm text-emerald-950 focus:bg-white focus:border-emerald-600 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {txt(
                    '💡 এই নতুন সিরিয়ালটি স্টকে যুক্ত হবে এবং সাপ্লায়ার লেজারে লেনদেন লিপিবদ্ধ হবে।',
                    'This new serial will be added to inventory stock and registered in supplier ledger.'
                  )}
                </p>
              </div>

              {/* রেজোলিউশন বা অ্যাকশন নোট */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {txt('অ্যাকশন নোট / মন্তব্য', 'Action / Resolution Note')}
                </label>
                <input
                  type="text"
                  value={replacementActionNote}
                  onChange={e => setReplacementActionNote(e.target.value)}
                  placeholder={txt('যেমন: সাপ্লায়ার নষ্ট পণ্য পরিবর্তন করে নতুন দিয়েছে', 'e.g. Supplier provided new replacement product')}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowReplaceSerialModal(false); setSelectedWarrantyForReplace(null); }}
                  className="px-4 py-2 border rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                >
                  {txt('বাতিল', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold cursor-pointer shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle size={15} /> {txt('স্টকে নতুন সিরিয়াল দিয়ে যুক্ত করুন', 'Add to Stock with New Serial')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
