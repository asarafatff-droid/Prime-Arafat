import React, { useEffect, useState } from 'react';
import {
  Coins,
  Gamepad2,
  Plus,
  Power,
  Save,
  Share2,
  Trash2,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { generateId } from '../../lib/utils';
import {
  DEFAULT_REWARDS_SETTINGS,
  fetchSetting,
  saveSetting,
} from '../../services/settingsService';
import type { GameEngineType, MiniGameConfig, RewardsSettingsData } from '../../types';

const GAME_ENGINES: { value: GameEngineType; label: string }[] = [
  { value: 'spin_wheel', label: 'Lucky Spin Wheel' },
  { value: 'gift_tap', label: 'Mystery Gift Box Tap' },
  { value: 'scratch_card', label: 'Scratch & Win Card' },
  { value: 'lucky_dice', label: 'Lucky Number Dice' },
  { value: 'memory_flip', label: 'Memory Match Challenge' },
  { value: 'external_link', label: 'Custom / External Link Game' },
];

export function AdminCoinsGamesPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'coins' | 'games'>('coins');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RewardsSettingsData>(DEFAULT_REWARDS_SETTINGS);

  // New custom game form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEngine, setNewEngine] = useState<GameEngineType>('spin_wheel');
  const [newMinCoins, setNewMinCoins] = useState('10');
  const [newMaxCoins, setNewMaxCoins] = useState('80');
  const [newLimit, setNewLimit] = useState('1');
  const [newColor, setNewColor] = useState('#F85606');
  const [newExternalUrl, setNewExternalUrl] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchSetting('rewards', DEFAULT_REWARDS_SETTINGS);
        if (active) {
          setForm({
            ...DEFAULT_REWARDS_SETTINGS,
            ...data,
            games:
              Array.isArray(data.games) && data.games.length > 0
                ? data.games
                : DEFAULT_REWARDS_SETTINGS.games,
          });
        }
      } catch (err) {
        if (active) {
          showToast(
            err instanceof Error ? err.message : 'Failed to load Coins & Games settings.',
            'error'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persistRewards = async (next: RewardsSettingsData, msg: string) => {
    setSaving(true);
    try {
      await saveSetting('rewards', next);
      setForm(next);
      showToast(msg, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save rewards.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned: RewardsSettingsData = {
      ...form,
      coinsUnit: Math.max(1, Math.round(Number(form.coinsUnit) || 100)),
      takaPerUnit: Math.max(1, Math.round(Number(form.takaPerUnit) || 10)),
      maxCoinDiscountPercent: Math.min(
        100,
        Math.max(0, Math.round(Number(form.maxCoinDiscountPercent) || 50))
      ),
      minCoinsToRedeem: Math.max(1, Math.round(Number(form.minCoinsToRedeem) || 20)),
      dailyCheckInCoins: Math.max(0, Math.round(Number(form.dailyCheckInCoins) || 0)),
      streakBonusCoins: Math.max(0, Math.round(Number(form.streakBonusCoins) || 0)),
      shareBonusCoins: Math.max(0, Math.round(Number(form.shareBonusCoins) || 0)),
      maxDailyShares: Math.max(1, Math.round(Number(form.maxDailyShares) || 5)),
      referralSignupBonusCoins: Math.max(0, Math.round(Number(form.referralSignupBonusCoins) || 0)),
      referredWelcomeCoins: Math.max(0, Math.round(Number(form.referredWelcomeCoins) || 0)),
      referralOrderCommissionPct: Math.min(
        50,
        Math.max(0, Number(form.referralOrderCommissionPct) || 0)
      ),
    };
    await persistRewards(cleaned, 'AS Coins, Share & 10% Referral settings saved!');
  };

  const updateGame = (id: string, patch: Partial<MiniGameConfig>) => {
    setForm((prev) => ({
      ...prev,
      games: prev.games.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please enter a game title.', 'error');
      return;
    }
    if (newEngine === 'external_link' && !newExternalUrl.trim()) {
      showToast('Please enter an external game URL.', 'error');
      return;
    }
    const min = Math.max(1, Math.round(Number(newMinCoins) || 10));
    const max = Math.max(min, Math.round(Number(newMaxCoins) || 50));
    const added: MiniGameConfig = {
      id: generateId('game'),
      title: newTitle.trim(),
      description: newDesc.trim() || 'Play & win instant AS Coins!',
      engine: newEngine,
      minCoins: min,
      maxCoins: max,
      dailyPlayLimit: Math.max(1, Math.round(Number(newLimit) || 1)),
      enabled: true,
      accentColor: newColor || '#F85606',
      externalUrl: newEngine === 'external_link' ? newExternalUrl.trim() : undefined,
    };
    const next = { ...form, games: [...form.games, added] };
    await persistRewards(next, `Game "${added.title}" added to Play & Earn Arcade!`);
    setNewTitle('');
    setNewDesc('');
    setNewExternalUrl('');
  };

  const handleDeleteGame = async (id: string) => {
    const next = { ...form, games: form.games.filter((g) => g.id !== id) };
    await persistRewards(next, 'Game removed from Arcade.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            AS Coins, Share Bonus &amp; Mini-Games Studio
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Set how much each Coin is worth in Taka (৳), Share &amp; 10% Referral order commissions,
            and manage playable mini-games.
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('coins')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 ${
              tab === 'coins' ? 'bg-white text-[#F85606] shadow-xs' : 'text-slate-600'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Coins &amp; Referral Rates</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('games')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 ${
              tab === 'games' ? 'bg-white text-[#F85606] shadow-xs' : 'text-slate-600'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Mini-Games Arcade ({form.games.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          Loading rewards studio...
        </div>
      ) : tab === 'coins' ? (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Master Toggle & Exchange Rate */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] text-[#F85606] flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    AS Coins Value &amp; Checkout Redemption
                  </h2>
                  <p className="text-xs text-slate-500">
                    Example: {form.coinsUnit} Coins = ৳{form.takaPerUnit} off at checkout
                  </p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.coinsEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, coinsEnabled: e.target.checked }))}
                  className="w-4 h-4 accent-[#F85606]"
                />
                <span className="text-xs font-bold text-slate-800">
                  {form.coinsEnabled ? 'AS Coins Active' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coins Per Unit
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.coinsUnit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coinsUnit: Number(e.target.value) || 1 }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Taka Value Per Unit (৳)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.takaPerUnit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, takaPerUnit: Number(e.target.value) || 1 }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Coins to Redeem
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.minCoinsToRedeem}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minCoinsToRedeem: Number(e.target.value) || 1 }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Order Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.maxCoinDiscountPercent}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxCoinDiscountPercent: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Check-In, Share & Referral Commission */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Share2 className="w-5 h-5 text-[#F85606]" />
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Daily Check-In, Share Bonus &amp; 10% Order Referral Commission
                </h2>
                <p className="text-xs text-slate-500">
                  When someone joins with a friend&apos;s referral link and places an order, the
                  referrer earns the configured % of order value as AS Coins!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Check-In Coins
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.dailyCheckInCoins}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dailyCheckInCoins: Number(e.target.value) || 0 }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  7-Day Streak Bonus Coins
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.streakBonusCoins}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, streakBonusCoins: Number(e.target.value) || 0 }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Share Product / App Coins
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.shareBonusCoins}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, shareBonusCoins: Number(e.target.value) || 0 }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Shares / Day
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxDailyShares}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxDailyShares: Number(e.target.value) || 1 }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referral Order Commission (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={form.referralOrderCommissionPct}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      referralOrderCommissionPct: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono font-bold text-[#F85606]"
                />
                <p className="text-[11px] text-slate-400 mt-1">Default: 10% on referee orders</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referrer Signup Bonus (Coins)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.referralSignupBonusCoins}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      referralSignupBonusCoins: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Invited User Welcome (Coins)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.referredWelcomeCoins}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      referredWelcomeCoins: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="h-11 px-6 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Coins & Referral Rates'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add New Custom Game */}
          <form
            onSubmit={handleAddGame}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#F85606]" />
              <h2 className="font-display text-base font-bold text-slate-900">
                Add New Mini-Game (Unlimited)
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Game Engine Type
              </label>
              <select
                value={newEngine}
                onChange={(e) => setNewEngine(e.target.value as GameEngineType)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white"
              >
                {GAME_ENGINES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Game Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Eid Mega Wheel"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Play daily & claim instant AS Coins!"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            {newEngine === 'external_link' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  External Game URL *
                </label>
                <input
                  type="url"
                  required
                  value={newExternalUrl}
                  onChange={(e) => setNewExternalUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min Coins</label>
                <input
                  type="number"
                  min="1"
                  value={newMinCoins}
                  onChange={(e) => setNewMinCoins(e.target.value)}
                  className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Coins</label>
                <input
                  type="number"
                  min="1"
                  value={newMaxCoins}
                  onChange={(e) => setNewMaxCoins(e.target.value)}
                  className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Limit</label>
                <input
                  type="number"
                  min="1"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Card Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-9 p-0.5 border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="flex-1 h-9 px-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Adding...' : 'Add Game to Storefront'}</span>
            </button>
          </form>

          {/* Existing Games List */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">
                Storefront Mini-Games ({form.games.length})
              </h2>
              <button
                type="button"
                disabled={saving}
                onClick={() => void persistRewards(form, 'All game configurations saved!')}
                className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Game Edits</span>
              </button>
            </div>

            {form.games.map((g) => (
              <div
                key={g.id}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="w-3.5 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: g.accentColor || '#F85606' }}
                    />
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={g.title}
                        onChange={(e) => updateGame(g.id, { title: e.target.value })}
                        className="w-full font-display text-sm font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none"
                      />
                      <p className="text-[11px] font-mono text-slate-400">{g.engine}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateGame(g.id, { enabled: !g.enabled })}
                      className={`p-1.5 rounded-lg ${
                        g.enabled ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteGame(g.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={g.description}
                  onChange={(e) => updateGame(g.id, { description: e.target.value })}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg text-xs"
                />

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Min Coins</label>
                    <input
                      type="number"
                      min="1"
                      value={g.minCoins}
                      onChange={(e) => updateGame(g.id, { minCoins: Number(e.target.value) || 1 })}
                      className="w-full h-8 px-2 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Max Coins</label>
                    <input
                      type="number"
                      min="1"
                      value={g.maxCoins}
                      onChange={(e) => updateGame(g.id, { maxCoins: Number(e.target.value) || 1 })}
                      className="w-full h-8 px-2 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">Daily Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={g.dailyPlayLimit}
                      onChange={(e) =>
                        updateGame(g.id, { dailyPlayLimit: Number(e.target.value) || 1 })
                      }
                      className="w-full h-8 px-2 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {g.engine === 'external_link' && (
                  <input
                    type="url"
                    value={g.externalUrl || ''}
                    onChange={(e) => updateGame(g.id, { externalUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full h-8 px-2.5 border border-slate-200 rounded text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
