import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PropertyMediaRow = Database["public"]["Tables"]["property_media"]["Row"];

export interface PropertyMediaItem extends PropertyMediaRow {
  signedUrl: string | null;
}

const SIGNED_TTL = 3600; // 1h

export const usePropertyMedia = (propertyId: string | undefined) => {
  const [media, setMedia] = useState<PropertyMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!propertyId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("property_media")
      .select("*")
      .eq("property_id", propertyId)
      .order("media_type", { ascending: true })
      .order("ordre", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !data) {
      setMedia([]);
      setIsLoading(false);
      return;
    }

    const withUrls = await Promise.all(
      data.map(async (m) => {
        const { data: signed } = await supabase.storage
          .from(m.bucket)
          .createSignedUrl(m.storage_path, SIGNED_TTL);
        return { ...m, signedUrl: signed?.signedUrl ?? null };
      })
    );
    setMedia(withUrls);
    setIsLoading(false);
  }, [propertyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { media, isLoading, refresh };
};
