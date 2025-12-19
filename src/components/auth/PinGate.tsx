"use client";

import { useState, useEffect, ReactNode } from "react";
import { PinEntry } from "./PinEntry";
import { PinSetup } from "./PinSetup";

interface PinGateProps {
  children: ReactNode;
}

interface PinStatus {
  enabled: boolean;
  configured: boolean;
  locked: boolean;
  lockoutRemaining: number;
}

export function PinGate({ children }: PinGateProps) {
  const [status, setStatus] = useState<PinStatus | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      // Check PIN status
      const statusRes = await fetch("/api/auth/pin/status");
      const statusData = await statusRes.json();
      setStatus(statusData);

      // If PIN is enabled, check if already authenticated
      if (statusData.enabled) {
        const authRes = await fetch("/api/auth/pin/verify");
        const authData = await authRes.json();
        setIsAuthenticated(authData.authenticated);
      } else {
        // No PIN required, allow access
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      // If error, assume not authenticated but still show UI
      setIsAuthenticated(false);
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
        setIsAuthenticated(true);
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
    setIsAuthenticated(true);
    setStatus((prev) => (prev ? { ...prev, enabled: true, configured: true } : null));
  };

  const handleSetupSkip = () => {
    // User skipped PIN setup, allow access
    setIsAuthenticated(true);
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

  // PIN is configured and enabled, but user is not authenticated
  if (status?.enabled && !isAuthenticated) {
    return (
      <PinEntry
        onSubmit={handlePinSubmit}
        error={error}
        locked={status.locked}
        lockoutRemaining={status.lockoutRemaining}
        isLoading={isVerifying}
        title="Enter PIN"
        subtitle="Enter your PIN to access settings"
      />
    );
  }

  // User is authenticated or PIN is not enabled
  return <>{children}</>;
}
