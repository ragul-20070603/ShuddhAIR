'use client';

import { useState, useEffect } from 'react';

export function Clock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    // Set initial time without waiting for the first second
    setTime(new Date().toLocaleTimeString());

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="text-center text-sm md:text-base font-semibold text-foreground tabular-nums">
      {time || <span className="text-muted-foreground">Loading...</span>}
    </div>
  );
}
