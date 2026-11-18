import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarCheck2,
  Check,
  Coins,
  Copy,
  Dices,
  ExternalLink,
  Flame,
  Gamepad2,
  Gift,
  History,
  MessageCircle,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime } from '../../lib/utils';
import {
  claimShareBonus,
  computeCoinsBdtValue,
  ensureUserReferralProfile,
  getTodayDateKey,
  listUserCoinHistory,
  listUserReferrals,
  playGameOrClaimBonus,
} from '../../services/rewardsService';
import type {
  CoinActivity,
  MiniGameConfig,
  ReferralCommission,
} from '../../types';

const WHEEL_SEGMENTS = [10, 25, 15, 50, 20, 100];
const MEMORY_SYMBOLS = ['🎁', '⚡', '💎', '🎁', '⚡', '💎'];

function seededShuffle(seed: number): string[] {
  const arr = [...MEMORY_SYMBOLS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.abs((seed * (i + 3) + 7) % (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function CoinsGamesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, customerProfile, refreshProfile } = useAuth();
  const { rewardsSettings, websiteSettings } = useStore();
  const { showToast } = useToast();

  const symbol = websiteSettings.currencySymbol || '৳';
  const paramTab = searchParams.get('tab');
  const activeTab: 'games' | 'refer' | 'history' =
    paramTab === 'refer' || paramTab === 'history' ? paramTab : 'games';

  const setTab = (next: 'games' | 'refer' | 'history') => {
    setSearchParams({ tab: next }, { replace: true });
  };

  const [referralCode, setReferralCode] = useState(customerProfile?.referralCode || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [coinHistory, setCoinHistory] = useState<CoinActivity[]>([]);
  const [referrals, setReferrals] = useState<ReferralCommission[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Mini-game interactive states
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [pickedGiftIdx, setPickedGiftIdx] = useState<number | null>(null);
  const [scratched, setScratched] = useState(false);
  const [diceFace, setDiceFace] = useState(6);
  const [diceRolling, setDiceRolling] = useState(false);
  const [memoryCards, setMemoryCards] = useState<string[]>(() => seededShuffle(Date.now()));
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [busyGameId, setBusyGameId] = useState<string | null>(null);

  const today = getTodayDateKey();
  const userCoins = Math.max(0, Number(customerProfile?.coins) || 0);
  const checkInStreak = Math.max(0, Number(customerProfile?.checkInStreak) || 0);
  const bdtValue = computeCoinsBdtValue(userCoins, rewardsSettings);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const code = await ensureUserReferralProfile(
          user.uid,
          customerProfile?.name || user.displayName || 'AS World Member',
          customerProfile?.referralCode
        );
        if (active) setReferralCode(code);
      } catch {
        // ignore non-fatal
      }
    })();
    return () => {
      active = false;
    };
  }, [user, customerProfile?.name, customerProfile?.referralCode]);

  const loadLedger = async () => {
    if (!user) return;
    setLoadingLedger(true);
    try {
      const [hist, refs] = await Promise.all([
        listUserCoinHistory(user.uid),
        listUserReferrals(user.uid),
      ]);
      setCoinHistory(hist);
      setReferrals(refs);
    } catch {
      // silent
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    void loadLedger();
  }, [user]);

  const inviteLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return referralCode ? `${origin}/?ref=${encodeURIComponent(referralCode)}` : origin;
  }, [referralCode]);

  const sharesUsedToday =
    customerProfile?.lastShareDate === today ? customerProfile?.dailySharesCount || 0 : 0;
  const maxShares = rewardsSettings.maxDailyShares || 5;
  const remainingShares = Math.max(0, maxShares - sharesUsedToday);

  const requireSignedIn = () => {
    if (user) return true;
    showToast('Please sign in first to play & save AS Coins to your account!', 'info');
    return false;
  };

  const handleCheckIn = async () => {
    if (!requireSignedIn() || !user) return;
    setBusyGameId('check_in');
    try {
      const isSeventhDay = (checkInStreak % 7) === 6;
      const reward =
        (rewardsSettings.dailyCheckInCoins || 15) +
        (isSeventhDay ? rewardsSettings.streakBonusCoins || 50 : 0);
      const res = await playGameOrClaimBonus(user.uid, {
        activityType: 'check_in',
        coinsAwarded: reward,
        description: isSeventhDay
          ? `Day 7 Streak Check-In Bonus (+${reward} Coins)`
          : `Daily Check-In Day ${checkInStreak + 1}`,
        cooldownField: 'lastCheckInDate',
        updateStreak: true,
      });
      await refreshProfile();
      await loadLedger();
      showToast(
        `Check-in complete! +${reward} AS Coins added (Streak: ${res.checkInStreak} days).`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Check-in already claimed today.', 'info');
    } finally {
      setBusyGameId(null);
    }
  };

  const randomBetween = (min: number, max: number) => {
    const lo = Math.max(1, Math.min(min, max));
    const hi = Math.max(lo, max);
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  };

  const handleSpinWheel = async (game: MiniGameConfig) => {
    if (!requireSignedIn() || !user || wheelSpinning) return;
    if (customerProfile?.lastSpinDate === today) {
      showToast('You already spun the wheel today! Come back tomorrow.', 'info');
      return;
    }
    setWheelSpinning(true);
    setBusyGameId(game.id);
    const segmentIdx = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const extraSpins = 360 * 5;
    const targetDeg = extraSpins + (360 - segmentIdx * 60) + 30;
    setWheelAngle((prev) => prev + targetDeg);

    const wonCoins = Math.min(
      game.maxCoins,
      Math.max(game.minCoins, WHEEL_SEGMENTS[segmentIdx])
    );

    window.setTimeout(async () => {
      try {
        await playGameOrClaimBonus(user.uid, {
          activityType: 'spin_wheel',
          coinsAwarded: wonCoins,
          description: `${game.title} spin reward`,
          cooldownField: 'lastSpinDate',
        });
        await refreshProfile();
        await loadLedger();
        showToast(`Congratulations! You won +${wonCoins} AS Coins on ${game.title}!`, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Already played today.', 'info');
      } finally {
        setWheelSpinning(false);
        setBusyGameId(null);
      }
    }, 1800);
  };

  const handleGiftTap = async (game: MiniGameConfig, idx: number) => {
    if (!requireSignedIn() || !user || busyGameId) return;
    if (customerProfile?.lastGiftTapDate === today) {
      showToast('Today’s Mystery Gift Box is already opened! Come back tomorrow.', 'info');
      return;
    }
    setPickedGiftIdx(idx);
    setBusyGameId(game.id);
    const won = randomBetween(game.minCoins, game.maxCoins);
    try {
      await playGameOrClaimBonus(user.uid, {
        activityType: 'gift_tap',
        coinsAwarded: won,
        description: `${game.title} — Box #${idx + 1}`,
        cooldownField: 'lastGiftTapDate',
      });
      await refreshProfile();
      await loadLedger();
      showToast(`Surprise! Gift Box #${idx + 1} gave you +${won} AS Coins!`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Already claimed today.', 'info');
    } finally {
      setBusyGameId(null);
    }
  };

  const handleScratchCard = async (game: MiniGameConfig) => {
    if (!requireSignedIn() || !user || busyGameId) return;
    if (customerProfile?.lastScratchDate === today) {
      setScratched(true);
      showToast('You already scratched today’s card! Come back tomorrow.', 'info');
      return;
    }
    setScratched(true);
    setBusyGameId(game.id);
    const won = randomBetween(game.minCoins, game.maxCoins);
    try {
      await playGameOrClaimBonus(user.uid, {
        activityType: 'scratch_card',
        coinsAwarded: won,
        description: `${game.title} scratch win`,
        cooldownField: 'lastScratchDate',
      });
      await refreshProfile();
      await loadLedger();
      showToast(`Lucky Scratch! +${won} AS Coins added to your wallet!`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Already claimed today.', 'info');
    } finally {
      setBusyGameId(null);
    }
  };

  const handleRollDice = async (game: MiniGameConfig) => {
    if (!requireSignedIn() || !user || diceRolling) return;
    if (customerProfile?.lastDiceDate === today) {
      showToast('Dice already rolled today! Come back tomorrow.', 'info');
      return;
    }
    setDiceRolling(true);
    setBusyGameId(game.id);
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceFace(roll);
    const span = Math.max(0, game.maxCoins - game.minCoins);
    const won = Math.round(game.minCoins + (span * (roll - 1)) / 5);

    window.setTimeout(async () => {
      try {
        await playGameOrClaimBonus(user.uid, {
          activityType: 'lucky_dice',
          coinsAwarded: won,
          description: `${game.title} — Rolled a ${roll}`,
          cooldownField: 'lastDiceDate',
        });
        await refreshProfile();
        await loadLedger();
        showToast(`Rolled ${roll}! You won +${won} AS Coins!`, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Already rolled today.', 'info');
      } finally {
        setDiceRolling(false);
        setBusyGameId(null);
      }
    }, 900);
  };

  const handleMemoryCardClick = async (game: MiniGameConfig, idx: number) => {
    if (!requireSignedIn() || !user) return;
    if (customerProfile?.lastMemoryDate === today) {
      showToast('You already completed today’s Memory Match! Come back tomorrow.', 'info');
      return;
    }
    if (
      matchedIndices.includes(idx) ||
      flippedIndices.includes(idx) ||
      flippedIndices.length >= 2 ||
      busyGameId === game.id
    ) {
      return;
    }
    const nextFlipped = [...flippedIndices, idx];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const [a, b] = nextFlipped;
      if (memoryCards[a] === memoryCards[b]) {
        const nextMatched = [...matchedIndices, a, b];
        setMatchedIndices(nextMatched);
        setFlippedIndices([]);
        if (nextMatched.length === memoryCards.length) {
          setBusyGameId(game.id);
          const won = randomBetween(game.minCoins, game.maxCoins);
          try {
            await playGameOrClaimBonus(user.uid, {
              activityType: 'memory_flip',
              coinsAwarded: won,
              description: `${game.title} — All 3 pairs matched!`,
              cooldownField: 'lastMemoryDate',
            });
            await refreshProfile();
            await loadLedger();
            showToast(`Memory Champion! +${won} AS Coins awarded!`, 'success');
          } catch (err) {
            showToast(err instanceof Error ? err.message : 'Already claimed today.', 'info');
          } finally {
            setBusyGameId(null);
          }
        }
      } else {
        window.setTimeout(() => setFlippedIndices([]), 650);
      }
    }
  };

  const handleExternalGameClaim = async (game: MiniGameConfig) => {
    if (!requireSignedIn() || !user || busyGameId) return;
    setBusyGameId(game.id);
    const won = randomBetween(game.minCoins, game.maxCoins);
    try {
      await playGameOrClaimBonus(user.uid, {
        activityType: 'external_link',
        coinsAwarded: won,
        description: `Played ${game.title}`,
      });
      await refreshProfile();
      await loadLedger();
      showToast(`+${won} AS Coins rewarded for playing ${game.title}!`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not claim reward.', 'error');
    } finally {
      setBusyGameId(null);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      showToast('Personal referral link copied!', 'success');
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast('Copy failed — please copy manually.', 'info');
    }
  };

  const handleShareAndEarn = async () => {
    if (!requireSignedIn() || !user) return;
    const shareText = `Shop on ${websiteSettings.websiteName || 'AS World'} across all 64 districts! Join with my link: ${inviteLink}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: websiteSettings.websiteName || 'AS World',
          text: shareText,
          url: inviteLink,
        });
      } else {
        await navigator.clipboard.writeText(inviteLink);
      }
      const res = await claimShareBonus(user.uid, rewardsSettings, 'Shared Referral & Store Link');
      await refreshProfile();
      await loadLedger();
      if (res.awarded > 0) {
        showToast(`Shared! You earned +${res.awarded} AS Coins!`, 'success');
      } else {
        showToast('Invite link shared! Daily share coin limit reached for today.', 'info');
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        showToast('Could not complete share bonus.', 'info');
      }
    }
  };

  const activeGames = rewardsSettings.games.filter((g) => g.enabled);

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-6 py-5 md:py-8 space-y-6">
      {/* Wallet Hero Banner */}
      <section className="bg-gradient-to-r from-[#F85606] via-[#FF6E24] to-[#E04A00] rounded-2xl p-5 md:p-7 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AS Coins &amp; Rewards Hub</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
              {user ? `${userCoins.toLocaleString()} AS Coins` : 'Play Games, Share & Earn AS Coins'}
            </h1>
            <p className="text-xs md:text-sm text-white/90">
              {user ? (
                <>
                  Instant Checkout Value:{' '}
                  <strong className="font-mono text-base">
                    {symbol}
                    {bdtValue}
                  </strong>{' '}
                  ({rewardsSettings.coinsUnit} Coins = {symbol}
                  {rewardsSettings.takaPerUnit}) · Earn{' '}
                  <strong>{rewardsSettings.referralOrderCommissionPct}%</strong> on every friend&apos;s
                  order!
                </>
              ) : (
                `Earn daily AS Coins by playing mini-games or sharing your referral link (${rewardsSettings.referralOrderCommissionPct}% order commission).`
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!user ? (
              <Link
                to="/login"
                className="px-5 py-2.5 bg-white text-[#F85606] font-bold text-xs md:text-sm rounded-xl shadow-xs hover:bg-slate-50"
              >
                Sign In to Collect Coins
              </Link>
            ) : (
              <Link
                to="/cart"
                className="px-4 py-2.5 bg-white text-[#F85606] font-bold text-xs md:text-sm rounded-xl shadow-xs hover:bg-slate-50"
              >
                Redeem at Checkout ({symbol}
                {bdtValue} available)
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5">
        <button
          type="button"
          onClick={() => setTab('games')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs md:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'games' ? 'bg-[#F85606] text-white' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Play &amp; Win Games</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('refer')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs md:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'refer' ? 'bg-[#F85606] text-white' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Share &amp; Refer ({rewardsSettings.referralOrderCommissionPct}%)</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs md:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'history' ? 'bg-[#F85606] text-white' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Coin History</span>
        </button>
      </div>

      {activeTab === 'games' && (
        <div className="space-y-6">
          {/* 7-Day Check-In Streak Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FFF5F0] text-[#F85606] flex items-center justify-center">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-base md:text-lg font-bold text-slate-900">
                    7-Day Daily Check-In Streak
                  </h2>
                  <p className="text-xs text-slate-500">
                    Current Streak: <strong>{checkInStreak} day(s)</strong> · Claim +
                    {rewardsSettings.dailyCheckInCoins} Coins daily &amp; +
                    {rewardsSettings.streakBonusCoins} bonus on Day 7!
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={
                  busyGameId === 'check_in' ||
                  (Boolean(user) && customerProfile?.lastCheckInDate === today)
                }
                onClick={handleCheckIn}
                className="px-5 py-2.5 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-bold rounded-xl disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <Flame className="w-4 h-4" />
                <span>
                  {customerProfile?.lastCheckInDate === today
                    ? 'Claimed Today ✓'
                    : busyGameId === 'check_in'
                    ? 'Claiming...'
                    : `Check In (+${rewardsSettings.dailyCheckInCoins} Coins)`}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const dayNum = i + 1;
                const filled = (checkInStreak % 7) >= dayNum || (checkInStreak > 0 && checkInStreak % 7 === 0);
                const bonusDay = dayNum === 7;
                return (
                  <div
                    key={dayNum}
                    className={`rounded-xl border p-2 text-center ${
                      filled
                        ? 'bg-[#FFF5F0] border-[#F85606] text-[#F85606]'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase">Day {dayNum}</p>
                    <p className="text-xs font-extrabold mt-0.5">
                      +{rewardsSettings.dailyCheckInCoins + (bonusDay ? rewardsSettings.streakBonusCoins : 0)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Playable Mini-Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeGames.map((game) => {
              if (game.engine === 'spin_wheel') {
                const played = customerProfile?.lastSpinDate === today;
                return (
                  <div
                    key={game.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {game.title}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FFF5F0] text-[#F85606]">
                          {game.minCoins}–{game.maxCoins} Coins
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{game.description}</p>
                    </div>

                    <div className="flex flex-col items-center gap-4 py-2">
                      <div className="relative">
                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-slate-900 mx-auto -mb-1 relative z-10" />
                        <div
                          className="w-36 h-36 rounded-full border-4 border-slate-900 shadow-inner transition-transform duration-[1800ms] ease-out relative flex items-center justify-center"
                          style={{
                            transform: `rotate(${wheelAngle}deg)`,
                            background:
                              'conic-gradient(#F85606 0deg 60deg, #F59E0B 60deg 120deg, #10B981 120deg 180deg, #2563EB 180deg 240deg, #DC2626 240deg 300deg, #7C3AED 300deg 360deg)',
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center text-[10px] font-extrabold text-slate-900">
                            WIN
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={played || wheelSpinning}
                        onClick={() => void handleSpinWheel(game)}
                        className="w-full h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-bold rounded-xl disabled:opacity-50"
                      >
                        {played
                          ? 'Spun Today ✓'
                          : wheelSpinning
                          ? 'Spinning...'
                          : 'Spin Wheel Now'}
                      </button>
                    </div>
                  </div>
                );
              }

              if (game.engine === 'gift_tap') {
                const played = customerProfile?.lastGiftTapDate === today;
                return (
                  <div
                    key={game.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {game.title}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600">
                          {game.minCoins}–{game.maxCoins} Coins
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{game.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 py-3">
                      {[0, 1, 2].map((idx) => {
                        const selected = pickedGiftIdx === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={played || Boolean(busyGameId)}
                            onClick={() => void handleGiftTap(game, idx)}
                            className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                              selected
                                ? 'border-[#F85606] bg-[#FFF5F0] text-[#F85606] scale-95'
                                : 'border-slate-200 bg-slate-50 hover:border-[#F85606] hover:bg-[#FFF5F0]/50 text-slate-700'
                            } disabled:opacity-60`}
                          >
                            <Gift className="w-8 h-8 text-[#F85606]" />
                            <span className="text-[11px] font-bold">
                              {selected ? 'Opened!' : `Box #${idx + 1}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-center text-slate-500">
                      {played ? 'Gift box opened today — come back tomorrow!' : 'Tap any box above to win'}
                    </p>
                  </div>
                );
              }

              if (game.engine === 'scratch_card') {
                const played = customerProfile?.lastScratchDate === today;
                const revealed = scratched || played;
                return (
                  <div
                    key={game.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {game.title}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                          {game.minCoins}–{game.maxCoins} Coins
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{game.description}</p>
                    </div>

                    <button
                      type="button"
                      disabled={played || Boolean(busyGameId)}
                      onClick={() => void handleScratchCard(game)}
                      className={`h-28 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        revealed
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 text-amber-900'
                          : 'bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 border-slate-400 text-slate-700 hover:brightness-95'
                      }`}
                    >
                      <Sparkles className="w-6 h-6 text-[#F85606]" />
                      <span className="text-sm font-extrabold">
                        {revealed
                          ? 'Card Scratched — Reward Credited!'
                          : 'Tap Here to Scratch & Win'}
                      </span>
                    </button>
                  </div>
                );
              }

              if (game.engine === 'lucky_dice') {
                const played = customerProfile?.lastDiceDate === today;
                return (
                  <div
                    key={game.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {game.title}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {game.minCoins}–{game.maxCoins} Coins
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{game.description}</p>
                    </div>

                    <div className="flex flex-col items-center gap-3 py-2">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-blue-600 text-white font-display text-2xl font-black flex items-center justify-center shadow-md ${
                          diceRolling ? 'animate-spin' : ''
                        }`}
                      >
                        {diceFace}
                      </div>
                      <button
                        type="button"
                        disabled={played || diceRolling}
                        onClick={() => void handleRollDice(game)}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                      >
                        <Dices className="w-4 h-4" />
                        <span>
                          {played
                            ? 'Rolled Today ✓'
                            : diceRolling
                            ? 'Rolling...'
                            : 'Roll Lucky Dice'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              }

              if (game.engine === 'memory_flip') {
                const played = customerProfile?.lastMemoryDate === today;
                return (
                  <div
                    key={game.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {game.title}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          {game.minCoins}–{game.maxCoins} Coins
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{game.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {memoryCards.map((sym, idx) => {
                        const isOpen =
                          played ||
                          flippedIndices.includes(idx) ||
                          matchedIndices.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={played}
                            onClick={() => void handleMemoryCardClick(game, idx)}
                            className={`h-16 rounded-xl border text-xl font-bold flex items-center justify-center transition-all ${
                              matchedIndices.includes(idx)
                                ? 'bg-emerald-50 border-emerald-400'
                                : isOpen
                                ? 'bg-white border-[#F85606]'
                                : 'bg-slate-800 border-slate-900 text-white hover:bg-slate-700'
                            }`}
                          >
                            {isOpen ? sym : '?'}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {played
                          ? 'Completed Today ✓'
                          : `Matched ${matchedIndices.length / 2} / 3 pairs`}
                      </span>
                      {!played && matchedIndices.length < 6 && (
                        <button
                          type="button"
                          onClick={() => {
                            setMemoryCards(seededShuffle(Date.now()));
                            setFlippedIndices([]);
                            setMatchedIndices([]);
                          }}
                          className="text-[#F85606] font-semibold hover:underline"
                        >
                          Shuffle
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // External / Custom Link Game added by Admin
              return (
                <div
                  key={game.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-slate-900">
                        {game.title}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FFF5F0] text-[#F85606]">
                        {game.minCoins}–{game.maxCoins} Coins
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{game.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {game.externalUrl && (
                      <a
                        href={game.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5"
                      >
                        <span>Open &amp; Play</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={busyGameId === game.id}
                      onClick={() => void handleExternalGameClaim(game)}
                      className="flex-1 h-10 px-4 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-bold rounded-xl disabled:opacity-50"
                    >
                      Claim Play Bonus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'refer' && (
        <div className="space-y-6">
          {/* Personal Share & Refer Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{rewardsSettings.referralOrderCommissionPct}% Order Commission Active</span>
                </span>
                <h2 className="font-display text-lg md:text-xl font-bold text-slate-900 mt-2">
                  Share &amp; Refer Friends to Earn Coins Automatically
                </h2>
                <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-2xl">
                  Earn <strong>+{rewardsSettings.shareBonusCoins} AS Coins</strong> each time you
                  share ({remainingShares}/{maxShares} shares left today), PLUS earn{' '}
                  <strong className="text-[#F85606]">
                    {rewardsSettings.referralOrderCommissionPct}% commission in AS Coins
                  </strong>{' '}
                  every time someone joins using your link and places an order!
                </p>
              </div>
            </div>

            {!user ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <span className="text-xs text-slate-700">
                  Sign in to generate your unique AS World referral code and track 10% commissions.
                </span>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-[#F85606] text-white text-xs font-bold rounded-lg shrink-0"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">
                      Your Referral Code
                    </p>
                    <p className="font-mono text-xl font-extrabold text-[#F85606] mt-1">
                      {referralCode || '...'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase text-slate-500">
                        Your Personal Invite Link
                      </p>
                      <p className="font-mono text-xs text-slate-800 truncate mt-1">{inviteLink}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopyInvite()}
                      className="px-3 py-2 bg-white border border-slate-200 hover:border-[#F85606] rounded-lg text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 shrink-0"
                    >
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleShareAndEarn()}
                    className="px-5 py-2.5 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs md:text-sm font-bold rounded-xl inline-flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>
                      Share Link &amp; Claim +{rewardsSettings.shareBonusCoins} Coins
                    </span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Shop on ${websiteSettings.websiteName || 'AS World'} across Bangladesh! Order using my link: ${inviteLink}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (user) {
                        void claimShareBonus(
                          user.uid,
                          rewardsSettings,
                          'Shared invite on WhatsApp'
                        ).then(() => refreshProfile());
                      }
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold rounded-xl inline-flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Referred Orders & 10% Commission History */}
          {user && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F85606]" />
                <h3 className="font-display text-base font-bold text-slate-900">
                  Your 10% Referral Commissions ({referrals.length})
                </h3>
              </div>
              {loadingLedger ? (
                <p className="text-xs text-slate-500">Loading referrals...</p>
              ) : referrals.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No referral order commissions yet. Share your link above with friends &amp;
                  family — whenever they place an order, you receive{' '}
                  {rewardsSettings.referralOrderCommissionPct}% in AS Coins automatically!
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {referrals.map((r) => (
                    <div
                      key={r.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          Order {r.orderNumber} ({r.refereeName || 'Friend'})
                        </p>
                        <p className="text-slate-500">
                          {r.commissionPct}% commission · Order {symbol}
                          {r.orderTotal} · {formatDateTime(r.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-700 block">
                          +{r.commissionCoins} Coins
                        </span>
                        <span className="text-[10px] uppercase text-slate-400">{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Coins className="w-4 h-4 text-[#F85606]" />
            <h2 className="font-display text-base font-bold text-slate-900">
              AS Coins Ledger ({coinHistory.length})
            </h2>
          </div>

          {!user ? (
            <p className="text-xs text-slate-500">Sign in to view your AS Coins history.</p>
          ) : loadingLedger ? (
            <p className="text-xs text-slate-500">Loading coin ledger...</p>
          ) : coinHistory.length === 0 ? (
            <p className="text-xs text-slate-500">
              No coin transactions yet. Play a game or share your invite link to earn your first
              coins!
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {coinHistory.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.description}</p>
                    <p className="text-[11px] text-slate-400">
                      {item.type.replace('_', ' ')} · {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold text-sm shrink-0 ${
                      item.amount >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {item.amount >= 0 ? `+${item.amount}` : item.amount} Coins
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
