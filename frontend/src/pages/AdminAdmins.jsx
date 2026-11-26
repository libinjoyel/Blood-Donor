import { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, AlertCircle, Plus, X, ShieldCheck, Trash2,
  Edit3, Save, User, Mail, Phone, Lock, KeyRound, CheckCircle2,
} from 'lucide-react';
import api from '../services/api';

const EMPTY_ADMIN_FORM = {
  name: '', email: '', phone: '', password: '', confirmPassword: '', adminRole: '',
};
const EMPTY_ROLE_FORM = { name: '', description: '', permissions: '' };

export default function AdminAdmins() {
  const [tab, setTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM);
  const [savingAdmin, setSavingAdmin] = useState(false);

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState(EMPTY_ROLE_FORM);
  const [savingRole, setSavingRole] = useState(false);

  const fetchAdmins = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    api.get(`/admin/admins?${params}`)
      .then((res) => setAdmins(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load administrators'))
      .finally(() => setLoading(false));
  }, [search]);

  const fetchRoles = useCallback(() => {
    api.get('/admin/roles')
      .then((res) => setRoles(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);
  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const updateAdmin = (field, value) => setAdminForm((p) => ({ ...p, [field]: value }));

  const openAddAdmin = () => {
    setEditingAdmin(null);
    setAdminForm(EMPTY_ADMIN_FORM);
    setShowAdminForm(true);
  };

  const openEditAdmin = (a) => {
    setEditingAdmin(a._id);
    setAdminForm({ name: a.name || '', email: a.email || '', phone: a.phone || '', password: '', confirmPassword: '', adminRole: a.adminRole || '' });
    setShowAdminForm(true);
  };

  const closeAdminForm = () => {
    setShowAdminForm(false);
    setEditingAdmin(null);
    setAdminForm(EMPTY_ADMIN_FORM);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (adminForm.password !== adminForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!editingAdmin && !adminForm.password) {
      setError('Password is required');
      return;
    }
    setSavingAdmin(true);
    setError('');
    try {
      if (editingAdmin) {
        const { confirmPassword: _cp, ...payload } = adminForm; // eslint-disable-line no-unused-vars
        const res = await api.put(`/admin/admins/${editingAdmin}`, payload);
        setAdmins((prev) => prev.map((a) => (a._id === editingAdmin ? { ...a, ...res.data } : a)));
      } else {
        const { confirmPassword: _cp, ...payload } = adminForm; // eslint-disable-line no-unused-vars
        await api.post('/admin/admins', payload);
        await fetchAdmins();
      }
      closeAdminForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save administrator');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!confirm('Delete this administrator?')) return;
    try {
      await api.delete(`/admin/admins/${id}`);
      setAdmins((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete administrator');
    }
  };

  const updateRole = (field, value) => setRoleForm((p) => ({ ...p, [field]: value }));

  const openAddRole = () => {
    setEditingRole(null);
    setRoleForm(EMPTY_ROLE_FORM);
    setShowRoleForm(true);
  };

  const openEditRole = (r) => {
    setEditingRole(r._id);
    setRoleForm({
      name: r.name || '',
      description: r.description || '',
      permissions: (r.permissions || []).join(', '),
    });
    setShowRoleForm(true);
  };

  const closeRoleForm = () => {
    setShowRoleForm(false);
    setEditingRole(null);
    setRoleForm(EMPTY_ROLE_FORM);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: roleForm.name.trim(),
      description: roleForm.description.trim(),
      permissions: roleForm.permissions.split(',').map((p) => p.trim()).filter(Boolean),
    };
    setSavingRole(true);
    setError('');
    try {
      if (editingRole) {
        await api.put(`/admin/roles/${editingRole}`, payload);
      } else {
        await api.post('/admin/roles', payload);
      }
      await fetchRoles();
      closeRoleForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!confirm('Delete this role? Admins assigned to it will be reset.')) return;
    try {
      await api.delete(`/admin/roles/${id}`);
      await fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading administrators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Administrators</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage admin accounts, professional roles and access</p>
      </div>

      {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={16} /> {error}<button onClick={() => setError('')} className="ml-auto"><X size={14} /></button></div>}

      <div className="bg-slate-100/80 p-1.5 rounded-xl flex gap-1 mb-6" role="tablist">
        <button role="tab" aria-selected={tab === 'admins'} onClick={() => setTab('admins')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg text-center transition-all duration-200 ${tab === 'admins' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          Administrators
        </button>
        <button role="tab" aria-selected={tab === 'roles'} onClick={() => setTab('roles')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg text-center transition-all duration-200 ${tab === 'roles' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          Roles
        </button>
      </div>

      {tab === 'admins' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, role..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
            </div>
            <button onClick={openAddAdmin}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 shadow-sm transition-all duration-200">
              <Plus size={16} />
              Add Administrator
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {admins.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No administrators found.</td></tr>
                  ) : (
                    admins.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-semibold">{a.name?.charAt(0) || '?'}</div>
                            <span className="text-sm font-medium text-slate-900">{a.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{a.email}</td>
                        <td className="px-4 py-3 text-slate-600">{a.phone}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600">
                            <ShieldCheck size={11} />
                            {a.adminRole || 'Administrator'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditAdmin(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Edit3 size={14} /></button>
                            <button onClick={() => handleDeleteAdmin(a._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-slate-500">Professional roles that can be assigned to administrators</p>
            <button onClick={openAddRole}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 shadow-sm transition-all duration-200">
              <Plus size={16} />
              Create Role
            </button>
          </div>

          {roles.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
              <ShieldCheck size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No roles created yet</p>
              <p className="text-xs text-slate-400 mt-1">Create roles like Doctor, Nurse, Assistant Doctor, etc. to assign to administrators.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((r) => (
                <div key={r._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditRole(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Edit3 size={14} /></button>
                      <button onClick={() => handleDeleteRole(r._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {r.description && <p className="text-sm text-slate-600">{r.description}</p>}

                  {r.permissions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.permissions.map((p) => (
                        <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                          <CheckCircle2 size={10} className="text-emerald-500" />
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showAdminForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={closeAdminForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editingAdmin ? 'Edit Administrator' : 'Add Administrator'}</h2>
              <button onClick={closeAdminForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleAdminSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="text" value={adminForm.name} onChange={(e) => updateAdmin('name', e.target.value)} required placeholder="Admin name"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="email" value={adminForm.email} onChange={(e) => updateAdmin('email', e.target.value)} required placeholder="admin@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="tel" value={adminForm.phone} onChange={(e) => updateAdmin('phone', e.target.value)} placeholder="+1 (555) 123-4567"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Professional Role</label>
                <div className="relative">
                  <ShieldCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                  <select value={adminForm.adminRole} onChange={(e) => updateAdmin('adminRole', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500">
                    <option value="">Administrator</option>
                    {roles.map((r) => <option key={r._id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Roles like Doctor, Nurse, etc. can be created in the Roles tab.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{editingAdmin ? 'New Password' : 'Password'}</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="password" value={adminForm.password} onChange={(e) => updateAdmin('password', e.target.value)} placeholder={editingAdmin ? 'Leave blank' : 'Min. 6 chars'}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="password" value={adminForm.confirmPassword} onChange={(e) => updateAdmin('confirmPassword', e.target.value)} placeholder="Re-enter"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-1">
                <button type="button" onClick={closeAdminForm}
                  className="flex-1 h-10 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingAdmin}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                  {savingAdmin ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {editingAdmin ? 'Save Changes' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoleForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={closeRoleForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
              <button onClick={closeRoleForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleRoleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role Name</label>
                <input type="text" value={roleForm.name} onChange={(e) => updateRole('name', e.target.value)} required placeholder="e.g. Doctor, Nurse, Assistant Doctor"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea value={roleForm.description} onChange={(e) => updateRole('description', e.target.value)} rows={2} placeholder="What does this role do?"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Permissions</label>
                <input type="text" value={roleForm.permissions} onChange={(e) => updateRole('permissions', e.target.value)} placeholder="e.g. manage donors, manage appointments"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                <p className="text-[11px] text-slate-400 mt-1">Comma-separated list of permissions.</p>
              </div>

              <div className="flex gap-3 mt-1">
                <button type="button" onClick={closeRoleForm}
                  className="flex-1 h-10 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingRole}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                  {savingRole ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
