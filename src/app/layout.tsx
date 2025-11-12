// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "My Todo App",
  description: "A simple todo app with Supabase and Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
