import React, { useState } from 'react';
import { X, Printer, Share2, Wrench, Shield, CheckCircle, Clock, Edit3 } from 'lucide-react';
import { buildDocumentPdfFilename, triggerPrintWithFilename } from '../utils/pdfGenerator';
import { formatDeviceCategory } from './WarrantyServiceModule';

export default function WarrantySlipPrintModal({ slip, onClose, onShare, onEdit, lang = 'bn' }) {
  if (!slip) return null;

  const [slipDocTitle, setSlipDocTitle] = useState(lang === 'en' ? 'WARRANTY & SERVICE SLIP' : 'ওয়ারেন্টি ও সার্ভিসিং স্লিপ');
  const [showSlipTitlePresets, setShowSlipTitlePresets] = useState(false);

  const formatDateDMY = (dateInput) => {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 py-6 md:py-8 z-50 overflow-y-auto print:static print:bg-white print:p-0">
      <div className="print-card-wrapper bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-0 relative flex flex-col print:shadow-none print:w-full print:m-0 print:border-none">
        
        {/* স্ক্রিন কন্ট্রোল হেডার - স্টিকি ও সহজে স্ক্রল উপযোগী */}
        <div className="sticky top-0 z-30 flex justify-between items-center p-4 border-b bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl print:hidden shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Wrench size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                {slipDocTitle || (lang === 'en' ? 'Warranty & Servicing Intake Slip' : 'ওয়ারেন্টি ও সার্ভিসিং গ্রহণ স্লিপ প্রিভিউ')}
              </h3>
              <p className="text-[11px] text-gray-500">
                টোকেন নং: <span className="font-mono font-bold text-amber-700">{slip.token_no}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  if (typeof onEdit === 'function') onEdit(slip);
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Edit3 size={15} /> {lang === 'en' ? 'Edit Slip' : 'স্লিপ এডিট'}
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare({ ...slip, custom_title: slipDocTitle })}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Share2 size={15} /> {lang === 'en' ? 'Share Slip' : 'শেয়ার করুন'}
              </button>
            )}
            <button
              onClick={() => triggerPrintWithFilename(buildDocumentPdfFilename({
                customerName: slip.customer_name,
                date: slip.received_date,
                type: 'Warranty_Slip',
                number: slip.token_no
              }))}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <Printer size={15} /> {lang === 'en' ? 'Print Slip / Save PDF' : 'প্রিন্ট স্লিপ / Save PDF'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 cursor-pointer transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* প্রিন্ট উপযোগী স্লিপ কন্টেন্ট */}
        <div 
          id="printable-content" 
          className="warranty-slip-printable p-6 md:p-8 bg-white text-gray-900 text-xs font-sans flex flex-col justify-between min-h-[960px] md:min-h-[1050px] box-border print:p-0 print:m-0 relative overflow-hidden border border-gray-100 rounded-b-2xl print:border-none"
        >
          
          {/* ব্যাকগ্রাউন্ড জলছাপ (Watermark) - লেখার বক্স থাকলেও সম্পূর্ণ প্রদর্শিত হবে */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <img 
              src="/fc_logo_watermark.png" 
              alt="FC Watermark" 
              className="w-80 md:w-[460px] max-w-[85%] opacity-[0.09] md:opacity-[0.11] select-none object-contain print:opacity-[0.09]" 
              onError={(e) => {
                e.target.src = '/fc_brand_watermark.png';
              }}
            />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
            <div>
              {/* লেটারহেড হেডার */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <img 
                    src="/fc_logo_icon.png" 
                    alt="FC Technology Logo" 
                    className="h-14 w-14 object-contain shrink-0" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-950 uppercase tracking-tight">FC Technology</h1>
                    <p className="text-gray-600 text-[11px] font-medium">
                      {lang === 'en' ? 'Trusted Provider of Computers, Laptops, CCTV & IT Solutions' : 'কম্পিউটার(ডেস্কটপ, ল্যাপটপ), সিসি ক্যামেরা ও আইটি পণ্যের বিশ্বস্ত প্রতিষ্ঠান'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {lang === 'en' ? 'Shop #18, RF Johura Tower, Ground Floor, Chowmuhani, Agrabad, Chattogram.' : 'দোকান নং #১৮, আর এফ জোহরা টাওয়ার, নীচ তলা, চৌমুহনী, আগ্রাবাদ, চট্টগ্রাম।'}
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Hotline: 09613-181920, 01812-091939 | Email: fctechnologist@gmail.com
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {/* কালো কালীর ঘরে ওয়ারেন্টি ও সার্ভিসিং স্লিপ লেখাটি এডিটেবল */}
                  <div className="relative inline-block text-right group mb-1.5">
                    <div className="flex items-center justify-end gap-1">
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const val = e.currentTarget.textContent?.trim();
                          if (val) setSlipDocTitle(val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        title={lang === 'en' ? "Click to edit title" : "ক্লিক করে এই লেখাটি এডিট করুন"}
                        className="inline-block bg-slate-900 text-white font-black text-[11px] px-3 py-1 uppercase rounded-md tracking-wider shadow-xs cursor-text hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                      >
                        {slipDocTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSlipTitlePresets(!showSlipTitlePresets)}
                        className="print:hidden p-1 text-gray-400 hover:text-amber-600 rounded cursor-pointer transition"
                        title={lang === 'en' ? "Title Presets & Edit" : "শিরোনাম প্রিসেট ও পরিবর্তন"}
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                    <span className="print:hidden text-[9px] text-gray-400 block -mt-0.5 group-hover:text-amber-700 transition select-none">
                      ✏️ {lang === 'en' ? 'Click text to edit' : 'ক্লিক করে এডিট করুন'}
                    </span>

                    {/* দ্রুত শিরোনাম পরিবর্তন পপওভার */}
                    {showSlipTitlePresets && (
                      <div className="print:hidden absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 text-left">
                        <p className="text-[10px] font-bold text-gray-500 uppercase px-1 mb-1">
                          {lang === 'en' ? 'Select or Edit Title:' : 'শিরোনাম নির্বাচন করুন:'}
                        </p>
                        <div className="space-y-1">
                          {[
                            'ওয়ারেন্টি ও সার্ভিসিং স্লিপ',
                            'ওয়ারেন্টি স্লিপ',
                            'সার্ভিসিং স্লিপ',
                            'ওয়ারেন্টি ও সার্ভিসিং গ্রহণ স্লিপ',
                            'পণ্য গ্রহণ ও সার্ভিসিং রসিদ',
                            'WARRANTY & SERVICE SLIP'
                          ].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setSlipDocTitle(t);
                                setShowSlipTitlePresets(false);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs transition cursor-pointer ${slipDocTitle === t ? 'bg-amber-50 font-bold text-amber-800' : 'hover:bg-gray-100 text-gray-800'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-1">
                          <input
                            type="text"
                            value={slipDocTitle}
                            onChange={(e) => setSlipDocTitle(e.target.value)}
                            placeholder={lang === 'en' ? 'Custom title...' : 'কাস্টম শিরোনাম...'}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSlipTitlePresets(false)}
                            className="px-2 py-1 bg-amber-600 text-white rounded text-xs font-bold cursor-pointer hover:bg-amber-700"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-bold text-gray-800">
                    {lang === 'en' ? 'Token No:' : 'টোকেন নং:'} <span className="font-mono text-amber-700 font-black text-sm">{slip.token_no}</span>
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {lang === 'en' ? 'Received Date:' : 'গ্রহণের তারিখ:'} <span className="font-bold">{formatDateDMY(slip.received_date)}</span>
                  </p>
                  <p className="text-[11px] font-bold text-blue-700 mt-0.5">
                    {lang === 'en' ? 'Service Type:' : 'সার্ভিস টাইপ:'} <span className="uppercase">
                      {slip.service_type === 'ওয়ারেন্টি' || slip.service_type === 'Warranty' 
                        ? (lang === 'en' ? 'Warranty' : 'ওয়ারেন্টি') 
                        : (lang === 'en' ? 'Servicing' : 'সার্ভিসিং')}
                    </span>
                  </p>
                </div>
              </div>

              {/* কাস্টমার ও পণ্যের বিবরণ ২ কলাম কার্ড - ট্রান্সপারেন্ট ব্যাকগ্রাউন্ড যাতে জলছাপ ঢেকে না যায় */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* কাস্টমার তথ্য */}
                <div className="warranty-transparent-box bg-transparent p-3 rounded-xl border border-slate-300 print:bg-transparent">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    {lang === 'en' ? 'Customer Details:' : 'গ্রাহকের বিবরণ (Customer Details):'}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">{slip.customer_name}</h3>
                  <p className="text-xs text-slate-700 mt-0.5">
                    <strong>{lang === 'en' ? 'Mobile:' : 'মোবাইল:'}</strong> <span className="font-mono font-bold text-blue-700">{slip.customer_mobile}</span>
                  </p>
                  {slip.customer_address && (
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      <strong>{lang === 'en' ? 'Address:' : 'ঠিকানা:'}</strong> {slip.customer_address}
                    </p>
                  )}
                  <div className="mt-2 pt-2 border-t border-slate-200/80 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">{lang === 'en' ? 'Received By:' : 'গ্রহণকারী ব্যক্তি:'}</span>
                    <span className="font-bold text-slate-800 bg-transparent px-2 py-0.5 rounded border border-slate-300">{slip.received_by || 'Admin'}</span>
                  </div>
                </div>

                {/* পণ্য ও তারিখের তথ্য */}
                <div className="warranty-transparent-box bg-transparent p-3 rounded-xl border border-slate-300 print:bg-transparent">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    {lang === 'en' ? 'Product Details & Tracking:' : 'পণ্যের বিবরণ ও ট্র্যাকিং:'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{slip.product_name}</h4>
                    {slip.device_category && (
                      <span className="text-[10px] font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                        {formatDeviceCategory(slip.device_category, lang)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700 mt-1">
                    <p><strong>{lang === 'en' ? 'Model:' : 'মডেল:'}</strong> <span className="font-mono">{slip.model_no || '-'}</span></p>
                    <p><strong>{lang === 'en' ? 'Serial/Barcode:' : 'সিরিয়াল/বারকোড:'}</strong> <span className="font-mono text-purple-700">{slip.serial_no || '-'}</span></p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-3 gap-1 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">{lang === 'en' ? 'Received Date:' : 'গ্রহণের তারিখ:'}</span>
                      <span className="font-bold text-slate-800">{formatDateDMY(slip.received_date)}</span>
                    </div>
                    <div>
                      <span className="text-rose-600 font-bold block text-[10px]">{lang === 'en' ? 'Promised Delivery:' : 'সম্ভাব্য প্রদানের তারিখ:'}</span>
                      <span className="font-bold text-rose-700 font-mono">{formatDateDMY(slip.estimated_delivery_date)}</span>
                    </div>
                    {slip.delivery_date && (
                      <div>
                        <span className="text-emerald-700 font-bold block text-[10px]">{lang === 'en' ? 'Delivered Date:' : 'ডেলিভারি তারিখ:'}</span>
                        <span className="font-black text-emerald-800 font-mono">{formatDateDMY(slip.delivery_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* মূল সমস্যা এবং আনুষঙ্গিক গ্রহণ সেকশন - ট্রান্সপারেন্ট ব্যাকগ্রাউন্ড */}
              <div className="space-y-2.5 mb-3">
                {/* সমস্যা */}
                <div className="warranty-transparent-box bg-transparent border border-amber-300 rounded-xl p-3 print:bg-transparent">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-1">
                    <Wrench size={13} className="text-amber-700" /> {lang === 'en' ? 'Reported Problem Description:' : 'গ্রাহকের উল্লিখিত সমস্যা / ত্রুটির বিবরণ (Reported Problem):'}
                  </span>
                  <p className="text-xs font-semibold text-slate-900 whitespace-pre-wrap leading-relaxed">
                    {slip.problem_description}
                  </p>
                </div>

                {/* আনুষঙ্গিক সামগ্রী গ্রহণ */}
                <div className="warranty-transparent-box bg-transparent border border-blue-300 rounded-xl p-3 print:bg-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block mb-0.5">
                      {lang === 'en' ? 'Accessories Received with Device:' : 'পন্যের সাথে আনুষঙ্গিক কিছু গ্রহণ করা হয়েছে কিনা (Accessories Received):'}
                    </span>
                    <p className="text-xs text-slate-800 font-medium">
                      {slip.has_accessories === 'হ্যাঁ' || slip.has_accessories === 'Yes' || (slip.accessories_received && slip.accessories_received.trim() !== '') ? (
                        <span className="text-blue-900 font-bold">
                          {lang === 'en' ? '✅ Yes, Accessories Received: ' : '✅ হ্যাঁ, গ্রহণকৃত সামগ্রী: '}
                          <span className="font-semibold text-slate-900">{slip.accessories_received || (lang === 'en' ? 'Adapter/Charger/Cable' : 'অ্যাডাপ্টার/চার্জার/ক্যাবল')}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">
                          {lang === 'en' ? '❌ No accessories received (Main device only).' : '❌ পণ্য ব্যতীত সাথে অন্য কোনো আনুষঙ্গিক সামগ্রী গ্রহণ করা হয়নি (শুধুমাত্র মূল ডিভাইস)।'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 block">{lang === 'en' ? 'Status:' : 'বর্তমান স্ট্যাটাস:'}</span>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                      {lang === 'en' 
                        ? (slip.status === 'গ্রহণকৃত' ? 'Received' : slip.status === 'প্রক্রিয়াধীন' ? 'In Progress' : slip.status === 'সার্ভিসিং সম্পন্ন' ? 'Ready for Delivery' : slip.status === 'ডেলিভারি সম্পন্ন' ? 'Delivered' : slip.status || 'Received')
                        : (slip.status || 'গ্রহণকৃত')}
                    </span>
                  </div>
                </div>

                {/* আর্থিক বিবরণ: ডেলিভারি সম্পন্ন হলে চূড়ান্ত বিল ও পেমেন্ট বিবরণ, অথবা সম্ভাব্য খরচ */}
                {(slip.status === 'ডেলিভারি সম্পন্ন' || Number(slip.final_cost || 0) > 0) ? (
                  <div className="warranty-transparent-box bg-transparent border border-emerald-400 rounded-xl p-3 text-xs print:bg-transparent space-y-2">
                    <div className="flex justify-between items-center border-b border-emerald-200/80 pb-1.5">
                      <span className="font-bold text-emerald-950 uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <CheckCircle size={13} className="text-emerald-600" /> {lang === 'en' ? 'Service Bill & Payment Settlement' : 'সার্ভিসিং বিল ও পেমেন্ট নিষ্পত্তি'}
                      </span>
                      {slip.delivery_date && (
                        <span className="font-bold text-slate-700 text-[11px]">
                          {lang === 'en' ? 'Delivery Date: ' : 'ডেলিভারি তারিখ: '}<span className="text-emerald-800 font-mono">{formatDateDMY(slip.delivery_date)}</span>
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div className="p-1.5 bg-slate-50/80 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">{lang === 'en' ? 'Total Bill:' : 'মোট চার্জ / বিল:'}</span>
                        <span className="font-black text-sm text-slate-900 font-mono">৳{Number(slip.final_cost || slip.estimated_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="p-1.5 bg-emerald-50/80 rounded border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 block">{lang === 'en' ? 'Paid Amount:' : 'পরিশোধিত (জমা):'}</span>
                        <span className="font-black text-sm text-emerald-800 font-mono">৳{Number(slip.paid_amount || slip.advance_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="p-1.5 bg-rose-50/80 rounded border border-rose-200">
                        <span className="text-[10px] text-rose-700 block">{lang === 'en' ? 'Due Amount:' : 'বকেয়া (বাকি):'}</span>
                        <span className="font-black text-sm text-rose-800 font-mono">৳{Number(slip.due_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="p-1.5 bg-amber-50/80 rounded border border-amber-200 flex flex-col justify-center">
                        <span className="text-[10px] text-amber-800 block">{lang === 'en' ? 'Payment Status:' : 'পেমেন্ট ধরন:'}</span>
                        <span className={`font-black text-xs uppercase ${Number(slip.due_amount || 0) > 0 || slip.payment_status === 'বাকি' ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {slip.payment_status || (Number(slip.due_amount || 0) > 0 ? (lang === 'en' ? 'Due' : 'বাকি') : (lang === 'en' ? 'Paid' : 'নগদ'))} {slip.payment_method ? `(${slip.payment_method})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (Number(slip.estimated_cost || 0) > 0 || Number(slip.advance_paid || 0) > 0) ? (
                  <div className="warranty-transparent-box bg-transparent border border-emerald-300 rounded-xl p-2.5 flex justify-between items-center text-xs print:bg-transparent">
                    <div>
                      <span className="text-emerald-800 font-bold">{lang === 'en' ? 'Estimated Cost (BDT):' : 'সম্ভাব্য সার্ভিসিং খরচ (৳):'}</span>
                      <span className="ml-1.5 font-mono font-bold text-slate-900">{Number(slip.estimated_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-emerald-800 font-bold">{lang === 'en' ? 'Advance Paid (BDT):' : 'অগ্রিম জমা (৳):'}</span>
                      <span className="ml-1.5 font-mono font-bold text-emerald-700">{Number(slip.advance_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-rose-700 font-bold">{lang === 'en' ? 'Due on Delivery (BDT):' : 'ডেলিভারির সময় প্রদেয় (৳):'}</span>
                      <span className="ml-1.5 font-mono font-black text-rose-700">
                        {Math.max(0, Number(slip.estimated_cost || 0) - Number(slip.advance_paid || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* নীতিমালা ও শর্তাবলী - ট্রান্সপারেন্ট ব্যাকগ্রাউন্ড */}
              <div className="warranty-transparent-box border border-slate-300 rounded-xl p-2.5 text-[10px] text-slate-700 bg-transparent print:bg-transparent space-y-1 mb-2">
                <p className="font-bold text-slate-800 underline">{lang === 'en' ? 'Terms & Conditions:' : 'গুরুত্বপূর্ণ শর্তাবলী (Terms & Conditions):'}</p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                  <li>{lang === 'en' ? 'This slip must be presented during product pickup. No goods will be handed over without this slip.' : 'পণ্য ফেরতের সময় এই স্লিপটি অবশ্যই প্রদর্শন করতে হবে। স্লিপ ব্যতীত পণ্য হস্তান্তর করা হবে না।'}</li>
                  <li>{lang === 'en' ? 'Customer will be notified by call/SMS upon service completion. Authority is not liable for goods uncollected after 30 days.' : 'সার্ভিসিং সম্পন্ন বা প্রস্তুত হওয়ার পর গ্রাহককে এসএমএস/ফোনে জানানো হবে। বিজ্ঞপ্তির ৩০ দিনের মধ্যে পণ্য ডেলিভারি না নিলে পণ্যের কোনো ক্ষয়ক্ষতির জন্য কর্তৃপক্ষ দায়ী থাকবে না।'}</li>
                  <li>{lang === 'en' ? 'Company and manufacturer warranty policy applies (burn, physical damage, short circuit excluded).' : 'ওয়ারেন্টিযুক্ত পণ্যের ক্ষেত্রে কোম্পানি বা সাপ্লায়ারের ওয়ারেন্টি পলিসি (বার্ন, ফিজিক্যাল ড্যামেজ, শর্ট সার্কিট ইত্যাদি বাদ দিয়ে) প্রযোজ্য হবে।'}</li>
                  <li>{lang === 'en' ? 'Customer is solely responsible for data backup. Pre-service data backup is advised.' : 'পণ্য সার্ভিসিংয়ের সময় ডেটা হারানোর কোনো ঝুঁকি থাকলে তার সম্পূর্ণ দায়িত্ব গ্রাহকের। সার্ভিসিংয়ের পূর্বে ডেটা ব্যাকআপ রাখার পরামর্শ দেওয়া হচ্ছে।'}</li>
                </ol>
              </div>
            </div>

            {/* গ্রাহকের স্বাক্ষর, কর্তৃপক্ষের স্বাক্ষর ও সিল - পেইজের একদম নিচে */}
            <div className="warranty-signatures flex justify-between items-end pt-6 mt-auto text-xs w-full pb-2">
              <div className="text-center w-52">
                <div className="border-t border-slate-500 pt-1.5 font-bold text-slate-800">
                  {lang === 'en' ? "Customer's Signature" : "গ্রাহকের স্বাক্ষর"}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {lang === 'en' ? "Customer Signature & Acceptance" : "স্বাক্ষর ও সম্মতি"}
                </p>
              </div>

              <div className="text-center w-60">
                <img 
                  src="/authority_seal_signature.png" 
                  alt="Authorized Seal & Signature" 
                  className="h-16 object-contain mx-auto mb-1 select-none"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="border-t border-slate-600 pt-1 font-bold text-slate-900">
                  {lang === 'en' ? "Authorized Signature & Seal" : "কর্তৃপক্ষের স্বাক্ষর ও সিল"}
                </div>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                  FC TECHNOLOGY
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
