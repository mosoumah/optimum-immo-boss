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
        ]
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
        ]
      }
      revenus: {
        Row: {
          created_at: string
          date: string
          entreprise_id: string
          facture_id: string
          id: string
          montant: number
        }
        Insert: {
          created_at?: string
          date?: string
          entreprise_id: string
          facture_id: string
          id?: string
          montant: number
        }
        Update: {
          created_at?: string
          date?: string
          entreprise_id?: string
          facture_id?: string
          id?: string
          montant?: number
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
            foreignKeyName: "revenus_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
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
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      get_user_entreprise_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
      app_role: ["admin", "agent", "client"],
      devis_statut: ["brouillon", "envoye", "accepte", "refuse"],
      facture_statut: ["paye", "non_paye"],
      tache_statut: ["a_faire", "fait"],
    },
  },
} as const
