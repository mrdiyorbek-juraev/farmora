/**
 * Database types — mirror packages/database/supabase/migrations/.
 *
 * Once connected to a Supabase instance, regenerate with:
 *   pnpm --filter @repo/database db:types
 *
 * Until then this hand-written version keeps queries type-safe.
 */

export type StatusEnum = "active" | "sick" | "pregnant" | "sold" | "deceased";

export type GenderEnum = "female" | "male";

export type BreedEnum =
  | "holstein"
  | "jersey"
  | "angus"
  | "hereford"
  | "brown_swiss"
  | "guernsey"
  | "charolais"
  | "simmental"
  | "other";

export type AcquisitionEnum = "born_on_farm" | "purchased";

export type MembershipRoleEnum = "admin" | "member";

export type ActivityTypeEnum =
  | "cattle_created"
  | "cattle_updated"
  | "cattle_deleted"
  | "status_changed"
  | "weight_recorded"
  | "note_added"
  | "member_added"
  | "member_removed"
  | "organization_updated";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          clerk_org_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_org_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_org_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          organization_id: string;
          clerk_user_id: string;
          email: string;
          full_name: string | null;
          role: MembershipRoleEnum;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          clerk_user_id: string;
          email: string;
          full_name?: string | null;
          role?: MembershipRoleEnum;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          clerk_user_id?: string;
          email?: string;
          full_name?: string | null;
          role?: MembershipRoleEnum;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      cattle: {
        Row: {
          id: string;
          organization_id: string;
          created_by_user_id: string;
          tag_number: string;
          name: string | null;
          breed: BreedEnum;
          gender: GenderEnum;
          date_of_birth: string;
          status: StatusEnum;
          weight_kg: number | null;
          acquisition: AcquisitionEnum;
          acquired_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by_user_id: string;
          tag_number: string;
          name?: string | null;
          breed: BreedEnum;
          gender: GenderEnum;
          date_of_birth: string;
          status?: StatusEnum;
          weight_kg?: number | null;
          acquisition: AcquisitionEnum;
          acquired_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by_user_id?: string;
          tag_number?: string;
          name?: string | null;
          breed?: BreedEnum;
          gender?: GenderEnum;
          date_of_birth?: string;
          status?: StatusEnum;
          weight_kg?: number | null;
          acquisition?: AcquisitionEnum;
          acquired_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cattle_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      status_history: {
        Row: {
          id: string;
          cattle_id: string;
          changed_by_user_id: string | null;
          from_status: StatusEnum | null;
          to_status: StatusEnum;
          changed_at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          cattle_id: string;
          changed_by_user_id?: string | null;
          from_status?: StatusEnum | null;
          to_status: StatusEnum;
          changed_at?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          cattle_id?: string;
          changed_by_user_id?: string | null;
          from_status?: StatusEnum | null;
          to_status?: StatusEnum;
          changed_at?: string;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "status_history_cattle_id_fkey";
            columns: ["cattle_id"];
            referencedRelation: "cattle";
            referencedColumns: ["id"];
          },
        ];
      };
      weight_measurements: {
        Row: {
          id: string;
          organization_id: string;
          cattle_id: string;
          recorded_by_user_id: string | null;
          weight_kg: number;
          measured_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          cattle_id: string;
          recorded_by_user_id?: string | null;
          weight_kg: number;
          measured_at: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          cattle_id?: string;
          recorded_by_user_id?: string | null;
          weight_kg?: number;
          measured_at?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "weight_measurements_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weight_measurements_cattle_id_fkey";
            columns: ["cattle_id"];
            referencedRelation: "cattle";
            referencedColumns: ["id"];
          },
        ];
      };
      activities: {
        Row: {
          id: string;
          organization_id: string;
          actor_user_id: string | null;
          cattle_id: string | null;
          type: ActivityTypeEnum;
          title: string;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_user_id?: string | null;
          cattle_id?: string | null;
          type: ActivityTypeEnum;
          title: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          actor_user_id?: string | null;
          cattle_id?: string | null;
          type?: ActivityTypeEnum;
          title?: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_cattle_id_fkey";
            columns: ["cattle_id"];
            referencedRelation: "cattle";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      status_enum: StatusEnum;
      gender_enum: GenderEnum;
      breed_enum: BreedEnum;
      acquisition_enum: AcquisitionEnum;
      membership_role_enum: MembershipRoleEnum;
      activity_type_enum: ActivityTypeEnum;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Cattle = Database["public"]["Tables"]["cattle"]["Row"];
export type StatusHistory =
  Database["public"]["Tables"]["status_history"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type WeightMeasurement =
  Database["public"]["Tables"]["weight_measurements"]["Row"];

export type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];
export type MembershipInsert =
  Database["public"]["Tables"]["memberships"]["Insert"];
export type CattleInsert = Database["public"]["Tables"]["cattle"]["Insert"];
export type ActivityInsert =
  Database["public"]["Tables"]["activities"]["Insert"];
export type WeightMeasurementInsert =
  Database["public"]["Tables"]["weight_measurements"]["Insert"];

export type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];
export type MembershipUpdate =
  Database["public"]["Tables"]["memberships"]["Update"];
export type CattleUpdate = Database["public"]["Tables"]["cattle"]["Update"];
export type ActivityUpdate =
  Database["public"]["Tables"]["activities"]["Update"];
