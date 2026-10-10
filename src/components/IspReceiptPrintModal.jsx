import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Printer, Download, Share2, MessageCircle, Phone, 
  Mail, Check, Copy, FileText, CheckCircle2, ShieldCheck, Sparkles, Loader2, Globe, Edit3 
} from 'lucide-react';
import { generatePdfFromElement, downloadPdfFile, sharePdfNative } from '../utils/pdfGenerator';

export default function IspReceiptPrintModal({ 
  isOpen, 
  onClose, 
  receiptData, 
  lang = 'bn',
  onEdit = null
}) {
  const [docMode, setDocMode] = useState('receipt'); // 'receipt' | 'bill'
  const [docLang, setDocLang] = useState(lang); // 'bn' | 'en'
  const [copied, setCopied] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [alertNotice, setAlertNotice] = useState(null);
  const printableRef = useRef(null);

  useEffect(() => {
    setDocLang(lang);
  }, [lang]);

  if (!isOpen || !receiptData) return null;

  const txt = (bn, en) => (docLang === 'en' ? (en !== undefined ? en : bn) : bn);

  const {
    id,
    receipt_no = `ISP-REC-${Date.now().toString().slice(-6)}`,
    customer_id,
    customer_name = (docLang === 'en' ? 'Valued Customer' : 'সম্মানিত গ্রাহক'),
    customer_mobile = '',
    customer_address = '',
    speed = '',
    amount = 0,
    monthly_fee = 0,
    line_charge = 0,
    line_charge_paid = 0,
    payment_type = 'monthly_fee',
    billing_type = 'prepaid',
    doc_type = 'receipt',
    payment_status = 'Paid',
    billing_month = '',
    cycle_start = '',
    cycle_end = '',
    payment_date = new Date().toISOString().slice(0, 10),
    payment_method = 'Cash',
    received_by = 'Admin',
    ip_address = '',
    pppoe_username = '',
    note = ''
  } = receiptData;

  useEffect(() => {
    if (receiptData?.doc_type) {
      setDocMode(receiptData.doc_type);
    }
  }, [receiptData]);

  // সংখ্যা থেকে বাংলায় কথায় রূপান্তর
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
      if (val > 0) res += units[val] + ' ';
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

  // সংখ্যা থেকে ইংরেজিতে কথায় রূপান্তর (Number to words in English)
  const numberToWordsEn = (num) => {
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

  const cleanMobile = (customer_mobile || '').replace(/[^0-9]/g, '');
  const formattedMobile = cleanMobile.startsWith('88') ? cleanMobile : (cleanMobile ? `88${cleanMobile}` : '');

  // ডিসপ্লে বিলিং মাস
  const displayBillingMonth = billing_month 
    ? (billing_month === 'চলতি মাস' ? txt('চলতি মাস', 'Current Month') : billing_month)
    : txt('চলতি মাস', 'Current Month');

  const isDue = (payment_status || '').toLowerCase() === 'due';
  const billingTypeText = billing_type === 'postpaid' 
    ? txt('পোস্টপেইড (Postpaid)', 'Postpaid') 
    : txt('প্রিপেইড (Prepaid)', 'Prepaid');
  const paymentStatusText = isDue 
    ? txt('বকেয়া / অপরিশোধিত (Due)', 'Due / Unpaid') 
    : txt('পরিশোধিত / সম্পন্ন (Paid)', 'Paid / Completed');

  // হোয়াটসঅ্যাপ মেসেজ ও টেক্সট সামারি
  const formattedSummary = docLang === 'en'
    ? `*FC TECHNOLOGY - ISP INTERNET*
📄 ${docMode === 'receipt' ? 'Money Receipt / Payment Receipt' : 'Monthly Internet Bill'}
------------------------------------
${docMode === 'receipt' ? 'Receipt No' : 'Bill No'}: ${receipt_no}
Date: ${payment_date}
Customer Name: ${customer_name}
Mobile: ${customer_mobile || '-'}
Package / Speed: ${speed || 'Standard'}
Billing Type: ${billingTypeText}
Billing Month: ${displayBillingMonth}
${cycle_start && cycle_end ? `Period: ${cycle_start} to ${cycle_end}\n` : ''}Amount: ৳ ${Number(amount).toLocaleString()} (${numberToWordsEn(amount)})
Payment Method: ${payment_method}
Status: ${paymentStatusText}
------------------------------------
Shop #18, RF Johura Tower, Agrabad, Chattogram.
Hotline: 09613-181920, 01812-091939
Thank you for choosing FC Technology!`
    : `*FC TECHNOLOGY - ISP INTERNET*
📄 ${docMode === 'receipt' ? 'মানি রিসিপ্ট / বিল পরিশোধ রশিদ' : 'ইন্টারনেট মাসিক বিল'}
------------------------------------
রশিদ / বিল নং: ${receipt_no}
তারিখ: ${payment_date}
গ্রাহকের নাম: ${customer_name}
মোবাইল: ${customer_mobile || '-'}
প্যাকেজ / স্পিড: ${speed || 'Standard'}
বিলিং ধরণ: ${billingTypeText}
বিলিং মাস: ${displayBillingMonth}
${cycle_start && cycle_end ? `মেয়াদ: ${cycle_start} হতে ${cycle_end}\n` : ''}টাকার পরিমাণ: ৳ ${Number(amount).toLocaleString()} (${numberToWordsBn(amount)})
পরিশোধ মাধ্যম: ${payment_method}
স্ট্যাটাস: ${paymentStatusText}
------------------------------------
দোকান নং #১৮, আর এফ জোহরা টাওয়ার, আগ্রাবাদ, চট্টগ্রাম।
হটলাইন: 09613-181920, 01812-091939
ধন্যবাদ, FC Technology এর সাথেই থাকুন!`;

  // সরাসরি প্রিন্ট ফাংশন
  const handlePrint = () => {
    window.print();
  };

  // পিডিএফ তৈরি ও ডাউনলোড
  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    setIsPdfLoading(true);
    setAlertNotice(null);
    try {
      const filename = `FC_Technology_ISP_${docMode === 'receipt' ? 'Receipt' : 'Bill'}_${receipt_no}.pdf`;
      const result = await generatePdfFromElement(printableRef.current, filename, {
        singlePage: true,
        forceSinglePage: true
      });
      downloadPdfFile(result.blob, filename);
      setAlertNotice({
        type: 'success',
        text: txt('পিডিএফ সফলভাবে ডাউনলোড হয়েছে!', 'PDF downloaded successfully!')
      });
    } catch (err) {
      console.error(err);
      setAlertNotice({
        type: 'error',
        text: txt('পিডিএফ তৈরিতে সমস্যা হয়েছে: ' + err.message, 'Failed to generate PDF: ' + err.message)
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

  // হোয়াটসঅ্যাপে সরাসরি মেসেজ ও বিল পাঠানো
  const handleSendWhatsApp = () => {
    if (!cleanMobile) {
      alert(txt('গ্রাহকের মোবাইল নম্বর দেওয়া নেই!', 'Customer mobile number is missing!'));
      return;
    }
    const url = `https://wa.me/${formattedMobile}?text=${encodeURIComponent(formattedSummary)}`;
    window.open(url, '_blank');
  };

  // মোবাইলে SMS পাঠানো
  const handleSendSms = () => {
    if (!cleanMobile) {
      alert(txt('গ্রাহকের মোবাইল নম্বর দেওয়া নেই!', 'Customer mobile number is missing!'));
      return;
    }
    const smsText = docLang === 'en'
      ? `FC Technology: Dear ${customer_name}, your Internet (${speed}) bill ৳${amount} (${displayBillingMonth}) is paid successfully. Receipt #${receipt_no}. Valid till: ${cycle_end || ''}. Helpline: 09613-181920`
      : `FC Technology: প্রিয় ${customer_name}, আপনার ইন্টারনেট (${speed}) বিল ৳${amount} (${displayBillingMonth}) সফলভাবে পরিশোধ হয়েছে। রিসিট #${receipt_no}। মেয়াদ: ${cycle_end || ''} পর্যন্ত। হেল্পলাইন: 09613-181920`;
    
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileDevice) {
      window.open(`sms:${cleanMobile}?body=${encodeURIComponent(smsText)}`, '_self');
    } else {
      navigator.clipboard.writeText(smsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      alert(txt('মোবাইল SMS টেক্সট কপি করা হয়েছে! আপনি যেকোনো SMS গেটওয়ে বা ফোনে পেস্ট করে পাঠাতে পারেন:\n\n' + smsText, 'SMS copied to clipboard!'));
    }
  };

  // ইমেইলে বিল পাঠানো
  const handleSendEmail = () => {
    const subject = `FC Technology - ISP Internet ${docMode === 'receipt' ? (docLang === 'en' ? 'Payment Receipt' : 'মানি রিসিপ্ট') : (docLang === 'en' ? 'Bill' : 'মাসিক বিল')} #${receipt_no}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedSummary)}`;
    window.open(mailtoUrl, '_blank');
  };

  // সার্বজনীন শেয়ার (Web Share API)
  const handleNativeShare = async () => {
    if (!printableRef.current) return;
    setIsPdfLoading(true);
    try {
      const filename = `FC_Technology_ISP_${receipt_no}.pdf`;
      const { file } = await generatePdfFromElement(printableRef.current, filename, { singlePage: true });
      await sharePdfNative({
        file,
        title: `FC Technology - ISP ${receipt_no}`,
        text: formattedSummary
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 print:shadow-none print:border-none print:rounded-none">
        
        {/* টপ কন্ট্রোল বার (প্রিন্টে লুকানো থাকবে) */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-5 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                {txt('আইএসপি মানি রিসিপ্ট ও বিল', 'ISP Money Receipt & Bill')}
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  #{receipt_no}
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                {txt('এফসি টেকনোলজি অফিসিয়াল ওয়াটারমার্কযুক্ত কপি', 'Official FC Technology watermarked document')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ভাষা সুইচ বাটন: বাংলা <-> English */}
            <button
              onClick={() => setDocLang(docLang === 'bn' ? 'en' : 'bn')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-600 transition shadow-xs cursor-pointer"
              title={docLang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
            >
              <Globe size={13} className="text-amber-400" />
              <span className={docLang === 'bn' ? 'text-amber-400 font-bold' : 'text-slate-400 font-normal'}>বাং</span>
              <span className="text-slate-500">/</span>
              <span className={docLang === 'en' ? 'text-amber-400 font-bold' : 'text-slate-400 font-normal'}>EN</span>
            </button>

            {/* ডকুমেন্ট মোড সুইচ: রিসিপ্ট vs বিল */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700">
              <button
                onClick={() => setDocMode('receipt')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  docMode === 'receipt' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🧾 {txt('মানি রিসিপ্ট', 'Money Receipt')}
              </button>
              <button
                onClick={() => setDocMode('bill')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  docMode === 'bill' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📄 {txt('মাসিক বিল', 'Monthly Bill')}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* অ্যাকশন বাটন প্যানেল (WhatsApp, Print, PDF, SMS, Email) */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-black rounded-xl font-medium transition cursor-pointer shadow-sm"
            >
              <Printer size={14} /> {txt('প্রিন্ট করুন', 'Print')}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isPdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {txt('পিডিএফ সেভ করুন', 'Save PDF')}
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-medium transition cursor-pointer shadow-sm"
            >
              <MessageCircle size={14} /> {txt('WhatsApp পাঠান', 'Send WhatsApp')}
            </button>
            <button
              onClick={handleSendSms}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 rounded-xl font-medium transition cursor-pointer shadow-sm"
            >
              <Phone size={14} /> {txt('মোবাইলে SMS', 'Send SMS')}
            </button>
            <button
              onClick={handleSendEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-800 hover:bg-slate-300 rounded-xl font-medium transition cursor-pointer"
            >
              <Mail size={14} /> {txt('ইমেইল', 'Email')}
            </button>
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-800 hover:bg-slate-300 rounded-xl font-medium transition cursor-pointer"
            >
              <Share2 size={14} /> {txt('শেয়ার', 'Share')}
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(receiptData);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition cursor-pointer shadow-sm ml-auto"
              >
                <Edit3 size={14} /> {txt('বিল/রশিদ এডিট', 'Edit Bill/Receipt')}
              </button>
            )}
          </div>

          {copied && (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={13} /> {txt('টেক্সট কপি হয়েছে!', 'Copied to clipboard!')}
            </span>
          )}
        </div>

        {alertNotice && (
          <div className={`px-5 py-2 text-xs flex items-center justify-between ${
            alertNotice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
          } print:hidden`}>
            <span>{alertNotice.text}</span>
            <button onClick={() => setAlertNotice(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">×</button>
          </div>
        )}

        {/* প্রিন্টেবল কনটেন্ট (A4 পূর্ণদৈর্ঘ্য মেমো ফরম্যাট, স্পষ্ট দৃশ্যমান জলছাপ এবং পেইজের নিচে স্বাক্ষর) */}
        <div className="p-4 md:p-8 bg-slate-100 flex justify-center print:p-0 print:bg-white overflow-auto">
          <div 
            ref={printableRef}
            id="isp-printable-receipt"
            className="isp-receipt-printable relative w-full max-w-[720px] bg-white p-7 md:p-9 shadow-md print:shadow-none border border-slate-200 print:border-none min-h-[960px] md:min-h-[1050px] print:min-h-[1050px] flex flex-col justify-between overflow-hidden text-slate-900"
            style={{ boxSizing: 'border-box' }}
          >
            {/* স্পষ্ট দৃশ্যমান এফসি টেকনোলজি ওয়াটারমার্ক / জলছাপ */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <img 
                src="/fc_logo_watermark.png" 
                alt="FC Watermark" 
                className="w-80 md:w-[440px] max-w-[85%] opacity-[0.24] md:opacity-[0.26] select-none object-contain print:opacity-[0.25]"
                onError={(e) => {
                  e.target.src = '/fc_brand_watermark.png';
                }}
              />
            </div>

            {/* কনটেন্ট লেয়ার (z-10 উপরে থাকবে, জলছাপ স্পষ্টভাবে দৃশ্যমান থাকবে) */}
            <div className="relative z-10 flex flex-col justify-between flex-1 h-full">
              
              {/* ১. মূল কনটেন্ট অংশ (হেডার, গ্রাহক বিবরণী, বিল টেবিল ও আর্থিক সারাংশ) */}
              <div className="flex-1 flex flex-col">
                
                {/* ১.১ হেডার অংশ (আইএসপি মানি রিসিপ্ট ও বিলে শুধু FC লোগোটি আসবে) */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    {/* শুধু এফসি লোগো আইকন */}
                    <img 
                      src="/fc_logo_icon.png" 
                      alt="FC Logo" 
                      className="h-16 w-16 md:h-18 md:w-18 object-contain shrink-0 select-none"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">
                        FC TECHNOLOGY
                      </h1>
                      <p className="text-[12px] font-bold text-blue-800 tracking-wide uppercase">
                        {txt('হাই-স্পিড ব্রডব্যান্ড ও ইন্টারনেট সার্ভিস সলিউশনস', 'High Speed Broadband & ISP Internet Solutions')}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {txt('দোকান নং #১৮, আর এফ জোহরা টাওয়ার, আগ্রাবাদ, চট্টগ্রাম।', 'Shop #18, RF Johura Tower, Agrabad, Chattogram.')}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-700">
                        {txt('হটলাইন: 09613-181920, 01812-091939 | ইমেইল: support@fctechnology.com.bd', 'Hotline: 09613-181920, 01812-091939 | Email: support@fctechnology.com.bd')}
                      </p>
                    </div>
                  </div>

                  {/* ডকুমেন্ট টাইপ ব্যাজ (মানি রিসিপ্ট vs মাসিক বিল) */}
                  <div className="text-right flex flex-col items-end">
                    <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-center shadow-sm print:shadow-none">
                      <span className="text-[11px] font-black uppercase tracking-wider block">
                        {docMode === 'receipt' 
                          ? txt('মানি রিসিপ্ট', 'MONEY RECEIPT') 
                          : txt('মাসিক ইন্টারনেট বিল', 'MONTHLY INTERNET BILL')}
                      </span>
                      <span className="text-[9px] text-slate-300 font-mono tracking-wide block">
                        {docMode === 'receipt' 
                          ? txt('বিল পরিশোধ রশিদ', 'PAYMENT RECEIPT') 
                          : txt('ইন্টারনেট বিল চালান', 'INTERNET BILL INVOICE')}
                      </span>
                    </div>
                    <div className="mt-2 text-right text-[11px]">
                      <p className="font-bold text-slate-900">
                        {docMode === 'receipt' ? txt('রশিদ নং: ', 'Receipt No: ') : txt('বিল নং: ', 'Bill No: ')}
                        <span className="font-mono text-blue-900">{receipt_no}</span>
                      </p>
                      <p className="text-slate-600">
                        {txt('তারিখ: ', 'Date: ')}
                        <span className="font-semibold text-slate-900">{payment_date}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* ১.২ গ্রাহক পরিচিতি গ্রিড */}
                <div className="bg-white/40 border border-slate-200/90 rounded-2xl p-3.5 mb-4 text-xs backdrop-blur-[0.5px] print:bg-transparent print:border-slate-300">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">{txt('গ্রাহকের নাম:', 'Customer Name:')}</span>
                      <span className="font-bold text-slate-900 text-[13px]">{customer_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">{txt('মোবাইল নম্বর:', 'Mobile Number:')}</span>
                      <span className="font-bold text-slate-900 font-mono text-[13px]">{customer_mobile || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">{txt('প্যাকেজ / স্পিড:', 'Package / Speed:')}</span>
                      <span className="font-black text-blue-700 text-[13px]">{speed || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">{txt('বিলিং মাস:', 'Billing Month:')}</span>
                      <span className="font-bold text-slate-900 text-[13px]">{displayBillingMonth}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">{txt('বিলিং ধরণ:', 'Billing Type:')}</span>
                      <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-md ${
                        billing_type === 'postpaid' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {billing_type === 'postpaid' ? txt('📅 পোস্টপেইড', '📅 Postpaid') : txt('⚡ প্রিপেইড', '⚡ Prepaid')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">{txt('পেমেন্ট স্ট্যাটাস:', 'Payment Status:')}</span>
                      <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-md ${
                        isDue 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isDue ? txt('⚠️ অপরিশোধিত / বকেয়া', '⚠️ Due / Unpaid') : txt('✓ পরিশোধিত', '✓ Paid')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">{txt('মেয়াদ / বিলিং সাইকেল:', 'Billing Cycle / Validity:')}</span>
                      <span className="text-slate-900 font-semibold font-mono text-[11px]">
                        {cycle_start ? `${cycle_start} ${txt('হতে', 'to')} ${cycle_end || ''}` : `${cycle_end ? `${txt('পরবর্তী মেয়াদ: ', 'Next Due: ')}${cycle_end}` : '-'}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">{txt('আইপি / ইউজার:', 'IP / PPPoE User:')}</span>
                      <span className="text-slate-900 font-mono text-[11px] font-semibold">{pppoe_username || ip_address || '-'}</span>
                    </div>

                    <div className="col-span-2 md:col-span-4 pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">{txt('গ্রাহকের ঠিকানা:', 'Customer Address:')}</span>
                      <span className="text-slate-800 font-medium">{customer_address || txt('আগ্রাবাদ, চট্টগ্রাম', 'Agrabad, Chattogram')}</span>
                    </div>
                  </div>
                </div>

                {/* ১.৩ বিল / লেনদেন বিবরণী টেবিল (স্বচ্ছ ব্যাকগ্রাউন্ড) */}
                <div className="border border-slate-300/90 rounded-xl overflow-hidden mb-4 bg-white/30 backdrop-blur-[0.5px] print:bg-transparent print:border-slate-300">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-12 text-center">{txt('নং', 'SL')}</th>
                        <th className="py-2.5 px-4">{txt('সেবা / ফি এর বিবরণ', 'Service / Fee Description')}</th>
                        <th className="py-2.5 px-3 text-center">{txt('মেয়াদকাল', 'Period')}</th>
                        <th className="py-2.5 px-4 text-right">{txt('পরিমাণ (টাকা)', 'Amount (BDT)')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/90 text-slate-800">
                      <tr className="hover:bg-slate-50/40 bg-transparent print:bg-transparent">
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{txt('০১', '01')}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-slate-900 block">
                            {txt(`ইন্টারনেট মাসিক সাবস্ক্রিপশন ফি (${speed || 'Standard'})`, `Monthly Internet Subscription Fee (${speed || 'Standard'})`)}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {txt('নিরবচ্ছিন্ন হাই-স্পিড ব্রডব্যান্ড ইন্টারনেট সংযোগ', 'High-speed uninterrupted broadband internet service')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                          {displayBillingMonth}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          ৳ {Number(amount).toLocaleString()}
                        </td>
                      </tr>

                      {line_charge > 0 && (
                        <tr className="hover:bg-slate-50/40 bg-transparent print:bg-transparent">
                          <td className="py-2 px-3 text-center font-mono font-bold">{txt('০২', '02')}</td>
                          <td className="py-2 px-4">
                            <span className="font-semibold text-slate-800">
                              {txt('ফাইবার লাইন সংযোগ ও সেটআপ চার্জ', 'Fiber Line Connection & Setup Charge')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[11px]">
                            {txt('এককালীন', 'One-time')}
                          </td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                            ৳ {Number(line_charge).toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ১.৪ টাকার হিসাব এবং কথায় রূপান্তর (স্বচ্ছ ব্যাকগ্রাউন্ড) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* বাম পাশে কথায় রূপান্তর ও পেমেন্ট মেথড */}
                  <div className="bg-white/40 border border-slate-200/90 rounded-xl p-3 flex flex-col justify-between text-xs backdrop-blur-[0.5px] print:bg-transparent print:border-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                        {txt('কথায় (Amount in Words):', 'Amount in Words:')}
                      </span>
                      <p className="font-bold text-indigo-950 italic text-[12px] leading-relaxed">
                        {docLang === 'en' ? numberToWordsEn(amount) : numberToWordsBn(amount)}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-500">{txt('পরিশোধের মাধ্যম: ', 'Payment Method: ')}</span>
                        <span className="font-black text-slate-900">{payment_method}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{txt('আদায়কারী: ', 'Received By: ')}</span>
                        <span className="font-semibold text-slate-800">{received_by}</span>
                      </div>
                    </div>
                  </div>

                  {/* ডান পাশে হিসাব সারাংশ */}
                  <div className="bg-white/40 border border-slate-200/90 rounded-xl p-3 text-xs space-y-1.5 backdrop-blur-[0.5px] print:bg-transparent print:border-slate-300">
                    <div className="flex justify-between text-slate-700">
                      <span>{txt('সাবস্ক্রিপশন ফি:', 'Subscription Fee:')}</span>
                      <span className="font-mono font-bold">৳ {Number(amount).toLocaleString()}</span>
                    </div>
                    {line_charge > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>{txt('লাইন চার্জ:', 'Line Charge:')}</span>
                        <span className="font-mono font-bold">৳ {Number(line_charge).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200/80">
                      <span className="font-bold">{txt('সর্বমোট প্রদেয়:', 'Total Payable:')}</span>
                      <span className="font-mono font-bold text-slate-900">৳ {Number(amount).toLocaleString()}</span>
                    </div>
                    <div className={`flex justify-between px-2 py-1 rounded-lg font-bold border print:bg-transparent ${
                      isDue 
                        ? 'text-amber-800 bg-amber-50/70 border-amber-200/80' 
                        : 'text-emerald-800 bg-emerald-50/70 border-emerald-200/80'
                    }`}>
                      <span>{txt('পরিশোধিত টাকা:', 'Amount Paid:')}</span>
                      <span className="font-mono text-[13px]">৳ {isDue ? '0.00' : Number(amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] px-1 font-bold">
                      <span className={isDue ? 'text-rose-600' : 'text-slate-500'}>{txt('অবশিষ্ট বকেয়া:', 'Remaining Due:')}</span>
                      <span className={`font-mono ${isDue ? 'text-rose-600 font-black text-[12px]' : 'text-slate-700'}`}>
                        ৳ {isDue ? Number(amount).toLocaleString() : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ১.৫ নোট ও বিশেষ দ্রষ্টব্য */}
                <div className="p-2.5 bg-blue-50/40 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 mb-6 backdrop-blur-[0.5px] print:bg-transparent print:border-slate-300">
                  <p className="font-semibold">
                    📌 <strong>{txt('বিশেষ দ্রষ্টব্য:', 'Special Note:')}</strong> {txt(
                      'প্রতি মাসের নির্দিষ্ট মেয়াদের মধ্যে সাবস্ক্রিপশন ফি পরিশোধ করার অনুরোধ করা হচ্ছে। নিরবচ্ছিন্ন ইন্টারনেট সার্ভিস উপভোগ করার জন্য ধন্যবাদ।',
                      'Please pay the monthly subscription fee within the specified billing cycle. Thank you for staying with FC Technology.'
                    )}
                  </p>
                </div>

              </div>

              {/* ২. ফুটার অংশ (গ্রাহকের স্বাক্ষর এবং কর্তৃপক্ষের অনুমোদিত স্বাক্ষর পেইজের একদম নিচে) */}
              <div className="pt-6 border-t border-slate-200/90 mt-auto w-full pb-2">
                <div className="flex items-end justify-between px-4 md:px-6">
                  {/* গ্রাহকের স্বাক্ষর */}
                  <div className="text-center w-52">
                    <div className="w-36 mx-auto border-b border-dashed border-slate-400 mb-1.5"></div>
                    <p className="text-[11px] text-slate-800 font-bold uppercase tracking-wider">
                      {txt('গ্রাহকের স্বাক্ষর', "Customer's Signature")}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium">
                      {txt('স্বাক্ষর ও সম্মতি', 'Signature & Acceptance')}
                    </p>
                  </div>

                  {/* কর্তৃপক্ষের অনুমোদিত সিল ও স্বাক্ষর */}
                  <div className="text-center flex flex-col items-center w-60">
                    <div className="relative mb-1">
                      <img 
                        src="/authority_seal_signature.png" 
                        alt="Authority Seal & Signature" 
                        className="w-32 md:w-36 object-contain pointer-events-none drop-shadow-sm select-none"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="w-48 border-b-2 border-slate-900 mb-1"></div>
                    <p className="text-[11px] text-slate-900 font-black uppercase tracking-wider">
                      {txt('কর্তৃপক্ষের অনুমোদিত স্বাক্ষর', 'Authorized Signature & Seal')}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold">
                      FC TECHNOLOGY
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-center text-[10px] text-slate-400 font-mono">
                  {txt(
                    `এটি এফসি টেকনোলজির অফিসিয়াল কম্পিউটার জেনারেটেড ${docMode === 'receipt' ? 'মানি রিসিপ্ট' : 'মাসিক ইন্টারনেট বিল'}।`,
                    `This is a computer generated official ${docMode === 'receipt' ? 'Money Receipt' : 'Monthly Internet Bill'} with verified watermark from FC Technology.`
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
