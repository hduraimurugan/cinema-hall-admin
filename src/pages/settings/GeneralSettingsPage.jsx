import { Settings, Globe, Coins, Languages } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "@/components/Loader";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { ORG_DEFAULTS } from "@/lib/settings/settingsDefaults";

export function GeneralSettingsPage() {
  const { orgSettings, getSection, updateSection } = useSettings();
  const data = getSection("org", "general") || ORG_DEFAULTS.general;

  const update = (field, value) => updateSection("org", "general", { [field]: value });

  if (orgSettings.loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (orgSettings.error) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Alert variant="destructive">
          <AlertDescription>{orgSettings.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <SettingsPageHeader
        icon={Settings}
        title="General Settings"
        description="Platform identity, timezone, and regional defaults that apply across all cinema branches."
        scope="org"
      />

      <div className="space-y-6">
        <SettingsCard
          icon={Globe}
          title="Organization Identity"
          description="These settings define how your organization is presented across the platform."
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="org-name" className="text-sm font-medium">Organization Name</Label>
              <Input
                id="org-name"
                value={data.org_name || ""}
                onChange={e => update("org_name", e.target.value)}
                placeholder="e.g. CineMax Theatres"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">This name is synced to your organization profile and appears across the admin panel.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm font-medium">Default Timezone</Label>
                <Select value={data.timezone || "Asia/Kolkata"} onValueChange={v => update("timezone", v)}>
                  <SelectTrigger id="timezone" className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">India (IST, +05:30)</SelectItem>
                    <SelectItem value="Asia/Dubai">UAE (GST, +04:00)</SelectItem>
                    <SelectItem value="America/New_York">US Eastern</SelectItem>
                    <SelectItem value="America/Chicago">US Central</SelectItem>
                    <SelectItem value="America/Los_Angeles">US Pacific</SelectItem>
                    <SelectItem value="Europe/London">UK (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">Default Currency</Label>
                <Select value={data.currency || "INR"} onValueChange={v => update("currency", v)}>
                  <SelectTrigger id="currency" className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">₹ Indian Rupee</SelectItem>
                    <SelectItem value="USD">$ US Dollar</SelectItem>
                    <SelectItem value="AED">AED UAE Dirham</SelectItem>
                    <SelectItem value="GBP">£ British Pound</SelectItem>
                    <SelectItem value="EUR">€ Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">Default Language</Label>
              <div className="flex items-center gap-3">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <Select value={data.language || "en"} onValueChange={v => update("language", v)}>
                  <SelectTrigger id="language" className="h-11 flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ta">Tamil</SelectItem>
                    <SelectItem value="te">Telugu</SelectItem>
                    <SelectItem value="ml">Malayalam</SelectItem>
                    <SelectItem value="kn">Kannada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
