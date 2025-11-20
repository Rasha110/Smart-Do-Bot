import { redirect } from "next/navigation";
import NavBar from "@/components/todo/NavBar";
import { getSupabaseAndUser } from "@/app/lib/auth-utils";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, error } = await getSupabaseAndUser();

  // Redirect if user is not authenticated
  if (!user || error) redirect("/signin");

  // Render the client layout with fetched user
  return <NavBar user={user}>{children}</NavBar>;
}
