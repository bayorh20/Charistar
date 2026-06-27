import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Search, ShieldAlert, Award, Wallet, Ban, CheckCircle, Eye, 
  X, UserCheck, UserMinus, Calendar, MapPin, Gift, TrendingUp,
  FileText, ShieldCheck, Check
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';

const UsersManagement = () => {
  const { users, orders, logAction } = useApp();
  const toast = useToast();
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'wallet', 'points'
  
  // Modal / Drawer Selection
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  
  // Security verification
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, userId, data }
  
  // Wallet/Points adjust state
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('add'); // 'add' or 'subtract'

  // Admin persistent notes state
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (selectedUser) {
      setAdminNotes(selectedUser.adminNotes || '');
    }
  }, [selectedUser]);

  // Customer segmentation logic
  const getUserSegmentation = (userId) => {
    const userOrders = orders.filter(o => o.userId === userId);
    const completedOrders = userOrders.filter(o => o.status === 'Delivered');
    const totalSpent = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    if (userOrders.length === 0) {
      return { label: 'Fresh Signup', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' };
    }
    if (totalSpent >= 25000) {
      return { label: '💎 VIP Spender', color: 'bg-purple-500 text-white shadow-sm' };
    }
    if (completedOrders.length >= 8) {
      return { label: '🔥 Champion', color: 'bg-emerald-500 text-white shadow-sm' };
    }
    if (completedOrders.length >= 3) {
      return { label: 'Active Buyer', color: 'bg-orange-500 text-white shadow-sm' };
    }
    return { label: 'Standard', color: 'bg-slate-100 dark:bg-slate-700 text-slate-655 dark:text-slate-350' };
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchQuery = 
          (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.phone || '').includes(searchQuery);
        
        const status = user.status || 'Active';
        const matchStatus = statusFilter === 'all' || status.toLowerCase() === statusFilter.toLowerCase();
        
        return matchQuery && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '');
        } else if (sortBy === 'wallet') {
          return (b.wallet || 0) - (a.wallet || 0);
        } else if (sortBy === 'points') {
          return (b.points || 0) - (a.points || 0);
        }
        return 0;
      });
  }, [users, searchQuery, statusFilter, sortBy]);

  // User's order list
  const getUserOrders = (userId) => {
    return orders.filter(order => order.userId === userId);
  };

  // Save admin notes to Firestore
  const handleSaveNotes = async () => {
    if (!selectedUser) return;
    const toastId = toast.info('Saving Notes', 'Writing staff comments to customer card...');
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, { adminNotes });
      toast.dismiss(toastId);
      toast.success('Notes Saved', 'Customer admin notes updated successfully.');
      logAction(`Updated notes for customer: ${selectedUser.name || selectedUser.id}`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Failed to save notes', err.message);
    }
  };

  // High-Risk Security Actions
  const triggerUserAction = (type, userId, data = null) => {
    setPendingAction({ type, userId, data });
    setPasscodeOpen(true);
  };

  const handleVerifiedAction = async () => {
    if (!pendingAction) return;
    const { type, userId, data } = pendingAction;
    const userRef = doc(db, 'users', userId);
    const userObj = users.find(u => u.id === userId);
    const userName = userObj?.name || 'Customer';

    try {
      if (type === 'ban_user') {
        await updateDoc(userRef, { status: 'Banned' });
        logAction(`Banned user: ${userName} (${userId})`);
        toast.success('Account Banned', `"${userName}" has been blocked from placing orders.`);
      } else if (type === 'suspend_user') {
        await updateDoc(userRef, { status: 'Suspended' });
        logAction(`Suspended user: ${userName} (${userId})`);
        toast.success('Account Suspended', `"${userName}" has been temporarily suspended.`);
      } else if (type === 'reactivate_user') {
        await updateDoc(userRef, { status: 'Active' });
        logAction(`Reactivated user: ${userName} (${userId})`);
        toast.success('Account Reactivated', `"${userName}" is active again.`);
      } else if (type === 'adjust_wallet') {
        const amount = Number(data.amount);
        const currentWallet = userObj?.wallet || 0;
        const newWallet = data.operation === 'add' ? currentWallet + amount : Math.max(0, currentWallet - amount);
        
        await updateDoc(userRef, { wallet: newWallet });
        logAction(`Adjusted wallet for ${userName} (${data.operation} ₦${amount.toLocaleString()}). New: ₦${newWallet.toLocaleString()}`);
        toast.success('Wallet Adjusted', `Wallet balance updated successfully.`);
        setWalletModalOpen(false);
      } else if (type === 'adjust_points') {
        const amount = Math.floor(Number(data.amount));
        const currentPoints = userObj?.points || 0;
        const newPoints = data.operation === 'add' ? currentPoints + amount : Math.max(0, currentPoints - amount);
        
        await updateDoc(userRef, { points: newPoints });
        logAction(`Adjusted points for ${userName} (${data.operation} ${amount} pts). New: ${newPoints} pts`);
        toast.success('Points Adjusted', `Points balance updated successfully.`);
        setPointsModalOpen(false);
      }
    } catch (err) {
      toast.error('Operation Failed', err.message);
    }

    setPendingAction(null);
    setAdjustAmount('');
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Sort controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or phone..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:border-orange-500 transition-all text-slate-800 dark:text-white"
          />
        </div>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Users</option>
          <option value="suspended">Suspended Users</option>
          <option value="banned">Banned Users</option>
        </select>

        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
        >
          <option value="name">Sort by Name</option>
          <option value="wallet">Sort by Wallet Balance</option>
          <option value="points">Sort by Reward Points</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/10">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Segment</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Wallet Balance</th>
                <th className="px-6 py-4">Reward Points</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-750 text-xs font-semibold">
              {filteredUsers.map(user => {
                const status = user.status || 'Active';
                const segment = getUserSegmentation(user.id);
                return (
                  <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                    
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.photo || '/avatar_male.webp'} 
                          alt={user.name} 
                          className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-slate-700" 
                          onError={(e) => { e.target.src = '/avatar_male.webp'; }}
                        />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 leading-tight">
                            {user.name || 'Guest User'}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 block mt-0.5">ID: {user.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Segment Pill */}
                    <td className="px-6 py-4">
                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${segment.color}`}>
                        {segment.label}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      <div>
                        <p>{user.email || 'No email registered'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{user.phone || 'No phone registered'}</p>
                      </div>
                    </td>

                    {/* Wallet */}
                    <td className="px-6 py-4 font-extrabold text-slate-850 dark:text-white">
                      ₦{(user.wallet || 0).toLocaleString()}
                    </td>

                    {/* Points */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                        <Award size={14} />
                        {user.points || 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        status === 'Active'
                          ? 'bg-green-500/10 text-green-600'
                          : status === 'Suspended'
                          ? 'bg-yellow-500/10 text-yellow-600'
                          : 'bg-red-500/10 text-red-600'
                      }`}>
                        {status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setWalletModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-400 hover:text-orange-500 rounded-lg transition-colors"
                        >
                          <Wallet size={14} />
                        </button>

                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setPointsModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-400 hover:text-amber-500 rounded-lg transition-colors"
                        >
                          <Award size={14} />
                        </button>

                        {status === 'Active' ? (
                          <button 
                            onClick={() => triggerUserAction('suspend_user', user.id)}
                            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-400 hover:text-yellow-600 rounded-lg transition-colors"
                          >
                            <UserMinus size={14} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => triggerUserAction('reactivate_user', user.id)}
                            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-400 hover:text-green-600 rounded-lg transition-colors"
                          >
                            <UserCheck size={14} />
                          </button>
                        )}
                        {status !== 'Banned' && (
                          <button 
                            onClick={() => triggerUserAction('ban_user', user.id)}
                            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CUSTOMER DETAILS DRAWER */}
      {selectedUser && !walletModalOpen && !pointsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-999 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 relative space-y-5">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250"
            >
              <X size={20} />
            </button>

            {/* Profile Overview */}
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-750 pb-5">
              <img 
                src={selectedUser.photo || '/avatar_male.webp'} 
                alt={selectedUser.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-orange-500" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-850 dark:text-white leading-tight">
                    {selectedUser.name || 'Guest User'}
                  </h3>
                  <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${getUserSegmentation(selectedUser.id).color}`}>
                    {getUserSegmentation(selectedUser.id).label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedUser.email || 'No email'}</p>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded uppercase">
                    Status: {selectedUser.status || 'Active'}
                  </span>
                  {selectedUser.createdAt && (
                    <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 text-slate-655 dark:text-slate-400 px-2 py-0.5 rounded uppercase flex items-center gap-0.5">
                      <Calendar size={8} />
                      Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Wallet size={12} className="text-orange-500" /> Wallet Balance
                </span>
                <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                  ₦{(selectedUser.wallet || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Award size={12} className="text-amber-500" /> Reward Points
                </span>
                <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                  {selectedUser.points || 0} <span className="text-[10px] text-slate-400 font-bold">pts</span>
                </p>
              </div>
            </div>

            {/* Persistent Staff Comments Panel */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-850 dark:text-white uppercase tracking-wider pl-0.5 flex items-center gap-1">
                <FileText size={14} className="text-orange-500" /> Internal Staff Comments
              </h4>
              <div className="space-y-2">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add details (e.g. VIP client, allergic to eggs, persistent caller)..."
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                />
                <button
                  onClick={handleSaveNotes}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white font-black text-[9px] uppercase px-3 py-1.5 rounded-xl transition-all shadow-xs"
                >
                  <Check size={10} /> Save Comments
                </button>
              </div>
            </div>

            {/* Referral Stats */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-855 dark:text-white uppercase tracking-wider pl-0.5 flex items-center gap-1">
                <Gift size={14} className="text-orange-500" /> Referrals
              </h4>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-900 text-xs space-y-2 font-bold text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Referral Code:</span>
                  <span className="text-slate-800 dark:text-white uppercase font-black">{selectedUser.referralCode || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Referred By:</span>
                  <span className="text-slate-800 dark:text-white">{selectedUser.referredBy || 'Direct'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Referred Users Count:</span>
                  <span className="text-slate-800 dark:text-white">{selectedUser.referralsCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Saved Addresses */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-850 dark:text-white uppercase tracking-wider pl-0.5 flex items-center gap-1">
                <MapPin size={14} className="text-orange-500" /> Delivery Addresses
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(selectedUser.savedAddresses || []).map((addr, idx) => (
                  <div key={idx} className="flex gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-900 text-xs font-semibold">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700 dark:text-white leading-tight">{addr.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{addr.details}</p>
                    </div>
                  </div>
                ))}
                {(selectedUser.savedAddresses || []).length === 0 && (
                  <p className="text-[10px] text-slate-400 pl-0.5 font-bold">No saved addresses.</p>
                )}
              </div>
            </div>

            {/* Order History */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-850 dark:text-white uppercase tracking-wider pl-0.5 flex items-center gap-1">
                <TrendingUp size={14} className="text-orange-500" /> Order History ({getUserOrders(selectedUser.id).length} Orders)
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {getUserOrders(selectedUser.id).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-900 text-xs font-bold">
                    <div>
                      <p className="text-slate-800 dark:text-white font-extrabold">#{order.id}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.timestamp}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-600 dark:text-orange-400">₦{(order.total || 0).toLocaleString()}</p>
                      <span className="text-[8px] uppercase tracking-wider bg-orange-55 dark:bg-orange-500/10 px-1.5 py-0.5 rounded text-orange-600">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {getUserOrders(selectedUser.id).length === 0 && (
                  <p className="text-[10px] text-slate-400 pl-0.5 font-bold">No orders placed yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST WALLET */}
      {selectedUser && walletModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-999 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full border border-slate-150 dark:border-slate-700 shadow-2xl p-6 relative">
            <button 
              onClick={() => {
                setWalletModalOpen(false);
                setSelectedUser(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase mb-2">Adjust Virtual Wallet</h3>
            <p className="text-xs text-slate-400 font-bold mb-4">Customer: {selectedUser.name || 'Guest'}</p>

            <div className="space-y-4">
              <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex-1 py-2 font-bold text-xs rounded-lg transition-all ${
                    adjustType === 'add' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Add Funds
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('subtract')}
                  className={`flex-1 py-2 font-bold text-xs rounded-lg transition-all ${
                    adjustType === 'subtract' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Deduct Funds
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Amount (₦)</label>
                <input 
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="₦5,000"
                  className="w-full text-center text-xl font-bold py-2 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setWalletModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-400 rounded-xl font-bold text-xs"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => triggerUserAction('adjust_wallet', selectedUser.id, { amount: adjustAmount, operation: adjustType })}
                  disabled={!adjustAmount || Number(adjustAmount) <= 0}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs disabled:opacity-50"
                >
                  Execute Adjust
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST POINTS */}
      {selectedUser && pointsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-999 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full border border-slate-150 dark:border-slate-700 shadow-2xl p-6 relative">
            <button 
              onClick={() => {
                setPointsModalOpen(false);
                setSelectedUser(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase mb-2">Adjust Loyalty Points</h3>
            <p className="text-xs text-slate-400 font-bold mb-4">Customer: {selectedUser.name || 'Guest'}</p>

            <div className="space-y-4">
              <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`flex-1 py-2 font-bold text-xs rounded-lg transition-all ${
                    adjustType === 'add' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Give Points
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('subtract')}
                  className={`flex-1 py-2 font-bold text-xs rounded-lg transition-all ${
                    adjustType === 'subtract' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Deduct Points
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Amount (Pts)</label>
                <input 
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="200"
                  className="w-full text-center text-xl font-bold py-2 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPointsModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-400 rounded-xl font-bold text-xs"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => triggerUserAction('adjust_points', selectedUser.id, { amount: adjustAmount, operation: adjustType })}
                  disabled={!adjustAmount || Number(adjustAmount) <= 0}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs disabled:opacity-50"
                >
                  Execute Adjust
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY PASSCODE MODAL */}
      <PasscodeModal 
        isOpen={passcodeOpen}
        onClose={() => {
          setPasscodeOpen(false);
          setPendingAction(null);
        }}
        onVerified={handleVerifiedAction}
        actionName={pendingAction ? pendingAction.type.replace('_', ' ') : 'Confirm Admin Action'}
      />

    </div>
  );
};

export default UsersManagement;
