export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agency_settings: {
        Row: {
          created_at: string
          entreprise_id: string
          id: string
          location_enabled: boolean
          updated_at: string
          vente_enabled: boolean
        }
        Insert: {
          created_at?: string
          entreprise_id: string
          id?: string
          location_enabled?: boolean
          updated_at?: string
          vente_enabled?: boolean
        }
        Update: {
          created_at?: string
          entreprise_id?: string
          id?: string
          location_enabled?: boolean
          updated_at?: string
          vente_enabled?: boolean
        }
        Relationships: []
      }
      ai_generated_images: {
        Row: {
          bien_description: string
          created_at: string
          created_by: string
          entreprise_id: string
          format: string
          id: string
          image_url: string
          include_logo: boolean
          include_phone: boolean
          mention: string
          prix: string | null
          prompt_used: string
        }
        Insert: {
          bien_description: string
          created_at?: string
          created_by: string
          entreprise_id: string
          format?: string
          id?: string
          image_url: string
          include_logo?: boolean
          include_phone?: boolean
          mention?: string
          prix?: string | null
          prompt_used: string
        }
        Update: {
          bien_description?: string
          created_at?: string
          created_by?: string
          entreprise_id?: string
          format?: string
          id?: string
          image_url?: string
          include_logo?: boolean
          include_phone?: boolean
          mention?: string
          prix?: string | null
          prompt_used?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_images_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generated_images_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "ai_generated_images_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "ai_generated_images_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      client_accounts: {
        Row: {
          client_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string | null
          entreprise_id: string
          id: string
          nom: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          entreprise_id: string
          id?: string
          nom: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          entreprise_id?: string
          id?: string
          nom?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "clients_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "clients_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      depenses: {
        Row: {
          created_at: string
          date: string
          description: string
          entreprise_id: string
          id: string
          montant: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          description: string
          entreprise_id: string
          id?: string
          montant: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          entreprise_id?: string
          id?: string
          montant?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "depenses_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depenses_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "depenses_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "depenses_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      devis: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          entreprise_id: string
          id: string
          montant: number
          numero_devis: string | null
          pdf_url: string | null
          statut: Database["public"]["Enums"]["devis_statut"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          entreprise_id: string
          id?: string
          montant?: number
          numero_devis?: string | null
          pdf_url?: string | null
          statut?: Database["public"]["Enums"]["devis_statut"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          entreprise_id?: string
          id?: string
          montant?: number
          numero_devis?: string | null
          pdf_url?: string | null
          statut?: Database["public"]["Enums"]["devis_statut"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "devis_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "devis_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          created_at: string | null
          entreprise_id: string
          id: string
          message: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          entreprise_id: string
          id?: string
          message: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          entreprise_id?: string
          id?: string
          message?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "direct_messages_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "direct_messages_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string | null
          contenu: string | null
          created_at: string
          date: string
          entreprise_id: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          contenu?: string | null
          created_at?: string
          date?: string
          entreprise_id: string
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          contenu?: string | null
          created_at?: string
          date?: string
          entreprise_id?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "documents_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "documents_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      entreprises: {
        Row: {
          adresse: string | null
          couleur_accent: string | null
          couleur_primaire: string | null
          couleur_secondaire: string | null
          created_at: string
          email: string | null
          id: string
          logo: string | null
          nom: string
          signature: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          couleur_accent?: string | null
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          nom: string
          signature?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          couleur_accent?: string | null
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          nom?: string
          signature?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      factures: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          devis_id: string | null
          entreprise_id: string
          id: string
          montant: number
          statut: Database["public"]["Enums"]["facture_statut"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          devis_id?: string | null
          entreprise_id: string
          id?: string
          montant?: number
          statut?: Database["public"]["Enums"]["facture_statut"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          devis_id?: string | null
          entreprise_id?: string
          id?: string
          montant?: number
          statut?: Database["public"]["Enums"]["facture_statut"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "factures_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "factures_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lue: boolean
          message: string | null
          reference_id: string | null
          titre: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lue?: boolean
          message?: string | null
          reference_id?: string | null
          titre: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lue?: boolean
          message?: string | null
          reference_id?: string | null
          titre?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          entreprise_id: string | null
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          entreprise_id?: string | null
          id: string
          nom: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          entreprise_id?: string | null
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "profiles_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "profiles_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      properties: {
        Row: {
          adresse: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entreprise_id: string
          id: string
          images: string[] | null
          nom: string
          nombre_pieces: number | null
          prix: number
          statut: string
          surface: number | null
          type_bien: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entreprise_id: string
          id?: string
          images?: string[] | null
          nom: string
          nombre_pieces?: number | null
          prix?: number
          statut?: string
          surface?: number | null
          type_bien?: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entreprise_id?: string
          id?: string
          images?: string[] | null
          nom?: string
          nombre_pieces?: number | null
          prix?: number
          statut?: string
          surface?: number | null
          type_bien?: string
          updated_at?: string
        }
        Relationships: []
      }
      redesign_requests: {
        Row: {
          created_at: string
          created_by: string
          entreprise_id: string
          id: string
          instruction: string
          original_image_url: string
          result_image_url: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by: string
          entreprise_id: string
          id?: string
          instruction: string
          original_image_url: string
          result_image_url?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          entreprise_id?: string
          id?: string
          instruction?: string
          original_image_url?: string
          result_image_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "redesign_requests_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redesign_requests_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "redesign_requests_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "redesign_requests_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      reservations: {
        Row: {
          caution: number
          client_id: string
          created_at: string
          date_arrivee: string
          date_depart: string
          entreprise_id: string
          generer_facture: boolean
          id: string
          montant_paye: number
          montant_total: number
          notes: string | null
          prix_unitaire: number
          property_id: string | null
          property_name: string
          statut: string
          type_location: string
          updated_at: string
        }
        Insert: {
          caution?: number
          client_id: string
          created_at?: string
          date_arrivee: string
          date_depart: string
          entreprise_id: string
          generer_facture?: boolean
          id?: string
          montant_paye?: number
          montant_total?: number
          notes?: string | null
          prix_unitaire?: number
          property_id?: string | null
          property_name: string
          statut?: string
          type_location: string
          updated_at?: string
        }
        Update: {
          caution?: number
          client_id?: string
          created_at?: string
          date_arrivee?: string
          date_depart?: string
          entreprise_id?: string
          generer_facture?: boolean
          id?: string
          montant_paye?: number
          montant_total?: number
          notes?: string | null
          prix_unitaire?: number
          property_id?: string | null
          property_name?: string
          statut?: string
          type_location?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenus: {
        Row: {
          created_at: string
          date: string
          entreprise_id: string
          facture_id: string | null
          id: string
          montant: number
          source: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          entreprise_id: string
          facture_id?: string | null
          id?: string
          montant: number
          source?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          entreprise_id?: string
          facture_id?: string | null
          id?: string
          montant?: number
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenus_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenus_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "revenus_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "revenus_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "revenus_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      sales_transactions: {
        Row: {
          client_id: string
          commission: number
          created_at: string
          created_by: string | null
          date_vente: string
          entreprise_id: string
          id: string
          montant_vente: number
          notes: string | null
          property_id: string
          statut: string
          updated_at: string
        }
        Insert: {
          client_id: string
          commission?: number
          created_at?: string
          created_by?: string | null
          date_vente?: string
          entreprise_id: string
          id?: string
          montant_vente?: number
          notes?: string | null
          property_id: string
          statut?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          commission?: number
          created_at?: string
          created_by?: string | null
          date_vente?: string
          entreprise_id?: string
          id?: string
          montant_vente?: number
          notes?: string | null
          property_id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      studio_ia_quotas: {
        Row: {
          entreprise_id: string
          generations_used: number
          id: string
          month_year: string
          plan: string
          updated_at: string
        }
        Insert: {
          entreprise_id: string
          generations_used?: number
          id?: string
          month_year?: string
          plan?: string
          updated_at?: string
        }
        Update: {
          entreprise_id?: string
          generations_used?: number
          id?: string
          month_year?: string
          plan?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_ia_quotas_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_ia_quotas_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "studio_ia_quotas_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "studio_ia_quotas_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          end_date: string | null
          entreprise_id: string
          id: string
          payment_reference: string | null
          plan: string
          start_date: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          entreprise_id: string
          id?: string
          payment_reference?: string | null
          plan?: string
          start_date?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          entreprise_id?: string
          id?: string
          payment_reference?: string | null
          plan?: string
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "subscriptions_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "subscriptions_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: true
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      tache_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          tache_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          tache_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          tache_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tache_messages_tache_id_fkey"
            columns: ["tache_id"]
            isOneToOne: false
            referencedRelation: "taches"
            referencedColumns: ["id"]
          },
        ]
      }
      taches: {
        Row: {
          assigned_to: string | null
          created_at: string
          date: string
          description: string | null
          entreprise_id: string
          id: string
          is_ai_generated: boolean | null
          statut: Database["public"]["Enums"]["tache_statut"]
          titre: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          date?: string
          description?: string | null
          entreprise_id: string
          id?: string
          is_ai_generated?: boolean | null
          statut?: Database["public"]["Enums"]["tache_statut"]
          titre: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          date?: string
          description?: string | null
          entreprise_id?: string
          id?: string
          is_ai_generated?: boolean | null
          statut?: Database["public"]["Enums"]["tache_statut"]
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taches_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_finance"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "taches_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_advanced_property"
            referencedColumns: ["entreprise_id"]
          },
          {
            foreignKeyName: "taches_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_simple"
            referencedColumns: ["entreprise_id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_dashboard_advanced_finance: {
        Row: {
          benefice_net: number | null
          depenses_totales: number | null
          entreprise_id: string | null
          loyers_en_retard: number | null
          revenus_court_sejour: number | null
          revenus_mensuel: number | null
          revenus_vente: number | null
        }
        Relationships: []
      }
      v_dashboard_advanced_property: {
        Row: {
          biens_disponibles: number | null
          biens_occupes: number | null
          biens_total: number | null
          entreprise_id: string | null
          reservations_en_cours: number | null
          taux_occupation: number | null
        }
        Relationships: []
      }
      v_dashboard_alerts: {
        Row: {
          alert_type: string | null
          detail: string | null
          entreprise_id: string | null
          id: string | null
          label: string | null
        }
        Relationships: []
      }
      v_dashboard_simple: {
        Row: {
          arrivees_aujourdhui: number | null
          benefice_estime: number | null
          departs_aujourdhui: number | null
          depenses_mois: number | null
          entreprise_id: string | null
          factures_impayees: number | null
          paiements_attendus: number | null
          revenus_mois: number | null
          sejours_en_cours: number | null
          taches_urgentes: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_create_user_in_entreprise: {
        Args: {
          _client_id?: string
          _entreprise_id: string
          _new_user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      auto_complete_reservations: {
        Args: { _entreprise_id: string }
        Returns: undefined
      }
      bootstrap_current_user: { Args: never; Returns: Json }
      can_access_tache_messages: {
        Args: { _tache_id: string }
        Returns: boolean
      }
      create_user_with_role: {
        Args: {
          _client_id?: string
          _entreprise_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      get_top_properties: {
        Args: { _entreprise_id: string }
        Returns: {
          property_name: string
          total_revenue: number
        }[]
      }
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      get_user_entreprise_id: { Args: { _user_id: string }; Returns: string }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_permission"][]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "creer_client"
        | "voir_client"
        | "modifier_client"
        | "supprimer_client"
        | "creer_devis"
        | "voir_devis"
        | "modifier_devis"
        | "supprimer_devis"
        | "envoyer_devis"
        | "creer_facture"
        | "voir_facture"
        | "modifier_facture"
        | "supprimer_facture"
        | "generer_pdf_facture"
        | "voir_revenus"
        | "ajouter_revenu"
        | "voir_depenses"
        | "ajouter_depense"
        | "creer_document_ia"
        | "voir_document_ia"
        | "telecharger_document_ia"
        | "creer_tache"
        | "assigner_tache"
        | "voir_tache"
        | "modifier_tache"
        | "cloturer_tache"
        | "voir_statistiques_globales"
        | "voir_statistiques_personnelles"
        | "gerer_utilisateurs"
        | "gerer_parametres"
        | "creer_bien"
        | "voir_bien"
        | "modifier_bien"
        | "supprimer_bien"
        | "creer_reservation"
        | "voir_reservation"
        | "modifier_reservation"
        | "supprimer_reservation"
        | "generer_image_ia"
        | "voir_image_ia"
        | "redesigner_bien_ia"
        | "envoyer_message"
      app_role: "admin" | "agent" | "client"
      devis_statut: "brouillon" | "envoye" | "accepte" | "refuse"
      facture_statut: "paye" | "non_paye"
      tache_statut: "a_faire" | "fait"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_permission: [
        "creer_client",
        "voir_client",
        "modifier_client",
        "supprimer_client",
        "creer_devis",
        "voir_devis",
        "modifier_devis",
        "supprimer_devis",
        "envoyer_devis",
        "creer_facture",
        "voir_facture",
        "modifier_facture",
        "supprimer_facture",
        "generer_pdf_facture",
        "voir_revenus",
        "ajouter_revenu",
        "voir_depenses",
        "ajouter_depense",
        "creer_document_ia",
        "voir_document_ia",
        "telecharger_document_ia",
        "creer_tache",
        "assigner_tache",
        "voir_tache",
        "modifier_tache",
        "cloturer_tache",
        "voir_statistiques_globales",
        "voir_statistiques_personnelles",
        "gerer_utilisateurs",
        "gerer_parametres",
        "creer_bien",
        "voir_bien",
        "modifier_bien",
        "supprimer_bien",
        "creer_reservation",
        "voir_reservation",
        "modifier_reservation",
        "supprimer_reservation",
        "generer_image_ia",
        "voir_image_ia",
        "redesigner_bien_ia",
        "envoyer_message",
      ],
      app_role: ["admin", "agent", "client"],
      devis_statut: ["brouillon", "envoye", "accepte", "refuse"],
      facture_statut: ["paye", "non_paye"],
      tache_statut: ["a_faire", "fait"],
    },
  },
} as const
