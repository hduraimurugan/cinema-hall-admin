import { useNavigate, useLocation } from "react-router-dom";
import { Building2, PlusCircle, Settings2, ChevronsUpDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useHall } from "../context/HallContext";

export function HallSwitcher() {
  const { halls, activeHall, setActiveHall, hallsLoading } = useHall();
  const navigate = useNavigate();
  const location = useLocation();

  if (hallsLoading) {
    return <Skeleton className="h-9 w-[200px] rounded-md" />;
  }

  if (halls.length === 0) {
    return (
      <button
        onClick={() => navigate("/onboarding")}
        className="flex items-center gap-2 rounded-md border border-dashed border-primary/40 px-3 py-1.5 text-xs text-primary hover:bg-primary/5 transition-colors"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        Add your first hall
      </button>
    );
  }

  const handleSelect = (hall) => {
    if (hall.id === activeHall?.id) return;
    setActiveHall(hall);
    navigate(location.pathname, { replace: true, state: { hallSwitched: Date.now() } });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/40
                     px-2.5 h-9 text-left
                     hover:bg-muted/50 hover:border-border
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
                     transition-all duration-200 ease-out group max-w-[220px]"
          aria-label="Switch active cinema hall"
        >
          {/* Icon */}
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary border border-primary/20">
            <Building2 className="h-3 w-3" />
          </div>

          {/* Hall info — single line: name · location */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold leading-none truncate text-foreground">
              {activeHall?.name ?? "Select hall"}
            </span>
            {activeHall?.location && (
              <span className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
                {activeHall.location}
              </span>
            )}
          </div>

          {/* Chevron */}
          <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[260px] p-1.5">
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Your Halls
        </DropdownMenuLabel>

        {halls.map((hall) => {
          const isActive = hall.id === activeHall?.id;
          return (
            <DropdownMenuItem
              key={hall.id}
              onClick={() => handleSelect(hall)}
              className={`group flex items-center gap-3 px-2.5 py-2 rounded-md cursor-pointer mb-0.5 transition-all
                         ${isActive 
                           ? "bg-primary/10 text-foreground font-semibold focus:bg-primary/15 focus:text-foreground" 
                           : "text-muted-foreground hover:text-foreground hover:bg-muted/40 focus:bg-muted/40 focus:text-foreground"}`}
            >
              {/* Hall icon */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all
                               ${isActive 
                                 ? "bg-primary/20 text-foreground border border-primary/30" 
                                 : "bg-muted text-foreground/70 group-hover:text-foreground border border-transparent group-hover:bg-muted/80 group-focus:bg-muted/80"}`}>
                <Building2 className="h-4 w-4" />
              </div>

              {/* Hall details */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium leading-tight truncate text-foreground">{hall.name}</span>
                {hall.location && (
                  <span className={`text-xs truncate mt-0.5 ${isActive ? "text-muted-foreground/80" : "text-muted-foreground"}`}>{hall.location}</span>
                )}
              </div>

              {/* Checkmark indicator */}
              {isActive && (
                <Check className="h-4 w-4 text-primary shrink-0 animate-in fade-in zoom-in duration-200" />
              )}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuItem
          onClick={() => navigate("/halls")}
          className="group flex items-center gap-3 px-2.5 py-1.5 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/30 focus:bg-muted/40 focus:text-foreground"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60 text-muted-foreground transition-colors group-hover:bg-muted group-focus:bg-muted">
            <Settings2 className="h-3.5 w-3.5" />
          </div>
          <span className="text-[13px] font-medium">Manage halls</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


