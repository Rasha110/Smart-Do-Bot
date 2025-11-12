import { createClient } from "@supabase/supabase-js";

// .env file
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// supabase client
export const supabase=createClient(supabaseUrl, supabaseAnonKey);