/**
 * Hand-authored Supabase database types matching
 * supabase/migrations/0001_core_schema.sql. Once the project is
 * provisioned, prefer regenerating this file with
 * `supabase gen types typescript` so it can never drift from the real
 * schema -- this hand-written version exists so the app has full
 * type-safety before that step runs.
 *
 * Shape must match supabase-js's internal `GenericSchema` /
 * `GenericTable` constraints exactly (including the `Relationships`
 * array and the schema-level `Views`/`Functions` keys) -- if it doesn't,
 * TypeScript silently resolves every query to `never` instead of raising
 * an error at the `createClient<Database>` call site.
 */

type NoRelationships = { Relationships: [] };

export interface Database {
  evobuddy: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          nickname_normalized: string;
          auth_alias: string;
          parent_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          nickname_normalized: string;
          auth_alias: string;
          parent_email?: string | null;
        };
        Update: Partial<Database["evobuddy"]["Tables"]["profiles"]["Insert"]>;
      } & NoRelationships;
      avatars: {
        Row: {
          id: string;
          user_id: string;
          species_slug: string;
          name: string;
          seed: string;
          body_color: string;
          secondary_color: string;
          face_color: string;
          eye_variant: string;
          mouth_variant: string;
          ear_variant: string;
          pattern_variant: string;
          personality: string;
          total_xp: number;
          evolution_branch: string | null;
          stat_hunger: number;
          stat_clean: number;
          stat_energy: number;
          stat_happiness: number;
          stat_health: number;
          is_asleep: boolean;
          is_sick: boolean;
          sick_since: string | null;
          last_tick_at: string;
          hatched_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          species_slug: string;
          name: string;
          seed: string;
          body_color: string;
          secondary_color: string;
          face_color: string;
          eye_variant: string;
          mouth_variant: string;
          ear_variant: string;
          pattern_variant: string;
          personality: string;
          total_xp?: number;
          evolution_branch?: string | null;
          stat_hunger?: number;
          stat_clean?: number;
          stat_energy?: number;
          stat_happiness?: number;
          stat_health?: number;
          is_asleep?: boolean;
          is_sick?: boolean;
          sick_since?: string | null;
          last_tick_at?: string;
        };
        Update: Partial<Database["evobuddy"]["Tables"]["avatars"]["Insert"]>;
      } & NoRelationships;
      care_interactions: {
        Row: {
          id: string;
          avatar_id: string;
          user_id: string;
          action: string;
          xp_awarded: number;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          avatar_id: string;
          user_id: string;
          action: string;
          xp_awarded?: number;
          idempotency_key?: string | null;
        };
        Update: Partial<Database["evobuddy"]["Tables"]["care_interactions"]["Insert"]>;
      } & NoRelationships;
      xp_history: {
        Row: {
          id: string;
          avatar_id: string;
          user_id: string;
          delta: number;
          reason: string;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          avatar_id: string;
          user_id: string;
          delta: number;
          reason: string;
          idempotency_key?: string | null;
        };
        Update: Partial<Database["evobuddy"]["Tables"]["xp_history"]["Insert"]>;
      } & NoRelationships;
      game_history: {
        Row: {
          id: string;
          avatar_id: string;
          user_id: string;
          game_slug: string;
          score: number;
          xp_awarded: number;
          session_token: string;
          played_at: string;
        };
        Insert: {
          avatar_id: string;
          user_id: string;
          game_slug: string;
          score: number;
          xp_awarded?: number;
          session_token: string;
        };
        Update: Partial<Database["evobuddy"]["Tables"]["game_history"]["Insert"]>;
      } & NoRelationships;
      evolution_history: {
        Row: {
          id: string;
          avatar_id: string;
          user_id: string;
          from_stage: string;
          to_stage: string;
          branch: string | null;
          level: number;
          created_at: string;
        };
        Insert: {
          avatar_id: string;
          user_id: string;
          from_stage: string;
          to_stage: string;
          branch?: string | null;
          level: number;
        };
        Update: Partial<Database["evobuddy"]["Tables"]["evolution_history"]["Insert"]>;
      } & NoRelationships;
      login_attempts: {
        Row: {
          id: string;
          nickname_normalized: string;
          ip_hash: string;
          success: boolean;
          attempted_at: string;
        };
        Insert: {
          nickname_normalized: string;
          ip_hash: string;
          success: boolean;
        };
        Update: Partial<Database["evobuddy"]["Tables"]["login_attempts"]["Insert"]>;
      } & NoRelationships;
      recovery_attempts: {
        Row: {
          id: string;
          nickname_normalized: string;
          ip_hash: string;
          success: boolean;
          attempted_at: string;
        };
        Insert: {
          nickname_normalized: string;
          ip_hash: string;
          success: boolean;
        };
        Update: Partial<Database["evobuddy"]["Tables"]["recovery_attempts"]["Insert"]>;
      } & NoRelationships;
      recovery_codes: {
        Row: {
          id: string;
          user_id: string;
          code_hash: string;
          created_at: string;
          used_at: string | null;
        };
        Insert: {
          user_id: string;
          code_hash: string;
          used_at?: string | null;
        };
        Update: Partial<Database["evobuddy"]["Tables"]["recovery_codes"]["Insert"]>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
