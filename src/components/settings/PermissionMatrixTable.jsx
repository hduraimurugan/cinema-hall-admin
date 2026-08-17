import { useState, useEffect, useMemo, useCallback } from "react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader } from "@/components/Loader"
import { toast } from "sonner"
import { teamService } from "@/services/settings/teamService"
import {
  PAGE_PERMISSIONS,
  ADVANCED_PERMISSIONS,
  ACTION_COLUMNS,
  keysForPage,
  allMappedKeys,
} from "@/config/pagePermissions"
import { Lock, Minus } from "lucide-react"

const GROUP_ORDER = ["Operations", "Promotions", "Management", "Settings"]

/** Human label for a bare permission key, e.g. "shows.cancel" → "Cancel". */
function actionLabel(key) {
  const parts = key.split(".")
  const action = parts[parts.length - 1]
  return action.charAt(0).toUpperCase() + action.slice(1)
}

/**
 * Page-oriented permission editor.
 *
 * Rows are the pages the admin actually navigates; columns are View / Create /
 * Edit / Delete. Each cell maps to a real permission key from
 * GET /api/roles/permissions — keys the catalog does not recognise fall through
 * to the Advanced group rather than disappearing.
 *
 * `value`/`onChange` make this a controlled component (used by CreateRoleDialog,
 * which needs the selection before a role exists). Left uncontrolled it loads
 * and saves the role at `roleId` itself.
 */
