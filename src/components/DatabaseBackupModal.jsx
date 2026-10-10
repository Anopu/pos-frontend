import React, { useState } from 'react';
import { Database, Download, Upload, ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, X, Server, HardDrive, Globe, Info, FileCode } from 'lucide-react';

export default function DatabaseBackupModal({ isOpen, onClose, lang = 'bn', onRestoreSuccess }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('backup'); // 'backup' | 'guide'

  if (!isOpen) return null;

  const txt = (bn, en) => (lang === 'en' ? en : bn);

  const getApiBase = () => {
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
    return `http://${host}:5010/api`;
  };

  // ১. SQL ব্যাকআপ ডাউনলোড
  const handleDownloadSql = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`${getApiBase()}/backup/download-sql`);
      if (!response.ok) {
        throw new Error('সার্ভার থেকে SQL ব্যাকআপ তৈরি ব্যর্থ হয়েছে!');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `pos_shop_backup_${timestamp}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage({
        type: 'success',
        text: txt('✅ SQL ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে! আপনার ডাউনলোড ফোল্ডারে সেভ হয়েছে।', '✅ SQL backup downloaded successfully to your Downloads folder!')
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: txt('❌ ব্যাকআপ নিতে সমস্যা হয়েছে: ' + err.message, '❌ Backup error: ' + err.message)
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ২. JSON ব্যাকআপ ডাউনলোড
  const handleDownloadJson = async () => {
    setIsExportingJson(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`${getApiBase()}/backup/download-json`);
      if (!response.ok) {
        throw new Error('সার্ভার থেকে JSON ব্যাকআপ তৈরি ব্যর্থ হয়েছে!');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      a.download = `pos_shop_backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMessage({
        type: 'success',
        text: txt('✅ JSON ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে!', '✅ JSON backup downloaded successfully!')
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: txt('❌ ব্যাকআপ নিতে সমস্যা হয়েছে: ' + err.message, '❌ Backup error: ' + err.message)
      });
    } finally {
      setIsExportingJson(false);
    }
  };

  // ৩. ব্যাকআপ ফাইল রিস্টোর (SQL বা JSON)
  const handleRestoreFile = async () => {
    if (!selectedFile) {
      alert(txt('অনুগ্রহ করে একটি .sql অথবা .json ফাইল নির্বাচন করুন!', 'Please select a .sql or .json file!'));
      return;
    }

    const confirmRestore = window.confirm(
      txt(
        '⚠️ সতর্কতা: আপনি কি নিশ্চিত যে এই ব্যাকআপ ফাইলটি থেকে ডাটাবেজ রিস্টোর করতে চান? এটি পূর্বের ডাটা আপডেট করবে!',
        '⚠️ Warning: Are you sure you want to restore from this backup file? This will overwrite existing database records!'
      )
    );
    if (!confirmRestore) return;

    setIsRestoring(true);
    setStatusMessage(null);

    try {
      const isSql = selectedFile.name.toLowerCase().endsWith('.sql');
      const isJson = selectedFile.name.toLowerCase().endsWith('.json');

      if (isSql) {
        const textContent = await selectedFile.text();
        const response = await fetch(`${getApiBase()}/backup/restore-sql`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          body: textContent
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || 'SQL রিস্টোর ব্যর্থ হয়েছে');
      } else if (isJson) {
        const textContent = await selectedFile.text();
        const jsonData = JSON.parse(textContent);
        const response = await fetch(`${getApiBase()}/backup/restore-json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonData)
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || 'JSON রিস্টোর ব্যর্থ হয়েছে');
      } else {
        throw new Error(txt('শুধু .sql অথবা .json ফাইল সমর্থিত!', 'Only .sql or .json files are supported!'));
      }

      setStatusMessage({
        type: 'success',
        text: txt('🎉 অভিনন্দন! ডাটাবেজ সফলভাবে রিস্টোর সম্পন্ন হয়েছে। ২ সেকেন্ডের মধ্যে পেজ রিলোড হবে...', '🎉 Database restored successfully! Reloading in 2 seconds...')
      });

      setSelectedFile(null);
      setTimeout(() => {
        if (onRestoreSuccess) onRestoreSuccess();
        window.location.reload();
      }, 2000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: txt('❌ রিস্টোর ব্যর্থ হয়েছে: ' + err.message, '❌ Restore failed: ' + err.message)
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b1739] text-slate-100 rounded-3xl border border-blue-900/60 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* হেডার */}
        <div className="p-6 bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900/60 border-b border-blue-900/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <Database size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>{txt('ডাটাবেজ ব্যাকআপ ও রিস্টোর', 'Database Backup & Restore')}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                  pos_shop (MySQL)
                </span>
              </h2>
              <p className="text-xs text-blue-200/70">
                {txt('আপনার শপ ও আইএসপির সমস্ত তথ্য সহজে ব্যাকআপ এবং রিস্টোর করার কেন্দ্রীয় প্যানেল', 'Central panel to easily backup and restore all shop & ISP data')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ট্যাব নেভিগেশন */}
        <div className="flex border-b border-blue-900/40 bg-[#08112b] px-6 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'backup'
                ? 'border-blue-500 text-blue-400 bg-blue-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive size={15} />
            <span>{txt('১-ক্লিকে ব্যাকআপ ও রিস্টোর', '1-Click Backup & Restore')}</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe size={15} />
            <span>{txt('বাসা ও দোকানে একসাথে চালানোর নির্দেশিকা', 'Shop & Home Sync Guide')}</span>
          </button>
        </div>

        {/* কনটেন্ট বডি */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl flex items-start gap-3 text-xs border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
              <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">×</button>
            </div>
          )}

          {activeTab === 'backup' ? (
            <div className="space-y-6">
              {/* ডাটাবেজ স্টোরেজ তথ্য কার্ড */}
              <div className="bg-[#081330] p-4 rounded-2xl border border-blue-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Server size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {txt('ডাটা কোথায় সংরক্ষণ হচ্ছে?', 'Where is your data stored?')}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {txt(
                        'আপনার কম্পিউটার এর XAMPP MySQL সার্ভারে "pos_shop" ডাটাবেজে সমস্ত ইনভয়েস, স্টক, কাস্টমার, আইএসপি এবং ওয়ারেন্টি তথ্য রিয়েল-টাইমে সংরক্ষিত হচ্ছে।',
                        'All invoices, inventory, customers, ISP bills & warranty slips are saved in real-time in MySQL database "pos_shop" inside XAMPP.'
                      )}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-[11px] font-mono text-emerald-400 shrink-0">
                  C:\xampp\mysql\data\pos_shop
                </div>
              </div>

              {/* গ্রিড: ১. ব্যাকআপ ডাউনলোড এবং ২. রিস্টোর */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* অপশন ১: ব্যাকআপ ডাউনলোড */}
                <div className="bg-[#091538] p-5 rounded-2xl border border-blue-800/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                        <Download size={16} />
                      </div>
                      <h3 className="text-sm font-black text-white">
                        {txt('১. ব্যাকআপ ডাউনলোড করুন', '1. Download Backup')}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {txt(
                        'যেকোনো সময় ১-ক্লিকে সম্পূর্ণ ডাটাবেজ ব্যাকআপ ফাইল ডাউনলোড করে আপনার পেনড্রাইভ বা গুগল ড্রাইভে সেভ রাখতে পারেন।',
                        'Download full database dump anytime in 1-click and save it to your Pen Drive or Google Drive.'
                      )}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      onClick={handleDownloadSql}
                      disabled={isExporting}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isExporting ? <RefreshCw size={15} className="animate-spin" /> : <FileCode size={15} />}
                      <span>{txt('SQL ব্যাকআপ ফাইল ডাউনলোড (.sql)', 'Download SQL Backup (.sql)')}</span>
                    </button>

                    <button
                      onClick={handleDownloadJson}
                      disabled={isExportingJson}
                      className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isExportingJson ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                      <span>{txt('বিকল্প JSON ব্যাকআপ (.json)', 'Alternative JSON Backup (.json)')}</span>
                    </button>
                  </div>
                </div>

                {/* অপশন ২: ব্যাকআপ রিস্টোর */}
                <div className="bg-[#091538] p-5 rounded-2xl border border-blue-800/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                        <Upload size={16} />
                      </div>
                      <h3 className="text-sm font-black text-white">
                        {txt('২. পূর্বের ব্যাকআপ রিস্টোর', '2. Restore Previous Backup')}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {txt(
                        'নতুন উইন্ডোজ দেওয়ার পর আপনার সংরক্ষিত .sql ফাইলটি এখানে আপলোড করে ১-ক্লিকে সকল পূর্বের ডাটা ফিরিয়ে আনতে পারেন।',
                        'After Windows reinstall, upload your saved .sql file here to restore all previous sales, stock and customers.'
                      )}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <label className="block w-full border-2 border-dashed border-blue-900/80 hover:border-blue-500/60 rounded-xl p-2.5 text-center cursor-pointer transition bg-slate-900/40">
                      <input
                        type="file"
                        accept=".sql,.json"
                        onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                        className="hidden"
                      />
                      <span className="text-xs text-slate-300 truncate block">
                        {selectedFile ? `📄 ${selectedFile.name}` : txt('📁 ফাইল সিলেক্ট করুন (.sql / .json)', '📁 Choose File (.sql / .json)')}
                      </span>
                    </label>

                    <button
                      onClick={handleRestoreFile}
                      disabled={isRestoring || !selectedFile}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      {isRestoring ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
                      <span>{txt('ডাটাবেজ রিস্টোর করুন', 'Restore Database Now')}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* ডেক্সটপ স্ক্রিপ্ট সুবিধা */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                <Info size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-300">
                    {txt('💡 ডেক্সটপ ১-ক্লিক ব্যাকআপ স্ক্রিপ্ট তৈরি করা আছে:', '💡 Desktop 1-Click Backup scripts are ready:')}
                  </span>
                  <p className="text-slate-400">
                    {txt(
                      'আপনার Downloads ফোল্ডারে "Backup_POS_Database.bat" এবং "Restore_POS_Database.bat" ফাইল রাখা হয়েছে। আপনি যেকোনো সময় শুধু ডাবল-ক্লিক করলেই ডেক্সটপে "POS_Data_Backups" ফোল্ডারে তারিখসহ অটো ব্যাকআপ তৈরি হবে।',
                      'Batch files "Backup_POS_Database.bat" and "Restore_POS_Database.bat" are placed in your Downloads folder. Double-clicking will instantly save timestamped backups on your Desktop.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ট্যাব ২: বাসা ও দোকানে একসাথে চালানোর পূর্ণাঙ্গ গাইড */
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="bg-gradient-to-r from-blue-950/80 to-indigo-950/80 p-4 rounded-2xl border border-blue-900/60">
                <h3 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                  <Globe size={16} className="text-blue-400" />
                  <span>{txt('একই সাথে বাসায় এবং দোকানে সফটওয়্যার চালানোর ৩টি সেরা উপায়', '3 Best Ways to Run the Software at Both Shop and Home')}</span>
                </h3>
                <p className="text-slate-300">
                  {txt(
                    'দোকানে বসে ক্যাশিয়ার বা সেলসম্যান বিল করবে এবং আপনি বাসায় বসে রিয়েল-টাইমে সমস্ত সেলস, স্টক ও আইএসপি বিল মনিটর বা এন্ট্রি করতে পারবেন। এর জন্য নিচের যেকোনো একটি পদ্ধতি অনুসরণ করতে পারেন:',
                    'Staff sells at shop while you monitor and manage sales, stock, and ISP billing from home in real-time. Follow any of the methods below:'
                  )}
                </p>
              </div>

              {/* মেথড ১: Tailscale (ফ্রি ও সহজতম ভিপিএন) */}
              <div className="bg-[#091538] p-4 rounded-2xl border border-blue-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                    <span>১. Tailscale ভিপিএন (প্রস্তাবিত ও ১০০% ফ্রি ও নিরাপদ)</span>
                  </h4>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    সবচেয়ে সহজ
                  </span>
                </div>
                <p className="text-slate-300">
                  Tailscale দিয়ে কোনো রাউটার বা আইপি কনফিগারেশন ছাড়াই দোকান ও বাসার কম্পিউটারের মধ্যে নিরাপদ ভার্চুয়াল নেটওয়ার্ক তৈরি করা যায়।
                </p>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5 text-slate-300 font-mono text-[11px]">
                  <div>• ১. দোকানের পিসি এবং বাসার ল্যাপটপ/পিসিতে <strong>tailscale.com</strong> থেকে ফ্রি সফটওয়্যার নামিয়ে একই জিমেইল দিয়ে লগইন করুন।</div>
                  <div>• ২. Tailscale দোকানের পিসির জন্য একটি ব্যক্তিগত আইপি দেবে (যেমন: <code>100.85.20.10</code>)।</div>
                  <div>• ৩. বাসার পিসির ব্রাউজারে শুধু টাইপ করবেন: <code>http://100.85.20.10:5173</code></div>
                  <div>• মুহূর্তেই বাসা থেকে সফটওয়্যারটি হুবহু ওপেন হবে এবং দোকানের সাথে সরাসরি লাইভ কানেক্ট থাকবে!</div>
                </div>
              </div>

              {/* মেথড ২: সেন্ট্রাল ক্লাউড ডাটাবেজ */}
              <div className="bg-[#091538] p-4 rounded-2xl border border-blue-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sky-400 text-sm flex items-center gap-2">
                    <span>২. কেন্দ্রীয় ক্লাউড ডাটাবেজ (Central Cloud Database)</span>
                  </h4>
                  <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    প্রফেশনাল
                  </span>
                </div>
                <p className="text-slate-300">
                  আপনার MySQL ডাটাবেজটি কোনো ক্লাউড সার্ভারে (যেমন: Aiven, Railway, Render অথবা আপনার নিজস্ব cPanel ডোমেন হোস্টিং)-এ হোস্ট করা যায়।
                </p>
                <p className="text-slate-400">
                  এতে দোকানের কম্পিউটার বন্ধ থাকলেও বাসা থেকে পুরো সফটওয়্যার চালানো যাবে, এবং যেকোনো সময় যেকোনো মোবাইল, ট্যাব বা ল্যাপটপ দিয়ে ডাটাবেজ এক্সেস করা যাবে।
                </p>
              </div>

              {/* মেথড ৩: রিমোট ডেস্কটপ */}
              <div className="bg-[#091538] p-4 rounded-2xl border border-blue-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <span>৩. রিমোট ডেস্কটপ (AnyDesk / Chrome Remote Desktop)</span>
                  </h4>
                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    জিরো সেটআপ
                  </span>
                </div>
                <p className="text-slate-300">
                  দোকানের পিসি চালু থাকলে বাসা থেকে <strong>AnyDesk</strong> বা <strong>Chrome Remote Desktop</strong>-এর মাধ্যমে সরাসরি দোকানের স্ক্রিন ওপেন করে কাজ করা। কোনো সার্ভার বা নেটওয়ার্ক সেটিংস পরিবর্তনের প্রয়োজন হয় না।
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ফুটার */}
        <div className="p-4 bg-[#08112b] border-t border-blue-900/40 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            {txt('বন্ধ করুন', 'Close')}
          </button>
        </div>

      </div>
    </div>
  );
}
