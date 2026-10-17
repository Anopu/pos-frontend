import React, { useState, useMemo } from 'react';
import {
  Camera, Shield, Laptop, Monitor, Cpu, Wifi, Printer, Phone,
  MessageSquare, MapPin, Clock, CheckCircle2, Star, ArrowRight,
  ExternalLink, Menu, X, ChevronRight, ShoppingCart, Globe,
  Wrench, Zap, Award, Headset, Send, Layers, HardDrive,
  Check, Play, Sparkles, ChevronDown, HelpCircle, PhoneCall,
  Search, Smartphone, Tablet as TabletIcon, Server, Database,
  Gamepad2, Watch, Headphones, Coffee, Lock, Video, Flame,
  Radio, Tv, Box, SlidersHorizontal, ShieldCheck
} from 'lucide-react';

export default function FcTechnologyWebsite({ onOpenPos, lang = 'bn', onToggleLang, currentUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCatalogCategory, setActiveCatalogCategory] = useState('security');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    phone: '',
    service: 'Security',
    details: ''
  });
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const isBn = lang === 'bn';
  const txt = (bn, en) => (isBn ? bn : en);

  const HOTLINE_1 = '09613-181920';
  const HOTLINE_2 = '01812-091939';
  const WHATSAPP_NUM = '8801812091939';
  const ADDRESS_BN = 'দোকান নং #১৮, আর এফ জোহরা টাওয়ার (নীচ তলা), চৌমুহনী, আগ্রাবাদ, চট্টগ্রাম।';
  const ADDRESS_EN = 'Shop #18, RF Zohura Tower (Ground Floor), Chowmuhani, Agrabad, Chattogram.';

  // ইউজার প্রদত্ত সম্পূর্ণ ক্যাটাগরি ও সাব-আইটেম তালিকা (Comprehensive Category Taxonomy)
  const catalogCategories = [
    {
      id: 'security',
      nameEn: 'Security',
      nameBn: 'সিকিউরিটি ও সার্ভিলেন্স',
      icon: <Lock className="w-5 h-5" />,
      color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
      items: [
        'WiFi Camera', 'IP Camera', 'CC Camera', 'PTZ Camera', 'Solar Camera',
        'CC Camera Package', 'IP Camera Package', 'DVR', 'NVR', 'XVR',
        'CC Camera Accessories', 'Door Lock', 'Smart Door Bell', 'Access Control',
        'Entrance Control', 'Digital Locker & Vault', 'KVM Switch'
      ]
    },
    {
      id: 'camera',
      nameEn: 'Camera',
      nameBn: 'ক্যামেরা ও ফটোগ্রাফি',
      icon: <Video className="w-5 h-5" />,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30',
      items: [
        'DSLR', 'Digital Camera', 'Handycam', 'Camera Lenses', 'Action Camera',
        'Mirrorless Camera', 'Video Camera', 'Dash Cam', 'Instant Camera',
        'Body Camera', 'Camera Tripod', 'Camera Accessories'
      ]
    },
    {
      id: 'networking',
      nameEn: 'Networking',
      nameBn: 'নেটওয়ার্কিং ও ইন্টারনেট',
      icon: <Wifi className="w-5 h-5" />,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      items: [
        'Starlink', 'Router', 'Pocket Router', 'WiFi Range Extender', 'Access Point',
        'WiFi Adapter', 'Network Switch', 'Firewall', 'ONU', 'OLT', 'Media Converter',
        'Network Transceivers', 'Networking Cable', 'Patch Cord', 'Connector',
        'Modular Jack', 'Faceplate', 'Patch Panel', 'LAN Card', 'PoE Injector',
        'Crimping Tool', 'Splicer Machine', 'Cable Tester'
      ]
    },
    {
      id: 'office',
      nameEn: 'Office Equipment',
      nameBn: 'অফিস ইকুইপমেন্ট ও প্রিন্টার',
      icon: <Printer className="w-5 h-5" />,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
      items: [
        'Projector', 'Conference System', 'PA System', 'Interactive Flat Panel',
        'Video Wall', 'Signage Kiosk', 'Printer', 'Laser Printer', 'Large Format Printer',
        'ID Card Printer', 'POS Printer', 'Label Printer', 'Digital Weight Machine',
        'Photocopier', 'Toner Cartridge', 'Ink Bottle', 'Ribbon', 'Printer Paper',
        'Printer Drum', 'Scanner', 'Barcode Scanner', 'Cash Drawer', 'Telephone Set',
        'IP Phone', 'PABX System', 'Money Counting Machine', 'Paper Shredder',
        'Laminating Machine', 'Binding Machine'
      ]
    },
    {
      id: 'server',
      nameEn: 'Server & Storage',
      nameBn: 'সার্ভার ও এন্টারপ্রাইজ স্টোরেজ',
      icon: <Server className="w-5 h-5" />,
      color: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30',
      items: [
        'Server', 'GPU Server', 'Workstation', 'Server Rack', 'NAS Storage',
        'SAN Storage', 'DAS Storage', 'Server HDD', 'Server HDD Bay',
        'Server RAM', 'Server SSD', 'Server Power Supply'
      ]
    },
    {
      id: 'gaming',
      nameEn: 'Gaming',
      nameBn: 'গেমিং গিয়ার ও এক্সেসরিজ',
      icon: <Gamepad2 className="w-5 h-5" />,
      color: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/30',
      items: [
        'Gaming Chair', 'Gaming Desk', 'Keyboard', 'Mouse', 'Headphone',
        'Mouse Pad', 'VR', 'Gamepad', 'Racing Wheel', 'Gaming Console', 'Gaming Gear'
      ]
    },
    {
      id: 'gadget',
      nameEn: 'Gadget',
      nameBn: 'স্মার্ট গ্যাজেট ও লাইফস্টাইল',
      icon: <Watch className="w-5 h-5" />,
      color: 'from-teal-500/20 to-cyan-500/10 text-teal-400 border-teal-500/30',
      items: [
        'Smart Watch', 'Smart Band', 'Earphone', 'Earbuds', 'Neckband',
        'Smart Ring', 'Smart Glasses', 'Power Bank', 'Car Charger', 'TV Box',
        'Health Monitor', 'Studio Equipment', 'Drones', 'Gimbal', 'Calculator',
        'Stream Deck', 'Power Tools', 'Radio'
      ]
    },
    {
      id: 'accessories',
      nameEn: 'Accessories',
      nameBn: 'কম্পিউটার ও আইটি এক্সেসরিজ',
      icon: <Headphones className="w-5 h-5" />,
      color: 'from-indigo-500/20 to-sky-500/10 text-indigo-400 border-indigo-500/30',
      items: [
        'Keyboard', 'Mouse', 'Headphone', 'Bluetooth Headphone', 'Mouse Pad',
        'Wrist Rest', 'Headphone Stand', 'Speaker & Home Theater', 'Monitor Light Bar',
        'Bluetooth Speakers', 'Webcam', 'Soundbar', 'Cable Converter', 'Card Reader',
        'Hubs & Docks', 'Microphone', 'Digital Voice Recorder', 'Presenter',
        'Memory Card', 'Sound Card', 'Capture Card', 'Pen Drive', 'Thermal Paste',
        'HDD-SSD Enclosure', 'Power Strip', 'Bluetooth Adapter'
      ]
    },
    {
      id: 'desktop',
      nameEn: 'Desktop',
      nameBn: 'ডেস্কটপ ও ম্যাক',
      icon: <Monitor className="w-5 h-5" />,
      color: 'from-blue-600/20 to-sky-500/10 text-sky-400 border-sky-500/30',
      items: [
        'AI PC', 'Desktop Offer', 'Star PC', 'Gaming PC', 'Brand PC',
        'All-in-One PC', 'Portable Mini PC', 'Apple Mac Mini', 'Apple iMac',
        'Apple Mac Studio', 'Apple Mac Pro'
      ]
    },
    {
      id: 'laptop',
      nameEn: 'Laptop',
      nameBn: 'ল্যাপটপ ও নোটবুক',
      icon: <Laptop className="w-5 h-5" />,
      color: 'from-indigo-600/20 to-blue-500/10 text-indigo-400 border-indigo-500/30',
      items: [
        'Laptop', 'Gaming Laptop', 'Premium Ultrabook', 'Laptop Bag', 'Laptop Accessories'
      ]
    },
    {
      id: 'component',
      nameEn: 'Component',
      nameBn: 'পিসি কম্পোনেন্টস',
      icon: <Cpu className="w-5 h-5" />,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      items: [
        'Processor', 'CPU Cooler', 'Motherboard', 'Graphics Card', 'RAM (Desktop)',
        'RAM (Laptop)', 'Power Supply', 'Hard Disk Drive', 'Portable Hard Disk Drive',
        'SSD', 'Portable SSD', 'Casing', 'Casing Cooler', 'Optical Disk Drive',
        'Vertical GPU Holder', 'Water / Liquid Cooler'
      ]
    },
    {
      id: 'monitor',
      nameEn: 'Monitor',
      nameBn: 'মনিটর ও ডিসপ্লে',
      icon: <Tv className="w-5 h-5" />,
      color: 'from-violet-500/20 to-indigo-500/10 text-violet-400 border-violet-500/30',
      items: [
        'Gaming Monitor', 'Curved Monitor', 'Touch Monitor', '4K Monitor', 'Portable Monitor',
        'Monitor Arm', 'MSI', 'AOC', 'Asus', 'Lenovo', 'BenQ', 'LG', 'Acer', 'HP',
        'Dell', 'Samsung', 'Gigabyte', 'Philips', 'ViewSonic', 'Corsair', 'ThundeRobot',
        'Koorui', 'Dahua', 'PC Power', 'Hikvision', 'Eurovision', 'Walton', 'Arzopa',
        'GEESUU', 'Alimoto', 'Thermaltake', 'Smart', 'Titan Army', 'Value-Top', 'AIWA',
        'Xiaomi', 'Fopo', 'Gigasonic', 'TrendSonic', 'FeuVision'
      ]
    },
    {
      id: 'power',
      nameEn: 'Power',
      nameBn: 'পাওয়ার, ইউপিএস ও সোলার',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
      items: [
        'Online UPS', 'Mini UPS', 'Portable Power Station', 'IPS', 'UPS Battery',
        'Voltage Stabilizer', 'Inverter', 'Solar Panel', 'Solar Battery'
      ]
    },
    {
      id: 'software',
      nameEn: 'Software',
      nameBn: 'সফটওয়্যার ও ক্লাউড সলিউশন',
      icon: <Database className="w-5 h-5" />,
      color: 'from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/30',
      items: [
        'Operating System', 'Office Application', 'Database', 'Server Solution',
        'Mail Server Solution', 'Cloud Solutions', 'Antivirus', 'Bangla Typing Software',
        'Adobe', 'VMware', 'AutoDesk', 'AnyDesk'
      ]
    },
    {
      id: 'appliance',
      nameEn: 'Appliance',
      nameBn: 'হোম ও ইলেকট্রনিক অ্যাপ্লায়েন্স',
      icon: <Coffee className="w-5 h-5" />,
      color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30',
      items: [
        'AC', 'Air Cooler', 'Air Curtain', 'Fan', 'Light', 'Air Fryer', 'Oven',
        'Cooker', 'Electric Cooker', 'Induction Cooker', 'Toaster', 'Kitchen Hood',
        'Blender & Grinder', 'Juicer', 'Electric Kettle', 'Fridge', 'Washing Machine',
        'Vacuum Cleaner', 'Geyser', 'Room Heater', 'Air Purifier', 'Dehumidifier',
        'Iron', 'Sewing Machine', 'Coffee Maker', 'Dishwasher', 'Gas Stove'
      ]
    },
    {
      id: 'tablet',
      nameEn: 'Tablet',
      nameBn: 'ট্যাবলেট ও ড্রয়িং প্যাড',
      icon: <TabletIcon className="w-5 h-5" />,
      color: 'from-fuchsia-500/20 to-pink-500/10 text-fuchsia-400 border-fuchsia-500/30',
      items: [
        'Graphics Tablet', 'Kids Tablet', 'iPad', 'Lenovo', 'Samsung', 'HONOR',
        'Xiaomi', 'Walton', 'Huion', 'HUAWEI', 'Chuwi', 'Amazon', 'Google',
        'OnePlus', 'Teclast', 'ZTE', 'Infinix', 'reMarkable', 'Tecno', 'Stylus Pen'
      ]
    },
    {
      id: 'phone',
      nameEn: 'Phone',
      nameBn: 'স্মার্টফোন ও মোবাইল ফোন',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'from-green-500/20 to-emerald-500/10 text-green-400 border-green-500/30',
      items: [
        'Feature Phone', 'iPhone', 'Samsung', 'Google', 'Redmi', 'Realme',
        'Vivo', 'OPPO', 'HONOR', 'HUAWEI', 'OnePlus', 'TECNO', 'Infinix',
        'Helio', 'ZTE', 'HTC', 'Mobile Accessories'
      ]
    }
  ];

  // ফিল্টার করা আইটেমসমূহ
  const currentCategoryObj = useMemo(() => {
    return catalogCategories.find(c => c.id === activeCatalogCategory) || catalogCategories[0];
  }, [activeCatalogCategory]);

  const searchedItems = useMemo(() => {
    if (!catalogSearch.trim()) return null;
    const q = catalogSearch.toLowerCase().trim();
    const results = [];
    catalogCategories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.toLowerCase().includes(q)) {
          results.push({ item, catName: cat.nameEn, catBn: cat.nameBn, catId: cat.id });
        }
      });
    });
    return results;
  }, [catalogSearch]);

  // প্রধান সেবাসমূহ
  const services = [
    {
      id: 'cctv',
      icon: <Camera className="w-8 h-8 text-cyan-400" />,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
      titleBn: 'সিসি ক্যামেরা ও সিকিউরিটি সার্ভিলেন্স',
      titleEn: 'CCTV & Security Surveillance',
      descBn: 'উচ্চমানের এইচডি ও আইপি ক্যামেরা ইনস্টলেশন, ডিভিআর/এনভিআর কনফিগারেশন, মোবাইলে লাইভ স্ট্রিমিং ও ২৪/৭ সুরক্ষা ব্যবস্থা।',
      descEn: 'High-definition HD & IP camera installation, DVR/NVR setup, mobile live streaming & 24/7 round-the-clock security.',
      featuresBn: ['HD & IP নাইট ভিশন ক্যামেরা', 'মোবাইল ও পিসিতে লাইভ ভিউ', 'দোকান, অফিস ও বাসা সেটআপ', 'ফুল ওয়ারেন্টি ও ইনস্টলেশন সাপোর্ট'],
      featuresEn: ['HD & IP Night Vision Cameras', 'Live View on Mobile & PC', 'Shop, Office & Home Setup', 'Full Warranty & On-site Support']
    },
    {
      id: 'computer',
      icon: <Monitor className="w-8 h-8 text-blue-400" />,
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
      titleBn: 'কম্পিউটার ও কাস্টম পিসি বিল্ড',
      titleEn: 'Desktop & Custom PC Build',
      descBn: 'অফিসিয়াল কাজ, গ্রাফিক্স ডিজাইন, ভিডিও এডিটিং ও গেমিংয়ের জন্য পারফেক্ট কনফিগারেশন কাস্টম ডেস্কটপ পিসি বিল্ড।',
      descEn: 'High-performance custom desktop PCs configured for office work, graphic design, 4K video editing, and gaming.',
      featuresBn: ['ব্র্যান্ড ও কাস্টম বিল্ড পিসি', 'বাজেট অনুযায়ী সেরা কনফিগ', '১০০% জেনুইন কম্পোনেন্টস', 'ইনস্ট্যান্ট অ্যাসেম্বল ও টেস্টিং'],
      featuresEn: ['Brand & Custom Build PC', 'Best Config within Budget', '100% Genuine Components', 'Instant Assembly & Testing']
    },
    {
      id: 'laptop',
      icon: <Laptop className="w-8 h-8 text-indigo-400" />,
      color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30',
      titleBn: 'ল্যাপটপ সেলস ও সার্ভিসিং',
      titleEn: 'Laptop Sales & Servicing',
      descBn: 'ব্র্যান্ড নিউ ও অথেনটিক ফ্রেশ রিকন্ডিশনড ল্যাপটপ। সাথে থাকছে ডিসপ্লে, ব্যাটারি, র‍্যাম-এসএসডি আপগ্রেড সুবিধা।',
      descEn: 'Brand-new & authentic reconditioned laptops with display, battery, keyboard replacements, and RAM/SSD upgrades.',
      featuresBn: ['Dell, HP, Lenovo, Asus ব্র্যান্ড', 'র‍্যাম ও হাই স্পিড SSD আপগ্রেড', 'ব্যাটারি ও অরিজিনাল চার্জার', 'বিশেষ সার্ভিস ওয়ারেন্টি'],
      featuresEn: ['Dell, HP, Lenovo, Asus Brands', 'RAM & High-speed SSD Upgrade', 'Original Battery & Charger', 'Dedicated Service Warranty']
    },
    {
      id: 'repair',
      icon: <Wrench className="w-8 h-8 text-amber-400" />,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
      titleBn: 'হার্ডওয়্যার ও চিপ-লেভেল সার্ভিসিং',
      titleEn: 'Hardware & Chip-Level Repair',
      descBn: 'অভিজ্ঞ হার্ডওয়্যার ইঞ্জিনিয়ার দ্বারা কম্পিউটার, ল্যাপটপ, মাদারবোর্ড ও ইলেকট্রনিক ডিভাইসের নির্ভরযোগ্য চিপ-লেভেল মেরামত।',
      descEn: 'Professional chip-level repairs for motherboards, desktop PCs, laptops, displays, and electronic accessories.',
      featuresBn: ['মাদারবোর্ড ও পাওয়ার সমাধান', 'উইন্ডোজ ও সফটওয়্যার সেটআপ', 'হারানো ডাটা রিকভারি', 'দ্রুত ডেলিভারি ও ওয়ারেন্টি'],
      featuresEn: ['Motherboard & Power Fixes', 'OS & Professional Software Setup', 'Data Recovery Assistance', 'Quick Delivery & Repair Guarantee']
    },
    {
      id: 'networking',
      icon: <Wifi className="w-8 h-8 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
      titleBn: 'নেটওয়ার্কিং ও অফিস ল্যান সলিউশন',
      titleEn: 'Networking & Office LAN Solutions',
      descBn: 'অফিস, শোরুম ও ফ্ল্যাটের জন্য ফুল নেটওয়ার্কিং ক্যাবলিং, রাউটার, সুইচ, অপটিক্যাল ফাইবার ও ওয়াইফাই জোন সেটআপ।',
      descEn: 'Structured cabling, gigabit routers, switches, optical fiber setups, and seamless high-speed WiFi zones.',
      featuresBn: ['গিগাবিট রাউটার ও সুইচ', 'ক্যাট-৬ ল্যান ক্যাবলিং', 'অপটিক্যাল ফাইবার কানেক্টিভিটি', 'ফুল অফিস অটোমেশন সেটআপ'],
      featuresEn: ['Gigabit Routers & Switches', 'Cat-6 Structured Cabling', 'Optical Fiber Connectivity', 'Full Office Automation Setup']
    },
    {
      id: 'accessories',
      icon: <Printer className="w-8 h-8 text-purple-400" />,
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
      titleBn: 'প্রিন্টার, টোনার ও আইটি এক্সেসরিজ',
      titleEn: 'Printers, Toner & IT Accessories',
      descBn: 'ক্যানন, এপসন ও এইচপি প্রিন্টার, আসল টোনার-কালি, ইউপিএস, সাউন্ড সিস্টেম, কীবোর্ড-মাউস ও কম্পিউটার এক্সেসরিজ।',
      descEn: 'Canon, Epson & HP printers, original ink/toner bottles, UPS power backups, speaker sets, keyboards, and accessories.',
      featuresBn: ['লেজার ও কালার ইঙ্কজেট প্রিন্টার', 'জেনুইন টোনার ও রিফিল কালি', 'অফলাইন ও অনলাইন ইউপিএস', 'সকল প্রয়োজনীয় ক্যাবল ও পার্টস'],
      featuresEn: ['Laser & Inkjet Color Printers', 'Genuine Toner & Refill Ink', 'Offline & Online UPS Systems', 'All Essential Cables & Parts']
    }
  ];

  // বিশেষ প্যাকেজসমূহ
  const packages = [
    {
      titleBn: '৪-ক্যামেরা সিসিটিভি ফুল সিকিউরিটি প্যাকেজ',
      titleEn: '4-Camera Complete CCTV Security Package',
      tagBn: 'বাসা ও দোকানের জন্য সেরা',
      tagEn: 'Best for Home & Shop',
      priceBn: '১২,৯৯৯ ৳',
      priceEn: '৳ 12,999',
      popular: true,
      featuresBn: [
        '৪টি Dahua/Hikvision HD নাইট ভিশন ক্যামেরা',
        '১টি ৪-চ্যানেল এইচডি স্মার্ট ডিভিআর',
        '৫০০ জিবি সারভিলেন্স হার্ডডিস্ক স্টোরেজ',
        'পাওয়ার অ্যাডাপ্টার ও ভিডিও ব্যালুন',
        'মোবাইলে ইন্টারনেট লাইভ ভিউ কনফিগারেশন',
        'ফুল ওয়ারেন্টি ও নির্ভরযোগ্য সাপোর্ট'
      ],
      featuresEn: [
        '4x Dahua/Hikvision HD Night Vision Cameras',
        '1x 4-Channel HD Smart DVR Machine',
        '500GB Surveillance Dedicated Hard Drive',
        'Power Supply & Video Connectors',
        'Mobile App Live Monitoring Configuration',
        'Official Warranty & Technical Assistance'
      ]
    },
    {
      titleBn: 'অফিস ও স্টুডেন্ট ডেস্কটপ পিসি প্যাকেজ',
      titleEn: 'Office & Student Desktop PC Package',
      tagBn: 'কমপ্লিট সেটআপ',
      tagEn: 'Complete Setup',
      priceBn: '১৯,৯০০ ৳',
      priceEn: '৳ 19,900',
      popular: false,
      featuresBn: [
        'Intel Core i5 ফাস্ট প্রসেসর',
        'H81/H110 মাদারবোর্ড + কুলিং ফ্যান',
        '৮ জিবি হাই-স্পিড DDR3/DDR4 র‍্যাম',
        '২৫৬ জিবি আল্ট্রা ফাস্ট SSD ড্রাইভ',
        '১৯ ইঞ্চি ফুল এইচডি এলইডি মনিটর',
        'ইউএসবি কীবোর্ড, অপটিক্যাল মাউস ও পাওয়ার কেবল'
      ],
      featuresEn: [
        'Intel Core i5 Fast High Performance Processor',
        'Original Motherboard with Dedicated Cooler',
        '8GB DDR3/DDR4 High-Speed RAM',
        '256GB Ultra-Fast Solid State Drive',
        '19" Full HD Crystal Clear LED Monitor',
        'USB Keyboard, Optical Mouse & Power Cables'
      ]
    },
    {
      titleBn: 'শপ ও রিটেইল পিওএস (POS) স্টার্টার প্যাকেজ',
      titleEn: 'Retail Shop & Supermarket POS Package',
      tagBn: 'ব্যবসা অটোমেশন',
      tagEn: 'Business Automation',
      priceBn: '১৭,৫০০ ৳',
      priceEn: '৳ 17,500',
      popular: false,
      featuresBn: [
        'লেজার বারকোড স্ক্যানার (ফাস্ট রিডিং)',
        '৫৮/৮০ মিমি থার্মাল পিওএস ক্যাশ মেমো প্রিন্টার',
        'হেভি-ডিউটি মেটাল ক্যাশ ড্রয়ার',
        'এফসি টেকনোলজি পিওএস সফটওয়্যার রেডি',
        'ইনভেন্টরি, বারকোড ও সেলস ট্র্যাকিং সাপোর্ট',
        '১ বছরের ফ্রি টেকনিক্যাল সাপোর্ট'
      ],
      featuresEn: [
        'High-Speed 1D/2D Laser Barcode Scanner',
        '58/80mm Thermal Cash Memo Receipt Printer',
        'Heavy-Duty Automatic Metal Cash Drawer',
        'FC Technology Integrated POS Software Ready',
        'Real-time Barcode & Sales Ledger Tracking',
        '1-Year Dedicated Technical Support'
      ]
    }
  ];

  // সাধারণ প্রশ্নাবলী (FAQ)
  const faqs = [
    {
      qBn: 'সিসিক্যামেরার লাইভ ভিডিও কি আমি দূর থেকে মোবাইলে দেখতে পারব?',
      qEn: 'Can I view live CCTV camera feed on my mobile from anywhere?',
      aBn: 'হ্যাঁ, অবশ্যই! আমাদের সকল সিসিটিভি এবং ডিভিআর/এনভিআর সিস্টেমে ফ্রি মোবাইল অ্যাপ ক্লাউড সাপোর্ট রয়েছে। ইন্টারনেট থাকলে বিশ্বের যেকোনো প্রান্ত থেকে আপনার দোকান বা বাসার লাইভ ভিডিও ও রেকর্ড দেখতে পারবেন।',
      aEn: 'Yes, absolutely! All our CCTV & DVR/NVR setups include free cloud mobile app support. With an active internet connection, you can watch live video and recordings from anywhere in the world.'
    },
    {
      qBn: 'কম্পিউটার বা ল্যাপটপ নষ্ট হলে কি শোরুমে এসে সার্ভিসিং করানো যাবে?',
      qEn: 'Can I get my desktop PC or laptop repaired at your showroom?',
      aBn: 'জ্বী, আমাদের শোরুমে আধুনিক চিপ-লেভেল সার্ভিস ল্যাব রয়েছে। মাদারবোর্ড সমস্যা, উইন্ডোজ সেটআপ, ডিসপ্লে রিপ্লেসমেন্ট বা স্লো কম্পিউটার দ্রুত সমাধান করে দেওয়া হয়।',
      aEn: 'Yes, our showroom features an advanced chip-level servicing lab. We handle motherboard issues, OS re-installation, display replacements, and hardware upgrades with quick turnaround.'
    },
    {
      qBn: 'চট্টগ্রামসহ সারাদেশে কি পণ্য ডেলিভারি ও ইনস্টলেশন পাওয়া যাবে?',
      qEn: 'Is delivery and installation available across the country?',
      aBn: 'হ্যাঁ, চট্টগ্রাম মহানগরে আমাদের নিজস্ব টেকনিশিয়ান টিম দিয়ে অন-সাইট ইনস্টলেশন এবং সারাদেশে কুরিয়ারের মাধ্যমে ক্যাশ অন ডেলিভারিতে পণ্য পৌঁছানো হয়।',
      aEn: 'Yes, our expert technician team provides on-site installation across Chattogram and fast courier delivery with COD nationwide.'
    },
    {
      qBn: 'এফসি টেকনোলজির পণ্য ও সার্ভিসে কেমন ওয়ারেন্টি থাকে?',
      qEn: 'What warranty is provided with FC Technology products & services?',
      aBn: 'আমরা ১০০% আসল ব্র্যান্ডের পণ্য সরবরাহ করি যাতে ১ থেকে ৩ বছর পর্যন্ত অফিশিয়াল রিপ্লেসমেন্ট ও সার্ভিস ওয়ারেন্টি থাকে। সাথে থাকছে ডিজিটাল ওয়ারেন্টি স্লিপ ট্র্যাকিং সুবিধা।',
      aEn: 'We provide 100% genuine brand products with 1 to 3 years official replacement and service warranty, backed by digital warranty slip tracking.'
    }
  ];

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    if (!quoteForm.name || !quoteForm.phone) return;

    const msg = `আসসালামু আলাইকুম এফসি টেকনোলজি,\nআমি একটি কোটেশন/সেবা নিতে চাই:\n- নাম: ${quoteForm.name}\n- ফোন: ${quoteForm.phone}\n- সার্ভিস/পণ্য: ${quoteForm.service}\n- বিস্তারিত: ${quoteForm.details || 'N/A'}`;
    const encoded = encodeURIComponent(msg);
    const waUrl = `https://wa.me/${WHATSAPP_NUM}?text=${encoded}`;

    setQuoteSuccess(true);
    window.open(waUrl, '_blank');
  };

  const openWhatsAppForItem = (itemName, categoryName) => {
    const msg = `আসসালামু আলাইকুম FC Technology, আমি [${itemName}] (${categoryName}) সম্পর্কে দাম, স্টক ও ওয়ারেন্টি জানতে চাই।`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* ========================================================
          ১. টপ অ্যানাউন্সমেন্ট বার (শীর্ষ তথ্য ও ভাষা পরিবর্তন)
          (কোনো পিওএস এন্ট্রি বাটন এখানে থাকবে না)
      ======================================================== */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-blue-900/40 text-[12px] py-1.5 px-4 md:px-8 text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-blue-300">
              <PhoneCall size={13} className="text-emerald-400 shrink-0" />
              <span>{txt('হটলাইন:', 'Hotline:')}</span>
              <a href={`tel:${HOTLINE_2.replace(/-/g, '')}`} className="font-bold text-white hover:text-cyan-300 transition">{HOTLINE_2}</a>
              <span className="text-slate-500">|</span>
              <a href={`tel:${HOTLINE_1.replace(/-/g, '')}`} className="font-medium hover:text-cyan-300 transition">{HOTLINE_1}</a>
            </span>

            <span className="hidden lg:flex items-center gap-1.5 text-slate-400">
              <MapPin size={13} className="text-rose-400 shrink-0" />
              <span>{txt('চৌমুহনী, আগ্রাবাদ, চট্টগ্রাম', 'Chowmuhani, Agrabad, Chattogram')}</span>
            </span>

            <span className="hidden xl:flex items-center gap-1.5 text-slate-400">
              <Clock size={13} className="text-amber-400 shrink-0" />
              <span>{txt('শনি-বৃহস্পতি: সকাল ১০টা - রাত ৯টা', 'Sat-Thu: 10 AM - 9 PM')}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* ভাষা পরিবর্তন বাটন */}
            {onToggleLang && (
              <button
                onClick={onToggleLang}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold cursor-pointer transition shadow-xs"
                title={isBn ? 'Switch to English' : 'বাংলায় দেখুন'}
              >
                <Globe size={12} className="text-cyan-400" />
                <span>{isBn ? 'EN' : 'বাংলা'}</span>
              </button>
            )}

            {/* সরাসরি কুইক যোগাযোগ লিংক */}
            <a
              href={`https://wa.me/${WHATSAPP_NUM}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 transition shadow-xs"
            >
              <MessageSquare size={12} className="text-emerald-400" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================
          ২. প্রধান নেভিগেশন বার (Main Navbar)
          (কোনো পিওএস বাটন উপরে থাকবে না)
      ======================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#081126]/90 border-b border-blue-900/40 shadow-xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* ব্র্যান্ড লোগো ও টাইটেল */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-600/30 shrink-0 group-hover:scale-105 transition">
              <img
                src="/fc_logo_icon.png"
                alt="FC Technology Logo"
                className="w-full h-full object-contain rounded-[14px] bg-slate-900 p-1"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
                  {txt('এফসি টেকনোলজি', 'FC TECHNOLOGY')}
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                  IT & Security
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {txt('কম্পিউটার, সিসি ক্যামেরা ও আইটি সলিউশন', 'Computer, CCTV & IT Solutions')}
              </p>
            </div>
          </a>

          {/* ডেস্কটপ ন্যাভ লিংকসমূহ */}
          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold text-slate-300">
            <a href="#catalog" className="hover:text-cyan-400 transition flex items-center gap-1 text-cyan-300">
              <Layers size={14} />
              <span>{txt('ক্যাটালগ ব্রাউজার', 'Product Catalog')}</span>
            </a>
            <a href="#services" className="hover:text-cyan-400 transition">{txt('সেবাসমূহ', 'Services')}</a>
            <a href="#packages" className="hover:text-cyan-400 transition">{txt('প্যাকেজ অফার', 'Packages')}</a>
            <a href="#why-us" className="hover:text-cyan-400 transition">{txt('কেন আমরা', 'Why Us')}</a>
            <a href="#quote" className="hover:text-cyan-400 transition">{txt('কোটেশন', 'Get Quote')}</a>
            <a href="#contact" className="hover:text-cyan-400 transition">{txt('যোগাযোগ', 'Contact')}</a>
          </nav>

          {/* হেডার অ্যাকশন বাটনসমূহ (কোটেশন ও হটলাইন) */}
          <div className="flex items-center gap-3">
            <a
              href="#quote"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-500/30 border border-blue-400/30 transition transform hover:scale-[1.02]"
            >
              <Send size={13} />
              <span>{txt('কোটেশন নিন', 'Get Free Quote')}</span>
            </a>

            <a
              href={`tel:${HOTLINE_2.replace(/-/g, '')}`}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              title={HOTLINE_2}
            >
              <Phone size={14} className="text-cyan-400" />
              <span className="hidden md:inline">{HOTLINE_2}</span>
            </a>

            {/* মোবাইল মেনু বাটন */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* মোবাইল মেনু ড্রপডাউন */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#09142e] border-b border-blue-900/50 px-6 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
              <a href="#catalog" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-lg bg-blue-900/40 text-cyan-300 font-black">{txt('ক্যাটালগ ব্রাউজার', 'Product Catalog')}</a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-blue-900/40">{txt('সেবাসমূহ', 'Services')}</a>
              <a href="#packages" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-blue-900/40">{txt('প্যাকেজ অফার', 'Packages')}</a>
              <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-blue-900/40">{txt('কেন আমরা', 'Why Us')}</a>
              <a href="#quote" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-blue-900/40">{txt('কোটেশন', 'Get Quote')}</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-blue-900/40">{txt('যোগাযোগ', 'Contact')}</a>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href="#quote"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow"
              >
                <Send size={14} />
                <span>{txt('কোটেশন চান', 'Get Quote')}</span>
              </a>
              <a
                href={`tel:${HOTLINE_2.replace(/-/g, '')}`}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow"
              >
                <Phone size={14} />
                <span>{HOTLINE_2}</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          ৩. হিরো সেকশন (Hero Section)
          - Chattogram's -> Country's
          - Reliable Tech & Security with FC Technology
          - Stats strictly in English:
            15+ Years Experience, 5000+ Satisfied Clients, 100% Official Warranty
          - No POS entry button in Hero section
      ======================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-24">
        {/* ব্যাকগ্রাউন্ড লাইটিং ইফেক্টস */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-600/20 via-indigo-500/15 to-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* বাম পাশ: হিরো টাইটেল ও তথ্য */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Country's Trusted Partner ব্যাজ */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-900/60 to-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-inner">
                <Sparkles size={14} className="text-amber-400" />
                <span>Country's Trusted IT, Computer & CCTV Partner</span>
              </div>

              {/* প্রধান টাইটেল: Reliable Tech & Security with FC Technology */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                <span className="text-white">
                  {txt('আপনার ব্যবসা ও বাসার প্রযুক্তি সুরক্ষায় ', 'Elevate Your Business & Home with ')}
                </span>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent block sm:inline">
                  Reliable Tech & Security with FC Technology
                </span>
              </h1>

              {/* সাবটাইটেল */}
              <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed font-normal">
                {txt(
                  'উচ্চমানের সিসিটিভি ক্যামেরা সেটআপ, ব্র্যান্ডেড কম্পিউটার ও ল্যাপটপ, সার্ভার ও নেটওয়ার্কিং, চিপ-লেভেল দ্রুত সার্ভিসিং ল্যাব এবং অফিস ইকুইপমেন্টের নির্ভরযোগ্য প্রতিষ্ঠান।',
                  'High-definition CCTV installations, branded desktop computers & laptops, servers, enterprise networking, office equipment, and expert chip-level repair lab under one roof.'
                )}
              </p>

              {/* কল টু অ্যাকশন বাটনসমূহ */}
              <div className="flex flex-wrap gap-3.5 justify-center lg:justify-start pt-2">
                <a
                  href="#catalog"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2.5 transition transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Layers size={18} />
                  <span>{txt('আমাদের ক্যাটালগ ও পণ্যসমূহ দেখুন', 'Explore Full Catalog & Products')}</span>
                  <ArrowRight size={16} />
                </a>

                <a
                  href="#quote"
                  className="px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 font-bold text-sm flex items-center gap-2 transition hover:border-slate-500"
                >
                  <Shield size={16} className="text-cyan-400" />
                  <span>{txt('ফ্রি কোটেশন চান', 'Get Free Quote')}</span>
                </a>

                <a
                  href={`tel:${HOTLINE_2.replace(/-/g, '')}`}
                  className="px-4 py-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-sm flex items-center gap-2 transition"
                >
                  <Phone size={16} className="text-emerald-400" />
                  <span>{HOTLINE_2}</span>
                </a>
              </div>

              {/* ট্রাস্ট ব্যাজ - ব্যবহারকারীর নির্দেশনায় ইংরেজিতে */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-xl md:text-2xl font-black text-white">15+</div>
                  <div className="text-[11px] text-slate-400 font-medium">Years Experience</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-black text-cyan-400">5,000+</div>
                  <div className="text-[11px] text-slate-400 font-medium">Satisfied Clients</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-black text-amber-400">100%</div>
                  <div className="text-[11px] text-slate-400 font-medium">Official Warranty</div>
                </div>
              </div>
            </div>

            {/* ডান পাশ: ইন্টারেক্টিভ ফিচার ভিজ্যুয়াল কার্ড */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-[#0b1739] p-6 rounded-3xl border border-blue-500/30 shadow-2xl shadow-blue-950/60 backdrop-blur-xl">
                {/* কার্ড হেডার */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-cyan-300">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">FC Technology Services</h4>
                      <p className="text-[10px] text-slate-400">Agrabad, Chattogram</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Active
                  </span>
                </div>

                {/* ৩টি প্রধান হাইলাইটেড সার্ভিস */}
                <div className="mt-4 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3.5 hover:border-cyan-500/40 transition">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                      <Camera size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">{txt('সিসি ক্যামেরা ও সিকিউরিটি সলিউশন', 'CCTV & Security Solutions')}</div>
                      <div className="text-[11px] text-slate-400">{txt('HD/IP ক্যামেরা, মোবাইল ভিউ, DVR ও NVR', 'HD/IP Cameras, Mobile View, DVR & NVR')}</div>
                    </div>
                    <CheckCircle2 size={16} className="text-cyan-400" />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3.5 hover:border-blue-500/40 transition">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                      <Monitor size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">{txt('কম্পিউটার, ল্যাপটপ ও সার্ভার', 'Computers, Laptops & Servers')}</div>
                      <div className="text-[11px] text-slate-400">{txt('কাস্টম পিসি, নতুন ও ফ্রেশ ল্যাপটপ, সার্ভার', 'Custom PC, New Laptops, GPU Server')}</div>
                    </div>
                    <CheckCircle2 size={16} className="text-blue-400" />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3.5 hover:border-amber-500/40 transition">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Wrench size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">{txt('এক্সপার্ট চিপ-লেভেল সার্ভিসিং ল্যাব', 'Expert Chip-Level Servicing Lab')}</div>
                      <div className="text-[11px] text-slate-400">{txt('মাদারবোর্ড, ডিসপ্লে, পাওয়ার ও ডাটা রিকভারি', 'Motherboard, Display, Power & Data Recovery')}</div>
                    </div>
                    <CheckCircle2 size={16} className="text-amber-400" />
                  </div>
                </div>

                {/* কুইক কোটেশন ও ক্যাটালগ কার্ড */}
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-800/80 border border-blue-500/30 text-center">
                  <div className="text-xs font-bold text-cyan-200 mb-1">
                    {txt('সকল আইটি পণ্য ও সার্ভিসের বিশাল সমাহার', 'Comprehensive IT Products & Services')}
                  </div>
                  <p className="text-[11px] text-slate-300 mb-3">
                    {txt('সিকিউরিটি ক্যামেরা, রাউটার, অফিস ইকুইপমেন্ট ও হোম অ্যাপ্লায়েন্স', 'Security cameras, routers, office gadgets & home appliances')}
                  </p>
                  <a
                    href="#catalog"
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <span>{txt('ক্যাটালগ ব্রাউজ করুন', 'Browse All Categories')}</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          ৪. FC TECHNOLOGY সম্পূর্ণ ক্যাটালগ ও ক্যাটাগরি ব্রাউজার
          (ব্যবহারকারীর প্রদত্ত সকল ক্যাটাগরি ও সাব-আইটেমস সহ)
      ======================================================== */}
      <section id="catalog" className="py-16 md:py-20 bg-[#08122c]/80 border-t border-b border-blue-900/40 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
              {txt('সম্পূর্ণ পণ্য ও সেবা ক্যাটালগ', 'FC Technology Comprehensive Catalog')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {txt('আপনার প্রয়োজনীয় পণ্য বা সেবা সহজেই খুঁজে নিন', 'Explore Categories & Services')}
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              {txt(
                'সিকিউরিটি ক্যামেরা, সার্ভার, নেটওয়ার্কিং, অফিস ইকুইপমেন্ট, গ্যাজেট থেকে শুরু করে হোম অ্যাপ্লায়েন্স — সবকিছুই রয়েছে এফসি টেকনোলজিতে।',
                'From security cameras, servers, networking, office equipment, gadgets to home appliances — everything at FC Technology.'
              )}
            </p>
          </div>

          {/* লাইভ সার্চ বার */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 w-5 h-5" />
              <input
                type="text"
                placeholder={txt('যেকোনো পণ্য খুঁজুন (যেমন: IP Camera, Starlink, POS Printer, iPad, Gaming Chair, Room Heater...)', 'Search any item (e.g. Starlink, iPad, DVR, Room Heater, POS Printer...)')}
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900 border border-blue-500/40 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 shadow-xl transition"
              />
              {catalogSearch && (
                <button
                  onClick={() => setCatalogSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* সার্চ রেজাল্ট অথবা ক্যাটাগরি ভিউ */}
          {searchedItems ? (
            <div className="bg-slate-900/90 rounded-3xl p-6 md:p-8 border border-blue-500/30 mb-8">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <span className="text-sm font-bold text-cyan-300">
                  {txt(`অনুসন্ধানের ফলাফল (${searchedItems.length} টি আইটেম পাওয়া গেছে):`, `Search Results (${searchedItems.length} items found):`)}
                </span>
                <button
                  onClick={() => setCatalogSearch('')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {txt('রিসেট করুন', 'Clear Search')}
                </button>
              </div>

              {searchedItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {searchedItems.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => openWhatsAppForItem(res.item, res.catName)}
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-blue-900/40 border border-slate-700/60 hover:border-cyan-400/50 text-left transition flex flex-col justify-between group cursor-pointer"
                    >
                      <div>
                        <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block mb-1">
                          {isBn ? res.catBn : res.catName}
                        </span>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 line-clamp-2">
                          {res.item}
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
                        <MessageSquare size={10} />
                        <span>ইনকোয়ারি / দাম</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  {txt('কোনো আইটেম পাওয়া যায়নি। অনুগ্রহ করে সরাসরি হটলাইনে কল করুন:', 'No matching items found. Please call our hotline:')} <span className="text-white font-bold">{HOTLINE_2}</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* ক্যাটাগরি বাটন লিস্ট (হরাইজন্টাল স্ক্রোল / গ্রিড) */}
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {catalogCategories.map((cat) => {
                  const isActive = activeCatalogCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCatalogCategory(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 scale-105 border border-cyan-400/40'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{isBn ? cat.nameBn : cat.nameEn}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {cat.items.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* অ্যাক্টিভ ক্যাটাগরির বিস্তারিত আইটেমস কার্ড */}
              <div className={`p-6 md:p-8 rounded-3xl bg-gradient-to-b ${currentCategoryObj.color} bg-slate-900/90 border shadow-2xl transition-all`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-slate-800 text-cyan-400 shadow-inner">
                      {currentCategoryObj.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">
                        {isBn ? currentCategoryObj.nameBn : currentCategoryObj.nameEn}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {txt(`মোট ${currentCategoryObj.items.length} টি গুরুত্বপূর্ণ প্রোডাক্ট ও সাব-সার্ভিস ক্যাটাগরি`, `Showing all ${currentCategoryObj.items.length} products & service items`)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি FC Technology-র ${currentCategoryObj.nameEn} ক্যাটাগরির পণ্য সম্পর্কে জানতে চাই।`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition"
                  >
                    <MessageSquare size={13} />
                    <span>{txt('এই ক্যাটাগরির তথ্য চান', 'Inquire on WhatsApp')}</span>
                  </a>
                </div>

                {/* আইটেম গ্রিড */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {currentCategoryObj.items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => openWhatsAppForItem(item, currentCategoryObj.nameEn)}
                      className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-400/50 text-left transition duration-200 group flex flex-col justify-between cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                        {item}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-emerald-400">
                        <span>স্টক / দাম</span>
                        <ArrowRight size={11} className="group-hover:translate-x-0.5 transition" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          ৫. সেবাসমূহ সেকশন (Core Services Section)
      ======================================================== */}
      <section id="services" className="py-16 md:py-20 bg-slate-900/60 border-t border-b border-blue-900/30 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
              {txt('আমাদের বিশেষায়িত সেবাসমূহ', 'Our Specialized Services')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {txt('আপনার প্রযুক্তি সুরক্ষায় পূর্ণাঙ্গ আইটি সমাধান', 'Complete IT & Security Solutions for You')}
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              {txt(
                'চট্টগ্রাম শহরে দীর্ঘদিনের অভিজ্ঞতায় বাড়ি, অফিস ও ব্যবসাপ্রতিষ্ঠানের জন্য শতভাগ নির্ভরযোগ্য সেবা প্রদান করছি।',
                'Delivering trusted hardware, CCTV installations, and corporate IT services across the country with proven excellence.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv) => (
              <div
                key={srv.id}
                className={`p-6 rounded-2xl bg-gradient-to-b ${srv.color} bg-slate-900/80 border hover:border-cyan-400/50 transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-black/20 flex flex-col justify-between`}
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center mb-4 shadow-inner">
                    {srv.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {isBn ? srv.titleBn : srv.titleEn}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {isBn ? srv.descBn : srv.descEn}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {(isBn ? srv.featuresBn : srv.featuresEn).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-200">
                        <Check size={14} className="text-cyan-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <a
                    href="#quote"
                    onClick={() => setQuoteForm(prev => ({ ...prev, service: isBn ? srv.titleBn : srv.titleEn }))}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                  >
                    <span>{txt('কোটেশন চান', 'Request Quote')}</span>
                    <ChevronRight size={14} />
                  </a>

                  <a
                    href={`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি ${isBn ? srv.titleBn : srv.titleEn} সম্পর্কে জানতে চাই।`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition flex items-center gap-1"
                  >
                    <MessageSquare size={11} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          ৬. বিশেষ প্যাকেজ অফারসমূহ (Hot Packages)
      ======================================================== */}
      <section id="packages" className="py-16 md:py-20 bg-slate-900/40 border-t border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30">
              {txt('জনপ্রিয় প্যাকেজসমূহ', 'Best Value Packages')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {txt('সাশ্রয়ী মূল্যে রেডি-টু-ইউজ প্যাকেজ বান্ডেল', 'Complete Ready-to-Use Combo Bundles')}
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              {txt('একসাথে সম্পূর্ণ সলিউশন নিন — ঝামেলামুক্ত সেটআপ ও ফ্রি ইনস্টলেশন গাইডেন্স সহ।', 'All-in-one hardware and setup packages configured for best performance and peace of mind.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, idx) => (
              <div
                key={idx}
                className={`relative rounded-3xl p-6 md:p-8 flex flex-col justify-between transition duration-300 ${
                  pkg.popular
                    ? 'bg-gradient-to-b from-blue-900/40 via-slate-900 to-slate-900 border-2 border-cyan-400 shadow-2xl shadow-cyan-950/50 scale-[1.02]'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black tracking-wide shadow-md uppercase">
                    {txt('সবচেয়ে জনপ্রিয় প্যাকেজ', 'Most Popular Choice')}
                  </div>
                )}

                <div>
                  <div className="mb-4">
                    <span className="text-xs font-bold text-cyan-400 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30">
                      {isBn ? pkg.tagBn : pkg.tagEn}
                    </span>
                    <h3 className="text-xl font-black text-white mt-3">
                      {isBn ? pkg.titleBn : pkg.titleEn}
                    </h3>
                  </div>

                  <div className="mb-6 pb-6 border-b border-slate-800">
                    <span className="text-3xl md:text-4xl font-black text-white">{isBn ? pkg.priceBn : pkg.priceEn}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{txt('ফুল সেটআপ সহ আনুমানিক প্যাকেজ রেট', 'Complete setup included')}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {(isBn ? pkg.featuresBn : pkg.featuresEn).map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(`আসসালামু আলাইকুম, আমি ${isBn ? pkg.titleBn : pkg.titleEn} (${isBn ? pkg.priceBn : pkg.priceEn}) নিতে চাই। বিস্তারিত জানাবেন।`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <span>{txt('এই প্যাকেজটি বুক করুন', 'Book This Package')}</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          ৭. কেন এফসি টেকনোলজি? (Why Us Section)
      ======================================================== */}
      <section id="why-us" className="py-16 md:py-20 bg-slate-900/60 border-t border-b border-blue-900/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
              {txt('আমাদের বিশেষত্ব', 'Why Choose Us')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {txt('কেন হাজারো গ্রাহক আমাদের ওপর আস্থা রাখেন?', 'Why Thousands Trust FC Technology')}
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              {txt('আমরা শুধু পণ্য বিক্রি করি না, নিশ্চিত করি দীর্ঘমেয়াদী টেকনিক্যাল সাপোর্ট ও নিখুঁত সেবা।', 'We deliver complete end-to-end IT support with prompt warranty and fair pricing.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <Award size={24} />
              </div>
              <h4 className="text-base font-bold text-white mb-2">{txt('১০০% আসল পণ্য', '100% Genuine Products')}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {txt('অফিসিয়াল ডিস্ট্রিবিউটর থেকে সরাসরি সংগৃহীত জেনুইন হার্ডওয়্যার ও ব্র্যান্ড পণ্য।', 'Only official, brand-new components from authorized importers and distributors.')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Wrench size={24} />
              </div>
              <h4 className="text-base font-bold text-white mb-2">{txt('দক্ষ টেকনিশিয়ান টিম', 'Expert Technicians')}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {txt('চিপ-লেভেল হার্ডওয়্যার ইঞ্জিনিয়ার ও অভিজ্ঞ সিসিটিভি ইনস্টলার দ্বারা পেশাদার সেবা।', 'Seasoned chip-level hardware engineers and professional CCTV field technicians.')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Zap size={24} />
              </div>
              <h4 className="text-base font-bold text-white mb-2">{txt('দ্রুততম অন-সাইট সাপোর্ট', 'Fast On-site Support')}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {txt('চট্টগ্রামসহ সারাদেশে স্বল্পতম সময়ে ইনস্টলেশন ও জরুরি মেরামত সহায়তা।', 'Prompt site inspection and emergency servicing assistance across the country.')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Headset size={24} />
              </div>
              <h4 className="text-base font-bold text-white mb-2">{txt('সার্বক্ষণিক হটলাইন সহায়তা', '24/7 Hotline Assistance')}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {txt('পণ্য ব্যবহারের পর যেকোনো সমস্যায় ফোন বা হোয়াটসঅ্যাপে তাৎক্ষণিক পরামর্শ।', 'Dedicated post-sales support over phone hotline and WhatsApp chat.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          ৮. অনলাইন কোটেশন ও রিকোয়েস্ট ফর্ম (Quote Form)
      ======================================================== */}
      <section id="quote" className="py-16 md:py-20 relative">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="bg-gradient-to-b from-slate-900 to-[#0a1532] p-8 md:p-12 rounded-3xl border border-blue-500/40 shadow-2xl">
            <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
                {txt('ইনস্ট্যান্ট কোটেশন', 'Get a Free Quote')}
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white">
                {txt('আপনার কী সেবা বা পণ্য প্রয়োজন?', 'Tell Us What You Need')}
              </h3>
              <p className="text-xs md:text-sm text-slate-300">
                {txt('ফর্মটি পূরণ করলেই আমাদের হটলাইন টিম সরাসরি আপনার সাথে যোগাযোগ করবে।', 'Fill in this quick form and our technical team will respond immediately.')}
              </p>
            </div>

            {quoteSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-semibold text-center flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{txt('আপনার অনুরোধটি গ্রহণ করা হয়েছে এবং হোয়াটসঅ্যাপে পাঠানো হয়েছে! দ্রুত যোগাযোগ করা হবে।', 'Your request has been received and opened on WhatsApp! We will get back shortly.')}</span>
              </div>
            )}

            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {txt('আপনার নাম *', 'Full Name *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={txt('নাম লিখুন', 'Enter your name')}
                    value={quoteForm.name}
                    onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {txt('মোবাইল নাম্বার *', 'Phone / WhatsApp *')}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder={txt('018XXXXXXXX', '018XXXXXXXX')}
                    value={quoteForm.phone}
                    onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {txt('প্রয়োজনীয় সার্ভিস বা ক্যাটাগরি', 'Required Service / Category')}
                </label>
                <select
                  value={quoteForm.service}
                  onChange={(e) => setQuoteForm({ ...quoteForm, service: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
                >
                  {catalogCategories.map(c => (
                    <option key={c.id} value={c.nameEn}>
                      {isBn ? c.nameBn : c.nameEn}
                    </option>
                  ))}
                  <option value="Servicing & Repair">{txt('সার্ভিসিং ও মেরামত', 'Servicing & Repair')}</option>
                  <option value="Other">{txt('অন্যান্য প্রয়োজনীয় পণ্য', 'Other Inquiries')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {txt('বিস্তারিত বিবরণ (যদি থাকে)', 'Details or Requirements')}
                </label>
                <textarea
                  rows={3}
                  placeholder={txt('যেমন: কয়টি ক্যামেরা লাগবে অথবা ডিভাইসের মডেল/বাজেট...', 'e.g. Quantity, required models, or estimated budget...')}
                  value={quoteForm.details}
                  onChange={(e) => setQuoteForm({ ...quoteForm, details: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 transition resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition transform hover:scale-[1.01] cursor-pointer"
              >
                <Send size={16} />
                <span>{txt('কোটেশন পাঠান ও হোয়াটসঅ্যাপে কথা বলুন', 'Send Quote & Open on WhatsApp')}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================
          ৯. সচরাচর জিজ্ঞাসা (FAQ Section)
      ======================================================== */}
      <section className="py-16 md:py-20 bg-slate-900/60 border-t border-b border-blue-900/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30">
              {txt('সাধারণ জিজ্ঞাসা', 'Frequently Asked Questions')}
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-white">
              {txt('আপনার প্রশ্নের সহজ উত্তর', 'Got Questions? We Have Answers')}
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-sm font-bold text-white flex items-center gap-2.5">
                    <HelpCircle size={16} className="text-cyan-400 shrink-0" />
                    <span>{isBn ? faq.qBn : faq.qEn}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan-400' : ''}`}
                  />
                </button>

                {activeFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                    {isBn ? faq.aBn : faq.aEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          ১০. শোরুমের ঠিকানা ও যোগাযোগ (Contact & Showroom Location)
      ======================================================== */}
      <section id="contact" className="py-16 md:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* ঠিকানা ও যোগাযোগ তথ্য */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30">
                  {txt('সরাসরি শোরুমে আসুন', 'Visit Our Showroom')}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white mt-2">
                  {txt('এফসি টেকনোলজি শোরুম ও ল্যাব', 'FC Technology Showroom & Lab')}
                </h2>
                <p className="text-slate-300 text-sm mt-1">
                  {txt('চট্টগ্রামের প্রাণকেন্দ্র আগ্রাবাদ চৌমুহনীতে আমাদের শোরুম ও ফুল সার্ভিস সেন্টার।', 'Conveniently located at Chowmuhani, Agrabad commercial hub in Chattogram.')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{txt('শোরুমের ঠিকানা', 'Showroom Address')}</h4>
                    <p className="text-sm font-semibold text-white mt-0.5">{isBn ? ADDRESS_BN : ADDRESS_EN}</p>
                    <p className="text-[11px] text-cyan-400 mt-0.5">{txt('আর এফ জোহরা টাওয়ার (নীচ তলা, দোকান নং ১৮)', 'RF Zohura Tower, Ground Floor, Shop #18')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{txt('হটলাইন ও হোয়াটসঅ্যাপ', 'Hotline & WhatsApp')}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <a href={`tel:${HOTLINE_2.replace(/-/g, '')}`} className="text-sm font-bold text-white hover:text-cyan-300 transition">{HOTLINE_2}</a>
                      <a href={`tel:${HOTLINE_1.replace(/-/g, '')}`} className="text-sm font-medium text-slate-300 hover:text-cyan-300 transition">{HOTLINE_1}</a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{txt('শোরুম খোলার সময়সূচি', 'Showroom Hours')}</h4>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {txt('শনিবার - বৃহস্পতিবার: সকাল ১০:০০ টা - রাত ৯:০০ টা', 'Saturday - Thursday: 10:00 AM - 9:00 PM')}
                    </p>
                    <p className="text-[11px] text-amber-400 mt-0.5">{txt('(শুক্রবার সাপ্তাহিক বন্ধ)', '(Friday Closed)')}</p>
                  </div>
                </div>
              </div>

              {/* অ্যাকশন বাটন */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={`tel:${HOTLINE_2.replace(/-/g, '')}`}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md"
                >
                  <Phone size={14} />
                  <span>{txt('সরাসরি কল দিন', 'Direct Call')}</span>
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent('আসসালামু আলাইকুম এফসি টেকনোলজি, আমি সরাসরি শোরুমে আসতে চাই/তথ্য জানতে চাই।')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition"
                >
                  <MessageSquare size={14} className="text-emerald-400" />
                  <span>{txt('হোয়াটসঅ্যাপ চ্যাট', 'WhatsApp Chat')}</span>
                </a>
              </div>
            </div>

            {/* ডান পাশ: ভার্চুয়াল ম্যাপ / শপ লোকেশন ভিউ */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl bg-slate-900 border border-blue-500/30 p-6 md:p-8 shadow-2xl overflow-hidden text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <MapPin size={32} />
                </div>
                <h3 className="text-xl font-black text-white">
                  {txt('আগ্রাবাদ চৌমুহনী শোরুম', 'Agrabad Chowmuhani Showroom')}
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {txt(
                    'চট্টগ্রামের চৌমুহনী মোড় সংলগ্ন আর এফ জোহরা টাওয়ারের নিচ তলায় ১৮ নম্বর দোকান। যেকোনো সময় চলে আসুন অথবা আসার আগে আমাদের হটলাইনে কল দিন।',
                    'Shop #18, Ground Floor of RF Zohura Tower, near Chowmuhani Moor, Agrabad. Feel free to visit or call our hotline for directions.'
                  )}
                </p>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 max-w-md mx-auto text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-bold">{txt('ল্যান্ডমার্ক:', 'Landmark:')}</span>
                    <span>{txt('চৌমুহনী মোড়, আগ্রাবাদ', 'Chowmuhani Moor, Agrabad')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-bold">{txt('ভবন:', 'Building:')}</span>
                    <span>{txt('আর এফ জোহরা টাওয়ার (নীচ তলা)', 'RF Zohura Tower (Ground Floor)')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-bold">{txt('দোকান নং:', 'Shop No:')}</span>
                    <span className="font-black text-cyan-400">#১৮ (Shop #18)</span>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('RF Zohura Tower, Chowmuhani, Agrabad, Chattogram')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition"
                >
                  <ExternalLink size={14} />
                  <span>{txt('গুগল ম্যাপে লোকেশন দেখুন', 'Open on Google Maps')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          ১১. পিওএস সিস্টেম এন্ট্রি (শুধুমাত্র একদম নিচে থাকবে)
          User instruction: "বস সিস্টেম এন্ট্রি শুধুমাত্র একদম নিচেরটা থাকবে"
      ======================================================== */}
      <section id="pos-system-entry" className="py-12 bg-gradient-to-r from-[#040817] via-[#091533] to-[#040817] border-t border-b border-blue-900/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="relative rounded-3xl bg-slate-900/90 border border-blue-500/40 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
                <Laptop size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg md:text-xl font-black text-white">
                    {txt('এফসি টেকনোলজি পিওএস (POS) ম্যানেজমেন্ট সিস্টেম', 'FC Technology POS Management System')}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    {currentUser ? 'Active User' : 'Staff Entry'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {txt(
                    'দোকানের অভ্যন্তরীণ বিক্রয় কাউন্টার, বারকোড স্ক্যানিং, ক্যাশ মেমো প্রিন্ট, ডিজিটাল ওয়ারেন্টি স্লিপ ও ইনভেন্টরি স্টক পরিচালনার সফটওয়্যার।',
                    'Internal retail sales counter, real-time barcode scanning, invoice generation, digital warranty slips, and stock management.'
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenPos}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs md:text-sm shadow-xl shadow-blue-600/40 flex items-center gap-2.5 transition transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              <Laptop size={16} />
              <span>{txt('পজ সিস্টেমে প্রবেশ করুন', 'Access POS System')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          ১২. ফুটার (Footer)
      ======================================================== */}
      <footer className="bg-[#050b1a] text-slate-400 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-10">
            {/* কলাম ১: ব্র্যান্ড পরিচিতি */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src="/fc_logo_icon.png"
                  alt="Logo"
                  className="w-10 h-10 object-contain rounded-xl bg-slate-900 p-0.5 border border-blue-500/30"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {txt('এফসি টেকনোলজি', 'FC TECHNOLOGY')}
                  </h3>
                  <p className="text-[10px] text-cyan-400">Country's Trusted IT, Computer & CCTV Partner</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                {txt(
                  'আসল কম্পিউটার, ল্যাপটপ, সিসিটিভি ক্যামেরা, সার্ভার ও অফিস সলিউশনের বিশ্বস্ত প্রতিষ্ঠান। আপনার প্রযুক্তি সুরক্ষায় আমরা সর্বদা পাশে আছি।',
                  'Your trusted destination for genuine computer, laptop, CCTV camera hardware, and high-precision chip-level repair services.'
                )}
              </p>
            </div>

            {/* কলাম ২: দ্রুত লিঙ্ক */}
            <div className="lg:col-span-2 space-y-2.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">{txt('দ্রুত লিঙ্ক', 'Quick Links')}</h4>
              <ul className="space-y-1.5">
                <li><a href="#" className="hover:text-cyan-400 transition">{txt('হোম', 'Home')}</a></li>
                <li><a href="#catalog" className="hover:text-cyan-400 transition">{txt('ক্যাটালগ ব্রাউজার', 'Product Catalog')}</a></li>
                <li><a href="#services" className="hover:text-cyan-400 transition">{txt('সেবাসমূহ', 'Services')}</a></li>
                <li><a href="#packages" className="hover:text-cyan-400 transition">{txt('প্যাকেজ অফার', 'Packages')}</a></li>
                <li><a href="#quote" className="hover:text-cyan-400 transition">{txt('কোটেশন চান', 'Get Quote')}</a></li>
              </ul>
            </div>

            {/* কলাম ৩: শীর্ষ ক্যাটাগরি */}
            <div className="lg:col-span-2 space-y-2.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">{txt('ক্যাটাগরি', 'Categories')}</h4>
              <ul className="space-y-1.5">
                <li><a href="#catalog" onClick={() => setActiveCatalogCategory('security')} className="hover:text-cyan-400 transition">Security & CCTV</a></li>
                <li><a href="#catalog" onClick={() => setActiveCatalogCategory('desktop')} className="hover:text-cyan-400 transition">Desktop & Mac</a></li>
                <li><a href="#catalog" onClick={() => setActiveCatalogCategory('laptop')} className="hover:text-cyan-400 transition">Laptop & Notebook</a></li>
                <li><a href="#catalog" onClick={() => setActiveCatalogCategory('component')} className="hover:text-cyan-400 transition">PC Components</a></li>
                <li><a href="#catalog" onClick={() => setActiveCatalogCategory('monitor')} className="hover:text-cyan-400 transition">Monitors & Displays</a></li>
                <li><a href="#catalog" onClick={() => setActiveCatalogCategory('power')} className="hover:text-cyan-400 transition">Power, UPS & Solar</a></li>
                <li><a href="#catalog" onClick={() => setActiveCatalogCategory('networking')} className="hover:text-cyan-400 transition">Networking</a></li>
                <li><a href="#catalog" onClick={() => setActiveCatalogCategory('office')} className="hover:text-cyan-400 transition">Office Equipment</a></li>
                <li><a href="#catalog" onClick={() => setActiveCatalogCategory('appliance')} className="hover:text-cyan-400 transition">Home Appliance</a></li>
              </ul>
            </div>

            {/* কলাম ৪: শোরুম ও সহায়তা */}
            <div className="lg:col-span-3 space-y-2.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">{txt('যোগাযোগ ও শোরুম', 'Showroom')}</h4>
              <p className="text-xs text-slate-400">{isBn ? ADDRESS_BN : ADDRESS_EN}</p>
              <div className="space-y-1 pt-1 font-semibold text-white">
                <div>📞 <a href={`tel:${HOTLINE_2.replace(/-/g, '')}`} className="hover:text-cyan-400 transition">{HOTLINE_2}</a></div>
                <div>☎️ <a href={`tel:${HOTLINE_1.replace(/-/g, '')}`} className="hover:text-cyan-400 transition">{HOTLINE_1}</a></div>
                <div className="text-[11px] text-emerald-400">💬 WhatsApp: {HOTLINE_2}</div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500">
            <div>
              © 2026 {txt('এফসি টেকনোলজি (FC Technology) • সর্বস্বত্ব সংরক্ষিত', 'FC Technology • All Rights Reserved')}
            </div>
            <div className="flex items-center gap-4">
              <span>{txt('দোকান নং #১৮, আর এফ জোহরা টাওয়ার, চট্টগ্রাম', 'Shop #18, RF Zohura Tower, Chattogram')}</span>
              <span>•</span>
              {/* ফুটারের একদম নিচের পিওএস লিংক */}
              <button onClick={onOpenPos} className="text-cyan-400 hover:underline cursor-pointer font-bold">
                {txt('পজ সিস্টেম লগইন', 'POS System Login')}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================
          ১৩. ফ্লোটিং হোয়াটসঅ্যাপ বাটন
      ======================================================== */}
      <a
        href={`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent('আসসালামু আলাইকুম এফসি টেকনোলজি, আমি সরাসরি তথ্য জানতে চাই।')}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/50 transition transform hover:scale-110 cursor-pointer"
        title="WhatsApp Chat"
        aria-label="WhatsApp"
      >
        <MessageSquare size={28} />
      </a>
    </div>
  );
}
