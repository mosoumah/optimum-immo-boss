import { getCorsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2'

interface CreateUserRequest {
  email: string
  nom: string
  password: string
  role: 'admin' | 'agent'
  entreprise_id: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', code: 'unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: callerUser }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Token invalide', code: 'invalid_token' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const callerId = callerUser.id

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .maybeSingle()

    if (!callerRole || callerRole.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Vous n'avez pas les droits pour créer des utilisateurs", code: 'forbidden' }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('entreprise_id')
      .eq('id', callerId)
      .maybeSingle()

    if (!callerProfile?.entreprise_id) {
      return new Response(
        JSON.stringify({ error: 'Entreprise non trouvée', code: 'no_entreprise' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const body: CreateUserRequest = await req.json()
    const { email, nom, password, role, entreprise_id } = body

    if (!email || !nom || !password || !role || !entreprise_id) {
      return new Response(
        JSON.stringify({ error: 'Champs obligatoires manquants', code: 'missing_fields' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email) || email.length > 254) {
      return new Response(
        JSON.stringify({ error: 'Adresse email invalide', code: 'invalid_email' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    if (typeof nom !== 'string' || nom.trim().length < 2 || nom.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Nom invalide (2-100 caractères)', code: 'invalid_nom' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
      return new Response(
        JSON.stringify({ error: 'Mot de passe invalide (8-72 caractères)', code: 'invalid_password' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const ALLOWED_ROLES = new Set(['admin', 'agent'])
    if (!ALLOWED_ROLES.has(role)) {
      return new Response(
        JSON.stringify({ error: 'Rôle invalide', code: 'invalid_role' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    if (callerProfile.entreprise_id !== entreprise_id) {
      return new Response(
        JSON.stringify({ error: 'Vous ne pouvez créer des utilisateurs que dans votre entreprise', code: 'wrong_entreprise' }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Admin ${callerId} creating user: ${email} with role ${role}`)

    // Create user directly with confirmed email and admin-defined password
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nom,
        entreprise_nom: '', // Empty to prevent trigger from creating a new entreprise
      },
    })

    if (createError) {
      console.error('Error creating user:', createError.message)

      if (createError.message?.includes('already been registered') ||
          createError.message?.includes('already registered') ||
          createError.message?.includes('User already registered') ||
          createError.message?.includes('already exists')) {
        return new Response(
          JSON.stringify({ error: 'Cet email est déjà utilisé', code: 'email_exists' }),
          { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: createError.message || 'Erreur lors de la création', code: 'create_error' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = newUserData.user?.id
    if (!newUserId) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur créé mais ID non retourné', code: 'no_user_id' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User created with ID: ${newUserId}`)

    // Wait briefly for the signup trigger to create the base profile
    await new Promise(resolve => setTimeout(resolve, 500))

    // Upsert profile with entreprise_id, nom and email
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        email,
        nom,
        entreprise_id,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Error upserting profile:', profileError)
    }

    // Cleanup any role auto-created by the trigger
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', newUserId)

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUserId, role })

    if (roleError) {
      console.error('Error inserting role:', roleError)
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'attribution du rôle", code: 'role_error' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User ${newUserId} fully configured with role ${role}`)

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        message: 'Utilisateur créé avec succès'
      }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Une erreur inattendue est survenue', code: 'unexpected_error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
