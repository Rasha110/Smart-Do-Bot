// supabase/functions/sync-embeddings/client.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!, 
  Deno.env.get("SERVICE_ROLE_KEY")!
);