import { corsHeaders, jsonResponse } from "../todo-chat/cors.ts"
import { generateEmbedding } from "../todo-chat/generate_embeddings.ts";
import { callOpenAI } from "../todo-chat/call_openai.ts";
import {
  fetchChatHistory,
  fetchSimilarTodos,
  fetchAllTodos,
  fetchExistingContexts,
  fetchTodoStats
} from "../todo-chat/fetch_data.ts";
import { updateTodoContexts } from "../todo-chat/update_context.ts";

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }
    const body = await req.json().catch(() => null);
    if (!body) {
      return jsonResponse({ error: "Invalid JSON in request body" }, 400);
    }
    const { user_id, query } = body;
    if (!user_id || !query) {
      return jsonResponse({ error: "user_id and query are required" }, 400);
    }

    // Fetch conversation history
    const history = await fetchChatHistory(user_id);

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Check if query is about metadata (updated/modified tasks)
    const lowerQuery = query.toLowerCase();
    const isMetadataQuery = lowerQuery.includes('updated') || 
                           lowerQuery.includes('modified') || 
                           lowerQuery.includes('changed');

    // Fetch todos based on query type
    const similarTodos = isMetadataQuery 
      ? await fetchAllTodos(user_id)
      : await fetchSimilarTodos(queryEmbedding, user_id);

    // Fetch existing contexts
    const todoIds = similarTodos.map((t: any) => t.id);
    const contextMap = await fetchExistingContexts(todoIds, user_id);

    // Get stats
    const { total, completed, pending } = await fetchTodoStats(user_id);

    // Build context
    const completedList = similarTodos.filter((t: any) => t.is_completed);
    const pendingList = similarTodos.filter((t: any) => !t.is_completed);
    
    // Separate updated and non-updated tasks
    const updatedTasks = similarTodos.filter((t: any) => 
      t.updated_at && new Date(t.created_at).getTime() !== new Date(t.updated_at).getTime()
    );
    const notUpdatedTasks = similarTodos.filter((t: any) => 
      !t.updated_at || new Date(t.created_at).getTime() === new Date(t.updated_at).getTime()
    );

    const now = new Date();
    const currentDateTime = now.toLocaleString('en-US');

    //making a readable string for bot
    const formatTodo = (t: any, idx: number) => {
      const notes = t.notes ? ` | Notes: ${t.notes}` : "";
      const created = new Date(t.created_at).toLocaleString('en-US');
      const updated = t.updated_at ? new Date(t.updated_at).toLocaleString('en-US') : 'Never';
      const match = (t.similarity * 100).toFixed(1);
      // Check if task was updated (updated_at is not null and different from created_at)
      const wasUpdated = (t.updated_at && new Date(t.created_at).getTime() !== new Date(t.updated_at).getTime()) ? " [UPDATED]" : " [NOT UPDATED]";
      //string given to AI
      return `${idx + 1}. "${t.title}" | Created: ${created} | Updated: ${updated}${notes} [${match}%]${wasUpdated}`;
    };

    const contextData = `
CURRENT: ${currentDateTime}
STATS: Total=${total} | Completed=${completed} | Pending=${pending}

UPDATED TASKS (${updatedTasks.length}):
${updatedTasks.length > 0 ? updatedTasks.map((t, i) => formatTodo(t, i)).join("\n") : "No updated tasks found"}

NOT UPDATED TASKS (${notUpdatedTasks.length}):
${notUpdatedTasks.length > 0 ? notUpdatedTasks.map((t, i) => formatTodo(t, i)).join("\n") : "All tasks have been updated"}

COMPLETED (${completedList.length}):
${completedList.map((t, i) => formatTodo(t, i)).join("\n")}

PENDING (${pendingList.length}):
${pendingList.map((t, i) => formatTodo(t, i)).join("\n")}`;

    // Build messages with history
    const messages = [
      {
        role: "system",
        content: `You are a Todo Assistant using AI semantic search.
RULES:
1. Use STATS for counts
2. Only reference listed todos from the provided sections
3. Never invent titles
4. UPDATED TASKS section contains tasks that were modified after creation (updated_at != created_at)
5. NOT UPDATED TASKS section contains tasks that were never modified (updated_at = created_at or null)
6. When user asks "what are updated tasks" or "show updated tasks", ONLY use tasks from UPDATED TASKS section
7. When user asks about tasks that haven't been updated, use NOT UPDATED TASKS section
8. COMPLETED and PENDING sections show task completion status
9. Use conversation history for context (understand "those", "them", "the first one")
10. Be concise and accurate
11. Always check which section a task is in before answering
12. If UPDATED TASKS section is empty, clearly state "No tasks have been updated"
13. [UPDATED] marker means the task was modified, [NOT UPDATED] means it wasn't
Current time is provided. Compare dates to answer "today", "yesterday", etc.
Showing ${similarTodos.length} of ${total} todos.`
      }
    ];

    // Add conversation history for context
    history.forEach((turn: any) => {
      messages.push({ role: "user", content: turn.query });
      messages.push({ role: "assistant", content: turn.response });
    });

    messages.push({ role: "user", content: `${contextData}\n\nQ: ${query}` });

    // Get AI response
    const aiResponse = await callOpenAI(messages);

    // Update contexts
    await updateTodoContexts(
      similarTodos,
      query,
      contextMap,
      user_id,
      total,
      completed,
      pending
    );

    return jsonResponse({ reply: aiResponse });

  } catch (err: any) {
    return jsonResponse({ reply: "Something went wrong." }, 500);
  }
});