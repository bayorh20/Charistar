import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase/config';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Plus, Edit, Trash2, Truck, Phone, Navigation, Check, X, 
  MapPin, Award, UserCheck, UserMinus, ShieldAlert, AlertCircle 
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';

const RiderManagement = () => {
  const { riders, orders, logAction } = useApp();
  
  // Modals / Selection States
  const [editingRider, setEditingRider] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);

  // Security Verification
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, id, data }

  // Form State
  const [riderForm, setRiderForm] = useState({
    name: '',
    phone: '',
    vehicleType: 'Motorbike', // 'Motorbike', 'Bicycle', 'Car'
    plateNumber: '',
    status: 'Idle' // 'Idle', 'Busy', 'Offline'
  });

  // Calculate completed deliveries for riders
  const getRiderStats = (riderName) => {
    if (!riderName) return { completed: 0, active: 0 };
    const completed = orders.filter(o => o.driverName === riderName && o.status === 'Delivered').length;
    const active = orders.filter(o => o.driverName === riderName && o.status !== 'Delivered' && o.statusIndex >= 0 && o.statusIndex < 4).length;
    return { completed, active };
  };

  // ── High-Risk Security Actions ─────────────────────────────────────────────
  const triggerRiderAction = (type, id, data = null) => {
    setPendingAction({ type, id, data });
    setPasscodeOpen(true);
  };

  const handleVerifiedAction = async () => {
    if (!pendingAction) return;
    const { type, id } = pendingAction;
    
    try {
      if (type === 'delete_rider') {
        const rider = riders.find(r => r.id === id);
        await deleteDoc(doc(db, 'riders', id));
        logAction(`Removed rider from fleet database: ${rider?.name || id}`);
      }
    } catch (err) {
      alert("Failed to delete rider profile: " + err.message);
    }

    setPendingAction(null);
  };

  // ── Save Rider ─────────────────────────────────────────────────────────────
  const saveRider = async (e) => {
    e.preventDefault();
    if (!riderForm.name || !riderForm.phone) return;

    const riderId = editingRider?.id || riderForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const docData = {
      name: riderForm.name,
      phone: riderForm.phone,
      vehicleType: riderForm.vehicleType,
      plateNumber: riderForm.plateNumber.toUpperCase(),
      status: riderForm.status,
      createdAt: editingRider?.createdAt || new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'riders', riderId), docData, { merge: true });
      logAction(`${editingRider ? 'Updated' : 'Registered'} dispatch rider: ${docData.name}`);
      setIsFormOpen(false);
      setEditingRider(null);
    } catch (err) {
      alert("Error saving rider: " + err.message);
    }
  };

  const openEditRider = (rider) => {
    setEditingRider(rider);
    setRiderForm({
      name: rider.name,
      phone: rider.phone || '',
      vehicleType: rider.vehicleType || 'Motorbike',
      plateNumber: rider.plateNumber || '',
      status: rider.status || 'Idle'
    });
    setIsFormOpen(true);
  };

  const toggleRiderStatus = async (rider, nextStatus) => {
    try {
      const riderRef = doc(db, 'riders', rider.id);
      await updateDoc(riderRef, { status: nextStatus });
      logAction(`Toggled status for rider ${rider.name} to ${nextStatus}`);
    } catch (err) {
      alert("Failed to update rider status: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
          <Truck size={18} className="text-orange-500" />
          <span>Active Dispatch Fleet</span>
        </h3>
        
        <button
          onClick={() => {
            setEditingRider(null);
            setRiderForm({
              name: '', phone: '', vehicleType: 'Motorbike', plateNumber: '', status: 'Idle'
            });
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>Register Rider</span>
        </button>
      </div>

      {/* Riders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {riders.map(rider => {
          const stats = getRiderStats(rider.name);
          const status = rider.status || 'Idle';
          return (
            <div 
              key={rider.id}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              
              <div>
                {/* Rider Header: Status and name */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-700/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200/10 flex items-center justify-center font-extrabold text-sm text-slate-600 dark:text-slate-300 uppercase">
                      {rider.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white">
                        {rider.name}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{rider.vehicleType} • {rider.plateNumber || 'No plate'}</p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                    status === 'Idle' 
                      ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' 
                      : status === 'Busy'
                      ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {status}
                  </span>
                </div>

                {/* Rider Info details */}
                <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Phone size={12} className="text-slate-400" /> Phone Contact:</span>
                    <a href={`tel:${rider.phone}`} className="text-slate-800 dark:text-white font-bold hover:text-orange-500 transition-colors">
                      {rider.phone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> Active Deliveries:</span>
                    <span className="text-slate-800 dark:text-white font-extrabold">{stats.active} Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Award size={12} className="text-slate-400" /> Lifetime Completed:</span>
                    <span className="inline-flex items-center gap-1 text-slate-800 dark:text-white font-black text-xs">
                      {stats.completed} Orders
                    </span>
                  </div>
                </div>
              </div>

              {/* Operations Footer */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-50 dark:border-slate-700/60">
                
                {/* Switch status shortcut */}
                <div className="flex gap-1">
                  {status !== 'Idle' && (
                    <button
                      onClick={() => toggleRiderStatus(rider, 'Idle')}
                      className="p-1 hover:bg-green-50 dark:hover:bg-green-500/10 text-green-500 rounded-md text-[10px] font-black uppercase"
                    >
                      Make Idle
                    </button>
                  )}
                  {status !== 'Offline' && (
                    <button
                      onClick={() => toggleRiderStatus(rider, 'Offline')}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 rounded-md text-[10px] font-black uppercase"
                    >
                      Offline
                    </button>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditRider(rider)}
                    className="p-1.5 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-slate-400 hover:text-orange-500 rounded-lg transition-colors"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => triggerRiderAction('delete_rider', rider.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

              </div>

            </div>
          );
        })}
        {riders.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center rounded-3xl">
            <span className="text-3xl">🛵</span>
            <p className="text-sm font-bold text-slate-400 mt-2">No dispatch riders registered in your fleet.</p>
          </div>
        )}
      </div>

      {/* ── MODAL: RIDER FORM ────────────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-999 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => {
                setIsFormOpen(false);
                setEditingRider(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase mb-6 pl-0.5 flex items-center gap-1.5">
              <Truck size={18} className="text-orange-500" />
              <span>{editingRider ? 'Edit Rider Profile' : 'Register Dispatch Rider'}</span>
            </h3>

            <form onSubmit={saveRider} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Rider Full Name</label>
                <input 
                  type="text" 
                  value={riderForm.name}
                  onChange={(e) => setRiderForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Kunle Adebayo"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Telephone Contact</label>
                <input 
                  type="tel" 
                  value={riderForm.phone}
                  onChange={(e) => setRiderForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +234 812 345 6789"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Vehicle Type</label>
                  <select 
                    value={riderForm.vehicleType}
                    onChange={(e) => setRiderForm(prev => ({ ...prev, vehicleType: e.target.value }))}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="Motorbike">Motorbike 🛵</option>
                    <option value="Bicycle">Bicycle 🚲</option>
                    <option value="Car">Delivery Van 🚗</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Plate Number</label>
                  <input 
                    type="text" 
                    value={riderForm.plateNumber}
                    onChange={(e) => setRiderForm(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                    placeholder="e.g. KJA-567AB"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Rider Initial Status</label>
                <select 
                  value={riderForm.status}
                  onChange={(e) => setRiderForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="Idle">Idle (Available for Dispatch)</option>
                  <option value="Busy">Busy (Delivering)</option>
                  <option value="Offline">Offline (Unavailable)</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingRider(null);
                  }}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-2xl font-black text-xs uppercase transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase transition-all shadow-sm"
                >
                  {editingRider ? 'Save Changes' : 'Register Rider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SECURITY PASSCODE MODAL ─────────────────────────────────────────── */}
      <PasscodeModal 
        isOpen={passcodeOpen}
        onClose={() => {
          setPasscodeOpen(false);
          setPendingAction(null);
        }}
        onVerified={handleVerifiedAction}
        actionName={pendingAction ? pendingAction.type.replace('_', ' ') : 'Delete Rider Profile'}
      />

    </div>
  );
};

export default RiderManagement;
