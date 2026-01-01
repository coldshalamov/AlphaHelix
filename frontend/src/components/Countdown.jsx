import { useState, useEffect, memo } from 'react';

function Countdown({ targetSeconds, render }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!targetSeconds) return;

    const target = Number(targetSeconds);
    const calculate = () => {
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, target - now);
    };

    setTimeLeft(calculate());

    const id = setInterval(() => {
      const remaining = calculate();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [targetSeconds]);

  if (timeLeft <= 0) return null;

  if (render) return render(formatDuration(timeLeft));

  return <>{formatDuration(timeLeft)}</>;
}

function formatDuration(seconds) {
  const s = Math.max(0, seconds);
  const minutes = Math.floor(s / 60);
  const secs = s % 60;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

export default memo(Countdown);
