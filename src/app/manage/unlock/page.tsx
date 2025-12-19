"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PinEntry } from "@/components/auth/PinEntry";
import { PinSetup } from "@/components/auth/PinSetup";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PinStatus {
  enabled: boolean;
  configured: boolean;
  locked: boolean;
  lockoutRemaining: number;
}

function UnlockContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/manage";

  const [status, setStatus] = useState<PinStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    setIsLoading(true);
    try {
      // Check PIN status
      const statusRes = await fetch("/api/auth/pin/status");
      const statusData = await statusRes.json();
      setStatus(statusData);

      // If PIN is not enabled, redirect directly
      if (!statusData.enabled) {
        router.push(redirectTo);
        return;
      }

      // If already authenticated, redirect
      const authRes = await fetch("/api/auth/pin/verify");
      const authData = await authRes.json();
      if (authData.authenticated) {
        router.push(redirectTo);
        return;
      }
    } catch (error) {
      console.error("Error checking PIN status:", error);
    }
    setIsLoading(false);
  };

  const handlePinSubmit = async (pin: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok) {
        // Successfully authenticated, redirect
        router.push(redirectTo);
      } else {
        setError(data.error || "Invalid PIN");
        if (data.locked) {
          setStatus((prev) =>
            prev
              ? { ...prev, locked: true, lockoutRemaining: data.lockoutRemaining || 900 }
              : null
          );
        }
      }
    } catch (error) {
      setError("Failed to verify PIN");
    }

    setIsVerifying(false);
  };

  const handleSetupComplete = () => {
    router.push(redirectTo);
  };

  const handleSetupSkip = () => {
    router.push(redirectTo);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // PIN is enabled but not configured (first time setup)
  if (status?.enabled && !status.configured) {
    return <PinSetup onComplete={handleSetupComplete} onSkip={handleSetupSkip} />;
  }

  // PIN entry with back button
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700">
      {/* Back button */}
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <PinEntry
        onSubmit={handlePinSubmit}
        error={error}
        locked={status?.locked || false}
        lockoutRemaining={status?.lockoutRemaining || 0}
        isLoading={isVerifying}
        title="Enter PIN"
        subtitle="Enter your PIN to access settings"
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
}

export default function UnlockPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnlockContent />
    </Suspense>
  );
}
