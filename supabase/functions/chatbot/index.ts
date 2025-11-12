import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

//  Generate embedding
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    const data = response.ok ? await response.json() : { data: [{ embedding: [] }] };
    return data.data?.[0]?.embedding ?? [];
  } catch (err) {
    console.error("Embedding error:", err);
    return [];
  }
}

// Call OpenAI
async function callOpenAI(systemPrompt: string, userQuery: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  const data = response.ok ? await response.json() : null;
  return data?.choices?.[0]?.message?.content ?? 
    (() => { throw new Error(`OpenAI error: ${response.statusText}`); })();
}

//  Create json response
const jsonResponse = (body: any, status = 200) => 
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Main handler
Deno.serve(async (req) => {
  try {
    // Handle CORS 
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Only accept POST
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    // Parse request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonResponse({ error: "Invalid JSON in request body" }, 400);
    }

    const { user_id, query } = body;

    // Validate required fields
    if (!user_id || !query) {
      return jsonResponse({ error: "user_id and query are required" }, 400);
    }


    // Fetch todos
    const { data: todos, error: todosErr } = await supabase
      .from("todos")
      .select("id, title, is_completed, created_at, updated_at, notes")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (todosErr) throw todosErr;

    // Handle empty todos
    if (!todos || todos.length === 0) {
      return jsonResponse({ 
        reply: "You don't have any todos yet. Create some tasks to get started!" 
      });
    }

    // Calculate statistics
    const todoStats = {
      total: todos.length,
      completed: todos.filter((t: any) => t.is_completed).length,
      pending: todos.filter((t: any) => !t.is_completed).length,
    };

    // Time period calculations
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const filterByDate = (startDate: Date) => 
      todos.filter((t: any) => new Date(t.created_at) >= startDate);

    const todaysTodos = filterByDate(todayStart);
    const thisWeekTodos = filterByDate(weekStart);
    const thisMonthTodos = filterByDate(monthStart);

    const countCompleted = (todoList: any[]) => 
      todoList.filter((t: any) => t.is_completed).length;

    const completedToday = countCompleted(todaysTodos);
    const completedThisWeek = countCompleted(thisWeekTodos);
    const completedThisMonth = countCompleted(thisMonthTodos);

    // Format todos
    const formatTodo=(t: any) => {
      const date = new Date(t.created_at).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      const status = t.is_completed ? "DONE" : "PENDING";
      const noteStr = t.notes ? `(${t.notes})` : "";
      return `${status} - "${t.title}" (${date})${noteStr}`;
    };

    const recentTodos = todos.slice(0, 10).map(formatTodo).join("\n");

    // Format completed todos with dates
    const completedTodosFormatted = todos
      .filter((t: any) => t.is_completed && t.updated_at)
      .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      
      .map((t: any) => {
        const completedDate = new Date(t.updated_at).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        });
        return `- "${t.title}" - Completed on ${completedDate}`;
      })
      .join("\n");

    // Build comprehensive context for AI
    const contextData = `
STATISTICAL SUMMARY:
- Total Todos: ${todoStats.total}
- Completed: ${todoStats.completed} (${((todoStats.completed / todoStats.total) * 100).toFixed(1)}%)
- Pending: ${todoStats.pending}

TIME PERIOD BREAKDOWN:
- Created Today: ${todaysTodos.length} (Completed: ${completedToday})
- Created This Week: ${thisWeekTodos.length} (Completed: ${completedThisWeek})
- Created This Month: ${thisMonthTodos.length} (Completed: ${completedThisMonth})

RECENT TODOS (Last 10):
${recentTodos}

RECENTLY COMPLETED TODOS WITH DATES:
${completedTodosFormatted || "No completed todos yet"}

IMPORTANT NOTES:
- This system tracks completion status (completed/pending) but NOT deleted todos
- Use the "updated_at" field for completion dates
- All statistics and dates are provided above - use them directly`;

    const systemPrompt = `You are a highly helpful and conversational Todo Assistant with access to the user's complete task management database.

ANALYSIS FRAMEWORK:
Automatically identify what the user is asking for:
- Date/Time queries (when, date, completed on): Focus on completion dates from "RECENTLY COMPLETED TODOS"
- Count queries (how many, total, count): Use statistics and percentages
- Time period queries (today, this week, this month): Use "TIME PERIOD BREAKDOWN"
- Status queries (pending, incomplete, not done): Use completion status data
- Deletion queries: Explain we track completion, not deletion
- General queries: Provide relevant overview from all available data

RESPONSE GUIDELINES:
- Always provide SPECIFIC numbers and dates from the data
- Be friendly, concise, and conversational
- Add context to numbers (e.g., "8 out of 15 todos, which is 53%")
- Use exact dates for completion queries
- Include percentages for count queries when relevant
- NEVER make up data - only use what's provided
- Be encouraging with users who haven't completed many todos yet
- Answer naturally without mentioning the analysis framework

DATA PROVIDED:
All necessary data is in the context below. Analyze the user's question and respond appropriately.`;

    const enhancedQuery = `${contextData}\n\nUser Question: ${query}`;


    // Get AI response
    const aiResponse = await callOpenAI(systemPrompt, enhancedQuery);


    // Generate embedding
    const embeddingPromise = generateEmbedding(query);

    // Store conversation history 
    embeddingPromise.then(embedding => {
      supabase.from("ai_chat_history").insert([{
        user_id,
        query,
        response: aiResponse,
        embedding: embedding.length > 0 ? embedding : null,
        todo_context: {
          stats: todoStats,
          todos_count: todos.length,
          period_breakdown: {
            today: completedToday,
            this_week: completedThisWeek,
            this_month: completedThisMonth,
          },
        },
      }]).then(({ error }) => {
        if (error) console.error("History insert error:", error);
      });
    });

    // Return response i
    return jsonResponse({ reply: aiResponse });

  } catch (err) {
    console.error("Error:", err);
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return jsonResponse({ 
      error: errorMsg,
      reply: "Sorry, I encountered an error processing your request. Please try again."
    }, 500);
  }
});