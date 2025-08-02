'use client';

import { useState, useEffect } from 'react';

export function Clock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
        const now = new Date();
        setTime(now.toLocaleTimeString());
        setDate(now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    // Set initial time and date without waiting for the first second
    updateDateTime();

    // The date only needs to be updated once a day, but for simplicity
    // and to handle edge cases like the date changing at midnight while
    // the app is open, we can re-check it periodically. An interval
    // to check every minute would be sufficient.
    const dateTimer = setInterval(updateDateTime, 60000);


    return () => {
      clearInterval(timer);
      clearInterval(dateTimer);
    };
  }, []);

  return (
    <div className="text-center">
      <div className="text-sm md:text-base font-semibold text-foreground tabular-nums">
        {time || <span className="text-muted-foreground">Loading...</span>}
      </div>
      <div className="text-xs text-muted-foreground">
        {date}
      </div>
    </div>
  );
}
