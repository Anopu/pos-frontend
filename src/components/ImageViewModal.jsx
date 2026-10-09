import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Image as ImageIcon } from 'lucide-react';

export default function ImageViewModal({ isOpen, onClose, imageSrc, title = 'ইমেজ ভিউয়ার', lang = 'bn' }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !imageSrc) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => { setScale(1); setRotation(0); };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${title.replace(/[\s/]/g, '_')}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-700">
        {/* শীর্ষ কন্ট্রোল বার */}
        <div className="p-3.5 bg-slate-800/90 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="text-blue-400" size={18} />
            <h3 className="font-bold text-sm text-slate-100">{title}</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 cursor-pointer transition"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 cursor-pointer transition"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 cursor-pointer transition"
              title="Rotate"
            >
              <RotateCw size={16} />
            </button>
            <button
              onClick={handleReset}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-300 cursor-pointer transition"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleDownload}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold flex items-center gap-1 text-white cursor-pointer transition shadow-xs"
              title="Download Image"
            >
              <Download size={14} /> {lang === 'en' ? 'Download' : 'ডাউনলোড'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer transition ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ইমেজ প্রদর্শনী এরিয়া */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60 min-h-[400px]">
          <div className="transition-transform duration-150 ease-out flex items-center justify-center" style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}>
            <img
              src={imageSrc}
              alt={title}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg select-none"
            />
          </div>
        </div>

        {/* ফুটার */}
        <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-center text-xs text-slate-400">
          {lang === 'en' 
            ? 'Use zoom buttons or rotate to inspect document details' 
            : 'জুম বা রোটেট করে রসিদ ও বিলের সম্পূর্ণ বিবরণ স্পষ্ট দেখুন'}
        </div>
      </div>
    </div>
  );
}
