import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase/config';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Layers, Tag, Sliders, Edit, Trash2, Plus, X 
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';
import ProductManager from './ProductManager';
import CategoryManager from './CategoryManager';

const MenuManagement = () => {
  const { categories, menuItems, optionPresets, logAction } = useApp();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('items'); // 'items', 'categories', 'presets'
  
  // Modals / Passcode States
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, id }
  
  // Form states (Preset)
  const [editingPreset, setEditingPreset] = useState(null);
  const [isPresetFormOpen, setIsPresetFormOpen] = useState(false);
  const [presetForm, setPresetForm] = useState({
    title: '',
    type: 'single', // 'single' or 'multiple'
    max: 1,
    required: false,
    itemsText: '' // Comma or newline separated Name:Price
  });

  const triggerActionWithSecurity = (actionType, id) => {
    setPendingAction({ type: actionType, id });
    setPasscodeOpen(true);
  };

  const handleVerifiedAction = async () => {
    if (!pendingAction) return;
    const { type, id } = pendingAction;
    
    try {
      if (type === 'delete_preset') {
        const preset = optionPresets.find(p => p.id === id);
        await deleteDoc(doc(db, 'option_presets', id));
        logAction(`Deleted option preset: ${preset?.title || id}`);
        toast.success('Preset Deleted', `"${preset?.title || id}" has been removed.`);
      }
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
    
    setPendingAction(null);
  };

  // Option Presets Save
  const savePreset = async (e) => {
    e.preventDefault();
    if (!presetForm.title || !presetForm.itemsText) return;

    // Parse options lines: "Extra Beef:800" or "No Onion:0"
    const items = presetForm.itemsText
      .split('\n')
      .map(line => {
        const parts = line.split(':');
        if (parts.length >= 1) {
          return {
            name: parts[0].trim(),
            price: parts[1] ? Number(parts[1].trim()) : 0
          };
        }
        return null;
      })
      .filter(item => item && item.name);

    const presetId = editingPreset?.id || presetForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const docData = {
      title: presetForm.title,
      type: presetForm.type,
      max: Number(presetForm.max),
      required: !!presetForm.required,
      items
    };

    try {
      await setDoc(doc(db, 'option_presets', presetId), docData, { merge: true });
      logAction(`${editingPreset ? 'Updated' : 'Created'} option preset: ${presetForm.title}`);
      toast.success(
        editingPreset ? 'Preset Updated!' : 'Preset Saved!',
        `"${presetForm.title}" add-on preset has been saved.`
      );
      setEditingPreset(null);
      setPresetForm({ title: '', type: 'single', max: 1, required: false, itemsText: '' });
    } catch (err) {
      toast.error('Save Failed', err.message);
    }
  };

  const openEditPreset = (preset) => {
    setEditingPreset(preset);
    const itemsText = (preset.items || []).map(i => `${i.name}:${i.price}`).join('\n');
    setPresetForm({
      title: preset.title,
      type: preset.type || 'single',
      max: preset.max || 1,
      required: !!preset.required,
      itemsText
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'items' 
              ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Layers size={16} />
          <span>Product Catalog ({menuItems.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'categories' 
              ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Tag size={16} />
          <span>Category Workspace ({categories.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'presets' 
              ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sliders size={16} />
          <span>Add-on Option Presets ({optionPresets.length})</span>
        </button>
      </div>

      {/* Render Active Tab */}
      {activeTab === 'items' && <ProductManager />}
      {activeTab === 'categories' && <CategoryManager />}

      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Presets List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">Add-on Option Presets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optionPresets.map(preset => (
                  <div key={preset.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-900 flex flex-col justify-between hover:border-slate-200 transition-all">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border border-orange-100 dark:border-orange-500/20">
                          {preset.type === 'single' ? 'Pick Single' : 'Pick Multiple'}
                        </span>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => openEditPreset(preset)}
                            className="text-slate-400 hover:text-orange-500 p-1 transition-colors"
                          >
                            <Edit size={13} />
                          </button>
                          <button 
                            onClick={() => triggerActionWithSecurity('delete_preset', preset.id)}
                            className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      
                      <h4 className="font-black text-sm text-slate-800 dark:text-white mt-2">{preset.title}</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Required: {preset.required ? 'YES' : 'NO'} | Max Picks: {preset.max || 1}</p>
                      
                      <div className="mt-3 space-y-1">
                        {(preset.items || []).slice(0, 4).map((addon, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span>• {addon.name}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-350">
                              {addon.price > 0 ? `+₦${addon.price}` : 'Free'}
                            </span>
                          </div>
                        ))}
                        {(preset.items || []).length > 4 && (
                          <span className="text-[10px] text-slate-400 block pt-1 font-bold">+{(preset.items || []).length - 4} more items...</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {optionPresets.length === 0 && (
                  <div className="col-span-full border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center rounded-2xl">
                    <p className="text-xs text-slate-400 font-bold">No custom option presets defined yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preset Form */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">
              {editingPreset ? 'Edit Option Preset' : 'Create Option Preset'}
            </h3>
            <form onSubmit={savePreset} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Preset Title</label>
                <input 
                  type="text" 
                  value={presetForm.title}
                  onChange={(e) => setPresetForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Choose Your Protein"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-850 dark:text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Selection Mode</label>
                  <select 
                    value={presetForm.type}
                    onChange={(e) => setPresetForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="single">Single Select</option>
                    <option value="multiple">Multi Select</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Max Select Limit</label>
                  <input 
                    type="number" 
                    min={1}
                    value={presetForm.max}
                    onChange={(e) => setPresetForm(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-550 select-none cursor-pointer pl-1">
                <input 
                  type="checkbox" 
                  checked={presetForm.required}
                  onChange={(e) => setPresetForm(prev => ({ ...prev, required: e.target.checked }))}
                  className="w-4 h-4 rounded text-orange-500 border-slate-200 focus:ring-0"
                />
                <span>Mandatory (Must select to check out)</span>
              </label>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">
                  Add-on Options list (Name:Price)
                </label>
                <textarea 
                  value={presetForm.itemsText}
                  onChange={(e) => setPresetForm(prev => ({ ...prev, itemsText: e.target.value }))}
                  rows={6}
                  placeholder="Extra Beef:800&#10;Fried Plantain:400&#10;Boiled Egg:200"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 leading-relaxed"
                  required
                />
                <span className="text-[10px] text-slate-400 font-semibold block mt-1 pl-1">Write one option per line. Format: Option Name:Price (e.g. Goat Meat:1200)</span>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm"
              >
                {editingPreset ? 'Update Preset' : 'Save Option Preset'}
              </button>
              {editingPreset && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingPreset(null);
                    setPresetForm({ title: '', type: 'single', max: 1, required: false, itemsText: '' });
                  }}
                  className="w-full py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-350 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      <PasscodeModal 
        isOpen={passcodeOpen}
        onClose={() => setPasscodeOpen(false)}
        onVerified={handleVerifiedAction}
      />
    </div>
  );
};

export default MenuManagement;
