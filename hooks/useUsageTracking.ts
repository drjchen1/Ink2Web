import { useState, useEffect, useCallback } from 'react';

export const useUsageTracking = () => {
  const [sessionRequestCount, setSessionRequestCount] = useState(0);
  const [dailyRequestCount, setDailyRequestCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('qed_daily_usage');
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        setDailyRequestCount(count || 0);
      } else {
        localStorage.setItem('qed_daily_usage', JSON.stringify({ date: today, count: 0 }));
      }
    } else {
      localStorage.setItem('qed_daily_usage', JSON.stringify({ date: today, count: 0 }));
    }
  }, []);

  const incrementUsage = useCallback(() => {
    setDailyRequestCount(prev => {
      const newDailyCount = prev + 1;
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('qed_daily_usage', JSON.stringify({ date: today, count: newDailyCount }));
      return newDailyCount;
    });
    setSessionRequestCount(prev => prev + 1);
  }, []);

  return { sessionRequestCount, dailyRequestCount, incrementUsage };
};
