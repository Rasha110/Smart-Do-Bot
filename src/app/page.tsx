"use client";
import { useRouter } from "next/navigation";
import Button from "../components/common/Button";
export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
      <h1 className="text-4xl font-bold mb-6">Welcome to My Todo App</h1>
      <p className="mb-6 text-gray-700">Organize your tasks efficiently and never forget anything!</p>
      <Button type="submit" variant="primary"  
      onClick={() => router.push("/signin")}
      >  Get Started
      </Button>
      
    </div>
  );
}