import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Phone, Mail, Upload, ArrowRight, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ProfilEntreprise = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [entrepriseId, setEntrepriseId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    email: "",
    adresse: "",
    signature: "",
  });

  useEffect(() => {
    const fetchEntreprise = async () => {
      if (!user) return;

      const { data: ctx } = await supabase.rpc("get_current_user_context");
      const profile = ctx ? { entreprise_id: ctx.entreprise_id as string | null } : null;

      if (profile?.entreprise_id) {
        setEntrepriseId(profile.entreprise_id);
        const { data: entreprise } = await supabase
          .from("entreprises")
          .select("*")
          .eq("id", profile.entreprise_id)
          .maybeSingle();

        if (entreprise) {
          setFormData({
            nom: entreprise.nom || "",
            telephone: entreprise.telephone || "",
            email: entreprise.email || "",
            adresse: entreprise.adresse || "",
            signature: entreprise.signature || "",
          });
          setLogoUrl(entreprise.logo || null);
        }
      }
      setIsFetching(false);
    };

    fetchEntreprise();
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !entrepriseId) return;

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Fichier invalide",
        description: "Veuillez sélectionner une image.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 2 Mo.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Create unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${entrepriseId}/logo.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from("logos")
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      // Update the entreprise with the logo URL
      const { error: updateError } = await supabase
        .from("entreprises")
        .update({ logo: publicUrl })
        .eq("id", entrepriseId);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast({
        title: "Logo importé!",
        description: "Votre logo a été enregistré avec succès.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'importer le logo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Get the user's entreprise_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("entreprise_id")
      .eq("id", user?.id)
      .maybeSingle();

    if (!profile?.entreprise_id) {
      toast({
        title: "Erreur",
        description: "Impossible de trouver votre entreprise.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from("entreprises")
      .update({
        nom: formData.nom,
        telephone: formData.telephone,
        email: formData.email,
        adresse: formData.adresse,
        signature: formData.signature,
      })
      .eq("id", profile.entreprise_id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Profil enregistré!",
      description: "Votre profil entreprise a été configuré avec succès.",
    });

    setIsLoading(false);
    navigate("/dashboard");
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <Logo size="lg" />
            <h1 className="text-3xl font-bold mt-8 mb-2">Configurez votre entreprise</h1>
            <p className="text-muted-foreground">
              Ces informations apparaîtront sur vos devis et factures
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-10">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-16 h-1 bg-primary rounded-full" />
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-16 h-1 bg-primary rounded-full" />
            <div className="w-3 h-3 rounded-full bg-border" />
          </div>

          {/* Form */}
          <div className="glass-strong rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo de l'entreprise</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-secondary/50 border border-dashed border-border flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Image className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploadingLogo ? "Importation..." : "Importer le logo"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom de l'entreprise</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="nom"
                    type="text"
                    placeholder="Agence Immobilière XYZ"
                    className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="telephone"
                      type="tel"
                      placeholder="+224 XXX XXX XXX"
                      className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email professionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@agence.com"
                      className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  type="text"
                  placeholder="Adresse de l'agence"
                  className="h-12 bg-secondary/50 border-border/50 focus:border-primary"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature">Signature (texte pour documents)</Label>
                <Textarea
                  id="signature"
                  placeholder="Signature ou mention légale..."
                  className="bg-secondary/50 border-border/50 focus:border-primary min-h-[100px]"
                  value={formData.signature}
                  onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate("/dashboard")}
                >
                  Passer cette étape
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      Continuer
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilEntreprise;
