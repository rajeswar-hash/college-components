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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      college_requests: {
        Row: {
          city: string
          college_name: string
          created_at: string
          id: string
          note: string
          requester_email: string
          requester_name: string
          reviewed_at: string | null
          state: string
          status: string
        }
        Insert: {
          city?: string
          college_name: string
          created_at?: string
          id?: string
          note?: string
          requester_email?: string
          requester_name?: string
          reviewed_at?: string | null
          state?: string
          status?: string
        }
        Update: {
          city?: string
          college_name?: string
          created_at?: string
          id?: string
          note?: string
          requester_email?: string
          requester_name?: string
          reviewed_at?: string | null
          state?: string
          status?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          ai_verification_status: string | null
          category: string
          college: string
          condition: string
          created_at: string
          description: string
          hidden_at: string | null
          id: string
          images: string[] | null
          likes: number
          moderation_status: string
          price: number
          report_count: number
          resource_link: string | null
          seller_id: string
          sold: boolean
          title: string
          updated_at: string
        }
        Insert: {
          ai_verification_status?: string | null
          category: string
          college?: string
          condition: string
          created_at?: string
          description?: string
          hidden_at?: string | null
          id?: string
          images?: string[] | null
          likes?: number
          moderation_status?: string
          price: number
          report_count?: number
          resource_link?: string | null
          seller_id: string
          sold?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          ai_verification_status?: string | null
          category?: string
          college?: string
          condition?: string
          created_at?: string
          description?: string
          hidden_at?: string | null
          id?: string
          images?: string[] | null
          likes?: number
          moderation_status?: string
          price?: number
          report_count?: number
          resource_link?: string | null
          seller_id?: string
          sold?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      listing_reports: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: []
      }
      listing_likes: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          college: string
          created_at: string
          email: string
          id: string
          is_admin: boolean
          is_banned: boolean
          name: string
          phone: string
          seller_verification_status: string
          student_id_card_path: string | null
          student_id_rejection_reason: string | null
          student_id_reviewed_at: string | null
          updated_at: string
          violation_count: number
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          college?: string
          created_at?: string
          email: string
          id: string
          is_admin?: boolean
          is_banned?: boolean
          name: string
          phone?: string
          seller_verification_status?: string
          student_id_card_path?: string | null
          student_id_rejection_reason?: string | null
          student_id_reviewed_at?: string | null
          updated_at?: string
          violation_count?: number
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          college?: string
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          is_banned?: boolean
          name?: string
          phone?: string
          seller_verification_status?: string
          student_id_card_path?: string | null
          student_id_rejection_reason?: string | null
          student_id_reviewed_at?: string | null
          updated_at?: string
          violation_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_my_account: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_listing_contact: {
        Args: {
          p_listing_id: string
        }
        Returns: {
          seller_name: string
          seller_phone: string
        }[]
      }
      get_approved_college_requests: {
        Args: Record<PropertyKey, never>
        Returns: {
          city: string
          college_name: string
          state: string
        }[]
      }
      has_user_liked_listing: {
        Args: {
          p_listing_id: string
        }
        Returns: boolean
      }
      submit_listing_report: {
        Args: {
          p_listing_id: string
          p_reason: string
        }
        Returns: {
          moderation_status: string
          report_count: number
        }[]
      }
      toggle_listing_report: {
        Args: {
          p_listing_id: string
          p_reason: string
        }
        Returns: {
          has_reported: boolean
          moderation_status: string
          report_count: number
        }[]
      }
      toggle_listing_like: {
        Args: {
          listing_id: string
          should_like: boolean
        }
        Returns: number
      }
      toggle_listing_like_v2: {
        Args: {
          p_listing_id: string
          p_should_like: boolean
        }
        Returns: number
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
