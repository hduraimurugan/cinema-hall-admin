import { Building2, MapPin, Phone, Clock, FileText } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useHall } from "@/context/HallContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { HALL_DEFAULTS } from "@/lib/settings/settingsDefaults";

export function CinemaProfilePage() {
  const { getSection, updateSection } = useSettings();
  const { activeHall } = useHall();
  const data = getSection("hall", "cinema_profile") || HALL_DEFAULTS.cinema_profile;

  const update = (field, value) => updateSection("hall", "cinema_profile", { [field]: value });

  if (!activeHall) {
    return (
      <div className="max-w-3xl mx-auto">
        <SettingsPageHeader
          icon={Building2}
          title="Cinema Profile"
          description="Manage the public profile and contact details for a cinema branch."
          scope="hall"
        />
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Select a cinema hall from the top navigation to manage its profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <SettingsPageHeader
        icon={Building2}
        title="Cinema Profile"
        description={`Manage the public profile and contact details for ${activeHall.name}.`}
        scope="hall"
      />

      <div className="space-y-6">
        <SettingsCard
          icon={MapPin}
          title="Branch Details"
          description="Name, location, and contact information visible to customers."
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="hall-name" className="text-sm font-medium">Cinema Name</Label>
              <Input id="hall-name" value={data.name || ""} onChange={e => update("name", e.target.value)} placeholder={activeHall.name} className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">Address / Location</Label>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-3" />
                <Input id="location" value={data.location || ""} onChange={e => update("location", e.target.value)} placeholder={activeHall.location} className="h-11 flex-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-medium">District</Label>
                <Input id="district" value={data.district || ""} onChange={e => update("district", e.target.value)} placeholder={activeHall.district || "e.g. Chennai"} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">State</Label>
                <Input id="state" value={data.state || ""} onChange={e => update("state", e.target.value)} placeholder={activeHall.state || "e.g. Tamil Nadu"} className="h-11" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <Input id="phone" value={data.phone || ""} onChange={e => update("phone", e.target.value)} placeholder="+91..." className="h-11 flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours" className="text-sm font-medium">Operating Hours</Label>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input id="hours" value={data.operating_hours ? `${data.operating_hours.open} – ${data.operating_hours.close}` : ""} onChange={() => {}} readOnly placeholder="09:00 – 23:00" className="h-11 flex-1" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-3" />
                <Textarea id="description" value={data.description || ""} onChange={e => update("description", e.target.value)} placeholder="Describe the cinema experience..." rows={4} className="flex-1" />
              </div>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
