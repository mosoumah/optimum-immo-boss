-- Add new columns to devis table
ALTER TABLE public.devis 
ADD COLUMN IF NOT EXISTS numero_devis TEXT,
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Create a function to auto-generate numero_devis
CREATE OR REPLACE FUNCTION public.generate_numero_devis()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_devis FROM 'DEV-' || year_suffix || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.devis
  WHERE entreprise_id = NEW.entreprise_id
    AND numero_devis LIKE 'DEV-' || year_suffix || '-%';
  
  NEW.numero_devis := 'DEV-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate numero_devis on insert
DROP TRIGGER IF EXISTS trigger_generate_numero_devis ON public.devis;
CREATE TRIGGER trigger_generate_numero_devis
BEFORE INSERT ON public.devis
FOR EACH ROW
WHEN (NEW.numero_devis IS NULL)
EXECUTE FUNCTION public.generate_numero_devis();