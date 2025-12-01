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
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          type?: string | null
        }
        Relationships: []
      }
      guidelines: {
        Row: {
          content: string
          created_by: string | null
          date_uploaded: string
          day: number | null
          day_of_week: string | null
          id: string
          is_auto_generated: boolean | null
          is_current_week: boolean | null
          month: string | null
          steps: Json | null
          title: string
          week_number: number
        }
        Insert: {
          content: string
          created_by?: string | null
          date_uploaded?: string
          day?: number | null
          day_of_week?: string | null
          id?: string
          is_auto_generated?: boolean | null
          is_current_week?: boolean | null
          month?: string | null
          steps?: Json | null
          title: string
          week_number: number
        }
        Update: {
          content?: string
          created_by?: string | null
          date_uploaded?: string
          day?: number | null
          day_of_week?: string | null
          id?: string
          is_auto_generated?: boolean | null
          is_current_week?: boolean | null
          month?: string | null
          steps?: Json | null
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
          {
            foreignKeyName: "guidelines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profile_info"
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
          is_shareable: boolean | null
          is_shared: boolean
          shareable_id: string | null
          shared_at: string | null
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
          is_shareable?: boolean | null
          is_shared?: boolean
          shareable_id?: string | null
          shared_at?: string | null
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
          is_shareable?: boolean | null
          is_shared?: boolean
          shareable_id?: string | null
          shared_at?: string | null
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
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile_info"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile_info"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_library: {
        Row: {
          audio_url: string | null
          audio_urls: Json | null
          category: string | null
          chapter: number | null
          content: string
          created_at: string
          created_by: string | null
          cycle_number: number | null
          day: number | null
          day_number: number | null
          day_of_week: string | null
          end_verse: number | null
          id: string
          intercession_number: number | null
          is_placeholder: boolean | null
          is_used: boolean | null
          month: string | null
          read_count: number | null
          reference_text: string | null
          start_verse: number | null
          title: string
          week_number: number | null
          year: number | null
        }
        Insert: {
          audio_url?: string | null
          audio_urls?: Json | null
          category?: string | null
          chapter?: number | null
          content: string
          created_at?: string
          created_by?: string | null
          cycle_number?: number | null
          day?: number | null
          day_number?: number | null
          day_of_week?: string | null
          end_verse?: number | null
          id?: string
          intercession_number?: number | null
          is_placeholder?: boolean | null
          is_used?: boolean | null
          month?: string | null
          read_count?: number | null
          reference_text?: string | null
          start_verse?: number | null
          title: string
          week_number?: number | null
          year?: number | null
        }
        Update: {
          audio_url?: string | null
          audio_urls?: Json | null
          category?: string | null
          chapter?: number | null
          content?: string
          created_at?: string
          created_by?: string | null
          cycle_number?: number | null
          day?: number | null
          day_number?: number | null
          day_of_week?: string | null
          end_verse?: number | null
          id?: string
          intercession_number?: number | null
          is_placeholder?: boolean | null
          is_used?: boolean | null
          month?: string | null
          read_count?: number | null
          reference_text?: string | null
          start_verse?: number | null
          title?: string
          week_number?: number | null
          year?: number | null
        }
        Relationships: []
      }
      prayer_reminders: {
        Row: {
          created_at: string
          custom_message: string | null
          days_of_week: number[] | null
          enabled: boolean
          id: string
          last_reminded_at: string | null
          notification_methods: string[]
          reminder_times: string[]
          reminder_type: string
          snooze_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_message?: string | null
          days_of_week?: number[] | null
          enabled?: boolean
          id?: string
          last_reminded_at?: string | null
          notification_methods?: string[]
          reminder_times?: string[]
          reminder_type?: string
          snooze_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_message?: string | null
          days_of_week?: number[] | null
          enabled?: boolean
          id?: string
          last_reminded_at?: string | null
          notification_methods?: string[]
          reminder_times?: string[]
          reminder_type?: string
          snooze_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profile_info"
            referencedColumns: ["id"]
          },
        ]
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
          two_factor_enabled: boolean | null
          voice_preference: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          last_journal_date?: string | null
          name: string
          reminders_enabled?: boolean
          streak_count?: number
          two_factor_enabled?: boolean | null
          voice_preference?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_journal_date?: string | null
          name?: string
          reminders_enabled?: boolean
          streak_count?: number
          two_factor_enabled?: boolean | null
          voice_preference?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh_key: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh_key: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh_key?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile_info"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonies: {
        Row: {
          admin_note: string | null
          alias: string
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          audio_duration: number | null
          audio_note: string | null
          consent_given: boolean | null
          content: string
          created_at: string
          date: string
          gratitude_count: number | null
          id: string
          is_shareable: boolean | null
          journal_entry_id: string | null
          location: string | null
          rejected: boolean | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          related_series: string | null
          resubmitted_at: string | null
          shareable_id: string | null
          shared_at: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          alias?: string
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          audio_duration?: number | null
          audio_note?: string | null
          consent_given?: boolean | null
          content: string
          created_at?: string
          date?: string
          gratitude_count?: number | null
          id?: string
          is_shareable?: boolean | null
          journal_entry_id?: string | null
          location?: string | null
          rejected?: boolean | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          related_series?: string | null
          resubmitted_at?: string | null
          shareable_id?: string | null
          shared_at?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          alias?: string
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          audio_duration?: number | null
          audio_note?: string | null
          consent_given?: boolean | null
          content?: string
          created_at?: string
          date?: string
          gratitude_count?: number | null
          id?: string
          is_shareable?: boolean | null
          journal_entry_id?: string | null
          location?: string | null
          rejected?: boolean | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          related_series?: string | null
          resubmitted_at?: string | null
          shareable_id?: string | null
          shared_at?: string | null
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
          {
            foreignKeyName: "testimonies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile_info"
            referencedColumns: ["id"]
          },
        ]
      }
      testimony_gratitudes: {
        Row: {
          created_at: string
          id: string
          testimony_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          testimony_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          testimony_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimony_gratitudes_testimony_id_fkey"
            columns: ["testimony_id"]
            isOneToOne: false
            referencedRelation: "testimonies"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string
          expires_at: string
          id: string
          ip_address: string | null
          last_used_at: string
          trust_token: string
          user_agent: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_used_at?: string
          trust_token: string
          user_agent: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_used_at?: string
          trust_token?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: []
      }
      user_2fa: {
        Row: {
          created_at: string | null
          id: string
          is_verified: boolean | null
          otp_code: string
          otp_expires_at: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          otp_code: string
          otp_expires_at: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          otp_code?: string
          otp_expires_at?: string
          user_id?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile_info"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profile_info: {
        Row: {
          id: string | null
          name: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      clean_expired_devices: { Args: never; Returns: undefined }
      clean_expired_otps: { Args: never; Returns: undefined }
      generate_daily_guideline: { Args: never; Returns: undefined }
      get_testimony_counts: {
        Args: never
        Returns: {
          approved_count: number
          pending_count: number
          rejected_count: number
        }[]
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
