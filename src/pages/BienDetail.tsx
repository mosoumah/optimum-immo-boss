import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Building, ArrowLeft, MapPin, Maximize2, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAgencySettings } from "@/hooks/useAgencySettings";

const statutColors: Record<string, string> = {
  disponible: "bg-success/20 text-success",
  reserve: "bg-warning/20 text-warning",
  vendu: "bg-blue-500/20 text-blue-400",
  loue: "bg-purple-500/20 text-purple-400",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " GNF";

const formatDate = (date: string) => new Date(date).toLocaleDateString("fr-FR");

const BienDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const { venteEnabled, locationEnabled } = useAgencySettings();
  const [property, setProperty] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!entrepriseId || !id) return;

    const [propRes, resRes] = await Promise.all([
      supabase.from("properties").select("*").eq("id", id).eq("entreprise_id", entrepriseId).maybeSingle(),
      supabase.from("reservations").select("*, clients(nom)").eq("property_id", id).order("date_arrivee", { ascending: false }),
    ]);

    setProperty(propRes.data);
    setReservations(resRes.data || []);
    setIsLoading(false);
  }, [entrepriseId, id]);

  useEffect(() => {
    if (entrepriseId && id) fetchData();
  }, [entrepriseId, id, fetchData]);

  if (entrepriseLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background p-8 text-center">
        <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Bien non trouvé</h1>
        <Button asChild><Link to="/biens">Retour aux biens</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild><Link to="/biens"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{property.nom}</h1>
            <p className="text-muted-foreground">Fiche bien</p>
          </div>
          <Badge className={statutColors[property.statut] || "bg-muted"}>{property.statut}</Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 p-6 rounded-xl border border-border/50 bg-card">
            {property.cover_image_url ? (
              <img src={property.cover_image_url} alt={property.nom} className="w-full h-48 object-cover rounded-lg mx-auto mb-4" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-primary" />
              </div>
            )}
            <h2 className="text-xl font-semibold text-center mb-4">{property.nom}</h2>
            <div className="space-y-3 text-sm">
              {property.adresse && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{property.adresse}</div>}
              {property.surface && <div className="flex items-center gap-2"><Maximize2 className="w-4 h-4 text-muted-foreground" />{property.surface} m²</div>}
              {property.nombre_pieces && <div>Pièces : {property.nombre_pieces}</div>}
              <div className="font-bold text-primary text-lg">{formatCurrency(property.prix)}</div>
            </div>
            {property.description && <p className="mt-4 text-sm text-muted-foreground">{property.description}</p>}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">
            {locationEnabled && (
              <div className="p-6 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Réservations ({reservations.length})</h3>
                </div>
                {reservations.length > 0 ? (
                  <div className="space-y-2">
                    {reservations.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div>
                          <div className="font-medium text-sm">{(r as any).clients?.nom || "Client"}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(r.date_arrivee)} → {formatDate(r.date_depart)}</div>
                        </div>
                        <span className="font-medium">{formatCurrency(r.montant_total)}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-sm">Aucune réservation</p>}
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BienDetail;
