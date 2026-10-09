-- Add color columns to entreprises table for storing extracted brand colors from logo
ALTER TABLE public.entreprises 
ADD COLUMN IF NOT EXISTS couleur_primaire TEXT DEFAULT '#E97451',
ADD COLUMN IF NOT EXISTS couleur_secondaire TEXT DEFAULT '#FFF5F2',
ADD COLUMN IF NOT EXISTS couleur_accent TEXT DEFAULT '#1a1a2e';