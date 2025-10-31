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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_prayers: {
        Row: {
          completed_at: string
          created_at: string
          day_of_week: string
          guideline_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          day_of_week: string
          guideline_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          day_of_week?: string
          guideline_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_prayers_guideline_id_fkey"
            columns: ["guideline_id"]
            isOneToOne: false
            referencedRelation: "guidelines"
            referencedColumns: ["id"]
          },
        ]
      }
      encouragement_messages: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: []
      }
      guidelines: {
        Row: {
          content: string
          created_by: string | null
          date_uploaded: string
          id: string
          title: string
          week_number: number
        }
        Insert: {
          content: string
          created_by?: string | null
          date_uploaded?: string
          id?: string
          title: string
          week_number: number
        }
        Update: {
          content?: string
          created_by?: string | null
          date_uploaded?: string
          id?: string
          title?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "guidelines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          date: string
          id: string
          is_answered: boolean
          is_shared: boolean
          testimony_text: string | null
          title: string
          updated_at: string
          user_id: string
          voice_note_url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          date?: string
          id?: string
          is_answered?: boolean
          is_shared?: boolean
          testimony_text?: string | null
          title: string
          updated_at?: string
          user_id: string
          voice_note_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          is_answered?: boolean
          is_shared?: boolean
          testimony_text?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_library: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          day_of_week: string | null
          id: string
          is_used: boolean | null
          title: string
          week_number: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          day_of_week?: string | null
          id?: string
          is_used?: boolean | null
          title: string
          week_number?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          day_of_week?: string | null
          id?: string
          is_used?: boolean | null
          title?: string
          week_number?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          last_journal_date: string | null
          name: string
          reminders_enabled: boolean
          streak_count: number
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          last_journal_date?: string | null
          name: string
          reminders_enabled?: boolean
          streak_count?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_journal_date?: string | null
          name?: string
          reminders_enabled?: boolean
          streak_count?: number
        }
        Relationships: []
      }
      testimonies: {
        Row: {
          admin_note: string | null
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          audio_duration: number | null
          audio_note: string | null
          consent_given: boolean | null
          content: string
          created_at: string
          date: string
          id: string
          journal_entry_id: string | null
          rejected: boolean | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          resubmitted_at: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          audio_duration?: number | null
          audio_note?: string | null
          consent_given?: boolean | null
          content: string
          created_at?: string
          date?: string
          id?: string
          journal_entry_id?: string | null
          rejected?: boolean | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          resubmitted_at?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          audio_duration?: number | null
          audio_note?: string | null
          consent_given?: boolean | null
          content?: string
          created_at?: string
          date?: string
          id?: string
          journal_entry_id?: string | null
          rejected?: boolean | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          resubmitted_at?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonies_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
