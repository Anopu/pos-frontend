import React, { useState } from 'react';
import { 
  X, Share2, MessageCircle, FileText, Printer, Copy, Check, 
  ExternalLink, Download, Loader2, Sparkles, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { 
  generatePdfFromElement, 
  downloadPdfFile, 
  sharePdfNative, 
  findPrintableElement, 
  createFallbackPrintableElement 
} from '../utils/pdfGenerator';

export default function ShareModal({ isOpen, onClose, data, lang = 'bn' }) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState(null); // 'share' | 'whatsapp' | 'download'
  const [statusAlert, setStatusAlert] = useState(null); // { type: 'success' | 'info' | 'error', message: string }

  if (!isOpen || !data) return null;

  const {
    type, // 'invoice' | 'quotation' | 'ledger' | 'warranty'
    title,
    number,
    date,
    customerName,
    customerMobile,
    amount,
    details = '',
    fullText = '',
    elementId = 'printable-content',
    filename: customFilename
  } = data;

  // সুন্দর ফরম্যাটেড টেক্সট সারাংশ
  const formattedSummary = fullText || `*FC TECHNOLOGY* - ${title}
----------------------------------
📄 দলিল / নম্বর: ${number || '-'}
📅 তারিখ: ${date || '-'}
👤 গ্রাহক: ${customerName || '-'}
📞 মোবাইল: ${customerMobile || '-'}
${amount !== undefined && amount !== null ? `💰 পরিমাণ / বকেয়া: ৳ ${Number(amount).toLocaleString()}\n` : ''}${details ? `📌 বিবরণ:\n${details}\n` : ''}----------------------------------
দোকান নং #১৮, আর এফ জোহরা টাওয়ার, আগ্রাবাদ, চট্টগ্রাম।
হটলাইন: 09613-181920, 01812-091939
ধন্যবাদ FC Technology এর সাথে থাকার জন্য!`;

  // পিডিএফ ফাইল প্রস্তুত করার কোর ফাংশন
  const getPdfFile = async () => {
    let element = await findPrintableElement(elementId);
    let fallbackContainer = null;

    if (!element) {
      fallbackContainer = createFallbackPrintableElement(data, lang);
      element = fallbackContainer;
    }

    const safeNumber = (number || 'doc').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeType = type || 'document';
    const finalFilename = customFilename || `FC_Technology_${safeType}_${safeNumber}.pdf`;

    try {
      const result = await generatePdfFromElement(element, finalFilename, {
        forceSinglePage: type !== 'ledger',
        singlePage: type !== 'ledger'
      });
      return result;
    } finally {
      if (fallbackContainer && fallbackContainer.parentNode) {
        fallbackContainer.parentNode.removeChild(fallbackContainer);
      }
    }
  };

  // ১. সম্পূর্ণ পিডিএফ সরাসরি শেয়ার (মোবাইল ও সাপোর্টেড ব্রাউজারে সরাসরি PDF ফাইল শেয়ার)
  const handleSharePdf = async () => {
    setIsGenerating(true);
    setGenerationType('share');
    setStatusAlert(null);
    try {
      const { file } = await getPdfFile();
      const res = await sharePdfNative({
        file,
        title: `FC Technology - ${title} (#${number || ''})`,
        text: formattedSummary
      });

      if (res.method === 'native-file') {
        setStatusAlert({
          type: 'success',
          message: lang === 'en'
            ? 'PDF file share tray opened! Select WhatsApp or other app to send.'
            : 'সম্পূর্ণ পিডিএফ ফাইল শেয়ার উইন্ডো ওপেন হয়েছে! হোয়াটসঅ্যাপ বা অন্য অ্যাপে পাঠিয়ে দিন।'
        });
      } else {
        setStatusAlert({
          type: 'info',
          message: lang === 'en'
            ? 'PDF downloaded! You can attach and share this file to WhatsApp or any app.'
            : 'সম্পূর্ণ পিডিএফ ফাইলটি ডিভাইসে ডাউনলোড হয়েছে! এটি সরাসরি হোয়াটসঅ্যাপ বা অন্য অ্যাপে পাঠাতে পারেন।'
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('PDF share error:', err);
        setStatusAlert({
          type: 'error',
          message: lang === 'en' 
            ? 'Could not generate PDF. Please use browser Print / Save PDF.' 
            : 'পিডিএফ ফাইলে রূপান্তর করতে সমস্যা হয়েছে। অনুগ্রহ করে ব্রাউজার প্রিন্ট / সেভ PDF অপশনটি ব্যবহার করুন।'
        });
      }
    } finally {
      setIsGenerating(false);
      setGenerationType(null);
    }
  };

  // ২. হোয়াটসঅ্যাপে পিডিএফ ও বিবরণ পাঠানো
  const handleWhatsAppPdfShare = async () => {
    setIsGenerating(true);
    setGenerationType('whatsapp');
    setStatusAlert(null);
    try {
      const { file, filename: safeFilename } = await getPdfFile();

      // ডিভাইস মেমোরিতে সরাসরি পিডিএফ সংরক্ষণ
      downloadPdfFile(file, safeFilename);

      // কাস্টমারের মোবাইল নম্বর ফরম্যাট
      let cleanMobile = '';
      if (customerMobile) {
        cleanMobile = customerMobile.replace(/[^0-9]/g, '');
        if (cleanMobile.startsWith('0')) cleanMobile = '88' + cleanMobile;
        else if (!cleanMobile.startsWith('88')) cleanMobile = '88' + cleanMobile;
      }

      const waMessage = `*FC TECHNOLOGY* - ${title} (#${number || ''})
----------------------------------
📄 আপনার সম্পূর্ণ অফিসিয়াল পিডিএফ ডকুমেন্টটি প্রস্তুত হয়েছে।
(সংযুক্ত "${safeFilename}" পিডিএফ ফাইলটি চেক করুন)

👤 গ্রাহক: ${customerName || '-'}
${amount !== undefined && amount !== null ? `💰 টাকার পরিমাণ: ৳ ${Number(amount).toLocaleString()}\n` : ''}📅 তারিখ: ${date || '-'}
----------------------------------
দোকান নং #১৮, আর এফ জোহরা টাওয়ার, আগ্রাবাদ, চট্টগ্রাম।
হটলাইন: 09613-181920, 01812-091939
ধন্যবাদ FC Technology এর সাথে থাকার জন্য!`;

      // যদি নেটিভ ফাইল শেয়ার সাপোর্ট করে তবে সরাসরি শেয়ার ট্রেতে পাঠানো
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `FC Technology - ${title} (#${number || ''})`,
            text: waMessage
          });
          setStatusAlert({
            type: 'success',
            message: lang === 'en'
              ? 'PDF file sent to share sheet! Select WhatsApp to send.'
              : 'পিডিএফ ফাইল সহ হোয়াটসঅ্যাপ শেয়ার উইন্ডো ওপেন হয়েছে!'
          });
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }

      // ডেস্কটপ বা সাধারণ ব্রাউজারের ক্ষেত্রে হোয়াটসঅ্যাপ চ্যাট ওপেন করা
      const encodedText = encodeURIComponent(waMessage);
      let url = cleanMobile && cleanMobile.length >= 11
        ? `https://wa.me/${cleanMobile}?text=${encodedText}`
        : `https://api.whatsapp.com/send?text=${encodedText}`;

      window.open(url, '_blank');
      setStatusAlert({
        type: 'success',
        message: lang === 'en'
          ? `PDF "${safeFilename}" downloaded and WhatsApp opened! Attach the downloaded PDF in chat.`
          : `সম্পূর্ণ পিডিএফ ফাইল ডাউনলোড হয়েছে এবং গ্রাহকের হোয়াটসঅ্যাপ চ্যাট ওপেন হয়েছে। ডাউনলোডকৃত ফাইলটি চ্যাটে সেন্ড করুন!`
      });
    } catch (err) {
      console.error('WhatsApp PDF error:', err);
      // টেক্সট ভিত্তিক ব্যাকআপ
      handleWhatsAppTextOnly();
    } finally {
      setIsGenerating(false);
      setGenerationType(null);
    }
  };

  // টেক্সট ভিত্তিক হোয়াটসঅ্যাপ ব্যাকআপ
  const handleWhatsAppTextOnly = () => {
    let cleanMobile = '';
    if (customerMobile) {
      cleanMobile = customerMobile.replace(/[^0-9]/g, '');
      if (cleanMobile.startsWith('0')) cleanMobile = '88' + cleanMobile;
      else if (!cleanMobile.startsWith('88')) cleanMobile = '88' + cleanMobile;
    }

    const encodedText = encodeURIComponent(formattedSummary);
    const url = cleanMobile && cleanMobile.length >= 11
      ? `https://wa.me/${cleanMobile}?text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(url, '_blank');
  };

  // ৩. সরাসরি সম্পূর্ণ পিডিএফ ডাউনলোড
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setGenerationType('download');
    setStatusAlert(null);
    try {
      const { file, filename: safeFilename } = await getPdfFile();
      downloadPdfFile(file, safeFilename);
      setStatusAlert({
        type: 'success',
        message: lang === 'en'
          ? `PDF successfully downloaded as "${safeFilename}"!`
          : `সম্পূর্ণ পিডিএফ "${safeFilename}" সফলভাবে ডাউনলোড হয়েছে!`
      });
    } catch (err) {
      console.error('PDF download error:', err);
      setStatusAlert({
        type: 'error',
        message: lang === 'en' 
          ? 'Failed to download PDF. You can use Save as PDF / Print.' 
          : 'পিডিএফ ডাউনলোড করা যায়নি। ব্রাউজারের সেভ PDF / প্রিন্ট অপশনটি দেখুন।'
      });
    } finally {
      setIsGenerating(false);
      setGenerationType(null);
    }
  };

  // ৪. কপি টু ক্লিপবোর্ড
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ৫. ব্রাউজার প্রিন্ট / সেভ PDF
  const handlePrintPdf = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* হেডার */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-4 text-white flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm leading-tight text-white">
                  {lang === 'en' ? 'Share Document & Complete PDF' : 'সম্পূর্ণ পিডিএফ ও ডকুমেন্ট শেয়ার'}
                </h3>
                <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles size={10} /> PDF
                </span>
              </div>
              <p className="text-[11px] text-blue-100 mt-0.5">
                {lang === 'en' ? 'Direct PDF file sharing, WhatsApp & instant download' : 'সম্পূর্ণ পিডিএফ ফাইল শেয়ার, হোয়াটসঅ্যাপ ও সরাসরি ডাউনলোড'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* কনটেন্ট এরিয়া */}
        <div className="p-4 md:p-5 space-y-3.5 max-h-[85vh] overflow-y-auto">
          
          {/* স্ট্যাটাস এলার্ট ব্যানার */}
          {statusAlert && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
              statusAlert.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : statusAlert.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              {statusAlert.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : statusAlert.type === 'error' ? (
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <FileText size={16} className="text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium leading-relaxed">{statusAlert.message}</div>
              <button 
                onClick={() => setStatusAlert(null)} 
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ডকুমেন্ট সারসংক্ষেপ কার্ড */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between items-center border-b pb-1.5">
              <span className="text-gray-500 font-semibold">{lang === 'en' ? 'Document Type:' : 'ডকুমেন্টের ধরন:'}</span>
              <span className="font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                {title}
              </span>
            </div>
            {number && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{lang === 'en' ? 'Number / ID:' : 'নম্বর / আইডি:'}</span>
                <span className="font-mono font-bold text-gray-800">{number}</span>
              </div>
            )}
            {customerName && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{lang === 'en' ? 'Customer:' : 'গ্রাহক:'}</span>
                <span className="font-bold text-gray-800">{customerName}</span>
              </div>
            )}
            {customerMobile && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">{lang === 'en' ? 'Mobile:' : 'মোবাইল:'}</span>
                <span className="font-mono text-gray-700 font-semibold">{customerMobile}</span>
              </div>
            )}
            {amount !== undefined && amount !== null && (
              <div className="flex justify-between items-center font-bold text-emerald-700 pt-1 border-t">
                <span>{lang === 'en' ? 'Amount / Total:' : 'টাকার পরিমাণ:'}</span>
                <span className="font-mono text-sm">৳ {Number(amount).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* শেয়ার অ্যাকশন বাটনসমূহ */}
          <div className="space-y-2">
            
            {/* বাটন ১: সম্পূর্ণ পিডিএফ সরাসরি শেয়ার (PDF File Share) */}
            <button
              onClick={handleSharePdf}
              disabled={isGenerating}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 text-indigo-950 font-bold text-xs transition cursor-pointer shadow-xs group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isGenerating && generationType === 'share' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Share2 size={18} />
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-indigo-900 text-[13px]">
                      {lang === 'en' ? 'Share Complete PDF File' : 'সম্পূর্ণ পিডিএফ ফাইল সরাসরি শেয়ার'}
                    </span>
                    <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                      Recommended
                    </span>
                  </div>
                  <div className="text-[11px] text-indigo-700 font-normal mt-0.5">
                    {lang === 'en' 
                      ? 'Share actual .pdf file via WhatsApp, Email, Telegram' 
                      : 'মোবাইল/ট্যাবলেটে সরাসরি হোয়াটসঅ্যাপ ও অন্যান্য অ্যাপে PDF ফাইল যাবে'}
                  </div>
                </div>
              </div>
              <Share2 size={16} className="text-indigo-600 group-hover:scale-110 transition" />
            </button>

            {/* বাটন ২: হোয়াটসঅ্যাপে পিডিএফ ও বিবরণ */}
            <button
              onClick={handleWhatsAppPdfShare}
              disabled={isGenerating}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 text-emerald-950 font-bold text-xs transition cursor-pointer shadow-xs group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isGenerating && generationType === 'whatsapp' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <MessageCircle size={18} />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-bold text-emerald-900 text-[13px]">
                    {lang === 'en' ? 'Send PDF via WhatsApp' : 'হোয়াটসঅ্যাপে পিডিএফ পাঠান'}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-normal mt-0.5">
                    {customerMobile 
                      ? `${customerMobile}-এ পিডিএফ ডাউনলোড ও চ্যাট ওপেন হবে` 
                      : (lang === 'en' ? 'Downloads PDF & opens customer WhatsApp' : 'পিডিএফ ডাউনলোড করে সরাসরি গ্রাহকের চ্যাট ওপেন')}
                  </div>
                </div>
              </div>
              <ExternalLink size={16} className="text-emerald-600 group-hover:translate-x-0.5 transition" />
            </button>

            {/* বাটন ৩: সরাসরি সম্পূর্ণ পিডিএফ ডাউনলোড */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100/90 border border-blue-300 text-blue-950 font-bold text-xs transition cursor-pointer shadow-xs group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isGenerating && generationType === 'download' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-bold text-blue-900 text-[13px]">
                    {lang === 'en' ? 'Download Complete PDF' : 'সম্পূর্ণ পিডিএফ ডাউনলোড করুন'}
                  </div>
                  <div className="text-[11px] text-blue-700 font-normal mt-0.5">
                    {lang === 'en' ? 'Save high-definition A4 PDF file to device' : 'কম্পিউটার বা ফোনে প্রিন্ট রেডি A4 PDF ফাইল সংরক্ষণ করুন'}
                  </div>
                </div>
              </div>
              <Download size={16} className="text-blue-600 group-hover:translate-y-0.5 transition" />
            </button>

            {/* বাটন ৪: ব্রাউজার প্রিন্ট / সেভ PDF */}
            <button
              onClick={handlePrintPdf}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer shadow-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <Printer size={16} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900">{lang === 'en' ? 'Print / Browser PDF Dialog' : 'প্রিন্ট / ব্রাউজার সেভ PDF'}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {lang === 'en' ? 'Direct physical printer or browser dialog' : 'ফিজিক্যাল প্রিন্টার বা ব্রাউজার প্রিন্ট উইন্ডো'}
                  </div>
                </div>
              </div>
              <Printer size={15} className="text-slate-500 group-hover:scale-105 transition" />
            </button>

            {/* বাটন ৫: টেক্সট সারাংশ কপি */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-500 text-white flex items-center justify-center shrink-0">
                  {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-800">
                    {copied 
                      ? (lang === 'en' ? 'Copied to Clipboard!' : 'কপি সম্পন্ন হয়েছে!') 
                      : (lang === 'en' ? 'Copy Text Summary' : 'শুধু লিখা / টেক্সট কপি করুন')}
                  </div>
                  <div className="text-[10px] text-gray-500 font-normal">
                    {lang === 'en' ? 'Copy plain text summary to clipboard' : 'মেসেজ আকারে পাঠাতে টেক্সট কপি করুন'}
                  </div>
                </div>
              </div>
              {copied ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Done
                </span>
              ) : (
                <Copy size={15} className="text-gray-400" />
              )}
            </button>

          </div>

          {/* লোডিং ইন্ডিকেটর বার্তা */}
          {isGenerating && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-center gap-2 text-xs text-blue-800 font-bold animate-pulse">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span>{lang === 'en' ? 'Generating complete A4 PDF...' : 'সম্পূর্ণ A4 পিডিএফ প্রস্তুত করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...'}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
