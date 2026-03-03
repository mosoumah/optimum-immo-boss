import { useState, useEffect, useCallback, useRef } from "react";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { FloatingParticles } from "@/components/FloatingParticles";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageBell } from "@/components/MessageBell";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  ImagePlus,
  Wand2,
  Download,
  RefreshCw,
  Upload,
  Sparkles,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";

const PLAN_LIMITS: Record<string, number> = { standard: 10, pro: 50, premium: 100 };

interface Entreprise {
  id: string;
  nom: string;
  telephone: string | null;
  couleur_primaire: string | null;
}

const StudioIA = () => {
  const { signOut } = useAuth();
  const { entrepriseId } = useEntreprise();
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);

  // Quota
  const [quota, setQuota] = useState<{ used: number; limit: number; plan: string } | null>(null);

  // Tab 1 state
  const [bienDescription, setBienDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [showPrix, setShowPrix] = useState(false);
  const [mention, setMention] = useState("Disponible");
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includePhone, setIncludePhone] = useState(true);
  const [format, setFormat] = useState("instagram_post");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<any[]>([]);

  // Tab 2 state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState("");
  const [redesignResult, setRedesignResult] = useState<string | null>(null);
  const [isRedesigning, setIsRedesigning] = useState(false);
  const [redesignGallery, setRedesignGallery] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch entreprise details
  useEffect(() => {
    if (!entrepriseId) return;
    supabase.from("entreprises").select("id, nom, telephone, couleur_primaire").eq("id", entrepriseId).single().then(({ data }) => {
      if (data) setEntreprise(data);
    });
  }, [entrepriseId]);

  const fetchQuota = useCallback(async () => {
    if (!entrepriseId) return;
    const { data } = await supabase
      .from("studio_ia_quotas")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .single();
    if (data) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const used = data.month_year === currentMonth ? data.generations_used : 0;
      setQuota({ used, limit: PLAN_LIMITS[data.plan] || 10, plan: data.plan });
    } else {
      setQuota({ used: 0, limit: 10, plan: "standard" });
    }
  }, [entrepriseId]);

  const fetchGallery = useCallback(async () => {
    if (!entrepriseId) return;
    const { data } = await supabase
      .from("ai_generated_images")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setGallery(data);
  }, [entrepriseId]);

  const fetchRedesignGallery = useCallback(async () => {
    if (!entrepriseId) return;
    const { data } = await supabase
      .from("redesign_requests")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setRedesignGallery(data);
  }, [entrepriseId]);

  useEffect(() => {
    fetchQuota();
    fetchGallery();
    fetchRedesignGallery();
  }, [fetchQuota, fetchGallery, fetchRedesignGallery]);

  const handleGenerateVisual = async () => {
    if (!bienDescription.trim()) {
      toast({ title: "Erreur", description: "Décrivez le bien immobilier.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const { data, error } = await supabase.functions.invoke("studio-ia-generate", {
        body: {
          type: "visual",
          bien_description: bienDescription,
          prix: showPrix ? prix : null,
          mention,
          include_logo: includeLogo,
          include_phone: includePhone,
          format,
          entreprise_nom: entreprise?.nom,
          entreprise_phone: entreprise?.telephone,
          couleur_primaire: entreprise?.couleur_primaire,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erreur", description: data.error, variant: "destructive" });
        return;
      }
      setGeneratedImage(data.image_url);
      if (data.quota) setQuota(data.quota);
      fetchGallery();
      toast({ title: "Visuel créé !", description: "Votre visuel a été généré avec succès." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erreur", description: err.message || "Impossible de générer le visuel.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une image.", variant: "destructive" });
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
    setRedesignResult(null);
  };

  const handleRedesign = async () => {
    if (!uploadedImage || !instruction.trim()) {
      toast({ title: "Erreur", description: "Uploadez une image et écrivez une instruction.", variant: "destructive" });
      return;
    }
    setIsRedesigning(true);
    setRedesignResult(null);
    try {
      // Upload original to storage first
      let originalUrl = uploadedImage;
      if (uploadedFile) {
        const fileName = `originals/${entreprise?.id}/${crypto.randomUUID()}.${uploadedFile.name.split(".").pop()}`;
        const { error: upErr } = await supabase.storage.from("studio-ia").upload(fileName, uploadedFile, { contentType: uploadedFile.type });
        if (!upErr) {
          const { data: pub } = supabase.storage.from("studio-ia").getPublicUrl(fileName);
          originalUrl = pub.publicUrl;
        }
      }

      const { data, error } = await supabase.functions.invoke("studio-ia-generate", {
        body: { type: "redesign", original_image_url: originalUrl, instruction },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erreur", description: data.error, variant: "destructive" });
        return;
      }
      setRedesignResult(data.image_url);
      if (data.quota) setQuota(data.quota);
      fetchRedesignGallery();
      toast({ title: "Redesign terminé !", description: "La modification a été appliquée." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erreur", description: err.message || "Impossible de modifier l'image.", variant: "destructive" });
    } finally {
      setIsRedesigning(false);
    }
  };

  const handleDownload = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.click();
  };

  const quotaDisplay = quota ? (
    <Badge variant="outline" className="text-xs gap-1">
      <Sparkles className="w-3 h-3" />
      {quota.used}/{quota.limit} générations ({quota.plan})
    </Badge>
  ) : null;

  return (
    <div className="h-screen flex relative overflow-hidden">
      <FloatingParticles />
      <DynamicSidebar onSignOut={signOut} />

      <main className="h-screen overflow-y-auto lg:ml-64 flex-1">
        <div className="max-w-6xl mx-auto relative z-10 w-full p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <ImagePlus className="w-7 h-7 text-primary" />
                Studio IA
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Accélérateur de vente immobilière
              </p>
            </div>
            <div className="flex items-center gap-3">
              {quotaDisplay}
              <MessageBell />
              <NotificationBell />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="visual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="visual" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Création Visuel</span>
                <span className="sm:hidden">Visuel</span>
              </TabsTrigger>
              <TabsTrigger value="redesign" className="gap-2">
                <Wand2 className="w-4 h-4" />
                <span className="hidden sm:inline">Redesign IA</span>
                <span className="sm:hidden">Redesign</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Visual Creation */}
            <TabsContent value="visual">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Paramètres du visuel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Description du bien *</Label>
                      <Textarea
                        placeholder="Ex: Appartement T3 lumineux, 75m², balcon vue mer, cuisine équipée, parking..."
                        value={bienDescription}
                        onChange={(e) => setBienDescription(e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch checked={showPrix} onCheckedChange={setShowPrix} />
                      <Label>Afficher le prix</Label>
                    </div>
                    {showPrix && (
                      <Input
                        placeholder="Ex: 295 000 €"
                        value={prix}
                        onChange={(e) => setPrix(e.target.value)}
                      />
                    )}

                    <div>
                      <Label>Mention</Label>
                      <Select value={mention} onValueChange={setMention}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Disponible">Disponible</SelectItem>
                          <SelectItem value="À vendre">À vendre</SelectItem>
                          <SelectItem value="À louer">À louer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Format</Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram_post">Instagram Post (1080×1080)</SelectItem>
                          <SelectItem value="instagram_story">Story (1080×1920)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch checked={includeLogo} onCheckedChange={setIncludeLogo} />
                      <Label>Inclure logo agence</Label>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch checked={includePhone} onCheckedChange={setIncludePhone} />
                      <Label>Inclure numéro de téléphone</Label>
                    </div>

                    <PermissionGate permission="generer_image_ia" fallback={
                      <p className="text-sm text-muted-foreground text-center py-2">Vous n'avez pas la permission de générer des visuels.</p>
                    }>
                      <Button
                        onClick={handleGenerateVisual}
                        disabled={isGenerating || !bienDescription.trim()}
                        className="w-full gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Génération en cours...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Créer visuel
                          </>
                        )}
                      </Button>
                    </PermissionGate>
                  </CardContent>
                </Card>

                {/* Result */}
                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Résultat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {generatedImage ? (
                      <div className="space-y-4">
                        <img
                          src={generatedImage}
                          alt="Visuel généré"
                          className="w-full rounded-lg border border-border/30"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => handleDownload(generatedImage, "visuel-immobilier.png")}
                          >
                            <Download className="w-4 h-4" />
                            Télécharger
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={handleGenerateVisual}
                            disabled={isGenerating}
                          >
                            <RefreshCw className="w-4 h-4" />
                            Régénérer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/30 rounded-lg">
                        <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm">Le visuel apparaîtra ici</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Gallery */}
              {gallery.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Visuels précédents</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gallery.map((img) => (
                      <div
                        key={img.id}
                        className="relative group rounded-lg overflow-hidden border border-border/30 cursor-pointer"
                        onClick={() => setGeneratedImage(img.image_url)}
                      >
                        <img src={img.image_url} alt="Visuel" className="w-full aspect-square object-cover" />
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Badge variant="secondary" className="text-xs">{img.mention}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Redesign */}
            <TabsContent value="redesign">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload + Instruction */}
                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Photo & Instruction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("image/")) {
                          setUploadedFile(file);
                          const reader = new FileReader();
                          reader.onload = () => setUploadedImage(reader.result as string);
                          reader.readAsDataURL(file);
                          setRedesignResult(null);
                        }
                      }}
                    >
                      {uploadedImage ? (
                        <img src={uploadedImage} alt="Original" className="max-h-48 mx-auto rounded-lg" />
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Glissez une photo ou cliquez pour sélectionner
                          </p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <Label>Instruction de modification *</Label>
                      <Textarea
                        placeholder='Ex: "Moderniser la pièce style luxe", "Ajouter un tableau abstrait", "Remplacer la table par une table moderne"...'
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <PermissionGate permission="redesigner_bien_ia" fallback={
                      <p className="text-sm text-muted-foreground text-center py-2">Vous n'avez pas la permission de redesigner.</p>
                    }>
                      <Button
                        onClick={handleRedesign}
                        disabled={isRedesigning || !uploadedImage || !instruction.trim()}
                        className="w-full gap-2"
                      >
                        {isRedesigning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Modification en cours...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            Modifier avec l'IA
                          </>
                        )}
                      </Button>
                    </PermissionGate>
                  </CardContent>
                </Card>

                {/* Before / After */}
                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Avant / Après</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {redesignResult ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 text-center">Avant</p>
                            <img src={uploadedImage!} alt="Avant" className="w-full rounded-lg border border-border/30" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 text-center">Après</p>
                            <img src={redesignResult} alt="Après" className="w-full rounded-lg border border-border/30" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
                          <AlertTriangle className="w-3 h-3" />
                          Simulation visuelle à titre illustratif
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => handleDownload(redesignResult, "redesign-immobilier.png")}
                          >
                            <Download className="w-4 h-4" />
                            Télécharger
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={handleRedesign}
                            disabled={isRedesigning}
                          >
                            <RefreshCw className="w-4 h-4" />
                            Régénérer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/30 rounded-lg">
                        <Wand2 className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm">Le résultat apparaîtra ici</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Redesign Gallery */}
              {redesignGallery.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Redesigns précédents</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {redesignGallery.map((r) => (
                      <div
                        key={r.id}
                        className="relative group rounded-lg overflow-hidden border border-border/30 cursor-pointer"
                        onClick={() => {
                          setUploadedImage(r.original_image_url);
                          setRedesignResult(r.result_image_url);
                        }}
                      >
                        <img src={r.result_image_url} alt="Redesign" className="w-full aspect-square object-cover" />
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <p className="text-xs text-foreground truncate">{r.instruction}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default StudioIA;
