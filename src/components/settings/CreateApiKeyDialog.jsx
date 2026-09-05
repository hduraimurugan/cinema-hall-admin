import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { mcpKeysService } from "@/services/settings/mcpKeysService"
import { Plus, Copy, Check, ShieldAlert } from "lucide-react"

const EXPIRY_OPTIONS = [
  { value: "never", label: "Never expires" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
]

export function CreateApiKeyDialog({ open, onOpenChange, onSuccess }) {
  const [name, setName] = useState("")
  const [expiresInDays, setExpiresInDays] = useState("never")
  const [sending, setSending] = useState(false)
  const [createdKey, setCreatedKey] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    setName("")
    setExpiresInDays("never")
    setCreatedKey(null)
    setCopied(false)
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Give this key a name so you recognize it later")
      return
    }
    setSending(true)
    try {
      const data = await mcpKeysService.createKey({
        name: name.trim(),
        expires_in_days: expiresInDays === "never" ? undefined : expiresInDays,
      })
      setCreatedKey(data)
      onSuccess?.()
    } catch (err) {
      toast.error(err?.message || "Failed to create API key")
    } finally {
      setSending(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(createdKey.token)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New API Key
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {createdKey ? (
          <div className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>Key created</SheetTitle>
              <SheetDescription>Copy it now — you won't be able to see it again.</SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-5 px-4">
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>This is the only time this key is shown. Store it somewhere safe — if you lose it, revoke it and create a new one.</span>
              </div>

              <div className="space-y-2">
                <Label>Your API key</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs font-mono">
                    {createdKey.token}
                  </code>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Use it with the Cinemax MCP server</Label>
                <p className="text-xs text-muted-foreground">
                  Paste this into your local client config (e.g. <code className="font-mono">claude_desktop_config.json</code>), or set it as the <code className="font-mono">CINEMAX_MCP_API_KEY</code> environment variable.
                </p>
                <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-3 text-[11px] font-mono leading-relaxed">
{`"env": {
  "CINEMAX_MCP_API_KEY": "${createdKey.token}"
}`}
                </pre>
              </div>
            </div>

            <SheetFooter className="border-t">
              <Button type="button" onClick={() => onOpenChange?.(false)}>
                Done
              </Button>
            </SheetFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>New API Key</SheetTitle>
              <SheetDescription>
                Creates a personal credential that acts as you — it has exactly your own permissions and hall access, and updates automatically if your role changes.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-5 px-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g. Claude Desktop, my laptop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key-expiry">Expiry</Label>
                <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                  <SelectTrigger id="key-expiry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <SheetFooter className="flex-row justify-end gap-3 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? "Creating..." : "Create Key"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
