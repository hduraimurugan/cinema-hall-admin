import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { hallsAPI } from "../services/api.js";

const HallContext = createContext();

const STORAGE_KEY = "activeHallId";

export const HallProvider = ({ children }) => {
  const [halls, setHalls] = useState([]);
  const [activeHall, setActiveHallState] = useState(null);
  const [hallsLoading, setHallsLoading] = useState(true);
  // Incremented every time the active hall changes.
  // CinemaLayout keys the <main> outlet off this so the page remounts
  // and re-fetches data scoped to the new hall automatically.
  const [hallKey, setHallKey] = useState(0);

  // On mount: fetch halls and restore the last-selected hall from localStorage.
  // localStorage is the source of truth for persistence across refreshes.
  // hallFetch in api.js reads the same key to inject X-Hall-Id automatically.
  useEffect(() => {
    const loadHalls = async () => {
      try {
        const data = await hallsAPI.getMyHalls();
        const fetched = data.halls ?? [];
        setHalls(fetched);

        if (fetched.length === 0) return;

        const savedId = localStorage.getItem(STORAGE_KEY);
        const saved = fetched.find((h) => h.id === savedId);
        const selected = saved ?? fetched[0];

        setActiveHallState(selected);
        localStorage.setItem(STORAGE_KEY, selected.id);
      } catch {
        // Not fatal — admin may have no halls yet (first login)
      } finally {
        setHallsLoading(false);
      }
    };

    loadHalls();
  }, []);

  // Switch the active hall — persists to localStorage so the axios-style
  // interceptor (hallFetch) picks it up on every subsequent API call.
  const setActiveHall = useCallback((hall) => {
    setActiveHallState(hall);
    localStorage.setItem(STORAGE_KEY, hall.id);
    setHallKey((k) => k + 1);
  }, []);

  // Re-fetch halls list (used after create/update/delete in HallsManagement).
  // Keeps the active hall reference up-to-date with the server's latest data.
  const refetchHalls = useCallback(async () => {
    try {
      const data = await hallsAPI.getMyHalls();
      const fetched = data.halls ?? [];
      setHalls(fetched);

      setActiveHallState((current) => {
        if (!current) return fetched[0] ?? null;
        const updated = fetched.find((h) => h.id === current.id);
        if (updated) return updated;
        // Active hall was deleted — fall back to first available
        const fallback = fetched[0] ?? null;
        if (fallback) localStorage.setItem(STORAGE_KEY, fallback.id);
        else localStorage.removeItem(STORAGE_KEY);
        return fallback;
      });
    } catch {
      /* ignore — stale data is acceptable here */
    }
  }, []);

  return (
    <HallContext.Provider value={{ halls, activeHall, setActiveHall, hallsLoading, hallKey, refetchHalls }}>
      {children}
    </HallContext.Provider>
  );
};

export const useHall = () => useContext(HallContext);
