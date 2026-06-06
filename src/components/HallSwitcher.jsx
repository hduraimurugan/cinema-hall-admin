import { useNavigate, useLocation } from "react-router-dom";
import { Building2, PlusCircle, Settings2, ChevronsUpDown } from "lucide-react";
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
          className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50
                     px-2.5 h-9 text-left
                     hover:bg-primary/10 hover:border-primary/30 hover:shadow-[0_0_12px_rgba(var(--primary),0.08)]
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30
                     transition-all duration-200 ease-out group max-w-[220px]"
          aria-label="Switch active cinema hall"
        >
          {/* Icon */}
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
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
              className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer mb-0.5
                         ${isActive ? "bg-primary/8 text-foreground" : "text-foreground"}`}
            >
              {/* Hall icon */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md
                               ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Building2 className="h-4 w-4" />
              </div>

              {/* Hall details */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium leading-tight truncate">{hall.name}</span>
                {hall.location && (
                  <span className="text-xs text-muted-foreground truncate mt-0.5">{hall.location}</span>
                )}
              </div>

              {/* Active badge */}
              {isActive && (
                <Badge className="shrink-0 h-4 px-1.5 text-[9px] bg-primary/15 text-primary border-primary/20 font-semibold">
                  Active
                </Badge>
              )}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuItem
          onClick={() => navigate("/halls")}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
            <Settings2 className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm">Manage halls</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


