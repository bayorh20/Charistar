import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Plus, Edit, Trash2, Smartphone, Image as ImageIcon, Link2, 
  Sparkles, Check, Save, Undo, HelpCircle, Palette, ArrowRight 
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';

const MarketingManager = () => {
  const { marketingConfig, storeConfig, categories, logAction } = useApp();

  // Settings Forms States
  const [slides, setSlides] = useState([]);
  const [pwaPromptText, setPwaPromptText] = useState('');
  const [appLogoUrl, setAppLogoUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [greetingHeadline, setGreetingHeadline] = useState('');
  const [greetingSubtitle, setGreetingSubtitle] = useState('');
  const [pwaInstallTitle, setPwaInstallTitle] = useState('');
  const [themeColors, setThemeColors] = useState({
    primary: '#ea580c',
    secondary: '#fb923c',
    accent: '#f97316'
  });
  const [stylingSettings, setStylingSettings] = useState({
    fontFamilyPrimary: 'Plus Jakarta Sans',
    fontFamilyAccent: 'Outfit',
    fontSizeBase: 16,
    borderRadiusBase: 14,
    spacingDensity: 'cozy',
    lightBgApp: '#FDFDFD',
    lightBgCard: '#FFFFFF',
    lightTextMain: '#4D423E',
    lightTextMuted: '#9A9189',
    lightBorderColor: '#EAEAEA',
    darkBgApp: '#0F0B09',
    darkBgCard: '#171210',
    darkTextMain: '#D5CFC7',
    darkTextMuted: '#9D9187',
    darkBorderColor: '#2D231F'
  });

  // Mockup theme toggle state (Light/Dark mode preview)
  const [isMockupDark, setIsMockupDark] = useState(false);

  // Security passcode modal
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, data }

  // Inject Google Fonts dynamically for mockup rendering
  useEffect(() => {
    if (stylingSettings.fontFamilyPrimary && stylingSettings.fontFamilyAccent) {
      const fPrimary = stylingSettings.fontFamilyPrimary;
      const fAccent = stylingSettings.fontFamilyAccent;
      const fontKey = `gf-admin-${fPrimary.replace(/\s+/g, '-')}-${fAccent.replace(/\s+/g, '-')}`;
      if (!document.getElementById(fontKey)) {
        document.querySelectorAll('link[id^="gf-admin-"]').forEach(el => el.remove());
        const link = document.createElement('link');
        link.id = fontKey;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fPrimary.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&family=${fAccent.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [stylingSettings.fontFamilyPrimary, stylingSettings.fontFamilyAccent]);

  // Sync state with global Firestore listeners when loaded
  useEffect(() => {
    if (marketingConfig) {
      setSlides(marketingConfig.heroSlides || []);
      setPwaPromptText(marketingConfig.pwaPromptText || '');
      setAppLogoUrl(marketingConfig.appLogoUrl || '');
      setAppName(marketingConfig.appName || 'FoodMaxx');
      setAppDescription(marketingConfig.appDescription || 'Premium food delivery in Ibadan. Order amala, grills, and more!');
      setGreetingHeadline(marketingConfig.greetingHeadline || 'Hey');
      setGreetingSubtitle(marketingConfig.greetingSubtitle || 'What do you want to eat today?');
      setPwaInstallTitle(marketingConfig.pwaInstallTitle || 'Install FoodMaxx');
    }
    if (storeConfig?.themeColors) {
      setThemeColors(storeConfig.themeColors);
    }
    if (storeConfig?.stylingSettings) {
      setStylingSettings(prev => ({ ...prev, ...storeConfig.stylingSettings }));
    }
  }, [marketingConfig, storeConfig]);

  // Mock phone preview slide index
  const [mockSlideIndex, setMockSlideIndex] = useState(0);
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setMockSlideIndex(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Form State (New/Edit Slide)
  const [activeSlideForm, setActiveSlideForm] = useState(null); // 'new' or index
  const [slideForm, setSlideForm] = useState({
    title: '',
    desc: '',
    image: '',
    linkType: 'category', // 'category' or 'item'
    linkValue: ''
  });

  // ── Edit/Add Slides Actions ────────────────────────────────────────────────
  const handleOpenNewSlide = () => {
    setActiveSlideForm('new');
    setSlideForm({
      title: '', desc: '', image: '', linkType: 'category', linkValue: categories[0]?.id || ''
    });
  };

  const handleSaveSlideForm = () => {
    if (!slideForm.title || !slideForm.image) {
      alert("Please enter a title and image URL");
      return;
    }

    if (activeSlideForm === 'new') {
      setSlides(prev => [...prev, { id: 'slide-' + Date.now(), ...slideForm }]);
    } else {
      setSlides(prev => {
        const next = [...prev];
        next[activeSlideForm] = { ...next[activeSlideForm], ...slideForm };
        return next;
      });
    }
    setActiveSlideForm(null);
  };

  const handleDeleteSlide = (index) => {
    setSlides(prev => prev.filter((_, idx) => idx !== index));
    if (mockSlideIndex >= slides.length - 1) {
      setMockSlideIndex(0);
    }
  };

  const openEditSlide = (index) => {
    setActiveSlideForm(index);
    setSlideForm(slides[index]);
  };

  // ── Save Branding configs to Firestore ─────────────────────────────────────
  const triggerSaveMarketing = () => {
    setPendingAction({ type: 'save_branding' });
    setPasscodeOpen(true);
  };

  const handleVerifiedAction = async () => {
    if (!pendingAction) return;

    try {
      // 1. Save marketing config
      await setDoc(doc(db, 'settings', 'marketing_config'), {
        heroSlides: slides,
        pwaPromptText,
        appLogoUrl,
        appName,
        appDescription,
        greetingHeadline,
        greetingSubtitle,
        pwaInstallTitle
      }, { merge: true });

      // 2. Save theme colors & styling settings in store config
      await setDoc(doc(db, 'settings', 'store_config'), {
        themeColors,
        stylingSettings
      }, { merge: true });

      logAction("Updated app branding configs, dynamic theme colors & typography styling");
      alert("Branding configuration saved and published successfully!");
    } catch (err) {
      alert("Failed to write settings: " + err.message);
    }

    setPendingAction(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
      
      {/* ── Left Columns: Configuration editors ────────────────────────────────── */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Color Palette customization */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4 pl-0.5 flex items-center gap-2">
            <Palette size={18} className="text-orange-500" />
            <span>Dynamic Theme Styling</span>
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-1">Primary Theme</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={themeColors.primary}
                  onChange={(e) => setThemeColors(prev => ({ ...prev, primary: e.target.value }))}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                />
                <span className="text-xs font-mono font-bold uppercase">{themeColors.primary}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-1">Secondary Theme</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={themeColors.secondary}
                  onChange={(e) => setThemeColors(prev => ({ ...prev, secondary: e.target.value }))}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                />
                <span className="text-xs font-mono font-bold uppercase">{themeColors.secondary}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-1">Accent Accent</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={themeColors.accent}
                  onChange={(e) => setThemeColors(prev => ({ ...prev, accent: e.target.value }))}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                />
                <span className="text-xs font-mono font-bold uppercase">{themeColors.accent}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Typography & Spacing Panel */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-2 pl-0.5 flex items-center gap-2">
            <Sparkles size={18} className="text-orange-500" />
            <span>Typography, Radius & Spacing</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Primary Font Family</label>
              <select
                value={stylingSettings.fontFamilyPrimary}
                onChange={(e) => setStylingSettings(prev => ({ ...prev, fontFamilyPrimary: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
              >
                {['Plus Jakarta Sans', 'Outfit', 'Poppins', 'Inter', 'Roboto', 'Montserrat', 'Sora'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Accent Font Family (Headings)</label>
              <select
                value={stylingSettings.fontFamilyAccent}
                onChange={(e) => setStylingSettings(prev => ({ ...prev, fontFamilyAccent: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
              >
                {['Outfit', 'Plus Jakarta Sans', 'Poppins', 'Inter', 'Roboto', 'Montserrat', 'Sora', 'Playfair Display'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1 pl-1 text-[10px] font-black text-slate-400 uppercase">
                <span>Base Font Size</span>
                <span className="font-mono text-slate-800 dark:text-white font-extrabold">{stylingSettings.fontSizeBase}px</span>
              </div>
              <input
                type="range"
                min={13}
                max={19}
                step={1}
                value={stylingSettings.fontSizeBase}
                onChange={(e) => setStylingSettings(prev => ({ ...prev, fontSizeBase: Number(e.target.value) }))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1 pl-1 text-[10px] font-black text-slate-400 uppercase">
                <span>Border Corner Radius</span>
                <span className="font-mono text-slate-800 dark:text-white font-extrabold">{stylingSettings.borderRadiusBase}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                step={2}
                value={stylingSettings.borderRadiusBase}
                onChange={(e) => setStylingSettings(prev => ({ ...prev, borderRadiusBase: Number(e.target.value) }))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-1">Layout Spacing / Padding Density</label>
              <div className="flex gap-2">
                {[
                  { value: 'compact', label: 'Compact Layout (0.85x)' },
                  { value: 'cozy', label: 'Cozy / Balanced (1.0x)' },
                  { value: 'spacious', label: 'Spacious / Breathing (1.2x)' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStylingSettings(prev => ({ ...prev, spacingDensity: value }))}
                    className={`flex-1 py-2 font-bold text-xs rounded-xl border transition-all ${
                      stylingSettings.spacingDensity === value
                        ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Mode Color Overrides */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-2 pl-0.5 flex items-center gap-2">
            <Palette size={18} className="text-orange-500" />
            <span>Light & Dark Mode Layout Colors</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Light Mode Override Col */}
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-1 dark:border-slate-800 flex items-center gap-1">☀️ Light Mode Layout Overrides</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500">App Background</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={stylingSettings.lightBgApp} onChange={e => setStylingSettings(prev => ({ ...prev, lightBgApp: e.target.value }))} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0" />
                    <span className="text-[10px] font-mono font-bold uppercase">{stylingSettings.lightBgApp}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500">Card Background</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={stylingSettings.lightBgCard} onChange={e => setStylingSettings(prev => ({ ...prev, lightBgCard: e.target.value }))} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0" />
                    <span className="text-[10px] font-mono font-bold uppercase">{stylingSettings.lightBgCard}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500">Primary Text</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={stylingSettings.lightTextMain} onChange={e => setStylingSettings(prev => ({ ...prev, lightTextMain: e.target.value }))} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0" />
                    <span className="text-[10px] font-mono font-bold uppercase">{stylingSettings.lightTextMain}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500">Muted Text</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={stylingSettings.lightTextMuted} onChange={e => setStylingSettings(prev => ({ ...prev, lightTextMuted: e.target.value }))} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0" />
                    <span className="text-[10px] font-mono font-bold uppercase">{stylingSettings.lightTextMuted}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500">Border Color</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={stylingSettings.lightBorderColor} onChange={e => setStylingSettings(prev => ({ ...prev, lightBorderColor: e.target.value }))} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0" />
                    <span className="text-[10px] font-mono font-bold uppercase">{stylingSettings.lightBorderColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Mode Override Col */}
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-1 dark:border-slate-800 flex items-center gap-1">🌙 Dark Mode Layout Overrides</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500">App Background</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={stylingSettings.darkBgApp} onChange={e => setStylingSettings(prev => ({ ...prev, darkBgApp: e.target.value }))} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0" />
                    <span className="text-[10px] font-mono font-bold uppercase">{stylingSettings.darkBgApp}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500">Card Background</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={stylingSettings.darkBgCard} onChange={e => setStylingSettings(prev => ({ ...prev, darkBgCard: e.target.value }))} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0" />
                    <span className="text-[10px] font-mono font-bold uppercase">{stylingSettings.darkBgCard}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500">Primary Text</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={stylingSettings.darkTextMain} onChange={e => setStylingSettings(prev => ({ ...prev, darkTextMain: e.target.value }))} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0" />
                    <span className="text-[10px] font-mono font-bold uppercase">{stylingSettings.darkTextMain}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500">Muted Text</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={stylingSettings.darkTextMuted} onChange={e => setStylingSettings(prev => ({ ...prev, darkTextMuted: e.target.value }))} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0" />
                    <span className="text-[10px] font-mono font-bold uppercase">{stylingSettings.darkTextMuted}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500">Border Color</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={stylingSettings.darkBorderColor} onChange={e => setStylingSettings(prev => ({ ...prev, darkBorderColor: e.target.value }))} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0" />
                    <span className="text-[10px] font-mono font-bold uppercase">{stylingSettings.darkBorderColor}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* PWA Details & Banners */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white pl-0.5 flex items-center gap-2">
            <Smartphone size={18} className="text-orange-500" />
            <span>PWA Configuration Details</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">App Custom Logo URL</label>
              <input 
                type="text" 
                value={appLogoUrl}
                onChange={(e) => setAppLogoUrl(e.target.value)}
                placeholder="Logo image link address..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">App Name / Branding</label>
              <input 
                type="text" 
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. FoodMaxx"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">App Description (Browser Metadata)</label>
              <input 
                type="text" 
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                placeholder="Tagline displayed in search engines..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Greeting Title</label>
              <input 
                type="text" 
                value={greetingHeadline}
                onChange={(e) => setGreetingHeadline(e.target.value)}
                placeholder="e.g. Hey"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Greeting Subtitle Tagline</label>
              <input 
                type="text" 
                value={greetingSubtitle}
                onChange={(e) => setGreetingSubtitle(e.target.value)}
                placeholder="e.g. What do you want to eat today?"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">PWA Install Prompt Title</label>
              <input 
                type="text" 
                value={pwaInstallTitle}
                onChange={(e) => setPwaInstallTitle(e.target.value)}
                placeholder="e.g. Install FoodMaxx"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">PWA Install Prompt Subtitle / Text</label>
              <input 
                type="text" 
                value={pwaPromptText}
                onChange={(e) => setPwaPromptText(e.target.value)}
                placeholder="Get the full app experience. Order faster..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Banners slider editor */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-700/60">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <ImageIcon size={18} className="text-orange-500" />
              <span>Promo Banners Slider ({slides.length})</span>
            </h3>
            <button 
              onClick={handleOpenNewSlide}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl font-black text-xs transition-colors"
            >
              <Plus size={14} /> Add Slide
            </button>
          </div>

          {/* Form Overlay */}
          {activeSlideForm !== null && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-400 uppercase">
                {activeSlideForm === 'new' ? 'Configure New Slide Banner' : 'Edit Slide Banner'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Banner Title</label>
                  <input 
                    type="text" 
                    value={slideForm.title}
                    onChange={(e) => setSlideForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Delicious Jollof Special"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Image URL</label>
                  <input 
                    type="text" 
                    value={slideForm.image}
                    onChange={(e) => setSlideForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="Unsplash / image URL address..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Promo Description</label>
                <input 
                  type="text" 
                  value={slideForm.desc}
                  onChange={(e) => setSlideForm(prev => ({ ...prev, desc: e.target.value }))}
                  placeholder="e.g. Starting from ₦4,500 only for today!"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Link Target Type</label>
                  <select 
                    value={slideForm.linkType}
                    onChange={(e) => setSlideForm(prev => ({ ...prev, linkType: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="category">Redirect to Category</option>
                    <option value="item">Redirect to Specific Food Item</option>
                    <option value="none">No Link Redirect</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Redirect Value (Slug/ID)</label>
                  <input 
                    type="text" 
                    value={slideForm.linkValue}
                    onChange={(e) => setSlideForm(prev => ({ ...prev, linkValue: e.target.value }))}
                    placeholder="e.g. rice or amala-supreme"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  onClick={() => setActiveSlideForm(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 rounded-xl font-bold text-xs"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSaveSlideForm}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl font-bold text-xs"
                >
                  Apply Slide
                </button>
              </div>

            </div>
          )}

          {/* Slides List */}
          <div className="space-y-3">
            {slides.map((slide, idx) => (
              <div 
                key={slide.id || idx}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-900"
              >
                <img 
                  src={slide.image} 
                  alt={slide.title} 
                  className="w-16 h-12 object-cover rounded-lg border border-slate-200" 
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white truncate">{slide.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{slide.desc}</p>
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-orange-500 font-bold uppercase mt-1">
                    <Link2 size={10} /> Link: {slide.linkType} ({slide.linkValue || 'none'})
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <button 
                    onClick={() => openEditSlide(idx)}
                    className="p-1.5 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-lg"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteSlide(idx)}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {slides.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs font-bold">No active promotional slides configured.</div>
            )}
          </div>

        </div>

        {/* Action Save Bar */}
        <div className="flex gap-4">
          <button 
            onClick={triggerSaveMarketing}
            className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/10 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            <span>Publish Branding Changes</span>
          </button>
        </div>

      </div>

      {/* ── Right Column: Interactive Phone Mockup ─────────────────────────────── */}
      <div className="flex flex-col items-center">
        
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-1">
          <Smartphone size={14} className="text-slate-400" />
          Live Customer App Preview
        </span>

        {/* CSS-based Mobile Device frame container */}
        <div className="relative w-[310px] h-[620px] bg-slate-950 rounded-[45px] p-[10px] shadow-2xl border-4 border-slate-900 overflow-hidden ring-12 ring-slate-900/50">
          
          {/* Dynamic Colors and Styling injection style tags */}
          {(() => {
            const previewBgApp = isMockupDark ? stylingSettings.darkBgApp : stylingSettings.lightBgApp;
            const previewBgCard = isMockupDark ? stylingSettings.darkBgCard : stylingSettings.lightBgCard;
            const previewTextMain = isMockupDark ? stylingSettings.darkTextMain : stylingSettings.lightTextMain;
            const previewTextMuted = isMockupDark ? stylingSettings.darkTextMuted : stylingSettings.lightTextMuted;
            const previewBorderColor = isMockupDark ? stylingSettings.darkBorderColor : stylingSettings.lightBorderColor;
            const previewRadius = stylingSettings.borderRadiusBase ?? 14;
            const previewFontSize = stylingSettings.fontSizeBase ?? 16;
            const previewFontPrimary = stylingSettings.fontFamilyPrimary || 'Plus Jakarta Sans';
            const previewFontAccent = stylingSettings.fontFamilyAccent || 'Outfit';
            const previewDensity = stylingSettings.spacingDensity || 'cozy';
            const previewPaddingScale = previewDensity === 'compact' ? 0.82 : previewDensity === 'spacious' ? 1.2 : 1.0;

            return (
              <style dangerouslySetInnerHTML={{ __html: `
                .phone-mock-primary { background-color: ${themeColors.primary}; }
                .phone-mock-text-primary { color: ${themeColors.primary}; }
                .phone-mock-border-primary { border-color: ${themeColors.primary}; }
                .phone-mock-primary-glow { box-shadow: 0 4px 14px ${themeColors.primary}40; }
                
                .phone-mock-screen-container {
                  --bg-app: ${previewBgApp};
                  --bg-card: ${previewBgCard};
                  --text-main: ${previewTextMain};
                  --text-muted: ${previewTextMuted};
                  --border-color: ${previewBorderColor};
                  background-color: var(--bg-app) !important;
                  color: var(--text-main) !important;
                  font-family: '${previewFontPrimary}', sans-serif !important;
                  font-size: ${previewFontSize}px !important;
                }
                
                .phone-mock-screen-container header, 
                .phone-mock-screen-container nav {
                  background-color: var(--bg-card) !important;
                  border-color: var(--border-color) !important;
                }
                
                .phone-mock-screen-container h5,
                .phone-mock-screen-container h6,
                .phone-mock-screen-container span.font-black,
                .phone-mock-screen-container span.font-extrabold {
                  font-family: '${previewFontAccent}', sans-serif !important;
                }

                .phone-mock-screen-container .bg-white,
                .phone-mock-screen-container .dark\\:bg-slate-800 {
                  background-color: var(--bg-card) !important;
                  color: var(--text-main) !important;
                  border-color: var(--border-color) !important;
                }
                
                .phone-mock-screen-container .text-slate-800,
                .phone-mock-screen-container .dark\\:text-slate-200,
                .phone-mock-screen-container .text-slate-705,
                .phone-mock-screen-container .text-slate-700,
                .phone-mock-screen-container .dark\\:text-slate-300 {
                  color: var(--text-main) !important;
                }

                .phone-mock-screen-container .text-slate-400 {
                  color: var(--text-muted) !important;
                }
                
                .phone-mock-screen-container .border,
                .phone-mock-screen-container .border-b,
                .phone-mock-screen-container .border-t {
                  border-color: var(--border-color) !important;
                }

                .phone-mock-screen-container .rounded-xl {
                  border-radius: ${previewRadius}px !important;
                }
                
                .phone-mock-screen-container .rounded-2xl {
                  border-radius: ${previewRadius + 4}px !important;
                }

                .phone-mock-screen-container .rounded-3xl {
                  border-radius: ${previewRadius + 8}px !important;
                }

                .phone-mock-screen-container .rounded-[35px] {
                  border-radius: 28px !important;
                }
                
                .phone-mock-screen-container .p-3 {
                  padding: ${12 * previewPaddingScale}px !important;
                }
                
                .phone-mock-screen-container .p-2.5 {
                  padding: ${10 * previewPaddingScale}px !important;
                }
                
                .phone-mock-screen-container .p-1.5 {
                  padding: ${6 * previewPaddingScale}px !important;
                }

                .phone-mock-screen-container .gap-2 {
                  gap: ${8 * previewPaddingScale}px !important;
                }

                .phone-mock-screen-container .space-y-4 > :not([hidden]) ~ :not([hidden]) {
                  margin-top: ${16 * previewPaddingScale}px !important;
                }
              `}} />
            );
          })()}

          {/* Screen area */}
          <div className="phone-mock-screen-container w-full h-full rounded-[35px] overflow-hidden flex flex-col justify-between relative">
            
            {/* Top Speaker notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center">
              <span className="w-8 h-1 bg-slate-800 rounded-full"></span>
            </div>

            {/* Header section mockup */}
            <header className="h-14 bg-white dark:bg-slate-800 px-4 pt-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 shrink-0 relative">
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-lg">🍔</span>
                <span className="font-black text-xs">FoodMaxx</span>
              </div>
              
              {/* Mockup Light/Dark toggle button */}
              <button 
                type="button" 
                onClick={() => setIsMockupDark(!isMockupDark)}
                className="absolute left-1/2 -translate-x-1/2 mt-2 w-7 h-7 bg-slate-150 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full flex items-center justify-center text-xs shadow-sm z-50 border border-slate-200/50"
                title="Toggle mockup light/dark mode preview"
              >
                {isMockupDark ? '🌙' : '☀️'}
              </button>
              
              {/* App logo or dot */}
              <div className="w-5 h-5 rounded-full bg-slate-100 border flex items-center justify-center overflow-hidden mt-2">
                {appLogoUrl ? <img src={appLogoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-[8px]">⚡</span>}
              </div>
            </header>

            {/* Scrollable Screen Body Mockup */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 pt-2">
              
              {/* Welcome address banner */}
              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Deliver To:</p>
                  <p className="font-extrabold text-[10.5px]">📍 Ibadan Garden Plaza</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">👤</div>
              </div>

              {/* Dynamic Slides render in PWA preview */}
              {slides.length > 0 ? (
                <div className="w-full h-36 rounded-2xl overflow-hidden relative shadow-sm">
                  {/* Current image */}
                  <img 
                    src={slides[mockSlideIndex]?.image} 
                    alt="Slider mockup" 
                    className="w-full h-full object-cover"
                  />
                  {/* Backdrop tint */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5 flex flex-col justify-end p-3 text-white">
                    <h5 className="font-extrabold text-xs text-white leading-tight">
                      {slides[mockSlideIndex]?.title}
                    </h5>
                    <p className="text-[9px] text-white/80 mt-0.5 line-clamp-1">
                      {slides[mockSlideIndex]?.desc}
                    </p>
                    
                    {/* Action pill */}
                    {slides[mockSlideIndex]?.linkType !== 'none' && (
                      <span className="phone-mock-primary text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full w-max mt-1.5 flex items-center gap-0.5">
                        Order Now <ArrowRight size={8} />
                      </span>
                    )}
                  </div>

                  {/* Dot navigators */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1">
                    {slides.map((_, idx) => (
                      <span 
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${idx === mockSlideIndex ? 'phone-mock-primary' : 'bg-white/40'}`}
                      ></span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-[10px]">No Banner Slides</div>
              )}

              {/* Categories scroller mockup */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Category Quick Menu</h5>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {categories.map((c, i) => (
                    <div 
                      key={c.id} 
                      className={`px-3 py-1.5 rounded-xl border text-[9px] font-bold flex items-center gap-1 shrink-0 ${
                        i === 0 
                          ? 'phone-mock-border-primary phone-mock-text-primary bg-white dark:bg-slate-800' 
                          : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700/60'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Product Cards */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Specials For You</h5>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Smoky Jollof', price: '₦4,500', img: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=150' },
                    { name: 'Amala Supreme', price: '₦3,800', img: 'https://images.unsplash.com/photo-1628294896516-344152572ee8?w=150' }
                  ].map((p, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col p-1.5 border border-slate-100 dark:border-slate-700/50">
                      <img src={p.img} alt={p.name} className="h-16 w-full object-cover rounded-lg" />
                      <h6 className="font-extrabold text-[9.5px] truncate mt-1 text-slate-800 dark:text-white">{p.name}</h6>
                      <div className="flex justify-between items-center mt-1">
                        <span className="phone-mock-text-primary font-black text-[9px]">{p.price}</span>
                        <span className="phone-mock-primary text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold">+</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PWA Prompt Mockup Banner */}
              {pwaPromptText && (
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-2.5 shadow flex items-center justify-between text-[9px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">📲</span>
                    <span className="leading-tight text-slate-700 dark:text-slate-300 pr-1">{pwaPromptText}</span>
                  </div>
                  <button className="phone-mock-primary text-white font-black text-[8px] uppercase px-2.5 py-1 rounded-lg shrink-0">Install</button>
                </div>
              )}

            </div>

            {/* Bottom Navigator Mockup */}
            <nav className="h-12 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-around text-[9px] font-bold shrink-0 text-slate-400">
              <div className="flex flex-col items-center phone-mock-text-primary"><span className="text-base">🏠</span><span>Home</span></div>
              <div className="flex flex-col items-center"><span className="text-base">🔍</span><span>Explore</span></div>
              <div className="flex flex-col items-center"><span className="text-base">📋</span><span>Orders</span></div>
              <div className="flex flex-col items-center"><span className="text-base">💬</span><span>Support</span></div>
            </nav>

          </div>
        </div>

      </div>

      {/* ── SECURITY PASSCODE MODAL ─────────────────────────────────────────── */}
      <PasscodeModal 
        isOpen={passcodeOpen}
        onClose={() => {
          setPasscodeOpen(false);
          setPendingAction(null);
        }}
        onVerified={handleVerifiedAction}
        actionName={pendingAction ? pendingAction.type.replace('_', ' ') : 'Branding Update'}
      />

    </div>
  );
};

export default MarketingManager;
