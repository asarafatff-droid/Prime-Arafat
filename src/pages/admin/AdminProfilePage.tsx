import React, { useEffect, useState } from 'react';
import { KeyRound, Lock, Save, ShieldCheck, UserCog } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime } from '../../lib/utils';
import { updateAdminUser } from '../../services/adminService';

export function AdminProfilePage() {
  const { user, adminUser, refreshAdmin, updateUserPassword, sendPasswordReset } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(adminUser?.name || '');
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPw, setUpdatingPw] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (adminUser?.name) {
      setName(adminUser.name);
    }
  }, [adminUser?.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    if (!name.trim()) {
      showToast('Username / Display name cannot be empty.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateAdminUser(adminUser.id, { name: name.trim() });
      await refreshAdmin();
      showToast('Admin username & profile updated.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setUpdatingPw(true);
    try {
      await updateUserPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Administrator password updated in Firebase Authentication.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update password.', 'error');
    } finally {
      setUpdatingPw(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await sendPasswordReset(user.email);
      showToast(`Password reset email sent to ${user.email}.`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not send password reset email.',
        'error'
      );
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Admin Profile & Security
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your administrator username, verified email ID, and login password.
        </p>
      </div>

      {/* Username & Identity */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-full bg-[#FFF5F0] text-[#F85606] flex items-center justify-center shrink-0">
            <UserCog className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-slate-900 truncate">
              {adminUser?.name || 'Administrator'}
            </p>
            <p className="text-xs text-slate-500 truncate">{adminUser?.email || user?.email}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold capitalize">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{adminUser?.role?.replace('_', ' ')}</span>
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admin Username / Display Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verified Admin Email ID
              </label>
              <input
                type="text"
                readOnly
                value={adminUser?.email || user?.email || ''}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrator UID
              </label>
              <input
                type="text"
                readOnly
                value={adminUser?.uid || user?.uid || ''}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 text-slate-600"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
            <span>Created: {formatDateTime(adminUser?.createdAt)}</span>
            <span>Last Updated: {formatDateTime(adminUser?.updatedAt)}</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Username & Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Password Management */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#F85606]" />
            <h2 className="font-display text-base font-bold text-slate-900">
              Admin Login Password
            </h2>
          </div>

          {user?.email && (
            <button
              type="button"
              disabled={sendingReset}
              onClick={handlePasswordReset}
              className="text-xs font-semibold text-[#F85606] hover:underline inline-flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{sendingReset ? 'Sending...' : 'Send Reset Email'}</span>
            </button>
          )}
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingPw}
            className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>{updatingPw ? 'Updating Password...' : 'Set / Update Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
