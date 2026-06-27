import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { db } from '../firebase/config';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { 
  Search, ClipboardList, Clock, Truck, Edit3, 
  Check, X, FileText, CheckCircle2, ChevronRight, MapPin, 
  Phone, User, Loader2, AlertCircle
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';
import { playSuccessChime } from '../utils/sound';

const Orders = () => {
  const { orders, riders, logAction, menuItems } = useApp();

  const getItemImage = (item) => {
    if (item.image) return item.image;
    const found = (menuItems || []).find(m => m.id === item.id);
    return found?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';
  };
  const location = useLocation();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Edit fields
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [selectedRider, setSelectedRider] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Passcode Modal state
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'edit'|'status'|'payout', callback: fn }
  const [pendingActionName, setPendingActionName] = useState('');

  // Handle auto-focus highlight from Live Feed redirect
  useEffect(() => {
    if (location.state && location.state.highlightOrderId && orders) {
      const order = orders.find(o => o.id === location.state.highlightOrderId);
      if (order) {
        handleViewDetails(order);
      }
    }
  }, [location.state, orders]);

  // ✅ KEY FIX: Keep the detail panel in sync with live Firestore data.
  // When the admin updates status/details, Firestore stream pushes a new snapshot.
  // Without this, the panel shows stale data until the admin manually re-clicks.
  useEffect(() => {
    if (!selectedOrder || !orders) return;
    const freshOrder = orders.find(o => o.id === selectedOrder.id);
    if (freshOrder) {
      setSelectedOrder(freshOrder);
    }
  }, [orders]); // Re-run whenever the Firestore orders stream delivers new data

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setEditAddress(order.address?.name || '');
    setEditPhone(order.customerPhone || '');
    setEditNotes(order.notes || '');
    setSelectedRider(order.driverName || '');
    setStatusNote('');
  };

  // Trigger PIN verification for sensitive edits
  const triggerEditVerification = (e) => {
    e.preventDefault();
    setPendingAction({
      type: 'edit',
      callback: executeOrderEdits
    });
    setPendingActionName('Modify Order Details');
    setPasscodeOpen(true);
  };

  const executeOrderEdits = async () => {
    if (!selectedOrder) return;
    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      
      const updateData = {
        'address.name': editAddress,
        'address.details': editAddress,
        customerPhone: editPhone,
        notes: editNotes,
        activityLogs: arrayUnion({
          event: 'Details Modified',
          timestamp: new Date().toISOString(),
          actor: 'Super Admin',
          note: `Address, phone, or notes updated manually.`
        })
      };

      await updateDoc(orderRef, updateData);
      playSuccessChime();
      logAction(`Modified details for Order #${selectedOrder.id}`);
      
      // Update local preview state
      setSelectedOrder(prev => ({
        ...prev,
        address: { ...prev.address, name: editAddress, details: editAddress },
        customerPhone: editPhone,
        notes: editNotes
      }));
      
      alert('Order details modified successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to edit order.');
    }
  };

  // Update order status milestones
  const handleUpdateStatus = async (newStatus, index) => {
    if (!selectedOrder) return;

    const action = async () => {
      try {
        const orderRef = doc(db, 'orders', selectedOrder.id);
        const logEntry = {
          event: newStatus,
          timestamp: new Date().toISOString(),
          actor: 'Super Admin',
          note: statusNote.trim() || `Status updated to ${newStatus}`
        };

        const updateData = {
          status: newStatus,
          statusIndex: index,
          activityLogs: arrayUnion(logEntry)
        };

        // If rider is assigned, sync it too
        if (newStatus === 'Preparing' || newStatus === 'Ready') {
          if (selectedRider) {
            updateData.driverName = selectedRider;
            logEntry.note += ` (Rider ${selectedRider} assigned)`;
          }
        }

        await updateDoc(orderRef, updateData);
        playSuccessChime();
        logAction(`Updated Order #${selectedOrder.id} status to: ${newStatus}`);
        
        // Update local preview state
        setSelectedOrder(prev => ({
          ...prev,
          status: newStatus,
          statusIndex: index,
          driverName: selectedRider || prev.driverName
        }));

        setStatusNote('');
        alert(`Order status updated to "${newStatus}"`);
      } catch (err) {
        console.error(err);
        alert('Failed to update order status.');
      }
    };

    // If cancelling or completing order, require PIN validation
    if (newStatus === 'Cancelled' || newStatus === 'Delivered') {
      setPendingAction({
        type: 'status',
        callback: action
      });
      setPendingActionName(`${newStatus === 'Cancelled' ? 'Cancel' : 'Deliver'} Order #${selectedOrder.id}`);
      setPasscodeOpen(true);
    } else {
      await action();
    }
  };

  // Filter queue
  const filteredList = (orders || []).filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) || 
                          order.customerName.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return order.status === statusFilter && matchesSearch;
  });

  // Printable Tax Invoice template
  const printInvoice = () => {
    if (!selectedOrder) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - Order #${selectedOrder.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 20px; }
            .meta { margin: 20px 0; font-size: 14px; line-height: 1.6; }
            .table { w-full border-collapse: collapse; margin-top: 30px; }
            .table th, .table td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background: #f8fafc; font-weight: bold; }
            .total { text-align: right; margin-top: 30px; font-size: 18px; font-weight: bold; color: #ea580c; }
            .footer { text-align: center; font-size: 11px; color: #888; margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>FOODMAXX CULINARY INVOICE</h2>
            <p>Receipt ID: #${selectedOrder.id} | Date: ${selectedOrder.timestamp || ''}</p>
          </div>
          <div class="meta">
            <strong>Customer:</strong> ${selectedOrder.customerName}<br/>
            <strong>Phone:</strong> ${selectedOrder.customerPhone}<br/>
            <strong>Delivery Address:</strong> ${selectedOrder.address?.name || 'No address set'}<br/>
            <strong>Payment Method:</strong> ${selectedOrder.payment?.method || 'Pay on Delivery'}
          </div>
          <table class="table" style="width: 100%;">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${selectedOrder.cart?.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₦${item.price.toLocaleString()}</td>
                  <td>₦${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            Total Charged: ₦${(selectedOrder.total || 0).toLocaleString()}
          </div>
          <div class="footer">
            Thank you for ordering with FoodMaxx!
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/70 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl backdrop-blur-md shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID or customer name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {/* Status Scroll Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Order Received', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === f
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {f === 'ALL' ? 'All Queue' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Orders Queue List */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Orders List ({filteredList.length})</h4>
          
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {filteredList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm font-bold">
                No orders match your filter criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filteredList.map(order => (
                  <div 
                    key={order.id}
                    onClick={() => handleViewDetails(order)}
                    className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id
                        ? 'bg-slate-50/70 dark:bg-slate-700/30'
                        : 'hover:bg-slate-50/40 dark:hover:bg-slate-700/10'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-black text-xs text-slate-800 dark:text-white">#{order.id}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-extrabold uppercase px-2 py-0.5 rounded-md">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{order.customerName}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(order.cart || order.items || []).slice(0, 4).map((i, idx) => (
                          <div key={idx} className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 -mr-2 shadow-sm" title={`${i.quantity}x ${i.name}`}>
                            <img 
                              src={getItemImage(i)} 
                              alt={i.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 bg-orange-600 text-white font-extrabold text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white dark:border-slate-800">
                              {i.quantity}
                            </span>
                          </div>
                        ))}
                        {(order.cart || order.items || []).length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 font-extrabold text-[9px] flex items-center justify-center border-2 border-white dark:border-slate-800 -mr-2">
                            +{(order.cart || order.items || []).length - 4}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-xs text-orange-500 block">
                        ₦{(order.total || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">{order.timestamp || ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Order Detailed Panel */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Order Details</h4>

          {selectedOrder ? (
            <div className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-5">
              
              {/* Header Details */}
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-3">
                <div>
                  <h4 className="font-black text-sm text-slate-800 dark:text-white">#{selectedOrder.id}</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Status: {selectedOrder.status}</p>
                </div>
                <button 
                  onClick={printInvoice}
                  className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors"
                  title="Print Invoice"
                >
                  <FileText size={16} />
                </button>
              </div>

              {/* Visual Items Summary list with images */}
              <div className="space-y-2 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordered Items</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {(selectedOrder.cart || selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          <img 
                            src={getItemImage(item)} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            ₦{item.price.toLocaleString()} x {item.quantity}
                          </p>
                          {item.customizations && item.customizations.length > 0 && (
                            <p className="text-[9px] text-orange-500 font-semibold mt-0.5">
                              + {typeof item.customizations[0] === 'object' ? item.customizations.map(c => c.name).join(', ') : item.customizations.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-white">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Milestones Updater */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Change Status</p>
                
                {/* Note input */}
                <input 
                  type="text" 
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional log message (e.g. Cooking started)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />

                {/* Status Options */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { s: 'Order Received', idx: 0 },
                    { s: 'Preparing', idx: 1 },
                    { s: 'Ready', idx: 2 },
                    { s: 'Out for Delivery', idx: 3 },
                    { s: 'Delivered', idx: 4 },
                    { s: 'Cancelled', idx: 5 }
                  ].map(({ s, idx }) => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(s, idx)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                        selectedOrder.status === s
                          ? 'bg-orange-500 text-white shadow-sm'
                          : s === 'Cancelled'
                            ? 'bg-red-50 hover:bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:text-red-500 border border-red-100 dark:border-red-500/20'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rider Selector */}
              <div className="space-y-1.5 border-t border-slate-50 dark:border-slate-700/50 pt-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Rider Dispatch</label>
                <select
                  value={selectedRider}
                  onChange={(e) => {
                    setSelectedRider(e.target.value);
                    updateDoc(doc(db, 'orders', selectedOrder.id), { driverName: e.target.value })
                      .catch(console.error);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="">No Rider Assigned</option>
                  {riders?.map(rider => (
                    <option key={rider.id} value={rider.name}>
                      {rider.name} ({rider.status || 'Offline'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Details Forms (Passcode Secured) */}
              <form onSubmit={triggerEditVerification} className="space-y-3.5 border-t border-slate-50 dark:border-slate-700/50 pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modifications (PIN Secured)</p>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">Customer Phone</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">Delivery Address</label>
                  <input 
                    type="text" 
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  Save Modifications
                </button>
              </form>

              {/* Audit logs trail */}
              <div className="space-y-2 border-t border-slate-50 dark:border-slate-700/50 pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Log Trail</p>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {selectedOrder.activityLogs?.map((log, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                        <span>{log.event}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-400 font-semibold">{log.note || ''}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800">
              <span className="text-2xl">📋</span>
              <p className="text-xs text-slate-400 font-bold mt-2">Select an order from the list queue to review details.</p>
            </div>
          )}
        </div>

      </div>

      {/* Security Verification Passcode */}
      <PasscodeModal 
        isOpen={passcodeOpen}
        onClose={() => setPasscodeOpen(false)}
        actionName={pendingActionName}
        onVerified={() => {
          if (pendingAction && pendingAction.callback) {
            pendingAction.callback();
          }
        }}
      />
    </div>
  );
};

export default Orders;
