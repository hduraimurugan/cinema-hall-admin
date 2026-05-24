import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { hallsAPI } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const HallContext = createContext();

const STORAGE_KEY = "activeHallId";

export const HallProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const [halls, setHalls] = useState([]);
  const [activeHall, setActiveHallState] = useState(null);
  const [hallsLoading, setHallsLoading] = useState(true);
  const [hallKey, setHallKey] = useState(0);

  // Wait for AuthContext to finish its session check before fetching halls.
  // If we fetch immediately on mount, the request races against the JWT
  // verification and can return 401 (when a token refresh is in progress),
  // causing halls to appear empty and HallGuard to redirect to /onboarding.
  useEffect(() => {
    // Auth is still initialising — keep hallsLoading=true so nothing redirects yet.
    if (authLoading) return;

    if (!user) {
      // Not logged in — clear any stale hall state.
      setHalls([]);
      setActiveHallState(null);
      localStorage.removeItem(STORAGE_KEY);
      setHallsLoading(false);
      return;
    }

    const loadHalls = async () => {
      setHallsLoading(true);
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
  }, [user, authLoading]);

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
