import React from 'react';
import { 
  ShoppingCart, Wrench, TrendingUp, RotateCcw, Barcode, FileText, 
  Users, Truck, Shield, DollarSign, Bell, Receipt, ArrowRight, 
  Sparkles, ShieldCheck, Activity, PackageCheck, AlertCircle 
} from 'lucide-react';

export default function DashboardView({ 
  onNavigate, 
  currentUser, 
  stats = {}, 
  lang = 'bn',
  t = (k) => k
}) {
  const {
    todaySales = 0,
    todayCash = 0,
    totalCustomerDue = 0,
    todayNetProfit = 0,
    totalProducts = 0,
    lowStockCount = 0,
    activeWarrantyCount = 0,
    supplierDue = 0,
    pendingChequesCount = 0
  } = stats;

  const cards = [
    {
      id: 'pos',
      title: t('cardPosTitle'),
      desc: t('cardPosDesc'),
      actionText: t('cardPosBtn'),
      icon: ShoppingCart,
      gradient: 'from-blue-600 to-indigo-700',
      accentBg: 'bg-blue-50 text-blue-700 border-blue-200',
      badge: lang === 'en' ? `Today's Sales: ৳${Number(todaySales).toLocaleString()}` : `আজকের বিক্রয়: ৳${Number(todaySales).toLocaleString()}`,
      badgeColor: 'bg-blue-600 text-white',
      shadowColor: 'hover:shadow-blue-500/20 hover:border-blue-400'
    },
    {
      id: 'warranty_service',
      title: t('cardWarrantyTitle'),
      desc: t('cardWarrantyDesc'),
      actionText: t('cardWarrantyBtn'),
      icon: Wrench,
      gradient: 'from-amber-500 to-orange-600',
      accentBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: lang === 'en' ? `Active Jobs: ${activeWarrantyCount}` : `চলমান কাজ: ${activeWarrantyCount} টি`,
      badgeColor: 'bg-amber-600 text-white',
      shadowColor: 'hover:shadow-amber-500/20 hover:border-amber-400'
    },
    {
      id: 'inventory',
      title: t('cardInventoryTitle'),
      desc: t('cardInventoryDesc'),
      actionText: t('cardInventoryBtn'),
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-700',
      accentBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: lang === 'en' 
        ? `Total Items: ${totalProducts} ${lowStockCount > 0 ? `(${lowStockCount} Low)` : ''}`
        : `মোট পণ্য: ${totalProducts} টি ${lowStockCount > 0 ? `(${lowStockCount} টি সতর্ক)` : ''}`,
      badgeColor: lowStockCount > 0 ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white',
      shadowColor: 'hover:shadow-emerald-500/20 hover:border-emerald-400'
    },
    {
      id: 'returns',
      title: t('cardReturnsTitle'),
      desc: t('cardReturnsDesc'),
      actionText: t('cardReturnsBtn'),
      icon: RotateCcw,
      gradient: 'from-rose-500 to-red-600',
      accentBg: 'bg-rose-50 text-rose-700 border-rose-200',
      badge: lang === 'en' ? 'Instant Barcode Return' : 'তাত্ক্ষণিক বারকোড রিটার্ন',
      badgeColor: 'bg-rose-600 text-white',
      shadowColor: 'hover:shadow-rose-500/20 hover:border-rose-400'
    },
    {
      id: 'barcode_search',
      title: t('cardBarcodeHistoryTitle'),
      desc: t('cardBarcodeHistoryDesc'),
      actionText: t('cardBarcodeHistoryBtn'),
      icon: Barcode,
      gradient: 'from-purple-600 to-violet-700',
      accentBg: 'bg-purple-50 text-purple-700 border-purple-200',
      badge: lang === 'en' ? 'Lifecycle Audit' : 'লাইফসাইকেল অডিট',
      badgeColor: 'bg-purple-600 text-white',
      shadowColor: 'hover:shadow-purple-500/20 hover:border-purple-400'
    },
    {
      id: 'quotation',
      title: t('cardQuotationTitle'),
      desc: t('cardQuotationDesc'),
      actionText: t('cardQuotationBtn'),
      icon: FileText,
      gradient: 'from-sky-500 to-blue-600',
      accentBg: 'bg-sky-50 text-sky-700 border-sky-200',
      badge: lang === 'en' ? 'Letterhead Quotation' : 'ব্র্যান্ডেড লেটারহেড কোটেশন',
      badgeColor: 'bg-sky-600 text-white',
      shadowColor: 'hover:shadow-sky-500/20 hover:border-sky-400'
    },
    {
      id: 'customers',
      title: t('cardCustomersTitle'),
      desc: t('cardCustomersDesc'),
      actionText: t('cardCustomersBtn'),
      icon: Users,
      gradient: 'from-teal-600 to-emerald-700',
      accentBg: 'bg-teal-50 text-teal-700 border-teal-200',
      badge: lang === 'en' ? `Total Due: ৳${Number(totalCustomerDue).toLocaleString()}` : `মোট বকেয়া: ৳${Number(totalCustomerDue).toLocaleString()}`,
      badgeColor: 'bg-teal-700 text-white',
      shadowColor: 'hover:shadow-teal-500/20 hover:border-teal-400'
    },
    {
      id: 'suppliers',
      title: t('cardSuppliersTitle'),
      desc: t('cardSuppliersDesc'),
      actionText: t('cardSuppliersBtn'),
      icon: Truck,
      gradient: 'from-cyan-600 to-blue-700',
      accentBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      badge: lang === 'en' ? `Payable: ৳${Number(supplierDue).toLocaleString()}` : `দেনা: ৳${Number(supplierDue).toLocaleString()}`,
      badgeColor: 'bg-cyan-700 text-white',
      shadowColor: 'hover:shadow-cyan-500/20 hover:border-cyan-400'
    },
    {
      id: 'supplier_warranty',
      title: t('cardSupplierWarrantyTitle'),
      desc: t('cardSupplierWarrantyDesc'),
      actionText: t('cardSupplierWarrantyBtn'),
      icon: Shield,
      gradient: 'from-violet-600 to-purple-600',
      accentBg: 'bg-violet-50 text-violet-700 border-violet-200',
      badge: lang === 'en' ? 'Supplier Slip Photo Tracking' : 'সাপ্লায়ার স্লিপ ইমেজ ট্র্যাকিং',
      badgeColor: 'bg-violet-700 text-white',
      shadowColor: 'hover:shadow-violet-500/20 hover:border-violet-400'
    },
    {
      id: 'expenses',
      title: t('cardExpensesTitle'),
      desc: t('cardExpensesDesc'),
      actionText: t('cardExpensesBtn'),
      icon: DollarSign,
      gradient: 'from-green-600 to-emerald-600',
      accentBg: 'bg-green-50 text-green-700 border-green-200',
      badge: lang === 'en' ? 'Shop Rent & Expenses' : 'দোকান ভাড়ার ব্যাংক রশিদসহ ব্যয়',
      badgeColor: 'bg-green-700 text-white',
      shadowColor: 'hover:shadow-green-500/20 hover:border-green-400'
    },
    {
      id: 'cheques',
      title: t('cardChequesTitle'),
      desc: t('cardChequesDesc'),
      actionText: t('cardChequesBtn'),
      icon: Bell,
      gradient: 'from-amber-600 to-yellow-600',
      accentBg: 'bg-amber-50 text-amber-700 border-amber-200',
      badge: pendingChequesCount > 0 
        ? (lang === 'en' ? `${pendingChequesCount} Alerts Due` : `${pendingChequesCount} টি তাগিদ`)
        : (lang === 'en' ? 'Cheque Drawer Clearance' : 'চেক ড্রয়ার ক্লিয়ারেন্স'),
      badgeColor: pendingChequesCount > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-white',
      shadowColor: 'hover:shadow-yellow-500/20 hover:border-yellow-400'
    },
    {
      id: 'reports',
      title: t('cardReportsTitle'),
      desc: t('cardReportsDesc'),
      actionText: t('cardReportsBtn'),
      icon: Receipt,
      gradient: 'from-fuchsia-600 to-pink-600',
      accentBg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      badge: lang === 'en' ? 'Audit Analytics' : 'অডিট অ্যানালিটিক্স',
      badgeColor: 'bg-fuchsia-700 text-white',
      shadowColor: 'hover:shadow-fuchsia-500/20 hover:border-fuchsia-400',
      adminOnly: true
    }
  ];

  return (
    <div className="relative overflow-hidden min-h-[85vh] py-2">
      {/* সফটওয়্যার এর ড্যাশবোর্ডের ব্যাকগ্রাউন্ডে FC Technology এর লোগোটি জলছাপ */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <img 
          src="/fc_brand_watermark.png" 
          alt="FC Technology Watermark" 
          className="w-[520px] md:w-[700px] opacity-[0.055] object-contain transition-all duration-700"
          onError={(e) => {
            // fallback if fc_brand_watermark fails
            e.target.src = '/fc_logo_watermark.png';
          }}
        />
      </div>

      <div className="relative z-10 space-y-6">
        {/* ড্যাশবোর্ড হেডার */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/30 shrink-0 flex items-center justify-center">
              <img 
                src="/fc_logo_icon.png" 
                alt="FC Logo" 
                className="w-12 h-12 object-contain rounded-[14px] bg-white p-0.5" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black tracking-tight text-white">
                  FC TECHNOLOGY
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  {lang === 'en' ? 'Smart POS Hub' : 'স্মার্ট শপ ড্যাশবোর্ড'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {t('dashboardSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                {lang === 'en' ? 'Logged In Staff' : 'লগইনকৃত ইউজার'}
              </span>
              <span className="text-xs font-bold text-slate-100 flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {currentUser?.fullname || 'Admin'} ({currentUser?.role === 'admin' ? t('userRoleAdmin') : t('userRoleSales')})
              </span>
            </div>
          </div>
        </div>

        {/* এক্সিকিউটিভ কেপিআই স্ট্যাটাস ওভারভিউ স্ট্রিপ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* আজকের বিক্রয় */}
          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-blue-100 shadow-xs hover:shadow-md transition">
            <span className="text-[11px] font-bold text-blue-700 block">{t('statTodaySales')}</span>
            <h3 className="text-lg md:text-xl font-black text-blue-950 mt-1 font-mono">
              ৳ {Number(todaySales).toLocaleString()}
            </h3>
            <span className="text-[10px] text-blue-600 block mt-0.5">{lang === 'en' ? 'Real-time sales' : 'রিয়েল-টাইম বিক্রয়'}</span>
          </div>

          {/* আজকের নগদ */}
          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-teal-100 shadow-xs hover:shadow-md transition">
            <span className="text-[11px] font-bold text-teal-700 block">{t('statTodayCash')}</span>
            <h3 className="text-lg md:text-xl font-black text-teal-950 mt-1 font-mono">
              ৳ {Number(todayCash).toLocaleString()}
            </h3>
            <span className="text-[10px] text-teal-600 block mt-0.5">{lang === 'en' ? 'Cash in drawer' : 'ক্যাশ জমা'}</span>
          </div>

          {/* কাস্টমার বাকি */}
          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-rose-100 shadow-xs hover:shadow-md transition">
            <span className="text-[11px] font-bold text-rose-700 block">{t('statTotalDue')}</span>
            <h3 className="text-lg md:text-xl font-black text-rose-950 mt-1 font-mono">
              ৳ {Number(totalCustomerDue).toLocaleString()}
            </h3>
            <span className="text-[10px] text-rose-600 block mt-0.5">{lang === 'en' ? 'All customers' : 'সকল গ্রাহক'}</span>
          </div>

          {/* নিট মুনাফা */}
          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-emerald-100 shadow-xs hover:shadow-md transition">
            <span className="text-[11px] font-bold text-emerald-700 block">{t('statNetProfit')}</span>
            <h3 className={`text-lg md:text-xl font-black mt-1 font-mono ${todayNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {todayNetProfit >= 0 ? '+' : ''}৳ {Number(todayNetProfit).toLocaleString()}
            </h3>
            <span className="text-[10px] text-emerald-600 block mt-0.5">{lang === 'en' ? 'Profit after expenses' : 'খরচ বাদে মুনাফা'}</span>
          </div>

          {/* মোট পণ্য সংখ্যা */}
          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-indigo-100 shadow-xs hover:shadow-md transition">
            <span className="text-[11px] font-bold text-indigo-700 block">{t('statTotalProducts')}</span>
            <h3 className="text-lg md:text-xl font-black text-indigo-950 mt-1 font-mono">
              {totalProducts} {lang === 'en' ? 'pcs' : 'টি'}
            </h3>
            <span className="text-[10px] text-indigo-600 block mt-0.5">{lang === 'en' ? 'Stock inventory' : 'স্টক ইনভেন্টরি'}</span>
          </div>

          {/* চলমান ওয়ারেন্টি ও সার্ভিসিং */}
          <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-amber-100 shadow-xs hover:shadow-md transition">
            <span className="text-[11px] font-bold text-amber-700 block">{t('statActiveWarranty')}</span>
            <h3 className="text-lg md:text-xl font-black text-amber-950 mt-1 font-mono">
              {activeWarrantyCount} {lang === 'en' ? 'jobs' : 'টি'}
            </h3>
            <span className="text-[10px] text-amber-600 block mt-0.5">{lang === 'en' ? 'Active intakes' : 'গ্রহণকৃত স্লিপ'}</span>
          </div>
        </div>

        {/* প্রতিটি অপশন ভিন্ন ভিন্ন রঙে সাজানো কার্ড গ্রিড */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
          {cards.map((card) => {
            if (card.adminOnly && currentUser?.role !== 'admin') return null;
            const Icon = card.icon;

            return (
              <div
                key={card.id}
                onClick={() => onNavigate(card.id)}
                className={`group bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${card.shadowColor}`}
              >
                {/* কার্ডের শীর্ষে উজ্জ্বল অ্যাকসেন্ট স্ট্রিপ */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${card.gradient}`} />

                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    {/* আইকন বক্স - সম্পূর্ণ ভিন্ন রঙ ও গ্রেডিয়েন্টে */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.gradient} flex items-center justify-center text-white shadow-md shadow-slate-200 shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={22} />
                    </div>

                    {/* ব্যাজ */}
                    {card.badge && (
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-2xs text-right leading-tight max-w-[65%] truncate ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                    {card.actionText}
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-600 transition-colors shrink-0">
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
