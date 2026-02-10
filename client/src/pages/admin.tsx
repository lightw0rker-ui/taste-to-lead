import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Building2, Trash2, Zap, Crown, Shield, Upload, Wand2, RefreshCw, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Redirect } from "wouter";

type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  subscriptionTier: string;
  isAdmin: boolean;
  organizationId: number | null;
};

type AdminListing = {
  id: number;
  title: string;
  price: number;
  location: string;
  vibe: string;
  vibeTag: string;
  status: string;
  agentId: string;
  organizationId: number | null;
};

type TabId = "agents" | "listings" | "staging";

function StatCard({ icon: Icon, label, value }: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-5 backdrop-blur-xl bg-card/80 border-card-border" data-testid={`admin-stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold" data-testid={`admin-stat-value-${label.toLowerCase().replace(/\s/g, '-')}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function AgentsTab() {
  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const premiumCount = users.filter(u => u.subscriptionTier === "premium").length;
  const freeCount = users.filter(u => u.subscriptionTier === "free").length;
  const adminCount = users.filter(u => u.isAdmin).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Agents" value={String(users.length)} />
        <StatCard icon={Crown} label="Premium" value={String(premiumCount)} />
        <StatCard icon={Users} label="Free" value={String(freeCount)} />
        <StatCard icon={Shield} label="Admins" value={String(adminCount)} />
      </div>

      <Card className="overflow-hidden border-card-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-agents">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tier</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/50" data-testid={`row-agent-${u.id}`}>
                  <td className="px-4 py-3 text-muted-foreground">{u.id}</td>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2 flex-wrap">
                      {u.name}
                      {u.isAdmin && <Badge variant="outline" className="text-xs"><Shield className="w-3 h-3 mr-1" />Admin</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.subscriptionTier === "premium" ? (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                        <Crown className="w-3 h-3 mr-1" />Premium
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Free</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ListingsTab() {
  const { toast } = useToast();
  const { data: listings = [], isLoading } = useQuery<AdminListing[]>({
    queryKey: ["/api/admin/listings"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/listing/${id}/delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      toast({ title: "Listing deleted", description: "The listing has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = listings.filter(l => l.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon={Building2} label="Total Listings" value={String(listings.length)} />
        <StatCard icon={Building2} label="Active" value={String(activeCount)} />
        <StatCard icon={Building2} label="Inactive" value={String(listings.length - activeCount)} />
      </div>

      <Card className="overflow-hidden border-card-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-listings">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vibe</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-border/50" data-testid={`row-listing-${l.id}`}>
                  <td className="px-4 py-3 text-muted-foreground">{l.id}</td>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{l.title}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">{l.location}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{l.vibeTag || l.vibe}</Badge>
                  </td>
                  <td className="px-4 py-3">${l.price?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={l.status === "active" ? "default" : "secondary"} className="text-xs">{l.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(l.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-listing-${l.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const VIBE_ARCHETYPES = [
  { name: "Monarch", color: "from-amber-500 to-yellow-600", desc: "Regal, opulent spaces with rich textures" },
  { name: "Purist", color: "from-slate-400 to-zinc-500", desc: "Minimalist, clean lines, monochrome" },
  { name: "Industrialist", color: "from-stone-500 to-neutral-600", desc: "Raw materials, exposed elements" },
  { name: "Futurist", color: "from-cyan-400 to-blue-500", desc: "Cutting-edge tech, sleek surfaces" },
  { name: "Naturalist", color: "from-emerald-400 to-green-500", desc: "Organic, biophilic, earth tones" },
  { name: "Curator", color: "from-violet-400 to-purple-500", desc: "Eclectic art, bold statement pieces" },
  { name: "Classicist", color: "from-rose-400 to-pink-500", desc: "Traditional elegance, timeless design" },
  { name: "Nomad", color: "from-orange-400 to-red-500", desc: "Global influences, layered textiles" },
];

function StagingTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<{ name: string; color: string; desc: string; imageUrl: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setGeneratedCards([]);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!uploadedImage) {
      toast({ title: "Upload Required", description: "Please upload an empty room photo first.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const cards = VIBE_ARCHETYPES.map((v) => ({
        ...v,
        imageUrl: uploadedImage!,
      }));
      setGeneratedCards(cards);
      setIsGenerating(false);
      toast({ title: "8 Realities Generated", description: "Simulated staging complete. Connect DALL-E API key to enable real generation." });
    }, 1500);
  };

  const handleRegenerate = (index: number) => {
    toast({ title: "Regenerating...", description: `${generatedCards[index].name} staging will update when DALL-E API is connected.` });
  };

  // --- COMMENTED OUT: Real DALL-E 3 Integration ---
  // To enable real AI staging, uncomment this code and add OPENAI_API_KEY to secrets.
  //
  // async function generateStagedImage(imageBase64: string, vibeStyle: string): Promise<string> {
  //   const response = await fetch('/api/admin/stage', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ image: imageBase64, style: vibeStyle }),
  //   });
  //   const data = await response.json();
  //   return data.imageUrl;
  // }
  //
  // Backend endpoint (add to server/routes.ts):
  //
  // app.post("/api/admin/stage", requireAdmin, async (req, res) => {
  //   const { image, style } = req.body;
  //   const OpenAI = (await import("openai")).default;
  //   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  //
  //   const response = await openai.images.generate({
  //     model: "dall-e-3",
  //     prompt: `Professional interior design photo of a room staged in the "${style}" aesthetic. 
  //              The room should reflect ${style} design principles with appropriate furniture,
  //              decor, lighting, and color palette. Photorealistic, high-end real estate photography.`,
  //     n: 1,
  //     size: "1024x1024",
  //     quality: "standard",
  //   });
  //
  //   res.json({ imageUrl: response.data[0].url });
  // });
  // --- END COMMENTED OUT ---

  return (
    <div className="space-y-6">
      <Card className="p-6 border-card-border space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <ImageIcon className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold">Upload Empty Room Photo</h3>
            <p className="text-xs text-muted-foreground">Upload a photo to generate 8 styled staging variations</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            data-testid="input-staging-upload"
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-upload-room"
          >
            <Upload className="w-4 h-4" />
            {uploadedImage ? "Change Photo" : "Choose Photo"}
          </Button>
          <Button
            className="gap-2"
            onClick={handleGenerate}
            disabled={!uploadedImage || isGenerating}
            data-testid="button-generate-realities"
          >
            <Wand2 className="w-4 h-4" />
            {isGenerating ? "Generating..." : "Generate 8 Realities"}
          </Button>
        </div>

        {uploadedImage && (
          <div className="rounded-md overflow-hidden border border-border max-w-xs">
            <img src={uploadedImage} alt="Uploaded room" className="w-full h-auto" data-testid="img-uploaded-room" />
          </div>
        )}
      </Card>

      {generatedCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {generatedCards.map((card, i) => (
            <Card key={card.name} className="overflow-hidden border-card-border" data-testid={`card-staging-${card.name.toLowerCase()}`}>
              <div className="aspect-square relative overflow-hidden">
                <img src={card.imageUrl} alt={`${card.name} staging`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <Badge className={`bg-gradient-to-r ${card.color} text-white border-0 text-xs`}>
                    {card.name}
                  </Badge>
                  <p className="text-white/80 text-[11px] mt-1 line-clamp-2">{card.desc}</p>
                </div>
              </div>
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => handleRegenerate(i)}
                  data-testid={`button-regenerate-${card.name.toLowerCase()}`}
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("agents");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Redirect to="/agent" />;
  }

  const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
    { id: "agents", label: "Agents", icon: Users },
    { id: "listings", label: "Listings", icon: Building2 },
    { id: "staging", label: "AI Staging", icon: Wand2 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-admin-title">God Mode</h1>
          <p className="text-sm text-muted-foreground">Platform administration</p>
        </div>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
            className="gap-2"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "agents" && <AgentsTab />}
      {activeTab === "listings" && <ListingsTab />}
      {activeTab === "staging" && <StagingTab />}
    </div>
  );
}
