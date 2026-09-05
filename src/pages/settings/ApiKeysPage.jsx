import { useState, useEffect, useCallback } from "react"
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader"
import { SettingsCard } from "@/components/settings/SettingsCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader } from "@/components/Loader"
import { toast } from "sonner"
import { mcpKeysService } from "@/services/settings/mcpKeysService"
import { CreateApiKeyDialog } from "@/components/settings/CreateApiKeyDialog"
import { KeyRound, ShieldAlert, Trash2, Server, Copy, Check } from "lucide-react"

const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL

function formatDate(value) {
  if (!value) return "Never"
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export function ApiKeysPage() {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [revokingId, setRevokingId] = useState(null)
  const [urlCopied, setUrlCopied] = useState(false)

  const copyServerUrl = () => {
    navigator.clipboard.writeText(MCP_SERVER_URL)
    setUrlCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setUrlCopied(false), 2000)
  }

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await mcpKeysService.getKeys()
      setKeys(data.keys || [])
    } catch (err) {
      setError(err?.message || "Failed to load API keys")
      toast.error(err?.message || "Failed to load API keys")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleRevoke = async (id) => {
    setRevokingId(id)
    try {
      await mcpKeysService.revokeKey(id)
      toast.success("API key revoked")
      fetchKeys()
    } catch (err) {
      toast.error(err?.message || "Failed to revoke API key")
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        icon={KeyRound}
        title="API Keys"
        description="Personal credentials for machine clients — like the Cinemax MCP server — to act on your behalf, with exactly your own permissions and hall access."
        scope="user"
      />

      {MCP_SERVER_URL && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/60 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <Server className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Cinemax MCP server</p>
              <code className="text-sm font-mono truncate block">{MCP_SERVER_URL}</code>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={copyServerUrl}>
            {urlCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            Copy URL
          </Button>
        </div>
      )}

      <div className="flex items-center justify-end">
        <CreateApiKeyDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={fetchKeys} mcpServerUrl={MCP_SERVER_URL} />
      </div>

      <SettingsCard>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchKeys}>
              Try again
            </Button>
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <KeyRound className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No API keys yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create one to connect an AI assistant or other tool to Cinemax on your behalf.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="text-sm font-medium">{key.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[11px]">{key.prefix}…</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {key.last_used_at ? formatDate(key.last_used_at) : "Never used"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(key.expires_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(key.created_at)}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke "{key.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Any client using this key — including the MCP server, if that's what it's for — will immediately lose access. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevoke(key.id)} disabled={revokingId === key.id}>
                            {revokingId === key.id ? "Revoking..." : "Revoke"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsCard>
    </div>
  )
}
