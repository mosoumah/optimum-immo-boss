import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  nom: string
  role: 'admin' | 'agent' | 'client'
  entreprise_id: string
  client_id?: string | null
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth header from the calling admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', code: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to verify caller identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify caller's JWT and get their info
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT verification failed:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Token invalide', code: 'invalid_token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerId = claimsData.claims.sub as string

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is an admin
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .maybeSingle()

    if (!callerRole || callerRole.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Vous n'avez pas les droits pour créer des utilisateurs", code: 'forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get caller's entreprise_id
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('entreprise_id')
      .eq('id', callerId)
      .maybeSingle()

    if (!callerProfile?.entreprise_id) {
      return new Response(
        JSON.stringify({ error: 'Entreprise non trouvée', code: 'no_entreprise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: CreateUserRequest = await req.json()
    const { email, password, nom, role, entreprise_id, client_id } = body

    // Validate required fields
    if (!email || !password || !nom || !role || !entreprise_id) {
      return new Response(
        JSON.stringify({ error: 'Champs obligatoires manquants', code: 'missing_fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify caller can only create users in their own entreprise
    if (callerProfile.entreprise_id !== entreprise_id) {
      return new Response(
        JSON.stringify({ error: 'Vous ne pouvez créer des utilisateurs que dans votre entreprise', code: 'wrong_entreprise' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Mot de passe trop court (minimum 6 caractères)', code: 'weak_password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate client_id if role is client
    if (role === 'client' && !client_id) {
      return new Response(
        JSON.stringify({ error: 'Un client doit être associé à un compte client', code: 'missing_client' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Admin ${callerId} creating user: ${email} with role ${role}`)

    // Create the user via admin API (doesn't affect caller's session!)
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        nom,
        entreprise_nom: '', // Empty to prevent trigger from creating new entreprise
      },
    })

    if (createError) {
      console.error('Error creating user:', createError)
      
      // Handle specific errors with French messages
      if (createError.message?.includes('already been registered') || 
          createError.message?.includes('already registered') ||
          createError.message?.includes('User already registered')) {
        return new Response(
          JSON.stringify({ error: 'Cet email est déjà utilisé', code: 'email_exists' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: createError.message || 'Erreur lors de la création', code: 'create_error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = newUserData.user?.id
    if (!newUserId) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur créé mais ID non retourné', code: 'no_user_id' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User created with ID: ${newUserId}`)

    // Wait a bit for the trigger to create the base profile
    await new Promise(resolve => setTimeout(resolve, 500))

    // Update the profile with entreprise_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ entreprise_id, nom })
      .eq('id', newUserId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Profile might not exist yet (trigger race condition), try insert
      const { error: insertProfileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUserId,
          email,
          nom,
          entreprise_id,
        }, { onConflict: 'id' })

      if (insertProfileError) {
        console.error('Error upserting profile:', insertProfileError)
      }
    }

    // Delete any existing role (cleanup from trigger)
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', newUserId)

    // Insert the correct role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUserId, role })

    if (roleError) {
      console.error('Error inserting role:', roleError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'attribution du rôle', code: 'role_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If role is client, create client_account link
    if (role === 'client' && client_id) {
      const { error: clientAccountError } = await supabaseAdmin
        .from('client_accounts')
        .insert({ user_id: newUserId, client_id })

      if (clientAccountError) {
        console.error('Error creating client account:', clientAccountError)
        // Not critical, continue
      }
    }

    console.log(`User ${newUserId} fully configured with role ${role}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUserId,
        message: 'Utilisateur créé avec succès'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Une erreur inattendue est survenue', code: 'unexpected_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
