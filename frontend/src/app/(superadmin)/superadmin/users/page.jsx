'use client'

/**
 * (superadmin)/users/page.jsx
 * User Management for Superadmins — Institutional Identity Control.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  MoreVertical, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Filter,
  UserPlus,
  Key,
  Edit,
  X,
  Save,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Users as UsersIcon,
  ChevronRight
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

const ROLE_OPTIONS = [
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'investor', label: 'Investor (LP)' },
  { value: 'gp_investor', label: 'GP Shareholder' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function SuperAdminUsersPage() {
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch Users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['superadmin', 'users'],
    queryFn: async () => {
      const res = await api.get('/superadmin/users/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: (newUser) => api.post('/superadmin/users/', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'users']);
      toast.success('User created successfully');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create user')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/superadmin/users/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'users']);
      toast.success('User updated successfully');
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update user')
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id) => api.post(`/superadmin/users/${id}/reset-password/`),
    onSuccess: () => toast.success('Password reset email sent'),
    onError: () => toast.error('Failed to send reset email')
  });

  // 3. Filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.roles?.includes(roleFilter);
      
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const openModal = (user = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-6 theme-transition">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Identity Vault...</p>
    </div>
  );

  return (
    <div className="space-y-12 theme-transition animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
            <UsersIcon size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Identity Governance</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Institutional User Lifecycle & Role-Based Access Control</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-xl active:scale-95"
        >
          <UserPlus size={18} /> Enroll New Identity
        </button>
      </div>

      {/* Filters Ledger */}
      <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 shadow-2xl theme-transition relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted/20 group-focus-within:text-purple-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Query identity by email or name..."
            className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl pl-16 pr-6 py-4 text-sm text-foreground outline-none focus:border-purple-500/40 transition-all font-medium placeholder:text-text-muted/20 shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-text-muted/40 shadow-inner">
            <Filter size={20} />
          </div>
          <select 
            className="bg-foreground/[0.03] border border-border-theme rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-widest text-foreground outline-none focus:border-purple-500/40 transition-all cursor-pointer shadow-inner appearance-none min-w-[200px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all" className="bg-background">All Access Levels</option>
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-background">{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Identity Table */}
      <div className="bg-card border border-border-theme rounded-[3rem] overflow-hidden shadow-2xl theme-transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground/[0.01] border-b border-border-theme">
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Identity Profile</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Institutional Roles</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Security Clearance</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Onboarded</th>
                <th className="px-10 py-6 text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-theme/50">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-foreground/[0.01] transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner group-hover:scale-110 transition-transform">
                        <Fingerprint size={24} />
                      </div>
                      <div>
                        <p className="text-foreground font-black text-sm uppercase tracking-tight group-hover:text-purple-500 transition-colors leading-tight">{user.first_name} {user.last_name}</p>
                        <p className="text-text-muted/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1 font-mono">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex flex-wrap gap-2">
                      {user.roles?.split(',').map(role => (
                        <span key={role} className="text-[8px] font-black uppercase tracking-[0.2em] bg-purple-500/5 text-purple-500 px-3 py-1 rounded-full border border-purple-500/10 shadow-sm">
                          {role.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-3">
                      {user.is_approved ? (
                        <div className="flex items-center gap-3 text-emerald-500 text-[9px] font-black uppercase tracking-widest bg-emerald-500/5 px-4 py-1.5 rounded-full border border-emerald-500/10 shadow-inner">
                          <ShieldCheck size={12} strokeWidth={3} /> Verified Access
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-amber-500 text-[9px] font-black uppercase tracking-widest bg-amber-500/5 px-4 py-1.5 rounded-full border border-amber-500/10 shadow-inner">
                          <ShieldAlert size={12} strokeWidth={3} /> Authorization Pending
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <p className="text-text-muted/40 text-[10px] font-black uppercase tracking-widest font-mono">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => resetPasswordMutation.mutate(user.id)}
                        title="Authorize Password Reset"
                        className="p-3 bg-foreground/5 text-text-muted/20 hover:text-purple-500 hover:bg-purple-500/10 rounded-xl transition-all shadow-sm active:scale-95 border border-border-theme/50"
                      >
                        <Key size={18} />
                      </button>
                      <button 
                        onClick={() => openModal(user)}
                        className="p-3 bg-foreground/5 text-text-muted/20 hover:text-foreground hover:bg-foreground/10 rounded-xl transition-all shadow-sm active:scale-95 border border-border-theme/50"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-10 py-32 text-center">
                    <div className="w-20 h-20 bg-foreground/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-border-theme shadow-inner opacity-20">
                      <Fingerprint size={40} />
                    </div>
                    <p className="text-text-muted/20 text-[10px] font-black uppercase tracking-[0.3em] italic">No identities match the current query</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-card border border-border-theme rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_48px_96px_-24px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 theme-transition">
            <div className="p-12 border-b border-border-theme flex items-center justify-between bg-foreground/[0.01]">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
                  <UserPlus size={24} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
                     {selectedUser ? 'Configure Identity' : 'Enroll New Identity'}
                   </h3>
                   <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mt-1 opacity-60">Provision institutional access & permission archetypes</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-3 bg-foreground/5 rounded-2xl text-text-muted hover:text-foreground transition-all active:scale-95">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-12 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.3em] ml-1">Legal Given Name</label>
                  <input 
                    name="first_name"
                    defaultValue={selectedUser?.first_name}
                    required
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 px-6 text-foreground text-sm font-medium focus:border-purple-500/40 outline-none transition-all shadow-inner"
                    placeholder="e.g. John"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.3em] ml-1">Legal Surname</label>
                  <input 
                    name="last_name"
                    defaultValue={selectedUser?.last_name}
                    required
                    className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 px-6 text-foreground text-sm font-medium focus:border-purple-500/40 outline-none transition-all shadow-inner"
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.3em] ml-1">Institutional Identifier (Email)</label>
                <input 
                  name="email"
                  type="email"
                  defaultValue={selectedUser?.email}
                  required
                  disabled={!!selectedUser}
                  className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 px-6 text-foreground text-sm font-medium focus:border-purple-500/40 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-inner"
                  placeholder="name@finlogic.capital"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.3em] ml-1">Permission Roles (Delimited)</label>
                <input 
                  name="roles"
                  defaultValue={selectedUser?.roles}
                  placeholder="entrepreneur, investor, gp_investor"
                  required
                  className="w-full bg-foreground/[0.03] border border-border-theme rounded-2xl py-4 px-6 text-foreground text-sm font-medium focus:border-purple-500/40 outline-none transition-all shadow-inner"
                />
              </div>

              <div className="p-6 bg-foreground/[0.03] rounded-2xl border border-border-theme shadow-inner flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <ShieldCheck size={20} />
                  </div>
                  <label htmlFor="is_approved" className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 cursor-pointer select-none">Authorize Institutional Access</label>
                </div>
                <input 
                  id="is_approved"
                  name="is_approved"
                  type="checkbox"
                  defaultChecked={selectedUser?.is_approved}
                  className="w-6 h-6 rounded-lg border-border-theme text-purple-600 focus:ring-purple-500/40 cursor-pointer"
                />
              </div>

              <div className="pt-10 flex gap-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 px-8 py-4 rounded-2xl border border-border-theme text-text-muted font-black text-[10px] uppercase tracking-widest hover:bg-foreground/5 transition-all shadow-sm active:scale-95"
                >
                  Discard Profile
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-[0.3em] px-8 py-4 rounded-2xl flex items-center justify-center gap-4 transition-all disabled:opacity-50 shadow-2xl shadow-purple-500/30 active:scale-95"
                >
                  {(createMutation.isLoading || updateMutation.isLoading) ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} strokeWidth={3} />
                  )}
                  {selectedUser ? 'Commit Configuration' : 'Enroll Identity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
