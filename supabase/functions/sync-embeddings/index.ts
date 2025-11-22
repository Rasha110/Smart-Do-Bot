// supabase/functions/sync-embeddings/index.ts
import { supabase } from "../sync-embeddings/client.ts";
import { corsHeaders } from "../sync-embeddings/cors.ts";
import { syncTodoEmbeddings } from "../sync-embeddings/sync_todos.ts";

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(null, { status: 401, headers: corsHeaders });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return new Response(null, { status: 401, headers: corsHeaders });
    }

    await syncTodoEmbeddings(user.id);

    return new Response(null, { status: 204, headers: corsHeaders });
    
  } catch {
    return new Response(null, { status: 500, headers: corsHeaders });
  }
});