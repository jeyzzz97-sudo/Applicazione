import { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';

export const useCalendarEvents = (accessToken: string | null, dateISO: string) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !dateISO) {
      setEvents([]);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const startOfDay = new Date(dateISO);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateISO);
        endOfDay.setHours(23, 59, 59, 999);

        const timeMin = startOfDay.toISOString();
        const timeMax = endOfDay.toISOString();

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('AUTH_REQUIRED');
          }
          throw new Error('Failed to fetch calendar events');
        }

        const data = await response.json();
        setEvents(data.items || []);
      } catch (err: any) {
        console.error('Calendar error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [accessToken, dateISO]);

  return { events, loading, error };
};
