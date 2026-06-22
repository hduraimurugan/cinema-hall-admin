import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useHall } from "./HallContext.jsx";
import { settingsService } from "../services/settings/settingsService.js";

const SettingsContext = createContext();

const INITIAL = { data: null, loading: true, error: null };
const dirtyMap = {};
const loadedHallIds = new Set();

export const SettingsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { activeHall } = useHall();

  const [orgSettings, setOrgSettings] = useState(INITIAL);
  const [hallSettings, setHallSettings] = useState({});   // keyed by hallId
  const [userSettings, setUserSettings] = useState(INITIAL);
  const [dirty, setDirty] = useState({});
  const [saving, setSaving] = useState({});

  const userLoadedRef = useRef(false);

  // ── Load org & user settings on auth ready ────────────────────
  useEffect(() => {
    if (authLoading || !user) return;

    const loadOrg = async () => {
      setOrgSettings(prev => ({ ...prev, loading: true }));
      try {
        const res = await settingsService.getOrgSettings();
        setOrgSettings({ data: res.settings, loading: false, error: null });
      } catch (err) {
        setOrgSettings({ data: null, loading: false, error: err?.error || "Failed to load org settings" });
      }
    };

    const loadUser = async () => {
      if (userLoadedRef.current) return;
      userLoadedRef.current = true;
      setUserSettings(prev => ({ ...prev, loading: true }));
      try {
        const res = await settingsService.getUserSettings();
        setUserSettings({ data: res.settings, loading: false, error: null });
      } catch (err) {
        setUserSettings({ data: null, loading: false, error: err?.error || "Failed to load user settings" });
      }
    };

    loadOrg();
    loadUser();
  }, [user, authLoading]);

  // ── Load hall settings when activeHall changes ─────────────────
  useEffect(() => {
    if (!activeHall?.id) return;

    const hallId = activeHall.id;
    if (loadedHallIds.has(hallId)) return; // already loaded
    loadedHallIds.add(hallId);

    setHallSettings(prev => ({
      ...prev,
      [hallId]: { data: null, loading: true, error: null },
    }));

    (async () => {
      try {
        const res = await settingsService.getHallSettings(hallId);
        setHallSettings(prev => ({
          ...prev,
          [hallId]: { data: res.settings, loading: false, error: null },
        }));
      } catch (err) {
        setHallSettings(prev => ({
          ...prev,
          [hallId]: { data: null, loading: false, error: err?.error || "Failed to load hall settings" },
        }));
      }
    })();
  }, [activeHall?.id]);

  // ── Read ───────────────────────────────────────────────────────
  const getSection = useCallback((scope, section) => {
    if (scope === 'org') return orgSettings.data?.[section] ?? null;
    if (scope === 'user') return userSettings.data?.[section] ?? null;
    if (scope === 'hall' && activeHall?.id) return hallSettings[activeHall.id]?.data?.[section] ?? null;
    return null;
  }, [orgSettings, userSettings, hallSettings, activeHall]);

  // ── Optimistic update ──────────────────────────────────────────
  const updateSection = useCallback((scope, section, patch) => {
    const key = `${scope}:${section}`;
    dirtyMap[key] = true;
    setDirty({ ...dirtyMap });

    if (scope === 'org') {
      setOrgSettings(prev => ({
        ...prev,
        data: prev.data ? { ...prev.data, [section]: { ...(prev.data[section] || {}), ...patch } } : null,
      }));
    } else if (scope === 'user') {
      setUserSettings(prev => ({
        ...prev,
        data: prev.data ? { ...prev.data, [section]: { ...(prev.data[section] || {}), ...patch } } : null,
      }));
    } else if (scope === 'hall') {
      const hallId = activeHall?.id;
      if (!hallId) return;
      setHallSettings(prev => ({
        ...prev,
        [hallId]: {
          ...(prev[hallId] || {}),
          data: prev[hallId]?.data
            ? { ...prev[hallId].data, [section]: { ...(prev[hallId].data[section] || {}), ...patch } }
            : null,
        },
      }));
    }
  }, [activeHall]);

  // ── Persist ────────────────────────────────────────────────────
  const saveSection = useCallback(async (scope, section) => {
    const key = `${scope}:${section}`;
    setSaving(prev => ({ ...prev, [key]: true }));

    try {
      const current = getSection(scope, section);
      let res;
      if (scope === 'org') {
        res = await settingsService.updateOrgSettings(section, current);
      } else if (scope === 'user') {
        res = await settingsService.updateUserSettings(section, current);
      } else if (scope === 'hall') {
        res = await settingsService.updateHallSettings(activeHall.id, section, current);
      }
      delete dirtyMap[key];
      setDirty({ ...dirtyMap });
      return res;
    } finally {
      setSaving(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [getSection, activeHall]);

  // ── Revert ─────────────────────────────────────────────────────
  const resetSection = useCallback(async (scope, section) => {
    const key = `${scope}:${section}`;
    delete dirtyMap[key];
    setDirty({ ...dirtyMap });

    try {
      if (scope === 'org') {
        const res = await settingsService.getOrgSettings();
        setOrgSettings({ data: res.settings, loading: false, error: null });
      } else if (scope === 'user') {
        const res = await settingsService.getUserSettings();
        setUserSettings({ data: res.settings, loading: false, error: null });
      } else if (scope === 'hall' && activeHall?.id) {
        const res = await settingsService.getHallSettings(activeHall.id);
        setHallSettings(prev => ({
          ...prev,
          [activeHall.id]: { data: res.settings, loading: false, error: null },
        }));
      }
    } catch {
      /* ignore */
    }
  }, [activeHall]);

  const isDirty = Object.keys(dirty).length > 0;
  const isSectionDirty = (scope, section) => !!dirty[`${scope}:${section}`];
  const isSaving = (scope, section) => !!saving[`${scope}:${section}`];

  const value = {
    orgSettings, hallSettings, userSettings,
    getSection,
    updateSection, saveSection, resetSection,
    isDirty, isSectionDirty, isSaving,
    activeHallId: activeHall?.id,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
