export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          salon_name: string | null;
          role: "owner" | "manager" | "admin";
          status: "pending" | "active" | "suspended";
          pdpa_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          salon_name?: string | null;
          role?: "owner" | "manager" | "admin";
          status?: "pending" | "active" | "suspended";
          pdpa_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      hairdressers: {
        Row: {
          id: string;
          trustcut_id: string;
          first_name: string;
          last_name: string;
          nick_name: string | null;
          phone: string | null;
          email: string | null;
          line_id: string | null;
          instagram: string | null;
          hometown_address: string | null;
          current_address: string | null;
          years_experience: number;
          competency_scores: Json;
          aptitude_scores: Json;
          behavior_score: number;
          reliability_score: number;
          pdpa_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trustcut_id: string;
          first_name: string;
          last_name: string;
          nick_name?: string | null;
          phone?: string | null;
          email?: string | null;
          line_id?: string | null;
          instagram?: string | null;
          hometown_address?: string | null;
          current_address?: string | null;
          years_experience?: number;
          competency_scores?: Json;
          aptitude_scores?: Json;
          behavior_score?: number;
          reliability_score?: number;
          pdpa_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hairdressers"]["Insert"]>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          hairdresser_id: string;
          author_id: string;
          body: string;
          rating: number;
          status: "pending" | "approved" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          hairdresser_id: string;
          author_id: string;
          body: string;
          rating: number;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [];
      };
      hair_style_posts: {
        Row: {
          id: string;
          hairdresser_id: string;
          member_id: string;
          title: string;
          description: string | null;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          hairdresser_id: string;
          member_id: string;
          title: string;
          description?: string | null;
          image_url: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hair_style_posts"]["Insert"]>;
        Relationships: [];
      };
      usage_events: {
        Row: {
          id: string;
          member_id: string | null;
          event_name: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id?: string | null;
          event_name: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["usage_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
