import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  endDate: string;
}

export function CountdownTimer({ endDate }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const update = () => {
      const target = new Date(endDate).getTime();
      const diff = target - Date.now();
      if (Number.isNaN(target) || diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setRemaining({ days, hours, minutes, seconds, expired: false });
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [endDate]);

  if (remaining.expired) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="inline-flex items-center gap-1 font-mono tabular-nums text-xs md:text-sm font-bold">
      {remaining.days > 0 && (
        <>
          <span className="bg-slate-900 text-white px-2 py-1 rounded-md min-w-[2.1rem] text-center shadow-xs">
            {remaining.days}d
          </span>
          <span className="text-[#F85606] font-black">:</span>
        </>
      )}
      <span className="bg-slate-900 text-white px-2 py-1 rounded-md min-w-[2.1rem] text-center shadow-xs">
        {pad(remaining.hours)}
      </span>
      <span className="text-[#F85606] font-black">:</span>
      <span className="bg-slate-900 text-white px-2 py-1 rounded-md min-w-[2.1rem] text-center shadow-xs">
        {pad(remaining.minutes)}
      </span>
      <span className="text-[#F85606] font-black">:</span>
      <span className="bg-[#F85606] text-white px-2 py-1 rounded-md min-w-[2.1rem] text-center shadow-xs">
        {pad(remaining.seconds)}
      </span>
    </div>
  );
}
