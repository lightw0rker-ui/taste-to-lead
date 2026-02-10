import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Building2, Users, DollarSign, TrendingUp, Crown, ExternalLink, Lock, Globe, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Property, SyncRequest } from "@shared/schema";

function UpgradeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm backdrop-blur-xl bg-card border-card-border text-center" data-testid="dialog-upgrade">
        <DialogHeader className="items-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 mb-2">
            <Crown className="w-7 h-7 text-amber-400" />
          </div>
          <DialogTitle className="text-xl">Unlock Premium Features</DialogTitle>
          <DialogDescription className="text-sm">
            Upgrade to Premium to access Concierge Import, unlimited listings, and more.
          </DialogDescription>
        </DialogHeader>
        <Button
          data-testid="button-modal-upgrade"
          onClick={() => window.open("https://esotarot.lemonsqueezy.com/checkout", "_blank")}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold mt-2"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Premium
          <ExternalLink className="w-3 h-3 ml-2" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value, subtext }: {
  icon: typeof Building2;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <Card className="relative overflow-visible p-5 backdrop-blur-xl bg-card/80 border-card-border" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{subtext}</p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { isPremium, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");

  const canUsePremiumFeatures = isPremium || isSuperAdmin;

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: syncRequests } = useQuery<SyncRequest[]>({
    queryKey: ["/api/sync-requests"],
    enabled: canUsePremiumFeatures,
  });

  const syncMutation = useMutation({
    mutationFn: async (websiteUrl: string) => {
      const res = await apiRequest("POST", "/api/sync-requests", { websiteUrl });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sync-requests"] });
      setImportUrl("");
      toast({ title: "Sync request submitted", description: "We'll process your import shortly." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSyncClick = () => {
    if (!canUsePremiumFeatures) {
      setShowUpgradeModal(true);
      return;
    }
    if (!importUrl.trim() || !importUrl.startsWith("http")) {
      toast({ title: "Please enter a valid URL", variant: "destructive" });
      return;
    }
    syncMutation.mutate(importUrl);
  };

  const totalListings = properties?.length ?? 0;
  const activeListings = properties?.filter(p => p.status === "active").length ?? 0;
  const totalValue = properties?.reduce((sum, p) => sum + p.price, 0) ?? 0;

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back to your command center</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-20 bg-muted rounded-md" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-serif" data-testid="text-dashboard-title">Taste to Lead | Agent Console</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back to your command center</p>
        </div>
        {!canUsePremiumFeatures && (
          <Button
            data-testid="button-upgrade-premium"
            onClick={() => setShowUpgradeModal(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        )}
        {canUsePremiumFeatures && (
          <Badge variant="outline" className="border-amber-500/50 text-amber-400" data-testid="badge-premium">
            <Crown className="w-3 h-3 mr-1" />
            {isSuperAdmin ? "Super Admin" : "Premium"}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Listings"
          value={totalListings.toString()}
          subtext={`${activeListings} active`}
        />
        <StatCard
          icon={Users}
          label="Active Leads"
          value="24"
          subtext="+3 this week"
        />
        <StatCard
          icon={DollarSign}
          label="Total Value"
          value={formatCurrency(totalValue)}
          subtext="Across all listings"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion Rate"
          value="12.5%"
          subtext="+2.1% from last month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 backdrop-blur-xl bg-card/80 border-card-border relative" data-testid="card-import">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Auto-Import from Website</h3>
            {!canUsePremiumFeatures && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[10px]">
                <Lock className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Paste a listing URL and we'll import the property details automatically.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://zillow.com/listing/..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              disabled={!canUsePremiumFeatures}
              className={!canUsePremiumFeatures ? "opacity-50" : ""}
              data-testid="input-import-url"
            />
            <Button
              onClick={handleSyncClick}
              disabled={syncMutation.isPending}
              data-testid="button-start-sync"
              className={!canUsePremiumFeatures ? "relative" : ""}
            >
              {syncMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : !canUsePremiumFeatures ? (
                <>
                  <Lock className="w-4 h-4 mr-1" />
                  Start Sync
                </>
              ) : (
                "Start Sync"
              )}
            </Button>
          </div>
          {canUsePremiumFeatures && syncRequests && syncRequests.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Recent Imports</p>
              {syncRequests.slice(0, 3).map((sr) => (
                <div key={sr.id} className="flex items-center justify-between gap-2 flex-wrap py-1.5 border-b border-border last:border-0">
                  <span className="text-sm truncate max-w-[200px]" data-testid={`text-sync-url-${sr.id}`}>{sr.websiteUrl}</span>
                  <Badge variant="outline" className="text-[10px]" data-testid={`badge-sync-status-${sr.id}`}>
                    {sr.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 backdrop-blur-xl bg-card/80 border-card-border">
          <h3 className="font-semibold mb-4" data-testid="text-recent-activity">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: "New lead on", property: "Skyline Penthouse", time: "2 hours ago" },
              { action: "Price updated for", property: "Mediterranean Villa", time: "5 hours ago" },
              { action: "New inquiry on", property: "Urban Loft", time: "1 day ago" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2 flex-wrap py-2 border-b border-border last:border-0">
                <p className="text-sm">
                  <span className="text-muted-foreground">{item.action}</span>{" "}
                  <span className="font-medium">{item.property}</span>
                </p>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 backdrop-blur-xl bg-card/80 border-card-border">
        <h3 className="font-semibold mb-4" data-testid="text-quick-stats">Performance</h3>
        <div className="space-y-4">
          {[
            { label: "Profile Views", value: 1842, max: 2500 },
            { label: "Lead Responses", value: 18, max: 30 },
            { label: "Listings Viewed", value: 432, max: 500 },
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium">{item.value.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  );
}
