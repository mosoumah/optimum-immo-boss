import { getCorsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2'

interface DeleteUserRequest {
  user_id: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) })
  }

  try {
    // Get auth header from the calling admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé', code: 'unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to verify caller identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify caller's JWT and get their info
    const { data: { user: callerUser }, error: authError } = await supabaseUser.auth.getUser()
    
    if (authError || !callerUser) {
      console.error('JWT verification failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Token invalide', code: 'invalid_token' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const callerId = callerUser.id

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
        JSON.stringify({ error: "Vous n'avez pas les droits pour supprimer des utilisateurs", code: 'forbidden' }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
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
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: DeleteUserRequest = await req.json()
    const { user_id } = body

    // Validate required fields
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'ID utilisateur manquant', code: 'missing_user_id' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Prevent self-deletion
    if (user_id === callerId) {
      return new Response(
        JSON.stringify({ error: 'Vous ne pouvez pas vous supprimer vous-même', code: 'cannot_delete_self' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Get target user's profile to verify entreprise
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('entreprise_id, nom, email')
      .eq('id', user_id)
      .maybeSingle()

    if (!targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé', code: 'user_not_found' }),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Verify target user is in same entreprise
    if (targetProfile.entreprise_id !== callerProfile.entreprise_id) {
      return new Response(
        JSON.stringify({ error: 'Vous ne pouvez supprimer que les utilisateurs de votre entreprise', code: 'wrong_entreprise' }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Admin ${callerId} deleting user: ${user_id}`)

    // Delete the user from auth (cascades will clean up profiles, roles, etc.)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: deleteError.message || 'Erreur lors de la suppression', code: 'delete_error' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User ${user_id} successfully deleted`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Utilisateur supprimé avec succès'
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
