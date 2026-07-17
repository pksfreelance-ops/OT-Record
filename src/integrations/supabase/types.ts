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
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          created_at: string
          default_end_time: string
          default_start_time: string
          designation: string
          employee_id: string
          id: string
          is_active: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_end_time?: string
          default_start_time?: string
          designation?: string
          employee_id: string
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_end_time?: string
          default_start_time?: string
          designation?: string
          employee_id?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ot_day_entries: {
        Row: {
          created_at: string
          department: string
          description: string
          emp1_end_time: string | null
          emp1_member_id: string | null
          emp1_selected: boolean
          emp1_start_time: string | null
          emp1_total_hours: number
          emp10_end_time: string | null
          emp10_member_id: string | null
          emp10_selected: boolean
          emp10_start_time: string | null
          emp10_total_hours: number
          emp2_end_time: string | null
          emp2_member_id: string | null
          emp2_selected: boolean
          emp2_start_time: string | null
          emp2_total_hours: number
          emp3_end_time: string | null
          emp3_member_id: string | null
          emp3_selected: boolean
          emp3_start_time: string | null
          emp3_total_hours: number
          emp4_end_time: string | null
          emp4_member_id: string | null
          emp4_selected: boolean
          emp4_start_time: string | null
          emp4_total_hours: number
          emp5_end_time: string | null
          emp5_member_id: string | null
          emp5_selected: boolean
          emp5_start_time: string | null
          emp5_total_hours: number
          emp6_end_time: string | null
          emp6_member_id: string | null
          emp6_selected: boolean
          emp6_start_time: string | null
          emp6_total_hours: number
          emp7_end_time: string | null
          emp7_member_id: string | null
          emp7_selected: boolean
          emp7_start_time: string | null
          emp7_total_hours: number
          emp8_end_time: string | null
          emp8_member_id: string | null
          emp8_selected: boolean
          emp8_start_time: string | null
          emp8_total_hours: number
          emp9_end_time: string | null
          emp9_member_id: string | null
          emp9_selected: boolean
          emp9_start_time: string | null
          emp9_total_hours: number
          id: string
          owner_id: string
          session_end: string
          session_start: string
          updated_at: string
          work_date: string
        }
        Insert: {
          created_at?: string
          department?: string
          description?: string
          emp1_end_time?: string | null
          emp1_member_id?: string | null
          emp1_selected?: boolean
          emp1_start_time?: string | null
          emp1_total_hours?: number
          emp10_end_time?: string | null
          emp10_member_id?: string | null
          emp10_selected?: boolean
          emp10_start_time?: string | null
          emp10_total_hours?: number
          emp2_end_time?: string | null
          emp2_member_id?: string | null
          emp2_selected?: boolean
          emp2_start_time?: string | null
          emp2_total_hours?: number
          emp3_end_time?: string | null
          emp3_member_id?: string | null
          emp3_selected?: boolean
          emp3_start_time?: string | null
          emp3_total_hours?: number
          emp4_end_time?: string | null
          emp4_member_id?: string | null
          emp4_selected?: boolean
          emp4_start_time?: string | null
          emp4_total_hours?: number
          emp5_end_time?: string | null
          emp5_member_id?: string | null
          emp5_selected?: boolean
          emp5_start_time?: string | null
          emp5_total_hours?: number
          emp6_end_time?: string | null
          emp6_member_id?: string | null
          emp6_selected?: boolean
          emp6_start_time?: string | null
          emp6_total_hours?: number
          emp7_end_time?: string | null
          emp7_member_id?: string | null
          emp7_selected?: boolean
          emp7_start_time?: string | null
          emp7_total_hours?: number
          emp8_end_time?: string | null
          emp8_member_id?: string | null
          emp8_selected?: boolean
          emp8_start_time?: string | null
          emp8_total_hours?: number
          emp9_end_time?: string | null
          emp9_member_id?: string | null
          emp9_selected?: boolean
          emp9_start_time?: string | null
          emp9_total_hours?: number
          id?: string
          owner_id: string
          session_end?: string
          session_start?: string
          updated_at?: string
          work_date: string
        }
        Update: {
          created_at?: string
          department?: string
          description?: string
          emp1_end_time?: string | null
          emp1_member_id?: string | null
          emp1_selected?: boolean
          emp1_start_time?: string | null
          emp1_total_hours?: number
          emp10_end_time?: string | null
          emp10_member_id?: string | null
          emp10_selected?: boolean
          emp10_start_time?: string | null
          emp10_total_hours?: number
          emp2_end_time?: string | null
          emp2_member_id?: string | null
          emp2_selected?: boolean
          emp2_start_time?: string | null
          emp2_total_hours?: number
          emp3_end_time?: string | null
          emp3_member_id?: string | null
          emp3_selected?: boolean
          emp3_start_time?: string | null
          emp3_total_hours?: number
          emp4_end_time?: string | null
          emp4_member_id?: string | null
          emp4_selected?: boolean
          emp4_start_time?: string | null
          emp4_total_hours?: number
          emp5_end_time?: string | null
          emp5_member_id?: string | null
          emp5_selected?: boolean
          emp5_start_time?: string | null
          emp5_total_hours?: number
          emp6_end_time?: string | null
          emp6_member_id?: string | null
          emp6_selected?: boolean
          emp6_start_time?: string | null
          emp6_total_hours?: number
          emp7_end_time?: string | null
          emp7_member_id?: string | null
          emp7_selected?: boolean
          emp7_start_time?: string | null
          emp7_total_hours?: number
          emp8_end_time?: string | null
          emp8_member_id?: string | null
          emp8_selected?: boolean
          emp8_start_time?: string | null
          emp8_total_hours?: number
          emp9_end_time?: string | null
          emp9_member_id?: string | null
          emp9_selected?: boolean
          emp9_start_time?: string | null
          emp9_total_hours?: number
          id?: string
          owner_id?: string
          session_end?: string
          session_start?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "ot_day_entries_emp1_member_id_fkey"
            columns: ["emp1_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_day_entries_emp10_member_id_fkey"
            columns: ["emp10_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_day_entries_emp2_member_id_fkey"
            columns: ["emp2_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_day_entries_emp3_member_id_fkey"
            columns: ["emp3_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_day_entries_emp4_member_id_fkey"
            columns: ["emp4_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_day_entries_emp5_member_id_fkey"
            columns: ["emp5_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_day_entries_emp6_member_id_fkey"
            columns: ["emp6_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_day_entries_emp7_member_id_fkey"
            columns: ["emp7_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_day_entries_emp8_member_id_fkey"
            columns: ["emp8_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_day_entries_emp9_member_id_fkey"
            columns: ["emp9_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      each: { Args: { hs: unknown }; Returns: Record<string, unknown>[] }
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
