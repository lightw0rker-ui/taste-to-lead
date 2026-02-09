import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Flame, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

function parseContent(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    return { message: content };
  }
}

function timeAgo(dateStr: string | Date | null): string {
  if (!dateStr) return "just now";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    refetchInterval: 10000,
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all", { recipientId: "agent-1" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = countData?.count ?? 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        data-testid="button-notification-bell"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1" data-testid="badge-notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 rounded-md border border-border bg-card shadow-xl z-50" data-testid="dropdown-notifications">
          <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
            <h3 className="font-semibold text-sm" data-testid="text-notifications-title">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                data-testid="button-mark-all-read"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <div className="overflow-y-auto max-h-72">
            {!notifications || notifications.length === 0 ? (
              <div className="p-6 text-center" data-testid="text-no-notifications">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const parsed = parseContent(n.content);
                const isCritical = n.priority === "critical";
                const isHigh = n.priority === "high";

                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!n.readStatus) markReadMutation.mutate(n.id);
                    }}
                    className={`p-3 border-b border-border last:border-0 cursor-pointer transition-colors ${
                      !n.readStatus ? "bg-muted/30" : ""
                    } ${isCritical ? "border-l-2 border-l-destructive" : ""} ${isHigh ? "border-l-2 border-l-primary" : ""}`}
                    data-testid={`notification-item-${n.id}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center ${
                        isCritical
                          ? "bg-destructive/20 text-destructive"
                          : isHigh
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isCritical ? (
                          <Flame className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={isCritical ? "destructive" : isHigh ? "default" : "secondary"}
                          >
                            {n.priority.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground" data-testid={`text-notification-time-${n.id}`}>{timeAgo(n.createdAt)}</span>
                          {!n.readStatus && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" data-testid={`badge-unread-${n.id}`} />}
                        </div>
                        <p className="text-xs leading-relaxed" data-testid={`text-notification-message-${n.id}`}>{parsed.message || n.content}</p>
                        {parsed.matchedTags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1" data-testid={`tags-notification-${n.id}`}>
                            {parsed.matchedTags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-[9px] border-primary/30 text-primary no-default-hover-elevate no-default-active-elevate">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {parsed.propertyTitle && (
                          <p className="text-[10px] text-muted-foreground mt-0.5" data-testid={`text-notification-property-${n.id}`}>
                            {parsed.propertyTitle} &bull; ${parsed.propertyPrice?.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
