import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
export const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

export const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);