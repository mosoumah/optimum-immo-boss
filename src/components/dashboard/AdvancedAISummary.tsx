import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Props {
  entrepriseId: string;
}

export const AdvancedAISummary = ({ entrepriseId }: Props) => {
  const { data: summary, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard-ai-summary", entrepriseId],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Non authentifié");

      const { data, error } = await supabase.functions.invoke("dashboard-ai-summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) {
        // Handle rate limit gracefully
        if (typeof data === "object" && data?.error?.includes?.("Rate limit")) {
          const minutes = Math.ceil((data.retry_after || 3600) / 60);
          return `⏳ Le résumé IA a déjà été généré récemment. Prochain rafraîchissement disponible dans ~${minutes} min.`;
        }
        throw error;
      }
      return data?.summary as string || "Résumé indisponible.";
    },
    enabled: !!entrepriseId,
    staleTime: 60 * 60 * 1000, // 1h
    retry: (failureCount, error) => {
      // Don't retry on rate limit
      if (error?.message?.includes?.("429") || error?.message?.includes?.("Rate limit")) return false;
      return failureCount < 1;
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="p-3 lg:p-4 rounded-2xl card-premium h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title-premium flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          Résumé IA du mois
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="h-8 w-8 hover:bg-primary/10 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
        </Button>
      </div>
      {isLoading || isRefetching ? (
        <div className="flex items-center gap-3 py-4">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Génération du résumé...</span>
        </div>
      ) : (
        <div className="relative flex-1 min-h-0">
          <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar]:transition-all [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/15 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:transition-all hover:[&::-webkit-scrollbar]:w-[6px] hover:[&::-webkit-scrollbar-thumb]:bg-primary/30">
            <p className="text-xs text-foreground/90 leading-relaxed pb-6">{summary}</p>
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent rounded-b-2xl" />
        </div>
      )}
    </motion.div>
  );
};
