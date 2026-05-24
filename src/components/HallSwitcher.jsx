import { useNavigate, useLocation } from "react-router-dom";
import { Building2, PlusCircle, ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useHall } from "../context/HallContext";

export function HallSwitcher() {
  const { halls, activeHall, setActiveHall, hallsLoading } = useHall();
  const navigate = useNavigate();
  const location = useLocation();

  if (hallsLoading) {
    return <Skeleton className="h-9 w-[160px] rounded-md" />;
  }

  // Admin has no halls yet — prompt to create one
  if (halls.length === 0) {
    return (
      <button
        onClick={() => navigate("/halls")}
        className="flex items-center gap-2 rounded-md border border-dashed border-primary/40 px-3 py-1.5 text-xs text-primary hover:bg-primary/5 transition-colors"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        Add your first hall
      </button>
    );
  }

  const handleChange = (hallId) => {
    const selected = halls.find((h) => h.id === hallId);
    if (!selected || selected.id === activeHall?.id) return;

    setActiveHall(selected);

    // Force the current page to remount so its useEffect/data-fetch fires
    // with the new hall context. Replace history so Back still works.
    navigate(location.pathname, { replace: true, state: { hallSwitched: Date.now() } });
  };

  return (
    <Select value={activeHall?.id ?? ""} onValueChange={handleChange}>
      <SelectTrigger
        className="h-9 w-[160px] gap-1.5 border-primary/20 bg-background text-sm font-medium
                   hover:border-primary/40 focus:ring-primary/30 transition-colors"
        aria-label="Switch active cinema hall"
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
        <SelectValue placeholder="Select hall" />
      </SelectTrigger>

      <SelectContent align="start" className="w-[220px]">
        {halls.map((hall) => (
          <SelectItem key={hall.id} value={hall.id}>
            <div className="flex flex-col">
              <span className="font-medium">{hall.name}</span>
              {hall.location && (
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {hall.location}
                </span>
              )}
            </div>
          </SelectItem>
        ))}

        <SelectSeparator />

        {/* Manage halls shortcut */}
        <div
          role="option"
          tabIndex={0}
          aria-selected={false}
          className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs
                     text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          onClick={() => navigate("/halls")}
          onKeyDown={(e) => e.key === "Enter" && navigate("/halls")}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Manage halls
        </div>
      </SelectContent>
    </Select>
  );
}
