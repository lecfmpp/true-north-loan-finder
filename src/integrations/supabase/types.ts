export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          page_path: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          page_path?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          author_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          reading_time: number | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author?: string
          author_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          reading_time?: number | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author?: string
          author_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          reading_time?: number | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_briefs: {
        Row: {
          competitors: Json | null
          content_gaps: string[]
          created_at: string
          created_by: string | null
          h2_headings: string[]
          id: string
          key_angles: string[]
          keyword: string
          status: string
          suggested_h1: string
          target_audience: string
          updated_at: string
          user_intent: string
          word_count: number
        }
        Insert: {
          competitors?: Json | null
          content_gaps: string[]
          created_at?: string
          created_by?: string | null
          h2_headings: string[]
          id?: string
          key_angles: string[]
          keyword: string
          status?: string
          suggested_h1: string
          target_audience: string
          updated_at?: string
          user_intent: string
          word_count: number
        }
        Update: {
          competitors?: Json | null
          content_gaps?: string[]
          created_at?: string
          created_by?: string | null
          h2_headings?: string[]
          id?: string
          key_angles?: string[]
          keyword?: string
          status?: string
          suggested_h1?: string
          target_audience?: string
          updated_at?: string
          user_intent?: string
          word_count?: number
        }
        Relationships: []
      }
      email_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          enrolled_at: string
          enrollment_data: Json | null
          id: string
          sequence_id: string
          status: string
          updated_at: string
          user_email: string
          user_name: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          enrollment_data?: Json | null
          id?: string
          sequence_id: string
          status?: string
          updated_at?: string
          user_email: string
          user_name?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          enrollment_data?: Json | null
          id?: string
          sequence_id?: string
          status?: string
          updated_at?: string
          user_email?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          enrollment_id: string
          error_message: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          resend_email_id: string | null
          sent_at: string
          status: string
          subject_line: string
          template_id: string
          updated_at: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          enrollment_id: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          resend_email_id?: string | null
          sent_at?: string
          status?: string
          subject_line: string
          template_id: string
          updated_at?: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          enrollment_id?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          resend_email_id?: string | null
          sent_at?: string
          status?: string
          subject_line?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "email_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sequence_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sequence_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sequence_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          delay_hours: number
          email_content: string
          email_order: number
          id: string
          is_active: boolean
          purpose: string
          sequence_id: string
          subject_line: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delay_hours?: number
          email_content: string
          email_order: number
          id?: string
          is_active?: boolean
          purpose: string
          sequence_id: string
          subject_line: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delay_hours?: number
          email_content?: string
          email_order?: number
          id?: string
          is_active?: boolean
          purpose?: string
          sequence_id?: string
          subject_line?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          created_at: string
          credit_score: string
          email: string
          id: string
          loan_amount: number
          monthly_revenue: number
          name: string
          phone: string
          score: number
          status: string | null
          time_in_business: string
          updated_at: string
          use_of_funds: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          credit_score: string
          email: string
          id?: string
          loan_amount: number
          monthly_revenue: number
          name: string
          phone: string
          score: number
          status?: string | null
          time_in_business: string
          updated_at?: string
          use_of_funds: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          credit_score?: string
          email?: string
          id?: string
          loan_amount?: number
          monthly_revenue?: number
          name?: string
          phone?: string
          score?: number
          status?: string | null
          time_in_business?: string
          updated_at?: string
          use_of_funds?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
