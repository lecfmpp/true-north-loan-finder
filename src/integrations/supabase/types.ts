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
      ad_spend_records: {
        Row: {
          amount: number
          campaign_name: string | null
          channel: string
          clicks: number | null
          conversions: number | null
          created_at: string
          created_by: string | null
          ctr: number | null
          currency: string | null
          date: string
          id: string
          impressions: number | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          campaign_name?: string | null
          channel: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string | null
          ctr?: number | null
          currency?: string | null
          date: string
          id?: string
          impressions?: number | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign_name?: string | null
          channel?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string | null
          ctr?: number | null
          currency?: string | null
          date?: string
          id?: string
          impressions?: number | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_notification_settings: {
        Row: {
          application_notification_email: string
          created_at: string
          id: string
          is_application_notifications_enabled: boolean
          is_quiz_notifications_enabled: boolean
          quiz_notification_email: string
          updated_at: string
        }
        Insert: {
          application_notification_email?: string
          created_at?: string
          id?: string
          is_application_notifications_enabled?: boolean
          is_quiz_notifications_enabled?: boolean
          quiz_notification_email?: string
          updated_at?: string
        }
        Update: {
          application_notification_email?: string
          created_at?: string
          id?: string
          is_application_notifications_enabled?: boolean
          is_quiz_notifications_enabled?: boolean
          quiz_notification_email?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      available_time_slots: {
        Row: {
          created_at: string
          created_by: string | null
          current_bookings: number
          date: string
          duration_minutes: number
          id: string
          is_available: boolean
          max_bookings: number
          time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_bookings?: number
          date: string
          duration_minutes?: number
          id?: string
          is_available?: boolean
          max_bookings?: number
          time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_bookings?: number
          date?: string
          duration_minutes?: number
          id?: string
          is_available?: boolean
          max_bookings?: number
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "available_time_slots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      call_bookings: {
        Row: {
          booking_status: string
          calendar_sync_status: string | null
          created_at: string
          google_calendar_event_id: string | null
          google_meet_link: string | null
          id: string
          meeting_link: string | null
          notes: string | null
          quiz_response_id: string | null
          time_slot_id: string
          updated_at: string
          user_email: string
          user_name: string
          user_phone: string | null
        }
        Insert: {
          booking_status?: string
          calendar_sync_status?: string | null
          created_at?: string
          google_calendar_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          quiz_response_id?: string | null
          time_slot_id: string
          updated_at?: string
          user_email: string
          user_name: string
          user_phone?: string | null
        }
        Update: {
          booking_status?: string
          calendar_sync_status?: string | null
          created_at?: string
          google_calendar_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          quiz_response_id?: string | null
          time_slot_id?: string
          updated_at?: string
          user_email?: string
          user_name?: string
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_bookings_quiz_response_id_fkey"
            columns: ["quiz_response_id"]
            isOneToOne: false
            referencedRelation: "quiz_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_bookings_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "available_time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      canadian_application_drafts: {
        Row: {
          created_at: string
          current_step: number
          form_data: Json
          id: string
          last_updated: string
          quiz_response_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          form_data?: Json
          id?: string
          last_updated?: string
          quiz_response_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: number
          form_data?: Json
          id?: string
          last_updated?: string
          quiz_response_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      canadian_applications: {
        Row: {
          admin_notes: string | null
          amount_requested: number
          annual_credit_card_sales: number | null
          annual_gross_sales: number
          application_reference_number: string | null
          average_monthly_cc_volume: number | null
          business_fax: string | null
          business_phone: string
          business_property_type: string
          business_start_date: string
          cell_phone: string | null
          cell_phone_2: string | null
          city: string
          city_owner: string
          city_owner_2: string | null
          conversion_stage: string | null
          created_at: string
          current_credit_card_processor: string | null
          dba_name: string | null
          dob: string
          dob_2: string | null
          document_files: Json | null
          email_address: string
          email_address_2: string | null
          existing_advance: boolean
          federal_tax_id: string
          home_address: string
          home_address_2: string | null
          home_phone: string | null
          home_phone_2: string | null
          id: string
          if_so_with_who: string | null
          landlord_or_bank_company_name: string | null
          landlord_or_bank_phone: string | null
          lead_source: string | null
          legal_business_name: string
          mailing_address: string | null
          monthly_rent_or_mortgage: number | null
          number_of_locations: number
          outstanding_balance: number | null
          ownership_percentage: number
          ownership_percentage_2: number | null
          physical_address: string
          principal_owner_name: string
          principal_owner_name_2: string | null
          processing_statements: Json | null
          quiz_response_id: string | null
          ssn: string
          ssn_2: string | null
          state: string
          state_owner: string
          state_owner_2: string | null
          status: string
          type_of_entity: string
          updated_at: string
          use_of_funds: string
          user_id: string | null
          zip: string
          zip_owner: string
          zip_owner_2: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_requested: number
          annual_credit_card_sales?: number | null
          annual_gross_sales: number
          application_reference_number?: string | null
          average_monthly_cc_volume?: number | null
          business_fax?: string | null
          business_phone: string
          business_property_type: string
          business_start_date: string
          cell_phone?: string | null
          cell_phone_2?: string | null
          city: string
          city_owner: string
          city_owner_2?: string | null
          conversion_stage?: string | null
          created_at?: string
          current_credit_card_processor?: string | null
          dba_name?: string | null
          dob: string
          dob_2?: string | null
          document_files?: Json | null
          email_address: string
          email_address_2?: string | null
          existing_advance?: boolean
          federal_tax_id: string
          home_address: string
          home_address_2?: string | null
          home_phone?: string | null
          home_phone_2?: string | null
          id?: string
          if_so_with_who?: string | null
          landlord_or_bank_company_name?: string | null
          landlord_or_bank_phone?: string | null
          lead_source?: string | null
          legal_business_name: string
          mailing_address?: string | null
          monthly_rent_or_mortgage?: number | null
          number_of_locations?: number
          outstanding_balance?: number | null
          ownership_percentage: number
          ownership_percentage_2?: number | null
          physical_address: string
          principal_owner_name: string
          principal_owner_name_2?: string | null
          processing_statements?: Json | null
          quiz_response_id?: string | null
          ssn: string
          ssn_2?: string | null
          state: string
          state_owner: string
          state_owner_2?: string | null
          status?: string
          type_of_entity: string
          updated_at?: string
          use_of_funds: string
          user_id?: string | null
          zip: string
          zip_owner: string
          zip_owner_2?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_requested?: number
          annual_credit_card_sales?: number | null
          annual_gross_sales?: number
          application_reference_number?: string | null
          average_monthly_cc_volume?: number | null
          business_fax?: string | null
          business_phone?: string
          business_property_type?: string
          business_start_date?: string
          cell_phone?: string | null
          cell_phone_2?: string | null
          city?: string
          city_owner?: string
          city_owner_2?: string | null
          conversion_stage?: string | null
          created_at?: string
          current_credit_card_processor?: string | null
          dba_name?: string | null
          dob?: string
          dob_2?: string | null
          document_files?: Json | null
          email_address?: string
          email_address_2?: string | null
          existing_advance?: boolean
          federal_tax_id?: string
          home_address?: string
          home_address_2?: string | null
          home_phone?: string | null
          home_phone_2?: string | null
          id?: string
          if_so_with_who?: string | null
          landlord_or_bank_company_name?: string | null
          landlord_or_bank_phone?: string | null
          lead_source?: string | null
          legal_business_name?: string
          mailing_address?: string | null
          monthly_rent_or_mortgage?: number | null
          number_of_locations?: number
          outstanding_balance?: number | null
          ownership_percentage?: number
          ownership_percentage_2?: number | null
          physical_address?: string
          principal_owner_name?: string
          principal_owner_name_2?: string | null
          processing_statements?: Json | null
          quiz_response_id?: string | null
          ssn?: string
          ssn_2?: string | null
          state?: string
          state_owner?: string
          state_owner_2?: string | null
          status?: string
          type_of_entity?: string
          updated_at?: string
          use_of_funds?: string
          user_id?: string | null
          zip?: string
          zip_owner?: string
          zip_owner_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_canadian_applications_quiz_response"
            columns: ["quiz_response_id"]
            isOneToOne: false
            referencedRelation: "quiz_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_canadian_applications_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_widget_config: {
        Row: {
          ai_instructions: string
          created_at: string
          id: string
          is_enabled: boolean
          primary_color: string
          support_person_avatar_url: string | null
          support_person_name: string
          updated_at: string
          widget_position: string
        }
        Insert: {
          ai_instructions?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          primary_color?: string
          support_person_avatar_url?: string | null
          support_person_name?: string
          updated_at?: string
          widget_position?: string
        }
        Update: {
          ai_instructions?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          primary_color?: string
          support_person_avatar_url?: string | null
          support_person_name?: string
          updated_at?: string
          widget_position?: string
        }
        Relationships: []
      }
      chat_widget_qa: {
        Row: {
          answer: string
          created_at: string
          fallback_action: string
          id: string
          is_active: boolean
          order_index: number
          question: string
          related_links: Json | null
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          fallback_action?: string
          id?: string
          is_active?: boolean
          order_index?: number
          question: string
          related_links?: Json | null
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          fallback_action?: string
          id?: string
          is_active?: boolean
          order_index?: number
          question?: string
          related_links?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          admin_notes: string | null
          company_name: string | null
          created_at: string
          email: string
          id: string
          lead_source: string | null
          name: string
          payment_completed_at: string | null
          payment_reminder_sent_at: string | null
          payment_status: string | null
          phone: string | null
          status: string
          stripe_payment_link_id: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          lead_source?: string | null
          name: string
          payment_completed_at?: string | null
          payment_reminder_sent_at?: string | null
          payment_status?: string | null
          phone?: string | null
          status?: string
          stripe_payment_link_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          lead_source?: string | null
          name?: string
          payment_completed_at?: string | null
          payment_reminder_sent_at?: string | null
          payment_status?: string | null
          phone?: string | null
          status?: string
          stripe_payment_link_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
          click_count: number
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          enrollment_id: string
          error_message: string | null
          id: string
          open_count: number
          opened_at: string | null
          recipient_email: string
          replied: boolean
          resend_email_id: string | null
          sent_at: string
          status: string
          subject_line: string
          template_id: string
          updated_at: string
        }
        Insert: {
          click_count?: number
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          enrollment_id: string
          error_message?: string | null
          id?: string
          open_count?: number
          opened_at?: string | null
          recipient_email: string
          replied?: boolean
          resend_email_id?: string | null
          sent_at?: string
          status?: string
          subject_line: string
          template_id: string
          updated_at?: string
        }
        Update: {
          click_count?: number
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          enrollment_id?: string
          error_message?: string | null
          id?: string
          open_count?: number
          opened_at?: string | null
          recipient_email?: string
          replied?: boolean
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
          booking_link: string | null
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
          booking_link?: string | null
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
          booking_link?: string | null
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
      lead_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string
          id: string
          loan_value: number | null
          notes: string | null
          partner_id: string
          partner_notes: string | null
          quiz_response_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string
          id?: string
          loan_value?: number | null
          notes?: string | null
          partner_id: string
          partner_notes?: string | null
          quiz_response_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          id?: string
          loan_value?: number | null
          notes?: string | null
          partner_id?: string
          partner_notes?: string | null
          quiz_response_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_quiz_response_id_fkey"
            columns: ["quiz_response_id"]
            isOneToOne: false
            referencedRelation: "quiz_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_credit_transactions: {
        Row: {
          balance_after: number
          created_at: string
          created_by: string | null
          credits_amount: number
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          balance_after: number
          created_at?: string
          created_by?: string | null
          credits_amount: number
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          balance_after?: number
          created_at?: string
          created_by?: string | null
          credits_amount?: number
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lead_custom_emails: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_status: string | null
          error_message: string | null
          id: string
          lead_id: string
          recipient_emails: string[]
          resend_email_id: string | null
          sent_at: string
          sent_by: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          id?: string
          lead_id: string
          recipient_emails: string[]
          resend_email_id?: string | null
          sent_at?: string
          sent_by: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string
          recipient_emails?: string[]
          resend_email_id?: string | null
          sent_at?: string
          sent_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_custom_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "quiz_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_pricing: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          is_active: boolean
          price_per_lead: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          price_per_lead?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          price_per_lead?: number
          updated_at?: string
        }
        Relationships: []
      }
      lead_simulation_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lender_broker_applications: {
        Row: {
          additional_requirements: string | null
          admin_notes: string | null
          applicant_email: string
          applicant_name: string
          applicant_phone: string | null
          application_type: string
          business_description: string | null
          business_types: string[] | null
          company_name: string
          company_website: string | null
          created_at: string
          deals_closed: number | null
          funding_purposes: string[] | null
          geographic_areas: string[] | null
          id: string
          leads_contacted: number | null
          leads_spoken: number | null
          license_number: string | null
          max_loan_amount: string | null
          max_monthly_revenue: string | null
          min_credit_score: string | null
          min_loan_amount: string | null
          min_monthly_revenue: string | null
          min_time_in_business: string | null
          operational_status: string | null
          partner_notes: string | null
          payment_amount: number | null
          payment_deadline: string | null
          payment_status: string | null
          preferred_industries: string[] | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          stripe_payment_link_id: string | null
          total_leads_assigned: number | null
          updated_at: string
          user_id: string | null
          years_of_experience: number | null
        }
        Insert: {
          additional_requirements?: string | null
          admin_notes?: string | null
          applicant_email: string
          applicant_name: string
          applicant_phone?: string | null
          application_type?: string
          business_description?: string | null
          business_types?: string[] | null
          company_name: string
          company_website?: string | null
          created_at?: string
          deals_closed?: number | null
          funding_purposes?: string[] | null
          geographic_areas?: string[] | null
          id?: string
          leads_contacted?: number | null
          leads_spoken?: number | null
          license_number?: string | null
          max_loan_amount?: string | null
          max_monthly_revenue?: string | null
          min_credit_score?: string | null
          min_loan_amount?: string | null
          min_monthly_revenue?: string | null
          min_time_in_business?: string | null
          operational_status?: string | null
          partner_notes?: string | null
          payment_amount?: number | null
          payment_deadline?: string | null
          payment_status?: string | null
          preferred_industries?: string[] | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          stripe_payment_link_id?: string | null
          total_leads_assigned?: number | null
          updated_at?: string
          user_id?: string | null
          years_of_experience?: number | null
        }
        Update: {
          additional_requirements?: string | null
          admin_notes?: string | null
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string | null
          application_type?: string
          business_description?: string | null
          business_types?: string[] | null
          company_name?: string
          company_website?: string | null
          created_at?: string
          deals_closed?: number | null
          funding_purposes?: string[] | null
          geographic_areas?: string[] | null
          id?: string
          leads_contacted?: number | null
          leads_spoken?: number | null
          license_number?: string | null
          max_loan_amount?: string | null
          max_monthly_revenue?: string | null
          min_credit_score?: string | null
          min_loan_amount?: string | null
          min_monthly_revenue?: string | null
          min_time_in_business?: string | null
          operational_status?: string | null
          partner_notes?: string | null
          payment_amount?: number | null
          payment_deadline?: string | null
          payment_status?: string | null
          preferred_industries?: string[] | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          stripe_payment_link_id?: string | null
          total_leads_assigned?: number | null
          updated_at?: string
          user_id?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      partner_lead_credits: {
        Row: {
          available_credits: number
          created_at: string
          id: string
          total_purchased: number
          total_used: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          available_credits?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_used?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          available_credits?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_used?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          application_type: string
          commission_percentage: number | null
          company_name: string
          created_at: string
          deals_closed: number
          email: string
          id: string
          is_active: boolean | null
          leads_contacted: number
          leads_spoken: number
          name: string
          phone: string | null
          total_leads_assigned: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          application_type: string
          commission_percentage?: number | null
          company_name: string
          created_at?: string
          deals_closed?: number
          email: string
          id?: string
          is_active?: boolean | null
          leads_contacted?: number
          leads_spoken?: number
          name: string
          phone?: string | null
          total_leads_assigned?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          application_type?: string
          commission_percentage?: number | null
          company_name?: string
          created_at?: string
          deals_closed?: number
          email?: string
          id?: string
          is_active?: boolean | null
          leads_contacted?: number
          leads_spoken?: number
          name?: string
          phone?: string | null
          total_leads_assigned?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          leads_purchased: number | null
          metadata: Json | null
          payment_type: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          leads_purchased?: number | null
          metadata?: Json | null
          payment_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          leads_purchased?: number | null
          metadata?: Json | null
          payment_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          admin_notes: string | null
          assigned_partner_id: string | null
          assigned_to: string | null
          assignment_date: string | null
          attribution_channel: string | null
          city_province: string | null
          company_name: string | null
          conversion_status: string | null
          country: string | null
          created_at: string
          credit_score: string
          email: string
          id: string
          lead_value: number | null
          loan_amount: number
          monthly_revenue: number
          name: string
          partner_loan_amount: number | null
          phone: string
          score: number
          status: string | null
          time_in_business: string
          updated_at: string
          use_of_funds: string
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_partner_id?: string | null
          assigned_to?: string | null
          assignment_date?: string | null
          attribution_channel?: string | null
          city_province?: string | null
          company_name?: string | null
          conversion_status?: string | null
          country?: string | null
          created_at?: string
          credit_score: string
          email: string
          id?: string
          lead_value?: number | null
          loan_amount: number
          monthly_revenue: number
          name: string
          partner_loan_amount?: number | null
          phone: string
          score: number
          status?: string | null
          time_in_business: string
          updated_at?: string
          use_of_funds: string
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_partner_id?: string | null
          assigned_to?: string | null
          assignment_date?: string | null
          attribution_channel?: string | null
          city_province?: string | null
          company_name?: string | null
          conversion_status?: string | null
          country?: string | null
          created_at?: string
          credit_score?: string
          email?: string
          id?: string
          lead_value?: number | null
          loan_amount?: number
          monthly_revenue?: number
          name?: string
          partner_loan_amount?: number | null
          phone?: string
          score?: number
          status?: string | null
          time_in_business?: string
          updated_at?: string
          use_of_funds?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_assigned_partner_id_fkey"
            columns: ["assigned_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      role_change_audit: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string
          id: string
          new_role: Database["public"]["Enums"]["app_role"] | null
          old_role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
        }
        Relationships: []
      }
      social_proof_notifications: {
        Row: {
          amount_funded: number
          background_color: string
          client_company: string
          client_name: string
          created_at: string
          display_order: number
          emoji: string
          id: string
          is_active: boolean
          lender: string
          profile_picture_url: string | null
          updated_at: string
        }
        Insert: {
          amount_funded: number
          background_color?: string
          client_company: string
          client_name: string
          created_at?: string
          display_order?: number
          emoji?: string
          id?: string
          is_active?: boolean
          lender: string
          profile_picture_url?: string | null
          updated_at?: string
        }
        Update: {
          amount_funded?: number
          background_color?: string
          client_company?: string
          client_name?: string
          created_at?: string
          display_order?: number
          emoji?: string
          id?: string
          is_active?: boolean
          lender?: string
          profile_picture_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_proof_widget_config: {
        Row: {
          created_at: string
          excluded_routes: string[] | null
          id: string
          initial_delay_seconds: number
          interval_seconds: number
          is_enabled: boolean
          max_notifications_per_session: number
          notification_duration_seconds: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          excluded_routes?: string[] | null
          id?: string
          initial_delay_seconds?: number
          interval_seconds?: number
          is_enabled?: boolean
          max_notifications_per_session?: number
          notification_duration_seconds?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          excluded_routes?: string[] | null
          id?: string
          initial_delay_seconds?: number
          interval_seconds?: number
          is_enabled?: boolean
          max_notifications_per_session?: number
          notification_duration_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      submission_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          last_submission_at: string | null
          submission_count: number | null
          submission_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: unknown
          last_submission_at?: string | null
          submission_count?: number | null
          submission_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          last_submission_at?: string | null
          submission_count?: number | null
          submission_type?: string
        }
        Relationships: []
      }
      usa_application_drafts: {
        Row: {
          created_at: string
          current_step: number
          form_data: Json
          id: string
          last_updated: string
          quiz_response_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: number
          form_data?: Json
          id?: string
          last_updated?: string
          quiz_response_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: number
          form_data?: Json
          id?: string
          last_updated?: string
          quiz_response_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usa_applications: {
        Row: {
          accept_cards: string[]
          admin_notes: string | null
          application_reference_number: string | null
          average_monthly_deposits: number
          average_ticket: number | null
          bank_account_number: string
          bank_account_type: string
          bank_name: string
          bank_routing_number: string
          business_description: string
          business_type: string
          city: string
          conversion_stage: string | null
          created_at: string
          current_processor: string | null
          date_incorporated: string | null
          dba_name: string | null
          document_files: Json | null
          email_address: string
          entity_type: string
          fax_number: string | null
          federal_tax_id: string
          high_ticket: number | null
          id: string
          lead_source: string | null
          legal_corporation_name: string
          loan_amount_requested: number
          mid_number: string | null
          monthly_processing_volume: number | null
          monthly_rent_mortgage: number
          months_in_business: number
          months_with_bank: number
          number_of_employees: number
          physical_address: string
          principal_cell_phone: string | null
          principal_city: string
          principal_date_of_birth: string
          principal_email: string
          principal_home_address: string
          principal_home_phone: string | null
          principal_name: string
          principal_ownership_percentage: number
          principal_ssn: string
          principal_state: string
          principal_title: string
          principal_zip: string
          quiz_response_id: string | null
          state: string
          state_of_incorporation: string | null
          state_tax_id: string | null
          status: string
          submitted_at: string
          telephone_number: string
          updated_at: string
          use_of_funds: string
          user_id: string | null
          website: string | null
          years_in_business: number
          zip: string
        }
        Insert: {
          accept_cards?: string[]
          admin_notes?: string | null
          application_reference_number?: string | null
          average_monthly_deposits: number
          average_ticket?: number | null
          bank_account_number: string
          bank_account_type: string
          bank_name: string
          bank_routing_number: string
          business_description: string
          business_type: string
          city: string
          conversion_stage?: string | null
          created_at?: string
          current_processor?: string | null
          date_incorporated?: string | null
          dba_name?: string | null
          document_files?: Json | null
          email_address: string
          entity_type: string
          fax_number?: string | null
          federal_tax_id: string
          high_ticket?: number | null
          id?: string
          lead_source?: string | null
          legal_corporation_name: string
          loan_amount_requested: number
          mid_number?: string | null
          monthly_processing_volume?: number | null
          monthly_rent_mortgage: number
          months_in_business: number
          months_with_bank: number
          number_of_employees: number
          physical_address: string
          principal_cell_phone?: string | null
          principal_city: string
          principal_date_of_birth: string
          principal_email: string
          principal_home_address: string
          principal_home_phone?: string | null
          principal_name: string
          principal_ownership_percentage: number
          principal_ssn: string
          principal_state: string
          principal_title: string
          principal_zip: string
          quiz_response_id?: string | null
          state: string
          state_of_incorporation?: string | null
          state_tax_id?: string | null
          status?: string
          submitted_at?: string
          telephone_number: string
          updated_at?: string
          use_of_funds: string
          user_id?: string | null
          website?: string | null
          years_in_business: number
          zip: string
        }
        Update: {
          accept_cards?: string[]
          admin_notes?: string | null
          application_reference_number?: string | null
          average_monthly_deposits?: number
          average_ticket?: number | null
          bank_account_number?: string
          bank_account_type?: string
          bank_name?: string
          bank_routing_number?: string
          business_description?: string
          business_type?: string
          city?: string
          conversion_stage?: string | null
          created_at?: string
          current_processor?: string | null
          date_incorporated?: string | null
          dba_name?: string | null
          document_files?: Json | null
          email_address?: string
          entity_type?: string
          fax_number?: string | null
          federal_tax_id?: string
          high_ticket?: number | null
          id?: string
          lead_source?: string | null
          legal_corporation_name?: string
          loan_amount_requested?: number
          mid_number?: string | null
          monthly_processing_volume?: number | null
          monthly_rent_mortgage?: number
          months_in_business?: number
          months_with_bank?: number
          number_of_employees?: number
          physical_address?: string
          principal_cell_phone?: string | null
          principal_city?: string
          principal_date_of_birth?: string
          principal_email?: string
          principal_home_address?: string
          principal_home_phone?: string | null
          principal_name?: string
          principal_ownership_percentage?: number
          principal_ssn?: string
          principal_state?: string
          principal_title?: string
          principal_zip?: string
          quiz_response_id?: string | null
          state?: string
          state_of_incorporation?: string | null
          state_tax_id?: string | null
          status?: string
          submitted_at?: string
          telephone_number?: string
          updated_at?: string
          use_of_funds?: string
          user_id?: string | null
          website?: string | null
          years_in_business?: number
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_usa_applications_quiz_response"
            columns: ["quiz_response_id"]
            isOneToOne: false
            referencedRelation: "quiz_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_usa_applications_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: {
        Args: { email_address: string }
        Returns: boolean
      }
      generate_application_reference: {
        Args: { app_type: string }
        Returns: string
      }
      get_roi_metrics: {
        Args: { start_date?: string; end_date?: string }
        Returns: {
          total_leads: number
          total_spend: number
          cost_per_lead: number
          total_revenue: number
          roi_percentage: number
          channel_breakdown: Json
          qualified_leads: number
          funded_leads: number
          all_leads: number
          application_leads: number
          commission_generated: number
        }[]
      }
      has_any_management_role: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_management_access: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_superadmin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_user_superadmin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      update_partner_credits: {
        Args: {
          p_user_id: string
          p_credit_change: number
          p_transaction_type: string
          p_description?: string
          p_reference_id?: string
          p_created_by?: string
        }
        Returns: boolean
      }
      validate_email: {
        Args: { email_address: string }
        Returns: boolean
      }
      validate_phone: {
        Args: { phone_number: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "superadmin" | "lender" | "broker" | "user" | "client"
      user_role: "superadmin" | "lender" | "broker" | "user"
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
      app_role: ["superadmin", "lender", "broker", "user", "client"],
      user_role: ["superadmin", "lender", "broker", "user"],
    },
  },
} as const
