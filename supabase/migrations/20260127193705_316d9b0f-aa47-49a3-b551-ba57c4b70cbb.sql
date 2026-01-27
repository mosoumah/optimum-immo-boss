-- Create tache_messages table
CREATE TABLE public.tache_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tache_id UUID NOT NULL REFERENCES public.taches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tache_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can access task messages
CREATE OR REPLACE FUNCTION public.can_access_tache_messages(_tache_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tache RECORD;
  _user_role app_role;
BEGIN
  -- Get user role
  SELECT role INTO _user_role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  
  -- Get task info
  SELECT entreprise_id, assigned_to INTO _tache FROM public.taches WHERE id = _tache_id;
  
  IF _tache IS NULL THEN
    RETURN false;
  END IF;
  
  -- Admin can access all messages in their entreprise
  IF _user_role = 'admin' AND _tache.entreprise_id = get_user_entreprise_id(auth.uid()) THEN
    RETURN true;
  END IF;
  
  -- Agent can only access messages for tasks assigned to them
  IF _user_role = 'agent' AND _tache.assigned_to = auth.uid() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- RLS Policies
CREATE POLICY "Users can view messages for their tasks"
ON public.tache_messages
FOR SELECT
USING (can_access_tache_messages(tache_id));

CREATE POLICY "Users can insert messages for their tasks"
ON public.tache_messages
FOR INSERT
WITH CHECK (can_access_tache_messages(tache_id) AND user_id = auth.uid());

-- Trigger function to create notification when message is added
CREATE OR REPLACE FUNCTION public.handle_tache_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tache RECORD;
  _sender_name TEXT;
  _sender_role app_role;
  _notify_user_id UUID;
  _admin_id UUID;
BEGIN
  -- Get task info
  SELECT id, titre, assigned_to, entreprise_id INTO _tache FROM public.taches WHERE id = NEW.tache_id;
  
  -- Get sender info
  SELECT nom INTO _sender_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT role INTO _sender_role FROM public.user_roles WHERE user_id = NEW.user_id;
  
  -- Determine who to notify
  IF _sender_role = 'agent' THEN
    -- Agent sent message, notify an admin of the entreprise
    SELECT p.id INTO _admin_id
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.entreprise_id = _tache.entreprise_id
    AND ur.role = 'admin'
    LIMIT 1;
    
    _notify_user_id := _admin_id;
  ELSE
    -- Admin sent message, notify the assigned agent
    _notify_user_id := _tache.assigned_to;
  END IF;
  
  -- Create notification if we have someone to notify
  IF _notify_user_id IS NOT NULL AND _notify_user_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, titre, message, reference_id)
    VALUES (
      _notify_user_id,
      'message_tache',
      'Nouveau message sur une tâche',
      COALESCE(_sender_name, 'Quelqu''un') || ': ' || LEFT(NEW.message, 50),
      NEW.tache_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_tache_message_created
AFTER INSERT ON public.tache_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_tache_message_notification();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tache_messages;