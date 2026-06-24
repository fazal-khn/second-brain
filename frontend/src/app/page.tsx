"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary-violet/30 border-t-primary-violet rounded-full animate-spin" />
        <p className="text-sm text-neutral-400 font-medium">Loading...</p>
      </div>
    </div>
  );
}
