'use client'

/**
 * (superadmin)/users/page.jsx
 * User Management for Superadmins.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Mail, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Filter,
  UserPlus,
  Key,
  Edit,
  X,
  Trash2
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

const ROLE_OPTIONS = [
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'investor', label: 'Investor (LP)' },
  { value: 'gp_investor', label: 'GP Shareholder' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function SuperAdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        user.email.toLowerCase().includes(search.toLowerCase()) ||
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
    
    // Convert multiple roles if necessary (though here we might just have a string)
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-white/40 text-sm">Manage system users, roles, and approvals.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-500/10"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            type="text" 
            placeholder="Search by email or name..."
            className="w-full bg-[#0a0014] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-purple-500/40 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-white/30" />
          <select 
            className="bg-[#0a0014] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/40 transition-all"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">User</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Roles</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px]">Joined</th>
              <th className="px-6 py-4 font-bold text-white/40 uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{user.first_name} {user.last_name}</span>
                    <span className="text-white/30 text-xs">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.roles?.split(',').map(role => (
                      <span key={role} className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                        {role.trim()}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {user.is_approved ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                        <CheckCircle2 size={14} /> Approved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400 text-xs">
                        <XCircle size={14} /> Pending
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-white/40 text-xs">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => resetPasswordMutation.mutate(user.id)}
                      title="Send Password Reset"
                      className="p-2 text-white/30 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                    >
                      <Key size={16} />
                    </button>
                    <button 
                      onClick={() => openModal(user)}
                      className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-white/20 italic">
                  No users found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0124] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {selectedUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button onClick={closeModal} className="text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">First Name</label>
                  <input 
                    name="first_name"
                    defaultValue={selectedUser?.first_name}
                    required
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Last Name</label>
                  <input 
                    name="last_name"
                    defaultValue={selectedUser?.last_name}
                    required
                    className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Email Address</label>
                <input 
                  name="email"
                  type="email"
                  defaultValue={selectedUser?.email}
                  required
                  disabled={!!selectedUser}
                  className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest px-1">Roles (comma separated)</label>
                <input 
                  name="roles"
                  defaultValue={selectedUser?.roles}
                  placeholder="entrepreneur, investor"
                  required
                  className="w-full bg-[#060010] border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-purple-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  id="is_approved"
                  name="is_approved"
                  type="checkbox"
                  defaultChecked={selectedUser?.is_approved}
                  className="w-4 h-4 rounded border-white/10 bg-[#060010] text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="is_approved" className="text-sm text-white/60">Approved for access</label>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {(createMutation.isLoading || updateMutation.isLoading) ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {selectedUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Save({ size }) {
  return <CheckCircle2 size={size} />;
}
