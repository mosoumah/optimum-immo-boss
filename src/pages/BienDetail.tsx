import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building, ArrowLeft, MapPin, Maximize2, Trash2, Pencil, FileText, Download, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useToast } from "@/hooks/use-toast";
import { usePropertyMedia } from "@/hooks/usePropertyMedia";
import { usePropertyStats } from "@/hooks/usePropertyStats";
import { PropertyGallery } from "@/components/biens/PropertyGallery";
import { PropertyFeatures } from "@/components/biens/PropertyFeatures";
import { PropertyStatsCards } from "@/components/biens/PropertyStatsCards";
import { BienDialog } from "@/components/dialogs/BienDialog";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

const typeBienLabels: Record<string, string> = {
  appartement: "Appartement",
  villa: "Villa",
  maison: "Maison",
  terrain: "Terrain",
  bureau: "Bureau",
  magasin: "Magasin",
  entrepot: "Entrepôt",
  commercial: "Commercial",
};

const statutColors: Record<string, string> = {
  disponible: "bg-success/20 text-success",
  reserve: "bg-warning/20 text-warning",
};

const statutLabels: Record<string, string> = {
  disponible: "Disponible",
  reserve: "Réservé",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

const formatDate = (date: string) => new Date(date).toLocaleDateString("fr-FR");

const getVideoEmbed = (url: string): string | null => {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
};

const BienDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();

  const [property, setProperty] = useState<Property | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const { media } = usePropertyMedia(id);
  const stats = usePropertyStats(property, reservations);

  const fetchData = useCallback(async () => {
    if (!entrepriseId || !id) return;
    setIsLoading(true);
    const [propRes, resRes, clientsRes] = await Promise.all([
      supabase.from("properties").select("*").eq("id", id).eq("entreprise_id", entrepriseId).maybeSingle(),
      supabase.from("reservations").select("*").eq("property_id", id).order("date_arrivee", { ascending: false }),
      supabase.from("clients").select("id, nom").eq("entreprise_id", entrepriseId),
    ]);
    setProperty(propRes.data);
    setReservations(resRes.data || []);
    const nameMap: Record<string, string> = {};
    (clientsRes.data || []).forEach((c) => (nameMap[c.id] = c.nom));
    setClientNames(nameMap);
    setIsLoading(false);
  }, [entrepriseId, id]);

  useEffect(() => {
    if (entrepriseId && id) fetchData();
  }, [entrepriseId, id, fetchData]);

  const galleryImages = useMemo(
    () =>
      media
        .filter((m) => m.media_type === "image" && m.signedUrl)
        .sort((a, b) => Number(b.is_cover) - Number(a.is_cover))
        .map((m) => ({ url: m.signedUrl as string, alt: m.nom_fichier })),
    [media]
  );

  const documents = useMemo(() => media.filter((m) => m.media_type === "document"), [media]);
  const uploadedVideos = useMemo(() => media.filter((m) => m.media_type === "video"), [media]);

  const today = new Date().toISOString().slice(0, 10);
  const now = reservations.filter((r) => r.statut === "en_cours" || (r.date_arrivee <= today && r.date_depart >= today));
  const upcoming = reservations.filter((r) => r.date_arrivee > today);
  const past = reservations.filter((r) => r.date_depart < today || r.statut === "terminee");

  const lastResLabel = stats.lastReservation
    ? formatDate(stats.lastReservation.date_arrivee)
    : "Aucune";

  const handleDelete = async () => {
    if (!property || !id || !entrepriseId) return;
    setIsDeleting(true);
    // Delete all media files
    for (const m of media) {
      await supabase.storage.from(m.bucket).remove([m.storage_path]);
    }
    await supabase.from("property_media").delete().eq("property_id", id);
    if (property.cover_image_url) {
      await supabase.storage.from("property-covers").remove([`${entrepriseId}/${id}.jpg`]);
    }
    // Delete factures linked to reservations of this property
    const { data: linkedRes } = await supabase
      .from("reservations")
      .select("client_id, property_name")
      .eq("property_id", id);
    if (linkedRes && linkedRes.length > 0) {
      for (const r of linkedRes) {
        await supabase.from("factures").delete()
          .eq("client_id", r.client_id)
          .eq("entreprise_id", entrepriseId)
          .ilike("description", `%${r.property_name}%`);
      }
    }
    await supabase.from("reservations").delete().eq("property_id", id);
    const { error } = await supabase.from("properties").delete().eq("id", id);
    setIsDeleting(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Bien supprimé" });
      navigate("/biens");
    }
  };

  const downloadDoc = async (bucket: string, path: string, name: string) => {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) {
      toast({ title: "Erreur", description: "Téléchargement impossible", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (entrepriseLoading || isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="h-full bg-background p-6 text-center overflow-y-auto">
        <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Bien non trouvé</h1>
        <Button asChild>
          <Link to="/biens">Retour aux biens</Link>
        </Button>
      </div>
    );
  }

  const localisationParts = [property.adresse, property.quartier, property.commune, property.ville].filter(Boolean);
  const videoEmbed = getVideoEmbed(property.video_url || "");

  const renderResList = (list: Reservation[]) =>
    list.length === 0 ? (
      <p className="text-sm text-muted-foreground py-4">Aucune réservation</p>
    ) : (
      <div className="space-y-2">
        {list.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{clientNames[r.client_id] || "Client"}</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(r.date_arrivee)} → {formatDate(r.date_depart)}
              </div>
            </div>
            <span className="font-medium text-sm">{formatCurrency(Number(r.montant_total))}</span>
          </div>
        ))}
      </div>
    );

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-background p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto space-y-6 min-w-0">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
              <Link to="/biens"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{property.nom}</h1>
              <p className="text-muted-foreground text-xs sm:text-sm truncate">
                {typeBienLabels[property.type_bien] || property.type_bien}
              </p>
            </div>
            <Badge className={`${statutColors[property.statut] || "bg-muted"} flex-shrink-0`}>
              {statutLabels[property.statut] || property.statut}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="flex-1 sm:flex-none">
              <Pencil className="w-4 h-4 mr-1" /> Modifier
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting} className="flex-1 sm:flex-none">
                  <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce bien ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le bien « {property.nom} », ses photos, vidéos et documents seront définitivement supprimés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Gallery + Infos */}
        <div className="grid lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            <PropertyGallery images={galleryImages} fallbackCover={property.cover_image_url} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="p-5 rounded-xl border border-border/50 bg-card">
              <div className="text-3xl font-bold text-primary mb-1">{formatCurrency(Number(property.prix))}</div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {property.surface && (
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5" />{property.surface} m²
                  </span>
                )}
                {property.nombre_pieces && <span>{property.nombre_pieces} pcs</span>}
              </div>
            </div>

            {localisationParts.length > 0 && (
              <div className="p-5 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                  <MapPin className="w-4 h-4 text-primary" /> Localisation
                </div>
                <p className="text-sm text-muted-foreground">{localisationParts.join(" — ")}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Caractéristiques */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Caractéristiques</h2>
          <PropertyFeatures property={property} />
        </section>

        {/* Description */}
        {(property.description || property.description_longue) && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Description</h2>
            <div className="p-5 rounded-xl border border-border/50 bg-card space-y-3">
              {property.description && <p className="text-sm font-medium">{property.description}</p>}
              {property.description_longue && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {property.description_longue}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Vidéo */}
        {(videoEmbed || uploadedVideos.length > 0) && (
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" /> Vidéo
            </h2>
            {videoEmbed && (
              <div className="aspect-video rounded-xl overflow-hidden border border-border/50 bg-black">
                <iframe
                  src={videoEmbed}
                  title="Vidéo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}
            {uploadedVideos.map((v) =>
              v.signedUrl ? (
                <div key={v.id} className="aspect-video rounded-xl overflow-hidden border border-border/50 bg-black mt-3">
                  <video
                    src={v.signedUrl}
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : null
            )}
          </section>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Documents
            </h2>
            <div className="space-y-2">
              {documents.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => downloadDoc(d.bucket, d.storage_path, d.nom_fichier)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm truncate">{d.nom_fichier}</span>
                  </div>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Statistiques */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Statistiques</h2>
          <PropertyStatsCards
            revenue={stats.revenue}
            total={stats.total}
            occupancyRate={stats.occupancyRate}
            lastReservationLabel={lastResLabel}
          />
        </section>

        {/* Historique réservations */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Historique des réservations</h2>
          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <Tabs defaultValue="en_cours" className="w-full">
              <TabsList>
                <TabsTrigger value="en_cours">En cours ({now.length})</TabsTrigger>
                <TabsTrigger value="a_venir">À venir ({upcoming.length})</TabsTrigger>
                <TabsTrigger value="passees">Passées ({past.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="en_cours">{renderResList(now)}</TabsContent>
              <TabsContent value="a_venir">{renderResList(upcoming)}</TabsContent>
              <TabsContent value="passees">{renderResList(past)}</TabsContent>
            </Tabs>
          </div>
        </section>
      </div>

      <BienDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        property={property}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default BienDetail;
