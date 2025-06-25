"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const exchangeSession = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.hash
      );

      if (error) {
        console.error("Error exchanging session:", error);
        toast.error("The link has expired or is invalid");
        router.push("/auth");
      } else {
        toast.success("Successfully signed in!");
        router.push("/dashboard");
      }
    };

    exchangeSession();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Validating your session...
    </div>
  );
}
