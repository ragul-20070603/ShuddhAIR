
'use client';

import { useState, useEffect } from 'react';

export function Clock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after hydration
    setIsClient(true);

    const updateDateTime = () => {
        const now = new Date();
        setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setDate(now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    
    // Set initial time and date
    updateDateTime();
    
    // Update time every second
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    // Update date every minute to catch date change at midnight
    const dateTimer = setInterval(updateDateTime, 60000);

    return () => {
      clearInterval(timer);
      clearInterval(dateTimer);
    };
  }, []);

  if (!isClient) {
    // Render a placeholder on the server and during initial client render
    return (
        <div className="text-center">
            <div className="text-sm md:text-base font-semibold text-foreground tabular-nums h-5 w-24 bg-muted rounded-md animate-pulse">
            </div>
            <div className="text-xs text-muted-foreground h-4 w-48 mt-1 bg-muted rounded-md animate-pulse">
            </div>
        </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-sm md:text-base font-semibold text-foreground tabular-nums">
        {time}
      </div>
      <div className="text-xs text-muted-foreground">
        {date}
      </div>
    </div>
  );
}
