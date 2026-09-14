"use client";

import { useEffect, useState } from 'react';
import { KboDashboardPage } from '@/components/KboDashboardPage';
import { kstDateStr } from '@/lib/domain/util';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(() => kstDateStr());
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedDate) return;
    let active = true;

    async function loadGames() {
      try {
        setLoading(true);
        const res = await fetch(`/api/games?date=${selectedDate}`);
        if (!res.ok) throw new Error('Failed to load games');
        const data = await res.json();
        if (active) {
          setGames(data.games || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGames();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  return (
    <main className="min-h-screen pb-12">
      {selectedDate ? (
        <KboDashboardPage
          rawGames={games}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          loading={loading}
        />
      ) : null}
    </main>
  );
}
