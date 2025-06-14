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
      payments: {
        Row: {
          amount: number
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          date: string
          id: string
          mode: Database["public"]["Enums"]["payment_mode"] | null
          note: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          date: string
          id?: string
          mode?: Database["public"]["Enums"]["payment_mode"] | null
          note?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          date?: string
          id?: string
          mode?: Database["public"]["Enums"]["payment_mode"] | null
          note?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pgs: {
        Row: {
          address: string | null
          amenities: Json | null
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          manager_id: string | null
          monthly_rent: number | null
          name: string
          occupied_rooms: number | null
          pg_type: Database["public"]["Enums"]["pg_type"] | null
          revenue: number | null
          total_rooms: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          manager_id?: string | null
          monthly_rent?: number | null
          name: string
          occupied_rooms?: number | null
          pg_type?: Database["public"]["Enums"]["pg_type"] | null
          revenue?: number | null
          total_rooms?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          manager_id?: string | null
          monthly_rent?: number | null
          name?: string
          occupied_rooms?: number | null
          pg_type?: Database["public"]["Enums"]["pg_type"] | null
          revenue?: number | null
          total_rooms?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pgs_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          assigned_pgs: Json | null
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          assigned_pgs?: Json | null
          created_at?: string
          id: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          assigned_pgs?: Json | null
          created_at?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          occupant_contact: string | null
          occupant_name: string | null
          pg_id: string
          rent: number | null
          room_number: string
          room_type: string
          status: Database["public"]["Enums"]["room_status"] | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          occupant_contact?: string | null
          occupant_name?: string | null
          pg_id: string
          rent?: number | null
          room_number: string
          room_type: string
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          occupant_contact?: string | null
          occupant_name?: string | null
          pg_id?: string
          rent?: number | null
          room_number?: string
          room_type?: string
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_pg_id_fkey"
            columns: ["pg_id"]
            isOneToOne: false
            referencedRelation: "pgs"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          session_token: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          session_token: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          session_token?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          aadhaar_number: string | null
          address: string | null
          created_at: string | null
          deposit: number | null
          end_date: string
          id: string
          name: string
          occupation: string | null
          pg_id: string
          phone: string | null
          room_id: string | null
          start_date: string
          total_fees: number | null
          updated_at: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          created_at?: string | null
          deposit?: number | null
          end_date: string
          id?: string
          name: string
          occupation?: string | null
          pg_id: string
          phone?: string | null
          room_id?: string | null
          start_date: string
          total_fees?: number | null
          updated_at?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          created_at?: string | null
          deposit?: number | null
          end_date?: string
          id?: string
          name?: string
          occupation?: string | null
          pg_id?: string
          phone?: string | null
          room_id?: string | null
          start_date?: string
          total_fees?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_pg_id_fkey"
            columns: ["pg_id"]
            isOneToOne: false
            referencedRelation: "pgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          assignedPGs: Json | null
          created_at: string | null
          email: string
          id: string
          lastLogin: string | null
          name: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
          updated_at: string | null
        }
        Insert: {
          assignedPGs?: Json | null
          created_at?: string | null
          email: string
          id?: string
          lastLogin?: string | null
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string | null
        }
        Update: {
          assignedPGs?: Json | null
          created_at?: string | null
          email?: string
          id?: string
          lastLogin?: string | null
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      payment_mode: "Cash" | "UPI" | "Bank Transfer"
      pg_type: "male" | "female" | "unisex"
      room_status:
        | "available"
        | "occupied"
        | "maintenance"
        | "vacant"
        | "partial"
        | "full"
      user_role: "admin" | "manager" | "accountant" | "viewer"
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
    Enums: {
      approval_status: ["pending", "approved", "rejected"],
      payment_mode: ["Cash", "UPI", "Bank Transfer"],
      pg_type: ["male", "female", "unisex"],
      room_status: [
        "available",
        "occupied",
        "maintenance",
        "vacant",
        "partial",
        "full",
      ],
      user_role: ["admin", "manager", "accountant", "viewer"],
    },
  },
} as const