export function PermissionMatrixTable({
  roleId,
  readOnly = false,
  value,
  onChange,
  hideSaveBar = false,
  onSaved,
}) {
  const controlled = value !== undefined

  const [internal, setInternal] = useState(() => new Set())
  const [baseline, setBaseline] = useState(() => new Set())
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const selected = controlled ? value : internal
  const setSelected = useCallback(
    (next) => (controlled ? onChange(next) : setInternal(next)),
    [controlled, onChange]
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const catalogReq = teamService.getPermissionCatalog()
    const roleReq = roleId ? teamService.getRole(roleId) : Promise.resolve(null)

    Promise.all([catalogReq, roleReq])
      .then(([catalogData, roleData]) => {
        if (cancelled) return
        setCatalog(catalogData?.permissions || [])

        if (roleData) {
          // The API returns permission OBJECTS, not strings. Treating them as
          // strings threw and left every role looking empty.
          const role = roleData.role || roleData
          const keys = new Set((role.permissions || []).map(p => (typeof p === "string" ? p : p.key)))
          setBaseline(keys)
          if (!controlled) setInternal(keys)
          else onChange(keys)
        }
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.error || "Failed to load permissions")
      })
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
    // onChange is intentionally omitted — it is re-created by the parent each
    // render and would restart the fetch on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, controlled])

  // Keys the DB has but this build's page catalog does not know about, so a
  // newly seeded permission stays editable instead of vanishing.
  const advancedKeys = useMemo(() => {
    const mapped = allMappedKeys()
    const known = new Set(catalog.map(p => p.key))
    const unmapped = catalog.filter(p => !mapped.has(p.key)).map(p => p.key)
    return [...ADVANCED_PERMISSIONS.filter(k => known.has(k)), ...unmapped]
  }, [catalog])

  const existsInCatalog = useCallback(
    (key) => catalog.length === 0 || catalog.some(p => p.key === key),
    [catalog]
  )

  const toggleKey = (key, on) => {
    const next = new Set(selected)
    if (on) next.add(key)
    else next.delete(key)
    setSelected(next)
  }

  const togglePageAction = (page, column, on) => {
    const key = page[column]
    if (!key) return
    const next = new Set(selected)

    if (on) {
      next.add(key)
      // You cannot act on a page you cannot open, so any write implies View.
      if (page.view) next.add(page.view)
    } else {
      next.delete(key)
      // Dropping View drops the whole row — the page is gone from the nav.
      if (column === "view") keysForPage(page).forEach(k => next.delete(k))
    }

    setSelected(next)
  }

  const togglePageAll = (page, on) => {
    const next = new Set(selected)
    keysForPage(page)
      .filter(existsInCatalog)
      .forEach(k => (on ? next.add(k) : next.delete(k)))
    setSelected(next)
  }

  const pageState = (page) => {
    const keys = keysForPage(page).filter(existsInCatalog)
    const on = keys.filter(k => selected.has(k)).length
    return { all: on > 0 && on === keys.length, some: on > 0, count: on, total: keys.length }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await teamService.updateRole(roleId, { permissionKeys: [...selected] })
      setBaseline(new Set(selected))
      toast.success("Permissions updated")
      onSaved?.()
    } catch (err) {
      toast.error(err?.error || "Failed to update permissions")
    } finally {
      setSaving(false)
    }
  }

  const dirty = useMemo(() => {
    if (selected.size !== baseline.size) return true
    for (const k of selected) if (!baseline.has(k)) return true
    return false
  }, [selected, baseline])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {GROUP_ORDER.map((group) => {
        const pages = PAGE_PERMISSIONS.filter(p => p.group === group)
        if (pages.length === 0) return null

        return (
          <div key={group} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {group}
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Page
                    </th>
                    {ACTION_COLUMNS.map(col => (
                      <th
                        key={col.key}
                        className="px-2 py-2 w-20 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Also
                    </th>
                    <th className="px-3 py-2 w-16 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      All
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => {
                    const state = pageState(page)
                    return (
                      <tr
                        key={page.path}
                        className={`border-b border-border/30 last:border-0 transition-colors ${
                          state.some ? "bg-primary/[0.03]" : ""
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {page.icon && (
                              <page.icon
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  state.some ? "text-primary" : "text-muted-foreground/50"
                                }`}
                              />
                            )}
                            <span className="text-[13px] font-medium">{page.page}</span>
                            {page.superAdminOnly && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                platform
                              </Badge>
                            )}
                          </div>
                        </td>

                        {ACTION_COLUMNS.map((col) => {
                          const key = page[col.key]
                          const available = key && existsInCatalog(key)
                          return (
                            <td key={col.key} className="px-2 py-2.5 text-center">
                              {available ? (
                                <Checkbox
                                  checked={selected.has(key)}
                                  disabled={readOnly}
                                  onCheckedChange={(v) => togglePageAction(page, col.key, !!v)}
                                  aria-label={`${col.label} ${page.page}`}
                                />
                              ) : (
                                <Minus className="h-3 w-3 mx-auto text-muted-foreground/25" />
                              )}
                            </td>
                          )
                        })}

                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {(page.extra || []).filter(existsInCatalog).map((key) => (
                              <label
                                key={key}
                                className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] transition-colors ${
                                  readOnly ? "cursor-default" : "cursor-pointer"
                                } ${
                                  selected.has(key)
                                    ? "border-primary/30 bg-primary/5 text-foreground"
                                    : "border-border/50 text-muted-foreground hover:bg-muted/30"
                                }`}
                              >
                                <Checkbox
                                  checked={selected.has(key)}
                                  disabled={readOnly}
                                  onCheckedChange={(v) => {
                                    toggleKey(key, !!v)
                                    if (v && page.view) toggleKey(page.view, true)
                                  }}
                                  className="h-3 w-3"
                                />
                                {actionLabel(key)}
                              </label>
                            ))}
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <Switch
                            checked={state.all}
                            disabled={readOnly}
                            onCheckedChange={(v) => togglePageAll(page, v)}
                            className="scale-75"
                            aria-label={`All permissions for ${page.page}`}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {advancedKeys.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Advanced
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <p className="px-1 text-[11px] text-muted-foreground">
            Organization-wide capabilities that are not tied to a single page.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {advancedKeys.map((key) => {
              const meta = catalog.find(p => p.key === key)
              return (
                <label
                  key={key}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                    readOnly ? "cursor-default" : "cursor-pointer"
                  } ${
                    selected.has(key)
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 hover:bg-muted/30"
                  }`}
                >
                  <Checkbox
                    checked={selected.has(key)}
                    disabled={readOnly}
                    onCheckedChange={(v) => toggleKey(key, !!v)}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] truncate">{meta?.label || key}</div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate">{key}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {readOnly ? (
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
          <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">
            You do not have permission to change this role.
          </p>
        </div>
      ) : !hideSaveBar && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
          <span className="mr-auto text-[11px] text-muted-foreground">
            {selected.size} permission{selected.size === 1 ? "" : "s"} selected
          </span>
          <Button
            variant="outline"
            disabled={!dirty || saving}
            onClick={() => setSelected(new Set(baseline))}
          >
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving || !dirty}>
            {saving ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      )}
    </div>
  )
}
