import { corsHeaders, jsonResponse } from "../todo-chat/cors.ts"
import { generateEmbedding } from "../todo-chat/generate_embeddings.ts";
import { callOpenAI } from "../todo-chat/call_openai.ts";
import {
  fetchChatHistory,
  saveChatHistory,  // ← Add this import
  fetchSimilarTodos,
  fetchAllTodos,
  fetchTodosInDateRange,
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

    const history = await fetchChatHistory(user_id);
    const now = new Date();

    // Check if query mentions dates/days
    const hasDateQuery = /today|yesterday|this week|last week|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|this|last|next/i.test(query);

    let similarTodos;
    let dateFilterApplied = "";

    if (hasDateQuery) {
      // Ask AI to parse the date query
      const dateParseMessages = [
        {
          role: "system",
          content: `You are a date parser. Current date and time: ${now.toISOString()}.
Current day of week: ${now.toLocaleDateString('en-US', { weekday: 'long' })}

Extract the date range from the user's query. Respond ONLY with a JSON object:
{
  "needsDateFilter": true/false,
  "startDate": "ISO date string",
  "endDate": "ISO date string",
  "description": "human readable description"
}

IMPORTANT RULES:
- "today" = current date (start: 00:00:00, end: 23:59:59)
- "yesterday" = previous date
- "this Monday/Tuesday/etc" = the most recent occurrence of that day (could be today or in the past week)
- "last Monday/Tuesday/etc" = the Monday/Tuesday from the previous week
- "this week" = current week (Monday to Sunday)
- "last week" = previous week (Monday to Sunday)
- Use UTC timezone for all dates
- Set startDate to 00:00:00 and endDate to 23:59:59

Examples with current date ${now.toISOString()}:
- "tasks from today" -> {"needsDateFilter": true, "startDate": "${now.toISOString().split('T')[0]}T00:00:00Z", "endDate": "${now.toISOString().split('T')[0]}T23:59:59Z", "description": "today"}
- "tasks I added yesterday" -> calculate yesterday's date
- "tasks from this Wednesday" -> find the most recent Wednesday (including today if today is Wednesday)
- "show all my tasks" -> {"needsDateFilter": false}`
        },
        {
          role: "user",
          content: query
        }
      ];

      const dateParseResult = await callOpenAI(dateParseMessages);
      const cleanJson = dateParseResult.replace(/```json\n?|\n?```/g, '').trim();
      const dateInfo = JSON.parse(cleanJson);

      if (dateInfo.needsDateFilter) {
        similarTodos = await fetchTodosInDateRange(user_id, dateInfo.startDate, dateInfo.endDate);
        dateFilterApplied = `\n[FILTERED: Tasks created on ${dateInfo.description}]`;
      } else {
        similarTodos = await fetchAllTodos(user_id);
      }
    } else {
      // Check for metadata queries
      const needsAllTasks = /all tasks|show me everything/i.test(query);
      
      if (needsAllTasks) {
        similarTodos = await fetchAllTodos(user_id);
      } else {
        const queryEmbedding = await generateEmbedding(query);
        similarTodos = await fetchSimilarTodos(queryEmbedding, user_id);
      }
    }

    const todoIds = similarTodos.map((t: any) => t.id);
    const contextMap = await fetchExistingContexts(todoIds, user_id);
    const { total, completed, pending } = await fetchTodoStats(user_id);

    const completedList = similarTodos.filter((t: any) => t.is_completed);
    const pendingList = similarTodos.filter((t: any) => !t.is_completed);

    const currentDateTime = now.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const formatTodo = (t: any, idx: number) => {
      const createdDate = new Date(t.created_at);
      const dayName = createdDate.toLocaleString('en-US', { weekday: 'long' });
      const dateStr = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const notes = t.notes ? ` | Notes: ${t.notes}` : "";
      
      return `${idx + 1}. "${t.title}" | Created: ${dayName}, ${dateStr} at ${timeStr}${notes}`;
    };

    const contextData = `
CURRENT: ${currentDateTime}
STATS: Total=${total} | Completed=${completed} | Pending=${pending}${dateFilterApplied}

COMPLETED (${completedList.length}):
${completedList.length > 0 ? completedList.map((t: any, i: number) => formatTodo(t, i)).join("\n") : "No completed tasks"}

PENDING (${pendingList.length}):
${pendingList.length > 0 ? pendingList.map((t: any, i: number) => formatTodo(t, i)).join("\n") : "No pending tasks"}`;

    const messages = [
      {
        role: "system",
        content: `You are a Todo Assistant.

RULES:
1. If you see [FILTERED: ...], those are the ONLY tasks from that date/period. Be specific about the count.
2. Only reference tasks actually shown in the sections
3. Be concise and accurate
4. Current time: ${currentDateTime}

Loaded: ${similarTodos.length} tasks${dateFilterApplied ? ' (filtered by date)' : ` out of ${total} total`}`
      }
    ];

    history.forEach((turn: any) => {
      messages.push({ role: "user", content: turn.query });
      messages.push({ role: "assistant", content: turn.response });
    });

    messages.push({ role: "user", content: `${contextData}\n\nQ: ${query}` });

    const aiResponse = await callOpenAI(messages);

    // ← SAVE CHAT HISTORY TO DATABASE
    await saveChatHistory(user_id, query, aiResponse);

    await updateTodoContexts(similarTodos, query, contextMap, user_id, total, completed, pending);

    return jsonResponse({ reply: aiResponse });

  } catch (err: any) {
    console.error("Error in todo-chat:", err);
    return jsonResponse({ reply: "Something went wrong. Please try again." }, 500);
  }
});