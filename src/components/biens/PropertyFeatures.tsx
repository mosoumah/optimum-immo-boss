import { Bed, Sofa, Bath, ChefHat, Car, Trees, Waves, Wifi, Snowflake, Armchair } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyFeaturesProps {
  property: Property;
}

const FeatureLine = ({ icon: Icon, label, value }: { icon: typeof Bed; label: string; value: React.ReactNode }) => (
  <div className="flex min-h-11 w-full min-w-0 items-center gap-3 border-b border-border/40 px-3 py-2 last:border-b-0">
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-muted text-primary">
      <Icon className="h-4 w-4" />
    </span>
    <span className="min-w-0 flex-1 text-sm leading-snug text-muted-foreground break-words">{label}</span>
    <span className="max-w-[45%] text-right text-sm font-semibold leading-snug break-words">{value}</span>
  </div>
);

export const PropertyFeatures = ({ property }: PropertyFeaturesProps) => {
  const numericItems: { icon: typeof Bed; label: string; value: React.ReactNode; show: boolean }[] = [
    { icon: Bed, label: "Chambres", value: property.chambres, show: !!property.chambres },
    { icon: Sofa, label: "Salons", value: property.salons, show: !!property.salons },
    { icon: Bath, label: "Salles de bain", value: property.salles_bain, show: !!property.salles_bain },
  ];

  const amenityItems: { icon: typeof Bed; label: string; show: boolean }[] = [
    { icon: ChefHat, label: "Cuisine", value: "Équipée", show: property.cuisine },
    { icon: Car, label: "Parking", value: "Disponible", show: property.parking },
    { icon: Trees, label: "Balcon", value: "Oui", show: property.balcon },
    { icon: Waves, label: "Piscine", value: "Oui", show: property.piscine },
    { icon: Wifi, label: "Internet", value: "Oui", show: property.internet },
    { icon: Snowflake, label: "Climatisation", value: "Oui", show: property.climatisation },
    { icon: Armchair, label: "Meublé", value: "Oui", show: property.meuble },
  ];

  const visibleNumbers = numericItems.filter((i) => i.show);
  const visibleAmenities = amenityItems.filter((i) => i.show);
  if (visibleNumbers.length === 0 && visibleAmenities.length === 0) return null;

  return (
    <div className="w-full min-w-0 rounded-lg border border-border/50 bg-card">
      {visibleNumbers.map((it) => (
        <FeatureLine key={it.label} icon={it.icon} label={it.label} value={it.value} />
      ))}
      {visibleAmenities.length > 0 && (
        <div className="flex w-full min-w-0 flex-wrap gap-2 border-t border-border/40 p-3 first:border-t-0">
          {visibleAmenities.map((it) => (
            <span
              key={it.label}
              className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-md bg-muted px-2.5 py-1 text-xs font-medium leading-snug"
            >
              <it.icon className="h-3.5 w-3.5 flex-none text-primary" />
              <span className="min-w-0 break-words">{it.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
