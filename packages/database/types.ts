/**
 * Database types — mirror packages/database/supabase/schema.sql.
 *
 * Once the project is connected to a Supabase instance, regenerate with:
 *   pnpm dlx supabase gen types typescript --project-id <id> > packages/database/types.ts
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
      farmers: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          full_name: string | null;
          farm_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          email: string;
          full_name?: string | null;
          farm_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          email?: string;
          full_name?: string | null;
          farm_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cattle: {
        Row: {
          id: string;
          farmer_id: string;
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
          farmer_id: string;
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
          farmer_id?: string;
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
            foreignKeyName: "cattle_farmer_id_fkey";
            columns: ["farmer_id"];
            referencedRelation: "farmers";
            referencedColumns: ["id"];
          },
        ];
      };
      status_history: {
        Row: {
          id: string;
          cattle_id: string;
          from_status: StatusEnum | null;
          to_status: StatusEnum;
          changed_at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          cattle_id: string;
          from_status?: StatusEnum | null;
          to_status: StatusEnum;
          changed_at?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          cattle_id?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      status_enum: StatusEnum;
      gender_enum: GenderEnum;
      breed_enum: BreedEnum;
      acquisition_enum: AcquisitionEnum;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Farmer = Database["public"]["Tables"]["farmers"]["Row"];
export type Cattle = Database["public"]["Tables"]["cattle"]["Row"];
export type StatusHistory =
  Database["public"]["Tables"]["status_history"]["Row"];

export type FarmerInsert = Database["public"]["Tables"]["farmers"]["Insert"];
export type CattleInsert = Database["public"]["Tables"]["cattle"]["Insert"];

export type FarmerUpdate = Database["public"]["Tables"]["farmers"]["Update"];
export type CattleUpdate = Database["public"]["Tables"]["cattle"]["Update"];
