import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase-server";
import NavBar from "@/components/todo/NavBar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect if user is not authenticated
  if (!user) redirect("/signin");

  // Render the client layout with fetched user
  return <NavBar user={user}>{children}</NavBar>;
}
