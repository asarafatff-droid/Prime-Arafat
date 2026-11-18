import React, { useEffect, useState } from 'react';
import { Plus, Shield, Trash2, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../lib/utils';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  createAdminInvite,
  deleteAdminUser,
  listAdminInvites,
  listAdmins,
  revokeAdminInvite,
  updateAdminUser,
} from '../../services/adminService';
import type { AdminInvite, AdminRole, AdminUser } from '../../types';

export function AdminUsersRolesPage() {
  const { adminUser } = useAuth();
  const { showToast } = useToast();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('manager');

  const isSuperAdmin = adminUser?.role === 'super_admin';

  const loadAll = async () => {
    setLoading(true);
    try {
      const [admList, invList] = await Promise.all([listAdmins(), listAdminInvites()]);
      setAdmins(admList);
      setInvites(invList);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load admin users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    if (!isSuperAdmin) {
      showToast('Only a Super Admin can invite new administrators.', 'error');
      return;
    }
    setSaving(true);
    try {
      await createAdminInvite(inviteEmail, inviteRole, adminUser.uid);
      setInviteEmail('');
      setInviteRole('manager');
      showToast('Admin invite created. They will receive admin access on verified login.', 'success');
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create invite.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (target: AdminUser, role: AdminRole) => {
    if (!isSuperAdmin) {
      showToast('Only a Super Admin can change roles.', 'error');
      return;
    }
    try {
      await updateAdminUser(target.id, { role });
      showToast(`Updated role for ${target.name}.`, 'success');
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update role.', 'error');
    }
  };

  const handleToggleActive = async (target: AdminUser) => {
    if (!isSuperAdmin) {
      showToast('Only a Super Admin can activate or suspend administrators.', 'error');
      return;
    }
    if (target.id === adminUser?.id) {
      showToast('You cannot deactivate your own account.', 'error');
      return;
    }
    try {
      await updateAdminUser(target.id, { active: !target.active });
      showToast(
        `${target.name} ${!target.active ? 'activated' : 'deactivated'}.`,
        'info'
      );
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update admin status.', 'error');
    }
  };

  const handleDeleteAdmin = async (target: AdminUser) => {
    if (!isSuperAdmin) {
      showToast('Only a Super Admin can remove administrators.', 'error');
      return;
    }
    if (target.id === adminUser?.id) {
      showToast('You cannot delete your own active session.', 'error');
      return;
    }
    try {
      await deleteAdminUser(target.id);
      showToast('Admin user removed.', 'info');
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete admin user.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Admin Users & Roles</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage role-based access control (Super Admin, Manager, Editor) and pending email invites.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Invite Form */}
        <form
          onSubmit={handleCreateInvite}
          className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-[#F85606]" />
            <h2 className="font-display text-base font-bold text-slate-900">
              Invite Administrator
            </h2>
          </div>

          {!isSuperAdmin && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              You are signed in as <strong>{adminUser?.role}</strong>. Only a Super Admin can invite or modify admin accounts.
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Verified Google / Email Address *
            </label>
            <input
              type="email"
              required
              disabled={!isSuperAdmin}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
            <select
              disabled={!isSuperAdmin}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AdminRole)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white disabled:bg-slate-50"
            >
              <option value="super_admin">Super Admin (Full Control)</option>
              <option value="manager">Manager (Catalog, Orders & Marketing)</option>
              <option value="editor">Editor (Products & Content)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || !isSuperAdmin}
            className="w-full h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            <span>{saving ? 'Sending Invite...' : 'Create Admin Invite'}</span>
          </button>

          <p className="text-[11px] text-slate-400">
            Primary Owner Email: <span className="font-mono">{BOOTSTRAPPED_ADMIN_EMAIL}</span>
          </p>
        </form>

        {/* Active Admins + Invites Lists */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h2 className="font-display text-sm font-bold text-slate-900">
                Active Administrators ({admins.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading admins...</div>
            ) : admins.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No admin records found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {admins.map((adm) => {
                  const isSelf = adm.id === adminUser?.id;
                  return (
                    <div
                      key={adm.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{adm.name}</p>
                          {isSelf && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FFF5F0] text-[#F85606]">
                              You
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              adm.active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {adm.active ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{adm.email}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          disabled={!isSuperAdmin || isSelf}
                          value={adm.role}
                          onChange={(e) => void handleRoleChange(adm, e.target.value as AdminRole)}
                          className="h-8 px-2.5 border border-slate-200 rounded-lg text-xs bg-white font-medium disabled:bg-slate-50"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="manager">Manager</option>
                          <option value="editor">Editor</option>
                        </select>

                        {!isSelf && isSuperAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleToggleActive(adm)}
                              title={adm.active ? 'Suspend admin' : 'Activate admin'}
                              className={`p-1.5 rounded-lg border ${
                                adm.active
                                  ? 'border-slate-200 text-emerald-700 hover:bg-emerald-50'
                                  : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {adm.active ? (
                                <UserCheck className="w-4 h-4" />
                              ) : (
                                <UserX className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteAdmin(adm)}
                              title="Remove admin"
                              className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h2 className="font-display text-sm font-bold text-slate-900">
                Pending Admin Invites ({invites.length})
              </h2>
            </div>

            {invites.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No pending admin invites.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invites.map((inv) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{inv.email}</p>
                      <p className="text-xs text-slate-500">
                        Role: <span className="font-semibold capitalize">{inv.role.replace('_', ' ')}</span> ·
                        Created {formatDate(inv.createdAt)}
                      </p>
                    </div>
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={async () => {
                          await revokeAdminInvite(inv.id);
                          showToast('Invite revoked.', 'info');
                          await loadAll();
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                        title="Revoke invite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
