import { useState, useEffect } from "react";
import { Outlet, NavLink, useParams, useLocation } from "react-router-dom";
import { Calendar, Users, Clock, BarChart3, ScanLine, ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Event, ApiResponse } from "@/utils/types";

export default function Layout() {
  const { eventId } = useParams();
  const location = useLocation();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (eventId) {
      api.get<ApiResponse<Event>>(`/events/${eventId}`).then((res) => {
        setEvent(res.data);
      }).catch(() => setEvent(null));
    } else {
      setEvent(null);
    }
  }, [eventId]);

  const isEventRoute = eventId && !location.pathname.endsWith("/events");

  const navItems = eventId
    ? [
        { to: `/events/${eventId}`, label: "Dashboard", icon: Calendar },
        { to: `/events/${eventId}/registrations`, label: "Registrations", icon: Users },
        { to: `/events/${eventId}/sessions`, label: "Sessions", icon: Clock },
        { to: `/events/${eventId}/reports`, label: "Reports", icon: BarChart3 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <NavLink to="/" className="flex items-center gap-2 font-semibold text-lg">
            <ScanLine className="h-5 w-5" />
            <span className="hidden sm:inline">Attendance System</span>
          </NavLink>

          {isEventRoute && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" asChild>
                <NavLink to="/">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Events
                </NavLink>
              </Button>
              {event && (
                <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
                  {event.name}
                </span>
              )}
            </>
          )}
        </div>

        {/* Sub-nav for event routes */}
        {isEventRoute && navItems.length > 0 && (
          <nav className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to ||
                (item.to !== `/events/${eventId}` && location.pathname.startsWith(item.to));
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}