import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, TrendingUp, Sparkles, ArrowLeft, MapPin, Bed, Bath } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Property } from "@shared/schema";

type VibeEntry = {
  vibe: string;
  count: number;
  percentage: number;
};

type TasteStats = {
  vibePercentages: VibeEntry[];
  topVibe: string | null;
  topPicks: Property[];
  savedHomes: Property[];
  totalSwipes: number;
};

const VIBE_COLORS: Record<string, string> = {
  Monarch: "from-amber-500 to-yellow-600",
  Purist: "from-slate-400 to-zinc-500",
  Industrialist: "from-stone-500 to-neutral-600",
  Futurist: "from-cyan-400 to-blue-500",
  Naturalist: "from-emerald-400 to-green-500",
  Curator: "from-violet-400 to-purple-500",
  Classicist: "from-rose-400 to-pink-500",
  Nomad: "from-orange-400 to-red-500",
};

function VibeBar({ entry, maxPercentage }: { entry: VibeEntry; maxPercentage: number }) {
  const gradient = VIBE_COLORS[entry.vibe] || "from-primary to-primary/80";
  const barWidth = maxPercentage > 0 ? (entry.percentage / maxPercentage) * 100 : 0;

  return (
    <div className="space-y-1.5" data-testid={`vibe-bar-${entry.vibe.toLowerCase()}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{entry.vibe}</span>
        <span className="text-sm text-muted-foreground">{entry.percentage}%</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        />
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const image = (property.images && property.images.length > 0)
    ? property.images[0]
    : "/images/property-1.png";

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-property-${property.id}`}>
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={image}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-[10px]">
            {property.vibeTag || property.vibe}
          </Badge>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-sm truncate" data-testid={`text-property-title-${property.id}`}>{property.title}</h3>
        <p className="text-primary font-bold text-sm">${property.price.toLocaleString()}</p>
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{property.location}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{property.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{property.bathrooms}</span>
        </div>
      </div>
    </Card>
  );
}

export default function MyTaste() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<TasteStats>({
    queryKey: ["/api/user/stats"],
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your taste profile...</p>
        </div>
      </div>
    );
  }

  const hasData = stats && stats.totalSwipes > 0;
  const top3Vibes = stats?.vibePercentages.slice(0, 3) || [];
  const maxPercentage = top3Vibes[0]?.percentage || 100;

  return (
    <div className="fixed inset-0 bg-background flex flex-col font-serif">
      <header className="flex items-center justify-between gap-4 p-4 border-b border-border shrink-0 bg-background/50 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back-to-swipe">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-2xl tracking-tighter italic text-primary" data-testid="text-my-taste-title">My Taste</h1>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-8 pb-8">
          {!hasData ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Heart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold" data-testid="text-empty-taste">No taste data yet</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Start swiping right on homes you love. We'll build your taste profile as you go.
              </p>
              <Button onClick={() => setLocation("/")} data-testid="button-start-swiping">
                Start Swiping
              </Button>
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold" data-testid="text-vibe-chart-title">Your Vibe Chart</h2>
                </div>
                {stats?.topVibe && (
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Sparkles className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-sm">
                        You are <span className="font-bold text-primary">{top3Vibes[0]?.percentage}% {stats.topVibe}</span>
                        {top3Vibes[1] && (
                          <>, <span className="font-medium">{top3Vibes[1].percentage}% {top3Vibes[1].vibe}</span></>
                        )}
                        {top3Vibes[2] && (
                          <>, <span className="font-medium">{top3Vibes[2].percentage}% {top3Vibes[2].vibe}</span></>
                        )}
                      </p>
                    </div>
                  </Card>
                )}
                <div className="space-y-3">
                  {top3Vibes.map((entry) => (
                    <VibeBar key={entry.vibe} entry={entry} maxPercentage={maxPercentage} />
                  ))}
                </div>
              </section>

              {stats && stats.topPicks.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold" data-testid="text-top-picks-title">Top Picks for You</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on your {stats.topVibe} vibe, you might love these:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {stats.topPicks.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-bold" data-testid="text-saved-homes-title">Saved Homes</h2>
                  <Badge variant="secondary" className="text-xs">{stats?.savedHomes.length || 0}</Badge>
                </div>
                {stats && stats.savedHomes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {stats.savedHomes.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No saved homes yet. Swipe right to save!</p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
