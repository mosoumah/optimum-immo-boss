import { Bed, Sofa, Bath, ChefHat, Car, Trees, Waves, Wifi, Snowflake, Armchair } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyFeaturesProps {
  property: Property;
}

const Item = ({ icon: Icon, label, value }: { icon: typeof Bed; label: string; value?: React.ReactNode }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      {value !== undefined && <div className="text-sm font-medium truncate">{value}</div>}
    </div>
  </div>
);

export const PropertyFeatures = ({ property }: PropertyFeaturesProps) => {
  const items: { icon: typeof Bed; label: string; value?: React.ReactNode; show: boolean }[] = [
    { icon: Bed, label: "Chambres", value: property.chambres, show: !!property.chambres },
    { icon: Sofa, label: "Salons", value: property.salons, show: !!property.salons },
    { icon: Bath, label: "Salles de bain", value: property.salles_bain, show: !!property.salles_bain },
    { icon: ChefHat, label: "Cuisine", value: "Équipée", show: property.cuisine },
    { icon: Car, label: "Parking", value: "Disponible", show: property.parking },
    { icon: Trees, label: "Balcon", value: "Oui", show: property.balcon },
    { icon: Waves, label: "Piscine", value: "Oui", show: property.piscine },
    { icon: Wifi, label: "Internet", value: "Oui", show: property.internet },
    { icon: Snowflake, label: "Climatisation", value: "Oui", show: property.climatisation },
    { icon: Armchair, label: "Meublé", value: "Oui", show: property.meuble },
  ];

  const visible = items.filter((i) => i.show);
  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {visible.map((it) => (
        <Item key={it.label} icon={it.icon} label={it.label} value={it.value} />
      ))}
    </div>
  );
};
