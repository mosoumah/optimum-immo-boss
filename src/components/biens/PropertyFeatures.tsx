import { Bed, Sofa, Bath, ChefHat, Car, Trees, Waves, Wifi, Snowflake, Armchair } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyFeaturesProps {
  property: Property;
}

const FeatureTile = ({ icon: Icon, label, value }: { icon: typeof Bed; label: string; value?: React.ReactNode }) => (
  <div className="flex min-h-14 w-full min-w-0 items-center gap-3 rounded-lg border border-border/50 bg-card p-3">
    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-muted text-primary">
      <Icon className="h-4 w-4" />
    </span>
    <div className="min-w-0 flex-1">
      <div className="text-xs leading-tight text-muted-foreground break-words">{label}</div>
      <div className="mt-0.5 text-sm font-semibold leading-tight break-words">{value ?? "Oui"}</div>
    </div>
  </div>
);

export const PropertyFeatures = ({ property }: PropertyFeaturesProps) => {
  const items: { icon: typeof Bed; label: string; value?: React.ReactNode; show: boolean }[] = [
    { icon: Bed, label: "Chambres", value: property.chambres, show: !!property.chambres },
    { icon: Sofa, label: "Salons", value: property.salons, show: !!property.salons },
    { icon: Bath, label: "Salles de bain", value: property.salles_bain, show: !!property.salles_bain },
    { icon: ChefHat, label: "Cuisine", show: property.cuisine },
    { icon: Car, label: "Parking", show: property.parking },
    { icon: Trees, label: "Balcon", show: property.balcon },
    { icon: Waves, label: "Piscine", show: property.piscine },
    { icon: Wifi, label: "Internet", show: property.internet },
    { icon: Snowflake, label: "Climatisation", show: property.climatisation },
    { icon: Armchair, label: "Meublé", show: property.meuble },
  ];

  const visibleItems = items.filter((i) => i.show);
  if (visibleItems.length === 0) return null;

  return (
    <div className="flow-root w-full min-w-0 overflow-visible">
      <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((it) => (
          <FeatureTile key={it.label} icon={it.icon} label={it.label} value={it.value} />
        ))}
      </div>
    </div>
  );
};
