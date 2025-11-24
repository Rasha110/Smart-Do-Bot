import "./globals.css";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";

export const metadata = {
  title: "My Todo App",
  description: "A simple todo app with Supabase and Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="bg-gray-50 text-gray-900">
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
