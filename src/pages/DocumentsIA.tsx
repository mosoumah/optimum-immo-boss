import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Plus, ArrowLeft, FileText, Eye, Pencil, Trash2, Upload } from "lucide-react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEntreprise } from "@/hooks/useEntreprise";
import { DocumentDialog } from "@/components/dialogs/DocumentDialog";
import { ViewDocumentDialog } from "@/components/dialogs/ViewDocumentDialog";
import { EditDocumentDialog } from "@/components/dialogs/EditDocumentDialog";
import { UploadDocumentDialog } from "@/components/dialogs/UploadDocumentDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

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

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (doc: Document) => {
    setSelectedDocument(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;
    const { error } = await supabase.from("documents").delete().eq("id", selectedDocument.id);
    setDeleteDialogOpen(false);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    toast.success("Document supprimé");
    fetchDocuments();
  };

  if (entrepriseLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8 relative mesh-gradient">
      <FloatingParticles count={25} />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8 premium-header rounded-xl p-4"
        >
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">nos documents </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mb-6"
        >
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importer un document
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="premium-button">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau document
            </Button>
          </div>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDocument(doc);
                    }}
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(doc);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun document généré</p>
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

      <EditDocumentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        document={selectedDocument}
        onSuccess={fetchDocuments}
      />

      {entrepriseId && (
        <UploadDocumentDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          entrepriseId={entrepriseId}
          onSuccess={fetchDocuments}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le document "{selectedDocument?.type}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentsIA;
