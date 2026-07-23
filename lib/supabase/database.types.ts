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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          action_category: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: number
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          organisation_id: string | null
          previous_values: Json | null
          source_page: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          action_category?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: number
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          organisation_id?: string | null
          previous_values?: Json | null
          source_page?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          action_category?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: number
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          organisation_id?: string | null
          previous_values?: Json | null
          source_page?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_documents: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string
          document_type: string | null
          file_name: string | null
          file_path: string | null
          file_url: string | null
          id: number
          is_archived: boolean
          name: string
          notes: string | null
          responsible_person: string | null
          updated_at: string
          version_number: number
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: number
          is_archived?: boolean
          name: string
          notes?: string | null
          responsible_person?: string | null
          updated_at?: string
          version_number?: number
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          document_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: number
          is_archived?: boolean
          name?: string
          notes?: string | null
          responsible_person?: string | null
          updated_at?: string
          version_number?: number
        }
        Relationships: []
      }
      connection_activity_history: {
        Row: {
          activity_details: Json
          activity_summary: string
          activity_type: string
          connection_id: number | null
          created_at: string
          id: number
          job_id: number | null
          module_key: string | null
          organisation_id: string | null
          performed_by_user_id: string | null
          provider_id: number | null
        }
        Insert: {
          activity_details?: Json
          activity_summary: string
          activity_type: string
          connection_id?: number | null
          created_at?: string
          id?: number
          job_id?: number | null
          module_key?: string | null
          organisation_id?: string | null
          performed_by_user_id?: string | null
          provider_id?: number | null
        }
        Update: {
          activity_details?: Json
          activity_summary?: string
          activity_type?: string
          connection_id?: number | null
          created_at?: string
          id?: number
          job_id?: number | null
          module_key?: string | null
          organisation_id?: string | null
          performed_by_user_id?: string | null
          provider_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_activity_history_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organisation_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_activity_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "connection_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_activity_history_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "connection_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_auth_sessions: {
        Row: {
          code_verifier_reference: string | null
          completed_at: string | null
          connection_id: number | null
          created_at: string
          error_code: string | null
          error_message: string | null
          expires_at: string
          id: number
          initiated_by_user_id: string | null
          organisation_id: string | null
          provider_id: number
          redirect_uri: string | null
          requested_scopes: Json
          session_reference: string
          state_hash: string
          status: string
          updated_at: string
        }
        Insert: {
          code_verifier_reference?: string | null
          completed_at?: string | null
          connection_id?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          expires_at: string
          id?: number
          initiated_by_user_id?: string | null
          organisation_id?: string | null
          provider_id: number
          redirect_uri?: string | null
          requested_scopes?: Json
          session_reference: string
          state_hash: string
          status?: string
          updated_at?: string
        }
        Update: {
          code_verifier_reference?: string | null
          completed_at?: string | null
          connection_id?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          expires_at?: string
          id?: number
          initiated_by_user_id?: string | null
          organisation_id?: string | null
          provider_id?: number
          redirect_uri?: string | null
          requested_scopes?: Json
          session_reference?: string
          state_hash?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_auth_sessions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organisation_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_auth_sessions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "connection_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_external_resources: {
        Row: {
          archived_at: string | null
          connection_id: number
          created_at: string
          created_by_user_id: string | null
          external_name: string | null
          external_parent_id: string | null
          external_resource_id: string
          external_resource_type: string
          external_url: string | null
          file_size_bytes: number | null
          id: number
          is_archived: boolean
          last_leo_modified_at: string | null
          last_provider_modified_at: string | null
          last_synced_at: string | null
          leo_reference_id: number | null
          leo_reference_type: string | null
          leo_version: string | null
          metadata: Json
          mime_type: string | null
          module_key: string
          organisation_id: string | null
          provider_version: string | null
          sync_direction: string
          sync_status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          connection_id: number
          created_at?: string
          created_by_user_id?: string | null
          external_name?: string | null
          external_parent_id?: string | null
          external_resource_id: string
          external_resource_type: string
          external_url?: string | null
          file_size_bytes?: number | null
          id?: number
          is_archived?: boolean
          last_leo_modified_at?: string | null
          last_provider_modified_at?: string | null
          last_synced_at?: string | null
          leo_reference_id?: number | null
          leo_reference_type?: string | null
          leo_version?: string | null
          metadata?: Json
          mime_type?: string | null
          module_key: string
          organisation_id?: string | null
          provider_version?: string | null
          sync_direction?: string
          sync_status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          connection_id?: number
          created_at?: string
          created_by_user_id?: string | null
          external_name?: string | null
          external_parent_id?: string | null
          external_resource_id?: string
          external_resource_type?: string
          external_url?: string | null
          file_size_bytes?: number | null
          id?: number
          is_archived?: boolean
          last_leo_modified_at?: string | null
          last_provider_modified_at?: string | null
          last_synced_at?: string | null
          leo_reference_id?: number | null
          leo_reference_type?: string | null
          leo_version?: string | null
          metadata?: Json
          mime_type?: string | null
          module_key?: string
          organisation_id?: string | null
          provider_version?: string | null
          sync_direction?: string
          sync_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_external_resources_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organisation_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_health_checks: {
        Row: {
          check_type: string
          checked_at: string
          connection_id: number
          created_at: string
          diagnostic_details: Json
          id: number
          next_check_at: string | null
          status: string
          summary: string
        }
        Insert: {
          check_type?: string
          checked_at?: string
          connection_id: number
          created_at?: string
          diagnostic_details?: Json
          id?: number
          next_check_at?: string | null
          status: string
          summary: string
        }
        Update: {
          check_type?: string
          checked_at?: string
          connection_id?: number
          created_at?: string
          diagnostic_details?: Json
          id?: number
          next_check_at?: string | null
          status?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_health_checks_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organisation_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_jobs: {
        Row: {
          action_key: string
          approved_by_user_id: string | null
          cancelled_at: string | null
          completed_at: string | null
          connection_id: number
          created_at: string
          direction: string
          error_code: string | null
          error_message: string | null
          external_reference_id: string | null
          external_reference_type: string | null
          id: number
          module_key: string
          next_retry_at: string | null
          organisation_id: string | null
          progress_percent: number
          request_payload: Json
          requested_at: string
          requested_by_user_id: string | null
          response_payload: Json
          result_file_path: string | null
          result_url: string | null
          retry_count: number
          source_reference_id: number | null
          source_reference_type: string | null
          started_at: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          action_key: string
          approved_by_user_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          connection_id: number
          created_at?: string
          direction: string
          error_code?: string | null
          error_message?: string | null
          external_reference_id?: string | null
          external_reference_type?: string | null
          id?: number
          module_key: string
          next_retry_at?: string | null
          organisation_id?: string | null
          progress_percent?: number
          request_payload?: Json
          requested_at?: string
          requested_by_user_id?: string | null
          response_payload?: Json
          result_file_path?: string | null
          result_url?: string | null
          retry_count?: number
          source_reference_id?: number | null
          source_reference_type?: string | null
          started_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          action_key?: string
          approved_by_user_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          connection_id?: number
          created_at?: string
          direction?: string
          error_code?: string | null
          error_message?: string | null
          external_reference_id?: string | null
          external_reference_type?: string | null
          id?: number
          module_key?: string
          next_retry_at?: string | null
          organisation_id?: string | null
          progress_percent?: number
          request_payload?: Json
          requested_at?: string
          requested_by_user_id?: string | null
          response_payload?: Json
          result_file_path?: string | null
          result_url?: string | null
          retry_count?: number
          source_reference_id?: number | null
          source_reference_type?: string | null
          started_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_jobs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organisation_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_provider_capabilities: {
        Row: {
          capability_group: string
          capability_key: string
          created_at: string
          default_enabled: boolean
          description: string | null
          direction: string
          id: number
          is_active: boolean
          metadata: Json
          name: string
          provider_id: number
          requires_separate_consent: boolean
          risk_level: string
          setup_status: string
          updated_at: string
        }
        Insert: {
          capability_group?: string
          capability_key: string
          created_at?: string
          default_enabled?: boolean
          description?: string | null
          direction?: string
          id?: number
          is_active?: boolean
          metadata?: Json
          name: string
          provider_id: number
          requires_separate_consent?: boolean
          risk_level?: string
          setup_status?: string
          updated_at?: string
        }
        Update: {
          capability_group?: string
          capability_key?: string
          created_at?: string
          default_enabled?: boolean
          description?: string | null
          direction?: string
          id?: number
          is_active?: boolean
          metadata?: Json
          name?: string
          provider_id?: number
          requires_separate_consent?: boolean
          risk_level?: string
          setup_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_provider_capabilities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "connection_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_providers: {
        Row: {
          archived_at: string | null
          authentication_type: string
          category: string
          configuration_schema: Json
          connection_scope: string
          created_at: string
          description: string | null
          display_order: number
          documentation_url: string | null
          id: number
          is_active: boolean
          is_archived: boolean
          logo_url: string | null
          metadata: Json
          name: string
          provider_key: string
          requires_admin_approval: boolean
          setup_status: string
          supports_background_sync: boolean
          supports_disconnect: boolean
          supports_export: boolean
          supports_import: boolean
          supports_multiple_connections: boolean
          supports_webhooks: boolean
          updated_at: string
          website_url: string | null
        }
        Insert: {
          archived_at?: string | null
          authentication_type?: string
          category: string
          configuration_schema?: Json
          connection_scope?: string
          created_at?: string
          description?: string | null
          display_order?: number
          documentation_url?: string | null
          id?: number
          is_active?: boolean
          is_archived?: boolean
          logo_url?: string | null
          metadata?: Json
          name: string
          provider_key: string
          requires_admin_approval?: boolean
          setup_status?: string
          supports_background_sync?: boolean
          supports_disconnect?: boolean
          supports_export?: boolean
          supports_import?: boolean
          supports_multiple_connections?: boolean
          supports_webhooks?: boolean
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          archived_at?: string | null
          authentication_type?: string
          category?: string
          configuration_schema?: Json
          connection_scope?: string
          created_at?: string
          description?: string | null
          display_order?: number
          documentation_url?: string | null
          id?: number
          is_active?: boolean
          is_archived?: boolean
          logo_url?: string | null
          metadata?: Json
          name?: string
          provider_key?: string
          requires_admin_approval?: boolean
          setup_status?: string
          supports_background_sync?: boolean
          supports_disconnect?: boolean
          supports_export?: boolean
          supports_import?: boolean
          supports_multiple_connections?: boolean
          supports_webhooks?: boolean
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      connection_webhook_events: {
        Row: {
          connection_id: number | null
          created_at: string
          error_message: string | null
          event_type: string
          external_event_id: string | null
          id: number
          payload: Json
          processed_at: string | null
          processing_status: string
          provider_id: number
          received_at: string
          signature_verified: boolean
        }
        Insert: {
          connection_id?: number | null
          created_at?: string
          error_message?: string | null
          event_type: string
          external_event_id?: string | null
          id?: number
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          provider_id: number
          received_at?: string
          signature_verified?: boolean
        }
        Update: {
          connection_id?: number | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          external_event_id?: string | null
          id?: number
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          provider_id?: number
          received_at?: string
          signature_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "connection_webhook_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organisation_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_webhook_events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "connection_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      development_pathways: {
        Row: {
          archived_at: string | null
          assignment_type: string
          category: string | null
          created_at: string
          created_by: string | null
          current_version_number: number
          estimated_completion_days: number | null
          id: number
          intended_audience: string | null
          is_archived: boolean
          last_reviewed_at: string | null
          next_review_date: string | null
          organisation_id: string | null
          owner_user_id: string | null
          pathway_type: string
          purpose: string | null
          review_frequency_months: number | null
          source_reference_id: number | null
          source_reference_type: string | null
          source_type: string
          status: string
          target_department: string | null
          target_location: string | null
          target_role: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          assignment_type?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_version_number?: number
          estimated_completion_days?: number | null
          id?: number
          intended_audience?: string | null
          is_archived?: boolean
          last_reviewed_at?: string | null
          next_review_date?: string | null
          organisation_id?: string | null
          owner_user_id?: string | null
          pathway_type?: string
          purpose?: string | null
          review_frequency_months?: number | null
          source_reference_id?: number | null
          source_reference_type?: string | null
          source_type?: string
          status?: string
          target_department?: string | null
          target_location?: string | null
          target_role?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          assignment_type?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          current_version_number?: number
          estimated_completion_days?: number | null
          id?: number
          intended_audience?: string | null
          is_archived?: boolean
          last_reviewed_at?: string | null
          next_review_date?: string | null
          organisation_id?: string | null
          owner_user_id?: string | null
          pathway_type?: string
          purpose?: string | null
          review_frequency_months?: number | null
          source_reference_id?: number | null
          source_reference_type?: string | null
          source_type?: string
          status?: string
          target_department?: string | null
          target_location?: string | null
          target_role?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      employee_dbs_checks: {
        Row: {
          certificate_issue_date: string | null
          certificate_number: string | null
          created_at: string | null
          dbs_level: string | null
          dbs_required: string
          employee_id: number
          id: number
          next_check_due: string | null
          notes: string | null
          safeguarding_training_completed: string | null
          safeguarding_training_expiry: string | null
          update_service: string | null
          update_service_id: string | null
          update_service_last_check_date: string | null
          update_service_next_check_due: string | null
          updated_at: string | null
        }
        Insert: {
          certificate_issue_date?: string | null
          certificate_number?: string | null
          created_at?: string | null
          dbs_level?: string | null
          dbs_required: string
          employee_id: number
          id?: number
          next_check_due?: string | null
          notes?: string | null
          safeguarding_training_completed?: string | null
          safeguarding_training_expiry?: string | null
          update_service?: string | null
          update_service_id?: string | null
          update_service_last_check_date?: string | null
          update_service_next_check_due?: string | null
          updated_at?: string | null
        }
        Update: {
          certificate_issue_date?: string | null
          certificate_number?: string | null
          created_at?: string | null
          dbs_level?: string | null
          dbs_required?: string
          employee_id?: number
          id?: number
          next_check_due?: string | null
          notes?: string | null
          safeguarding_training_completed?: string | null
          safeguarding_training_expiry?: string | null
          update_service?: string | null
          update_service_id?: string | null
          update_service_last_check_date?: string | null
          update_service_next_check_due?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_dbs_checks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_development_documents: {
        Row: {
          archived_at: string | null
          development_record_id: number
          employee_document_id: number
          employee_id: number
          id: number
          is_archived: boolean
          linked_at: string
          linked_by: string | null
        }
        Insert: {
          archived_at?: string | null
          development_record_id: number
          employee_document_id: number
          employee_id: number
          id?: number
          is_archived?: boolean
          linked_at?: string
          linked_by?: string | null
        }
        Update: {
          archived_at?: string | null
          development_record_id?: number
          employee_document_id?: number
          employee_id?: number
          id?: number
          is_archived?: boolean
          linked_at?: string
          linked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_development_documents_development_record_id_fkey"
            columns: ["development_record_id"]
            isOneToOne: false
            referencedRelation: "employee_development_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_development_documents_employee_document_id_fkey"
            columns: ["employee_document_id"]
            isOneToOne: false
            referencedRelation: "employee_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_development_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_development_records: {
        Row: {
          agreed_actions: string | null
          archived_at: string | null
          attendees: string | null
          created_at: string
          created_by: string | null
          employee_comments: string | null
          employee_id: number
          id: number
          is_archived: boolean
          manager_comments: string | null
          manager_name: string | null
          next_review_date: string | null
          record_date: string
          record_type: string
          source_id: number | null
          source_type: string | null
          status: string
          summary: string | null
          support_required: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agreed_actions?: string | null
          archived_at?: string | null
          attendees?: string | null
          created_at?: string
          created_by?: string | null
          employee_comments?: string | null
          employee_id: number
          id?: number
          is_archived?: boolean
          manager_comments?: string | null
          manager_name?: string | null
          next_review_date?: string | null
          record_date: string
          record_type: string
          source_id?: number | null
          source_type?: string | null
          status?: string
          summary?: string | null
          support_required?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agreed_actions?: string | null
          archived_at?: string | null
          attendees?: string | null
          created_at?: string
          created_by?: string | null
          employee_comments?: string | null
          employee_id?: number
          id?: number
          is_archived?: boolean
          manager_comments?: string | null
          manager_name?: string | null
          next_review_date?: string | null
          record_date?: string
          record_type?: string
          source_id?: number | null
          source_type?: string | null
          status?: string
          summary?: string | null
          support_required?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_development_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string | null
          document_type: string | null
          employee_id: number
          file_name: string
          file_path: string
          file_type: string | null
          id: number
          notes: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          employee_id: number
          file_name: string
          file_path: string
          file_type?: string | null
          id?: number
          notes?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          employee_id?: number
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: number
          notes?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_driving_checks: {
        Row: {
          authorised_by: string | null
          authorised_to_drive: string | null
          business_insurance_confirmed: string | null
          business_insurance_expiry_date: string | null
          created_at: string | null
          date_authorised: string | null
          drives_for_work: string
          driving_licence_number: string | null
          dvla_check_completed: string | null
          dvla_check_date: string | null
          employee_id: number
          id: number
          licence_categories: string | null
          licence_expiry_date: string | null
          licence_issue_date: string | null
          mot_expiry_date: string | null
          mot_required: string | null
          motoring_convictions: string | null
          next_dvla_check_due: string | null
          notes: string | null
          penalty_points: number | null
          restrictions_or_adjustments: string | null
          senior_authorisation_required: string | null
          updated_at: string | null
          vehicle_ownership: string | null
          vehicle_registration: string | null
          vehicle_used: string | null
        }
        Insert: {
          authorised_by?: string | null
          authorised_to_drive?: string | null
          business_insurance_confirmed?: string | null
          business_insurance_expiry_date?: string | null
          created_at?: string | null
          date_authorised?: string | null
          drives_for_work: string
          driving_licence_number?: string | null
          dvla_check_completed?: string | null
          dvla_check_date?: string | null
          employee_id: number
          id?: number
          licence_categories?: string | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          mot_expiry_date?: string | null
          mot_required?: string | null
          motoring_convictions?: string | null
          next_dvla_check_due?: string | null
          notes?: string | null
          penalty_points?: number | null
          restrictions_or_adjustments?: string | null
          senior_authorisation_required?: string | null
          updated_at?: string | null
          vehicle_ownership?: string | null
          vehicle_registration?: string | null
          vehicle_used?: string | null
        }
        Update: {
          authorised_by?: string | null
          authorised_to_drive?: string | null
          business_insurance_confirmed?: string | null
          business_insurance_expiry_date?: string | null
          created_at?: string | null
          date_authorised?: string | null
          drives_for_work?: string
          driving_licence_number?: string | null
          dvla_check_completed?: string | null
          dvla_check_date?: string | null
          employee_id?: number
          id?: number
          licence_categories?: string | null
          licence_expiry_date?: string | null
          licence_issue_date?: string | null
          mot_expiry_date?: string | null
          mot_required?: string | null
          motoring_convictions?: string | null
          next_dvla_check_due?: string | null
          notes?: string | null
          penalty_points?: number | null
          restrictions_or_adjustments?: string | null
          senior_authorisation_required?: string | null
          updated_at?: string | null
          vehicle_ownership?: string | null
          vehicle_registration?: string | null
          vehicle_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_driving_checks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_emergency_contacts: {
        Row: {
          address: string | null
          contact_number: number
          created_at: string | null
          email: string | null
          employee_id: number
          full_name: string | null
          id: number
          phone: string | null
          relationship: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_number: number
          created_at?: string | null
          email?: string | null
          employee_id: number
          full_name?: string | null
          id?: number
          phone?: string | null
          relationship?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_number?: number
          created_at?: string | null
          email?: string | null
          employee_id?: number
          full_name?: string | null
          id?: number
          phone?: string | null
          relationship?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_emergency_contacts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_employment_details: {
        Row: {
          annual_leave_allowance: string | null
          created_at: string | null
          employee_id: number
          employment_end_date: string | null
          id: number
          manager: string | null
          probation_end_date: string | null
          reason_for_leaving: string | null
          updated_at: string | null
        }
        Insert: {
          annual_leave_allowance?: string | null
          created_at?: string | null
          employee_id: number
          employment_end_date?: string | null
          id?: number
          manager?: string | null
          probation_end_date?: string | null
          reason_for_leaving?: string | null
          updated_at?: string | null
        }
        Update: {
          annual_leave_allowance?: string | null
          created_at?: string | null
          employee_id?: number
          employment_end_date?: string | null
          id?: number
          manager?: string | null
          probation_end_date?: string | null
          reason_for_leaving?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_employment_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_import_rows: {
        Row: {
          created_at: string
          employee_id: number | null
          id: number
          import_id: number
          mapped_data: Json
          result_status: string
          row_number: number
          source_data: Json
          validation_errors: Json
          validation_warnings: Json
        }
        Insert: {
          created_at?: string
          employee_id?: number | null
          id?: number
          import_id: number
          mapped_data?: Json
          result_status?: string
          row_number: number
          source_data?: Json
          validation_errors?: Json
          validation_warnings?: Json
        }
        Update: {
          created_at?: string
          employee_id?: number | null
          id?: number
          import_id?: number
          mapped_data?: Json
          result_status?: string
          row_number?: number
          source_data?: Json
          validation_errors?: Json
          validation_warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "employee_import_rows_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_import_rows_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "employee_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_imports: {
        Row: {
          column_mapping: Json
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_rows: number
          error_rows: number
          file_name: string
          file_type: string | null
          id: number
          import_mode: string
          import_options: Json
          organisation_id: string | null
          skipped_rows: number
          status: string
          total_rows: number
          updated_rows: number
        }
        Insert: {
          column_mapping?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_rows?: number
          error_rows?: number
          file_name: string
          file_type?: string | null
          id?: number
          import_mode?: string
          import_options?: Json
          organisation_id?: string | null
          skipped_rows?: number
          status?: string
          total_rows?: number
          updated_rows?: number
        }
        Update: {
          column_mapping?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_rows?: number
          error_rows?: number
          file_name?: string
          file_type?: string | null
          id?: number
          import_mode?: string
          import_options?: Json
          organisation_id?: string | null
          skipped_rows?: number
          status?: string
          total_rows?: number
          updated_rows?: number
        }
        Relationships: []
      }
      employee_leave_records: {
        Row: {
          created_at: string | null
          days_taken: number | null
          employee_id: number
          end_date: string | null
          id: number
          leave_type: string
          notes: string | null
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_taken?: number | null
          employee_id: number
          end_date?: string | null
          id?: number
          leave_type: string
          notes?: string | null
          start_date?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_taken?: number | null
          employee_id?: number
          end_date?: string | null
          id?: number
          leave_type?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_leave_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_medical: {
        Row: {
          additional_notes: string | null
          created_at: string | null
          employee_id: number
          id: number
          medical_condition: string | null
          reasonable_adjustments: string | null
          since_date: string | null
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          created_at?: string | null
          employee_id: number
          id?: number
          medical_condition?: string | null
          reasonable_adjustments?: string | null
          since_date?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          created_at?: string | null
          employee_id?: number
          id?: number
          medical_condition?: string | null
          reasonable_adjustments?: string | null
          since_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_medical_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_notes: {
        Row: {
          created_at: string | null
          employee_id: number
          id: number
          note: string
        }
        Insert: {
          created_at?: string | null
          employee_id: number
          id?: number
          note: string
        }
        Update: {
          created_at?: string | null
          employee_id?: number
          id?: number
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_probations: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          current_end_date: string
          employee_id: number
          extension_end_date: string | null
          extension_reason: string | null
          extension_start_date: string | null
          final_decision_deadline: string
          final_outcome: string | null
          final_outcome_date: string | null
          id: number
          is_archived: boolean
          probation_start_date: string
          standard_end_date: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          current_end_date: string
          employee_id: number
          extension_end_date?: string | null
          extension_reason?: string | null
          extension_start_date?: string | null
          final_decision_deadline: string
          final_outcome?: string | null
          final_outcome_date?: string | null
          id?: number
          is_archived?: boolean
          probation_start_date: string
          standard_end_date: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          current_end_date?: string
          employee_id?: number
          extension_end_date?: string | null
          extension_reason?: string | null
          extension_start_date?: string | null
          final_decision_deadline?: string
          final_outcome?: string | null
          final_outcome_date?: string | null
          id?: number
          is_archived?: boolean
          probation_start_date?: string
          standard_end_date?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_probations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_qualification_requirements: {
        Row: {
          compliance_date: string | null
          created_at: string
          employee_id: number
          employee_qualification_id: number | null
          exception_approved_at: string | null
          exception_approved_by: number | null
          exception_reason: string | null
          id: number
          notes: string | null
          qualification_requirement_id: number
          required_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          compliance_date?: string | null
          created_at?: string
          employee_id: number
          employee_qualification_id?: number | null
          exception_approved_at?: string | null
          exception_approved_by?: number | null
          exception_reason?: string | null
          id?: number
          notes?: string | null
          qualification_requirement_id: number
          required_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          compliance_date?: string | null
          created_at?: string
          employee_id?: number
          employee_qualification_id?: number | null
          exception_approved_at?: string | null
          exception_approved_by?: number | null
          exception_reason?: string | null
          id?: number
          notes?: string | null
          qualification_requirement_id?: number
          required_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_qualification_requir_qualification_requirement_id_fkey"
            columns: ["qualification_requirement_id"]
            isOneToOne: false
            referencedRelation: "qualification_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_qualification_requireme_employee_qualification_id_fkey"
            columns: ["employee_qualification_id"]
            isOneToOne: false
            referencedRelation: "employee_qualifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_qualification_requirements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_qualification_requirements_exception_approved_by_fkey"
            columns: ["exception_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_qualifications: {
        Row: {
          archived_at: string | null
          category: string
          certificate_number: string | null
          created_at: string
          created_by: string | null
          employee_id: number
          employee_notes: string | null
          expiry_date: string | null
          id: number
          is_archived: boolean
          issue_date: string | null
          issuing_body: string | null
          licence_number: string | null
          manager_notes: string | null
          mandatory: boolean
          membership_number: string | null
          qualification_level: string | null
          qualification_type_id: number | null
          registration_number: string | null
          renewal_date: string | null
          renewal_reminder_days: number | null
          renewal_required: boolean
          source_reference_id: number | null
          source_reference_type: string | null
          source_type: string
          status: string
          subject_or_specialism: string | null
          title: string
          updated_at: string
          updated_by: string | null
          valid_from: string | null
          verification_method: string | null
          verification_notes: string | null
          verification_reference: string | null
          verification_status: string
          verified_at: string | null
          verified_by: number | null
        }
        Insert: {
          archived_at?: string | null
          category?: string
          certificate_number?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: number
          employee_notes?: string | null
          expiry_date?: string | null
          id?: number
          is_archived?: boolean
          issue_date?: string | null
          issuing_body?: string | null
          licence_number?: string | null
          manager_notes?: string | null
          mandatory?: boolean
          membership_number?: string | null
          qualification_level?: string | null
          qualification_type_id?: number | null
          registration_number?: string | null
          renewal_date?: string | null
          renewal_reminder_days?: number | null
          renewal_required?: boolean
          source_reference_id?: number | null
          source_reference_type?: string | null
          source_type?: string
          status?: string
          subject_or_specialism?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          verification_method?: string | null
          verification_notes?: string | null
          verification_reference?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: number | null
        }
        Update: {
          archived_at?: string | null
          category?: string
          certificate_number?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: number
          employee_notes?: string | null
          expiry_date?: string | null
          id?: number
          is_archived?: boolean
          issue_date?: string | null
          issuing_body?: string | null
          licence_number?: string | null
          manager_notes?: string | null
          mandatory?: boolean
          membership_number?: string | null
          qualification_level?: string | null
          qualification_type_id?: number | null
          registration_number?: string | null
          renewal_date?: string | null
          renewal_reminder_days?: number | null
          renewal_required?: boolean
          source_reference_id?: number | null
          source_reference_type?: string | null
          source_type?: string
          status?: string
          subject_or_specialism?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          verification_method?: string | null
          verification_notes?: string | null
          verification_reference?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_qualifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_qualifications_qualification_type_id_fkey"
            columns: ["qualification_type_id"]
            isOneToOne: false
            referencedRelation: "qualification_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_qualifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_right_to_work: {
        Row: {
          check_completed_date: string | null
          created_at: string | null
          employee_id: number
          id: number
          immigration_status: string | null
          nationality: string
          next_review_date: string | null
          notes: string | null
          restrictions: string | null
          right_to_work_expiry: string | null
          share_code: string | null
          updated_at: string | null
          visa_or_permit_type: string | null
        }
        Insert: {
          check_completed_date?: string | null
          created_at?: string | null
          employee_id: number
          id?: number
          immigration_status?: string | null
          nationality: string
          next_review_date?: string | null
          notes?: string | null
          restrictions?: string | null
          right_to_work_expiry?: string | null
          share_code?: string | null
          updated_at?: string | null
          visa_or_permit_type?: string | null
        }
        Update: {
          check_completed_date?: string | null
          created_at?: string | null
          employee_id?: number
          id?: number
          immigration_status?: string | null
          nationality?: string
          next_review_date?: string | null
          notes?: string | null
          restrictions?: string | null
          right_to_work_expiry?: string | null
          share_code?: string | null
          updated_at?: string | null
          visa_or_permit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_right_to_work_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sar_documents: {
        Row: {
          created_at: string
          document_type: string
          employee_id: number
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: number
          notes: string | null
          review_status: string
          sar_id: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          employee_id: number
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: number
          notes?: string | null
          review_status?: string
          sar_id: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          employee_id?: number
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: number
          notes?: string | null
          review_status?: string
          sar_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sar_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_sar_documents_sar_id_fkey"
            columns: ["sar_id"]
            isOneToOne: false
            referencedRelation: "employee_sars"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sar_timeline: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_type: string
          id: number
          sar_id: number
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type: string
          id?: number
          sar_id: number
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: number
          sar_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sar_timeline_sar_id_fkey"
            columns: ["sar_id"]
            isOneToOne: false
            referencedRelation: "employee_sars"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_sars: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          collection_complete: boolean
          created_at: string
          disclosure_sent: boolean
          disclosure_sent_at: string | null
          employee_id: number
          extended_due_date: string | null
          extension_applied: boolean
          extension_reason: string | null
          id: number
          identity_verified: boolean
          identity_verified_at: string | null
          matter_id: number | null
          redaction_complete: boolean
          request_file_name: string | null
          request_file_path: string | null
          request_file_size: number | null
          request_file_type: string | null
          request_received_date: string
          request_source: string | null
          request_summary: string | null
          request_title: string
          response_due_date: string
          review_complete: boolean
          scope_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          collection_complete?: boolean
          created_at?: string
          disclosure_sent?: boolean
          disclosure_sent_at?: string | null
          employee_id: number
          extended_due_date?: string | null
          extension_applied?: boolean
          extension_reason?: string | null
          id?: number
          identity_verified?: boolean
          identity_verified_at?: string | null
          matter_id?: number | null
          redaction_complete?: boolean
          request_file_name?: string | null
          request_file_path?: string | null
          request_file_size?: number | null
          request_file_type?: string | null
          request_received_date: string
          request_source?: string | null
          request_summary?: string | null
          request_title?: string
          response_due_date: string
          review_complete?: boolean
          scope_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          collection_complete?: boolean
          created_at?: string
          disclosure_sent?: boolean
          disclosure_sent_at?: string | null
          employee_id?: number
          extended_due_date?: string | null
          extension_applied?: boolean
          extension_reason?: string | null
          id?: number
          identity_verified?: boolean
          identity_verified_at?: string | null
          matter_id?: number | null
          redaction_complete?: boolean
          request_file_name?: string | null
          request_file_path?: string | null
          request_file_size?: number | null
          request_file_type?: string | null
          request_received_date?: string
          request_source?: string | null
          request_summary?: string | null
          request_title?: string
          response_due_date?: string
          review_complete?: boolean
          scope_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sars_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_sars_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_timeline: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          employee_id: number
          event_date: string
          event_type: string
          id: number
          metadata: Json
          organisation_id: string | null
          source_module: string
          source_record_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id: number
          event_date?: string
          event_type: string
          id?: number
          metadata?: Json
          organisation_id?: string | null
          source_module: string
          source_record_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_id?: number
          event_date?: string
          event_type?: string
          id?: number
          metadata?: Json
          organisation_id?: string | null
          source_module?: string
          source_record_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_timeline_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_training_logs: {
        Row: {
          created_at: string | null
          date_completed: string | null
          employee_id: number
          id: number
          notes: string | null
          refresh_or_expiry_date: string | null
          training_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_completed?: string | null
          employee_id: number
          id?: number
          notes?: string | null
          refresh_or_expiry_date?: string | null
          training_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_completed?: string | null
          employee_id?: number
          id?: number
          notes?: string | null
          refresh_or_expiry_date?: string | null
          training_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_training_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_user_links: {
        Row: {
          created_at: string
          employee_id: number
          id: string
          link_status: string
          linked_at: string
          linked_by: string | null
          metadata: Json
          organisation_id: string
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_id: number
          id?: string
          link_status?: string
          linked_at?: string
          linked_by?: string | null
          metadata?: Json
          organisation_id: string
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employee_id?: number
          id?: string
          link_status?: string
          linked_at?: string
          linked_by?: string | null
          metadata?: Json
          organisation_id?: string
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_user_links_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_user_links_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_warnings: {
        Row: {
          created_at: string | null
          date_issued: string | null
          employee_id: number
          id: number
          outcome: string | null
          review_date: string | null
          summary: string | null
          updated_at: string | null
          warning_type: string
        }
        Insert: {
          created_at?: string | null
          date_issued?: string | null
          employee_id: number
          id?: number
          outcome?: string | null
          review_date?: string | null
          summary?: string | null
          updated_at?: string | null
          warning_type: string
        }
        Update: {
          created_at?: string | null
          date_issued?: string | null
          employee_id?: number
          id?: number
          outcome?: string | null
          review_date?: string | null
          summary?: string | null
          updated_at?: string | null
          warning_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_warnings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          archived_at: string | null
          "created at": string
          department: string | null
          email: string | null
          id: number
          is_demo: boolean
          name: string
          organisation_id: string | null
          role: string | null
          site_id: number | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          "created at"?: string
          department?: string | null
          email?: string | null
          id?: number
          is_demo?: boolean
          name: string
          organisation_id?: string | null
          role?: string | null
          site_id?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          "created at"?: string
          department?: string | null
          email?: string | null
          id?: number
          is_demo?: boolean
          name?: string
          organisation_id?: string | null
          role?: string | null
          site_id?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_resource_versions: {
        Row: {
          category: string | null
          file_name: string | null
          file_path: string | null
          file_url: string | null
          id: string
          notes: string | null
          replaced_at: string
          resource_name: string
          resource_type: string | null
          responsible_person: string | null
          review_date: string | null
          source_record_id: number
          source_table: string
          version_number: number
        }
        Insert: {
          category?: string | null
          file_name?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          replaced_at?: string
          resource_name: string
          resource_type?: string | null
          responsible_person?: string | null
          review_date?: string | null
          source_record_id: number
          source_table: string
          version_number: number
        }
        Update: {
          category?: string | null
          file_name?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          replaced_at?: string
          resource_name?: string
          resource_type?: string | null
          responsible_person?: string | null
          review_date?: string | null
          source_record_id?: number
          source_table?: string
          version_number?: number
        }
        Relationships: []
      }
      identity_profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          is_active: boolean
          is_platform_admin: boolean
          job_title: string | null
          last_name: string | null
          last_seen_at: string | null
          locale: string
          metadata: Json
          phone_number: string | null
          privacy_notice_accepted_at: string | null
          terms_accepted_at: string | null
          time_zone: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean
          is_platform_admin?: boolean
          job_title?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          locale?: string
          metadata?: Json
          phone_number?: string | null
          privacy_notice_accepted_at?: string | null
          terms_accepted_at?: string | null
          time_zone?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          is_platform_admin?: boolean
          job_title?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          locale?: string
          metadata?: Json
          phone_number?: string | null
          privacy_notice_accepted_at?: string | null
          terms_accepted_at?: string | null
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          heading: string | null
          id: string
          is_active: boolean
          metadata: Json
          organisation_id: string
          source_record_id: number | null
          source_table: string | null
          token_estimate: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          heading?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          organisation_id: string
          source_record_id?: number | null
          source_table?: string | null
          token_estimate?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          heading?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          organisation_id?: string
          source_record_id?: number | null
          source_table?: string | null
          token_estimate?: number | null
        }
        Relationships: []
      }
      learning_activity_history: {
        Row: {
          activity_details: Json | null
          activity_summary: string
          activity_type: string
          created_at: string
          employee_id: number | null
          id: number
          learning_assignment_id: number | null
          learning_module_id: number | null
          recorded_by: string | null
        }
        Insert: {
          activity_details?: Json | null
          activity_summary: string
          activity_type: string
          created_at?: string
          employee_id?: number | null
          id?: number
          learning_assignment_id?: number | null
          learning_module_id?: number | null
          recorded_by?: string | null
        }
        Update: {
          activity_details?: Json | null
          activity_summary?: string
          activity_type?: string
          created_at?: string
          employee_id?: number | null
          id?: number
          learning_assignment_id?: number | null
          learning_module_id?: number | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_activity_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_activity_history_learning_assignment_id_fkey"
            columns: ["learning_assignment_id"]
            isOneToOne: false
            referencedRelation: "learning_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_activity_history_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_ai_activity_history: {
        Row: {
          activity_details: Json | null
          activity_summary: string
          activity_type: string
          created_at: string
          id: number
          output_id: number | null
          project_id: number | null
          recorded_by: string | null
        }
        Insert: {
          activity_details?: Json | null
          activity_summary: string
          activity_type: string
          created_at?: string
          id?: number
          output_id?: number | null
          project_id?: number | null
          recorded_by?: string | null
        }
        Update: {
          activity_details?: Json | null
          activity_summary?: string
          activity_type?: string
          created_at?: string
          id?: number
          output_id?: number | null
          project_id?: number | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_ai_activity_history_output_id_fkey"
            columns: ["output_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_outputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_ai_activity_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_ai_external_exports: {
        Row: {
          completed_at: string | null
          connection_id: number
          connection_job_id: number | null
          created_at: string
          error_message: string | null
          export_type: string
          external_resource_id: string | null
          external_resource_type: string | null
          external_url: string | null
          id: number
          last_synced_at: string | null
          metadata: Json
          output_id: number | null
          project_id: number
          requested_at: string
          requested_by_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          connection_id: number
          connection_job_id?: number | null
          created_at?: string
          error_message?: string | null
          export_type: string
          external_resource_id?: string | null
          external_resource_type?: string | null
          external_url?: string | null
          id?: number
          last_synced_at?: string | null
          metadata?: Json
          output_id?: number | null
          project_id: number
          requested_at?: string
          requested_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: number
          connection_job_id?: number | null
          created_at?: string
          error_message?: string | null
          export_type?: string
          external_resource_id?: string | null
          external_resource_type?: string | null
          external_url?: string | null
          id?: number
          last_synced_at?: string | null
          metadata?: Json
          output_id?: number | null
          project_id?: number
          requested_at?: string
          requested_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_ai_external_exports_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organisation_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_ai_external_exports_connection_job_id_fkey"
            columns: ["connection_job_id"]
            isOneToOne: false
            referencedRelation: "connection_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_ai_external_exports_output_id_fkey"
            columns: ["output_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_outputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_ai_external_exports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_ai_intelligence: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          created_at: string
          due_date: string | null
          finding_type: string
          id: number
          is_archived: boolean
          priority: string
          project_id: number | null
          recommendation: string | null
          resolved_at: string | null
          source_reference_id: number | null
          source_reference_type: string | null
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          finding_type: string
          id?: number
          is_archived?: boolean
          priority?: string
          project_id?: number | null
          recommendation?: string | null
          resolved_at?: string | null
          source_reference_id?: number | null
          source_reference_type?: string | null
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          finding_type?: string
          id?: number
          is_archived?: boolean
          priority?: string
          project_id?: number | null
          recommendation?: string | null
          resolved_at?: string | null
          source_reference_id?: number | null
          source_reference_type?: string | null
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_ai_intelligence_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_ai_messages: {
        Row: {
          completion_tokens: number | null
          content: string
          created_at: string
          created_by: string | null
          id: number
          message_type: string
          model_name: string | null
          project_id: number
          prompt_tokens: number | null
          role: string
          sequence_number: number
        }
        Insert: {
          completion_tokens?: number | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: number
          message_type?: string
          model_name?: string | null
          project_id: number
          prompt_tokens?: number | null
          role: string
          sequence_number: number
        }
        Update: {
          completion_tokens?: number | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: number
          message_type?: string
          model_name?: string | null
          project_id?: number
          prompt_tokens?: number | null
          role?: string
          sequence_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_ai_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_ai_outputs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          content: string
          created_at: string
          development_pathway_id: number | null
          generated_at: string
          id: number
          is_archived: boolean
          learning_module_id: number | null
          output_type: string
          parent_output_id: number | null
          project_id: number
          published_at: string | null
          published_by: string | null
          published_reference_id: number | null
          published_reference_type: string | null
          status: string
          structured_content: Json | null
          title: string
          updated_at: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          content: string
          created_at?: string
          development_pathway_id?: number | null
          generated_at?: string
          id?: number
          is_archived?: boolean
          learning_module_id?: number | null
          output_type: string
          parent_output_id?: number | null
          project_id: number
          published_at?: string | null
          published_by?: string | null
          published_reference_id?: number | null
          published_reference_type?: string | null
          status?: string
          structured_content?: Json | null
          title: string
          updated_at?: string
          version_number?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          content?: string
          created_at?: string
          development_pathway_id?: number | null
          generated_at?: string
          id?: number
          is_archived?: boolean
          learning_module_id?: number | null
          output_type?: string
          parent_output_id?: number | null
          project_id?: number
          published_at?: string | null
          published_by?: string | null
          published_reference_id?: number | null
          published_reference_type?: string | null
          status?: string
          structured_content?: Json | null
          title?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_ai_outputs_development_pathway_id_fkey"
            columns: ["development_pathway_id"]
            isOneToOne: false
            referencedRelation: "development_pathways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_ai_outputs_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_ai_outputs_parent_output_id_fkey"
            columns: ["parent_output_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_outputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_ai_outputs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_ai_projects: {
        Row: {
          accessibility_review_required: boolean
          archived_at: string | null
          constraints: string | null
          created_at: string
          created_by: string | null
          current_version_number: number
          description: string | null
          equality_review_required: boolean
          estimated_duration_minutes: number | null
          id: number
          instructions: string | null
          intended_audience: string | null
          is_archived: boolean
          language_code: string
          legal_review_required: boolean
          manager_review_required: boolean
          objective: string | null
          organisation_id: string | null
          output_format: string | null
          project_type: string
          reading_level: string | null
          source_reference_id: number | null
          source_reference_type: string | null
          source_text: string | null
          source_type: string
          status: string
          subject_area: string | null
          target_department: string | null
          target_location: string | null
          target_role: string | null
          title: string
          tone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accessibility_review_required?: boolean
          archived_at?: string | null
          constraints?: string | null
          created_at?: string
          created_by?: string | null
          current_version_number?: number
          description?: string | null
          equality_review_required?: boolean
          estimated_duration_minutes?: number | null
          id?: number
          instructions?: string | null
          intended_audience?: string | null
          is_archived?: boolean
          language_code?: string
          legal_review_required?: boolean
          manager_review_required?: boolean
          objective?: string | null
          organisation_id?: string | null
          output_format?: string | null
          project_type: string
          reading_level?: string | null
          source_reference_id?: number | null
          source_reference_type?: string | null
          source_text?: string | null
          source_type?: string
          status?: string
          subject_area?: string | null
          target_department?: string | null
          target_location?: string | null
          target_role?: string | null
          title: string
          tone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accessibility_review_required?: boolean
          archived_at?: string | null
          constraints?: string | null
          created_at?: string
          created_by?: string | null
          current_version_number?: number
          description?: string | null
          equality_review_required?: boolean
          estimated_duration_minutes?: number | null
          id?: number
          instructions?: string | null
          intended_audience?: string | null
          is_archived?: boolean
          language_code?: string
          legal_review_required?: boolean
          manager_review_required?: boolean
          objective?: string | null
          organisation_id?: string | null
          output_format?: string | null
          project_type?: string
          reading_level?: string | null
          source_reference_id?: number | null
          source_reference_type?: string | null
          source_text?: string | null
          source_type?: string
          status?: string
          subject_area?: string | null
          target_department?: string | null
          target_location?: string | null
          target_role?: string | null
          title?: string
          tone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      learning_ai_reviews: {
        Row: {
          created_at: string
          findings: Json | null
          id: number
          output_id: number | null
          project_id: number
          recommendations: string | null
          review_status: string
          review_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          findings?: Json | null
          id?: number
          output_id?: number | null
          project_id: number
          recommendations?: string | null
          review_status?: string
          review_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          findings?: Json | null
          id?: number
          output_id?: number | null
          project_id?: number
          recommendations?: string | null
          review_status?: string
          review_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_ai_reviews_output_id_fkey"
            columns: ["output_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_outputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_ai_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_ai_source_files: {
        Row: {
          archived_at: string | null
          created_at: string
          extracted_text: string | null
          extraction_status: string
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: number
          is_archived: boolean
          mime_type: string | null
          original_file_name: string | null
          project_id: number
          source_category: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: number
          is_archived?: boolean
          mime_type?: string | null
          original_file_name?: string | null
          project_id: number
          source_category?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          extracted_text?: string | null
          extraction_status?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: number
          is_archived?: boolean
          mime_type?: string | null
          original_file_name?: string | null
          project_id?: number
          source_category?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_ai_source_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "learning_ai_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_ai_studio_defaults: {
        Row: {
          accessibility_review_default: boolean
          auto_create_version_on_revision: boolean
          auto_save_outputs: boolean
          created_at: string
          default_audience: string | null
          default_language_code: string
          default_output_format: string
          default_reading_level: string
          default_tone: string
          employment_law_review_default: boolean
          equality_review_default: boolean
          id: number
          manager_review_default: boolean
          organisation_context_enabled: boolean
          organisation_id: string | null
          permitted_roles: string[]
          plain_english_required: boolean
          require_approval_before_publish: boolean
          source_citation_required: boolean
          updated_at: string
        }
        Insert: {
          accessibility_review_default?: boolean
          auto_create_version_on_revision?: boolean
          auto_save_outputs?: boolean
          created_at?: string
          default_audience?: string | null
          default_language_code?: string
          default_output_format?: string
          default_reading_level?: string
          default_tone?: string
          employment_law_review_default?: boolean
          equality_review_default?: boolean
          id?: number
          manager_review_default?: boolean
          organisation_context_enabled?: boolean
          organisation_id?: string | null
          permitted_roles?: string[]
          plain_english_required?: boolean
          require_approval_before_publish?: boolean
          source_citation_required?: boolean
          updated_at?: string
        }
        Update: {
          accessibility_review_default?: boolean
          auto_create_version_on_revision?: boolean
          auto_save_outputs?: boolean
          created_at?: string
          default_audience?: string | null
          default_language_code?: string
          default_output_format?: string
          default_reading_level?: string
          default_tone?: string
          employment_law_review_default?: boolean
          equality_review_default?: boolean
          id?: number
          manager_review_default?: boolean
          organisation_context_enabled?: boolean
          organisation_id?: string | null
          permitted_roles?: string[]
          plain_english_required?: boolean
          require_approval_before_publish?: boolean
          source_citation_required?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      learning_ai_templates: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          default_audience: string | null
          default_constraints: string | null
          default_output_type: string | null
          default_tone: string | null
          description: string | null
          id: number
          is_active: boolean
          is_archived: boolean
          name: string
          organisation_id: string | null
          prompt_template: string
          system_template: boolean
          template_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          default_audience?: string | null
          default_constraints?: string | null
          default_output_type?: string | null
          default_tone?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          is_archived?: boolean
          name: string
          organisation_id?: string | null
          prompt_template: string
          system_template?: boolean
          template_type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          default_audience?: string | null
          default_constraints?: string | null
          default_output_type?: string | null
          default_tone?: string | null
          description?: string | null
          id?: number
          is_active?: boolean
          is_archived?: boolean
          name?: string
          organisation_id?: string | null
          prompt_template?: string
          system_template?: boolean
          template_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      learning_assessment_answers: {
        Row: {
          assessment_attempt_id: number
          assessment_question_id: number
          created_at: string
          employee_answer: string | null
          id: number
          is_correct: boolean | null
          manually_reviewed: boolean
          points_available: number
          points_awarded: number
          reviewed_at: string | null
          reviewed_by: number | null
          reviewer_comments: string | null
          updated_at: string
        }
        Insert: {
          assessment_attempt_id: number
          assessment_question_id: number
          created_at?: string
          employee_answer?: string | null
          id?: number
          is_correct?: boolean | null
          manually_reviewed?: boolean
          points_available?: number
          points_awarded?: number
          reviewed_at?: string | null
          reviewed_by?: number | null
          reviewer_comments?: string | null
          updated_at?: string
        }
        Update: {
          assessment_attempt_id?: number
          assessment_question_id?: number
          created_at?: string
          employee_answer?: string | null
          id?: number
          is_correct?: boolean | null
          manually_reviewed?: boolean
          points_available?: number
          points_awarded?: number
          reviewed_at?: string | null
          reviewed_by?: number | null
          reviewer_comments?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_assessment_answers_assessment_attempt_id_fkey"
            columns: ["assessment_attempt_id"]
            isOneToOne: false
            referencedRelation: "learning_assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_answers_assessment_question_id_fkey"
            columns: ["assessment_question_id"]
            isOneToOne: false
            referencedRelation: "learning_assessment_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_answers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_assessment_attempts: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          employee_id: number
          id: number
          learning_assignment_id: number
          learning_module_id: number
          pass_mark: number | null
          points_awarded: number
          score_percent: number | null
          started_at: string
          status: string
          submitted_at: string | null
          total_points_available: number
          total_questions: number
          updated_at: string
        }
        Insert: {
          attempt_number: number
          completed_at?: string | null
          created_at?: string
          employee_id: number
          id?: number
          learning_assignment_id: number
          learning_module_id: number
          pass_mark?: number | null
          points_awarded?: number
          score_percent?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          total_points_available?: number
          total_questions?: number
          updated_at?: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          employee_id?: number
          id?: number
          learning_assignment_id?: number
          learning_module_id?: number
          pass_mark?: number | null
          points_awarded?: number
          score_percent?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          total_points_available?: number
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_assessment_attempts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_attempts_learning_assignment_id_fkey"
            columns: ["learning_assignment_id"]
            isOneToOne: false
            referencedRelation: "learning_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assessment_attempts_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_assessment_questions: {
        Row: {
          archived_at: string | null
          correct_answer: string | null
          created_at: string
          explanation: string | null
          id: number
          is_archived: boolean
          learning_module_id: number
          options: Json | null
          points: number
          question_text: string
          question_type: string
          sequence_number: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          correct_answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: number
          is_archived?: boolean
          learning_module_id: number
          options?: Json | null
          points?: number
          question_text: string
          question_type: string
          sequence_number: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          correct_answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: number
          is_archived?: boolean
          learning_module_id?: number
          options?: Json | null
          points?: number
          question_text?: string
          question_type?: string
          sequence_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_assessment_questions_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_assessments: {
        Row: {
          created_at: string
          id: number
          learning_module_id: number
          max_attempts: number
          pass_mark: number
          randomise_questions: boolean
          show_correct_answers: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          learning_module_id: number
          max_attempts?: number
          pass_mark?: number
          randomise_questions?: boolean
          show_correct_answers?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          learning_module_id?: number
          max_attempts?: number
          pass_mark?: number
          randomise_questions?: boolean
          show_correct_answers?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_assessments_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: true
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_assignment_rules: {
        Row: {
          allow_employee_decline: boolean
          allow_manager_due_date_override: boolean
          allow_no_due_date: boolean
          auto_reassign_failed_learning: boolean
          automatically_mark_overdue: boolean
          completion_evidence_required_by_default: boolean
          completion_notes_enabled: boolean
          created_at: string
          default_due_days: number
          employee_decline_reason_required: boolean
          failed_learning_reassignment_days: number
          id: number
          manager_validation_due_days: number
          manager_validation_escalation_enabled: boolean
          maximum_assessment_attempts: number | null
          organisation_id: string | null
          overdue_escalation_days: number
          overdue_escalation_enabled: boolean
          overdue_escalation_roles: string[]
          updated_at: string
        }
        Insert: {
          allow_employee_decline?: boolean
          allow_manager_due_date_override?: boolean
          allow_no_due_date?: boolean
          auto_reassign_failed_learning?: boolean
          automatically_mark_overdue?: boolean
          completion_evidence_required_by_default?: boolean
          completion_notes_enabled?: boolean
          created_at?: string
          default_due_days?: number
          employee_decline_reason_required?: boolean
          failed_learning_reassignment_days?: number
          id?: number
          manager_validation_due_days?: number
          manager_validation_escalation_enabled?: boolean
          maximum_assessment_attempts?: number | null
          organisation_id?: string | null
          overdue_escalation_days?: number
          overdue_escalation_enabled?: boolean
          overdue_escalation_roles?: string[]
          updated_at?: string
        }
        Update: {
          allow_employee_decline?: boolean
          allow_manager_due_date_override?: boolean
          allow_no_due_date?: boolean
          auto_reassign_failed_learning?: boolean
          automatically_mark_overdue?: boolean
          completion_evidence_required_by_default?: boolean
          completion_notes_enabled?: boolean
          created_at?: string
          default_due_days?: number
          employee_decline_reason_required?: boolean
          failed_learning_reassignment_days?: number
          id?: number
          manager_validation_due_days?: number
          manager_validation_escalation_enabled?: boolean
          maximum_assessment_attempts?: number | null
          organisation_id?: string | null
          overdue_escalation_days?: number
          overdue_escalation_enabled?: boolean
          overdue_escalation_roles?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      learning_assignments: {
        Row: {
          archived_at: string | null
          assessment_required: boolean
          assigned_by: string | null
          assigned_date: string
          assignment_source: string
          certificate_issued: boolean
          certificate_issued_at: string | null
          certificate_reference: string | null
          completed_at: string | null
          completed_date: string | null
          completion_confirmed_at: string | null
          completion_confirmed_by: number | null
          created_at: string
          due_date: string | null
          employee_id: number
          employee_notes: string | null
          id: number
          is_archived: boolean
          last_activity_at: string | null
          learning_module_id: number
          manager_notes: string | null
          manager_validation_required: boolean
          manager_validation_status: string
          progress_percent: number
          source_reference_id: number | null
          source_reference_type: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          assessment_required?: boolean
          assigned_by?: string | null
          assigned_date?: string
          assignment_source?: string
          certificate_issued?: boolean
          certificate_issued_at?: string | null
          certificate_reference?: string | null
          completed_at?: string | null
          completed_date?: string | null
          completion_confirmed_at?: string | null
          completion_confirmed_by?: number | null
          created_at?: string
          due_date?: string | null
          employee_id: number
          employee_notes?: string | null
          id?: number
          is_archived?: boolean
          last_activity_at?: string | null
          learning_module_id: number
          manager_notes?: string | null
          manager_validation_required?: boolean
          manager_validation_status?: string
          progress_percent?: number
          source_reference_id?: number | null
          source_reference_type?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          assessment_required?: boolean
          assigned_by?: string | null
          assigned_date?: string
          assignment_source?: string
          certificate_issued?: boolean
          certificate_issued_at?: string | null
          certificate_reference?: string | null
          completed_at?: string | null
          completed_date?: string | null
          completion_confirmed_at?: string | null
          completion_confirmed_by?: number | null
          created_at?: string
          due_date?: string | null
          employee_id?: number
          employee_notes?: string | null
          id?: number
          is_archived?: boolean
          last_activity_at?: string | null
          learning_module_id?: number
          manager_notes?: string | null
          manager_validation_required?: boolean
          manager_validation_status?: string
          progress_percent?: number
          source_reference_id?: number | null
          source_reference_type?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_assignments_completion_confirmed_by_fkey"
            columns: ["completion_confirmed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_assignments_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_categories: {
        Row: {
          archived_at: string | null
          colour_reference: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: number
          is_active: boolean
          is_archived: boolean
          name: string
          organisation_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          colour_reference?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: number
          is_active?: boolean
          is_archived?: boolean
          name: string
          organisation_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          colour_reference?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: number
          is_active?: boolean
          is_archived?: boolean
          name?: string
          organisation_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      learning_certificate_configuration: {
        Row: {
          certificate_number_prefix: string
          certificate_number_sequence_start: number
          created_at: string
          default_renewal_reminder_days: number
          default_renewal_required: boolean
          default_validity_months: number | null
          digital_signature_file_path: string | null
          id: number
          include_assessment_score: boolean
          include_completion_date: boolean
          include_employee_number: boolean
          include_expiry_date: boolean
          include_provider: boolean
          organisation_id: string | null
          organisation_logo_file_path: string | null
          public_verification_enabled: boolean
          signatory_name: string | null
          signatory_title: string | null
          updated_at: string
          verification_enabled: boolean
        }
        Insert: {
          certificate_number_prefix?: string
          certificate_number_sequence_start?: number
          created_at?: string
          default_renewal_reminder_days?: number
          default_renewal_required?: boolean
          default_validity_months?: number | null
          digital_signature_file_path?: string | null
          id?: number
          include_assessment_score?: boolean
          include_completion_date?: boolean
          include_employee_number?: boolean
          include_expiry_date?: boolean
          include_provider?: boolean
          organisation_id?: string | null
          organisation_logo_file_path?: string | null
          public_verification_enabled?: boolean
          signatory_name?: string | null
          signatory_title?: string | null
          updated_at?: string
          verification_enabled?: boolean
        }
        Update: {
          certificate_number_prefix?: string
          certificate_number_sequence_start?: number
          created_at?: string
          default_renewal_reminder_days?: number
          default_renewal_required?: boolean
          default_validity_months?: number | null
          digital_signature_file_path?: string | null
          id?: number
          include_assessment_score?: boolean
          include_completion_date?: boolean
          include_employee_number?: boolean
          include_expiry_date?: boolean
          include_provider?: boolean
          organisation_id?: string | null
          organisation_logo_file_path?: string | null
          public_verification_enabled?: boolean
          signatory_name?: string | null
          signatory_title?: string | null
          updated_at?: string
          verification_enabled?: boolean
        }
        Relationships: []
      }
      learning_certificate_settings: {
        Row: {
          certificate_description: string | null
          certificate_reference_prefix: string | null
          certificate_title: string | null
          created_at: string
          id: number
          issue_automatically: boolean
          learning_module_id: number
          manager_approval_required: boolean
          notes: string | null
          organisation_id: string | null
          renewal_reminder_days: number | null
          renewal_required: boolean
          signatory_name: string | null
          signatory_role: string | null
          updated_at: string
          validity_months: number | null
        }
        Insert: {
          certificate_description?: string | null
          certificate_reference_prefix?: string | null
          certificate_title?: string | null
          created_at?: string
          id?: number
          issue_automatically?: boolean
          learning_module_id: number
          manager_approval_required?: boolean
          notes?: string | null
          organisation_id?: string | null
          renewal_reminder_days?: number | null
          renewal_required?: boolean
          signatory_name?: string | null
          signatory_role?: string | null
          updated_at?: string
          validity_months?: number | null
        }
        Update: {
          certificate_description?: string | null
          certificate_reference_prefix?: string | null
          certificate_title?: string | null
          created_at?: string
          id?: number
          issue_automatically?: boolean
          learning_module_id?: number
          manager_approval_required?: boolean
          notes?: string | null
          organisation_id?: string | null
          renewal_reminder_days?: number | null
          renewal_required?: boolean
          signatory_name?: string | null
          signatory_role?: string | null
          updated_at?: string
          validity_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_certificate_settings_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: true
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_certificates_issued: {
        Row: {
          archived_at: string | null
          certificate_reference: string
          certificate_title: string
          created_at: string
          employee_id: number
          employee_qualification_id: number | null
          expiry_date: string | null
          file_name: string | null
          file_path: string | null
          id: number
          is_archived: boolean
          issue_date: string
          issued_by: string | null
          learning_assignment_id: number
          learning_module_id: number
          notes: string | null
          qualification_type_id: number | null
          renewal_reminder_days: number | null
          renewal_required: boolean
          status: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          archived_at?: string | null
          certificate_reference: string
          certificate_title: string
          created_at?: string
          employee_id: number
          employee_qualification_id?: number | null
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: number
          is_archived?: boolean
          issue_date?: string
          issued_by?: string | null
          learning_assignment_id: number
          learning_module_id: number
          notes?: string | null
          qualification_type_id?: number | null
          renewal_reminder_days?: number | null
          renewal_required?: boolean
          status?: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          archived_at?: string | null
          certificate_reference?: string
          certificate_title?: string
          created_at?: string
          employee_id?: number
          employee_qualification_id?: number | null
          expiry_date?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: number
          is_archived?: boolean
          issue_date?: string
          issued_by?: string | null
          learning_assignment_id?: number
          learning_module_id?: number
          notes?: string | null
          qualification_type_id?: number | null
          renewal_reminder_days?: number | null
          renewal_required?: boolean
          status?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_certificates_issued_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_certificates_issued_employee_qualification_id_fkey"
            columns: ["employee_qualification_id"]
            isOneToOne: false
            referencedRelation: "employee_qualifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_certificates_issued_learning_assignment_id_fkey"
            columns: ["learning_assignment_id"]
            isOneToOne: true
            referencedRelation: "learning_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_certificates_issued_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_certificates_issued_qualification_type_id_fkey"
            columns: ["qualification_type_id"]
            isOneToOne: false
            referencedRelation: "qualification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_evidence: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          employee_id: number
          evidence_type: string
          external_url: string | null
          file_name: string | null
          file_path: string | null
          id: number
          is_archived: boolean
          learning_assignment_id: number
          learning_module_id: number
          learning_section_id: number | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: number | null
          reviewer_comments: string | null
          submitted_at: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          employee_id: number
          evidence_type: string
          external_url?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: number
          is_archived?: boolean
          learning_assignment_id: number
          learning_module_id: number
          learning_section_id?: number | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: number | null
          reviewer_comments?: string | null
          submitted_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          employee_id?: number
          evidence_type?: string
          external_url?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: number
          is_archived?: boolean
          learning_assignment_id?: number
          learning_module_id?: number
          learning_section_id?: number | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: number | null
          reviewer_comments?: string | null
          submitted_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_evidence_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_evidence_learning_assignment_id_fkey"
            columns: ["learning_assignment_id"]
            isOneToOne: false
            referencedRelation: "learning_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_evidence_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_evidence_learning_section_id_fkey"
            columns: ["learning_section_id"]
            isOneToOne: false
            referencedRelation: "learning_module_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_evidence_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_manager_validations: {
        Row: {
          archived_at: string | null
          created_at: string
          employee_id: number
          further_action_required: string | null
          id: number
          is_archived: boolean
          learning_assignment_id: number
          learning_module_id: number
          learning_section_id: number | null
          manager_employee_id: number | null
          requested_at: string
          status: string
          updated_at: string
          validated_at: string | null
          validation_summary: string | null
          validation_type: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          employee_id: number
          further_action_required?: string | null
          id?: number
          is_archived?: boolean
          learning_assignment_id: number
          learning_module_id: number
          learning_section_id?: number | null
          manager_employee_id?: number | null
          requested_at?: string
          status?: string
          updated_at?: string
          validated_at?: string | null
          validation_summary?: string | null
          validation_type?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          employee_id?: number
          further_action_required?: string | null
          id?: number
          is_archived?: boolean
          learning_assignment_id?: number
          learning_module_id?: number
          learning_section_id?: number | null
          manager_employee_id?: number | null
          requested_at?: string
          status?: string
          updated_at?: string
          validated_at?: string | null
          validation_summary?: string | null
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_manager_validations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_manager_validations_learning_assignment_id_fkey"
            columns: ["learning_assignment_id"]
            isOneToOne: false
            referencedRelation: "learning_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_manager_validations_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_manager_validations_learning_section_id_fkey"
            columns: ["learning_section_id"]
            isOneToOne: false
            referencedRelation: "learning_module_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_manager_validations_manager_employee_id_fkey"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_media: {
        Row: {
          accessibility_reviewed: boolean
          archived_at: string | null
          captions_url: string | null
          created_at: string
          duration_seconds: number | null
          external_url: string | null
          file_name: string
          file_path: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: number
          is_archived: boolean
          learning_module_id: number | null
          media_type: string
          mime_type: string | null
          organisation_id: string | null
          original_file_name: string | null
          transcript: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          accessibility_reviewed?: boolean
          archived_at?: string | null
          captions_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          external_url?: string | null
          file_name: string
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: number
          is_archived?: boolean
          learning_module_id?: number | null
          media_type: string
          mime_type?: string | null
          organisation_id?: string | null
          original_file_name?: string | null
          transcript?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          accessibility_reviewed?: boolean
          archived_at?: string | null
          captions_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          external_url?: string | null
          file_name?: string
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: number
          is_archived?: boolean
          learning_module_id?: number | null
          media_type?: string
          mime_type?: string | null
          organisation_id?: string | null
          original_file_name?: string | null
          transcript?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_media_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_module_sections: {
        Row: {
          archived_at: string | null
          completion_required: boolean
          content: string | null
          created_at: string
          created_by: string | null
          estimated_duration_minutes: number | null
          id: number
          is_archived: boolean
          learning_module_id: number
          media_id: number | null
          section_type: string
          sequence_number: number
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          completion_required?: boolean
          content?: string | null
          created_at?: string
          created_by?: string | null
          estimated_duration_minutes?: number | null
          id?: number
          is_archived?: boolean
          learning_module_id: number
          media_id?: number | null
          section_type?: string
          sequence_number: number
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          completion_required?: boolean
          content?: string | null
          created_at?: string
          created_by?: string | null
          estimated_duration_minutes?: number | null
          id?: number
          is_archived?: boolean
          learning_module_id?: number
          media_id?: number | null
          section_type?: string
          sequence_number?: number
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_module_sections_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_module_sections_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "learning_media"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_module_tags: {
        Row: {
          learning_module_id: number
          learning_tag_id: number
          linked_at: string
          linked_by: string | null
        }
        Insert: {
          learning_module_id: number
          learning_tag_id: number
          linked_at?: string
          linked_by?: string | null
        }
        Update: {
          learning_module_id?: number
          learning_tag_id?: number
          linked_at?: string
          linked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_module_tags_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_module_tags_learning_tag_id_fkey"
            columns: ["learning_tag_id"]
            isOneToOne: false
            referencedRelation: "learning_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_module_versions: {
        Row: {
          approved_by: string | null
          change_summary: string | null
          created_at: string
          created_by: string | null
          id: number
          learning_module_id: number
          published_at: string | null
          reviewed_by: string | null
          version_number: number
          version_snapshot: Json
        }
        Insert: {
          approved_by?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          learning_module_id: number
          published_at?: string | null
          reviewed_by?: string | null
          version_number: number
          version_snapshot: Json
        }
        Update: {
          approved_by?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          learning_module_id?: number
          published_at?: string | null
          reviewed_by?: string | null
          version_number?: number
          version_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "learning_module_versions_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_modules: {
        Row: {
          archived_at: string | null
          assessment_required: boolean
          assignment_eligible: boolean
          category_id: number | null
          certificate_available: boolean
          created_at: string
          created_by: string | null
          current_version_number: number
          delivery_method: string
          description: string | null
          estimated_duration_minutes: number | null
          id: number
          is_archived: boolean
          last_reviewed_at: string | null
          learning_type: string
          manager_validation_required: boolean
          next_review_date: string | null
          organisation_id: string | null
          owner_user_id: string | null
          provider_id: number | null
          review_frequency_months: number | null
          source_resource_id: number | null
          source_type: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          assessment_required?: boolean
          assignment_eligible?: boolean
          category_id?: number | null
          certificate_available?: boolean
          created_at?: string
          created_by?: string | null
          current_version_number?: number
          delivery_method?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: number
          is_archived?: boolean
          last_reviewed_at?: string | null
          learning_type?: string
          manager_validation_required?: boolean
          next_review_date?: string | null
          organisation_id?: string | null
          owner_user_id?: string | null
          provider_id?: number | null
          review_frequency_months?: number | null
          source_resource_id?: number | null
          source_type?: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          assessment_required?: boolean
          assignment_eligible?: boolean
          category_id?: number | null
          certificate_available?: boolean
          created_at?: string
          created_by?: string | null
          current_version_number?: number
          delivery_method?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: number
          is_archived?: boolean
          last_reviewed_at?: string | null
          learning_type?: string
          manager_validation_required?: boolean
          next_review_date?: string | null
          organisation_id?: string | null
          owner_user_id?: string | null
          provider_id?: number | null
          review_frequency_months?: number | null
          source_resource_id?: number | null
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_modules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "learning_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_modules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "learning_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_notification_settings: {
        Row: {
          assignment_created_employee: boolean
          assignment_created_manager: boolean
          assignment_due_days_before: number[]
          assignment_due_enabled: boolean
          assignment_overdue_employee: boolean
          assignment_overdue_manager: boolean
          assignment_overdue_senior: boolean
          certificate_expiry_days_before: number[]
          certificate_expiry_enabled: boolean
          created_at: string
          digest_day: string
          digest_enabled: boolean
          digest_frequency: string
          digest_recipient_roles: string[]
          id: number
          learning_review_enabled: boolean
          manager_validation_reminders_enabled: boolean
          organisation_id: string | null
          pathway_reminders_enabled: boolean
          qualification_renewal_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
        }
        Insert: {
          assignment_created_employee?: boolean
          assignment_created_manager?: boolean
          assignment_due_days_before?: number[]
          assignment_due_enabled?: boolean
          assignment_overdue_employee?: boolean
          assignment_overdue_manager?: boolean
          assignment_overdue_senior?: boolean
          certificate_expiry_days_before?: number[]
          certificate_expiry_enabled?: boolean
          created_at?: string
          digest_day?: string
          digest_enabled?: boolean
          digest_frequency?: string
          digest_recipient_roles?: string[]
          id?: number
          learning_review_enabled?: boolean
          manager_validation_reminders_enabled?: boolean
          organisation_id?: string | null
          pathway_reminders_enabled?: boolean
          qualification_renewal_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
        }
        Update: {
          assignment_created_employee?: boolean
          assignment_created_manager?: boolean
          assignment_due_days_before?: number[]
          assignment_due_enabled?: boolean
          assignment_overdue_employee?: boolean
          assignment_overdue_manager?: boolean
          assignment_overdue_senior?: boolean
          certificate_expiry_days_before?: number[]
          certificate_expiry_enabled?: boolean
          created_at?: string
          digest_day?: string
          digest_enabled?: boolean
          digest_frequency?: string
          digest_recipient_roles?: string[]
          id?: number
          learning_review_enabled?: boolean
          manager_validation_reminders_enabled?: boolean
          organisation_id?: string | null
          pathway_reminders_enabled?: boolean
          qualification_renewal_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      learning_providers: {
        Row: {
          account_reference: string | null
          accreditation_details: string | null
          archived_at: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: number
          is_active: boolean
          is_archived: boolean
          is_preferred: boolean
          name: string
          notes: string | null
          organisation_id: string | null
          provider_type: string
          telephone: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
          website_url: string | null
        }
        Insert: {
          account_reference?: string | null
          accreditation_details?: string | null
          archived_at?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          is_archived?: boolean
          is_preferred?: boolean
          name: string
          notes?: string | null
          organisation_id?: string | null
          provider_type?: string
          telephone?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
          website_url?: string | null
        }
        Update: {
          account_reference?: string | null
          accreditation_details?: string | null
          archived_at?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: number
          is_active?: boolean
          is_archived?: boolean
          is_preferred?: boolean
          name?: string
          notes?: string | null
          organisation_id?: string | null
          provider_type?: string
          telephone?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      learning_review_rules: {
        Row: {
          accessibility_review_for_digital_learning: boolean
          automatically_archive_superseded_versions: boolean
          automatically_set_under_review: boolean
          created_at: string
          default_review_frequency_months: number
          equality_review_for_people_content: boolean
          id: number
          legal_review_for_compliance_content: boolean
          organisation_id: string | null
          overdue_review_escalation_days: number
          overdue_review_escalation_enabled: boolean
          require_review_after_material_change: boolean
          require_review_before_publish: boolean
          require_version_notes: boolean
          review_owner_role: string
          review_reminder_days_before: number[]
          updated_at: string
        }
        Insert: {
          accessibility_review_for_digital_learning?: boolean
          automatically_archive_superseded_versions?: boolean
          automatically_set_under_review?: boolean
          created_at?: string
          default_review_frequency_months?: number
          equality_review_for_people_content?: boolean
          id?: number
          legal_review_for_compliance_content?: boolean
          organisation_id?: string | null
          overdue_review_escalation_days?: number
          overdue_review_escalation_enabled?: boolean
          require_review_after_material_change?: boolean
          require_review_before_publish?: boolean
          require_version_notes?: boolean
          review_owner_role?: string
          review_reminder_days_before?: number[]
          updated_at?: string
        }
        Update: {
          accessibility_review_for_digital_learning?: boolean
          automatically_archive_superseded_versions?: boolean
          automatically_set_under_review?: boolean
          created_at?: string
          default_review_frequency_months?: number
          equality_review_for_people_content?: boolean
          id?: number
          legal_review_for_compliance_content?: boolean
          organisation_id?: string | null
          overdue_review_escalation_days?: number
          overdue_review_escalation_enabled?: boolean
          require_review_after_material_change?: boolean
          require_review_before_publish?: boolean
          require_version_notes?: boolean
          review_owner_role?: string
          review_reminder_days_before?: number[]
          updated_at?: string
        }
        Relationships: []
      }
      learning_role_permissions: {
        Row: {
          can_archive_learning: boolean
          can_assign_learning: boolean
          can_assign_to_all_employees: boolean
          can_assign_to_team: boolean
          can_complete_professional_reviews: boolean
          can_create_learning: boolean
          can_create_pathways: boolean
          can_edit_learning: boolean
          can_export_data: boolean
          can_import_data: boolean
          can_issue_certificates: boolean
          can_manage_ai_studio: boolean
          can_manage_categories: boolean
          can_manage_providers: boolean
          can_manage_qualifications: boolean
          can_manage_settings: boolean
          can_publish_learning: boolean
          can_restore_learning: boolean
          can_use_ai_studio: boolean
          can_verify_qualifications: boolean
          can_view_all_learning: boolean
          can_view_leo_learn: boolean
          can_view_team_learning: boolean
          created_at: string
          id: number
          role_key: string
          updated_at: string
        }
        Insert: {
          can_archive_learning?: boolean
          can_assign_learning?: boolean
          can_assign_to_all_employees?: boolean
          can_assign_to_team?: boolean
          can_complete_professional_reviews?: boolean
          can_create_learning?: boolean
          can_create_pathways?: boolean
          can_edit_learning?: boolean
          can_export_data?: boolean
          can_import_data?: boolean
          can_issue_certificates?: boolean
          can_manage_ai_studio?: boolean
          can_manage_categories?: boolean
          can_manage_providers?: boolean
          can_manage_qualifications?: boolean
          can_manage_settings?: boolean
          can_publish_learning?: boolean
          can_restore_learning?: boolean
          can_use_ai_studio?: boolean
          can_verify_qualifications?: boolean
          can_view_all_learning?: boolean
          can_view_leo_learn?: boolean
          can_view_team_learning?: boolean
          created_at?: string
          id?: number
          role_key: string
          updated_at?: string
        }
        Update: {
          can_archive_learning?: boolean
          can_assign_learning?: boolean
          can_assign_to_all_employees?: boolean
          can_assign_to_team?: boolean
          can_complete_professional_reviews?: boolean
          can_create_learning?: boolean
          can_create_pathways?: boolean
          can_edit_learning?: boolean
          can_export_data?: boolean
          can_import_data?: boolean
          can_issue_certificates?: boolean
          can_manage_ai_studio?: boolean
          can_manage_categories?: boolean
          can_manage_providers?: boolean
          can_manage_qualifications?: boolean
          can_manage_settings?: boolean
          can_publish_learning?: boolean
          can_restore_learning?: boolean
          can_use_ai_studio?: boolean
          can_verify_qualifications?: boolean
          can_view_all_learning?: boolean
          can_view_leo_learn?: boolean
          can_view_team_learning?: boolean
          created_at?: string
          id?: number
          role_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      learning_section_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          employee_id: number
          employee_notes: string | null
          id: number
          learning_assignment_id: number
          learning_module_id: number
          learning_section_id: number
          manager_notes: string | null
          progress_percent: number
          started_at: string | null
          status: string
          time_spent_seconds: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          employee_id: number
          employee_notes?: string | null
          id?: number
          learning_assignment_id: number
          learning_module_id: number
          learning_section_id: number
          manager_notes?: string | null
          progress_percent?: number
          started_at?: string | null
          status?: string
          time_spent_seconds?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          employee_id?: number
          employee_notes?: string | null
          id?: number
          learning_assignment_id?: number
          learning_module_id?: number
          learning_section_id?: number
          manager_notes?: string | null
          progress_percent?: number
          started_at?: string | null
          status?: string
          time_spent_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_section_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_section_progress_learning_assignment_id_fkey"
            columns: ["learning_assignment_id"]
            isOneToOne: false
            referencedRelation: "learning_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_section_progress_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_section_progress_learning_section_id_fkey"
            columns: ["learning_section_id"]
            isOneToOne: false
            referencedRelation: "learning_module_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_settings: {
        Row: {
          created_at: string
          default_assessment_required: boolean
          default_assignment_due_days: number
          default_assignment_eligible: boolean
          default_certificate_available: boolean
          default_certificate_reminder_days: number
          default_delivery_method: string
          default_duration_minutes: number | null
          default_learning_type: string
          default_manager_validation_required: boolean
          default_review_frequency_months: number
          employee_self_enrolment_enabled: boolean
          id: number
          learning_year_start_day: number
          learning_year_start_month: number
          manager_assignment_enabled: boolean
          manager_team_visibility_enabled: boolean
          organisation_id: string | null
          timezone: string
          updated_at: string
          working_days: string[]
        }
        Insert: {
          created_at?: string
          default_assessment_required?: boolean
          default_assignment_due_days?: number
          default_assignment_eligible?: boolean
          default_certificate_available?: boolean
          default_certificate_reminder_days?: number
          default_delivery_method?: string
          default_duration_minutes?: number | null
          default_learning_type?: string
          default_manager_validation_required?: boolean
          default_review_frequency_months?: number
          employee_self_enrolment_enabled?: boolean
          id?: number
          learning_year_start_day?: number
          learning_year_start_month?: number
          manager_assignment_enabled?: boolean
          manager_team_visibility_enabled?: boolean
          organisation_id?: string | null
          timezone?: string
          updated_at?: string
          working_days?: string[]
        }
        Update: {
          created_at?: string
          default_assessment_required?: boolean
          default_assignment_due_days?: number
          default_assignment_eligible?: boolean
          default_certificate_available?: boolean
          default_certificate_reminder_days?: number
          default_delivery_method?: string
          default_duration_minutes?: number | null
          default_learning_type?: string
          default_manager_validation_required?: boolean
          default_review_frequency_months?: number
          employee_self_enrolment_enabled?: boolean
          id?: number
          learning_year_start_day?: number
          learning_year_start_month?: number
          manager_assignment_enabled?: boolean
          manager_team_visibility_enabled?: boolean
          organisation_id?: string | null
          timezone?: string
          updated_at?: string
          working_days?: string[]
        }
        Relationships: []
      }
      learning_settings_activity_history: {
        Row: {
          activity_summary: string
          activity_type: string
          created_at: string
          id: number
          new_values: Json | null
          organisation_id: string | null
          performed_by_user_id: string | null
          previous_values: Json | null
          settings_area: string
        }
        Insert: {
          activity_summary: string
          activity_type: string
          created_at?: string
          id?: number
          new_values?: Json | null
          organisation_id?: string | null
          performed_by_user_id?: string | null
          previous_values?: Json | null
          settings_area: string
        }
        Update: {
          activity_summary?: string
          activity_type?: string
          created_at?: string
          id?: number
          new_values?: Json | null
          organisation_id?: string | null
          performed_by_user_id?: string | null
          previous_values?: Json | null
          settings_area?: string
        }
        Relationships: []
      }
      learning_tags: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          is_archived: boolean
          name: string
          organisation_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_archived?: boolean
          name: string
          organisation_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_archived?: boolean
          name?: string
          organisation_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_account_security_state: {
        Row: {
          all_sessions_revoked_at: string | null
          created_at: string
          failed_sign_in_count: number
          first_failure_at: string | null
          last_failure_at: string | null
          last_mfa_at: string | null
          last_password_reset_at: string | null
          last_successful_sign_in_at: string | null
          lock_reason: string | null
          locked_at: string | null
          locked_by: string | null
          locked_until: string | null
          metadata: Json
          organisation_id: string
          reauthentication_required: boolean
          recovery_required: boolean
          risk_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          all_sessions_revoked_at?: string | null
          created_at?: string
          failed_sign_in_count?: number
          first_failure_at?: string | null
          last_failure_at?: string | null
          last_mfa_at?: string | null
          last_password_reset_at?: string | null
          last_successful_sign_in_at?: string | null
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locked_until?: string | null
          metadata?: Json
          organisation_id: string
          reauthentication_required?: boolean
          recovery_required?: boolean
          risk_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          all_sessions_revoked_at?: string | null
          created_at?: string
          failed_sign_in_count?: number
          first_failure_at?: string | null
          last_failure_at?: string | null
          last_mfa_at?: string | null
          last_password_reset_at?: string | null
          last_successful_sign_in_at?: string | null
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          locked_until?: string | null
          metadata?: Json
          organisation_id?: string
          reauthentication_required?: boolean
          recovery_required?: boolean
          risk_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leo_ai_authorisation_decisions: {
        Row: {
          actor_user_id: string
          context_categories: string[]
          correlation_id: string | null
          created_at: string
          decision: string
          decision_reason: string
          denied_permission_keys: string[]
          expires_at: string
          granted_permission_keys: string[]
          id: string
          metadata: Json
          module_key: string | null
          organisation_id: string
          purpose_key: string
          reason: string | null
          record_references: Json
          request_id: string | null
          requested_permission_keys: string[]
          special_category_requested: boolean
          workflow_key: string
        }
        Insert: {
          actor_user_id: string
          context_categories?: string[]
          correlation_id?: string | null
          created_at?: string
          decision: string
          decision_reason: string
          denied_permission_keys?: string[]
          expires_at: string
          granted_permission_keys?: string[]
          id?: string
          metadata?: Json
          module_key?: string | null
          organisation_id: string
          purpose_key: string
          reason?: string | null
          record_references?: Json
          request_id?: string | null
          requested_permission_keys?: string[]
          special_category_requested?: boolean
          workflow_key: string
        }
        Update: {
          actor_user_id?: string
          context_categories?: string[]
          correlation_id?: string | null
          created_at?: string
          decision?: string
          decision_reason?: string
          denied_permission_keys?: string[]
          expires_at?: string
          granted_permission_keys?: string[]
          id?: string
          metadata?: Json
          module_key?: string | null
          organisation_id?: string
          purpose_key?: string
          reason?: string | null
          record_references?: Json
          request_id?: string | null
          requested_permission_keys?: string[]
          special_category_requested?: boolean
          workflow_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_ai_authorisation_decisions_purpose_key_fkey"
            columns: ["purpose_key"]
            isOneToOne: false
            referencedRelation: "leo_ai_purposes"
            referencedColumns: ["purpose_key"]
          },
        ]
      }
      leo_ai_control_requirements: {
        Row: {
          configuration: Json
          control_key: string
          control_name: string
          control_type: string
          created_at: string
          created_by: string | null
          id: string
          is_mandatory: boolean
          metadata: Json
          organisation_id: string
          requirement_text: string
          status: string
          updated_at: string
          updated_by: string | null
          use_case_id: string
          waived_at: string | null
          waived_by: string | null
          waiver_reason: string | null
        }
        Insert: {
          configuration?: Json
          control_key: string
          control_name: string
          control_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_mandatory?: boolean
          metadata?: Json
          organisation_id: string
          requirement_text: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          use_case_id: string
          waived_at?: string | null
          waived_by?: string | null
          waiver_reason?: string | null
        }
        Update: {
          configuration?: Json
          control_key?: string
          control_name?: string
          control_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_mandatory?: boolean
          metadata?: Json
          organisation_id?: string
          requirement_text?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          use_case_id?: string
          waived_at?: string | null
          waived_by?: string | null
          waiver_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_ai_control_requirements_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "leo_ai_use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_ai_execution_requests: {
        Row: {
          acting_for_user_id: string | null
          contains_personal_data: boolean
          contains_special_category: boolean
          created_at: string
          data_classification: string
          expires_at: string | null
          human_review_required: boolean
          id: string
          metadata: Json
          organisation_id: string
          permission_snapshot: Json
          purpose: string
          redaction_required: boolean
          rejection_reason: string | null
          request_reference: string
          requested_by: string
          status: string
          subject_id: string | null
          subject_type: string | null
          updated_at: string
          use_case_id: string
        }
        Insert: {
          acting_for_user_id?: string | null
          contains_personal_data?: boolean
          contains_special_category?: boolean
          created_at?: string
          data_classification?: string
          expires_at?: string | null
          human_review_required?: boolean
          id?: string
          metadata?: Json
          organisation_id: string
          permission_snapshot?: Json
          purpose: string
          redaction_required?: boolean
          rejection_reason?: string | null
          request_reference?: string
          requested_by: string
          status?: string
          subject_id?: string | null
          subject_type?: string | null
          updated_at?: string
          use_case_id: string
        }
        Update: {
          acting_for_user_id?: string | null
          contains_personal_data?: boolean
          contains_special_category?: boolean
          created_at?: string
          data_classification?: string
          expires_at?: string | null
          human_review_required?: boolean
          id?: string
          metadata?: Json
          organisation_id?: string
          permission_snapshot?: Json
          purpose?: string
          redaction_required?: boolean
          rejection_reason?: string | null
          request_reference?: string
          requested_by?: string
          status?: string
          subject_id?: string | null
          subject_type?: string | null
          updated_at?: string
          use_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_ai_execution_requests_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "leo_ai_use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_ai_executions: {
        Row: {
          actor_user_id: string
          authorisation_decision_id: string
          completed_at: string | null
          context_record_count: number
          correlation_id: string | null
          created_at: string
          execution_request_id: string | null
          failure_code: string | null
          failure_detail: string | null
          human_reviewed: boolean
          id: string
          input_character_count: number | null
          input_token_count: number | null
          metadata: Json
          model_key: string | null
          module_key: string | null
          organisation_id: string
          output_applied: boolean
          output_character_count: number | null
          output_token_count: number | null
          provider_key: string
          request_id: string | null
          review_outcome: string | null
          started_at: string
          status: string
          updated_at: string
          workflow_key: string
        }
        Insert: {
          actor_user_id: string
          authorisation_decision_id: string
          completed_at?: string | null
          context_record_count?: number
          correlation_id?: string | null
          created_at?: string
          execution_request_id?: string | null
          failure_code?: string | null
          failure_detail?: string | null
          human_reviewed?: boolean
          id?: string
          input_character_count?: number | null
          input_token_count?: number | null
          metadata?: Json
          model_key?: string | null
          module_key?: string | null
          organisation_id: string
          output_applied?: boolean
          output_character_count?: number | null
          output_token_count?: number | null
          provider_key?: string
          request_id?: string | null
          review_outcome?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          workflow_key: string
        }
        Update: {
          actor_user_id?: string
          authorisation_decision_id?: string
          completed_at?: string | null
          context_record_count?: number
          correlation_id?: string | null
          created_at?: string
          execution_request_id?: string | null
          failure_code?: string | null
          failure_detail?: string | null
          human_reviewed?: boolean
          id?: string
          input_character_count?: number | null
          input_token_count?: number | null
          metadata?: Json
          model_key?: string | null
          module_key?: string | null
          organisation_id?: string
          output_applied?: boolean
          output_character_count?: number | null
          output_token_count?: number | null
          provider_key?: string
          request_id?: string | null
          review_outcome?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          workflow_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_ai_executions_authorisation_decision_id_fkey"
            columns: ["authorisation_decision_id"]
            isOneToOne: false
            referencedRelation: "leo_ai_authorisation_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_ai_executions_execution_request_id_fkey"
            columns: ["execution_request_id"]
            isOneToOne: false
            referencedRelation: "leo_ai_execution_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_ai_governance_exceptions: {
        Row: {
          approved_until: string | null
          business_justification: string
          compensating_controls: Json
          created_at: string
          exception_reference: string
          id: string
          metadata: Json
          organisation_id: string
          requested_by: string
          requested_exception: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_assessment: Json
          status: string
          updated_at: string
          use_case_id: string | null
        }
        Insert: {
          approved_until?: string | null
          business_justification: string
          compensating_controls?: Json
          created_at?: string
          exception_reference?: string
          id?: string
          metadata?: Json
          organisation_id: string
          requested_by: string
          requested_exception: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_assessment?: Json
          status?: string
          updated_at?: string
          use_case_id?: string | null
        }
        Update: {
          approved_until?: string | null
          business_justification?: string
          compensating_controls?: Json
          created_at?: string
          exception_reference?: string
          id?: string
          metadata?: Json
          organisation_id?: string
          requested_by?: string
          requested_exception?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_assessment?: Json
          status?: string
          updated_at?: string
          use_case_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_ai_governance_exceptions_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "leo_ai_use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_ai_governance_policies: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          effective_from: string | null
          effective_until: string | null
          external_training_permitted: boolean
          human_review_required: boolean
          id: string
          maximum_prompt_retention_days: number
          maximum_response_retention_days: number
          metadata: Json
          name: string
          organisation_id: string
          permitted_purposes: string[]
          policy_key: string
          policy_version: number
          prohibited_data_categories: string[]
          prohibited_purposes: string[]
          provider_retention_permitted: boolean
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          external_training_permitted?: boolean
          human_review_required?: boolean
          id?: string
          maximum_prompt_retention_days?: number
          maximum_response_retention_days?: number
          metadata?: Json
          name: string
          organisation_id: string
          permitted_purposes?: string[]
          policy_key: string
          policy_version?: number
          prohibited_data_categories?: string[]
          prohibited_purposes?: string[]
          provider_retention_permitted?: boolean
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          external_training_permitted?: boolean
          human_review_required?: boolean
          id?: string
          maximum_prompt_retention_days?: number
          maximum_response_retention_days?: number
          metadata?: Json
          name?: string
          organisation_id?: string
          permitted_purposes?: string[]
          policy_key?: string
          policy_version?: number
          prohibited_data_categories?: string[]
          prohibited_purposes?: string[]
          provider_retention_permitted?: boolean
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_ai_incidents: {
        Row: {
          closed_at: string | null
          contained_at: string | null
          containment_actions: Json
          corrective_actions: Json
          created_at: string
          detail: string | null
          execution_id: string | null
          id: string
          incident_reference: string
          incident_type: string
          metadata: Json
          organisation_id: string
          owner_user_id: string | null
          reported_at: string
          reported_by: string | null
          root_cause: string | null
          severity: string
          status: string
          summary: string
          updated_at: string
          use_case_id: string | null
        }
        Insert: {
          closed_at?: string | null
          contained_at?: string | null
          containment_actions?: Json
          corrective_actions?: Json
          created_at?: string
          detail?: string | null
          execution_id?: string | null
          id?: string
          incident_reference?: string
          incident_type: string
          metadata?: Json
          organisation_id: string
          owner_user_id?: string | null
          reported_at?: string
          reported_by?: string | null
          root_cause?: string | null
          severity: string
          status?: string
          summary: string
          updated_at?: string
          use_case_id?: string | null
        }
        Update: {
          closed_at?: string | null
          contained_at?: string | null
          containment_actions?: Json
          corrective_actions?: Json
          created_at?: string
          detail?: string | null
          execution_id?: string | null
          id?: string
          incident_reference?: string
          incident_type?: string
          metadata?: Json
          organisation_id?: string
          owner_user_id?: string | null
          reported_at?: string
          reported_by?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          summary?: string
          updated_at?: string
          use_case_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_ai_incidents_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "leo_ai_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_ai_incidents_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "leo_ai_use_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_ai_organisation_settings: {
        Row: {
          ai_enabled: boolean
          configuration_reason: string | null
          configured_by: string | null
          created_at: string
          document_context_enabled: boolean
          employee_context_enabled: boolean
          external_search_enabled: boolean
          human_review_required: boolean
          learning_context_enabled: boolean
          matter_context_enabled: boolean
          max_context_characters: number
          metadata: Json
          organisation_id: string
          permitted_purpose_keys: string[]
          prohibited_use_keys: string[]
          retention_mode: string
          special_category_context_enabled: boolean
          talent_context_enabled: boolean
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          configuration_reason?: string | null
          configured_by?: string | null
          created_at?: string
          document_context_enabled?: boolean
          employee_context_enabled?: boolean
          external_search_enabled?: boolean
          human_review_required?: boolean
          learning_context_enabled?: boolean
          matter_context_enabled?: boolean
          max_context_characters?: number
          metadata?: Json
          organisation_id: string
          permitted_purpose_keys?: string[]
          prohibited_use_keys?: string[]
          retention_mode?: string
          special_category_context_enabled?: boolean
          talent_context_enabled?: boolean
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          configuration_reason?: string | null
          configured_by?: string | null
          created_at?: string
          document_context_enabled?: boolean
          employee_context_enabled?: boolean
          external_search_enabled?: boolean
          human_review_required?: boolean
          learning_context_enabled?: boolean
          matter_context_enabled?: boolean
          max_context_characters?: number
          metadata?: Json
          organisation_id?: string
          permitted_purpose_keys?: string[]
          prohibited_use_keys?: string[]
          retention_mode?: string
          special_category_context_enabled?: boolean
          talent_context_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      leo_ai_output_reviews: {
        Row: {
          accuracy_rating: number | null
          amended_output_reference: string | null
          amendment_checksum: string | null
          created_at: string
          disposition_reason: string | null
          execution_id: string
          id: string
          metadata: Json
          organisation_id: string
          relevance_rating: number | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewer_user_id: string
          risk_rating: string | null
          updated_at: string
        }
        Insert: {
          accuracy_rating?: number | null
          amended_output_reference?: string | null
          amendment_checksum?: string | null
          created_at?: string
          disposition_reason?: string | null
          execution_id: string
          id?: string
          metadata?: Json
          organisation_id: string
          relevance_rating?: number | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewer_user_id: string
          risk_rating?: string | null
          updated_at?: string
        }
        Update: {
          accuracy_rating?: number | null
          amended_output_reference?: string | null
          amendment_checksum?: string | null
          created_at?: string
          disposition_reason?: string | null
          execution_id?: string
          id?: string
          metadata?: Json
          organisation_id?: string
          relevance_rating?: number | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewer_user_id?: string
          risk_rating?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_ai_output_reviews_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "leo_ai_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_ai_purposes: {
        Row: {
          created_at: string
          default_risk_level: string
          description: string
          display_name: string
          human_review_required: boolean
          is_active: boolean
          metadata: Json
          purpose_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_risk_level?: string
          description: string
          display_name: string
          human_review_required?: boolean
          is_active?: boolean
          metadata?: Json
          purpose_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_risk_level?: string
          description?: string
          display_name?: string
          human_review_required?: boolean
          is_active?: boolean
          metadata?: Json
          purpose_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      leo_ai_retention_actions: {
        Row: {
          action_type: string
          created_at: string
          executed_at: string | null
          executed_by: string | null
          execution_id: string | null
          failure_detail: string | null
          id: number
          knowledge_source_id: string | null
          metadata: Json
          organisation_id: string
          reason: string
          result_summary: Json
          scheduled_for: string
          status: string
        }
        Insert: {
          action_type: string
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          execution_id?: string | null
          failure_detail?: string | null
          id?: never
          knowledge_source_id?: string | null
          metadata?: Json
          organisation_id: string
          reason: string
          result_summary?: Json
          scheduled_for: string
          status?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          execution_id?: string | null
          failure_detail?: string | null
          id?: never
          knowledge_source_id?: string | null
          metadata?: Json
          organisation_id?: string
          reason?: string
          result_summary?: Json
          scheduled_for?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_ai_retention_actions_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "leo_ai_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_ai_retention_actions_knowledge_source_id_fkey"
            columns: ["knowledge_source_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_ai_retrieval_evidence: {
        Row: {
          access_decision: string
          access_reason: string
          citation_reference: string | null
          execution_id: string
          id: number
          knowledge_source_id: string
          metadata: Json
          organisation_id: string
          relevance_score: number | null
          retrieval_rank: number | null
          retrieved_at: string
          segment_id: string | null
          source_version_id: string | null
        }
        Insert: {
          access_decision: string
          access_reason: string
          citation_reference?: string | null
          execution_id: string
          id?: never
          knowledge_source_id: string
          metadata?: Json
          organisation_id: string
          relevance_score?: number | null
          retrieval_rank?: number | null
          retrieved_at?: string
          segment_id?: string | null
          source_version_id?: string | null
        }
        Update: {
          access_decision?: string
          access_reason?: string
          citation_reference?: string | null
          execution_id?: string
          id?: never
          knowledge_source_id?: string
          metadata?: Json
          organisation_id?: string
          relevance_score?: number | null
          retrieval_rank?: number | null
          retrieved_at?: string
          segment_id?: string | null
          source_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_ai_retrieval_evidence_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "leo_ai_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_ai_retrieval_evidence_knowledge_source_id_fkey"
            columns: ["knowledge_source_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_ai_retrieval_evidence_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_ai_retrieval_evidence_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_ai_use_cases: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          decision_impact: string
          description: string | null
          domain_area: string
          employee_visible: boolean
          human_approval_required: boolean
          human_review_required: boolean
          id: string
          metadata: Json
          model_constraints: Json
          name: string
          organisation_id: string
          output_constraints: Json
          permitted_actor_types: string[]
          permitted_data_categories: string[]
          prohibited_data_categories: string[]
          provider_profile_key: string | null
          purpose: string
          risk_classification: string
          status: string
          updated_at: string
          updated_by: string | null
          use_case_key: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          decision_impact?: string
          description?: string | null
          domain_area: string
          employee_visible?: boolean
          human_approval_required?: boolean
          human_review_required?: boolean
          id?: string
          metadata?: Json
          model_constraints?: Json
          name: string
          organisation_id: string
          output_constraints?: Json
          permitted_actor_types?: string[]
          permitted_data_categories?: string[]
          prohibited_data_categories?: string[]
          provider_profile_key?: string | null
          purpose: string
          risk_classification?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          use_case_key: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          decision_impact?: string
          description?: string | null
          domain_area?: string
          employee_visible?: boolean
          human_approval_required?: boolean
          human_review_required?: boolean
          id?: string
          metadata?: Json
          model_constraints?: Json
          name?: string
          organisation_id?: string
          output_constraints?: Json
          permitted_actor_types?: string[]
          permitted_data_categories?: string[]
          prohibited_data_categories?: string[]
          provider_profile_key?: string | null
          purpose?: string
          risk_classification?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          use_case_key?: string
        }
        Relationships: []
      }
      leo_architecture_control_decisions: {
        Row: {
          approved_at: string
          approved_by: string
          compensating_controls: Json
          control_category: string
          decision: string
          decision_key: string
          decision_status: string
          id: string
          metadata: Json
          next_review_at: string | null
          rationale: string
          review_frequency: string
        }
        Insert: {
          approved_at?: string
          approved_by?: string
          compensating_controls?: Json
          control_category: string
          decision: string
          decision_key: string
          decision_status: string
          id?: string
          metadata?: Json
          next_review_at?: string | null
          rationale: string
          review_frequency?: string
        }
        Update: {
          approved_at?: string
          approved_by?: string
          compensating_controls?: Json
          control_category?: string
          decision?: string
          decision_key?: string
          decision_status?: string
          id?: string
          metadata?: Json
          next_review_at?: string | null
          rationale?: string
          review_frequency?: string
        }
        Relationships: []
      }
      leo_audit_event_types: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          event_category: string
          event_type: string
          is_active: boolean
          is_security_event: boolean
          severity: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          event_category: string
          event_type: string
          is_active?: boolean
          is_security_event?: boolean
          severity?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          event_category?: string
          event_type?: string
          is_active?: boolean
          is_security_event?: boolean
          severity?: string
        }
        Relationships: []
      }
      leo_audit_events: {
        Row: {
          action_label: string | null
          actor_display_name: string | null
          actor_membership_id: string | null
          actor_role: string | null
          actor_type: string
          actor_user_id: string | null
          application_name: string | null
          changed_fields: string[] | null
          client_ip: unknown
          correlation_id: string | null
          employee_id: number | null
          event_category: string
          event_type: string
          id: string
          integrity_hash: string
          matter_id: string | null
          metadata: Json
          module_key: string | null
          new_values: Json | null
          occurred_at: string
          old_values: Json | null
          organisation_id: string
          previous_event_hash: string | null
          record_id: string | null
          recorded_at: string
          request_id: string | null
          session_id: string | null
          severity: string
          source_schema: string | null
          source_table: string | null
          user_agent: string | null
        }
        Insert: {
          action_label?: string | null
          actor_display_name?: string | null
          actor_membership_id?: string | null
          actor_role?: string | null
          actor_type?: string
          actor_user_id?: string | null
          application_name?: string | null
          changed_fields?: string[] | null
          client_ip?: unknown
          correlation_id?: string | null
          employee_id?: number | null
          event_category: string
          event_type: string
          id?: string
          integrity_hash: string
          matter_id?: string | null
          metadata?: Json
          module_key?: string | null
          new_values?: Json | null
          occurred_at?: string
          old_values?: Json | null
          organisation_id: string
          previous_event_hash?: string | null
          record_id?: string | null
          recorded_at?: string
          request_id?: string | null
          session_id?: string | null
          severity?: string
          source_schema?: string | null
          source_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action_label?: string | null
          actor_display_name?: string | null
          actor_membership_id?: string | null
          actor_role?: string | null
          actor_type?: string
          actor_user_id?: string | null
          application_name?: string | null
          changed_fields?: string[] | null
          client_ip?: unknown
          correlation_id?: string | null
          employee_id?: number | null
          event_category?: string
          event_type?: string
          id?: string
          integrity_hash?: string
          matter_id?: string | null
          metadata?: Json
          module_key?: string | null
          new_values?: Json | null
          occurred_at?: string
          old_values?: Json | null
          organisation_id?: string
          previous_event_hash?: string | null
          record_id?: string | null
          recorded_at?: string
          request_id?: string | null
          session_id?: string | null
          severity?: string
          source_schema?: string | null
          source_table?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_audit_events_event_type_fkey"
            columns: ["event_type"]
            isOneToOne: false
            referencedRelation: "leo_audit_event_types"
            referencedColumns: ["event_type"]
          },
        ]
      }
      leo_audit_export_register: {
        Row: {
          approval_required: boolean
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          date_from: string | null
          date_to: string | null
          document_id: string | null
          expires_at: string | null
          export_type: string
          filter_summary: Json
          generated_at: string | null
          generated_by: string | null
          id: string
          includes_sensitive_payload: boolean
          metadata: Json
          organisation_id: string
          purpose: string
          requested_by: string
          revocation_reason: string | null
          revoked_at: string | null
          row_count: number | null
          updated_at: string
        }
        Insert: {
          approval_required?: boolean
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          document_id?: string | null
          expires_at?: string | null
          export_type: string
          filter_summary?: Json
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          includes_sensitive_payload?: boolean
          metadata?: Json
          organisation_id: string
          purpose: string
          requested_by: string
          revocation_reason?: string | null
          revoked_at?: string | null
          row_count?: number | null
          updated_at?: string
        }
        Update: {
          approval_required?: boolean
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          document_id?: string | null
          expires_at?: string | null
          export_type?: string
          filter_summary?: Json
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          includes_sensitive_payload?: boolean
          metadata?: Json
          organisation_id?: string
          purpose?: string
          requested_by?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          row_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      leo_audit_trigger_inventory: {
        Row: {
          audit_status: string
          employee_strategy: string | null
          installed_at: string
          organisation_strategy: string | null
          status_detail: string | null
          table_name: string
          table_schema: string
          trigger_name: string
        }
        Insert: {
          audit_status: string
          employee_strategy?: string | null
          installed_at?: string
          organisation_strategy?: string | null
          status_detail?: string | null
          table_name: string
          table_schema: string
          trigger_name: string
        }
        Update: {
          audit_status?: string
          employee_strategy?: string | null
          installed_at?: string
          organisation_strategy?: string | null
          status_detail?: string | null
          table_name?: string
          table_schema?: string
          trigger_name?: string
        }
        Relationships: []
      }
      leo_authentication_events: {
        Row: {
          auth_provider: string | null
          city_name: string | null
          country_code: string | null
          created_at: string
          device_fingerprint_hash: string | null
          event_type: string
          failure_code: string | null
          id: string
          ip_address: unknown
          membership_id: string | null
          metadata: Json
          occurred_at: string
          organisation_id: string | null
          outcome: string
          region_name: string | null
          risk_factors: Json
          risk_score: number
          session_reference_hash: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth_provider?: string | null
          city_name?: string | null
          country_code?: string | null
          created_at?: string
          device_fingerprint_hash?: string | null
          event_type: string
          failure_code?: string | null
          id?: string
          ip_address?: unknown
          membership_id?: string | null
          metadata?: Json
          occurred_at?: string
          organisation_id?: string | null
          outcome?: string
          region_name?: string | null
          risk_factors?: Json
          risk_score?: number
          session_reference_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth_provider?: string | null
          city_name?: string | null
          country_code?: string | null
          created_at?: string
          device_fingerprint_hash?: string | null
          event_type?: string
          failure_code?: string | null
          id?: string
          ip_address?: unknown
          membership_id?: string | null
          metadata?: Json
          occurred_at?: string
          organisation_id?: string | null
          outcome?: string
          region_name?: string | null
          risk_factors?: Json
          risk_score?: number
          session_reference_hash?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      leo_automation_actions: {
        Row: {
          action_config: Json
          action_key: string
          action_order: number
          action_type: string
          automation_definition_id: string
          compensation_action_config: Json | null
          continue_on_failure: boolean
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          metadata: Json
          organisation_id: string
          required_permission_key: string | null
          requires_approval: boolean
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_key: string
          action_order: number
          action_type: string
          automation_definition_id: string
          compensation_action_config?: Json | null
          continue_on_failure?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          organisation_id: string
          required_permission_key?: string | null
          requires_approval?: boolean
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_key?: string
          action_order?: number
          action_type?: string
          automation_definition_id?: string
          compensation_action_config?: Json | null
          continue_on_failure?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          organisation_id?: string
          required_permission_key?: string | null
          requires_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_automation_actions_automation_definition_id_fkey"
            columns: ["automation_definition_id"]
            isOneToOne: false
            referencedRelation: "leo_automation_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_automation_definitions: {
        Row: {
          archived_at: string | null
          automation_key: string
          concurrency_policy: string
          created_at: string
          created_by: string | null
          description: string | null
          domain_area: string
          execution_mode: string
          id: string
          max_attempts: number
          metadata: Json
          name: string
          organisation_id: string
          published_at: string | null
          published_by: string | null
          requires_approval: boolean
          risk_classification: string
          status: string
          timeout_seconds: number
          trigger_mode: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          archived_at?: string | null
          automation_key: string
          concurrency_policy?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain_area?: string
          execution_mode?: string
          id?: string
          max_attempts?: number
          metadata?: Json
          name: string
          organisation_id: string
          published_at?: string | null
          published_by?: string | null
          requires_approval?: boolean
          risk_classification?: string
          status?: string
          timeout_seconds?: number
          trigger_mode?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          archived_at?: string | null
          automation_key?: string
          concurrency_policy?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain_area?: string
          execution_mode?: string
          id?: string
          max_attempts?: number
          metadata?: Json
          name?: string
          organisation_id?: string
          published_at?: string | null
          published_by?: string | null
          requires_approval?: boolean
          risk_classification?: string
          status?: string
          timeout_seconds?: number
          trigger_mode?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      leo_automation_schedules: {
        Row: {
          automation_definition_id: string | null
          created_at: string
          created_by: string | null
          cron_expression: string | null
          id: string
          interval_seconds: number | null
          last_run_at: string | null
          metadata: Json
          misfire_policy: string
          next_run_at: string | null
          organisation_id: string
          run_at: string | null
          schedule_name: string
          schedule_type: string
          status: string
          timezone_name: string
          updated_at: string
          updated_by: string | null
          workflow_definition_id: string | null
        }
        Insert: {
          automation_definition_id?: string | null
          created_at?: string
          created_by?: string | null
          cron_expression?: string | null
          id?: string
          interval_seconds?: number | null
          last_run_at?: string | null
          metadata?: Json
          misfire_policy?: string
          next_run_at?: string | null
          organisation_id: string
          run_at?: string | null
          schedule_name: string
          schedule_type: string
          status?: string
          timezone_name?: string
          updated_at?: string
          updated_by?: string | null
          workflow_definition_id?: string | null
        }
        Update: {
          automation_definition_id?: string | null
          created_at?: string
          created_by?: string | null
          cron_expression?: string | null
          id?: string
          interval_seconds?: number | null
          last_run_at?: string | null
          metadata?: Json
          misfire_policy?: string
          next_run_at?: string | null
          organisation_id?: string
          run_at?: string | null
          schedule_name?: string
          schedule_type?: string
          status?: string
          timezone_name?: string
          updated_at?: string
          updated_by?: string | null
          workflow_definition_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_automation_schedules_automation_definition_id_fkey"
            columns: ["automation_definition_id"]
            isOneToOne: false
            referencedRelation: "leo_automation_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_automation_schedules_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "leo_workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_automation_security_inventory: {
        Row: {
          canonical: boolean
          has_organisation_id: boolean
          id: number
          inspected_at: string
          notes: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled: boolean
          rls_forced: boolean
          security_status: string
        }
        Insert: {
          canonical?: boolean
          has_organisation_id: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled: boolean
          rls_forced: boolean
          security_status: string
        }
        Update: {
          canonical?: boolean
          has_organisation_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind?: string
          relation_name?: string
          relation_schema?: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Relationships: []
      }
      leo_automation_triggers: {
        Row: {
          automation_definition_id: string
          condition_expression: Json
          created_at: string
          created_by: string | null
          debounce_seconds: number
          event_key: string | null
          id: string
          is_active: boolean
          metadata: Json
          operation: string | null
          organisation_id: string
          source_relation: string | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          automation_definition_id: string
          condition_expression?: Json
          created_at?: string
          created_by?: string | null
          debounce_seconds?: number
          event_key?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          operation?: string | null
          organisation_id: string
          source_relation?: string | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          automation_definition_id?: string
          condition_expression?: Json
          created_at?: string
          created_by?: string | null
          debounce_seconds?: number
          event_key?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          operation?: string | null
          organisation_id?: string
          source_relation?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_automation_triggers_automation_definition_id_fkey"
            columns: ["automation_definition_id"]
            isOneToOne: false
            referencedRelation: "leo_automation_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_billing_export_register: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          expires_at: string | null
          export_scope: string
          id: string
          metadata: Json
          organisation_id: string
          purpose: string
          requested_by: string
          status: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          export_scope?: string
          id?: string
          metadata?: Json
          organisation_id: string
          purpose: string
          requested_by: string
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          export_scope?: string
          id?: string
          metadata?: Json
          organisation_id?: string
          purpose?: string
          requested_by?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leo_billing_invoices: {
        Row: {
          created_at: string
          currency_code: string
          due_at: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_document_path: string | null
          invoice_reference: string
          issued_at: string | null
          metadata: Json
          organisation_id: string
          paid_at: string | null
          provider_invoice_reference: string | null
          provider_key: string | null
          status: string
          subscription_id: string | null
          subtotal_pence: number
          tax_pence: number
          total_pence: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          due_at?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_document_path?: string | null
          invoice_reference: string
          issued_at?: string | null
          metadata?: Json
          organisation_id: string
          paid_at?: string | null
          provider_invoice_reference?: string | null
          provider_key?: string | null
          status?: string
          subscription_id?: string | null
          subtotal_pence?: number
          tax_pence?: number
          total_pence?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          due_at?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_document_path?: string | null
          invoice_reference?: string
          issued_at?: string | null
          metadata?: Json
          organisation_id?: string
          paid_at?: string | null
          provider_invoice_reference?: string | null
          provider_key?: string | null
          status?: string
          subscription_id?: string | null
          subtotal_pence?: number
          tax_pence?: number
          total_pence?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_billing_plan_catalogue: {
        Row: {
          ai_usage_charge_included: boolean
          all_platform_features_included: boolean
          amount_pence: number | null
          billing_interval: string
          created_at: string
          currency_code: string
          effective_from: string | null
          effective_to: string | null
          id: string
          integration_charge_included: boolean
          maximum_employees: number | null
          metadata: Json
          minimum_employees: number
          module_add_ons_allowed: boolean
          name: string
          plan_key: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_usage_charge_included?: boolean
          all_platform_features_included?: boolean
          amount_pence?: number | null
          billing_interval?: string
          created_at?: string
          currency_code?: string
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          integration_charge_included?: boolean
          maximum_employees?: number | null
          metadata?: Json
          minimum_employees?: number
          module_add_ons_allowed?: boolean
          name: string
          plan_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_usage_charge_included?: boolean
          all_platform_features_included?: boolean
          amount_pence?: number | null
          billing_interval?: string
          created_at?: string
          currency_code?: string
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          integration_charge_included?: boolean
          maximum_employees?: number | null
          metadata?: Json
          minimum_employees?: number
          module_add_ons_allowed?: boolean
          name?: string
          plan_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      leo_billing_security_inventory: {
        Row: {
          domain_area: string
          has_organisation_id: boolean
          id: number
          inspected_at: string
          notes: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled: boolean
          rls_forced: boolean
          security_status: string
        }
        Insert: {
          domain_area: string
          has_organisation_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Update: {
          domain_area?: string
          has_organisation_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind?: string
          relation_name?: string
          relation_schema?: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Relationships: []
      }
      leo_billing_subscription_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_payload: Json
          event_type: string
          id: number
          new_status: string | null
          occurred_at: string
          organisation_id: string
          previous_status: string | null
          provider_event_reference: string | null
          provider_key: string | null
          reason: string | null
          subscription_id: string | null
          trial_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_payload?: Json
          event_type: string
          id?: never
          new_status?: string | null
          occurred_at?: string
          organisation_id: string
          previous_status?: string | null
          provider_event_reference?: string | null
          provider_key?: string | null
          reason?: string | null
          subscription_id?: string | null
          trial_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: never
          new_status?: string | null
          occurred_at?: string
          organisation_id?: string
          previous_status?: string | null
          provider_event_reference?: string | null
          provider_key?: string | null
          reason?: string | null
          subscription_id?: string | null
          trial_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_billing_subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_billing_subscription_events_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_trials"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_company_knowledge_items: {
        Row: {
          ai_eligible: boolean
          approved_at: string | null
          approved_by: string | null
          classification: string
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          knowledge_key: string
          knowledge_type: string
          metadata: Json
          organisation_id: string
          published_at: string | null
          published_by: string | null
          status: string
          structured_content: Json
          title: string
          updated_at: string
          updated_by: string | null
          valid_from: string | null
          valid_until: string | null
          version: number
        }
        Insert: {
          ai_eligible?: boolean
          approved_at?: string | null
          approved_by?: string | null
          classification?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          knowledge_key: string
          knowledge_type?: string
          metadata?: Json
          organisation_id: string
          published_at?: string | null
          published_by?: string | null
          status?: string
          structured_content?: Json
          title: string
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          version?: number
        }
        Update: {
          ai_eligible?: boolean
          approved_at?: string | null
          approved_by?: string | null
          classification?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          knowledge_key?: string
          knowledge_type?: string
          metadata?: Json
          organisation_id?: string
          published_at?: string | null
          published_by?: string | null
          status?: string
          structured_content?: Json
          title?: string
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
          version?: number
        }
        Relationships: []
      }
      leo_compliance_control_register: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          archived_by: string | null
          assigned_to_user_id: string | null
          closure_reason: string | null
          completed_at: string | null
          completed_by: string | null
          control_category: string
          control_key: string
          control_name: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          evidence_document_ids: string[]
          evidence_summary: string | null
          id: string
          legal_or_regulatory_basis: string | null
          metadata: Json
          next_review_date: string | null
          organisation_id: string
          owner_user_id: string | null
          priority: string
          recurrence_rule: string | null
          recurring: boolean
          status: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_to_user_id?: string | null
          closure_reason?: string | null
          completed_at?: string | null
          completed_by?: string | null
          control_category?: string
          control_key: string
          control_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          evidence_document_ids?: string[]
          evidence_summary?: string | null
          id?: string
          legal_or_regulatory_basis?: string | null
          metadata?: Json
          next_review_date?: string | null
          organisation_id: string
          owner_user_id?: string | null
          priority?: string
          recurrence_rule?: string | null
          recurring?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_to_user_id?: string | null
          closure_reason?: string | null
          completed_at?: string | null
          completed_by?: string | null
          control_category?: string
          control_key?: string
          control_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          evidence_document_ids?: string[]
          evidence_summary?: string | null
          id?: string
          legal_or_regulatory_basis?: string | null
          metadata?: Json
          next_review_date?: string | null
          organisation_id?: string
          owner_user_id?: string | null
          priority?: string
          recurrence_rule?: string | null
          recurring?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      leo_connection_health_checks: {
        Row: {
          check_type: string
          checked_at: string
          connection_id: string
          error_code: string | null
          error_summary: string | null
          external_status_code: string | null
          health_status: string
          id: string
          metadata: Json
          organisation_id: string
          response_time_ms: number | null
        }
        Insert: {
          check_type?: string
          checked_at?: string
          connection_id: string
          error_code?: string | null
          error_summary?: string | null
          external_status_code?: string | null
          health_status: string
          id?: string
          metadata?: Json
          organisation_id: string
          response_time_ms?: number | null
        }
        Update: {
          check_type?: string
          checked_at?: string
          connection_id?: string
          error_code?: string | null
          error_summary?: string | null
          external_status_code?: string | null
          health_status?: string
          id?: string
          metadata?: Json
          organisation_id?: string
          response_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_connection_health_checks_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_connection_oauth_states: {
        Row: {
          cancelled_at: string | null
          code_verifier_reference: string | null
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          initiated_by: string
          metadata: Json
          organisation_id: string
          provider_id: string
          redirect_uri: string
          requested_scopes: string[]
          return_path: string | null
          state_hash: string
        }
        Insert: {
          cancelled_at?: string | null
          code_verifier_reference?: string | null
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          initiated_by: string
          metadata?: Json
          organisation_id: string
          provider_id: string
          redirect_uri: string
          requested_scopes?: string[]
          return_path?: string | null
          state_hash: string
        }
        Update: {
          cancelled_at?: string | null
          code_verifier_reference?: string | null
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          initiated_by?: string
          metadata?: Json
          organisation_id?: string
          provider_id?: string
          redirect_uri?: string
          requested_scopes?: string[]
          return_path?: string | null
          state_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_connection_oauth_states_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "leo_connection_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_connection_providers: {
        Row: {
          authentication_type: string
          capability_keys: string[]
          configuration_schema: Json
          created_at: string
          description: string
          display_name: string
          display_order: number
          documentation_reference: string | null
          icon_key: string | null
          id: string
          is_active: boolean
          launch_status: string
          metadata: Json
          minimum_scopes: string[]
          optional_scopes: string[]
          provider_category: string
          provider_key: string
          supports_manual_sync: boolean
          supports_oauth: boolean
          supports_scheduled_sync: boolean
          supports_webhooks: boolean
          updated_at: string
        }
        Insert: {
          authentication_type?: string
          capability_keys?: string[]
          configuration_schema?: Json
          created_at?: string
          description: string
          display_name: string
          display_order?: number
          documentation_reference?: string | null
          icon_key?: string | null
          id?: string
          is_active?: boolean
          launch_status?: string
          metadata?: Json
          minimum_scopes?: string[]
          optional_scopes?: string[]
          provider_category?: string
          provider_key: string
          supports_manual_sync?: boolean
          supports_oauth?: boolean
          supports_scheduled_sync?: boolean
          supports_webhooks?: boolean
          updated_at?: string
        }
        Update: {
          authentication_type?: string
          capability_keys?: string[]
          configuration_schema?: Json
          created_at?: string
          description?: string
          display_name?: string
          display_order?: number
          documentation_reference?: string | null
          icon_key?: string | null
          id?: string
          is_active?: boolean
          launch_status?: string
          metadata?: Json
          minimum_scopes?: string[]
          optional_scopes?: string[]
          provider_category?: string
          provider_key?: string
          supports_manual_sync?: boolean
          supports_oauth?: boolean
          supports_scheduled_sync?: boolean
          supports_webhooks?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      leo_connection_secret_references: {
        Row: {
          connection_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          last_rotated_at: string | null
          last_validated_at: string | null
          metadata: Json
          organisation_id: string
          secret_kind: string
          secret_reference: string
          secret_store: string
          secret_version: string | null
          updated_at: string
          updated_by: string | null
          validation_status: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_rotated_at?: string | null
          last_validated_at?: string | null
          metadata?: Json
          organisation_id: string
          secret_kind: string
          secret_reference: string
          secret_store: string
          secret_version?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_status?: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_rotated_at?: string | null
          last_validated_at?: string | null
          metadata?: Json
          organisation_id?: string
          secret_kind?: string
          secret_reference?: string
          secret_store?: string
          secret_version?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_connection_secret_references_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_connection_sync_runs: {
        Row: {
          completed_at: string | null
          connection_id: string
          created_at: string
          cursor_reference: string | null
          direction: string
          error_code: string | null
          error_summary: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          organisation_id: string
          records_created: number
          records_examined: number
          records_failed: number
          records_skipped: number
          records_updated: number
          requested_by: string | null
          retry_of_sync_run_id: string | null
          started_at: string | null
          status: string
          sync_type: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          created_at?: string
          cursor_reference?: string | null
          direction?: string
          error_code?: string | null
          error_summary?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          organisation_id: string
          records_created?: number
          records_examined?: number
          records_failed?: number
          records_skipped?: number
          records_updated?: number
          requested_by?: string | null
          retry_of_sync_run_id?: string | null
          started_at?: string | null
          status?: string
          sync_type: string
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          created_at?: string
          cursor_reference?: string | null
          direction?: string
          error_code?: string | null
          error_summary?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          organisation_id?: string
          records_created?: number
          records_examined?: number
          records_failed?: number
          records_skipped?: number
          records_updated?: number
          requested_by?: string | null
          retry_of_sync_run_id?: string | null
          started_at?: string | null
          status?: string
          sync_type?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_connection_sync_runs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_connection_sync_runs_retry_of_sync_run_id_fkey"
            columns: ["retry_of_sync_run_id"]
            isOneToOne: false
            referencedRelation: "leo_connection_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_connection_webhook_endpoints: {
        Row: {
          connection_id: string
          created_at: string
          created_by: string | null
          endpoint_reference: string
          expires_at: string | null
          external_webhook_id: string | null
          failure_count: number
          id: string
          last_event_received_at: string | null
          last_verified_at: string | null
          metadata: Json
          organisation_id: string
          signing_secret_reference_id: string | null
          status: string
          subscribed_events: string[]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string
          created_by?: string | null
          endpoint_reference: string
          expires_at?: string | null
          external_webhook_id?: string | null
          failure_count?: number
          id?: string
          last_event_received_at?: string | null
          last_verified_at?: string | null
          metadata?: Json
          organisation_id: string
          signing_secret_reference_id?: string | null
          status?: string
          subscribed_events?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string
          created_by?: string | null
          endpoint_reference?: string
          expires_at?: string | null
          external_webhook_id?: string | null
          failure_count?: number
          id?: string
          last_event_received_at?: string | null
          last_verified_at?: string | null
          metadata?: Json
          organisation_id?: string
          signing_secret_reference_id?: string | null
          status?: string
          subscribed_events?: string[]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_connection_webhook_endpoin_signing_secret_reference_id_fkey"
            columns: ["signing_secret_reference_id"]
            isOneToOne: false
            referencedRelation: "leo_connection_secret_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_connection_webhook_endpoints_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_connection_webhook_events: {
        Row: {
          connection_id: string
          error_code: string | null
          error_summary: string | null
          event_type: string
          external_event_id: string | null
          id: string
          metadata: Json
          organisation_id: string
          payload_hash: string | null
          payload_summary: Json
          processed_at: string | null
          processing_status: string
          received_at: string
          retention_until: string
          signature_status: string
          webhook_endpoint_id: string | null
        }
        Insert: {
          connection_id: string
          error_code?: string | null
          error_summary?: string | null
          event_type: string
          external_event_id?: string | null
          id?: string
          metadata?: Json
          organisation_id: string
          payload_hash?: string | null
          payload_summary?: Json
          processed_at?: string | null
          processing_status?: string
          received_at?: string
          retention_until?: string
          signature_status?: string
          webhook_endpoint_id?: string | null
        }
        Update: {
          connection_id?: string
          error_code?: string | null
          error_summary?: string | null
          event_type?: string
          external_event_id?: string | null
          id?: string
          metadata?: Json
          organisation_id?: string
          payload_hash?: string | null
          payload_summary?: Json
          processed_at?: string | null
          processing_status?: string
          received_at?: string
          retention_until?: string
          signature_status?: string
          webhook_endpoint_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_connection_webhook_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_connection_webhook_events_webhook_endpoint_id_fkey"
            columns: ["webhook_endpoint_id"]
            isOneToOne: false
            referencedRelation: "leo_connection_webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_controlled_changes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_key: string
          change_type: string
          completed_at: string | null
          description: string
          executed_at: string | null
          executed_by: string | null
          id: string
          metadata: Json
          requested_at: string
          requested_by: string | null
          rollback_reference: string | null
          source_reference: string | null
          status: string
          validation_run_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_key: string
          change_type: string
          completed_at?: string | null
          description: string
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          metadata?: Json
          requested_at?: string
          requested_by?: string | null
          rollback_reference?: string | null
          source_reference?: string | null
          status: string
          validation_run_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_key?: string
          change_type?: string
          completed_at?: string | null
          description?: string
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          metadata?: Json
          requested_at?: string
          requested_by?: string | null
          rollback_reference?: string | null
          source_reference?: string | null
          status?: string
          validation_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_controlled_changes_validation_run_id_fkey"
            columns: ["validation_run_id"]
            isOneToOne: false
            referencedRelation: "leo_platform_health"
            referencedColumns: ["validation_run_id"]
          },
          {
            foreignKeyName: "leo_controlled_changes_validation_run_id_fkey"
            columns: ["validation_run_id"]
            isOneToOne: false
            referencedRelation: "leo_platform_validation_latest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_controlled_changes_validation_run_id_fkey"
            columns: ["validation_run_id"]
            isOneToOne: false
            referencedRelation: "leo_platform_validation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_data_exports: {
        Row: {
          approval_reason: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          download_count: number
          encryption_method: string | null
          expires_at: string | null
          export_reference: string
          export_type: string
          failure_reason: string | null
          file_sha256: string | null
          file_size_bytes: number | null
          id: string
          last_downloaded_at: string | null
          last_downloaded_by: string | null
          metadata: Json
          organisation_id: string
          processing_started_at: string | null
          purpose: string
          ready_at: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requested_at: string
          requested_by: string
          requested_scope: Json
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          updated_at: string
          updated_by: string | null
          watermark_applied: boolean
        }
        Insert: {
          approval_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          download_count?: number
          encryption_method?: string | null
          expires_at?: string | null
          export_reference?: string
          export_type: string
          failure_reason?: string | null
          file_sha256?: string | null
          file_size_bytes?: number | null
          id?: string
          last_downloaded_at?: string | null
          last_downloaded_by?: string | null
          metadata?: Json
          organisation_id: string
          processing_started_at?: string | null
          purpose: string
          ready_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string
          requested_scope?: Json
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          updated_at?: string
          updated_by?: string | null
          watermark_applied?: boolean
        }
        Update: {
          approval_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          download_count?: number
          encryption_method?: string | null
          expires_at?: string | null
          export_reference?: string
          export_type?: string
          failure_reason?: string | null
          file_sha256?: string | null
          file_size_bytes?: number | null
          id?: string
          last_downloaded_at?: string | null
          last_downloaded_by?: string | null
          metadata?: Json
          organisation_id?: string
          processing_started_at?: string | null
          purpose?: string
          ready_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string
          requested_scope?: Json
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          updated_at?: string
          updated_by?: string | null
          watermark_applied?: boolean
        }
        Relationships: []
      }
      leo_data_quarantine: {
        Row: {
          id: string
          quarantine_reason: string
          quarantined_at: string
          remediation_run_id: string
          resolution_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          row_data: Json
          source_row_identifier: string | null
          source_schema: string
          source_table: string
        }
        Insert: {
          id?: string
          quarantine_reason: string
          quarantined_at?: string
          remediation_run_id: string
          resolution_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          row_data: Json
          source_row_identifier?: string | null
          source_schema: string
          source_table: string
        }
        Update: {
          id?: string
          quarantine_reason?: string
          quarantined_at?: string
          remediation_run_id?: string
          resolution_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          row_data?: Json
          source_row_identifier?: string | null
          source_schema?: string
          source_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_data_quarantine_remediation_run_id_fkey"
            columns: ["remediation_run_id"]
            isOneToOne: false
            referencedRelation: "leo_data_remediation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_data_quarantine_allowances: {
        Row: {
          allowance_type: string
          approved_by_migration: string
          created_at: string
          id: string
          maximum_live_null_rows: number
          metadata: Json
          reason: string
          source_schema: string
          source_table: string
          updated_at: string
        }
        Insert: {
          allowance_type?: string
          approved_by_migration: string
          created_at?: string
          id?: string
          maximum_live_null_rows: number
          metadata?: Json
          reason: string
          source_schema: string
          source_table: string
          updated_at?: string
        }
        Update: {
          allowance_type?: string
          approved_by_migration?: string
          created_at?: string
          id?: string
          maximum_live_null_rows?: number
          metadata?: Json
          reason?: string
          source_schema?: string
          source_table?: string
          updated_at?: string
        }
        Relationships: []
      }
      leo_data_remediation_actions: {
        Row: {
          action_type: string
          created_at: string
          details: Json
          id: number
          remediation_run_id: string
          resolution_method: string | null
          resolved_organisation_id: string | null
          row_snapshot: Json | null
          schema_name: string
          source_row_identifier: string | null
          table_name: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json
          id?: never
          remediation_run_id: string
          resolution_method?: string | null
          resolved_organisation_id?: string | null
          row_snapshot?: Json | null
          schema_name: string
          source_row_identifier?: string | null
          table_name: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json
          id?: never
          remediation_run_id?: string
          resolution_method?: string | null
          resolved_organisation_id?: string | null
          row_snapshot?: Json | null
          schema_name?: string
          source_row_identifier?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_data_remediation_actions_remediation_run_id_fkey"
            columns: ["remediation_run_id"]
            isOneToOne: false
            referencedRelation: "leo_data_remediation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_data_remediation_runs: {
        Row: {
          completed_at: string | null
          global_tables_classified: number
          id: string
          metadata: Json
          migration_key: string
          rows_examined: number
          rows_quarantined: number
          rows_removed_after_quarantine: number
          rows_repaired: number
          started_at: string
          status: string
          tenant_tables_classified: number
          warnings: Json
        }
        Insert: {
          completed_at?: string | null
          global_tables_classified?: number
          id?: string
          metadata?: Json
          migration_key: string
          rows_examined?: number
          rows_quarantined?: number
          rows_removed_after_quarantine?: number
          rows_repaired?: number
          started_at?: string
          status?: string
          tenant_tables_classified?: number
          warnings?: Json
        }
        Update: {
          completed_at?: string | null
          global_tables_classified?: number
          id?: string
          metadata?: Json
          migration_key?: string
          rows_examined?: number
          rows_quarantined?: number
          rows_removed_after_quarantine?: number
          rows_repaired?: number
          started_at?: string
          status?: string
          tenant_tables_classified?: number
          warnings?: Json
        }
        Relationships: []
      }
      leo_data_scope_classifications: {
        Row: {
          approved_by_migration: string
          classification_reason: string
          created_at: string
          metadata: Json
          null_organisation_permitted: boolean
          schema_name: string
          scope_classification: string
          table_name: string
          updated_at: string
        }
        Insert: {
          approved_by_migration: string
          classification_reason: string
          created_at?: string
          metadata?: Json
          null_organisation_permitted?: boolean
          schema_name?: string
          scope_classification: string
          table_name: string
          updated_at?: string
        }
        Update: {
          approved_by_migration?: string
          classification_reason?: string
          created_at?: string
          metadata?: Json
          null_organisation_permitted?: boolean
          schema_name?: string
          scope_classification?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leo_dead_letter_jobs: {
        Row: {
          correlation_id: string | null
          dead_lettered_at: string
          disposition_reason: string | null
          failure_count: number
          final_error: Json
          id: number
          job_type: string
          metadata: Json
          organisation_id: string
          original_job_id: string
          payload: Json
          queue_name: string
          replay_job_id: string | null
          replay_requested_at: string | null
          replay_requested_by: string | null
          replay_status: string
        }
        Insert: {
          correlation_id?: string | null
          dead_lettered_at?: string
          disposition_reason?: string | null
          failure_count: number
          final_error: Json
          id?: never
          job_type: string
          metadata?: Json
          organisation_id: string
          original_job_id: string
          payload: Json
          queue_name: string
          replay_job_id?: string | null
          replay_requested_at?: string | null
          replay_requested_by?: string | null
          replay_status?: string
        }
        Update: {
          correlation_id?: string | null
          dead_lettered_at?: string
          disposition_reason?: string | null
          failure_count?: number
          final_error?: Json
          id?: never
          job_type?: string
          metadata?: Json
          organisation_id?: string
          original_job_id?: string
          payload?: Json
          queue_name?: string
          replay_job_id?: string | null
          replay_requested_at?: string | null
          replay_requested_by?: string | null
          replay_status?: string
        }
        Relationships: []
      }
      leo_document_access_events: {
        Row: {
          access_granted: boolean
          access_reason: string | null
          access_type: string
          actor_user_id: string | null
          denial_reason: string | null
          document_id: string
          document_version_id: string | null
          id: string
          ip_address: unknown
          metadata: Json
          occurred_at: string
          organisation_id: string
          request_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_granted: boolean
          access_reason?: string | null
          access_type: string
          actor_user_id?: string | null
          denial_reason?: string | null
          document_id: string
          document_version_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          occurred_at?: string
          organisation_id: string
          request_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_granted?: boolean
          access_reason?: string | null
          access_type?: string
          actor_user_id?: string | null
          denial_reason?: string | null
          document_id?: string
          document_version_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json
          occurred_at?: string
          organisation_id?: string
          request_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_document_access_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "leo_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_document_access_events_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "leo_document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_document_retention_actions: {
        Row: {
          action_type: string
          authorised_by: string | null
          created_at: string
          document_id: string
          id: string
          metadata: Json
          new_legal_hold: boolean | null
          new_retention_until: string | null
          organisation_id: string
          previous_legal_hold: boolean | null
          previous_retention_until: string | null
          reason: string
        }
        Insert: {
          action_type: string
          authorised_by?: string | null
          created_at?: string
          document_id: string
          id?: string
          metadata?: Json
          new_legal_hold?: boolean | null
          new_retention_until?: string | null
          organisation_id: string
          previous_legal_hold?: boolean | null
          previous_retention_until?: string | null
          reason: string
        }
        Update: {
          action_type?: string
          authorised_by?: string | null
          created_at?: string
          document_id?: string
          id?: string
          metadata?: Json
          new_legal_hold?: boolean | null
          new_retention_until?: string | null
          organisation_id?: string
          previous_legal_hold?: boolean | null
          previous_retention_until?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_document_retention_actions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "leo_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_document_security_inventory: {
        Row: {
          employee_column: string | null
          inspected_at: string
          migration_status: string
          notes: string | null
          organisation_column: string | null
          rls_enabled: boolean
          source_schema: string
          source_table: string
          storage_path_column: string | null
        }
        Insert: {
          employee_column?: string | null
          inspected_at?: string
          migration_status?: string
          notes?: string | null
          organisation_column?: string | null
          rls_enabled?: boolean
          source_schema: string
          source_table: string
          storage_path_column?: string | null
        }
        Update: {
          employee_column?: string | null
          inspected_at?: string
          migration_status?: string
          notes?: string | null
          organisation_column?: string | null
          rls_enabled?: boolean
          source_schema?: string
          source_table?: string
          storage_path_column?: string | null
        }
        Relationships: []
      }
      leo_document_versions: {
        Row: {
          bucket_id: string
          content_sha256: string | null
          created_at: string
          document_id: string
          file_extension: string | null
          id: string
          metadata: Json
          mime_type: string
          object_path: string
          organisation_id: string
          original_file_name: string
          size_bytes: number
          stored_file_name: string
          superseded_at: string | null
          superseded_by: string | null
          upload_status: string
          uploaded_at: string | null
          uploaded_by: string | null
          version_number: number
          virus_scan_provider: string | null
          virus_scan_reference: string | null
          virus_scan_status: string
          virus_scanned_at: string | null
        }
        Insert: {
          bucket_id?: string
          content_sha256?: string | null
          created_at?: string
          document_id: string
          file_extension?: string | null
          id?: string
          metadata?: Json
          mime_type: string
          object_path: string
          organisation_id: string
          original_file_name: string
          size_bytes: number
          stored_file_name: string
          superseded_at?: string | null
          superseded_by?: string | null
          upload_status?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          version_number: number
          virus_scan_provider?: string | null
          virus_scan_reference?: string | null
          virus_scan_status?: string
          virus_scanned_at?: string | null
        }
        Update: {
          bucket_id?: string
          content_sha256?: string | null
          created_at?: string
          document_id?: string
          file_extension?: string | null
          id?: string
          metadata?: Json
          mime_type?: string
          object_path?: string
          organisation_id?: string
          original_file_name?: string
          size_bytes?: number
          stored_file_name?: string
          superseded_at?: string | null
          superseded_by?: string | null
          upload_status?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          version_number?: number
          virus_scan_provider?: string | null
          virus_scan_reference?: string | null
          virus_scan_status?: string
          virus_scanned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "leo_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_documents: {
        Row: {
          classification: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          description: string | null
          disposal_due_at: string | null
          document_reference: string
          document_type: string
          employee_can_download: boolean
          employee_id: number | null
          employee_visible: boolean
          id: string
          legal_hold: boolean
          legal_hold_reason: string | null
          legal_hold_set_at: string | null
          legal_hold_set_by: string | null
          metadata: Json
          module_key: string
          organisation_id: string
          owner_user_id: string | null
          retention_category: string
          retention_until: string | null
          source_record_id: string | null
          source_table: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          classification?: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          disposal_due_at?: string | null
          document_reference?: string
          document_type?: string
          employee_can_download?: boolean
          employee_id?: number | null
          employee_visible?: boolean
          id?: string
          legal_hold?: boolean
          legal_hold_reason?: string | null
          legal_hold_set_at?: string | null
          legal_hold_set_by?: string | null
          metadata?: Json
          module_key?: string
          organisation_id: string
          owner_user_id?: string | null
          retention_category?: string
          retention_until?: string | null
          source_record_id?: string | null
          source_table?: string | null
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          classification?: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          description?: string | null
          disposal_due_at?: string | null
          document_reference?: string
          document_type?: string
          employee_can_download?: boolean
          employee_id?: number | null
          employee_visible?: boolean
          id?: string
          legal_hold?: boolean
          legal_hold_reason?: string | null
          legal_hold_set_at?: string | null
          legal_hold_set_by?: string | null
          metadata?: Json
          module_key?: string
          organisation_id?: string
          owner_user_id?: string | null
          retention_category?: string
          retention_until?: string | null
          source_record_id?: string | null
          source_table?: string | null
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_documents_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "leo_document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_domain_events: {
        Row: {
          actor_user_id: string | null
          aggregate_id: string | null
          aggregate_type: string | null
          causation_id: string | null
          correlation_id: string
          created_at: string
          event_key: string
          event_version: number
          id: number
          occurred_at: string
          organisation_id: string
          payload: Json
          processed_at: string | null
          sensitivity: string
        }
        Insert: {
          actor_user_id?: string | null
          aggregate_id?: string | null
          aggregate_type?: string | null
          causation_id?: string | null
          correlation_id?: string
          created_at?: string
          event_key: string
          event_version?: number
          id?: never
          occurred_at?: string
          organisation_id: string
          payload?: Json
          processed_at?: string | null
          sensitivity?: string
        }
        Update: {
          actor_user_id?: string | null
          aggregate_id?: string | null
          aggregate_type?: string | null
          causation_id?: string | null
          correlation_id?: string
          created_at?: string
          event_key?: string
          event_version?: number
          id?: never
          occurred_at?: string
          organisation_id?: string
          payload?: Json
          processed_at?: string | null
          sensitivity?: string
        }
        Relationships: []
      }
      leo_employee_security_inventory: {
        Row: {
          allows_self_read: boolean
          employee_column: string | null
          is_sensitive: boolean
          organisation_column: string | null
          policy_status: string
          secured_at: string
          status_detail: string | null
          table_name: string
          table_schema: string
        }
        Insert: {
          allows_self_read?: boolean
          employee_column?: string | null
          is_sensitive?: boolean
          organisation_column?: string | null
          policy_status: string
          secured_at?: string
          status_detail?: string | null
          table_name: string
          table_schema: string
        }
        Update: {
          allows_self_read?: boolean
          employee_column?: string | null
          is_sensitive?: boolean
          organisation_column?: string | null
          policy_status?: string
          secured_at?: string
          status_detail?: string | null
          table_name?: string
          table_schema?: string
        }
        Relationships: []
      }
      leo_foundation_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          effective_from: string | null
          id: string
          metadata: Json
          organisation_id: string
          profile_key: string
          profile_name: string
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          id?: string
          metadata?: Json
          organisation_id: string
          profile_key?: string
          profile_name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          id?: string
          metadata?: Json
          organisation_id?: string
          profile_key?: string
          profile_name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      leo_foundation_sections: {
        Row: {
          completion_status: string
          content: Json
          created_at: string
          created_by: string | null
          foundation_profile_id: string
          id: string
          metadata: Json
          organisation_id: string
          section_key: string
          section_name: string
          section_order: number
          source_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          completion_status?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          foundation_profile_id: string
          id?: string
          metadata?: Json
          organisation_id: string
          section_key: string
          section_name: string
          section_order?: number
          source_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          completion_status?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          foundation_profile_id?: string
          id?: string
          metadata?: Json
          organisation_id?: string
          section_key?: string
          section_name?: string
          section_order?: number
          source_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_foundation_sections_foundation_profile_id_fkey"
            columns: ["foundation_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_foundation_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_foundations_security_inventory: {
        Row: {
          domain_area: string
          has_organisation_id: boolean
          id: number
          inspected_at: string
          notes: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled: boolean
          rls_forced: boolean
          security_status: string
        }
        Insert: {
          domain_area: string
          has_organisation_id: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled: boolean
          rls_forced: boolean
          security_status: string
        }
        Update: {
          domain_area?: string
          has_organisation_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind?: string
          relation_name?: string
          relation_schema?: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Relationships: []
      }
      leo_governance_security_inventory: {
        Row: {
          domain_area: string
          has_assigned_to_user_id: boolean
          has_employee_id: boolean
          has_organisation_id: boolean
          id: number
          inspected_at: string
          notes: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled: boolean
          rls_forced: boolean
          security_status: string
        }
        Insert: {
          domain_area: string
          has_assigned_to_user_id?: boolean
          has_employee_id?: boolean
          has_organisation_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Update: {
          domain_area?: string
          has_assigned_to_user_id?: boolean
          has_employee_id?: boolean
          has_organisation_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind?: string
          relation_name?: string
          relation_schema?: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Relationships: []
      }
      leo_hr_resource_publication_register: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content_hash: string | null
          created_at: string
          drafted_by: string | null
          effective_from: string | null
          id: string
          metadata: Json
          organisation_id: string
          published_at: string | null
          published_by: string | null
          resource_id: string | null
          resource_key: string
          resource_type: string
          review_due_on: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_document_id: string | null
          status: string
          supersedes_id: string | null
          title: string
          updated_at: string
          version_label: string
          withdrawal_reason: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content_hash?: string | null
          created_at?: string
          drafted_by?: string | null
          effective_from?: string | null
          id?: string
          metadata?: Json
          organisation_id: string
          published_at?: string | null
          published_by?: string | null
          resource_id?: string | null
          resource_key: string
          resource_type?: string
          review_due_on?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document_id?: string | null
          status?: string
          supersedes_id?: string | null
          title: string
          updated_at?: string
          version_label: string
          withdrawal_reason?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content_hash?: string | null
          created_at?: string
          drafted_by?: string | null
          effective_from?: string | null
          id?: string
          metadata?: Json
          organisation_id?: string
          published_at?: string | null
          published_by?: string | null
          resource_id?: string | null
          resource_key?: string
          resource_type?: string
          review_due_on?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_document_id?: string | null
          status?: string
          supersedes_id?: string | null
          title?: string
          updated_at?: string
          version_label?: string
          withdrawal_reason?: string | null
        }
        Relationships: []
      }
      leo_insight_dashboards: {
        Row: {
          audience: string
          configuration: Json
          created_at: string
          created_by: string | null
          dashboard_type: string
          description: string | null
          id: string
          is_archived: boolean
          is_default: boolean
          metadata: Json
          organisation_id: string
          owner_user_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          audience?: string
          configuration?: Json
          created_at?: string
          created_by?: string | null
          dashboard_type?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_default?: boolean
          metadata?: Json
          organisation_id: string
          owner_user_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          audience?: string
          configuration?: Json
          created_at?: string
          created_by?: string | null
          dashboard_type?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_default?: boolean
          metadata?: Json
          organisation_id?: string
          owner_user_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_insight_exports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_purpose: string
          contains_sensitive_data: boolean
          expires_at: string | null
          export_type: string
          file_path: string | null
          filters: Json
          id: string
          metadata: Json
          organisation_id: string
          requested_at: string
          requested_by: string | null
          row_count: number | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_purpose: string
          contains_sensitive_data?: boolean
          expires_at?: string | null
          export_type: string
          file_path?: string | null
          filters?: Json
          id?: string
          metadata?: Json
          organisation_id: string
          requested_at?: string
          requested_by?: string | null
          row_count?: number | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_purpose?: string
          contains_sensitive_data?: boolean
          expires_at?: string | null
          export_type?: string
          file_path?: string | null
          filters?: Json
          id?: string
          metadata?: Json
          organisation_id?: string
          requested_at?: string
          requested_by?: string | null
          row_count?: number | null
          status?: string
        }
        Relationships: []
      }
      leo_insight_metric_definitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          calculation_method: string
          contains_sensitive_data: boolean
          created_at: string
          created_by: string | null
          description: string | null
          dimensions: Json
          domain_area: string
          id: string
          is_active: boolean
          metadata: Json
          metric_key: string
          metric_name: string
          minimum_group_size: number
          organisation_id: string
          source_relations: Json
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          calculation_method: string
          contains_sensitive_data?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: Json
          domain_area?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          metric_key: string
          metric_name: string
          minimum_group_size?: number
          organisation_id: string
          source_relations?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          calculation_method?: string
          contains_sensitive_data?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          dimensions?: Json
          domain_area?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          metric_key?: string
          metric_name?: string
          minimum_group_size?: number
          organisation_id?: string
          source_relations?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      leo_insight_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contains_sensitive_data: boolean
          created_at: string
          created_by: string | null
          generated_content: Json
          id: string
          issued_at: string | null
          issued_by: string | null
          metadata: Json
          organisation_id: string
          period_end: string | null
          period_start: string | null
          report_definition: Json
          report_type: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contains_sensitive_data?: boolean
          created_at?: string
          created_by?: string | null
          generated_content?: Json
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          metadata?: Json
          organisation_id: string
          period_end?: string | null
          period_start?: string | null
          report_definition?: Json
          report_type?: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contains_sensitive_data?: boolean
          created_at?: string
          created_by?: string | null
          generated_content?: Json
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          metadata?: Json
          organisation_id?: string
          period_end?: string | null
          period_start?: string | null
          report_definition?: Json
          report_type?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_insight_snapshots: {
        Row: {
          denominator: number | null
          dimension_values: Json
          generated_at: string
          generated_by: string | null
          id: number
          is_suppressed: boolean
          metadata: Json
          metric_definition_id: string | null
          metric_key: string
          metric_value: number | null
          numerator: number | null
          organisation_id: string
          record_count: number
          snapshot_date: string
          source_watermark: Json
          suppression_reason: string | null
        }
        Insert: {
          denominator?: number | null
          dimension_values?: Json
          generated_at?: string
          generated_by?: string | null
          id?: never
          is_suppressed?: boolean
          metadata?: Json
          metric_definition_id?: string | null
          metric_key: string
          metric_value?: number | null
          numerator?: number | null
          organisation_id: string
          record_count?: number
          snapshot_date: string
          source_watermark?: Json
          suppression_reason?: string | null
        }
        Update: {
          denominator?: number | null
          dimension_values?: Json
          generated_at?: string
          generated_by?: string | null
          id?: never
          is_suppressed?: boolean
          metadata?: Json
          metric_definition_id?: string | null
          metric_key?: string
          metric_value?: number | null
          numerator?: number | null
          organisation_id?: string
          record_count?: number
          snapshot_date?: string
          source_watermark?: Json
          suppression_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_insight_snapshots_metric_definition_id_fkey"
            columns: ["metric_definition_id"]
            isOneToOne: false
            referencedRelation: "leo_insight_metric_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_insights_security_inventory: {
        Row: {
          domain_area: string
          has_organisation_id: boolean
          id: number
          inspected_at: string
          notes: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled: boolean
          rls_forced: boolean
          security_status: string
        }
        Insert: {
          domain_area: string
          has_organisation_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Update: {
          domain_area?: string
          has_organisation_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind?: string
          relation_name?: string
          relation_schema?: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Relationships: []
      }
      leo_job_queue: {
        Row: {
          attempt_count: number
          available_at: string
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          correlation_id: string
          created_at: string
          id: string
          idempotency_key: string | null
          job_type: string
          last_error: Json | null
          lease_expires_at: string | null
          max_attempts: number
          metadata: Json
          notification_id: string | null
          organisation_id: string
          payload: Json
          priority: number
          queue_name: string
          status: string
          updated_at: string
          workflow_instance_id: string | null
        }
        Insert: {
          attempt_count?: number
          available_at?: string
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          job_type: string
          last_error?: Json | null
          lease_expires_at?: string | null
          max_attempts?: number
          metadata?: Json
          notification_id?: string | null
          organisation_id: string
          payload?: Json
          priority?: number
          queue_name?: string
          status?: string
          updated_at?: string
          workflow_instance_id?: string | null
        }
        Update: {
          attempt_count?: number
          available_at?: string
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          id?: string
          idempotency_key?: string | null
          job_type?: string
          last_error?: Json | null
          lease_expires_at?: string | null
          max_attempts?: number
          metadata?: Json
          notification_id?: string | null
          organisation_id?: string
          payload?: Json
          priority?: number
          queue_name?: string
          status?: string
          updated_at?: string
          workflow_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_job_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "leo_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_job_queue_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "leo_workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_job_runs: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_details: Json | null
          id: number
          job_queue_id: string
          organisation_id: string
          result: Json
          started_at: string
          status: string
          worker_id: string
        }
        Insert: {
          attempt_number: number
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          id?: never
          job_queue_id: string
          organisation_id: string
          result?: Json
          started_at?: string
          status: string
          worker_id: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          id?: never
          job_queue_id?: string
          organisation_id?: string
          result?: Json
          started_at?: string
          status?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_job_runs_job_queue_id_fkey"
            columns: ["job_queue_id"]
            isOneToOne: false
            referencedRelation: "leo_job_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_knowledge_access_rules: {
        Row: {
          access_effect: string
          conditions: Json
          created_at: string
          created_by: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          knowledge_source_id: string | null
          metadata: Json
          organisation_id: string
          permission_key: string | null
          priority: number
          purpose_key: string | null
          role_key: string | null
          segment_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          access_effect?: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          knowledge_source_id?: string | null
          metadata?: Json
          organisation_id: string
          permission_key?: string | null
          priority?: number
          purpose_key?: string | null
          role_key?: string | null
          segment_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          access_effect?: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          knowledge_source_id?: string | null
          metadata?: Json
          organisation_id?: string
          permission_key?: string | null
          priority?: number
          purpose_key?: string | null
          role_key?: string | null
          segment_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_knowledge_access_rules_knowledge_source_id_fkey"
            columns: ["knowledge_source_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_knowledge_access_rules_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_knowledge_ingestion_jobs: {
        Row: {
          attempt_count: number
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          created_at: string
          failure_code: string | null
          failure_detail: string | null
          id: string
          job_status: string
          knowledge_source_id: string
          maximum_attempts: number
          metadata: Json
          next_attempt_at: string | null
          organisation_id: string
          requested_at: string
          requested_by: string | null
          result_summary: Json
          source_version_id: string
          started_at: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string
          failure_code?: string | null
          failure_detail?: string | null
          id?: string
          job_status?: string
          knowledge_source_id: string
          maximum_attempts?: number
          metadata?: Json
          next_attempt_at?: string | null
          organisation_id: string
          requested_at?: string
          requested_by?: string | null
          result_summary?: Json
          source_version_id: string
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string
          failure_code?: string | null
          failure_detail?: string | null
          id?: string
          job_status?: string
          knowledge_source_id?: string
          maximum_attempts?: number
          metadata?: Json
          next_attempt_at?: string | null
          organisation_id?: string
          requested_at?: string
          requested_by?: string | null
          result_summary?: Json
          source_version_id?: string
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_knowledge_ingestion_jobs_knowledge_source_id_fkey"
            columns: ["knowledge_source_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_knowledge_ingestion_jobs_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_knowledge_segments: {
        Row: {
          content_checksum: string
          content_reference: string
          created_at: string
          heading_path: string[]
          id: string
          knowledge_source_id: string
          metadata: Json
          organisation_id: string
          retrieval_constraints: Json
          segment_number: number
          segment_reference: string
          sensitivity: string
          source_version_id: string
          status: string
          token_count: number | null
        }
        Insert: {
          content_checksum: string
          content_reference: string
          created_at?: string
          heading_path?: string[]
          id?: string
          knowledge_source_id: string
          metadata?: Json
          organisation_id: string
          retrieval_constraints?: Json
          segment_number: number
          segment_reference: string
          sensitivity?: string
          source_version_id: string
          status?: string
          token_count?: number | null
        }
        Update: {
          content_checksum?: string
          content_reference?: string
          created_at?: string
          heading_path?: string[]
          id?: string
          knowledge_source_id?: string
          metadata?: Json
          organisation_id?: string
          retrieval_constraints?: Json
          segment_number?: number
          segment_reference?: string
          sensitivity?: string
          source_version_id?: string
          status?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_knowledge_segments_knowledge_source_id_fkey"
            columns: ["knowledge_source_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_knowledge_segments_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_knowledge_source_versions: {
        Row: {
          change_reason: string
          content_checksum: string | null
          content_reference: string | null
          created_at: string
          created_by: string | null
          extracted_text_reference: string | null
          extraction_status: string
          extraction_summary: Json
          id: string
          knowledge_source_id: string
          metadata: Json
          organisation_id: string
          supersedes_version_id: string | null
          title: string
          version_number: number
        }
        Insert: {
          change_reason: string
          content_checksum?: string | null
          content_reference?: string | null
          created_at?: string
          created_by?: string | null
          extracted_text_reference?: string | null
          extraction_status?: string
          extraction_summary?: Json
          id?: string
          knowledge_source_id: string
          metadata?: Json
          organisation_id: string
          supersedes_version_id?: string | null
          title: string
          version_number: number
        }
        Update: {
          change_reason?: string
          content_checksum?: string | null
          content_reference?: string | null
          created_at?: string
          created_by?: string | null
          extracted_text_reference?: string | null
          extraction_status?: string
          extraction_summary?: Json
          id?: string
          knowledge_source_id?: string
          metadata?: Json
          organisation_id?: string
          supersedes_version_id?: string | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "leo_knowledge_source_versions_knowledge_source_id_fkey"
            columns: ["knowledge_source_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_knowledge_source_versions_supersedes_version_id_fkey"
            columns: ["supersedes_version_id"]
            isOneToOne: false
            referencedRelation: "leo_knowledge_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_knowledge_sources: {
        Row: {
          ai_use_permitted: boolean
          approved_at: string | null
          approved_by: string | null
          authority_level: string
          citation_required: boolean
          contains_criminal_offence_data: boolean
          contains_personal_data: boolean
          contains_special_category: boolean
          content_checksum: string | null
          content_reference: string | null
          created_at: string
          created_by: string | null
          current_version: number
          description: string | null
          external_reference: string | null
          id: string
          jurisdiction: string
          last_reviewed_at: string | null
          legal_basis: string | null
          metadata: Json
          next_review_at: string | null
          organisation_id: string
          retention_category: string | null
          retrieval_permitted: boolean
          sensitivity: string
          source_key: string
          source_record_id: string | null
          source_relation: string | null
          source_system: string | null
          source_type: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_use_permitted?: boolean
          approved_at?: string | null
          approved_by?: string | null
          authority_level?: string
          citation_required?: boolean
          contains_criminal_offence_data?: boolean
          contains_personal_data?: boolean
          contains_special_category?: boolean
          content_checksum?: string | null
          content_reference?: string | null
          created_at?: string
          created_by?: string | null
          current_version?: number
          description?: string | null
          external_reference?: string | null
          id?: string
          jurisdiction?: string
          last_reviewed_at?: string | null
          legal_basis?: string | null
          metadata?: Json
          next_review_at?: string | null
          organisation_id: string
          retention_category?: string | null
          retrieval_permitted?: boolean
          sensitivity?: string
          source_key: string
          source_record_id?: string | null
          source_relation?: string | null
          source_system?: string | null
          source_type: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_use_permitted?: boolean
          approved_at?: string | null
          approved_by?: string | null
          authority_level?: string
          citation_required?: boolean
          contains_criminal_offence_data?: boolean
          contains_personal_data?: boolean
          contains_special_category?: boolean
          content_checksum?: string | null
          content_reference?: string | null
          created_at?: string
          created_by?: string | null
          current_version?: number
          description?: string | null
          external_reference?: string | null
          id?: string
          jurisdiction?: string
          last_reviewed_at?: string | null
          legal_basis?: string | null
          metadata?: Json
          next_review_at?: string | null
          organisation_id?: string
          retention_category?: string | null
          retrieval_permitted?: boolean
          sensitivity?: string
          source_key?: string
          source_record_id?: string | null
          source_relation?: string | null
          source_system?: string | null
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_learn_ai_generation_records: {
        Row: {
          created_at: string
          human_review_status: string
          id: string
          metadata: Json
          model_reference: string | null
          organisation_id: string
          output_status: string
          prompt_summary: string | null
          published_record_id: string | null
          purpose: string
          redaction_applied: boolean
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sensitive_context_used: boolean
          source_record_ids: string[]
          source_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          human_review_status?: string
          id?: string
          metadata?: Json
          model_reference?: string | null
          organisation_id: string
          output_status?: string
          prompt_summary?: string | null
          published_record_id?: string | null
          purpose: string
          redaction_applied?: boolean
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sensitive_context_used?: boolean
          source_record_ids?: string[]
          source_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          human_review_status?: string
          id?: string
          metadata?: Json
          model_reference?: string | null
          organisation_id?: string
          output_status?: string
          prompt_summary?: string | null
          published_record_id?: string | null
          purpose?: string
          redaction_applied?: boolean
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sensitive_context_used?: boolean
          source_record_ids?: string[]
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      leo_learn_certificate_register: {
        Row: {
          assignment_id: string | null
          certificate_name: string
          certificate_reference: string
          created_at: string
          document_id: string | null
          employee_id: string
          expires_on: string | null
          id: string
          issue_reason: string
          issued_on: string
          issuer_user_id: string | null
          learning_resource_id: string | null
          metadata: Json
          organisation_id: string
          qualification_id: string | null
          renewed_from_id: string | null
          replaced_by_id: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          updated_at: string
          verification_hash: string | null
        }
        Insert: {
          assignment_id?: string | null
          certificate_name: string
          certificate_reference: string
          created_at?: string
          document_id?: string | null
          employee_id: string
          expires_on?: string | null
          id?: string
          issue_reason: string
          issued_on: string
          issuer_user_id?: string | null
          learning_resource_id?: string | null
          metadata?: Json
          organisation_id: string
          qualification_id?: string | null
          renewed_from_id?: string | null
          replaced_by_id?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          updated_at?: string
          verification_hash?: string | null
        }
        Update: {
          assignment_id?: string | null
          certificate_name?: string
          certificate_reference?: string
          created_at?: string
          document_id?: string | null
          employee_id?: string
          expires_on?: string | null
          id?: string
          issue_reason?: string
          issued_on?: string
          issuer_user_id?: string | null
          learning_resource_id?: string | null
          metadata?: Json
          organisation_id?: string
          qualification_id?: string | null
          renewed_from_id?: string | null
          replaced_by_id?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          updated_at?: string
          verification_hash?: string | null
        }
        Relationships: []
      }
      leo_learn_security_inventory: {
        Row: {
          has_employee_id: boolean
          has_organisation_id: boolean
          has_user_id: boolean
          id: number
          inspected_at: string
          notes: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled: boolean
          rls_forced: boolean
          security_status: string
        }
        Insert: {
          has_employee_id?: boolean
          has_organisation_id?: boolean
          has_user_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Update: {
          has_employee_id?: boolean
          has_organisation_id?: boolean
          has_user_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind?: string
          relation_name?: string
          relation_schema?: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Relationships: []
      }
      leo_learn_validation_records: {
        Row: {
          assignment_id: string | null
          competence_demonstrated: boolean | null
          created_at: string
          created_by: string | null
          employee_id: string | null
          evidence_document_id: string | null
          id: string
          learning_resource_id: string | null
          metadata: Json
          organisation_id: string
          outcome: string
          supersedes_validation_id: string | null
          updated_at: string
          validated_at: string | null
          validation_notes: string | null
          validation_reason: string | null
          validation_type: string
          validator_user_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          competence_demonstrated?: boolean | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          evidence_document_id?: string | null
          id?: string
          learning_resource_id?: string | null
          metadata?: Json
          organisation_id: string
          outcome?: string
          supersedes_validation_id?: string | null
          updated_at?: string
          validated_at?: string | null
          validation_notes?: string | null
          validation_reason?: string | null
          validation_type?: string
          validator_user_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          competence_demonstrated?: boolean | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          evidence_document_id?: string | null
          id?: string
          learning_resource_id?: string | null
          metadata?: Json
          organisation_id?: string
          outcome?: string
          supersedes_validation_id?: string | null
          updated_at?: string
          validated_at?: string | null
          validation_notes?: string | null
          validation_reason?: string | null
          validation_type?: string
          validator_user_id?: string | null
        }
        Relationships: []
      }
      leo_legal_holds: {
        Row: {
          authority: string | null
          created_at: string
          created_by: string | null
          document_id: string | null
          effective_at: string
          employee_id: number | null
          hold_reference: string
          id: string
          matter_id: number | null
          module_key: string | null
          name: string
          organisation_id: string
          reason: string
          release_reason: string | null
          released_at: string | null
          released_by: string | null
          review_due_date: string | null
          scope_filter: Json
          scope_type: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          authority?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          effective_at?: string
          employee_id?: number | null
          hold_reference?: string
          id?: string
          matter_id?: number | null
          module_key?: string | null
          name: string
          organisation_id: string
          reason: string
          release_reason?: string | null
          released_at?: string | null
          released_by?: string | null
          review_due_date?: string | null
          scope_filter?: Json
          scope_type: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          authority?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          effective_at?: string
          employee_id?: number | null
          hold_reference?: string
          id?: string
          matter_id?: number | null
          module_key?: string | null
          name?: string
          organisation_id?: string
          reason?: string
          release_reason?: string | null
          released_at?: string | null
          released_by?: string | null
          review_due_date?: string | null
          scope_filter?: Json
          scope_type?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_matter_access_grants: {
        Row: {
          access_level: string
          access_reason: string
          expires_at: string | null
          granted_at: string
          granted_by: string
          granted_to_user_id: string
          id: string
          matter_security_profile_id: string
          metadata: Json
          organisation_id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
        }
        Insert: {
          access_level?: string
          access_reason: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          granted_to_user_id: string
          id?: string
          matter_security_profile_id: string
          metadata?: Json
          organisation_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Update: {
          access_level?: string
          access_reason?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          granted_to_user_id?: string
          id?: string
          matter_security_profile_id?: string
          metadata?: Json
          organisation_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_matter_access_grants_matter_security_profile_id_fkey"
            columns: ["matter_security_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_matter_security_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_matter_chronology: {
        Row: {
          correction_reason: string | null
          created_at: string
          created_by: string
          detail: string | null
          event_at: string
          event_type: string
          id: string
          is_privileged: boolean
          matter_security_profile_id: string
          metadata: Json
          organisation_id: string
          privilege_basis: string | null
          source: string
          supersedes_entry_id: string | null
          title: string
          visibility: string
        }
        Insert: {
          correction_reason?: string | null
          created_at?: string
          created_by?: string
          detail?: string | null
          event_at: string
          event_type: string
          id?: string
          is_privileged?: boolean
          matter_security_profile_id: string
          metadata?: Json
          organisation_id: string
          privilege_basis?: string | null
          source?: string
          supersedes_entry_id?: string | null
          title: string
          visibility?: string
        }
        Update: {
          correction_reason?: string | null
          created_at?: string
          created_by?: string
          detail?: string | null
          event_at?: string
          event_type?: string
          id?: string
          is_privileged?: boolean
          matter_security_profile_id?: string
          metadata?: Json
          organisation_id?: string
          privilege_basis?: string | null
          source?: string
          supersedes_entry_id?: string | null
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_matter_chronology_matter_security_profile_id_fkey"
            columns: ["matter_security_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_matter_security_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_matter_chronology_supersedes_entry_id_fkey"
            columns: ["supersedes_entry_id"]
            isOneToOne: false
            referencedRelation: "leo_matter_chronology"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_matter_evidence_links: {
        Row: {
          authenticity_checked: boolean
          authenticity_checked_at: string | null
          authenticity_checked_by: string | null
          description: string | null
          document_id: string
          evidence_status: string
          evidence_type: string
          id: string
          is_privileged: boolean
          linked_at: string
          linked_by: string
          matter_security_profile_id: string
          metadata: Json
          organisation_id: string
          privilege_basis: string | null
          relevance_notes: string | null
          withdrawal_reason: string | null
          withdrawn_at: string | null
          withdrawn_by: string | null
        }
        Insert: {
          authenticity_checked?: boolean
          authenticity_checked_at?: string | null
          authenticity_checked_by?: string | null
          description?: string | null
          document_id: string
          evidence_status?: string
          evidence_type?: string
          id?: string
          is_privileged?: boolean
          linked_at?: string
          linked_by?: string
          matter_security_profile_id: string
          metadata?: Json
          organisation_id: string
          privilege_basis?: string | null
          relevance_notes?: string | null
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Update: {
          authenticity_checked?: boolean
          authenticity_checked_at?: string | null
          authenticity_checked_by?: string | null
          description?: string | null
          document_id?: string
          evidence_status?: string
          evidence_type?: string
          id?: string
          is_privileged?: boolean
          linked_at?: string
          linked_by?: string
          matter_security_profile_id?: string
          metadata?: Json
          organisation_id?: string
          privilege_basis?: string | null
          relevance_notes?: string | null
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
          withdrawn_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_matter_evidence_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "leo_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_matter_evidence_links_matter_security_profile_id_fkey"
            columns: ["matter_security_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_matter_security_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_matter_participants: {
        Row: {
          added_at: string
          added_by: string
          confidential_identity: boolean
          employee_id: number | null
          external_name: string | null
          external_reference: string | null
          id: string
          matter_security_profile_id: string
          metadata: Json
          notes: string | null
          organisation_id: string
          participant_role: string
          participation_status: string
          removal_reason: string | null
          removed_at: string | null
          removed_by: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string
          confidential_identity?: boolean
          employee_id?: number | null
          external_name?: string | null
          external_reference?: string | null
          id?: string
          matter_security_profile_id: string
          metadata?: Json
          notes?: string | null
          organisation_id: string
          participant_role: string
          participation_status?: string
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string
          confidential_identity?: boolean
          employee_id?: number | null
          external_name?: string | null
          external_reference?: string | null
          id?: string
          matter_security_profile_id?: string
          metadata?: Json
          notes?: string | null
          organisation_id?: string
          participant_role?: string
          participation_status?: string
          removal_reason?: string | null
          removed_at?: string | null
          removed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_matter_participants_matter_security_profile_id_fkey"
            columns: ["matter_security_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_matter_security_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_matter_security_inventory: {
        Row: {
          audit_trigger_present: boolean
          compatibility_notes: string | null
          compatibility_status: string
          employee_id_column: string | null
          id: number
          inspected_at: string
          matter_id_column: string | null
          organisation_column: string | null
          policies_installed: boolean
          rls_enabled_by_migration: boolean
          rls_was_enabled: boolean
          table_name: string
          table_schema: string
        }
        Insert: {
          audit_trigger_present?: boolean
          compatibility_notes?: string | null
          compatibility_status?: string
          employee_id_column?: string | null
          id?: never
          inspected_at?: string
          matter_id_column?: string | null
          organisation_column?: string | null
          policies_installed?: boolean
          rls_enabled_by_migration?: boolean
          rls_was_enabled?: boolean
          table_name: string
          table_schema?: string
        }
        Update: {
          audit_trigger_present?: boolean
          compatibility_notes?: string | null
          compatibility_status?: string
          employee_id_column?: string | null
          id?: never
          inspected_at?: string
          matter_id_column?: string | null
          organisation_column?: string | null
          policies_installed?: boolean
          rls_enabled_by_migration?: boolean
          rls_was_enabled?: boolean
          table_name?: string
          table_schema?: string
        }
        Relationships: []
      }
      leo_matter_security_profiles: {
        Row: {
          ai_context_allowed: boolean
          ai_context_notes: string | null
          ai_context_requires_redaction: boolean
          archived_at: string | null
          classification: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          export_allowed: boolean
          id: string
          legal_hold_active: boolean
          legal_privilege_indicator: boolean
          matter_record_id: string
          metadata: Json
          need_to_know_only: boolean
          organisation_id: string
          primary_employee_id: number | null
          privilege_basis: string | null
          privilege_reviewed_at: string | null
          privilege_reviewed_by: string | null
          retention_category: string
          sensitivity: string
          source_table: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_context_allowed?: boolean
          ai_context_notes?: string | null
          ai_context_requires_redaction?: boolean
          archived_at?: string | null
          classification?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          export_allowed?: boolean
          id?: string
          legal_hold_active?: boolean
          legal_privilege_indicator?: boolean
          matter_record_id: string
          metadata?: Json
          need_to_know_only?: boolean
          organisation_id: string
          primary_employee_id?: number | null
          privilege_basis?: string | null
          privilege_reviewed_at?: string | null
          privilege_reviewed_by?: string | null
          retention_category?: string
          sensitivity?: string
          source_table?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_context_allowed?: boolean
          ai_context_notes?: string | null
          ai_context_requires_redaction?: boolean
          archived_at?: string | null
          classification?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          export_allowed?: boolean
          id?: string
          legal_hold_active?: boolean
          legal_privilege_indicator?: boolean
          matter_record_id?: string
          metadata?: Json
          need_to_know_only?: boolean
          organisation_id?: string
          primary_employee_id?: number | null
          privilege_basis?: string | null
          privilege_reviewed_at?: string | null
          privilege_reviewed_by?: string | null
          retention_category?: string
          sensitivity?: string
          source_table?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_notification_delivery_attempts: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: number
          next_retry_at: string | null
          notification_id: string
          organisation_id: string
          provider_key: string | null
          provider_message_reference: string | null
          requested_at: string
          response_metadata: Json
          retryable: boolean
          status: string
        }
        Insert: {
          attempt_number: number
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: never
          next_retry_at?: string | null
          notification_id: string
          organisation_id: string
          provider_key?: string | null
          provider_message_reference?: string | null
          requested_at?: string
          response_metadata?: Json
          retryable?: boolean
          status: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: never
          next_retry_at?: string | null
          notification_id?: string
          organisation_id?: string
          provider_key?: string | null
          provider_message_reference?: string | null
          requested_at?: string
          response_metadata?: Json
          retryable?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_notification_delivery_attempts_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "leo_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_notification_preferences: {
        Row: {
          channel: string
          created_at: string
          digest_mode: string
          id: string
          is_enabled: boolean
          metadata: Json
          notification_category: string
          organisation_id: string
          quiet_hours: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          digest_mode?: string
          id?: string
          is_enabled?: boolean
          metadata?: Json
          notification_category: string
          organisation_id: string
          quiet_hours?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          digest_mode?: string
          id?: string
          is_enabled?: boolean
          metadata?: Json
          notification_category?: string
          organisation_id?: string
          quiet_hours?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leo_notification_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          locale: string
          metadata: Json
          name: string
          organisation_id: string | null
          sensitivity: string
          status: string
          subject_template: string | null
          template_key: string
          updated_at: string
          updated_by: string | null
          variables_schema: Json
          version: number
        }
        Insert: {
          body_template: string
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          locale?: string
          metadata?: Json
          name: string
          organisation_id?: string | null
          sensitivity?: string
          status?: string
          subject_template?: string | null
          template_key: string
          updated_at?: string
          updated_by?: string | null
          variables_schema?: Json
          version?: number
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          locale?: string
          metadata?: Json
          name?: string
          organisation_id?: string | null
          sensitivity?: string
          status?: string
          subject_template?: string | null
          template_key?: string
          updated_at?: string
          updated_by?: string | null
          variables_schema?: Json
          version?: number
        }
        Relationships: []
      }
      leo_notifications: {
        Row: {
          attempt_count: number
          body: string
          channel: string
          created_at: string
          created_by: string | null
          deduplication_key: string | null
          delivered_at: string | null
          expires_at: string | null
          id: string
          last_error: Json | null
          metadata: Json
          notification_reference: string
          notification_template_id: string | null
          organisation_id: string
          read_at: string | null
          recipient_address: string | null
          recipient_employee_id: string | null
          recipient_user_id: string | null
          scheduled_for: string | null
          sensitivity: string
          sent_at: string | null
          source_id: string | null
          source_type: string | null
          status: string
          subject: string | null
          updated_at: string
          workflow_instance_id: string | null
        }
        Insert: {
          attempt_count?: number
          body: string
          channel: string
          created_at?: string
          created_by?: string | null
          deduplication_key?: string | null
          delivered_at?: string | null
          expires_at?: string | null
          id?: string
          last_error?: Json | null
          metadata?: Json
          notification_reference?: string
          notification_template_id?: string | null
          organisation_id: string
          read_at?: string | null
          recipient_address?: string | null
          recipient_employee_id?: string | null
          recipient_user_id?: string | null
          scheduled_for?: string | null
          sensitivity?: string
          sent_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          workflow_instance_id?: string | null
        }
        Update: {
          attempt_count?: number
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          deduplication_key?: string | null
          delivered_at?: string | null
          expires_at?: string | null
          id?: string
          last_error?: Json | null
          metadata?: Json
          notification_reference?: string
          notification_template_id?: string | null
          organisation_id?: string
          read_at?: string | null
          recipient_address?: string | null
          recipient_employee_id?: string | null
          recipient_user_id?: string | null
          scheduled_for?: string | null
          sensitivity?: string
          sent_at?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          workflow_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_notifications_notification_template_id_fkey"
            columns: ["notification_template_id"]
            isOneToOne: false
            referencedRelation: "leo_notification_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_notifications_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "leo_workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_organisation_connections: {
        Row: {
          authorised_scopes: string[]
          configuration: Json
          connected_at: string | null
          connected_by: string | null
          connection_name: string
          connection_status: string
          consecutive_failure_count: number
          created_at: string
          created_by: string | null
          disconnect_reason: string | null
          disconnected_at: string | null
          disconnected_by: string | null
          enabled_capabilities: string[]
          environment: string
          external_account_id: string | null
          external_account_name: string | null
          external_tenant_id: string | null
          id: string
          is_enabled: boolean
          last_failed_sync_at: string | null
          last_health_checked_at: string | null
          last_health_status: string
          last_reauthorised_at: string | null
          last_reauthorised_by: string | null
          last_successful_sync_at: string | null
          metadata: Json
          next_scheduled_sync_at: string | null
          organisation_id: string
          provider_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          authorised_scopes?: string[]
          configuration?: Json
          connected_at?: string | null
          connected_by?: string | null
          connection_name: string
          connection_status?: string
          consecutive_failure_count?: number
          created_at?: string
          created_by?: string | null
          disconnect_reason?: string | null
          disconnected_at?: string | null
          disconnected_by?: string | null
          enabled_capabilities?: string[]
          environment?: string
          external_account_id?: string | null
          external_account_name?: string | null
          external_tenant_id?: string | null
          id?: string
          is_enabled?: boolean
          last_failed_sync_at?: string | null
          last_health_checked_at?: string | null
          last_health_status?: string
          last_reauthorised_at?: string | null
          last_reauthorised_by?: string | null
          last_successful_sync_at?: string | null
          metadata?: Json
          next_scheduled_sync_at?: string | null
          organisation_id: string
          provider_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          authorised_scopes?: string[]
          configuration?: Json
          connected_at?: string | null
          connected_by?: string | null
          connection_name?: string
          connection_status?: string
          consecutive_failure_count?: number
          created_at?: string
          created_by?: string | null
          disconnect_reason?: string | null
          disconnected_at?: string | null
          disconnected_by?: string | null
          enabled_capabilities?: string[]
          environment?: string
          external_account_id?: string | null
          external_account_name?: string | null
          external_tenant_id?: string | null
          id?: string
          is_enabled?: boolean
          last_failed_sync_at?: string | null
          last_health_checked_at?: string | null
          last_health_status?: string
          last_reauthorised_at?: string | null
          last_reauthorised_by?: string | null
          last_successful_sync_at?: string | null
          metadata?: Json
          next_scheduled_sync_at?: string | null
          organisation_id?: string
          provider_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_organisation_connections_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "leo_connection_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_organisation_entitlements: {
        Row: {
          access_status: string
          all_platform_features_enabled: boolean
          created_at: string
          effective_from: string | null
          effective_until: string | null
          employee_capacity: number | null
          id: string
          metadata: Json
          module_restrictions: Json
          organisation_id: string
          reason: string | null
          source: string
          subscription_id: string | null
          trial_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          access_status?: string
          all_platform_features_enabled?: boolean
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          employee_capacity?: number | null
          id?: string
          metadata?: Json
          module_restrictions?: Json
          organisation_id: string
          reason?: string | null
          source?: string
          subscription_id?: string | null
          trial_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          access_status?: string
          all_platform_features_enabled?: boolean
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          employee_capacity?: number | null
          id?: string
          metadata?: Json
          module_restrictions?: Json
          organisation_id?: string
          reason?: string | null
          source?: string
          subscription_id?: string | null
          trial_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_organisation_entitlements_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_organisation_entitlements_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_trials"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_organisation_governance_settings: {
        Row: {
          annual_governance_review_month: number
          created_at: string
          created_by: string | null
          data_controller_name: string | null
          default_retention_years: number
          export_approval_required: boolean
          export_encryption_required: boolean
          export_expiry_hours: number
          export_watermark_required: boolean
          ico_registration_reference: string | null
          identity_verification_required: boolean
          inactivity_timeout_minutes: number
          is_configured: boolean
          last_governance_reviewed_at: string | null
          last_governance_reviewed_by: string | null
          maximum_failed_sign_in_attempts: number
          metadata: Json
          next_governance_review_date: string | null
          organisation_id: string
          primary_jurisdiction: string
          privacy_contact_email: string | null
          privacy_contact_name: string | null
          privacy_notice_effective_at: string | null
          privacy_notice_version: string | null
          privacy_request_default_deadline_days: number
          privileged_session_minutes: number
          require_mfa_for_manager: boolean
          require_mfa_for_owner: boolean
          require_mfa_for_senior: boolean
          require_step_up_for_credential_changes: boolean
          require_step_up_for_exports: boolean
          require_step_up_for_legal_holds: boolean
          standard_session_hours: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          annual_governance_review_month?: number
          created_at?: string
          created_by?: string | null
          data_controller_name?: string | null
          default_retention_years?: number
          export_approval_required?: boolean
          export_encryption_required?: boolean
          export_expiry_hours?: number
          export_watermark_required?: boolean
          ico_registration_reference?: string | null
          identity_verification_required?: boolean
          inactivity_timeout_minutes?: number
          is_configured?: boolean
          last_governance_reviewed_at?: string | null
          last_governance_reviewed_by?: string | null
          maximum_failed_sign_in_attempts?: number
          metadata?: Json
          next_governance_review_date?: string | null
          organisation_id: string
          primary_jurisdiction?: string
          privacy_contact_email?: string | null
          privacy_contact_name?: string | null
          privacy_notice_effective_at?: string | null
          privacy_notice_version?: string | null
          privacy_request_default_deadline_days?: number
          privileged_session_minutes?: number
          require_mfa_for_manager?: boolean
          require_mfa_for_owner?: boolean
          require_mfa_for_senior?: boolean
          require_step_up_for_credential_changes?: boolean
          require_step_up_for_exports?: boolean
          require_step_up_for_legal_holds?: boolean
          standard_session_hours?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          annual_governance_review_month?: number
          created_at?: string
          created_by?: string | null
          data_controller_name?: string | null
          default_retention_years?: number
          export_approval_required?: boolean
          export_encryption_required?: boolean
          export_expiry_hours?: number
          export_watermark_required?: boolean
          ico_registration_reference?: string | null
          identity_verification_required?: boolean
          inactivity_timeout_minutes?: number
          is_configured?: boolean
          last_governance_reviewed_at?: string | null
          last_governance_reviewed_by?: string | null
          maximum_failed_sign_in_attempts?: number
          metadata?: Json
          next_governance_review_date?: string | null
          organisation_id?: string
          primary_jurisdiction?: string
          privacy_contact_email?: string | null
          privacy_contact_name?: string | null
          privacy_notice_effective_at?: string | null
          privacy_notice_version?: string | null
          privacy_request_default_deadline_days?: number
          privileged_session_minutes?: number
          require_mfa_for_manager?: boolean
          require_mfa_for_owner?: boolean
          require_mfa_for_senior?: boolean
          require_step_up_for_credential_changes?: boolean
          require_step_up_for_exports?: boolean
          require_step_up_for_legal_holds?: boolean
          standard_session_hours?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_organisation_memory_access_log: {
        Row: {
          accessed_at: string
          actor_user_id: string | null
          id: number
          memory_record_id: string | null
          metadata: Json
          organisation_id: string
          outcome: string
          purpose: string
          query_reference: string | null
          service_name: string
        }
        Insert: {
          accessed_at?: string
          actor_user_id?: string | null
          id?: never
          memory_record_id?: string | null
          metadata?: Json
          organisation_id: string
          outcome?: string
          purpose: string
          query_reference?: string | null
          service_name: string
        }
        Update: {
          accessed_at?: string
          actor_user_id?: string | null
          id?: never
          memory_record_id?: string | null
          metadata?: Json
          organisation_id?: string
          outcome?: string
          purpose?: string
          query_reference?: string | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_organisation_memory_access_log_memory_record_id_fkey"
            columns: ["memory_record_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_memory_records"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_organisation_memory_records: {
        Row: {
          ai_eligible: boolean
          approved_at: string | null
          approved_by: string | null
          classification: string
          confidence: number | null
          created_at: string
          created_by: string | null
          id: string
          memory_category: string
          memory_key: string
          memory_value: Json
          metadata: Json
          organisation_id: string
          source_record_id: string | null
          source_relation: string | null
          source_type: string
          status: string
          summary: string
          supersedes_id: string | null
          updated_at: string
          updated_by: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          ai_eligible?: boolean
          approved_at?: string | null
          approved_by?: string | null
          classification?: string
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          memory_category?: string
          memory_key: string
          memory_value?: Json
          metadata?: Json
          organisation_id: string
          source_record_id?: string | null
          source_relation?: string | null
          source_type?: string
          status?: string
          summary: string
          supersedes_id?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          ai_eligible?: boolean
          approved_at?: string | null
          approved_by?: string | null
          classification?: string
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          memory_category?: string
          memory_key?: string
          memory_value?: Json
          metadata?: Json
          organisation_id?: string
          source_record_id?: string | null
          source_relation?: string | null
          source_type?: string
          status?: string
          summary?: string
          supersedes_id?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_organisation_memory_records_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_memory_records"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_organisation_subscriptions: {
        Row: {
          cancellation_requested_at: string | null
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          current_period_ends_at: string | null
          current_period_starts_at: string | null
          employee_count: number
          id: string
          metadata: Json
          organisation_id: string
          plan_id: string | null
          provider_customer_reference: string | null
          provider_key: string | null
          provider_subscription_reference: string | null
          resumed_at: string | null
          status: string
          suspended_at: string | null
          trial_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cancellation_requested_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          current_period_ends_at?: string | null
          current_period_starts_at?: string | null
          employee_count?: number
          id?: string
          metadata?: Json
          organisation_id: string
          plan_id?: string | null
          provider_customer_reference?: string | null
          provider_key?: string | null
          provider_subscription_reference?: string | null
          resumed_at?: string | null
          status?: string
          suspended_at?: string | null
          trial_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cancellation_requested_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          current_period_ends_at?: string | null
          current_period_starts_at?: string | null
          employee_count?: number
          id?: string
          metadata?: Json
          organisation_id?: string
          plan_id?: string | null
          provider_customer_reference?: string | null
          provider_key?: string | null
          provider_subscription_reference?: string | null
          resumed_at?: string | null
          status?: string
          suspended_at?: string | null
          trial_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_organisation_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "leo_billing_plan_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_organisation_subscriptions_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "leo_organisation_trials"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_organisation_trials: {
        Row: {
          converted_at: string | null
          created_at: string
          created_by: string | null
          ended_at: string | null
          ends_at: string | null
          extension_count: number
          extension_reason: string | null
          id: string
          metadata: Json
          organisation_id: string
          starts_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          ends_at?: string | null
          extension_count?: number
          extension_reason?: string | null
          id?: string
          metadata?: Json
          organisation_id: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          ends_at?: string | null
          extension_count?: number
          extension_reason?: string | null
          id?: string
          metadata?: Json
          organisation_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_platform_admin_change_requests: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          expires_at: string | null
          id: string
          metadata: Json
          organisation_id: string
          reason: string
          request_type: string
          requested_at: string
          requested_by: string
          requested_change: Json
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          organisation_id: string
          reason: string
          request_type: string
          requested_at?: string
          requested_by: string
          requested_change?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          organisation_id?: string
          reason?: string
          request_type?: string
          requested_at?: string
          requested_by?: string
          requested_change?: Json
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      leo_platform_admin_exports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          expires_at: string | null
          export_type: string
          filters: Json
          id: string
          metadata: Json
          organisation_id: string
          purpose: string
          requested_at: string
          requested_by: string
          status: string
          storage_path: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          expires_at?: string | null
          export_type: string
          filters?: Json
          id?: string
          metadata?: Json
          organisation_id: string
          purpose: string
          requested_at?: string
          requested_by: string
          status?: string
          storage_path?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          expires_at?: string | null
          export_type?: string
          filters?: Json
          id?: string
          metadata?: Json
          organisation_id?: string
          purpose?: string
          requested_at?: string
          requested_by?: string
          status?: string
          storage_path?: string | null
        }
        Relationships: []
      }
      leo_platform_administration_security_inventory: {
        Row: {
          domain_area: string
          has_organisation_id: boolean
          id: number
          inspected_at: string
          notes: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled: boolean
          rls_forced: boolean
          security_status: string
        }
        Insert: {
          domain_area: string
          has_organisation_id: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind: string
          relation_name: string
          relation_schema: string
          rls_enabled: boolean
          rls_forced: boolean
          security_status: string
        }
        Update: {
          domain_area?: string
          has_organisation_id?: boolean
          id?: never
          inspected_at?: string
          notes?: string | null
          relation_kind?: string
          relation_name?: string
          relation_schema?: string
          rls_enabled?: boolean
          rls_forced?: boolean
          security_status?: string
        }
        Relationships: []
      }
      leo_platform_environment_config: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          config_key: string
          config_value: Json
          contains_secret: boolean
          created_at: string
          created_by: string | null
          effective_from: string | null
          effective_until: string | null
          environment_key: string
          environment_name: string
          id: string
          metadata: Json
          organisation_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          config_key: string
          config_value?: Json
          contains_secret?: boolean
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          effective_until?: string | null
          environment_key: string
          environment_name?: string
          id?: string
          metadata?: Json
          organisation_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          config_key?: string
          config_value?: Json
          contains_secret?: boolean
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          effective_until?: string | null
          environment_key?: string
          environment_name?: string
          id?: string
          metadata?: Json
          organisation_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_platform_feature_flags: {
        Row: {
          commercial_gate: boolean
          created_at: string
          disabled_at: string | null
          disabled_by: string | null
          enabled: boolean
          enabled_at: string | null
          enabled_by: string | null
          feature_key: string
          feature_name: string
          id: string
          metadata: Json
          organisation_id: string
          reason: string | null
          rollout_state: string
          updated_at: string
        }
        Insert: {
          commercial_gate?: boolean
          created_at?: string
          disabled_at?: string | null
          disabled_by?: string | null
          enabled?: boolean
          enabled_at?: string | null
          enabled_by?: string | null
          feature_key: string
          feature_name: string
          id?: string
          metadata?: Json
          organisation_id: string
          reason?: string | null
          rollout_state?: string
          updated_at?: string
        }
        Update: {
          commercial_gate?: boolean
          created_at?: string
          disabled_at?: string | null
          disabled_by?: string | null
          enabled?: boolean
          enabled_at?: string | null
          enabled_by?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          metadata?: Json
          organisation_id?: string
          reason?: string | null
          rollout_state?: string
          updated_at?: string
        }
        Relationships: []
      }
      leo_platform_settings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          is_sensitive: boolean
          metadata: Json
          organisation_id: string
          requires_approval: boolean
          setting_group: string
          setting_key: string
          setting_value: Json
          status: string
          updated_at: string
          updated_by: string | null
          value_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_sensitive?: boolean
          metadata?: Json
          organisation_id: string
          requires_approval?: boolean
          setting_group?: string
          setting_key: string
          setting_value?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
          value_type?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_sensitive?: boolean
          metadata?: Json
          organisation_id?: string
          requires_approval?: boolean
          setting_group?: string
          setting_key?: string
          setting_value?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
          value_type?: string
        }
        Relationships: []
      }
      leo_platform_validation_findings: {
        Row: {
          category: string
          check_key: string
          created_at: string
          evidence: Json
          finding: string
          id: number
          object_name: string | null
          object_schema: string | null
          remediation: string | null
          severity: string
          status: string
          validation_run_id: string
        }
        Insert: {
          category: string
          check_key: string
          created_at?: string
          evidence?: Json
          finding: string
          id?: never
          object_name?: string | null
          object_schema?: string | null
          remediation?: string | null
          severity: string
          status: string
          validation_run_id: string
        }
        Update: {
          category?: string
          check_key?: string
          created_at?: string
          evidence?: Json
          finding?: string
          id?: never
          object_name?: string | null
          object_schema?: string | null
          remediation?: string | null
          severity?: string
          status?: string
          validation_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_platform_validation_findings_validation_run_id_fkey"
            columns: ["validation_run_id"]
            isOneToOne: false
            referencedRelation: "leo_platform_health"
            referencedColumns: ["validation_run_id"]
          },
          {
            foreignKeyName: "leo_platform_validation_findings_validation_run_id_fkey"
            columns: ["validation_run_id"]
            isOneToOne: false
            referencedRelation: "leo_platform_validation_latest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_platform_validation_findings_validation_run_id_fkey"
            columns: ["validation_run_id"]
            isOneToOne: false
            referencedRelation: "leo_platform_validation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_platform_validation_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          critical_failures: number
          database_name: string
          database_version: string
          environment: string
          executed_by: string | null
          failed_checks: number
          id: string
          migration_version: string
          passed_checks: number
          started_at: string
          status: string
          summary: Json
          total_checks: number
          validation_key: string
          warning_checks: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          critical_failures?: number
          database_name?: string
          database_version?: string
          environment?: string
          executed_by?: string | null
          failed_checks?: number
          id?: string
          migration_version: string
          passed_checks?: number
          started_at?: string
          status?: string
          summary?: Json
          total_checks?: number
          validation_key: string
          warning_checks?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          critical_failures?: number
          database_name?: string
          database_version?: string
          environment?: string
          executed_by?: string | null
          failed_checks?: number
          id?: string
          migration_version?: string
          passed_checks?: number
          started_at?: string
          status?: string
          summary?: Json
          total_checks?: number
          validation_key?: string
          warning_checks?: number
        }
        Relationships: []
      }
      leo_privacy_requests: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          data_subject_candidate_id: number | null
          data_subject_email: string | null
          data_subject_employee_id: number | null
          data_subject_name: string | null
          data_subject_type: string
          deadline_at: string
          decision: string | null
          decision_reason: string | null
          extension_applied: boolean
          extension_reason: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          identity_verification_status: string
          identity_verified_at: string | null
          identity_verified_by: string | null
          metadata: Json
          organisation_id: string
          received_at: string
          received_channel: string
          request_reference: string
          request_type: string
          response_document_id: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          data_subject_candidate_id?: number | null
          data_subject_email?: string | null
          data_subject_employee_id?: number | null
          data_subject_name?: string | null
          data_subject_type?: string
          deadline_at: string
          decision?: string | null
          decision_reason?: string | null
          extension_applied?: boolean
          extension_reason?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          identity_verification_status?: string
          identity_verified_at?: string | null
          identity_verified_by?: string | null
          metadata?: Json
          organisation_id: string
          received_at?: string
          received_channel?: string
          request_reference?: string
          request_type: string
          response_document_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          data_subject_candidate_id?: number | null
          data_subject_email?: string | null
          data_subject_employee_id?: number | null
          data_subject_name?: string | null
          data_subject_type?: string
          deadline_at?: string
          decision?: string | null
          decision_reason?: string | null
          extension_applied?: boolean
          extension_reason?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          identity_verification_status?: string
          identity_verified_at?: string | null
          identity_verified_by?: string | null
          metadata?: Json
          organisation_id?: string
          received_at?: string
          received_channel?: string
          request_reference?: string
          request_type?: string
          response_document_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_production_baselines: {
        Row: {
          activated_at: string | null
          baseline_key: string
          baseline_version: string
          change_mode: string
          created_at: string
          development_permitted: boolean
          direct_application_ddl_permitted: boolean
          environment: string
          id: string
          metadata: Json
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          baseline_key: string
          baseline_version: string
          change_mode?: string
          created_at?: string
          development_permitted?: boolean
          direct_application_ddl_permitted?: boolean
          environment?: string
          id?: string
          metadata?: Json
          status: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          baseline_key?: string
          baseline_version?: string
          change_mode?: string
          created_at?: string
          development_permitted?: boolean
          direct_application_ddl_permitted?: boolean
          environment?: string
          id?: string
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      leo_production_hardening_runs: {
        Row: {
          completed_at: string | null
          constraints_validated: number
          id: string
          metadata: Json
          migration_key: string
          permissions_installed: number
          policies_installed: number
          started_at: string
          status: string
          warnings: Json
        }
        Insert: {
          completed_at?: string | null
          constraints_validated?: number
          id?: string
          metadata?: Json
          migration_key: string
          permissions_installed?: number
          policies_installed?: number
          started_at?: string
          status: string
          warnings?: Json
        }
        Update: {
          completed_at?: string | null
          constraints_validated?: number
          id?: string
          metadata?: Json
          migration_key?: string
          permissions_installed?: number
          policies_installed?: number
          started_at?: string
          status?: string
          warnings?: Json
        }
        Relationships: []
      }
      leo_rate_limit_counters: {
        Row: {
          blocked_until: string | null
          created_at: string
          id: string
          last_request_at: string
          metadata: Json
          organisation_id: string | null
          policy_id: string
          request_count: number
          subject_hash: string
          updated_at: string
          window_started_at: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          last_request_at?: string
          metadata?: Json
          organisation_id?: string | null
          policy_id: string
          request_count?: number
          subject_hash: string
          updated_at?: string
          window_started_at: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          last_request_at?: string
          metadata?: Json
          organisation_id?: string | null
          policy_id?: string
          request_count?: number
          subject_hash?: string
          updated_at?: string
          window_started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_rate_limit_counters_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "leo_rate_limit_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_rate_limit_policies: {
        Row: {
          block_seconds: number
          burst_limit: number | null
          created_at: string
          created_by: string | null
          feature_key: string | null
          id: string
          is_active: boolean
          metadata: Json
          organisation_id: string | null
          policy_key: string
          request_limit: number
          scope_type: string
          updated_at: string
          updated_by: string | null
          window_seconds: number
        }
        Insert: {
          block_seconds?: number
          burst_limit?: number | null
          created_at?: string
          created_by?: string | null
          feature_key?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          organisation_id?: string | null
          policy_key: string
          request_limit: number
          scope_type: string
          updated_at?: string
          updated_by?: string | null
          window_seconds: number
        }
        Update: {
          block_seconds?: number
          burst_limit?: number | null
          created_at?: string
          created_by?: string | null
          feature_key?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          organisation_id?: string | null
          policy_key?: string
          request_limit?: number
          scope_type?: string
          updated_at?: string
          updated_by?: string | null
          window_seconds?: number
        }
        Relationships: []
      }
      leo_retention_schedules: {
        Row: {
          active_from: string
          active_until: string | null
          applies_to_special_category_data: boolean
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          disposal_action: string
          id: string
          legal_basis: string
          metadata: Json
          module_key: string
          name: string
          organisation_id: string
          record_category: string
          retention_period_months: number
          review_due_date: string | null
          schedule_key: string
          status: string
          statutory_reference: string | null
          trigger_event: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_from?: string
          active_until?: string | null
          applies_to_special_category_data?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          disposal_action?: string
          id?: string
          legal_basis: string
          metadata?: Json
          module_key?: string
          name: string
          organisation_id: string
          record_category: string
          retention_period_months: number
          review_due_date?: string | null
          schedule_key: string
          status?: string
          statutory_reference?: string | null
          trigger_event?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_from?: string
          active_until?: string | null
          applies_to_special_category_data?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          disposal_action?: string
          id?: string
          legal_basis?: string
          metadata?: Json
          module_key?: string
          name?: string
          organisation_id?: string
          record_category?: string
          retention_period_months?: number
          review_due_date?: string | null
          schedule_key?: string
          status?: string
          statutory_reference?: string | null
          trigger_event?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_sar_case_register: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          assigned_to_user_id: string | null
          case_reference: string
          closure_reason: string | null
          created_at: string
          created_by: string | null
          disclosure_document_ids: string[]
          exemption_summary: string | null
          extended_due_at: string | null
          extension_reason: string | null
          id: string
          legal_hold: boolean
          metadata: Json
          organisation_id: string
          received_at: string
          redaction_summary: string | null
          requester_email: string | null
          requester_employee_id: string | null
          requester_name: string
          response_method: string | null
          response_sent_at: string | null
          response_sent_by: string | null
          scope_summary: string
          search_sources: Json
          status: string
          statutory_due_at: string
          updated_at: string
          verification_method: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          assigned_to_user_id?: string | null
          case_reference: string
          closure_reason?: string | null
          created_at?: string
          created_by?: string | null
          disclosure_document_ids?: string[]
          exemption_summary?: string | null
          extended_due_at?: string | null
          extension_reason?: string | null
          id?: string
          legal_hold?: boolean
          metadata?: Json
          organisation_id: string
          received_at: string
          redaction_summary?: string | null
          requester_email?: string | null
          requester_employee_id?: string | null
          requester_name: string
          response_method?: string | null
          response_sent_at?: string | null
          response_sent_by?: string | null
          scope_summary: string
          search_sources?: Json
          status?: string
          statutory_due_at: string
          updated_at?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          assigned_to_user_id?: string | null
          case_reference?: string
          closure_reason?: string | null
          created_at?: string
          created_by?: string | null
          disclosure_document_ids?: string[]
          exemption_summary?: string | null
          extended_due_at?: string | null
          extension_reason?: string | null
          id?: string
          legal_hold?: boolean
          metadata?: Json
          organisation_id?: string
          received_at?: string
          redaction_summary?: string | null
          requester_email?: string | null
          requester_employee_id?: string | null
          requester_name?: string
          response_method?: string | null
          response_sent_at?: string | null
          response_sent_by?: string | null
          scope_summary?: string
          search_sources?: Json
          status?: string
          statutory_due_at?: string
          updated_at?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      leo_schema_migrations: {
        Row: {
          applied_at: string
          metadata: Json
          migration_key: string
          migration_name: string
        }
        Insert: {
          applied_at?: string
          metadata?: Json
          migration_key: string
          migration_name: string
        }
        Update: {
          applied_at?: string
          metadata?: Json
          migration_key?: string
          migration_name?: string
        }
        Relationships: []
      }
      leo_security_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_key: string
          alert_type: string
          assigned_to: string | null
          authentication_event_id: string | null
          created_at: string
          description: string
          detection_rule: string | null
          device_id: string | null
          evidence: Json
          first_detected_at: string
          id: string
          last_detected_at: string
          membership_id: string | null
          metadata: Json
          occurrence_count: number
          organisation_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number
          session_id: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_key: string
          alert_type: string
          assigned_to?: string | null
          authentication_event_id?: string | null
          created_at?: string
          description: string
          detection_rule?: string | null
          device_id?: string | null
          evidence?: Json
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          membership_id?: string | null
          metadata?: Json
          occurrence_count?: number
          organisation_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number
          session_id?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_key?: string
          alert_type?: string
          assigned_to?: string | null
          authentication_event_id?: string | null
          created_at?: string
          description?: string
          detection_rule?: string | null
          device_id?: string | null
          evidence?: Json
          first_detected_at?: string
          id?: string
          last_detected_at?: string
          membership_id?: string | null
          metadata?: Json
          occurrence_count?: number
          organisation_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number
          session_id?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_security_alerts_authentication_event_id_fkey"
            columns: ["authentication_event_id"]
            isOneToOne: false
            referencedRelation: "leo_authentication_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_security_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "leo_trusted_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_security_alerts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "leo_security_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_security_definer_privilege_snapshot: {
        Row: {
          anon_execute_before: boolean
          authenticated_execute_before: boolean
          baseline_key: string
          captured_acl: string | null
          captured_at: string
          function_name: string
          function_oid: unknown
          function_owner: string
          function_schema: string
          id: number
          identity_arguments: string
          public_execute_after: boolean | null
          public_execute_before: boolean
          service_role_execute_before: boolean
        }
        Insert: {
          anon_execute_before: boolean
          authenticated_execute_before: boolean
          baseline_key: string
          captured_acl?: string | null
          captured_at?: string
          function_name: string
          function_oid: unknown
          function_owner: string
          function_schema: string
          id?: never
          identity_arguments: string
          public_execute_after?: boolean | null
          public_execute_before: boolean
          service_role_execute_before: boolean
        }
        Update: {
          anon_execute_before?: boolean
          authenticated_execute_before?: boolean
          baseline_key?: string
          captured_acl?: string | null
          captured_at?: string
          function_name?: string
          function_oid?: unknown
          function_owner?: string
          function_schema?: string
          id?: never
          identity_arguments?: string
          public_execute_after?: boolean | null
          public_execute_before?: boolean
          service_role_execute_before?: boolean
        }
        Relationships: []
      }
      leo_security_events: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actor_user_id: string | null
          affected_resource_id: string | null
          affected_resource_type: string | null
          affected_user_id: string | null
          assigned_to: string | null
          contained_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          detected_at: string
          event_reference: string
          event_type: string
          evidence: Json
          id: string
          ip_address: unknown
          metadata: Json
          notification_assessment: Json
          occurred_at: string
          organisation_id: string
          requires_notification_assessment: boolean
          resolution_summary: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          user_agent: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actor_user_id?: string | null
          affected_resource_id?: string | null
          affected_resource_type?: string | null
          affected_user_id?: string | null
          assigned_to?: string | null
          contained_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          detected_at?: string
          event_reference?: string
          event_type: string
          evidence?: Json
          id?: string
          ip_address?: unknown
          metadata?: Json
          notification_assessment?: Json
          occurred_at?: string
          organisation_id: string
          requires_notification_assessment?: boolean
          resolution_summary?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          user_agent?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actor_user_id?: string | null
          affected_resource_id?: string | null
          affected_resource_type?: string | null
          affected_user_id?: string | null
          assigned_to?: string | null
          contained_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          detected_at?: string
          event_reference?: string
          event_type?: string
          evidence?: Json
          id?: string
          ip_address?: unknown
          metadata?: Json
          notification_assessment?: Json
          occurred_at?: string
          organisation_id?: string
          requires_notification_assessment?: boolean
          resolution_summary?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      leo_security_health_checks: {
        Row: {
          category: string
          check_key: string
          check_name: string
          checked_at: string
          checked_by: string | null
          created_at: string
          findings: Json
          id: string
          metadata: Json
          next_check_due_at: string | null
          organisation_id: string | null
          remediation: Json
          score: number | null
          source: string
          status: string
          summary: string
        }
        Insert: {
          category: string
          check_key: string
          check_name: string
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          findings?: Json
          id?: string
          metadata?: Json
          next_check_due_at?: string | null
          organisation_id?: string | null
          remediation?: Json
          score?: number | null
          source?: string
          status: string
          summary: string
        }
        Update: {
          category?: string
          check_key?: string
          check_name?: string
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          findings?: Json
          id?: string
          metadata?: Json
          next_check_due_at?: string | null
          organisation_id?: string | null
          remediation?: Json
          score?: number | null
          source?: string
          status?: string
          summary?: string
        }
        Relationships: []
      }
      leo_security_sessions: {
        Row: {
          assurance_level: string
          auth_provider: string | null
          created_at: string
          device_id: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          issued_at: string
          last_seen_at: string
          membership_id: string | null
          metadata: Json
          organisation_id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          session_reference_hash: string
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          assurance_level?: string
          auth_provider?: string | null
          created_at?: string
          device_id?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          issued_at?: string
          last_seen_at?: string
          membership_id?: string | null
          metadata?: Json
          organisation_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          session_reference_hash: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          assurance_level?: string
          auth_provider?: string | null
          created_at?: string
          device_id?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          issued_at?: string
          last_seen_at?: string
          membership_id?: string | null
          metadata?: Json
          organisation_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          session_reference_hash?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leo_service_credentials: {
        Row: {
          created_at: string
          created_by: string | null
          credential_name: string
          environment: string
          expires_at: string | null
          id: string
          issued_at: string | null
          last_rotated_at: string | null
          last_used_at: string | null
          last_used_from: string | null
          metadata: Json
          next_rotation_due_at: string | null
          organisation_id: string
          provider_key: string
          purpose: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          scopes: string[]
          secret_provider: string
          secret_reference: string
          service_identity: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credential_name: string
          environment?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          last_rotated_at?: string | null
          last_used_at?: string | null
          last_used_from?: string | null
          metadata?: Json
          next_rotation_due_at?: string | null
          organisation_id: string
          provider_key: string
          purpose: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          secret_provider: string
          secret_reference: string
          service_identity?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credential_name?: string
          environment?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          last_rotated_at?: string | null
          last_used_at?: string | null
          last_used_from?: string | null
          metadata?: Json
          next_rotation_due_at?: string | null
          organisation_id?: string
          provider_key?: string
          purpose?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          secret_provider?: string
          secret_reference?: string
          service_identity?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_talent_activity: {
        Row: {
          activity_type: string
          application_id: string | null
          appointment_id: string | null
          candidate_id: string | null
          created_by: string | null
          description: string | null
          id: string
          interview_id: string | null
          metadata: Json
          occurred_at: string
          offer_id: string | null
          organisation_id: string | null
          title: string
          vacancy_id: string | null
        }
        Insert: {
          activity_type: string
          application_id?: string | null
          appointment_id?: string | null
          candidate_id?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          interview_id?: string | null
          metadata?: Json
          occurred_at?: string
          offer_id?: string | null
          organisation_id?: string | null
          title: string
          vacancy_id?: string | null
        }
        Update: {
          activity_type?: string
          application_id?: string | null
          appointment_id?: string | null
          candidate_id?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          interview_id?: string | null
          metadata?: Json
          occurred_at?: string
          offer_id?: string | null
          organisation_id?: string | null
          title?: string
          vacancy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_activity_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_activity_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_activity_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_activity_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_activity_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["interview_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_ai_activity: {
        Row: {
          ai_action: string
          application_id: string | null
          candidate_id: string | null
          confidence: number | null
          created_at: string
          created_by: string | null
          error_message: string | null
          human_review_required: boolean
          human_review_status: string
          id: string
          input_summary: Json
          interview_id: string | null
          model_name: string | null
          organisation_id: string | null
          output_summary: Json
          prompt_version: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          token_usage: Json
          vacancy_id: string | null
        }
        Insert: {
          ai_action: string
          application_id?: string | null
          candidate_id?: string | null
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          human_review_required?: boolean
          human_review_status?: string
          id?: string
          input_summary?: Json
          interview_id?: string | null
          model_name?: string | null
          organisation_id?: string | null
          output_summary?: Json
          prompt_version?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          token_usage?: Json
          vacancy_id?: string | null
        }
        Update: {
          ai_action?: string
          application_id?: string | null
          candidate_id?: string | null
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          human_review_required?: boolean
          human_review_status?: string
          id?: string
          input_summary?: Json
          interview_id?: string | null
          model_name?: string | null
          organisation_id?: string | null
          output_summary?: Json
          prompt_version?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          token_usage?: Json
          vacancy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_ai_activity_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["interview_id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_ai_activity_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_application_answers: {
        Row: {
          answer_json: Json
          answer_text: string | null
          application_id: string
          created_at: string
          file_document_id: string | null
          id: string
          organisation_id: string | null
          question_snapshot: string
          reviewer_notes: string | null
          score: number | null
          updated_at: string
          vacancy_question_id: string | null
        }
        Insert: {
          answer_json?: Json
          answer_text?: string | null
          application_id: string
          created_at?: string
          file_document_id?: string | null
          id?: string
          organisation_id?: string | null
          question_snapshot: string
          reviewer_notes?: string | null
          score?: number | null
          updated_at?: string
          vacancy_question_id?: string | null
        }
        Update: {
          answer_json?: Json
          answer_text?: string | null
          application_id?: string
          created_at?: string
          file_document_id?: string | null
          id?: string
          organisation_id?: string | null
          question_snapshot?: string
          reviewer_notes?: string | null
          score?: number | null
          updated_at?: string
          vacancy_question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_application_answers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_application_answers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_application_answers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_application_answers_file_document_id_fkey"
            columns: ["file_document_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_application_answers_vacancy_question_id_fkey"
            columns: ["vacancy_question_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_application_review_scores: {
        Row: {
          application_review_id: string
          created_at: string
          criterion_key: string
          criterion_name: string
          display_order: number
          id: string
          maximum_score: number | null
          notes: string | null
          score: number | null
        }
        Insert: {
          application_review_id: string
          created_at?: string
          criterion_key: string
          criterion_name: string
          display_order?: number
          id?: string
          maximum_score?: number | null
          notes?: string | null
          score?: number | null
        }
        Update: {
          application_review_id?: string
          created_at?: string
          criterion_key?: string
          criterion_name?: string
          display_order?: number
          id?: string
          maximum_score?: number | null
          notes?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_application_review_scores_application_review_id_fkey"
            columns: ["application_review_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_application_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_application_reviews: {
        Row: {
          application_id: string
          completed_at: string | null
          concerns: string | null
          created_at: string
          id: string
          notes: string | null
          organisation_id: string | null
          overall_score: number | null
          recommendation: string | null
          review_type: string
          reviewer_name: string | null
          reviewer_user_id: string | null
          strengths: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          concerns?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organisation_id?: string | null
          overall_score?: number | null
          recommendation?: string | null
          review_type?: string
          reviewer_name?: string | null
          reviewer_user_id?: string | null
          strengths?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          concerns?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organisation_id?: string | null
          overall_score?: number | null
          recommendation?: string | null
          review_type?: string
          reviewer_name?: string | null
          reviewer_user_id?: string | null
          strengths?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_application_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_application_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_application_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
        ]
      }
      leo_talent_application_stage_history: {
        Row: {
          application_id: string
          changed_at: string
          changed_by: string | null
          from_stage_key: string | null
          id: string
          organisation_id: string | null
          outcome: string | null
          reason: string | null
          to_stage_key: string
        }
        Insert: {
          application_id: string
          changed_at?: string
          changed_by?: string | null
          from_stage_key?: string | null
          id?: string
          organisation_id?: string | null
          outcome?: string | null
          reason?: string | null
          to_stage_key: string
        }
        Update: {
          application_id?: string
          changed_at?: string
          changed_by?: string | null
          from_stage_key?: string | null
          id?: string
          organisation_id?: string | null
          outcome?: string | null
          reason?: string | null
          to_stage_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_application_stage_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_application_stage_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_application_stage_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
        ]
      }
      leo_talent_applications: {
        Row: {
          ai_score: number | null
          ai_screening_enabled: boolean
          application_reference: string
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          blind_review_enabled: boolean
          candidate_id: string
          closed_at: string | null
          closed_reason: string | null
          combined_score: number | null
          created_at: string
          created_by: string | null
          current_stage_key: string
          id: string
          knockout_details: Json
          knockout_failed: boolean
          last_reviewed_at: string | null
          last_reviewed_by: string | null
          manual_score: number | null
          metadata: Json
          organisation_id: string | null
          recommendation: string | null
          recommendation_reason: string | null
          source: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          updated_by: string | null
          vacancy_id: string
          withdrawal_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          ai_score?: number | null
          ai_screening_enabled?: boolean
          application_reference?: string
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          blind_review_enabled?: boolean
          candidate_id: string
          closed_at?: string | null
          closed_reason?: string | null
          combined_score?: number | null
          created_at?: string
          created_by?: string | null
          current_stage_key?: string
          id?: string
          knockout_details?: Json
          knockout_failed?: boolean
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          manual_score?: number | null
          metadata?: Json
          organisation_id?: string | null
          recommendation?: string | null
          recommendation_reason?: string | null
          source?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
          vacancy_id: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          ai_score?: number | null
          ai_screening_enabled?: boolean
          application_reference?: string
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          blind_review_enabled?: boolean
          candidate_id?: string
          closed_at?: string | null
          closed_reason?: string | null
          combined_score?: number | null
          created_at?: string
          created_by?: string | null
          current_stage_key?: string
          id?: string
          knockout_details?: Json
          knockout_failed?: boolean
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          manual_score?: number | null
          metadata?: Json
          organisation_id?: string | null
          recommendation?: string | null
          recommendation_reason?: string | null
          source?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
          vacancy_id?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_appointments: {
        Row: {
          actual_start_date: string | null
          agreed_start_date: string | null
          application_id: string
          appointment_reference: string
          archived_at: string | null
          candidate_id: string
          created_at: string
          created_by: string | null
          department: string | null
          documents_transferred: boolean
          employee_created_at: string | null
          employee_created_by: string | null
          employee_id: number | null
          handover_completed_at: string | null
          handover_notes: string | null
          id: string
          learning_pathway_triggered: boolean
          location_name: string | null
          manager_name: string | null
          manager_user_id: string | null
          offer_id: string
          onboarding_transferred: boolean
          organisation_id: string | null
          recruitment_summary_transferred: boolean
          status: string
          updated_at: string
          updated_by: string | null
          vacancy_id: string
        }
        Insert: {
          actual_start_date?: string | null
          agreed_start_date?: string | null
          application_id: string
          appointment_reference?: string
          archived_at?: string | null
          candidate_id: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          documents_transferred?: boolean
          employee_created_at?: string | null
          employee_created_by?: string | null
          employee_id?: number | null
          handover_completed_at?: string | null
          handover_notes?: string | null
          id?: string
          learning_pathway_triggered?: boolean
          location_name?: string | null
          manager_name?: string | null
          manager_user_id?: string | null
          offer_id: string
          onboarding_transferred?: boolean
          organisation_id?: string | null
          recruitment_summary_transferred?: boolean
          status?: string
          updated_at?: string
          updated_by?: string | null
          vacancy_id: string
        }
        Update: {
          actual_start_date?: string | null
          agreed_start_date?: string | null
          application_id?: string
          appointment_reference?: string
          archived_at?: string | null
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          documents_transferred?: boolean
          employee_created_at?: string | null
          employee_created_by?: string | null
          employee_id?: number | null
          handover_completed_at?: string | null
          handover_notes?: string | null
          id?: string
          learning_pathway_triggered?: boolean
          location_name?: string | null
          manager_name?: string | null
          manager_user_id?: string | null
          offer_id?: string
          onboarding_transferred?: boolean
          organisation_id?: string | null
          recruitment_summary_transferred?: boolean
          status?: string
          updated_at?: string
          updated_by?: string | null
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_appointments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_appointments_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          changed_fields: string[]
          id: string
          new_values: Json | null
          occurred_at: string
          old_values: Json | null
          organisation_id: string | null
          record_id: string | null
          request_id: string | null
          source: string
          table_name: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          changed_fields?: string[]
          id?: string
          new_values?: Json | null
          occurred_at?: string
          old_values?: Json | null
          organisation_id?: string | null
          record_id?: string | null
          request_id?: string | null
          source?: string
          table_name: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          changed_fields?: string[]
          id?: string
          new_values?: Json | null
          occurred_at?: string
          old_values?: Json | null
          organisation_id?: string | null
          record_id?: string | null
          request_id?: string | null
          source?: string
          table_name?: string
        }
        Relationships: []
      }
      leo_talent_candidate_consents: {
        Row: {
          candidate_id: string
          consent_type: string
          evidence_document_id: string | null
          expires_at: string | null
          id: string
          lawful_basis: string
          metadata: Json
          organisation_id: string
          recorded_at: string
          recorded_by: string | null
          source: string | null
          status: string
          withdrawn_at: string | null
        }
        Insert: {
          candidate_id: string
          consent_type: string
          evidence_document_id?: string | null
          expires_at?: string | null
          id?: string
          lawful_basis: string
          metadata?: Json
          organisation_id: string
          recorded_at?: string
          recorded_by?: string | null
          source?: string | null
          status?: string
          withdrawn_at?: string | null
        }
        Update: {
          candidate_id?: string
          consent_type?: string
          evidence_document_id?: string | null
          expires_at?: string | null
          id?: string
          lawful_basis?: string
          metadata?: Json
          organisation_id?: string
          recorded_at?: string
          recorded_by?: string | null
          source?: string | null
          status?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      leo_talent_candidate_documents: {
        Row: {
          application_id: string | null
          archived_at: string | null
          candidate_id: string
          created_at: string
          document_date: string | null
          document_type: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          is_sensitive: boolean
          metadata: Json
          mime_type: string | null
          organisation_id: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          vacancy_id: string | null
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          visible_to_candidate: boolean
        }
        Insert: {
          application_id?: string | null
          archived_at?: string | null
          candidate_id: string
          created_at?: string
          document_date?: string | null
          document_type: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          is_sensitive?: boolean
          metadata?: Json
          mime_type?: string | null
          organisation_id?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          vacancy_id?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          visible_to_candidate?: boolean
        }
        Update: {
          application_id?: string | null
          archived_at?: string | null
          candidate_id?: string
          created_at?: string
          document_date?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          is_sensitive?: boolean
          metadata?: Json
          mime_type?: string | null
          organisation_id?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          vacancy_id?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          visible_to_candidate?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_candidate_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_candidate_notes: {
        Row: {
          application_id: string | null
          archived_at: string | null
          candidate_id: string
          created_at: string
          created_by: string | null
          id: string
          is_private: boolean
          note_text: string
          note_type: string
          organisation_id: string | null
          updated_at: string
          updated_by: string | null
          vacancy_id: string | null
        }
        Insert: {
          application_id?: string | null
          archived_at?: string | null
          candidate_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_private?: boolean
          note_text: string
          note_type?: string
          organisation_id?: string | null
          updated_at?: string
          updated_by?: string | null
          vacancy_id?: string | null
        }
        Update: {
          application_id?: string | null
          archived_at?: string | null
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_private?: boolean
          note_text?: string
          note_type?: string
          organisation_id?: string | null
          updated_at?: string
          updated_by?: string | null
          vacancy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_candidate_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_notes_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_candidate_tags: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          candidate_id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          candidate_id: string
          tag_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          candidate_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_candidate_tags_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_tags_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_tags_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_tags_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_candidate_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_candidates: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          candidate_reference: string
          consent_recorded_at: string | null
          consent_to_contact: boolean
          country: string | null
          county_region: string | null
          created_at: string
          created_by: string | null
          current_employer: string | null
          current_job_title: string | null
          data_retention_review_date: string | null
          do_not_contact: boolean
          do_not_contact_reason: string | null
          earliest_start_date: string | null
          email: string | null
          existing_employee_id: number | null
          first_name: string
          general_notes: string | null
          id: string
          is_internal_candidate: boolean
          last_name: string
          metadata: Json
          middle_names: string | null
          organisation_id: string | null
          phone: string | null
          postcode: string | null
          preferred_employment_type: string
          preferred_location: string | null
          preferred_name: string | null
          privacy_notice_version: string | null
          salary_expectations: string | null
          skills: Json
          source: string | null
          source_detail: string | null
          summary: string | null
          talent_pool_status: string
          town_city: string | null
          updated_at: string
          updated_by: string | null
          years_experience: number | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          candidate_reference?: string
          consent_recorded_at?: string | null
          consent_to_contact?: boolean
          country?: string | null
          county_region?: string | null
          created_at?: string
          created_by?: string | null
          current_employer?: string | null
          current_job_title?: string | null
          data_retention_review_date?: string | null
          do_not_contact?: boolean
          do_not_contact_reason?: string | null
          earliest_start_date?: string | null
          email?: string | null
          existing_employee_id?: number | null
          first_name: string
          general_notes?: string | null
          id?: string
          is_internal_candidate?: boolean
          last_name: string
          metadata?: Json
          middle_names?: string | null
          organisation_id?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_employment_type?: string
          preferred_location?: string | null
          preferred_name?: string | null
          privacy_notice_version?: string | null
          salary_expectations?: string | null
          skills?: Json
          source?: string | null
          source_detail?: string | null
          summary?: string | null
          talent_pool_status?: string
          town_city?: string | null
          updated_at?: string
          updated_by?: string | null
          years_experience?: number | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          candidate_reference?: string
          consent_recorded_at?: string | null
          consent_to_contact?: boolean
          country?: string | null
          county_region?: string | null
          created_at?: string
          created_by?: string | null
          current_employer?: string | null
          current_job_title?: string | null
          data_retention_review_date?: string | null
          do_not_contact?: boolean
          do_not_contact_reason?: string | null
          earliest_start_date?: string | null
          email?: string | null
          existing_employee_id?: number | null
          first_name?: string
          general_notes?: string | null
          id?: string
          is_internal_candidate?: boolean
          last_name?: string
          metadata?: Json
          middle_names?: string | null
          organisation_id?: string | null
          phone?: string | null
          postcode?: string | null
          preferred_employment_type?: string
          preferred_location?: string | null
          preferred_name?: string | null
          privacy_notice_version?: string | null
          salary_expectations?: string | null
          skills?: Json
          source?: string | null
          source_detail?: string | null
          summary?: string | null
          talent_pool_status?: string
          town_city?: string | null
          updated_at?: string
          updated_by?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      leo_talent_connection_events: {
        Row: {
          attempts: number
          completed_at: string | null
          connection_scope: string
          created_at: string
          direction: string
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          event_type: string
          external_reference: string | null
          id: string
          next_attempt_at: string | null
          organisation_id: string | null
          provider_key: string
          request_payload: Json
          response_payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          connection_scope?: string
          created_at?: string
          direction?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          event_type: string
          external_reference?: string | null
          id?: string
          next_attempt_at?: string | null
          organisation_id?: string | null
          provider_key: string
          request_payload?: Json
          response_payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          connection_scope?: string
          created_at?: string
          direction?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          event_type?: string
          external_reference?: string | null
          id?: string
          next_attempt_at?: string | null
          organisation_id?: string | null
          provider_key?: string
          request_payload?: Json
          response_payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      leo_talent_data_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          entity_type: string
          error_report: Json
          expires_at: string | null
          failed_rows: number
          file_name: string | null
          file_path: string | null
          filters: Json
          id: string
          job_type: string
          mapping: Json
          mime_type: string | null
          organisation_id: string | null
          processed_rows: number
          requested_by: string | null
          started_at: string | null
          status: string
          successful_rows: number
          total_rows: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entity_type: string
          error_report?: Json
          expires_at?: string | null
          failed_rows?: number
          file_name?: string | null
          file_path?: string | null
          filters?: Json
          id?: string
          job_type: string
          mapping?: Json
          mime_type?: string | null
          organisation_id?: string | null
          processed_rows?: number
          requested_by?: string | null
          started_at?: string | null
          status?: string
          successful_rows?: number
          total_rows?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entity_type?: string
          error_report?: Json
          expires_at?: string | null
          failed_rows?: number
          file_name?: string | null
          file_path?: string | null
          filters?: Json
          id?: string
          job_type?: string
          mapping?: Json
          mime_type?: string | null
          organisation_id?: string | null
          processed_rows?: number
          requested_by?: string | null
          started_at?: string | null
          status?: string
          successful_rows?: number
          total_rows?: number
          updated_at?: string
        }
        Relationships: []
      }
      leo_talent_dbs_checks: {
        Row: {
          application_date: string | null
          application_reference_masked: string | null
          barred_list_checked: boolean
          barred_list_result: string | null
          certificate_issue_date: string | null
          certificate_number_masked: string | null
          certificate_seen_at: string | null
          certificate_seen_by: string | null
          created_at: string
          dbs_level: string
          disclosures_present: boolean
          disclosures_summary: string | null
          evidence_document_id: string | null
          id: string
          notes: string | null
          organisation_id: string | null
          risk_assessment_outcome: string | null
          risk_assessment_required: boolean
          safer_recruitment_profile_id: string
          status: string
          update_service_check_date: string | null
          update_service_member: boolean
          update_service_result: string | null
          updated_at: string
          workforce_type: string | null
        }
        Insert: {
          application_date?: string | null
          application_reference_masked?: string | null
          barred_list_checked?: boolean
          barred_list_result?: string | null
          certificate_issue_date?: string | null
          certificate_number_masked?: string | null
          certificate_seen_at?: string | null
          certificate_seen_by?: string | null
          created_at?: string
          dbs_level: string
          disclosures_present?: boolean
          disclosures_summary?: string | null
          evidence_document_id?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
          risk_assessment_outcome?: string | null
          risk_assessment_required?: boolean
          safer_recruitment_profile_id: string
          status?: string
          update_service_check_date?: string | null
          update_service_member?: boolean
          update_service_result?: string | null
          updated_at?: string
          workforce_type?: string | null
        }
        Update: {
          application_date?: string | null
          application_reference_masked?: string | null
          barred_list_checked?: boolean
          barred_list_result?: string | null
          certificate_issue_date?: string | null
          certificate_number_masked?: string | null
          certificate_seen_at?: string | null
          certificate_seen_by?: string | null
          created_at?: string
          dbs_level?: string
          disclosures_present?: boolean
          disclosures_summary?: string | null
          evidence_document_id?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
          risk_assessment_outcome?: string | null
          risk_assessment_required?: boolean
          safer_recruitment_profile_id?: string
          status?: string
          update_service_check_date?: string | null
          update_service_member?: boolean
          update_service_result?: string | null
          updated_at?: string
          workforce_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_dbs_checks_evidence_document_id_fkey"
            columns: ["evidence_document_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_dbs_checks_safer_recruitment_profile_id_fkey"
            columns: ["safer_recruitment_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_safer_recruitment_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_employee_handover_controls: {
        Row: {
          application_id: string | null
          appointment_id: string
          authorised_at: string | null
          authorised_by: string | null
          candidate_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          documents_transferred: boolean
          due_diligence_complete: boolean
          employee_id: number | null
          failure_reason: string | null
          human_confirmation_required: boolean
          id: string
          learning_pathway_triggered: boolean
          metadata: Json
          offer_accepted_at: string | null
          offer_id: string | null
          onboarding_handover_ready: boolean
          onboarding_transferred: boolean
          organisation_id: string
          recruitment_summary_transferred: boolean
          status: string
          updated_at: string
          vacancy_id: string | null
        }
        Insert: {
          application_id?: string | null
          appointment_id: string
          authorised_at?: string | null
          authorised_by?: string | null
          candidate_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          documents_transferred?: boolean
          due_diligence_complete?: boolean
          employee_id?: number | null
          failure_reason?: string | null
          human_confirmation_required?: boolean
          id?: string
          learning_pathway_triggered?: boolean
          metadata?: Json
          offer_accepted_at?: string | null
          offer_id?: string | null
          onboarding_handover_ready?: boolean
          onboarding_transferred?: boolean
          organisation_id: string
          recruitment_summary_transferred?: boolean
          status?: string
          updated_at?: string
          vacancy_id?: string | null
        }
        Update: {
          application_id?: string | null
          appointment_id?: string
          authorised_at?: string | null
          authorised_by?: string | null
          candidate_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          documents_transferred?: boolean
          due_diligence_complete?: boolean
          employee_id?: number | null
          failure_reason?: string | null
          human_confirmation_required?: boolean
          id?: string
          learning_pathway_triggered?: boolean
          metadata?: Json
          offer_accepted_at?: string | null
          offer_id?: string | null
          onboarding_handover_ready?: boolean
          onboarding_transferred?: boolean
          organisation_id?: string
          recruitment_summary_transferred?: boolean
          status?: string
          updated_at?: string
          vacancy_id?: string | null
        }
        Relationships: []
      }
      leo_talent_employee_handover_queue: {
        Row: {
          appointment_id: string
          attempts: number
          candidate_snapshot: Json
          completed_at: string | null
          created_at: string
          created_by: string | null
          document_snapshot: Json
          employment_snapshot: Json
          error_message: string | null
          id: string
          last_attempt_at: string | null
          onboarding_snapshot: Json
          organisation_id: string | null
          recruitment_summary: Json
          status: string
          target_employee_id: number | null
          updated_at: string
        }
        Insert: {
          appointment_id: string
          attempts?: number
          candidate_snapshot?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          document_snapshot?: Json
          employment_snapshot?: Json
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          onboarding_snapshot?: Json
          organisation_id?: string | null
          recruitment_summary?: Json
          status?: string
          target_employee_id?: number | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          attempts?: number
          candidate_snapshot?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          document_snapshot?: Json
          employment_snapshot?: Json
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          onboarding_snapshot?: Json
          organisation_id?: string | null
          recruitment_summary?: Json
          status?: string
          target_employee_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_employee_handover_queue_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_employee_handover_queue_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["appointment_id"]
          },
        ]
      }
      leo_talent_employment_history_checks: {
        Row: {
          created_at: string
          employer_name: string
          end_date: string | null
          gap_before_days: number | null
          gap_explanation: string | null
          id: string
          job_title: string | null
          organisation_id: string | null
          safer_recruitment_profile_id: string
          start_date: string | null
          updated_at: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          employer_name: string
          end_date?: string | null
          gap_before_days?: number | null
          gap_explanation?: string | null
          id?: string
          job_title?: string | null
          organisation_id?: string | null
          safer_recruitment_profile_id: string
          start_date?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          employer_name?: string
          end_date?: string | null
          gap_before_days?: number | null
          gap_explanation?: string | null
          id?: string
          job_title?: string | null
          organisation_id?: string | null
          safer_recruitment_profile_id?: string
          start_date?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_employment_history_safer_recruitment_profile_id_fkey"
            columns: ["safer_recruitment_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_safer_recruitment_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_health_questionnaires: {
        Row: {
          adjustments_or_support: string | null
          appointment_id: string
          candidate_id: string
          candidate_notes: string | null
          created_at: string
          id: string
          organisation_id: string | null
          response_data: Json
          review_outcome: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sensitive_document_id: string | null
          sent_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          adjustments_or_support?: string | null
          appointment_id: string
          candidate_id: string
          candidate_notes?: string | null
          created_at?: string
          id?: string
          organisation_id?: string | null
          response_data?: Json
          review_outcome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sensitive_document_id?: string | null
          sent_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          adjustments_or_support?: string | null
          appointment_id?: string
          candidate_id?: string
          candidate_notes?: string | null
          created_at?: string
          id?: string
          organisation_id?: string | null
          response_data?: Json
          review_outcome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sensitive_document_id?: string | null
          sent_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_health_questionnaires_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_health_questionnaires_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "leo_talent_health_questionnaires_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_health_questionnaires_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_health_questionnaires_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_health_questionnaires_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_health_questionnaires_sensitive_document_id_fkey"
            columns: ["sensitive_document_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_identity_checks: {
        Row: {
          created_at: string
          document_id: string | null
          document_number_masked: string | null
          document_type: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_country: string | null
          notes: string | null
          organisation_id: string | null
          safer_recruitment_profile_id: string
          status: string
          updated_at: string
          verification_method: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          document_number_masked?: string | null
          document_type: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_country?: string | null
          notes?: string | null
          organisation_id?: string | null
          safer_recruitment_profile_id: string
          status?: string
          updated_at?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          document_number_masked?: string | null
          document_type?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_country?: string | null
          notes?: string | null
          organisation_id?: string | null
          safer_recruitment_profile_id?: string
          status?: string
          updated_at?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_identity_checks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_identity_checks_safer_recruitment_profile_id_fkey"
            columns: ["safer_recruitment_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_safer_recruitment_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_interview_panel_members: {
        Row: {
          attendance_status: string
          can_score: boolean
          created_at: string
          display_order: number
          employee_id: number | null
          id: string
          interview_id: string
          member_email: string | null
          member_name: string
          panel_role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attendance_status?: string
          can_score?: boolean
          created_at?: string
          display_order?: number
          employee_id?: number | null
          id?: string
          interview_id: string
          member_email?: string | null
          member_name: string
          panel_role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attendance_status?: string
          can_score?: boolean
          created_at?: string
          display_order?: number
          employee_id?: number | null
          id?: string
          interview_id?: string
          member_email?: string | null
          member_name?: string
          panel_role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_interview_panel_members_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_interview_panel_members_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["interview_id"]
          },
        ]
      }
      leo_talent_interview_scorecards: {
        Row: {
          concerns: string | null
          created_at: string
          id: string
          interview_id: string
          locked_at: string | null
          maximum_score: number | null
          organisation_id: string | null
          overall_notes: string | null
          panel_member_id: string | null
          recommendation: string | null
          reviewer_name: string | null
          reviewer_user_id: string | null
          status: string
          strengths: string | null
          submitted_at: string | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          concerns?: string | null
          created_at?: string
          id?: string
          interview_id: string
          locked_at?: string | null
          maximum_score?: number | null
          organisation_id?: string | null
          overall_notes?: string | null
          panel_member_id?: string | null
          recommendation?: string | null
          reviewer_name?: string | null
          reviewer_user_id?: string | null
          status?: string
          strengths?: string | null
          submitted_at?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          concerns?: string | null
          created_at?: string
          id?: string
          interview_id?: string
          locked_at?: string | null
          maximum_score?: number | null
          organisation_id?: string | null
          overall_notes?: string | null
          panel_member_id?: string | null
          recommendation?: string | null
          reviewer_name?: string | null
          reviewer_user_id?: string | null
          status?: string
          strengths?: string | null
          submitted_at?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_interview_scorecards_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_interview_scorecards_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["interview_id"]
          },
          {
            foreignKeyName: "leo_talent_interview_scorecards_panel_member_id_fkey"
            columns: ["panel_member_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_interview_panel_members"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_interview_scores: {
        Row: {
          competency_snapshot: string | null
          created_at: string
          display_order: number
          id: string
          question_snapshot: string
          response_notes: string | null
          score: number | null
          score_max: number | null
          scorecard_id: string
          template_question_id: string | null
          updated_at: string
          weighting: number
        }
        Insert: {
          competency_snapshot?: string | null
          created_at?: string
          display_order?: number
          id?: string
          question_snapshot: string
          response_notes?: string | null
          score?: number | null
          score_max?: number | null
          scorecard_id: string
          template_question_id?: string | null
          updated_at?: string
          weighting?: number
        }
        Update: {
          competency_snapshot?: string | null
          created_at?: string
          display_order?: number
          id?: string
          question_snapshot?: string
          response_notes?: string | null
          score?: number | null
          score_max?: number | null
          scorecard_id?: string
          template_question_id?: string | null
          updated_at?: string
          weighting?: number
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_interview_scores_scorecard_id_fkey"
            columns: ["scorecard_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_interview_scorecards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_interview_scores_template_question_id_fkey"
            columns: ["template_question_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_interview_template_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_interview_template_questions: {
        Row: {
          competency: string | null
          created_at: string
          display_order: number
          guidance: string | null
          id: string
          is_required: boolean
          question_text: string
          score_max: number
          score_min: number
          section_name: string | null
          template_id: string
          updated_at: string
          weighting: number
        }
        Insert: {
          competency?: string | null
          created_at?: string
          display_order?: number
          guidance?: string | null
          id?: string
          is_required?: boolean
          question_text: string
          score_max?: number
          score_min?: number
          section_name?: string | null
          template_id: string
          updated_at?: string
          weighting?: number
        }
        Update: {
          competency?: string | null
          created_at?: string
          display_order?: number
          guidance?: string | null
          id?: string
          is_required?: boolean
          question_text?: string
          score_max?: number
          score_min?: number
          section_name?: string | null
          template_id?: string
          updated_at?: string
          weighting?: number
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_interview_template_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_interview_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_interview_templates: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string | null
          file_path: string | null
          id: string
          instructions: string | null
          interview_type: string
          is_active: boolean
          is_default: boolean
          mime_type: string | null
          name: string
          organisation_id: string | null
          pass_score: number | null
          stage_name: string | null
          total_score_available: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          instructions?: string | null
          interview_type?: string
          is_active?: boolean
          is_default?: boolean
          mime_type?: string | null
          name: string
          organisation_id?: string | null
          pass_score?: number | null
          stage_name?: string | null
          total_score_available?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          instructions?: string | null
          interview_type?: string
          is_active?: boolean
          is_default?: boolean
          mime_type?: string | null
          name?: string
          organisation_id?: string | null
          pass_score?: number | null
          stage_name?: string | null
          total_score_available?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_talent_interviews: {
        Row: {
          ai_recommendation: string | null
          ai_recommendation_reason: string | null
          application_id: string
          archived_at: string | null
          calendar_event_id: string | null
          calendar_provider: string | null
          calendar_sync_status: string
          candidate_confirmed_at: string | null
          candidate_id: string
          candidate_instructions: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          internal_instructions: string | null
          interview_reference: string
          interview_type: string
          invitation_sent_at: string | null
          location: string | null
          meeting_url: string | null
          organisation_id: string | null
          outcome: string | null
          outcome_reason: string | null
          overall_score: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          stage_name: string
          stage_number: number
          status: string
          template_id: string | null
          timezone_name: string
          updated_at: string
          updated_by: string | null
          vacancy_id: string
        }
        Insert: {
          ai_recommendation?: string | null
          ai_recommendation_reason?: string | null
          application_id: string
          archived_at?: string | null
          calendar_event_id?: string | null
          calendar_provider?: string | null
          calendar_sync_status?: string
          candidate_confirmed_at?: string | null
          candidate_id: string
          candidate_instructions?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          internal_instructions?: string | null
          interview_reference?: string
          interview_type?: string
          invitation_sent_at?: string | null
          location?: string | null
          meeting_url?: string | null
          organisation_id?: string | null
          outcome?: string | null
          outcome_reason?: string | null
          overall_score?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          stage_name?: string
          stage_number?: number
          status?: string
          template_id?: string | null
          timezone_name?: string
          updated_at?: string
          updated_by?: string | null
          vacancy_id: string
        }
        Update: {
          ai_recommendation?: string | null
          ai_recommendation_reason?: string | null
          application_id?: string
          archived_at?: string | null
          calendar_event_id?: string | null
          calendar_provider?: string | null
          calendar_sync_status?: string
          candidate_confirmed_at?: string | null
          candidate_id?: string
          candidate_instructions?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          internal_instructions?: string | null
          interview_reference?: string
          interview_type?: string
          invitation_sent_at?: string | null
          location?: string | null
          meeting_url?: string | null
          organisation_id?: string | null
          outcome?: string | null
          outcome_reason?: string | null
          overall_score?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          stage_name?: string
          stage_number?: number
          status?: string
          template_id?: string | null
          timezone_name?: string
          updated_at?: string
          updated_by?: string | null
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_interview_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_interviews_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_offer_documents: {
        Row: {
          archived_at: string | null
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          offer_id: string
          organisation_id: string | null
          signature_status: string
          signed_at: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          version_number: number
          visible_to_candidate: boolean
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          offer_id: string
          organisation_id?: string | null
          signature_status?: string
          signed_at?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version_number?: number
          visible_to_candidate?: boolean
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          offer_id?: string
          organisation_id?: string | null
          signature_status?: string
          signed_at?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version_number?: number
          visible_to_candidate?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_offer_documents_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_offers: {
        Row: {
          accepted_at: string | null
          application_id: string
          approval_notes: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          candidate_id: string
          candidate_response_notes: string | null
          conditions: Json
          created_at: string
          created_by: string | null
          decline_reason: string | null
          declined_at: string | null
          department: string | null
          employment_type: string
          holiday_allowance_days: number | null
          hours_per_week: number | null
          id: string
          job_title: string
          location_name: string | null
          manager_name: string | null
          manager_user_id: string | null
          notice_period: string | null
          offer_reference: string
          offer_type: string
          organisation_id: string | null
          probation_months: number | null
          proposed_start_date: string | null
          response_deadline: string | null
          salary_amount: number | null
          salary_currency: string
          salary_period: string | null
          sent_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
          vacancy_id: string
          withdrawal_reason: string | null
          withdrawn_at: string | null
          work_pattern: string | null
        }
        Insert: {
          accepted_at?: string | null
          application_id: string
          approval_notes?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          candidate_id: string
          candidate_response_notes?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          department?: string | null
          employment_type: string
          holiday_allowance_days?: number | null
          hours_per_week?: number | null
          id?: string
          job_title: string
          location_name?: string | null
          manager_name?: string | null
          manager_user_id?: string | null
          notice_period?: string | null
          offer_reference?: string
          offer_type?: string
          organisation_id?: string | null
          probation_months?: number | null
          proposed_start_date?: string | null
          response_deadline?: string | null
          salary_amount?: number | null
          salary_currency?: string
          salary_period?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          vacancy_id: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
          work_pattern?: string | null
        }
        Update: {
          accepted_at?: string | null
          application_id?: string
          approval_notes?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          candidate_id?: string
          candidate_response_notes?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          department?: string | null
          employment_type?: string
          holiday_allowance_days?: number | null
          hours_per_week?: number | null
          id?: string
          job_title?: string
          location_name?: string | null
          manager_name?: string | null
          manager_user_id?: string | null
          notice_period?: string | null
          offer_reference?: string
          offer_type?: string
          organisation_id?: string | null
          probation_months?: number | null
          proposed_start_date?: string | null
          response_deadline?: string | null
          salary_amount?: number | null
          salary_currency?: string
          salary_period?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          vacancy_id?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
          work_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_offers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_offers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_offers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_offers_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_offers_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_offers_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_offers_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_offers_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_offers_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_offers_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_onboarding_items: {
        Row: {
          appointment_id: string
          assigned_to_user_id: string | null
          candidate_editable: boolean
          candidate_visible: boolean
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          item_category: string
          item_key: string
          item_name: string
          metadata: Json
          organisation_id: string | null
          owner_type: string
          source_template_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          assigned_to_user_id?: string | null
          candidate_editable?: boolean
          candidate_visible?: boolean
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          item_category?: string
          item_key: string
          item_name: string
          metadata?: Json
          organisation_id?: string | null
          owner_type?: string
          source_template_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          assigned_to_user_id?: string | null
          candidate_editable?: boolean
          candidate_visible?: boolean
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          item_category?: string
          item_key?: string
          item_name?: string
          metadata?: Json
          organisation_id?: string | null
          owner_type?: string
          source_template_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_onboarding_items_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_onboarding_items_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "leo_talent_onboarding_items_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_overseas_checks: {
        Row: {
          alternative_evidence: string | null
          concerns_details: string | null
          country: string
          created_at: string
          document_type: string | null
          evidence_document_id: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          notes: string | null
          organisation_id: string | null
          reason_required: string | null
          received_at: string | null
          requested_at: string | null
          safer_recruitment_profile_id: string
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          alternative_evidence?: string | null
          concerns_details?: string | null
          country: string
          created_at?: string
          document_type?: string | null
          evidence_document_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          organisation_id?: string | null
          reason_required?: string | null
          received_at?: string | null
          requested_at?: string | null
          safer_recruitment_profile_id: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          alternative_evidence?: string | null
          concerns_details?: string | null
          country?: string
          created_at?: string
          document_type?: string | null
          evidence_document_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          organisation_id?: string | null
          reason_required?: string | null
          received_at?: string | null
          requested_at?: string | null
          safer_recruitment_profile_id?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_overseas_checks_evidence_document_id_fkey"
            columns: ["evidence_document_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_overseas_checks_safer_recruitment_profile_id_fkey"
            columns: ["safer_recruitment_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_safer_recruitment_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_pipeline_stages: {
        Row: {
          colour_token: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_system_stage: boolean
          organisation_id: string | null
          stage_group: string
          stage_key: string
          stage_name: string
          updated_at: string
        }
        Insert: {
          colour_token?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_system_stage?: boolean
          organisation_id?: string | null
          stage_group?: string
          stage_key: string
          stage_name: string
          updated_at?: string
        }
        Update: {
          colour_token?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_system_stage?: boolean
          organisation_id?: string | null
          stage_group?: string
          stage_key?: string
          stage_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leo_talent_pre_employment_declarations: {
        Row: {
          application_id: string
          candidate_confirmed: boolean
          confirmed_at: string | null
          created_at: string
          declaration_text: string
          declaration_type: string
          details: string | null
          id: string
          organisation_id: string | null
          response: string | null
          review_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          candidate_confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          declaration_text: string
          declaration_type: string
          details?: string | null
          id?: string
          organisation_id?: string | null
          response?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          candidate_confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          declaration_text?: string
          declaration_type?: string
          details?: string | null
          id?: string
          organisation_id?: string | null
          response?: string | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_pre_employment_declarations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_pre_employment_declarations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_pre_employment_declarations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
        ]
      }
      leo_talent_qualification_checks: {
        Row: {
          achieved_date: string | null
          awarding_body: string | null
          created_at: string
          evidence_document_id: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          organisation_id: string | null
          qualification_name: string
          qualification_number_masked: string | null
          required_for_role: boolean
          safer_recruitment_profile_id: string
          status: string
          updated_at: string
          verification_method: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          achieved_date?: string | null
          awarding_body?: string | null
          created_at?: string
          evidence_document_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
          qualification_name: string
          qualification_number_masked?: string | null
          required_for_role?: boolean
          safer_recruitment_profile_id: string
          status?: string
          updated_at?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          achieved_date?: string | null
          awarding_body?: string | null
          created_at?: string
          evidence_document_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          organisation_id?: string | null
          qualification_name?: string
          qualification_number_masked?: string | null
          required_for_role?: boolean
          safer_recruitment_profile_id?: string
          status?: string
          updated_at?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_qualification_chec_safer_recruitment_profile_id_fkey"
            columns: ["safer_recruitment_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_safer_recruitment_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_qualification_checks_evidence_document_id_fkey"
            columns: ["evidence_document_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_references: {
        Row: {
          concerns_declared: boolean
          concerns_details: string | null
          created_at: string
          email: string | null
          employment_end_date: string | null
          employment_start_date: string | null
          evidence_document_id: string | null
          id: string
          organisation_id: string | null
          organisation_name: string | null
          outcome: string
          phone: string | null
          phone_verification_notes: string | null
          phone_verification_required: boolean
          phone_verification_status: string
          phone_verified_at: string | null
          phone_verified_by: string | null
          received_at: string | null
          referee_job_title: string | null
          referee_name: string
          reference_number: number
          reference_response: Json
          relationship_to_candidate: string | null
          request_status: string
          requested_at: string | null
          safer_recruitment_profile_id: string
          updated_at: string
        }
        Insert: {
          concerns_declared?: boolean
          concerns_details?: string | null
          created_at?: string
          email?: string | null
          employment_end_date?: string | null
          employment_start_date?: string | null
          evidence_document_id?: string | null
          id?: string
          organisation_id?: string | null
          organisation_name?: string | null
          outcome?: string
          phone?: string | null
          phone_verification_notes?: string | null
          phone_verification_required?: boolean
          phone_verification_status?: string
          phone_verified_at?: string | null
          phone_verified_by?: string | null
          received_at?: string | null
          referee_job_title?: string | null
          referee_name: string
          reference_number?: number
          reference_response?: Json
          relationship_to_candidate?: string | null
          request_status?: string
          requested_at?: string | null
          safer_recruitment_profile_id: string
          updated_at?: string
        }
        Update: {
          concerns_declared?: boolean
          concerns_details?: string | null
          created_at?: string
          email?: string | null
          employment_end_date?: string | null
          employment_start_date?: string | null
          evidence_document_id?: string | null
          id?: string
          organisation_id?: string | null
          organisation_name?: string | null
          outcome?: string
          phone?: string | null
          phone_verification_notes?: string | null
          phone_verification_required?: boolean
          phone_verification_status?: string
          phone_verified_at?: string | null
          phone_verified_by?: string | null
          received_at?: string | null
          referee_job_title?: string | null
          referee_name?: string
          reference_number?: number
          reference_response?: Json
          relationship_to_candidate?: string | null
          request_status?: string
          requested_at?: string | null
          safer_recruitment_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_references_evidence_document_id_fkey"
            columns: ["evidence_document_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_references_safer_recruitment_profile_id_fkey"
            columns: ["safer_recruitment_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_safer_recruitment_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_right_to_work_checks: {
        Row: {
          check_date: string | null
          check_type: string
          created_at: string
          evidence_document_id: string | null
          expiry_date: string | null
          follow_up_date: string | null
          id: string
          nationality: string | null
          notes: string | null
          organisation_id: string | null
          restriction_details: string | null
          right_to_work_status: string
          safer_recruitment_profile_id: string
          share_code_masked: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          check_date?: string | null
          check_type?: string
          created_at?: string
          evidence_document_id?: string | null
          expiry_date?: string | null
          follow_up_date?: string | null
          id?: string
          nationality?: string | null
          notes?: string | null
          organisation_id?: string | null
          restriction_details?: string | null
          right_to_work_status?: string
          safer_recruitment_profile_id: string
          share_code_masked?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          check_date?: string | null
          check_type?: string
          created_at?: string
          evidence_document_id?: string | null
          expiry_date?: string | null
          follow_up_date?: string | null
          id?: string
          nationality?: string | null
          notes?: string | null
          organisation_id?: string | null
          restriction_details?: string | null
          right_to_work_status?: string
          safer_recruitment_profile_id?: string
          share_code_masked?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_right_to_work_chec_safer_recruitment_profile_id_fkey"
            columns: ["safer_recruitment_profile_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_safer_recruitment_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_right_to_work_checks_evidence_document_id_fkey"
            columns: ["evidence_document_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_safer_recruitment_profiles: {
        Row: {
          application_id: string
          candidate_id: string
          completed_at: string | null
          created_at: string
          id: string
          organisation_id: string | null
          overall_notes: string | null
          overall_risk_level: string
          review_required: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          vacancy_id: string
        }
        Insert: {
          application_id: string
          candidate_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          organisation_id?: string | null
          overall_notes?: string | null
          overall_risk_level?: string
          review_required?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          vacancy_id: string
        }
        Update: {
          application_id?: string
          candidate_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          organisation_id?: string | null
          overall_notes?: string | null
          overall_risk_level?: string
          review_required?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_safer_recruitment_profiles_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_saved_views: {
        Row: {
          columns: Json
          created_at: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          name: string
          organisation_id: string | null
          sort: Json
          updated_at: string
          user_id: string | null
          workspace: string
        }
        Insert: {
          columns?: Json
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          name: string
          organisation_id?: string | null
          sort?: Json
          updated_at?: string
          user_id?: string | null
          workspace: string
        }
        Update: {
          columns?: Json
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          name?: string
          organisation_id?: string | null
          sort?: Json
          updated_at?: string
          user_id?: string | null
          workspace?: string
        }
        Relationships: []
      }
      leo_talent_security_inventory: {
        Row: {
          compatibility_notes: string | null
          compatibility_status: string
          inspected_at: string
          organisation_resolution: string | null
          policies_installed: boolean
          record_type: string | null
          rls_enabled_by_migration: boolean
          table_name: string
          table_schema: string
          was_rls: boolean
        }
        Insert: {
          compatibility_notes?: string | null
          compatibility_status?: string
          inspected_at?: string
          organisation_resolution?: string | null
          policies_installed?: boolean
          record_type?: string | null
          rls_enabled_by_migration?: boolean
          table_name: string
          table_schema: string
          was_rls?: boolean
        }
        Update: {
          compatibility_notes?: string | null
          compatibility_status?: string
          inspected_at?: string
          organisation_resolution?: string | null
          policies_installed?: boolean
          record_type?: string | null
          rls_enabled_by_migration?: boolean
          table_name?: string
          table_schema?: string
          was_rls?: boolean
        }
        Relationships: []
      }
      leo_talent_security_profiles: {
        Row: {
          accepted_offer_confirmed: boolean
          ai_context_allowed: boolean
          ai_context_requires_redaction: boolean
          application_id: string | null
          appointment_id: string | null
          autonomous_decision_permitted: boolean
          candidate_id: string | null
          confidentiality: string
          contains_candidate_personal_data: boolean
          contains_criminal_record_data: boolean
          contains_health_data: boolean
          contains_special_category_data: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          human_decision_required: boolean
          id: string
          legal_hold: boolean
          legal_hold_reference: string | null
          metadata: Json
          offer_id: string | null
          organisation_id: string
          post_offer_access_required: boolean
          record_type: string
          retention_class: string
          retention_until: string | null
          source_record_id: string
          source_table: string
          updated_at: string
          updated_by: string | null
          vacancy_id: string | null
        }
        Insert: {
          accepted_offer_confirmed?: boolean
          ai_context_allowed?: boolean
          ai_context_requires_redaction?: boolean
          application_id?: string | null
          appointment_id?: string | null
          autonomous_decision_permitted?: boolean
          candidate_id?: string | null
          confidentiality?: string
          contains_candidate_personal_data?: boolean
          contains_criminal_record_data?: boolean
          contains_health_data?: boolean
          contains_special_category_data?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          human_decision_required?: boolean
          id?: string
          legal_hold?: boolean
          legal_hold_reference?: string | null
          metadata?: Json
          offer_id?: string | null
          organisation_id: string
          post_offer_access_required?: boolean
          record_type: string
          retention_class?: string
          retention_until?: string | null
          source_record_id: string
          source_table: string
          updated_at?: string
          updated_by?: string | null
          vacancy_id?: string | null
        }
        Update: {
          accepted_offer_confirmed?: boolean
          ai_context_allowed?: boolean
          ai_context_requires_redaction?: boolean
          application_id?: string | null
          appointment_id?: string | null
          autonomous_decision_permitted?: boolean
          candidate_id?: string | null
          confidentiality?: string
          contains_candidate_personal_data?: boolean
          contains_criminal_record_data?: boolean
          contains_health_data?: boolean
          contains_special_category_data?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          human_decision_required?: boolean
          id?: string
          legal_hold?: boolean
          legal_hold_reference?: string | null
          metadata?: Json
          offer_id?: string | null
          organisation_id?: string
          post_offer_access_required?: boolean
          record_type?: string
          retention_class?: string
          retention_until?: string | null
          source_record_id?: string
          source_table?: string
          updated_at?: string
          updated_by?: string | null
          vacancy_id?: string | null
        }
        Relationships: []
      }
      leo_talent_settings: {
        Row: {
          ai_screening_enabled: boolean
          allow_candidate_self_service: boolean
          allow_internal_candidates: boolean
          archive_closed_vacancies_after_days: number
          auto_create_employee_on_acceptance: boolean
          blind_review_enabled: boolean
          candidate_retention_months: number
          created_at: string
          created_by: string | null
          default_application_stage: string
          default_country: string
          default_currency: string
          default_interview_duration_minutes: number
          default_jurisdiction: string
          default_reference_count: number
          health_questionnaire_after_acceptance_only: boolean
          id: string
          organisation_id: string | null
          regulated_role_reference_count: number
          require_overseas_check_when_applicable: boolean
          require_reference_phone_verification: boolean
          require_right_to_work: boolean
          safer_recruitment_enabled: boolean
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_screening_enabled?: boolean
          allow_candidate_self_service?: boolean
          allow_internal_candidates?: boolean
          archive_closed_vacancies_after_days?: number
          auto_create_employee_on_acceptance?: boolean
          blind_review_enabled?: boolean
          candidate_retention_months?: number
          created_at?: string
          created_by?: string | null
          default_application_stage?: string
          default_country?: string
          default_currency?: string
          default_interview_duration_minutes?: number
          default_jurisdiction?: string
          default_reference_count?: number
          health_questionnaire_after_acceptance_only?: boolean
          id?: string
          organisation_id?: string | null
          regulated_role_reference_count?: number
          require_overseas_check_when_applicable?: boolean
          require_reference_phone_verification?: boolean
          require_right_to_work?: boolean
          safer_recruitment_enabled?: boolean
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_screening_enabled?: boolean
          allow_candidate_self_service?: boolean
          allow_internal_candidates?: boolean
          archive_closed_vacancies_after_days?: number
          auto_create_employee_on_acceptance?: boolean
          blind_review_enabled?: boolean
          candidate_retention_months?: number
          created_at?: string
          created_by?: string | null
          default_application_stage?: string
          default_country?: string
          default_currency?: string
          default_interview_duration_minutes?: number
          default_jurisdiction?: string
          default_reference_count?: number
          health_questionnaire_after_acceptance_only?: boolean
          id?: string
          organisation_id?: string | null
          regulated_role_reference_count?: number
          require_overseas_check_when_applicable?: boolean
          require_reference_phone_verification?: boolean
          require_right_to_work?: boolean
          safer_recruitment_enabled?: boolean
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      leo_talent_stage_decisions: {
        Row: {
          ai_assistance_used: boolean
          ai_execution_id: string | null
          application_id: string | null
          candidate_id: string | null
          decided_at: string
          decided_by: string
          decision_key: string
          decision_reason: string
          human_review_confirmed: boolean
          id: string
          is_current: boolean
          metadata: Json
          organisation_id: string
          stage_key: string
          supersedes_decision_id: string | null
          vacancy_id: string | null
        }
        Insert: {
          ai_assistance_used?: boolean
          ai_execution_id?: string | null
          application_id?: string | null
          candidate_id?: string | null
          decided_at?: string
          decided_by?: string
          decision_key: string
          decision_reason: string
          human_review_confirmed?: boolean
          id?: string
          is_current?: boolean
          metadata?: Json
          organisation_id: string
          stage_key: string
          supersedes_decision_id?: string | null
          vacancy_id?: string | null
        }
        Update: {
          ai_assistance_used?: boolean
          ai_execution_id?: string | null
          application_id?: string | null
          candidate_id?: string | null
          decided_at?: string
          decided_by?: string
          decision_key?: string
          decision_reason?: string
          human_review_confirmed?: boolean
          id?: string
          is_current?: boolean
          metadata?: Json
          organisation_id?: string
          stage_key?: string
          supersedes_decision_id?: string | null
          vacancy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_stage_decisions_supersedes_decision_id_fkey"
            columns: ["supersedes_decision_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_stage_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_tags: {
        Row: {
          colour_token: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organisation_id: string | null
          updated_at: string
        }
        Insert: {
          colour_token?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organisation_id?: string | null
          updated_at?: string
        }
        Update: {
          colour_token?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organisation_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leo_talent_tasks: {
        Row: {
          application_id: string | null
          appointment_id: string | null
          archived_at: string | null
          assigned_to_name: string | null
          assigned_to_user_id: string | null
          candidate_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          organisation_id: string | null
          priority: string
          status: string
          task_type: string
          title: string
          updated_at: string
          vacancy_id: string | null
        }
        Insert: {
          application_id?: string | null
          appointment_id?: string | null
          archived_at?: string | null
          assigned_to_name?: string | null
          assigned_to_user_id?: string | null
          candidate_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          organisation_id?: string | null
          priority?: string
          status?: string
          task_type?: string
          title: string
          updated_at?: string
          vacancy_id?: string | null
        }
        Update: {
          application_id?: string | null
          appointment_id?: string | null
          archived_at?: string | null
          assigned_to_name?: string | null
          assigned_to_user_id?: string | null
          candidate_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          organisation_id?: string | null
          priority?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          vacancy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["appointment_id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_tasks_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_templates: {
        Row: {
          archived_at: string | null
          content: Json
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string | null
          file_path: string | null
          id: string
          is_active: boolean
          is_default: boolean
          mime_type: string | null
          name: string
          organisation_id: string | null
          template_type: string
          updated_at: string
          updated_by: string | null
          version_number: number
        }
        Insert: {
          archived_at?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          mime_type?: string | null
          name: string
          organisation_id?: string | null
          template_type: string
          updated_at?: string
          updated_by?: string | null
          version_number?: number
        }
        Update: {
          archived_at?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          mime_type?: string | null
          name?: string
          organisation_id?: string | null
          template_type?: string
          updated_at?: string
          updated_by?: string | null
          version_number?: number
        }
        Relationships: []
      }
      leo_talent_vacancies: {
        Row: {
          accepts_internal_candidates: boolean
          advert_text: string | null
          ai_screening_enabled: boolean
          application_form_template_id: string | null
          approval_notes: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          benefits: string | null
          blind_review_enabled: boolean
          business_area: string | null
          closed_at: string | null
          closed_reason: string | null
          closing_date: string | null
          created_at: string
          created_by: string | null
          dbs_level: string | null
          department: string | null
          desirable_criteria: string | null
          employment_type: string
          essential_criteria: string | null
          hiring_manager_name: string | null
          hiring_manager_user_id: string | null
          hours_per_week: number | null
          id: string
          interview_template_id: string | null
          is_internal_only: boolean
          location_name: string | null
          metadata: Json
          number_of_positions: number
          onboarding_template_id: string | null
          opening_date: string | null
          organisation_id: string | null
          overseas_check_required_if_applicable: boolean
          published_at: string | null
          recruitment_lead_name: string | null
          recruitment_lead_user_id: string | null
          reference_validation_required: boolean
          regulated_role: boolean
          required_reference_count: number
          requires_dbs: boolean
          requires_driving: boolean
          requires_qualification_checks: boolean
          responsibilities: string | null
          role_summary: string | null
          safer_recruitment_required: boolean
          salary_currency: string
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          salary_visible: boolean
          site_id: string | null
          status: string
          target_start_date: string | null
          title: string
          updated_at: string
          updated_by: string | null
          vacancy_reference: string
          vacancy_slug: string
          work_pattern: string | null
        }
        Insert: {
          accepts_internal_candidates?: boolean
          advert_text?: string | null
          ai_screening_enabled?: boolean
          application_form_template_id?: string | null
          approval_notes?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          benefits?: string | null
          blind_review_enabled?: boolean
          business_area?: string | null
          closed_at?: string | null
          closed_reason?: string | null
          closing_date?: string | null
          created_at?: string
          created_by?: string | null
          dbs_level?: string | null
          department?: string | null
          desirable_criteria?: string | null
          employment_type?: string
          essential_criteria?: string | null
          hiring_manager_name?: string | null
          hiring_manager_user_id?: string | null
          hours_per_week?: number | null
          id?: string
          interview_template_id?: string | null
          is_internal_only?: boolean
          location_name?: string | null
          metadata?: Json
          number_of_positions?: number
          onboarding_template_id?: string | null
          opening_date?: string | null
          organisation_id?: string | null
          overseas_check_required_if_applicable?: boolean
          published_at?: string | null
          recruitment_lead_name?: string | null
          recruitment_lead_user_id?: string | null
          reference_validation_required?: boolean
          regulated_role?: boolean
          required_reference_count?: number
          requires_dbs?: boolean
          requires_driving?: boolean
          requires_qualification_checks?: boolean
          responsibilities?: string | null
          role_summary?: string | null
          safer_recruitment_required?: boolean
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          salary_visible?: boolean
          site_id?: string | null
          status?: string
          target_start_date?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          vacancy_reference?: string
          vacancy_slug: string
          work_pattern?: string | null
        }
        Update: {
          accepts_internal_candidates?: boolean
          advert_text?: string | null
          ai_screening_enabled?: boolean
          application_form_template_id?: string | null
          approval_notes?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          benefits?: string | null
          blind_review_enabled?: boolean
          business_area?: string | null
          closed_at?: string | null
          closed_reason?: string | null
          closing_date?: string | null
          created_at?: string
          created_by?: string | null
          dbs_level?: string | null
          department?: string | null
          desirable_criteria?: string | null
          employment_type?: string
          essential_criteria?: string | null
          hiring_manager_name?: string | null
          hiring_manager_user_id?: string | null
          hours_per_week?: number | null
          id?: string
          interview_template_id?: string | null
          is_internal_only?: boolean
          location_name?: string | null
          metadata?: Json
          number_of_positions?: number
          onboarding_template_id?: string | null
          opening_date?: string | null
          organisation_id?: string | null
          overseas_check_required_if_applicable?: boolean
          published_at?: string | null
          recruitment_lead_name?: string | null
          recruitment_lead_user_id?: string | null
          reference_validation_required?: boolean
          regulated_role?: boolean
          required_reference_count?: number
          requires_dbs?: boolean
          requires_driving?: boolean
          requires_qualification_checks?: boolean
          responsibilities?: string | null
          role_summary?: string | null
          safer_recruitment_required?: boolean
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          salary_visible?: boolean
          site_id?: string | null
          status?: string
          target_start_date?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          vacancy_reference?: string
          vacancy_slug?: string
          work_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_vacancies_application_form_template_id_fkey"
            columns: ["application_form_template_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_vacancies_interview_template_id_fkey"
            columns: ["interview_template_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_vacancies_onboarding_template_id_fkey"
            columns: ["onboarding_template_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_talent_vacancy_documents: {
        Row: {
          archived_at: string | null
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          is_current: boolean
          mime_type: string | null
          notes: string | null
          organisation_id: string | null
          title: string
          uploaded_by: string | null
          vacancy_id: string
          version_number: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          is_current?: boolean
          mime_type?: string | null
          notes?: string | null
          organisation_id?: string | null
          title: string
          uploaded_by?: string | null
          vacancy_id: string
          version_number?: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          is_current?: boolean
          mime_type?: string | null
          notes?: string | null
          organisation_id?: string | null
          title?: string
          uploaded_by?: string | null
          vacancy_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_vacancy_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_documents_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_vacancy_publication_channels: {
        Row: {
          channel_name: string
          channel_type: string
          closed_at: string | null
          connection_payload: Json
          connection_provider_key: string | null
          created_at: string
          external_reference: string | null
          id: string
          organisation_id: string | null
          published_at: string | null
          published_url: string | null
          status: string
          updated_at: string
          vacancy_id: string
        }
        Insert: {
          channel_name: string
          channel_type?: string
          closed_at?: string | null
          connection_payload?: Json
          connection_provider_key?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          organisation_id?: string | null
          published_at?: string | null
          published_url?: string | null
          status?: string
          updated_at?: string
          vacancy_id: string
        }
        Update: {
          channel_name?: string
          channel_type?: string
          closed_at?: string | null
          connection_payload?: Json
          connection_provider_key?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          organisation_id?: string | null
          published_at?: string | null
          published_url?: string | null
          status?: string
          updated_at?: string
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_vacancy_publication_channels_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_publication_channels_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_publication_channels_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_publication_channels_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_publication_channels_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_publication_channels_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_talent_vacancy_questions: {
        Row: {
          blind_review_excluded: boolean
          created_at: string
          display_order: number
          help_text: string | null
          id: string
          is_active: boolean
          is_knockout: boolean
          is_required: boolean
          knockout_rule: Json
          options: Json
          organisation_id: string | null
          question_text: string
          question_type: string
          updated_at: string
          vacancy_id: string
        }
        Insert: {
          blind_review_excluded?: boolean
          created_at?: string
          display_order?: number
          help_text?: string | null
          id?: string
          is_active?: boolean
          is_knockout?: boolean
          is_required?: boolean
          knockout_rule?: Json
          options?: Json
          organisation_id?: string | null
          question_text: string
          question_type?: string
          updated_at?: string
          vacancy_id: string
        }
        Update: {
          blind_review_excluded?: boolean
          created_at?: string
          display_order?: number
          help_text?: string | null
          id?: string
          is_active?: boolean
          is_knockout?: boolean
          is_required?: boolean
          knockout_rule?: Json
          options?: Json
          organisation_id?: string | null
          question_text?: string
          question_type?: string
          updated_at?: string
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_talent_vacancy_questions_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_public_careers_vacancies"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_questions_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_candidate_application_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_questions_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_pre_employment_progress_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_questions_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_upcoming_interviews_view"
            referencedColumns: ["vacancy_id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_questions_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_talent_vacancy_questions_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "leo_talent_vacancy_pipeline_view"
            referencedColumns: ["vacancy_id"]
          },
        ]
      }
      leo_trusted_devices: {
        Row: {
          browser_name: string | null
          created_at: string
          device_fingerprint_hash: string
          device_name: string | null
          device_type: string | null
          first_seen_at: string
          id: string
          last_ip_address: unknown
          last_seen_at: string
          metadata: Json
          operating_system: string | null
          organisation_id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          trust_expires_at: string | null
          trusted_at: string | null
          trusted_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          browser_name?: string | null
          created_at?: string
          device_fingerprint_hash: string
          device_name?: string | null
          device_type?: string | null
          first_seen_at?: string
          id?: string
          last_ip_address?: unknown
          last_seen_at?: string
          metadata?: Json
          operating_system?: string | null
          organisation_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          trust_expires_at?: string | null
          trusted_at?: string | null
          trusted_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          browser_name?: string | null
          created_at?: string
          device_fingerprint_hash?: string
          device_name?: string | null
          device_type?: string | null
          first_seen_at?: string
          id?: string
          last_ip_address?: unknown
          last_seen_at?: string
          metadata?: Json
          operating_system?: string | null
          organisation_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          trust_expires_at?: string | null
          trusted_at?: string | null
          trusted_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leo_workflow_approvals: {
        Row: {
          approval_type: string
          assigned_approver_id: string | null
          created_at: string
          decision_at: string | null
          decision_by: string | null
          decision_reason: string | null
          expires_at: string | null
          id: string
          metadata: Json
          organisation_id: string
          payload_summary: Json
          requested_at: string
          requested_by: string
          risk_classification: string
          status: string
          updated_at: string
          workflow_instance_id: string
          workflow_instance_step_id: string | null
        }
        Insert: {
          approval_type?: string
          assigned_approver_id?: string | null
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_reason?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          organisation_id: string
          payload_summary?: Json
          requested_at?: string
          requested_by: string
          risk_classification?: string
          status?: string
          updated_at?: string
          workflow_instance_id: string
          workflow_instance_step_id?: string | null
        }
        Update: {
          approval_type?: string
          assigned_approver_id?: string | null
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_reason?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json
          organisation_id?: string
          payload_summary?: Json
          requested_at?: string
          requested_by?: string
          risk_classification?: string
          status?: string
          updated_at?: string
          workflow_instance_id?: string
          workflow_instance_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_workflow_approvals_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "leo_workflow_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_workflow_approvals_workflow_instance_step_id_fkey"
            columns: ["workflow_instance_step_id"]
            isOneToOne: false
            referencedRelation: "leo_workflow_instance_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_workflow_definition_steps: {
        Row: {
          action_config: Json
          assignment_rule: Json
          created_at: string
          due_after_interval: string | null
          escalation_after_interval: string | null
          id: string
          is_active: boolean
          metadata: Json
          organisation_id: string
          required_permission_key: string | null
          requires_reason: boolean
          step_key: string
          step_name: string
          step_order: number
          step_type: string
          updated_at: string
          workflow_definition_id: string
        }
        Insert: {
          action_config?: Json
          assignment_rule?: Json
          created_at?: string
          due_after_interval?: string | null
          escalation_after_interval?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          organisation_id: string
          required_permission_key?: string | null
          requires_reason?: boolean
          step_key: string
          step_name: string
          step_order: number
          step_type: string
          updated_at?: string
          workflow_definition_id: string
        }
        Update: {
          action_config?: Json
          assignment_rule?: Json
          created_at?: string
          due_after_interval?: string | null
          escalation_after_interval?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          organisation_id?: string
          required_permission_key?: string | null
          requires_reason?: boolean
          step_key?: string
          step_name?: string
          step_order?: number
          step_type?: string
          updated_at?: string
          workflow_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_workflow_definition_steps_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "leo_workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_workflow_definitions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          domain_area: string
          id: string
          metadata: Json
          name: string
          organisation_id: string
          published_at: string | null
          published_by: string | null
          risk_classification: string
          status: string
          subject_type: string | null
          updated_at: string
          updated_by: string | null
          version: number
          workflow_key: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain_area?: string
          id?: string
          metadata?: Json
          name: string
          organisation_id: string
          published_at?: string | null
          published_by?: string | null
          risk_classification?: string
          status?: string
          subject_type?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          workflow_key: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain_area?: string
          id?: string
          metadata?: Json
          name?: string
          organisation_id?: string
          published_at?: string | null
          published_by?: string | null
          risk_classification?: string
          status?: string
          subject_type?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          workflow_key?: string
        }
        Relationships: []
      }
      leo_workflow_instance_steps: {
        Row: {
          assigned_role_key: string | null
          assigned_user_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          decision: string | null
          decision_reason: string | null
          due_at: string | null
          escalated_at: string | null
          failure_details: Json | null
          id: string
          input_payload: Json
          metadata: Json
          organisation_id: string
          output_payload: Json
          started_at: string | null
          status: string
          step_key: string
          step_name: string
          step_order: number
          step_type: string
          updated_at: string
          workflow_definition_step_id: string | null
          workflow_instance_id: string
        }
        Insert: {
          assigned_role_key?: string | null
          assigned_user_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          decision?: string | null
          decision_reason?: string | null
          due_at?: string | null
          escalated_at?: string | null
          failure_details?: Json | null
          id?: string
          input_payload?: Json
          metadata?: Json
          organisation_id: string
          output_payload?: Json
          started_at?: string | null
          status?: string
          step_key: string
          step_name: string
          step_order: number
          step_type: string
          updated_at?: string
          workflow_definition_step_id?: string | null
          workflow_instance_id: string
        }
        Update: {
          assigned_role_key?: string | null
          assigned_user_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          decision?: string | null
          decision_reason?: string | null
          due_at?: string | null
          escalated_at?: string | null
          failure_details?: Json | null
          id?: string
          input_payload?: Json
          metadata?: Json
          organisation_id?: string
          output_payload?: Json
          started_at?: string | null
          status?: string
          step_key?: string
          step_name?: string
          step_order?: number
          step_type?: string
          updated_at?: string
          workflow_definition_step_id?: string | null
          workflow_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leo_workflow_instance_steps_workflow_definition_step_id_fkey"
            columns: ["workflow_definition_step_id"]
            isOneToOne: false
            referencedRelation: "leo_workflow_definition_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_workflow_instance_steps_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "leo_workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_workflow_instances: {
        Row: {
          attempt_count: number
          automation_definition_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          context: Json
          correlation_id: string
          created_at: string
          current_step_key: string | null
          id: string
          idempotency_key: string | null
          initiated_at: string
          initiated_by: string | null
          instance_reference: string
          last_error: Json | null
          metadata: Json
          next_attempt_at: string | null
          organisation_id: string
          priority: number
          result: Json
          started_at: string | null
          status: string
          subject_id: string | null
          subject_type: string | null
          updated_at: string
          workflow_definition_id: string | null
        }
        Insert: {
          attempt_count?: number
          automation_definition_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          context?: Json
          correlation_id?: string
          created_at?: string
          current_step_key?: string | null
          id?: string
          idempotency_key?: string | null
          initiated_at?: string
          initiated_by?: string | null
          instance_reference?: string
          last_error?: Json | null
          metadata?: Json
          next_attempt_at?: string | null
          organisation_id: string
          priority?: number
          result?: Json
          started_at?: string | null
          status?: string
          subject_id?: string | null
          subject_type?: string | null
          updated_at?: string
          workflow_definition_id?: string | null
        }
        Update: {
          attempt_count?: number
          automation_definition_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          context?: Json
          correlation_id?: string
          created_at?: string
          current_step_key?: string | null
          id?: string
          idempotency_key?: string | null
          initiated_at?: string
          initiated_by?: string | null
          instance_reference?: string
          last_error?: Json | null
          metadata?: Json
          next_attempt_at?: string | null
          organisation_id?: string
          priority?: number
          result?: Json
          started_at?: string | null
          status?: string
          subject_id?: string | null
          subject_type?: string | null
          updated_at?: string
          workflow_definition_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_workflow_instances_automation_definition_id_fkey"
            columns: ["automation_definition_id"]
            isOneToOne: false
            referencedRelation: "leo_automation_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leo_workflow_instances_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "leo_workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      matter_messages: {
        Row: {
          content: string | null
          created_at: string
          id: number
          matter_id: number | null
          role: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          matter_id?: number | null
          role?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          matter_id?: number | null
          role?: string | null
        }
        Relationships: []
      }
      matter_timeline: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_type: string
          id: number
          matter_id: number
          metadata: Json | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type: string
          id?: number
          matter_id: number
          metadata?: Json | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: number
          matter_id?: number
          metadata?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "matter_timeline_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      matters: {
        Row: {
          created_at: string | null
          description: string | null
          employee_id: number | null
          id: number
          intent: string | null
          matter_lead: string | null
          matter_type: string | null
          risk: string | null
          status: string | null
          subject: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          employee_id?: number | null
          id?: never
          intent?: string | null
          matter_lead?: string | null
          matter_type?: string | null
          risk?: string | null
          status?: string | null
          subject?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          employee_id?: number | null
          id?: never
          intent?: string | null
          matter_lead?: string | null
          matter_type?: string | null
          risk?: string | null
          status?: string | null
          subject?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "matters_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_reason: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          membership_id: string
          metadata: Json
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          role_id: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_reason?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          membership_id: string
          metadata?: Json
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id: string
          starts_at?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_reason?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          membership_id?: string
          metadata?: Json
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_roles_membership_fk"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "organisation_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_roles_role_fk"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_connection_capabilities: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by_user_id: string | null
          configuration: Json
          connection_id: number
          created_at: string
          id: number
          is_enabled: boolean
          provider_capability_id: number
          updated_at: string
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by_user_id?: string | null
          configuration?: Json
          connection_id: number
          created_at?: string
          id?: number
          is_enabled?: boolean
          provider_capability_id: number
          updated_at?: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by_user_id?: string | null
          configuration?: Json
          connection_id?: number
          created_at?: string
          id?: number
          is_enabled?: boolean
          provider_capability_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_connection_capabilitie_provider_capability_id_fkey"
            columns: ["provider_capability_id"]
            isOneToOne: false
            referencedRelation: "connection_provider_capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_connection_capabilities_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organisation_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_connection_modules: {
        Row: {
          allowed_actions: Json
          approved_at: string | null
          approved_by_user_id: string | null
          configuration: Json
          connection_id: number
          created_at: string
          id: number
          is_enabled: boolean
          module_key: string
          updated_at: string
        }
        Insert: {
          allowed_actions?: Json
          approved_at?: string | null
          approved_by_user_id?: string | null
          configuration?: Json
          connection_id: number
          created_at?: string
          id?: number
          is_enabled?: boolean
          module_key: string
          updated_at?: string
        }
        Update: {
          allowed_actions?: Json
          approved_at?: string | null
          approved_by_user_id?: string | null
          configuration?: Json
          connection_id?: number
          created_at?: string
          id?: number
          is_enabled?: boolean
          module_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_connection_modules_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organisation_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_connection_role_permissions: {
        Row: {
          can_disconnect: boolean
          can_export: boolean
          can_import: boolean
          can_manage_settings: boolean
          can_reconnect: boolean
          can_sync: boolean
          can_use: boolean
          can_view: boolean
          can_view_activity: boolean
          can_view_errors: boolean
          capability_overrides: Json
          connection_id: number
          created_at: string
          id: number
          role_key: string
          updated_at: string
        }
        Insert: {
          can_disconnect?: boolean
          can_export?: boolean
          can_import?: boolean
          can_manage_settings?: boolean
          can_reconnect?: boolean
          can_sync?: boolean
          can_use?: boolean
          can_view?: boolean
          can_view_activity?: boolean
          can_view_errors?: boolean
          capability_overrides?: Json
          connection_id: number
          created_at?: string
          id?: number
          role_key: string
          updated_at?: string
        }
        Update: {
          can_disconnect?: boolean
          can_export?: boolean
          can_import?: boolean
          can_manage_settings?: boolean
          can_reconnect?: boolean
          can_sync?: boolean
          can_use?: boolean
          can_view?: boolean
          can_view_activity?: boolean
          can_view_errors?: boolean
          capability_overrides?: Json
          connection_id?: number
          created_at?: string
          id?: number
          role_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_connection_role_permissions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "organisation_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_connections: {
        Row: {
          account_display_name: string | null
          approved_at: string | null
          approved_by_user_id: string | null
          archived_at: string | null
          authentication_type: string
          authorised_scopes: Json
          connected_at: string | null
          connected_by_user_id: string | null
          connection_name: string | null
          connection_owner_user_id: string | null
          connection_settings: Json
          consent_record: Json
          created_at: string
          disconnected_at: string | null
          external_account_id: string | null
          external_tenant_id: string | null
          external_workspace_id: string | null
          health_status: string
          id: number
          is_archived: boolean
          last_error_at: string | null
          last_error_code: string | null
          last_error_message: string | null
          last_failed_use_at: string | null
          last_health_check_at: string | null
          last_successful_use_at: string | null
          last_sync_at: string | null
          next_sync_at: string | null
          organisation_id: string | null
          provider_id: number
          reconnect_required_at: string | null
          requested_scopes: Json
          secret_reference: string | null
          status: string
          suspended_at: string | null
          sync_enabled: boolean
          sync_frequency: string | null
          token_expires_at: string | null
          updated_at: string
          usage_settings: Json
        }
        Insert: {
          account_display_name?: string | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          archived_at?: string | null
          authentication_type: string
          authorised_scopes?: Json
          connected_at?: string | null
          connected_by_user_id?: string | null
          connection_name?: string | null
          connection_owner_user_id?: string | null
          connection_settings?: Json
          consent_record?: Json
          created_at?: string
          disconnected_at?: string | null
          external_account_id?: string | null
          external_tenant_id?: string | null
          external_workspace_id?: string | null
          health_status?: string
          id?: number
          is_archived?: boolean
          last_error_at?: string | null
          last_error_code?: string | null
          last_error_message?: string | null
          last_failed_use_at?: string | null
          last_health_check_at?: string | null
          last_successful_use_at?: string | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          organisation_id?: string | null
          provider_id: number
          reconnect_required_at?: string | null
          requested_scopes?: Json
          secret_reference?: string | null
          status?: string
          suspended_at?: string | null
          sync_enabled?: boolean
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string
          usage_settings?: Json
        }
        Update: {
          account_display_name?: string | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          archived_at?: string | null
          authentication_type?: string
          authorised_scopes?: Json
          connected_at?: string | null
          connected_by_user_id?: string | null
          connection_name?: string | null
          connection_owner_user_id?: string | null
          connection_settings?: Json
          consent_record?: Json
          created_at?: string
          disconnected_at?: string | null
          external_account_id?: string | null
          external_tenant_id?: string | null
          external_workspace_id?: string | null
          health_status?: string
          id?: number
          is_archived?: boolean
          last_error_at?: string | null
          last_error_code?: string | null
          last_error_message?: string | null
          last_failed_use_at?: string | null
          last_health_check_at?: string | null
          last_successful_use_at?: string | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          organisation_id?: string | null
          provider_id?: number
          reconnect_required_at?: string | null
          requested_scopes?: Json
          secret_reference?: string | null
          status?: string
          suspended_at?: string | null
          sync_enabled?: boolean
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string
          usage_settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "organisation_connections_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "connection_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_foundations: {
        Row: {
          created_at: string
          id: number
          key: string
          organisation_id: string | null
          section: string
          source: string | null
          value: string
        }
        Insert: {
          created_at?: string
          id?: number
          key: string
          organisation_id?: string | null
          section: string
          source?: string | null
          value: string
        }
        Update: {
          created_at?: string
          id?: number
          key?: string
          organisation_id?: string | null
          section?: string
          source?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_foundations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          cancelled_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_status: string
          invitation_token: string
          invited_by: string | null
          metadata: Json
          organisation_id: string
          role: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          cancelled_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_status?: string
          invitation_token?: string
          invited_by?: string | null
          metadata?: Json
          organisation_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          cancelled_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_status?: string
          invitation_token?: string
          invited_by?: string | null
          metadata?: Json
          organisation_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_invitations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_memberships: {
        Row: {
          accepted_at: string | null
          access_ends_at: string | null
          access_starts_at: string | null
          activated_at: string | null
          created_at: string
          created_by: string | null
          end_reason: string | null
          ended_at: string | null
          ended_by: string | null
          id: string
          invited_by: string | null
          is_default_organisation: boolean
          is_primary_organisation: boolean
          joined_at: string | null
          last_accessed_at: string | null
          membership_status: string
          membership_type: string
          metadata: Json
          organisation_id: string
          permissions: Json
          removed_at: string | null
          role: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          access_ends_at?: string | null
          access_starts_at?: string | null
          activated_at?: string | null
          created_at?: string
          created_by?: string | null
          end_reason?: string | null
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          invited_by?: string | null
          is_default_organisation?: boolean
          is_primary_organisation?: boolean
          joined_at?: string | null
          last_accessed_at?: string | null
          membership_status?: string
          membership_type?: string
          metadata?: Json
          organisation_id: string
          permissions?: Json
          removed_at?: string | null
          role?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          access_ends_at?: string | null
          access_starts_at?: string | null
          activated_at?: string | null
          created_at?: string
          created_by?: string | null
          end_reason?: string | null
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          invited_by?: string | null
          is_default_organisation?: boolean
          is_primary_organisation?: boolean
          joined_at?: string | null
          last_accessed_at?: string | null
          membership_status?: string
          membership_type?: string
          metadata?: Json
          organisation_id?: string
          permissions?: Json
          removed_at?: string | null
          role?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_memberships_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_memory: {
        Row: {
          content: string
          created_at: string | null
          id: number
          source: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          source?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          source?: string | null
        }
        Relationships: []
      }
      organisation_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          dismissed_at: string | null
          dismissed_by: string | null
          event_version: string
          expires_at: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          message: string
          metadata: Json
          notification_key: string
          notification_type: string
          organisation_id: string
          read_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          event_version?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message: string
          metadata?: Json
          notification_key: string
          notification_type?: string
          organisation_id: string
          read_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          event_version?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message?: string
          metadata?: Json
          notification_key?: string
          notification_type?: string
          organisation_id?: string
          read_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_notifications_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_public_profiles: {
        Row: {
          about_organisation: string | null
          benefits_summary: string | null
          careers_email: string | null
          careers_enabled: boolean
          careers_heading: string | null
          careers_intro: string | null
          careers_phone: string | null
          created_at: string
          created_by: string | null
          display_name: string
          facebook_url: string | null
          hero_image_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          logo_url: string | null
          metadata: Json
          organisation_id: string
          organisation_slug: string
          primary_colour: string | null
          secondary_colour: string | null
          show_closed_vacancies: boolean
          updated_at: string
          updated_by: string | null
          website_url: string | null
        }
        Insert: {
          about_organisation?: string | null
          benefits_summary?: string | null
          careers_email?: string | null
          careers_enabled?: boolean
          careers_heading?: string | null
          careers_intro?: string | null
          careers_phone?: string | null
          created_at?: string
          created_by?: string | null
          display_name: string
          facebook_url?: string | null
          hero_image_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          metadata?: Json
          organisation_id: string
          organisation_slug: string
          primary_colour?: string | null
          secondary_colour?: string | null
          show_closed_vacancies?: boolean
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
        }
        Update: {
          about_organisation?: string | null
          benefits_summary?: string | null
          careers_email?: string | null
          careers_enabled?: boolean
          careers_heading?: string | null
          careers_intro?: string | null
          careers_phone?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string
          facebook_url?: string | null
          hero_image_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          metadata?: Json
          organisation_id?: string
          organisation_slug?: string
          primary_colour?: string | null
          secondary_colour?: string | null
          show_closed_vacancies?: boolean
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisation_public_profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_ends_at: string | null
          current_period_started_at: string | null
          employee_limit_override: number | null
          ended_at: string | null
          grace_period_ends_at: string | null
          id: string
          metadata: Json
          organisation_id: string
          payment_customer_reference: string | null
          payment_provider: string | null
          payment_subscription_reference: string | null
          plan_id: string
          subscription_status: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_ends_at?: string | null
          current_period_started_at?: string | null
          employee_limit_override?: number | null
          ended_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          metadata?: Json
          organisation_id: string
          payment_customer_reference?: string | null
          payment_provider?: string | null
          payment_subscription_reference?: string | null
          plan_id: string
          subscription_status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_ends_at?: string | null
          current_period_started_at?: string | null
          employee_limit_override?: number | null
          ended_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          metadata?: Json
          organisation_id?: string
          payment_customer_reference?: string | null
          payment_provider?: string | null
          payment_subscription_reference?: string | null
          plan_id?: string
          subscription_status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_subscriptions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_workspaces: {
        Row: {
          archived_at: string | null
          created_at: string
          demo_cleared_at: string | null
          demo_generated_at: string | null
          id: string
          is_demo_workspace: boolean
          lifecycle_status: string
          live_started_at: string | null
          metadata: Json
          organisation_id: string
          restricted_at: string | null
          updated_at: string
          workspace_type: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          demo_cleared_at?: string | null
          demo_generated_at?: string | null
          id?: string
          is_demo_workspace?: boolean
          lifecycle_status?: string
          live_started_at?: string | null
          metadata?: Json
          organisation_id: string
          restricted_at?: string | null
          updated_at?: string
          workspace_type?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          demo_cleared_at?: string | null
          demo_generated_at?: string | null
          id?: string
          is_demo_workspace?: boolean
          lifecycle_status?: string
          live_started_at?: string | null
          metadata?: Json
          organisation_id?: string
          restricted_at?: string | null
          updated_at?: string
          workspace_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_workspaces_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          activated_at: string | null
          archived_at: string | null
          created_at: string
          employee_count_band: string | null
          id: string
          metadata: Json
          name: string | null
          restricted_at: string | null
          slug: string | null
          status: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          activated_at?: string | null
          archived_at?: string | null
          created_at?: string
          employee_count_band?: string | null
          id?: string
          metadata?: Json
          name?: string | null
          restricted_at?: string | null
          slug?: string | null
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          activated_at?: string | null
          archived_at?: string | null
          created_at?: string
          employee_count_band?: string | null
          id?: string
          metadata?: Json
          name?: string | null
          restricted_at?: string | null
          slug?: string | null
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      pathway_assignments: {
        Row: {
          actual_completion_date: string | null
          archived_at: string | null
          assigned_by: string | null
          assigned_date: string
          assignment_source: string
          created_at: string
          current_step_id: number | null
          employee_id: number
          employee_notes: string | null
          id: number
          is_archived: boolean
          manager_employee_id: number | null
          manager_notes: string | null
          pathway_id: number
          progress_percent: number
          source_reference_id: number | null
          source_reference_type: string | null
          start_date: string
          status: string
          target_completion_date: string | null
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          archived_at?: string | null
          assigned_by?: string | null
          assigned_date?: string
          assignment_source?: string
          created_at?: string
          current_step_id?: number | null
          employee_id: number
          employee_notes?: string | null
          id?: number
          is_archived?: boolean
          manager_employee_id?: number | null
          manager_notes?: string | null
          pathway_id: number
          progress_percent?: number
          source_reference_id?: number | null
          source_reference_type?: string | null
          start_date?: string
          status?: string
          target_completion_date?: string | null
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          archived_at?: string | null
          assigned_by?: string | null
          assigned_date?: string
          assignment_source?: string
          created_at?: string
          current_step_id?: number | null
          employee_id?: number
          employee_notes?: string | null
          id?: number
          is_archived?: boolean
          manager_employee_id?: number | null
          manager_notes?: string | null
          pathway_id?: number
          progress_percent?: number
          source_reference_id?: number | null
          source_reference_type?: string | null
          start_date?: string
          status?: string
          target_completion_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_assignments_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "pathway_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_assignments_manager_employee_id_fkey"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_assignments_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "development_pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_certificate_settings: {
        Row: {
          certificate_available: boolean
          certificate_description: string | null
          certificate_title: string | null
          created_at: string
          id: number
          issue_automatically: boolean
          manager_approval_required: boolean
          notes: string | null
          pathway_id: number
          renewal_required: boolean
          signatory_name: string | null
          signatory_role: string | null
          updated_at: string
          validity_months: number | null
        }
        Insert: {
          certificate_available?: boolean
          certificate_description?: string | null
          certificate_title?: string | null
          created_at?: string
          id?: number
          issue_automatically?: boolean
          manager_approval_required?: boolean
          notes?: string | null
          pathway_id: number
          renewal_required?: boolean
          signatory_name?: string | null
          signatory_role?: string | null
          updated_at?: string
          validity_months?: number | null
        }
        Update: {
          certificate_available?: boolean
          certificate_description?: string | null
          certificate_title?: string | null
          created_at?: string
          id?: number
          issue_automatically?: boolean
          manager_approval_required?: boolean
          notes?: string | null
          pathway_id?: number
          renewal_required?: boolean
          signatory_name?: string | null
          signatory_role?: string | null
          updated_at?: string
          validity_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pathway_certificate_settings_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: true
            referencedRelation: "development_pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_progress: {
        Row: {
          completed_at: string | null
          completion_reference_id: number | null
          completion_reference_type: string | null
          created_at: string
          employee_comments: string | null
          employee_id: number
          evidence_notes: string | null
          id: number
          manager_comments: string | null
          manager_validated_at: string | null
          manager_validated_by: number | null
          pathway_assignment_id: number
          pathway_step_id: number
          progress_percent: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_reference_id?: number | null
          completion_reference_type?: string | null
          created_at?: string
          employee_comments?: string | null
          employee_id: number
          evidence_notes?: string | null
          id?: number
          manager_comments?: string | null
          manager_validated_at?: string | null
          manager_validated_by?: number | null
          pathway_assignment_id: number
          pathway_step_id: number
          progress_percent?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_reference_id?: number | null
          completion_reference_type?: string | null
          created_at?: string
          employee_comments?: string | null
          employee_id?: number
          evidence_notes?: string | null
          id?: number
          manager_comments?: string | null
          manager_validated_at?: string | null
          manager_validated_by?: number | null
          pathway_assignment_id?: number
          pathway_step_id?: number
          progress_percent?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_progress_manager_validated_by_fkey"
            columns: ["manager_validated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_progress_pathway_assignment_id_fkey"
            columns: ["pathway_assignment_id"]
            isOneToOne: false
            referencedRelation: "pathway_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_progress_pathway_step_id_fkey"
            columns: ["pathway_step_id"]
            isOneToOne: false
            referencedRelation: "pathway_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_reviews: {
        Row: {
          changes_required: string | null
          created_at: string
          id: number
          next_review_date: string | null
          outcome: string
          pathway_id: number
          review_date: string
          review_summary: string
          reviewed_by: string | null
          updated_at: string
        }
        Insert: {
          changes_required?: string | null
          created_at?: string
          id?: number
          next_review_date?: string | null
          outcome?: string
          pathway_id: number
          review_date: string
          review_summary: string
          reviewed_by?: string | null
          updated_at?: string
        }
        Update: {
          changes_required?: string | null
          created_at?: string
          id?: number
          next_review_date?: string | null
          outcome?: string
          pathway_id?: number
          review_date?: string
          review_summary?: string
          reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_reviews_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "development_pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_steps: {
        Row: {
          archived_at: string | null
          certificate_reference_id: number | null
          completion_criteria: string | null
          completion_required: boolean
          created_at: string
          created_by: string | null
          description: string | null
          estimated_duration_days: number | null
          evidence_required: boolean
          id: number
          instructions: string | null
          is_archived: boolean
          learning_module_id: number | null
          manager_validation_required: boolean
          pathway_id: number
          previous_step_required: boolean
          qualification_reference_id: number | null
          sequence_number: number
          step_type: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          certificate_reference_id?: number | null
          completion_criteria?: string | null
          completion_required?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          evidence_required?: boolean
          id?: number
          instructions?: string | null
          is_archived?: boolean
          learning_module_id?: number | null
          manager_validation_required?: boolean
          pathway_id: number
          previous_step_required?: boolean
          qualification_reference_id?: number | null
          sequence_number: number
          step_type: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          certificate_reference_id?: number | null
          completion_criteria?: string | null
          completion_required?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          evidence_required?: boolean
          id?: number
          instructions?: string | null
          is_archived?: boolean
          learning_module_id?: number | null
          manager_validation_required?: boolean
          pathway_id?: number
          previous_step_required?: boolean
          qualification_reference_id?: number | null
          sequence_number?: number
          step_type?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pathway_steps_learning_module_id_fkey"
            columns: ["learning_module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_steps_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "development_pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_versions: {
        Row: {
          approved_by: string | null
          change_summary: string | null
          created_at: string
          created_by: string | null
          id: number
          pathway_id: number
          published_at: string | null
          reviewed_by: string | null
          version_number: number
          version_snapshot: Json
        }
        Insert: {
          approved_by?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          pathway_id: number
          published_at?: string | null
          reviewed_by?: string | null
          version_number: number
          version_snapshot: Json
        }
        Update: {
          approved_by?: string | null
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          pathway_id?: number
          published_at?: string | null
          reviewed_by?: string | null
          version_number?: number
          version_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pathway_versions_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "development_pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_groups: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          group_key: string
          id: string
          is_active: boolean
          is_system_group: boolean
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          group_key: string
          id?: string
          is_active?: boolean
          is_system_group?: boolean
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          group_key?: string
          id?: string
          is_active?: boolean
          is_system_group?: boolean
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action_key: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_assignable: boolean
          is_system_permission: boolean
          metadata: Json
          name: string
          permission_group_id: string
          permission_key: string
          requires_reason: boolean
          requires_step_up: boolean
          resource_key: string
          scope_type: string
          sensitivity: string
          updated_at: string
        }
        Insert: {
          action_key: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_assignable?: boolean
          is_system_permission?: boolean
          metadata?: Json
          name: string
          permission_group_id: string
          permission_key: string
          requires_reason?: boolean
          requires_step_up?: boolean
          resource_key: string
          scope_type?: string
          sensitivity?: string
          updated_at?: string
        }
        Update: {
          action_key?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_assignable?: boolean
          is_system_permission?: boolean
          metadata?: Json
          name?: string
          permission_group_id?: string
          permission_key?: string
          requires_reason?: boolean
          requires_step_up?: boolean
          resource_key?: string
          scope_type?: string
          sensitivity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_group_fk"
            columns: ["permission_group_id"]
            isOneToOne: false
            referencedRelation: "permission_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_register: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string
          file_name: string | null
          file_path: string | null
          file_url: string | null
          id: number
          is_archived: boolean
          name: string
          next_review_date: string | null
          notes: string | null
          register_type: string
          responsible_person: string | null
          status: string | null
          updated_at: string
          version_number: number
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: number
          is_archived?: boolean
          name: string
          next_review_date?: string | null
          notes?: string | null
          register_type: string
          responsible_person?: string | null
          status?: string | null
          updated_at?: string
          version_number?: number
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: number
          is_archived?: boolean
          name?: string
          next_review_date?: string | null
          notes?: string | null
          register_type?: string
          responsible_person?: string | null
          status?: string | null
          updated_at?: string
          version_number?: number
        }
        Relationships: []
      }
      probation_decisions: {
        Row: {
          approved_at: string | null
          attendees: string | null
          concerns_identified: string | null
          created_at: string
          created_by: string | null
          decision: string
          decision_date: string
          decision_maker: string
          decision_reason: string
          effective_date: string | null
          employee_id: number
          employee_response: string | null
          evidence_considered: string | null
          final_summary: string | null
          id: number
          improvement_observed: string | null
          notice_arrangements: string | null
          probation_id: number
          review_meeting_date: string | null
          support_provided: string | null
          updated_at: string
          updated_by: string | null
          why_decision_is_appropriate: string | null
        }
        Insert: {
          approved_at?: string | null
          attendees?: string | null
          concerns_identified?: string | null
          created_at?: string
          created_by?: string | null
          decision: string
          decision_date: string
          decision_maker: string
          decision_reason: string
          effective_date?: string | null
          employee_id: number
          employee_response?: string | null
          evidence_considered?: string | null
          final_summary?: string | null
          id?: number
          improvement_observed?: string | null
          notice_arrangements?: string | null
          probation_id: number
          review_meeting_date?: string | null
          support_provided?: string | null
          updated_at?: string
          updated_by?: string | null
          why_decision_is_appropriate?: string | null
        }
        Update: {
          approved_at?: string | null
          attendees?: string | null
          concerns_identified?: string | null
          created_at?: string
          created_by?: string | null
          decision?: string
          decision_date?: string
          decision_maker?: string
          decision_reason?: string
          effective_date?: string | null
          employee_id?: number
          employee_response?: string | null
          evidence_considered?: string | null
          final_summary?: string | null
          id?: number
          improvement_observed?: string | null
          notice_arrangements?: string | null
          probation_id?: number
          review_meeting_date?: string | null
          support_provided?: string | null
          updated_at?: string
          updated_by?: string | null
          why_decision_is_appropriate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "probation_decisions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "probation_decisions_probation_id_fkey"
            columns: ["probation_id"]
            isOneToOne: false
            referencedRelation: "employee_probations"
            referencedColumns: ["id"]
          },
        ]
      }
      probation_documents: {
        Row: {
          archived_at: string | null
          document_type: string
          employee_document_id: number
          employee_id: number
          id: number
          is_archived: boolean
          linked_at: string
          linked_by: string | null
          probation_id: number
          review_id: number | null
        }
        Insert: {
          archived_at?: string | null
          document_type: string
          employee_document_id: number
          employee_id: number
          id?: number
          is_archived?: boolean
          linked_at?: string
          linked_by?: string | null
          probation_id: number
          review_id?: number | null
        }
        Update: {
          archived_at?: string | null
          document_type?: string
          employee_document_id?: number
          employee_id?: number
          id?: number
          is_archived?: boolean
          linked_at?: string
          linked_by?: string | null
          probation_id?: number
          review_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "probation_documents_employee_document_id_fkey"
            columns: ["employee_document_id"]
            isOneToOne: false
            referencedRelation: "employee_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "probation_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "probation_documents_probation_id_fkey"
            columns: ["probation_id"]
            isOneToOne: false
            referencedRelation: "employee_probations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "probation_documents_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "probation_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      probation_reviews: {
        Row: {
          agreed_actions: string | null
          archived_at: string | null
          attendees: string | null
          completed_date: string | null
          created_at: string
          created_by: string | null
          employee_comments: string | null
          employee_id: number
          id: number
          is_archived: boolean
          manager_comments: string | null
          manager_name: string | null
          next_review_date: string | null
          probation_id: number
          progress_summary: string | null
          review_type: string
          review_week: number | null
          scheduled_date: string
          status: string
          support_required: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agreed_actions?: string | null
          archived_at?: string | null
          attendees?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          employee_comments?: string | null
          employee_id: number
          id?: number
          is_archived?: boolean
          manager_comments?: string | null
          manager_name?: string | null
          next_review_date?: string | null
          probation_id: number
          progress_summary?: string | null
          review_type: string
          review_week?: number | null
          scheduled_date: string
          status?: string
          support_required?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agreed_actions?: string | null
          archived_at?: string | null
          attendees?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          employee_comments?: string | null
          employee_id?: number
          id?: number
          is_archived?: boolean
          manager_comments?: string | null
          manager_name?: string | null
          next_review_date?: string | null
          probation_id?: number
          progress_summary?: string | null
          review_type?: string
          review_week?: number | null
          scheduled_date?: string
          status?: string
          support_required?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "probation_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "probation_reviews_probation_id_fkey"
            columns: ["probation_id"]
            isOneToOne: false
            referencedRelation: "employee_probations"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_activity_history: {
        Row: {
          activity_details: Json | null
          activity_summary: string
          activity_type: string
          created_at: string
          employee_id: number | null
          employee_qualification_id: number | null
          id: number
          qualification_requirement_id: number | null
          recorded_by: string | null
        }
        Insert: {
          activity_details?: Json | null
          activity_summary: string
          activity_type: string
          created_at?: string
          employee_id?: number | null
          employee_qualification_id?: number | null
          id?: number
          qualification_requirement_id?: number | null
          recorded_by?: string | null
        }
        Update: {
          activity_details?: Json | null
          activity_summary?: string
          activity_type?: string
          created_at?: string
          employee_id?: number | null
          employee_qualification_id?: number | null
          id?: number
          qualification_requirement_id?: number | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_activity_histor_qualification_requirement_id_fkey"
            columns: ["qualification_requirement_id"]
            isOneToOne: false
            referencedRelation: "qualification_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_activity_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_activity_history_employee_qualification_id_fkey"
            columns: ["employee_qualification_id"]
            isOneToOne: false
            referencedRelation: "employee_qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_evidence: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          employee_id: number
          employee_qualification_id: number
          evidence_type: string
          expiry_date: string | null
          external_url: string | null
          file_name: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: number
          is_archived: boolean
          issue_date: string | null
          mime_type: string | null
          title: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          employee_id: number
          employee_qualification_id: number
          evidence_type?: string
          expiry_date?: string | null
          external_url?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: number
          is_archived?: boolean
          issue_date?: string | null
          mime_type?: string | null
          title: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          employee_id?: number
          employee_qualification_id?: number
          evidence_type?: string
          expiry_date?: string | null
          external_url?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: number
          is_archived?: boolean
          issue_date?: string | null
          mime_type?: string | null
          title?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_evidence_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_evidence_employee_qualification_id_fkey"
            columns: ["employee_qualification_id"]
            isOneToOne: false
            referencedRelation: "employee_qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_renewals: {
        Row: {
          archived_at: string | null
          cost_amount: number | null
          created_at: string
          created_by: string | null
          currency_code: string
          employee_id: number
          employee_notes: string | null
          employee_qualification_id: number
          id: number
          is_archived: boolean
          manager_notes: string | null
          new_expiry_date: string | null
          new_issue_date: string | null
          previous_expiry_date: string | null
          previous_issue_date: string | null
          provider_or_body: string | null
          renewal_due_date: string | null
          renewal_method: string | null
          renewal_started_date: string | null
          renewed_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          cost_amount?: number | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          employee_id: number
          employee_notes?: string | null
          employee_qualification_id: number
          id?: number
          is_archived?: boolean
          manager_notes?: string | null
          new_expiry_date?: string | null
          new_issue_date?: string | null
          previous_expiry_date?: string | null
          previous_issue_date?: string | null
          provider_or_body?: string | null
          renewal_due_date?: string | null
          renewal_method?: string | null
          renewal_started_date?: string | null
          renewed_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          cost_amount?: number | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          employee_id?: number
          employee_notes?: string | null
          employee_qualification_id?: number
          id?: number
          is_archived?: boolean
          manager_notes?: string | null
          new_expiry_date?: string | null
          new_issue_date?: string | null
          previous_expiry_date?: string | null
          previous_issue_date?: string | null
          provider_or_body?: string | null
          renewal_due_date?: string | null
          renewal_method?: string | null
          renewal_started_date?: string | null
          renewed_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualification_renewals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_renewals_employee_qualification_id_fkey"
            columns: ["employee_qualification_id"]
            isOneToOne: false
            referencedRelation: "employee_qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_requirements: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          employment_status: string | null
          grace_period_days: number | null
          id: number
          is_active: boolean
          is_archived: boolean
          mandatory: boolean
          minimum_level: string | null
          next_review_date: string | null
          organisation_id: string | null
          qualification_type_id: number | null
          regulator_or_authority: string | null
          required_before_start: boolean
          requirement_reason: string | null
          requirement_title: string
          review_frequency_months: number | null
          target_department: string | null
          target_location: string | null
          target_role: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          employment_status?: string | null
          grace_period_days?: number | null
          id?: number
          is_active?: boolean
          is_archived?: boolean
          mandatory?: boolean
          minimum_level?: string | null
          next_review_date?: string | null
          organisation_id?: string | null
          qualification_type_id?: number | null
          regulator_or_authority?: string | null
          required_before_start?: boolean
          requirement_reason?: string | null
          requirement_title: string
          review_frequency_months?: number | null
          target_department?: string | null
          target_location?: string | null
          target_role?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          employment_status?: string | null
          grace_period_days?: number | null
          id?: number
          is_active?: boolean
          is_archived?: boolean
          mandatory?: boolean
          minimum_level?: string | null
          next_review_date?: string | null
          organisation_id?: string | null
          qualification_type_id?: number | null
          regulator_or_authority?: string | null
          required_before_start?: boolean
          requirement_reason?: string | null
          requirement_title?: string
          review_frequency_months?: number | null
          target_department?: string | null
          target_location?: string | null
          target_role?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_requirements_qualification_type_id_fkey"
            columns: ["qualification_type_id"]
            isOneToOne: false
            referencedRelation: "qualification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_types: {
        Row: {
          archived_at: string | null
          category: string
          created_at: string
          created_by: string | null
          default_validity_months: number | null
          description: string | null
          evidence_required: boolean
          id: number
          is_active: boolean
          is_archived: boolean
          issuing_body: string | null
          mandatory_by_default: boolean
          name: string
          organisation_id: string | null
          reference_code: string | null
          regulator_name: string | null
          renewal_required: boolean
          source_type: string
          updated_at: string
          updated_by: string | null
          verification_required: boolean
        }
        Insert: {
          archived_at?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          default_validity_months?: number | null
          description?: string | null
          evidence_required?: boolean
          id?: number
          is_active?: boolean
          is_archived?: boolean
          issuing_body?: string | null
          mandatory_by_default?: boolean
          name: string
          organisation_id?: string | null
          reference_code?: string | null
          regulator_name?: string | null
          renewal_required?: boolean
          source_type?: string
          updated_at?: string
          updated_by?: string | null
          verification_required?: boolean
        }
        Update: {
          archived_at?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          default_validity_months?: number | null
          description?: string | null
          evidence_required?: boolean
          id?: number
          is_active?: boolean
          is_archived?: boolean
          issuing_body?: string | null
          mandatory_by_default?: boolean
          name?: string
          organisation_id?: string | null
          reference_code?: string | null
          regulator_name?: string | null
          renewal_required?: boolean
          source_type?: string
          updated_at?: string
          updated_by?: string | null
          verification_required?: boolean
        }
        Relationships: []
      }
      qualification_verifications: {
        Row: {
          concerns_or_actions: string | null
          created_at: string
          created_by: string | null
          employee_id: number
          employee_qualification_id: number
          id: number
          next_verification_date: string | null
          updated_at: string
          verification_date: string
          verification_method: string | null
          verification_reference: string | null
          verification_status: string
          verification_summary: string | null
          verified_with: string | null
          verifier_employee_id: number | null
        }
        Insert: {
          concerns_or_actions?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: number
          employee_qualification_id: number
          id?: number
          next_verification_date?: string | null
          updated_at?: string
          verification_date?: string
          verification_method?: string | null
          verification_reference?: string | null
          verification_status: string
          verification_summary?: string | null
          verified_with?: string | null
          verifier_employee_id?: number | null
        }
        Update: {
          concerns_or_actions?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: number
          employee_qualification_id?: number
          id?: number
          next_verification_date?: string | null
          updated_at?: string
          verification_date?: string
          verification_method?: string | null
          verification_reference?: string | null
          verification_status?: string
          verification_summary?: string | null
          verified_with?: string | null
          verifier_employee_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_verifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_verifications_employee_qualification_id_fkey"
            columns: ["employee_qualification_id"]
            isOneToOne: false
            referencedRelation: "employee_qualifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_verifications_verifier_employee_id_fkey"
            columns: ["verifier_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          grant_scope: string
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          permission_id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          role_id: string
          scope_constraints: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          grant_scope?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          permission_id: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id: string
          scope_constraints?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          grant_scope?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          permission_id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id?: string
          scope_constraints?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_fk"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_fk"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_archived: boolean
          is_assignable: boolean
          is_default: boolean
          is_system_role: boolean
          metadata: Json
          name: string
          organisation_id: string | null
          role_key: string
          role_level: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          is_assignable?: boolean
          is_default?: boolean
          is_system_role?: boolean
          metadata?: Json
          name: string
          organisation_id?: string | null
          role_key: string
          role_level?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          is_assignable?: boolean
          is_default?: boolean
          is_system_role?: boolean
          metadata?: Json
          name?: string
          organisation_id?: string | null
          role_key?: string
          role_level?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_organisation_fk"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: number
          manager: string | null
          name: string
          notes: string | null
          organisation_id: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: number
          manager?: string | null
          name: string
          notes?: string | null
          organisation_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: number
          manager?: string | null
          name?: string
          notes?: string | null
          organisation_id?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          display_order: number
          employee_profile_limit: number | null
          id: string
          is_active: boolean
          is_enterprise: boolean
          is_public: boolean
          metadata: Json
          monthly_price_pence: number | null
          plan_code: string
          plan_name: string
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          currency?: string
          display_order?: number
          employee_profile_limit?: number | null
          id?: string
          is_active?: boolean
          is_enterprise?: boolean
          is_public?: boolean
          metadata?: Json
          monthly_price_pence?: number | null
          plan_code: string
          plan_name: string
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          display_order?: number
          employee_profile_limit?: number | null
          id?: string
          is_active?: boolean
          is_enterprise?: boolean
          is_public?: boolean
          metadata?: Json
          monthly_price_pence?: number | null
          plan_code?: string
          plan_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_connection: {
        Row: {
          id: number
          "LEO TEST": number | null
          name: string | null
        }
        Insert: {
          id?: never
          "LEO TEST"?: number | null
          name?: string | null
        }
        Update: {
          id?: never
          "LEO TEST"?: number | null
          name?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          employee_id: number | null
          first_name: string | null
          id: number
          is_active: boolean
          job_title: string | null
          last_active_at: string | null
          last_name: string | null
          manager_employee_id: number | null
          metadata: Json
          organisation_id: string | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          employee_id?: number | null
          first_name?: string | null
          id?: number
          is_active?: boolean
          job_title?: string | null
          last_active_at?: string | null
          last_name?: string | null
          manager_employee_id?: number | null
          metadata?: Json
          organisation_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          employee_id?: number | null
          first_name?: string | null
          id?: number
          is_active?: boolean
          job_title?: string | null
          last_active_at?: string | null
          last_name?: string | null
          manager_employee_id?: number | null
          metadata?: Json
          organisation_id?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_manager_employee_id_fkey"
            columns: ["manager_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leo_audit_daily_summary: {
        Row: {
          audit_day: string | null
          distinct_actors: number | null
          event_category: string | null
          event_count: number | null
          event_type: string | null
          organisation_id: string | null
          severity: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leo_audit_events_event_type_fkey"
            columns: ["event_type"]
            isOneToOne: false
            referencedRelation: "leo_audit_event_types"
            referencedColumns: ["event_type"]
          },
        ]
      }
      leo_platform_health: {
        Row: {
          authorisation_failures: number | null
          completed_at: string | null
          critical_failures: number | null
          data_integrity_failures: number | null
          failed_checks: number | null
          function_security_failures: number | null
          passed_checks: number | null
          rls_failures: number | null
          started_at: string | null
          status: string | null
          total_checks: number | null
          validation_run_id: string | null
          warning_checks: number | null
        }
        Relationships: []
      }
      leo_platform_validation_latest: {
        Row: {
          completed_at: string | null
          critical_failures: number | null
          database_name: string | null
          environment: string | null
          executed_by: string | null
          failed_checks: number | null
          id: string | null
          migration_version: string | null
          passed_checks: number | null
          started_at: string | null
          status: string | null
          summary: Json | null
          total_checks: number | null
          validation_key: string | null
          warning_checks: number | null
        }
        Relationships: []
      }
      leo_public_careers_vacancies: {
        Row: {
          about_organisation: string | null
          advert_text: string | null
          benefits: string | null
          benefits_summary: string | null
          blind_review_enabled: boolean | null
          business_area: string | null
          careers_email: string | null
          careers_heading: string | null
          careers_intro: string | null
          careers_phone: string | null
          closing_date: string | null
          dbs_level: string | null
          department: string | null
          desirable_criteria: string | null
          employment_type: string | null
          essential_criteria: string | null
          facebook_url: string | null
          hero_image_url: string | null
          hours_per_week: number | null
          instagram_url: string | null
          linkedin_url: string | null
          location_name: string | null
          logo_url: string | null
          metadata: Json | null
          number_of_positions: number | null
          opening_date: string | null
          organisation_id: string | null
          organisation_name: string | null
          organisation_slug: string | null
          primary_colour: string | null
          published_at: string | null
          regulated_role: boolean | null
          required_reference_count: number | null
          requires_dbs: boolean | null
          requires_driving: boolean | null
          requires_qualification_checks: boolean | null
          responsibilities: string | null
          role_summary: string | null
          safer_recruitment_required: boolean | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          salary_visible: boolean | null
          secondary_colour: string | null
          target_start_date: string | null
          title: string | null
          vacancy_id: string | null
          vacancy_reference: string | null
          vacancy_slug: string | null
          website_url: string | null
          work_pattern: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisation_public_profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      leo_security_operations_dashboard: {
        Row: {
          active_sessions: number | null
          critical_alerts: number | null
          failed_authentication_events_24h: number | null
          generated_at: string | null
          latest_health_score: number | null
          latest_health_status: string | null
          locked_accounts: number | null
          open_alerts: number | null
          organisation_id: string | null
          trusted_devices: number | null
        }
        Insert: {
          active_sessions?: never
          critical_alerts?: never
          failed_authentication_events_24h?: never
          generated_at?: never
          latest_health_score?: never
          latest_health_status?: never
          locked_accounts?: never
          open_alerts?: never
          organisation_id?: string | null
          trusted_devices?: never
        }
        Update: {
          active_sessions?: never
          critical_alerts?: never
          failed_authentication_events_24h?: never
          generated_at?: never
          latest_health_score?: never
          latest_health_status?: never
          locked_accounts?: never
          open_alerts?: never
          organisation_id?: string | null
          trusted_devices?: never
        }
        Relationships: []
      }
      leo_talent_candidate_application_view: {
        Row: {
          application_id: string | null
          application_reference: string | null
          application_status: string | null
          candidate_id: string | null
          candidate_reference: string | null
          combined_score: number | null
          created_at: string | null
          current_stage_key: string | null
          department: string | null
          email: string | null
          first_name: string | null
          is_internal_candidate: boolean | null
          last_name: string | null
          location_name: string | null
          organisation_id: string | null
          phone: string | null
          preferred_name: string | null
          recommendation: string | null
          submitted_at: string | null
          updated_at: string | null
          vacancy_id: string | null
          vacancy_reference: string | null
          vacancy_status: string | null
          vacancy_title: string | null
        }
        Relationships: []
      }
      leo_talent_dashboard_metrics_view: {
        Row: {
          appointments_in_progress: number | null
          live_applications: number | null
          live_vacancies: number | null
          offers_awaiting_response: number | null
          organisation_id: string | null
          upcoming_interviews: number | null
        }
        Relationships: []
      }
      leo_talent_pre_employment_progress_view: {
        Row: {
          agreed_start_date: string | null
          appointment_id: string | null
          appointment_reference: string | null
          appointment_status: string | null
          candidate_id: string | null
          employee_id: number | null
          first_name: string | null
          handover_completed_at: string | null
          health_questionnaire_status: string | null
          last_name: string | null
          onboarding_items_complete: number | null
          onboarding_items_total: number | null
          organisation_id: string | null
          safer_recruitment_status: string | null
          vacancy_id: string | null
          vacancy_title: string | null
        }
        Relationships: []
      }
      leo_talent_upcoming_interviews_view: {
        Row: {
          application_id: string | null
          application_reference: string | null
          candidate_id: string | null
          candidate_reference: string | null
          first_name: string | null
          interview_id: string | null
          interview_reference: string | null
          interview_type: string | null
          last_name: string | null
          location: string | null
          meeting_url: string | null
          organisation_id: string | null
          panel_member_count: number | null
          preferred_name: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          stage_name: string | null
          stage_number: number | null
          status: string | null
          timezone_name: string | null
          vacancy_id: string | null
          vacancy_reference: string | null
          vacancy_title: string | null
        }
        Relationships: []
      }
      leo_talent_vacancy_pipeline_view: {
        Row: {
          appointed: number | null
          closing_date: string | null
          department: string | null
          interview_stage: number | null
          latest_application_at: string | null
          live_applications: number | null
          location_name: string | null
          new_applications: number | null
          offers: number | null
          opening_date: string | null
          organisation_id: string | null
          title: string | null
          total_applications: number | null
          under_review: number | null
          vacancy_id: string | null
          vacancy_reference: string | null
          vacancy_status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      leo_active_employee_profile_count: {
        Args: { p_organisation_id: string }
        Returns: number
      }
      leo_add_matter_chronology_entry: {
        Args: {
          target_correction_reason?: string
          target_detail?: string
          target_event_at: string
          target_event_type: string
          target_is_privileged?: boolean
          target_metadata?: Json
          target_privilege_basis?: string
          target_profile_id: string
          target_source?: string
          target_supersedes_entry_id?: string
          target_title: string
          target_visibility?: string
        }
        Returns: string
      }
      leo_add_platform_validation_finding: {
        Args: {
          p_category: string
          p_check_key: string
          p_evidence?: Json
          p_finding: string
          p_object_name: string
          p_object_schema: string
          p_remediation?: string
          p_severity: string
          p_status: string
          p_validation_run_id: string
        }
        Returns: undefined
      }
      leo_ai_context_category_permission: {
        Args: { category_key: string }
        Returns: string
      }
      leo_ai_forbidden_context_keys: { Args: never; Returns: string[] }
      leo_ai_redact_context: { Args: { input_value: Json }; Returns: Json }
      leo_approve_data_export: {
        Args: { target_approval_reason: string; target_export_id: string }
        Returns: {
          approval_reason: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          download_count: number
          encryption_method: string | null
          expires_at: string | null
          export_reference: string
          export_type: string
          failure_reason: string | null
          file_sha256: string | null
          file_size_bytes: number | null
          id: string
          last_downloaded_at: string | null
          last_downloaded_by: string | null
          metadata: Json
          organisation_id: string
          processing_started_at: string | null
          purpose: string
          ready_at: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requested_at: string
          requested_by: string
          requested_scope: Json
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          updated_at: string
          updated_by: string | null
          watermark_applied: boolean
        }
        SetofOptions: {
          from: "*"
          to: "leo_data_exports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_approve_foundation_profile: {
        Args: {
          p_organisation_id: string
          p_profile_id: string
          p_reason: string
        }
        Returns: string
      }
      leo_assign_role: {
        Args: {
          expires_at_value?: string
          make_primary?: boolean
          reason?: string
          starts_at_value?: string
          target_membership_id: string
          target_role_id: string
        }
        Returns: string
      }
      leo_audit_actor_membership: {
        Args: { target_organisation_id: string; target_user_id?: string }
        Returns: string
      }
      leo_audit_changed_fields: {
        Args: { new_payload: Json; old_payload: Json }
        Returns: string[]
      }
      leo_audit_claims: { Args: never; Returns: Json }
      leo_audit_redact: { Args: { payload: Json }; Returns: Json }
      leo_audit_resolve_organisation: {
        Args: { payload: Json }
        Returns: string
      }
      leo_audit_setting: { Args: { setting_name: string }; Returns: string }
      leo_authorise_ai_request: {
        Args: {
          access_reason?: string
          context_categories?: string[]
          correlation_identifier?: string
          decision_ttl_minutes?: number
          event_metadata?: Json
          record_references?: Json
          request_identifier?: string
          requested_permission_keys?: string[]
          special_category_requested?: boolean
          target_module_key?: string
          target_organisation_id: string
          target_purpose_key: string
          target_workflow_key: string
        }
        Returns: {
          authorised: boolean
          decision_id: string
          decision_reason: string
          denied_permissions: string[]
          expires_at: string
          granted_permissions: string[]
        }[]
      }
      leo_authorise_talent_employee_handover: {
        Args: { target_control_id: string; target_reason: string }
        Returns: boolean
      }
      leo_bootstrap_organisation: {
        Args: {
          p_employee_count_band?: string
          p_first_name: string
          p_last_name: string
          p_organisation_name: string
          p_organisation_website?: string
        }
        Returns: {
          already_existed: boolean
          membership_id: string
          organisation_id: string
          subscription_id: string
          workspace_id: string
        }[]
      }
      leo_bootstrap_organisation_owner: {
        Args: { target_organisation_id: string; target_user_id: string }
        Returns: string
      }
      leo_can_download_document: {
        Args: { target_document_id: string; target_user_id?: string }
        Returns: boolean
      }
      leo_can_manage_employee_record: {
        Args: { target_organisation_id: string; target_user_id?: string }
        Returns: boolean
      }
      leo_can_manage_matter_profile: {
        Args: { target_profile_id: string }
        Returns: boolean
      }
      leo_can_manage_matter_row: {
        Args: { row_data: Json; source_table_name: string }
        Returns: boolean
      }
      leo_can_manage_talent_row: {
        Args: { target_row: Json; target_table: string }
        Returns: boolean
      }
      leo_can_view_document: {
        Args: { target_document_id: string; target_user_id?: string }
        Returns: boolean
      }
      leo_can_view_employee_record: {
        Args: {
          allow_self?: boolean
          sensitive?: boolean
          target_employee_id?: number
          target_organisation_id: string
          target_user_id?: string
        }
        Returns: boolean
      }
      leo_can_view_matter_profile: {
        Args: { target_profile_id: string }
        Returns: boolean
      }
      leo_can_view_matter_row: {
        Args: { row_data: Json; source_table_name: string }
        Returns: boolean
      }
      leo_can_view_talent_row: {
        Args: { target_row: Json; target_table: string }
        Returns: boolean
      }
      leo_check_rate_limit: {
        Args: {
          p_increment?: number
          p_organisation_id: string
          p_policy_key: string
          p_subject: string
        }
        Returns: Json
      }
      leo_claim_jobs: {
        Args: {
          p_lease_seconds?: number
          p_limit?: number
          p_queue_name: string
          p_worker_id: string
        }
        Returns: {
          attempt_count: number
          available_at: string
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          correlation_id: string
          created_at: string
          id: string
          idempotency_key: string | null
          job_type: string
          last_error: Json | null
          lease_expires_at: string | null
          max_attempts: number
          metadata: Json
          notification_id: string | null
          organisation_id: string
          payload: Json
          priority: number
          queue_name: string
          status: string
          updated_at: string
          workflow_instance_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "leo_job_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      leo_complete_ai_execution: {
        Args: {
          completion_status: string
          event_metadata?: Json
          failure_code?: string
          failure_detail?: string
          human_reviewed?: boolean
          output_applied?: boolean
          output_character_count?: number
          output_token_count?: number
          review_outcome?: string
          target_execution_id: string
        }
        Returns: boolean
      }
      leo_complete_document_upload: {
        Args: {
          target_content_sha256?: string
          target_scan_reference?: string
          target_scan_status?: string
          target_version_id: string
        }
        Returns: string
      }
      leo_complete_workflow_action: {
        Args: {
          p_decision: string
          p_organisation_id: string
          p_output?: Json
          p_reason: string
          p_step_id: string
        }
        Returns: string
      }
      leo_compliance_close_control: {
        Args: {
          p_closure_reason: string
          p_control_id: string
          p_evidence_summary?: string
          p_require_approval?: boolean
        }
        Returns: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          archived_by: string | null
          assigned_to_user_id: string | null
          closure_reason: string | null
          completed_at: string | null
          completed_by: string | null
          control_category: string
          control_key: string
          control_name: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          evidence_document_ids: string[]
          evidence_summary: string | null
          id: string
          legal_or_regulatory_basis: string | null
          metadata: Json
          next_review_date: string | null
          organisation_id: string
          owner_user_id: string | null
          priority: string
          recurrence_rule: string | null
          recurring: boolean
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "leo_compliance_control_register"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_connections_can_configure: {
        Args: { target_organisation_id: string }
        Returns: boolean
      }
      leo_connections_can_view: {
        Args: { target_organisation_id: string }
        Returns: boolean
      }
      leo_connections_is_active_member: {
        Args: { target_organisation_id: string; target_user_id?: string }
        Returns: boolean
      }
      leo_create_connection: {
        Args: {
          target_configuration?: Json
          target_connection_name: string
          target_environment?: string
          target_organisation_id: string
          target_provider_key: string
          target_reason?: string
        }
        Returns: string
      }
      leo_create_default_talent_stages: {
        Args: {
          p_created_by?: string
          p_organisation_id: number
          p_vacancy_id: number
        }
        Returns: undefined
      }
      leo_create_document: {
        Args: {
          target_classification?: string
          target_description?: string
          target_document_type?: string
          target_employee_can_download?: boolean
          target_employee_id?: number
          target_employee_visible?: boolean
          target_metadata?: Json
          target_mime_type: string
          target_module_key?: string
          target_organisation_id: string
          target_original_file_name: string
          target_size_bytes: number
          target_source_record_id?: string
          target_source_table?: string
          target_title: string
        }
        Returns: {
          document_id: string
          object_path: string
          version_id: string
        }[]
      }
      leo_create_legal_hold: {
        Args: {
          target_authority?: string
          target_document_id?: string
          target_employee_id?: number
          target_matter_id?: number
          target_module_key?: string
          target_name: string
          target_organisation_id: string
          target_reason: string
          target_review_due_date?: string
          target_scope_filter?: Json
          target_scope_type: string
        }
        Returns: {
          authority: string | null
          created_at: string
          created_by: string | null
          document_id: string | null
          effective_at: string
          employee_id: number | null
          hold_reference: string
          id: string
          matter_id: number | null
          module_key: string | null
          name: string
          organisation_id: string
          reason: string
          release_reason: string | null
          released_at: string | null
          released_by: string | null
          review_due_date: string | null
          scope_filter: Json
          scope_type: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "leo_legal_holds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_create_matter_security_profile: {
        Args: {
          target_ai_context_allowed?: boolean
          target_classification?: string
          target_need_to_know_only?: boolean
          target_organisation_id: string
          target_primary_employee_id?: number
          target_reason?: string
          target_record_id: string
          target_sensitivity?: string
          target_source_table: string
        }
        Returns: string
      }
      leo_create_notification: {
        Args: {
          p_body: string
          p_channel: string
          p_deduplication_key?: string
          p_organisation_id: string
          p_recipient_address: string
          p_recipient_employee_id: string
          p_recipient_user_id: string
          p_scheduled_for?: string
          p_source_id?: string
          p_source_type?: string
          p_subject: string
        }
        Returns: string
      }
      leo_create_privacy_request: {
        Args: {
          target_candidate_id?: number
          target_data_subject_email: string
          target_data_subject_name: string
          target_data_subject_type: string
          target_employee_id?: number
          target_metadata?: Json
          target_organisation_id: string
          target_received_channel?: string
          target_request_type: string
        }
        Returns: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          data_subject_candidate_id: number | null
          data_subject_email: string | null
          data_subject_employee_id: number | null
          data_subject_name: string | null
          data_subject_type: string
          deadline_at: string
          decision: string | null
          decision_reason: string | null
          extension_applied: boolean
          extension_reason: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          identity_verification_status: string
          identity_verified_at: string | null
          identity_verified_by: string | null
          metadata: Json
          organisation_id: string
          received_at: string
          received_channel: string
          request_reference: string
          request_type: string
          response_document_id: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "leo_privacy_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_create_talent_closure_checklist: {
        Args: { p_organisation_id: number; p_vacancy_id: number }
        Returns: undefined
      }
      leo_current_membership_id: {
        Args: { target_organisation_id: string }
        Returns: string
      }
      leo_current_organisation_id: { Args: never; Returns: string }
      leo_current_user_id: { Args: never; Returns: string }
      leo_current_user_role: { Args: never; Returns: string }
      leo_detect_security_anomalies: {
        Args: { p_organisation_id: string; p_window?: string }
        Returns: number
      }
      leo_disconnect_connection: {
        Args: { target_connection_id: string; target_reason: string }
        Returns: boolean
      }
      leo_document_employee_self: {
        Args: { target_employee_id: number; target_user_id?: string }
        Returns: boolean
      }
      leo_document_expected_path: {
        Args: {
          target_document_id: string
          target_file_name: string
          target_organisation_id: string
          target_version_number: number
        }
        Returns: string
      }
      leo_document_path_organisation_id: {
        Args: { target_path: string }
        Returns: string
      }
      leo_effective_permissions: {
        Args: { target_organisation_id: string }
        Returns: {
          action_key: string
          permission_key: string
          permission_name: string
          requires_reason: boolean
          requires_step_up: boolean
          resource_key: string
          role_keys: string[]
          scope_type: string
          sensitivity: string
        }[]
      }
      leo_employee_capacity_status: {
        Args: { p_organisation_id: string }
        Returns: {
          active_employee_profiles: number
          capacity_reached: boolean
          employee_profile_limit: number
          remaining_capacity: number
          unlimited_capacity: boolean
        }[]
      }
      leo_employee_is_self: {
        Args: {
          target_employee_id: number
          target_organisation_id: string
          target_user_id?: string
        }
        Returns: boolean
      }
      leo_employee_organisation_id: {
        Args: { target_employee_id: number }
        Returns: string
      }
      leo_employee_profile_limit: {
        Args: { p_organisation_id: string }
        Returns: number
      }
      leo_finish_job: {
        Args: {
          p_error?: Json
          p_job_id: string
          p_result?: Json
          p_succeeded: boolean
          p_worker_id: string
        }
        Returns: string
      }
      leo_generate_slug: { Args: { input_text: string }; Returns: string }
      leo_grant_matter_access: {
        Args: {
          target_access_level: string
          target_expires_at?: string
          target_profile_id: string
          target_reason: string
          target_user_id: string
        }
        Returns: string
      }
      leo_has_active_matter_grant: {
        Args: {
          required_level?: string
          target_profile_id: string
          target_user_id?: string
        }
        Returns: boolean
      }
      leo_has_active_membership: {
        Args: { target_organisation_id: string; target_user_id?: string }
        Returns: boolean
      }
      leo_has_permission: {
        Args: {
          target_organisation_id: string
          target_permission_key: string
          target_user_id?: string
        }
        Returns: boolean
      }
      leo_has_role: {
        Args: {
          target_organisation_id: string
          target_role_key: string
          target_user_id?: string
        }
        Returns: boolean
      }
      leo_initialise_organisation_governance: {
        Args: { target_organisation_id: string }
        Returns: {
          annual_governance_review_month: number
          created_at: string
          created_by: string | null
          data_controller_name: string | null
          default_retention_years: number
          export_approval_required: boolean
          export_encryption_required: boolean
          export_expiry_hours: number
          export_watermark_required: boolean
          ico_registration_reference: string | null
          identity_verification_required: boolean
          inactivity_timeout_minutes: number
          is_configured: boolean
          last_governance_reviewed_at: string | null
          last_governance_reviewed_by: string | null
          maximum_failed_sign_in_attempts: number
          metadata: Json
          next_governance_review_date: string | null
          organisation_id: string
          primary_jurisdiction: string
          privacy_contact_email: string | null
          privacy_contact_name: string | null
          privacy_notice_effective_at: string | null
          privacy_notice_version: string | null
          privacy_request_default_deadline_days: number
          privileged_session_minutes: number
          require_mfa_for_manager: boolean
          require_mfa_for_owner: boolean
          require_mfa_for_senior: boolean
          require_step_up_for_credential_changes: boolean
          require_step_up_for_exports: boolean
          require_step_up_for_legal_holds: boolean
          standard_session_hours: number
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "leo_organisation_governance_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_is_talent_admin: { Args: never; Returns: boolean }
      leo_is_talent_manager: { Args: never; Returns: boolean }
      leo_is_valid_key: { Args: { value: string }; Returns: boolean }
      leo_learn_issue_certificate: {
        Args: {
          p_assignment_id?: string
          p_certificate_name: string
          p_certificate_reference: string
          p_document_id?: string
          p_employee_id: string
          p_expires_on: string
          p_issue_reason: string
          p_issued_on: string
          p_learning_resource_id?: string
          p_organisation_id: string
        }
        Returns: string
      }
      leo_learn_record_validation: {
        Args: {
          p_assignment_id: string
          p_competence_demonstrated: boolean
          p_employee_id: string
          p_evidence_document_id?: string
          p_learning_resource_id: string
          p_notes?: string
          p_organisation_id: string
          p_outcome: string
          p_reason: string
        }
        Returns: string
      }
      leo_m021_resolve_organisation: {
        Args: { p_row: Json; p_table_name: string }
        Returns: {
          organisation_id: string
          resolution_method: string
        }[]
      }
      leo_mark_notification_read: {
        Args: { p_notification_id: string; p_organisation_id: string }
        Returns: string
      }
      leo_matter_ai_context_allowed: {
        Args: { target_profile_id: string; target_reason: string }
        Returns: boolean
      }
      leo_matter_profile_id: {
        Args: {
          target_organisation_id: string
          target_record_id: string
          target_source_table: string
        }
        Returns: string
      }
      leo_matter_row_organisation_id: {
        Args: { row_data: Json }
        Returns: string
      }
      leo_matter_row_record_id: { Args: { row_data: Json }; Returns: string }
      leo_normalise_key: { Args: { value: string }; Returns: string }
      leo_organisation_has_platform_access: {
        Args: { p_organisation_id: string }
        Returns: boolean
      }
      leo_raise_security_alert: {
        Args: {
          p_alert_key: string
          p_alert_type: string
          p_description: string
          p_detection_rule?: string
          p_evidence?: Json
          p_metadata?: Json
          p_organisation_id: string
          p_risk_score?: number
          p_severity: string
          p_title: string
          p_user_id?: string
        }
        Returns: string
      }
      leo_record_audit_event: {
        Args: {
          target_action_label?: string
          target_actor_user_id?: string
          target_employee_id?: number
          target_event_type: string
          target_metadata?: Json
          target_module_key?: string
          target_new_values?: Json
          target_occurred_at?: string
          target_old_values?: Json
          target_organisation_id: string
          target_record_id?: string
          target_source_table?: string
        }
        Returns: string
      }
      leo_record_authentication_event: {
        Args: {
          p_auth_provider?: string
          p_device_fingerprint?: string
          p_event_type: string
          p_failure_code?: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_organisation_id: string
          p_outcome?: string
          p_risk_factors?: Json
          p_risk_score?: number
          p_session_reference?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      leo_record_document_access: {
        Args: {
          target_access_type: string
          target_document_id: string
          target_metadata?: Json
          target_reason?: string
          target_version_id?: string
        }
        Returns: string
      }
      leo_record_security_event: {
        Args: {
          target_actor_user_id?: string
          target_description?: string
          target_event_type: string
          target_evidence?: Json
          target_metadata?: Json
          target_organisation_id: string
          target_resource_id?: string
          target_resource_type?: string
          target_severity: string
          target_source?: string
          target_title: string
        }
        Returns: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actor_user_id: string | null
          affected_resource_id: string | null
          affected_resource_type: string | null
          affected_user_id: string | null
          assigned_to: string | null
          contained_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          detected_at: string
          event_reference: string
          event_type: string
          evidence: Json
          id: string
          ip_address: unknown
          metadata: Json
          notification_assessment: Json
          occurred_at: string
          organisation_id: string
          requires_notification_assessment: boolean
          resolution_summary: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          user_agent: string | null
        }
        SetofOptions: {
          from: "*"
          to: "leo_security_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_record_subscription_status: {
        Args: {
          p_new_status: string
          p_organisation_id: string
          p_reason?: string
        }
        Returns: {
          cancellation_requested_at: string | null
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          current_period_ends_at: string | null
          current_period_starts_at: string | null
          employee_count: number
          id: string
          metadata: Json
          organisation_id: string
          plan_id: string | null
          provider_customer_reference: string | null
          provider_key: string | null
          provider_subscription_reference: string | null
          resumed_at: string | null
          status: string
          suspended_at: string | null
          trial_id: string | null
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "leo_organisation_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_record_talent_stage_decision: {
        Args: {
          target_ai_assistance_used?: boolean
          target_ai_execution_id?: string
          target_application_id: string
          target_candidate_id: string
          target_decision_key: string
          target_metadata?: Json
          target_organisation_id: string
          target_reason: string
          target_stage_key: string
          target_vacancy_id: string
        }
        Returns: string
      }
      leo_register_audit_export: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_export_type: string
          p_filter_summary?: Json
          p_includes_sensitive_payload?: boolean
          p_organisation_id: string
          p_purpose: string
        }
        Returns: {
          approval_required: boolean
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          date_from: string | null
          date_to: string | null
          document_id: string | null
          expires_at: string | null
          export_type: string
          filter_summary: Json
          generated_at: string | null
          generated_by: string | null
          id: string
          includes_sensitive_payload: boolean
          metadata: Json
          organisation_id: string
          purpose: string
          requested_by: string
          revocation_reason: string | null
          revoked_at: string | null
          row_count: number | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "leo_audit_export_register"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_register_knowledge_source: {
        Args: {
          p_change_reason?: string
          p_contains_personal_data?: boolean
          p_contains_special_category?: boolean
          p_content_reference: string
          p_metadata?: Json
          p_organisation_id: string
          p_sensitivity?: string
          p_source_key: string
          p_source_type: string
          p_title: string
        }
        Returns: string
      }
      leo_register_security_session: {
        Args: {
          p_assurance_level?: string
          p_auth_provider?: string
          p_device_id?: string
          p_expires_at?: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_organisation_id: string
          p_session_reference: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      leo_release_legal_hold: {
        Args: { target_hold_id: string; target_release_reason: string }
        Returns: {
          authority: string | null
          created_at: string
          created_by: string | null
          document_id: string | null
          effective_at: string
          employee_id: number | null
          hold_reference: string
          id: string
          matter_id: number | null
          module_key: string | null
          name: string
          organisation_id: string
          reason: string
          release_reason: string | null
          released_at: string | null
          released_by: string | null
          review_due_date: string | null
          scope_filter: Json
          scope_type: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "leo_legal_holds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_request_ai_execution: {
        Args: {
          p_contains_personal_data?: boolean
          p_contains_special_category?: boolean
          p_metadata?: Json
          p_organisation_id: string
          p_purpose: string
          p_subject_id?: string
          p_subject_type?: string
          p_use_case_key: string
        }
        Returns: string
      }
      leo_request_connection_sync: {
        Args: {
          target_connection_id: string
          target_direction?: string
          target_idempotency_key?: string
          target_metadata?: Json
          target_reason?: string
          target_sync_type: string
        }
        Returns: string
      }
      leo_request_data_export: {
        Args: {
          target_export_type: string
          target_organisation_id: string
          target_purpose: string
          target_requested_scope?: Json
        }
        Returns: {
          approval_reason: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          download_count: number
          encryption_method: string | null
          expires_at: string | null
          export_reference: string
          export_type: string
          failure_reason: string | null
          file_sha256: string | null
          file_size_bytes: number | null
          id: string
          last_downloaded_at: string | null
          last_downloaded_by: string | null
          metadata: Json
          organisation_id: string
          processing_started_at: string | null
          purpose: string
          ready_at: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requested_at: string
          requested_by: string
          requested_scope: Json
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          updated_at: string
          updated_by: string | null
          watermark_applied: boolean
        }
        SetofOptions: {
          from: "*"
          to: "leo_data_exports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_request_insight_export: {
        Args: {
          p_business_purpose: string
          p_contains_sensitive_data?: boolean
          p_export_type: string
          p_filters?: Json
          p_organisation_id: string
        }
        Returns: string
      }
      leo_request_platform_admin_export: {
        Args: {
          p_export_type: string
          p_filters?: Json
          p_organisation_id: string
          p_purpose: string
        }
        Returns: string
      }
      leo_request_workflow: {
        Args: {
          p_context?: Json
          p_idempotency_key?: string
          p_organisation_id: string
          p_subject_id: string
          p_subject_type: string
          p_workflow_definition_id: string
        }
        Returns: string
      }
      leo_retrieve_organisation_memory: {
        Args: { p_limit?: number; p_organisation_id: string; p_purpose: string }
        Returns: {
          ai_eligible: boolean
          approved_at: string | null
          approved_by: string | null
          classification: string
          confidence: number | null
          created_at: string
          created_by: string | null
          id: string
          memory_category: string
          memory_key: string
          memory_value: Json
          metadata: Json
          organisation_id: string
          source_record_id: string | null
          source_relation: string | null
          source_type: string
          status: string
          summary: string
          supersedes_id: string | null
          updated_at: string
          updated_by: string | null
          valid_from: string | null
          valid_until: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "leo_organisation_memory_records"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      leo_review_ai_output: {
        Args: {
          p_accuracy_rating?: number
          p_disposition_reason?: string
          p_execution_id: string
          p_relevance_rating?: number
          p_review_notes?: string
          p_review_status: string
          p_risk_rating?: string
        }
        Returns: string
      }
      leo_revoke_all_user_sessions: {
        Args: { p_organisation_id: string; p_reason: string; p_user_id: string }
        Returns: number
      }
      leo_revoke_matter_access: {
        Args: { target_grant_id: string; target_reason: string }
        Returns: undefined
      }
      leo_revoke_role: {
        Args: { reason: string; target_membership_role_id: string }
        Returns: undefined
      }
      leo_revoke_security_session: {
        Args: { p_reason: string; p_session_id: string }
        Returns: undefined
      }
      leo_run_platform_validation: {
        Args: { p_environment?: string; p_validation_key?: string }
        Returns: string
      }
      leo_run_platform_validation_m019_base: {
        Args: { p_environment?: string; p_validation_key?: string }
        Returns: string
      }
      leo_run_security_health_check: {
        Args: { p_organisation_id: string }
        Returns: string
      }
      leo_sar_approve_disclosure: {
        Args: { p_approved: boolean; p_case_id: string; p_reason: string }
        Returns: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          assigned_to_user_id: string | null
          case_reference: string
          closure_reason: string | null
          created_at: string
          created_by: string | null
          disclosure_document_ids: string[]
          exemption_summary: string | null
          extended_due_at: string | null
          extension_reason: string | null
          id: string
          legal_hold: boolean
          metadata: Json
          organisation_id: string
          received_at: string
          redaction_summary: string | null
          requester_email: string | null
          requester_employee_id: string | null
          requester_name: string
          response_method: string | null
          response_sent_at: string | null
          response_sent_by: string | null
          scope_summary: string
          search_sources: Json
          status: string
          statutory_due_at: string
          updated_at: string
          verification_method: string | null
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "leo_sar_case_register"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_set_device_trust: {
        Args: {
          p_device_id: string
          p_reason: string
          p_trust_expires_at?: string
          p_trusted: boolean
        }
        Returns: undefined
      }
      leo_set_membership_status: {
        Args: {
          new_status: string
          reason?: string
          target_membership_id: string
        }
        Returns: undefined
      }
      leo_set_platform_feature_flag: {
        Args: {
          p_enabled: boolean
          p_feature_key: string
          p_feature_name: string
          p_organisation_id: string
          p_reason: string
          p_rollout_state: string
        }
        Returns: string
      }
      leo_slugify: { Args: { p_value: string }; Returns: string }
      leo_soft_delete_document: {
        Args: { target_document_id: string; target_reason: string }
        Returns: string
      }
      leo_start_ai_execution: {
        Args: {
          context_record_count?: number
          correlation_identifier?: string
          event_metadata?: Json
          input_character_count?: number
          input_token_count?: number
          request_identifier?: string
          target_authorisation_decision_id: string
          target_model_key?: string
          target_provider_key?: string
        }
        Returns: string
      }
      leo_sync_organisation_entitlement: {
        Args: { p_organisation_id: string }
        Returns: {
          access_status: string
          all_platform_features_enabled: boolean
          created_at: string
          effective_from: string | null
          effective_until: string | null
          employee_capacity: number | null
          id: string
          metadata: Json
          module_restrictions: Json
          organisation_id: string
          reason: string | null
          source: string
          subscription_id: string | null
          trial_id: string | null
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "leo_organisation_entitlements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leo_talent_ai_context_allowed: {
        Args: {
          target_contains_health?: boolean
          target_offer_accepted?: boolean
          target_organisation_id: string
          target_purpose: string
          target_record_id: string
          target_record_type: string
        }
        Returns: boolean
      }
      leo_talent_current_actor: { Args: never; Returns: string }
      leo_talent_generate_reference: {
        Args: { prefix: string }
        Returns: string
      }
      leo_talent_json_uuid: {
        Args: { keys: string[]; v: Json }
        Returns: string
      }
      leo_talent_offer_accepted: {
        Args: { target_row: Json }
        Returns: boolean
      }
      leo_talent_permission_for_table: {
        Args: { target_action: string; target_table: string }
        Returns: string
      }
      leo_talent_record_type: {
        Args: { target_table: string }
        Returns: string
      }
      leo_talent_row_organisation_id: {
        Args: { target_row: Json; target_table: string }
        Returns: string
      }
      leo_update_security_alert: {
        Args: {
          p_alert_id: string
          p_assigned_to?: string
          p_notes?: string
          p_status: string
        }
        Returns: undefined
      }
      leo_upsert_ai_organisation_settings: {
        Args: {
          change_reason: string
          settings_patch: Json
          target_organisation_id: string
        }
        Returns: {
          ai_enabled: boolean
          configuration_reason: string | null
          configured_by: string | null
          created_at: string
          document_context_enabled: boolean
          employee_context_enabled: boolean
          external_search_enabled: boolean
          human_review_required: boolean
          learning_context_enabled: boolean
          matter_context_enabled: boolean
          max_context_characters: number
          metadata: Json
          organisation_id: string
          permitted_purpose_keys: string[]
          prohibited_use_keys: string[]
          retention_mode: string
          special_category_context_enabled: boolean
          talent_context_enabled: boolean
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "leo_ai_organisation_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
