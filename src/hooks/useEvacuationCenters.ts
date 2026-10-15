import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { evacuationCenters, type MapCenter } from '../lib/evacuationCenters';
import { errorMessage } from '../lib/api';
import { useApp } from '../state/AppState';

export function useEvacuationCenters() {
  const { online } = useApp();
  const [centers, setCenters] = useState<MapCenter[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const current = useRef<AbortController | null>(null);
  const refresh = useCallback(async (force = true) => {
    if (!online) { current.current?.abort(); setLoading(false); setError('Offline. Center locations and occupancy may have changed since the last update.'); return; }
    // A slow response may take longer than the polling interval. Let it finish
    // instead of repeatedly aborting it and starving map synchronization.
    if (current.current && !current.current.signal.aborted) {
      if (!force) return;
      current.current.abort();
    }
    const controller = new AbortController(); current.current = controller;
    try {
      const data = await evacuationCenters(controller.signal);
      if (!controller.signal.aborted) { setCenters(data); setError(''); setUpdatedAt(new Date().toLocaleTimeString()); }
    } catch (caught) { if (!controller.signal.aborted) setError(errorMessage(caught)); }
    finally { if (current.current === controller) current.current = null; if (!controller.signal.aborted) setLoading(false); }
  }, [online]);
  useFocusEffect(useCallback(() => {
    void refresh();
    const interval = setInterval(() => { if (AppState.currentState === 'active') void refresh(false); }, 15000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') void refresh(); });
    return () => { clearInterval(interval); listener.remove(); current.current?.abort(); };
  }, [refresh]));
  return { centers, error, loading, updatedAt, refresh };
}
