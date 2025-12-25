-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'agent');

-- Create enum for devis status
CREATE TYPE public.devis_statut AS ENUM ('brouillon', 'envoye', 'accepte', 'refuse');

-- Create enum for facture status
CREATE TYPE public.facture_statut AS ENUM ('paye', 'non_paye');

-- Create enum for task status
CREATE TYPE public.tache_statut AS ENUM ('a_faire', 'fait');

-- Table Entreprises
CREATE TABLE public.entreprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  logo TEXT,
  signature TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Table Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  telephone TEXT,
  email TEXT,
  entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table Devis
CREATE TABLE public.devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  montant DECIMAL(12, 2) NOT NULL DEFAULT 0,
  statut devis_statut NOT NULL DEFAULT 'brouillon',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table Factures
CREATE TABLE public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE NOT NULL,
  devis_id UUID REFERENCES public.devis(id) ON DELETE SET NULL,
  description TEXT,
  montant DECIMAL(12, 2) NOT NULL DEFAULT 0,
  statut facture_statut NOT NULL DEFAULT 'non_paye',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table Revenus
CREATE TABLE public.revenus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID REFERENCES public.factures(id) ON DELETE CASCADE NOT NULL,
  entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE NOT NULL,
  montant DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table Depenses
CREATE TABLE public.depenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  montant DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table Taches
CREATE TABLE public.taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  statut tache_statut NOT NULL DEFAULT 'a_faire',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  contenu TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Security definer function to get user's entreprise_id
CREATE OR REPLACE FUNCTION public.get_user_entreprise_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT entreprise_id FROM public.profiles WHERE id = _user_id
$$;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for entreprises
CREATE POLICY "Users can view their entreprise"
  ON public.entreprises FOR SELECT
  TO authenticated
  USING (id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can update their entreprise"
  ON public.entreprises FOR UPDATE
  TO authenticated
  USING (id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Anyone can insert entreprise"
  ON public.entreprises FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for clients
CREATE POLICY "Users can view their entreprise clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can insert clients for their entreprise"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can update their entreprise clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can delete their entreprise clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

-- RLS Policies for devis
CREATE POLICY "Users can view their entreprise devis"
  ON public.devis FOR SELECT
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can insert devis for their entreprise"
  ON public.devis FOR INSERT
  TO authenticated
  WITH CHECK (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can update their entreprise devis"
  ON public.devis FOR UPDATE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can delete their entreprise devis"
  ON public.devis FOR DELETE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

-- RLS Policies for factures
CREATE POLICY "Users can view their entreprise factures"
  ON public.factures FOR SELECT
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can insert factures for their entreprise"
  ON public.factures FOR INSERT
  TO authenticated
  WITH CHECK (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can update their entreprise factures"
  ON public.factures FOR UPDATE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can delete their entreprise factures"
  ON public.factures FOR DELETE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

-- RLS Policies for revenus
CREATE POLICY "Users can view their entreprise revenus"
  ON public.revenus FOR SELECT
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can insert revenus for their entreprise"
  ON public.revenus FOR INSERT
  TO authenticated
  WITH CHECK (entreprise_id = public.get_user_entreprise_id(auth.uid()));

-- RLS Policies for depenses
CREATE POLICY "Users can view their entreprise depenses"
  ON public.depenses FOR SELECT
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can insert depenses for their entreprise"
  ON public.depenses FOR INSERT
  TO authenticated
  WITH CHECK (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can update their entreprise depenses"
  ON public.depenses FOR UPDATE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can delete their entreprise depenses"
  ON public.depenses FOR DELETE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

-- RLS Policies for taches
CREATE POLICY "Users can view their entreprise taches"
  ON public.taches FOR SELECT
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can insert taches for their entreprise"
  ON public.taches FOR INSERT
  TO authenticated
  WITH CHECK (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can update their entreprise taches"
  ON public.taches FOR UPDATE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can delete their entreprise taches"
  ON public.taches FOR DELETE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

-- RLS Policies for documents
CREATE POLICY "Users can view their entreprise documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can insert documents for their entreprise"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can update their entreprise documents"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

CREATE POLICY "Users can delete their entreprise documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (entreprise_id = public.get_user_entreprise_id(auth.uid()));

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables
CREATE TRIGGER update_entreprises_updated_at BEFORE UPDATE ON public.entreprises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON public.devis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_factures_updated_at BEFORE UPDATE ON public.factures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_depenses_updated_at BEFORE UPDATE ON public.depenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_taches_updated_at BEFORE UPDATE ON public.taches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create revenu when facture is marked as paid
CREATE OR REPLACE FUNCTION public.handle_facture_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'paye' AND (OLD.statut IS NULL OR OLD.statut != 'paye') THEN
    INSERT INTO public.revenus (facture_id, entreprise_id, montant, date)
    VALUES (NEW.id, NEW.entreprise_id, NEW.montant, CURRENT_DATE);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_facture_paid
  AFTER UPDATE ON public.factures
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_facture_paid();