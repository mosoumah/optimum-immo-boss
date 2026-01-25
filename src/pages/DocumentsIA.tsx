import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Plus, FileText, Eye } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { DynamicSidebar } from "@/components/DynamicSidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { useAuth } from "@/hooks/useAuth";
import { DocumentDialog } from "@/components/dialogs/DocumentDialog";
import { ViewDocumentDialog } from "@/components/dialogs/ViewDocumentDialog";

interface Client {
  nom: string;
  email: string | null;
  telephone: string | null;
}

interface Document {
  id: string;
  type: string;
  contenu: string | null;
  date: string;
  clients: Client | null;
}

interface Entreprise {
  id: string;
  nom: string;
  logo: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  signature: string | null;
  couleur_primaire: string | null;
  couleur_secondaire: string | null;
  couleur_accent: string | null;
}

const DocumentsIA = () => {
  const { entrepriseId, isLoading: entrepriseLoading } = useEntreprise();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const fetchDocuments = useCallback(async () => {
    if (!entrepriseId) return;

    const [documentsResult, entrepriseResult] = await Promise.all([
      supabase
        .from("documents")
        .select("*, clients(nom, email, telephone)")
        .eq("entreprise_id", entrepriseId)
        .order("date", { ascending: false }),
      supabase
        .from("entreprises")
        .select("*")
        .eq("id", entrepriseId)
        .single(),
    ]);

    setDocuments(documentsResult.data || []);
    setEntreprise(entrepriseResult.data);
    setIsLoading(false);
  }, [entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      fetchDocuments();
    }
  }, [entrepriseId, fetchDocuments]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setViewDialogOpen(true);
  };

  if (entrepriseLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative">
      <FloatingParticles count={25} />
      <DynamicSidebar onSignOut={handleSignOut} />
      <main className="flex-1 ml-64 mesh-gradient min-h-screen p-8">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8 premium-header rounded-xl p-4"
          >
            <div>
              <h1 className="text-3xl font-bold">Documents IA</h1>
              <p className="text-muted-foreground">Documents générés par l'IA</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end mb-6"
          >
            <Button onClick={() => setDialogOpen(true)} className="premium-button">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau document
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border/50 overflow-hidden premium-card"
          >
            {documents.length > 0 ? (
              <div className="divide-y divide-border/50">
                {documents.map((doc, index) => (
                  <motion.div 
                    key={doc.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors premium-list-item cursor-pointer"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{doc.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {doc.clients?.nom || "Sans client"} • {formatDate(doc.date)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocument(doc);
                      }}
                    >
                      <Eye className="w-5 h-5 text-primary" />
                    </Button>
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun document IA généré</p>
              </div>
            )}
          </motion.div>
        </div>

        {entrepriseId && (
          <DocumentDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            entrepriseId={entrepriseId}
            onSuccess={fetchDocuments}
          />
        )}

        <ViewDocumentDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          document={selectedDocument}
          client={selectedDocument?.clients || null}
          entreprise={entreprise}
        />
      </main>
    </div>
  );
};

export default DocumentsIA;
