import { Bed, Sofa, Bath, ChefHat, Car, Trees, Waves, Wifi, Snowflake, Armchair } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyFeaturesProps {
  property: Property;
}

const Item = ({ icon: Icon, label, value }: { icon: typeof Bed; label: string; value?: React.ReactNode }) => (
  <div className="flex min-h-[52px] w-full min-w-0 items-center gap-2.5 rounded-lg border border-border/50 bg-card p-2.5 sm:min-h-[60px] sm:gap-3 sm:p-3">
    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-muted text-primary sm:h-9 sm:w-9">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-xs leading-snug text-muted-foreground break-words">{label}</div>
      {value !== undefined && <div className="text-sm font-medium leading-snug break-words">{value}</div>}
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
    <div className="grid w-full min-w-0 grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 bg-background">
      {visible.map((it) => (
        <Item key={it.label} icon={it.icon} label={it.label} value={it.value} />
      ))}
    </div>
  );
};
