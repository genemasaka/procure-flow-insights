export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_insights: {
        Row: {
          actionable: boolean | null
          confidence: number
          contract_id: string | null
          created_at: string
          description: string
          id: string
          impact: string
          insight_type: string
          title: string
        }
        Insert: {
          actionable?: boolean | null
          confidence: number
          contract_id?: string | null
          created_at?: string
          description: string
          id?: string
          impact: string
          insight_type: string
          title: string
        }
        Update: {
          actionable?: boolean | null
          confidence?: number
          contract_id?: string | null
          created_at?: string
          description?: string
          id?: string
          impact?: string
          insight_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_content: string | null
          contract_type: string
          contract_value: number | null
          counterparty: string
          created_at: string
          currency: string | null
          effective_date: string | null
          expiration_date: string | null
          file_name: string | null
          file_path: string | null
          hs_codes: string[] | null
          id: string
          renewal_notice_days: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          contract_content?: string | null
          contract_type: string
          contract_value?: number | null
          counterparty: string
          created_at?: string
          currency?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          file_name?: string | null
          file_path?: string | null
          hs_codes?: string[] | null
          id?: string
          renewal_notice_days?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          contract_content?: string | null
          contract_type?: string
          contract_value?: number | null
          counterparty?: string
          created_at?: string
          currency?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          file_name?: string | null
          file_path?: string | null
          hs_codes?: string[] | null
          id?: string
          renewal_notice_days?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          contract_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          notification_sent: boolean | null
          priority: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          notification_sent?: boolean | null
          priority?: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          notification_sent?: boolean | null
          priority?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      document_uploads: {
        Row: {
          ai_analysis: Json | null
          contract_id: string | null
          created_at: string
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          processing_status: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          contract_id?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          processing_status?: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          contract_id?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          processing_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_uploads_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
