import React, { useState } from 'react';
import { X, Printer, Undo2, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { buildDocumentPdfFilename, triggerPrintWithFilename } from '../utils/pdfGenerator';

export default function SupplierReturnSlipModal({ slip, onClose, lang = 'bn' }) {
  if (!slip) return null;

  const [slipDocTitle, setSlipDocTitle] = useState(
    lang === 'en' ? 'SUPPLIER RETURN CHALLAN & SLIP' : 'কোম্পানি / সাপ্লায়ার পণ্য রিটার্ন চালান ও স্লিপ'
  );

  const formatDateDMY = (dateInput) => {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getSettlementLabel = (type) => {
    switch (type) {
      case 'Deduce_Payable':
        return lang === 'en' ? 'Deduce from Supplier Payable' : 'সাপ্লায়ারের বকেয়া থেকে সমন্বয়';
      case 'Cash_Refund':
        return lang === 'en' ? 'Instant Cash Refund Received' : 'নগদ ক্যাশ রিফান্ড প্রাপ্তি';
      case 'Stock_Only':
        return lang === 'en' ? 'Stock Adjustment Only' : 'শুধুমাত্র স্টক সমন্বয়';
      default:
        return type || (lang === 'en' ? 'Stock Settlement' : 'স্টক সমন্বয়');
    }
  };

  // সিরিয়াল নম্বর এরে বা স্ট্রিং পার্সিং
  const serialList = Array.isArray(slip.selected_serials)
    ? slip.selected_serials
    : Array.isArray(slip.serial_numbers)
    ? slip.serial_numbers
    : typeof slip.serial_numbers === 'string' && slip.serial_numbers.trim()
    ? slip.serial_numbers.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const returnSlipNo = slip.return_no || `RET-${slip.id || 'NEW'}`;
  const supplierName = slip.supplier_name || 'General Supplier / Company';
  const supplierMobile = slip.supplier_mobile || '';
  const supplierAddress = slip.supplier_address || '';
  const returnDate = slip.return_date || slip.created_at || new Date().toISOString();
  const quantity = Number(slip.quantity || (serialList.length > 0 ? serialList.length : 1));
  const unitPrice = Number(slip.unit_price || 0);
  const totalAmount = Number(slip.total_amount || (quantity * unitPrice));
  const returnReason = slip.reason || (lang === 'en' ? 'Defective / Return' : 'নষ্ট / ত্রুটিপূর্ণ পণ্য');
  const settlementType = slip.settlement_type || 'Deduce_Payable';
  const returnedBy = slip.returned_by || 'Admin';

  const handlePrint = () => {
    const filename = buildDocumentPdfFilename({
      customerName: supplierName.replace(/\s+/g, '_'),
      date: returnDate,
      type: 'Return_Slip',
      number: returnSlipNo
    });
    triggerPrintWithFilename(filename);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 py-6 md:py-8 z-50 overflow-y-auto print:static print:bg-white print:p-0">
      <div className="print-card-wrapper bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-0 relative flex flex-col print:shadow-none print:w-full print:m-0 print:border-none">
        
        {/* স্ক্রিন কন্ট্রোল হেডার (প্রিন্টে লুকানো থাকবে) */}
        <div className="sticky top-0 z-30 flex justify-between items-center p-4 border-b bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl print:hidden shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Undo2 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                {slipDocTitle}
              </h3>
              <p className="text-[11px] text-gray-500">
                {lang === 'en' ? 'Challan / Slip No: ' : 'চালান নং: '}
                <span className="font-mono font-bold text-amber-700">{returnSlipNo}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
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

        {/* প্রিন্ট উপযোগী চালান ও স্লিপ কন্টেন্ট */}
        <div 
          id="printable-content" 
          className="supplier-return-slip-printable p-6 md:p-8 bg-white text-gray-900 text-xs font-sans flex flex-col justify-between min-h-[960px] md:min-h-[1050px] box-border print:p-0 print:m-0 relative overflow-hidden border border-gray-100 rounded-b-2xl print:border-none"
        >
          {/* ব্যাকগ্রাউন্ড জলছাপ (Watermark) */}
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
                  <div className="inline-block bg-slate-900 text-white font-black text-[11px] px-3 py-1 uppercase rounded-md tracking-wider shadow-xs mb-1.5">
                    {slipDocTitle}
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <p className="text-gray-600">
                      {lang === 'en' ? 'Challan No: ' : 'চালান নং: '}
                      <span className="font-mono font-black text-slate-900">{returnSlipNo}</span>
                    </p>
                    <p className="text-gray-600">
                      {lang === 'en' ? 'Date: ' : 'তারিখ: '}
                      <span className="font-mono font-bold text-slate-900">{formatDateDMY(returnDate)}</span>
                    </p>
                    {returnedBy && (
                      <p className="text-gray-500 text-[10px]">
                        {lang === 'en' ? 'Handled By: ' : 'রিটার্নকারী: '}
                        <span className="font-semibold text-slate-800">{returnedBy}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* প্রাপক / কোম্পানি / সাপ্লায়ারের বিবরণ */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-200 pb-1 mb-1.5">
                    <Building2 size={13} className="text-amber-700" />
                    <span>{lang === 'en' ? 'Supplier / Company Information' : 'প্রাপক (কোম্পানি / সাপ্লায়ার বিবরণ)'}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p>
                      <span className="text-slate-500">{lang === 'en' ? 'Company Name: ' : 'কোম্পানি/সাপ্লায়ার নাম: '}</span>
                      <strong className="text-slate-900 font-black">{supplierName}</strong>
                    </p>
                    {supplierMobile && (
                      <p>
                        <span className="text-slate-500">{lang === 'en' ? 'Mobile: ' : 'মোবাইল: '}</span>
                        <strong className="text-slate-800 font-mono font-bold">{supplierMobile}</strong>
                      </p>
                    )}
                    {supplierAddress && (
                      <p className="text-[11px] text-slate-600">
                        <span className="text-slate-500">{lang === 'en' ? 'Address: ' : 'ঠিকানা: '}</span>
                        {supplierAddress}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-200 pb-1 mb-1.5">
                    <FileText size={13} className="text-blue-700" />
                    <span>{lang === 'en' ? 'Return Details & Settlement' : 'রিটার্ন ও সমন্বয় বিবরণ'}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p>
                      <span className="text-slate-500">{lang === 'en' ? 'Settlement: ' : 'নিষ্পত্তি পদ্ধতি: '}</span>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {getSettlementLabel(settlementType)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-500">{lang === 'en' ? 'Return Reason: ' : 'রিটার্নের কারণ: '}</span>
                      <strong className="text-rose-700 font-bold">{returnReason}</strong>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <span className="text-slate-500">{lang === 'en' ? 'Return Status: ' : 'রিটার্ন স্ট্যাটাস: '}</span>
                      <span className="font-semibold text-emerald-800">✅ {lang === 'en' ? 'Product Dispatched / Returned' : 'পণ্য হস্তান্তরকৃত'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* ফেরতকৃত পণ্যের টেবিল */}
              <div className="border border-slate-300 rounded-xl overflow-hidden mb-3">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px]">
                      <th className="p-2 text-center w-10">#</th>
                      <th className="p-2">{lang === 'en' ? 'Product Description & Model' : 'পণ্যের নাম ও মডেল বিবরণ'}</th>
                      <th className="p-2 text-center w-16">{lang === 'en' ? 'Qty' : 'পরিমাণ'}</th>
                      <th className="p-2 text-right w-24">{lang === 'en' ? 'Unit Price' : 'দর (৳)'}</th>
                      <th className="p-2 text-right w-28">{lang === 'en' ? 'Total (৳)' : 'মোট মূল্য (৳)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="align-top">
                      <td className="p-2.5 text-center font-mono font-bold text-slate-600">1</td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-950 text-sm">{slip.product_name || 'Product'}</div>
                        {slip.product_model && (
                          <div className="text-slate-600 text-[11px]">
                            {lang === 'en' ? 'Model: ' : 'মডেল: '}<span className="font-medium">{slip.product_model}</span>
                          </div>
                        )}
                        {slip.product_barcode && (
                          <div className="text-slate-500 text-[10px] font-mono">
                            {lang === 'en' ? 'Barcode: ' : 'বারকোড: '}{slip.product_barcode}
                          </div>
                        )}

                        {/* সিরিয়াল নম্বর তালিকা */}
                        {serialList.length > 0 && (
                          <div className="mt-2 p-2 bg-amber-50/70 rounded-lg border border-amber-200">
                            <span className="font-bold text-amber-900 text-[10px] uppercase block mb-1">
                              {lang === 'en' ? `Returned Serial Numbers (${serialList.length}):` : `ফেরতকৃত সিরিয়াল নম্বর (${serialList.length} টি):`}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {serialList.map((sn, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-0.5 bg-white border border-amber-300 rounded font-mono font-bold text-[11px] text-amber-950 shadow-2xs"
                                >
                                  {sn}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-slate-900 text-sm">
                        {quantity}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                        ৳{unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-slate-950 text-sm">
                        ৳{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                      <td colSpan={2} className="p-2 text-right uppercase text-[11px]">
                        {lang === 'en' ? 'Total Return Valuation:' : 'সর্বমোট ফেরত পণ্যের মূল্য:'}
                      </td>
                      <td className="p-2 text-center font-mono font-black">{quantity} টি</td>
                      <td></td>
                      <td className="p-2 text-right font-mono font-black text-sm text-slate-950">
                        ৳{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* সাপ্লায়ার রিসিভিং স্বীকৃতি ও অঙ্গীকারনামা */}
              <div className="border border-amber-300 bg-amber-50/40 rounded-xl p-3 text-xs space-y-1.5 mb-3">
                <div className="flex items-center gap-1.5 text-amber-950 font-black text-[11px] uppercase tracking-wide">
                  <CheckCircle2 size={14} className="text-amber-700" />
                  <span>{lang === 'en' ? 'Supplier Receiving Declaration & Acknowledgment' : 'সাপ্লায়ার / কোম্পানির পণ্য প্রাপ্তি স্বীকার ও ঘোষণা'}</span>
                </div>
                <p className="text-slate-800 leading-relaxed text-[11px]">
                  <strong>ঘোষণা:</strong> উপরিউক্ত বিবরণ অনুযায়ী উল্লেখিত পণ্যসমূহ এবং প্রতিটি সিরিয়াল নম্বর অক্ষত ও সঠিক অবস্থায় রিটার্ন বুঝিয়া পাইলাম। উক্ত পণ্যের মোট মূল্য (<span className="font-mono font-bold">৳{totalAmount.toLocaleString()}</span>) কোম্পানির হিসাব এবং চুক্তি অনুযায়ী যথাযথভাবে নিষ্পত্তি/সমন্বয় করা হইবে।
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  * এই রিটার্ন চালানটি উক্ত পণ্যের কোম্পানি বা সাপ্লায়ার কর্তৃক আনুষ্ঠানিকভাবে ফেরত গ্রহণের প্রামাণ্য দলিল হিসেবে গণ্য হইবে।
                </p>
              </div>
            </div>

            {/* স্বাক্ষর সেকশন (প্রেরক FC Technology ও গ্রহীতা সাপ্লায়ার) */}
            <div className="pt-4 mt-auto border-t-2 border-slate-300">
              <div className="grid grid-cols-2 gap-8 items-end text-xs pb-2">
                {/* প্রেরকের স্বাক্ষর ও সিল (FC Technology) */}
                <div className="text-center">
                  <img 
                    src="/authority_seal_signature.png" 
                    alt="Authorized Seal & Signature" 
                    className="h-14 object-contain mx-auto mb-1 select-none"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="border-t border-slate-600 pt-1.5 font-bold text-slate-900">
                    {lang === 'en' ? 'Authorized Signature & Seal' : 'প্রেরকের স্বাক্ষর ও সিল'}
                  </div>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                    FC TECHNOLOGY
                  </p>
                  <p className="text-[9px] text-slate-500">
                    তারিখ: {formatDateDMY(returnDate)}
                  </p>
                </div>

                {/* গ্রহীতার স্বাক্ষর ও সিল (সাপ্লায়ার/কোম্পানি) */}
                <div className="border border-slate-300 rounded-xl p-3 bg-white">
                  <div className="text-center mb-6">
                    <div className="h-10 border-b border-dashed border-slate-400"></div>
                    <div className="pt-1 font-bold text-slate-900 text-[11px]">
                      {lang === 'en' ? "Supplier's Receiving Signature & Seal" : 'পণ্য গ্রহণকারীর স্বাক্ষর ও অফিসিয়াল সিল'}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-[10px] text-slate-700">
                    <div className="flex items-center">
                      <span className="w-24 text-slate-500">{lang === 'en' ? 'Receiver Name:' : 'গ্রহণকারীর নাম:'}</span>
                      <span className="border-b border-dotted border-slate-400 flex-1 h-4"></span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-slate-500">{lang === 'en' ? 'Contact No:' : 'মোবাইল নং:'}</span>
                      <span className="border-b border-dotted border-slate-400 flex-1 h-4"></span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-slate-500">{lang === 'en' ? 'Received Date:' : 'গ্রহণের তারিখ:'}</span>
                      <span className="border-b border-dotted border-slate-400 flex-1 h-4"></span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-slate-500">{lang === 'en' ? 'Remarks/Note:' : 'মন্তব্য (যদি থাকে):'}</span>
                      <span className="border-b border-dotted border-slate-400 flex-1 h-4"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
