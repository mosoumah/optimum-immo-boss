import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building, Plus, Search, MapPin, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { FloatingParticles } from "@/components/FloatingParticles";
import { useAuth } from "@/hooks/useAuth";
import { useEntreprise } from "@/hooks/useEntreprise";
import { supabase } from "@/integrations/supabase/client";
import { BienDialog } from "@/components/dialogs/BienDialog";
import { PermissionGate } from "@/components/PermissionGate";

interface Property {
  id: string;
  nom: string;
  adresse: string | null;
  type_bien: string;
  surface: number | null;
  prix: number;
  statut: string;
  nombre_pieces: number | null;
  created_at: string;
  cover_image_url: string | null;
}

const statutColors: Record<string, string> = {
  disponible: "bg-success/20 text-success",
  reserve: "bg-warning/20 text-warning",
};

const statutLabels: Record<string, string> = {
  disponible: "Disponible",
  reserve: "Réservé",
};

const typeBienLabels: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  terrain: "Terrain",
  bureau: "Bureau",
  commercial: "Commercial",
};

const Biens = () => {
  const { signOut } = useAuth();
  const { entrepriseId } = useEntreprise();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);


  const fetchProperties = useCallback(async () => {
    if (!entrepriseId) return;
    const { data } = await supabase
      .from("properties")
      .select("id, nom, adresse, type_bien, surface, prix, statut, nombre_pieces, created_at, cover_image_url")
      .eq("entreprise_id", entrepriseId)
      .order("created_at", { ascending: false });
    setProperties(data || []);
    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) fetchProperties();
  }, [entrepriseId, fetchProperties]);

  const filtered = properties.filter((p) => {
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase()) ||
      (p.adresse?.toLowerCase().includes(search.toLowerCase()));
    const matchStatut = filterStatut === "all" || p.statut === filterStatut;
    const matchType = filterType === "all" || p.type_bien === filterType;
    return matchSearch && matchStatut && matchType;
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

  return (
    <div className="min-h-screen bg-background flex">
      <FloatingParticles />
      <DynamicSidebar onSignOut={signOut} />
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-16 lg:pt-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Biens</h1>
              <p className="text-muted-foreground">Catalogue de vos biens immobiliers</p>
            </div>
            <PermissionGate permission="creer_bien">
              <Button onClick={() => { setEditingProperty(null); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />Nouveau bien
              </Button>
            </PermissionGate>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="reserve">Réservé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="appartement">Appartement</SelectItem>
                <SelectItem value="maison">Maison</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
                <SelectItem value="bureau">Bureau</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun bien</h3>
              <p className="text-muted-foreground">Ajoutez votre premier bien immobilier</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/biens/${p.id}`}
                    className="block rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all overflow-hidden"
                  >
                    {p.cover_image_url ? (
                      <img
                        src={p.cover_image_url}
                        alt={p.nom}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-40 bg-muted flex items-center justify-center">
                        <Building className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{p.nom}</h3>
                        <span className="text-xs text-muted-foreground">{typeBienLabels[p.type_bien] || p.type_bien}</span>
                      </div>
                      <Badge className={statutColors[p.statut] || "bg-muted text-muted-foreground"}>
                        {statutLabels[p.statut] || p.statut}
                      </Badge>
                    </div>
                    {p.adresse && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" />{p.adresse}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-primary">{formatCurrency(p.prix)}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {p.surface && <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{p.surface} m²</span>}
                        {p.nombre_pieces && <span>{p.nombre_pieces} pcs</span>}
                      </div>
                    </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <BienDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          property={editingProperty as any}
          onSuccess={fetchProperties}
        />
      </main>
    </div>
  );
};

export default Biens;
