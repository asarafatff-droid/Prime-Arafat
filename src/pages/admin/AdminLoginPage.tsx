import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../../services/adminService';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    authReady,
    loginWithGoogle,
    loginWithEmail,
    registerAdminEmail,
    sendVerificationEmail,
    reloadAndRefreshAdmin,
    sendPasswordReset,
    logout,
  } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'activate'>('login');
  const [fullName, setFullName] = useState('AS World Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deniedMsg, setDeniedMsg] = useState('');

  useEffect(() => {
    if (authReady && user && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [authReady, user, isAdmin, navigate]);

  const handleGoogleAdminLogin = async () => {
    setDeniedMsg('');
    setLoading(true);
    try {
      const { adminUser } = await loginWithGoogle(true);
      if (adminUser && adminUser.active) {
        showToast('Administrator access verified.', 'success');
        navigate('/admin/dashboard', { replace: true });
      } else {
        setDeniedMsg(
          'This Google account does not have administrator privileges. Sign in with the authorized store owner email or request an admin invite.'
        );
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Admin authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeniedMsg('');
    setLoading(true);
    try {
      if (mode === 'activate') {
        await registerAdminEmail(fullName, email, password);
        showToast(
          `Admin account created and verification email sent to ${email}. Please verify your email, then click "Check Verification".`,
          'success'
        );
      } else {
        const { user: signedInUser, adminUser } = await loginWithEmail(email, password, true);
        if (adminUser && adminUser.active) {
          showToast('Administrator access verified.', 'success');
          navigate('/admin/dashboard', { replace: true });
        } else if (!signedInUser.emailVerified) {
          setDeniedMsg(
            'Your email is not verified yet. Check your inbox for the Firebase verification link, or sign in with Google.'
          );
        } else {
          setDeniedMsg(
            'This email does not have administrator privileges. Use the authorized owner email or an invited admin email.'
          );
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Admin authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      const adm = await reloadAndRefreshAdmin();
      if (adm && adm.active) {
        showToast('Email verified! Opening Admin Dashboard.', 'success');
        navigate('/admin/dashboard', { replace: true });
      } else {
        showToast(
          'Email is still unverified or does not have admin permission yet.',
          'info'
        );
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Verification check failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async () => {
    const targetEmail = email.trim() || BOOTSTRAPPED_ADMIN_EMAIL;
    try {
      await sendPasswordReset(targetEmail);
      showToast(`Password reset link sent to ${targetEmail}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send reset email.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#F85606]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-400">AS World Admin</span>
        </div>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#FFF5F0] text-[#F85606] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            AS World Admin Panel
          </h1>
          <p className="text-xs text-slate-500">
            Sign in with your authorized administrator Google or Email/Password credentials.
          </p>
        </div>

        {(deniedMsg || (authReady && user && !isAdmin)) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p>
                {deniedMsg ||
                  (user && !user.emailVerified
                    ? `Signed in as ${user.email}, which requires email verification before entering the Admin Dashboard.`
                    : `Signed in as ${user?.email}, which is not an active administrator account.`)}
              </p>

              <div className="flex flex-wrap gap-2">
                {user && !user.emailVerified && (
                  <>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleCheckVerification}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded font-semibold inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Check Verification</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        try {
                          await sendVerificationEmail();
                          showToast('Verification email sent.', 'success');
                        } catch (e) {
                          showToast(
                            e instanceof Error ? e.message : 'Failed to send email.',
                            'error'
                          );
                        }
                      }}
                      className="px-2.5 py-1 bg-white border border-red-300 text-red-900 rounded font-semibold inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Resend Link</span>
                    </button>
                  </>
                )}
                {user && (
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="font-semibold underline text-red-900"
                  >
                    Sign out & switch account
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleAdminLogin}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
        >
          <ShieldCheck className="w-4 h-4 text-[#F85606]" />
          <span>{loading ? 'Verifying...' : 'Sign In with Google (Recommended)'}</span>
        </button>

        <div className="relative flex items-center">
          <div className="flex-1 border-t border-slate-200" />
          <span className="px-3 text-xs text-slate-400">or Email & Password</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* Mode Toggle: Sign In vs First-Time Email/Password Activation */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-1.5 rounded-md transition-colors ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('activate')}
            className={`py-1.5 rounded-md transition-colors ${
              mode === 'activate' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Set Email Password
          </button>
        </div>

        <form onSubmit={handleEmailAdminSubmit} className="space-y-3.5">
          {mode === 'activate' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Username / Display Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="AS World Super Admin"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={BOOTSTRAPPED_ADMIN_EMAIL}
                className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={handleSendReset}
                  className="text-[11px] font-semibold text-[#F85606] hover:underline inline-flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Forgot password?</span>
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mode === 'activate' && <UserPlus className="w-4 h-4" />}
            <span>
              {mode === 'activate'
                ? 'Create Admin Email & Password'
                : 'Sign In to Admin Panel'}
            </span>
          </button>
        </form>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Authorized Store Owner</p>
          <p>
            Owner email configured: <span className="font-mono font-semibold text-slate-900">{BOOTSTRAPPED_ADMIN_EMAIL}</span>.
            Sign in with Google or set an Email/Password account above and verify your email to unlock Super Admin access.
          </p>
        </div>
      </div>
    </div>
  );
}
