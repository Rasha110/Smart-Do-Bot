import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "./supabase-server";

export async function updateSession(request: NextRequest) {
  // Use the reusable server client
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If unauthenticated and not on signin/signup → redirect to signin
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/") &&
    !request.nextUrl.pathname.startsWith("/")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // If authenticated and on signin/signup → redirect to dashboard
  if (
    user &&
    (request.nextUrl.pathname.startsWith("/signin") ||
      request.nextUrl.pathname.startsWith("/signup"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/todos";
    return NextResponse.redirect(url);
  }

  // Otherwise, continue request
  return NextResponse.next();
}
