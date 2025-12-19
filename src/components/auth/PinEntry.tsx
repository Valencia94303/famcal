"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface PinEntryProps {
  onSubmit: (pin: string) => Promise<void>;
  error?: string | null;
  locked?: boolean;
  lockoutRemaining?: number;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export function PinEntry({
  onSubmit,
  error,
  locked,
  lockoutRemaining = 0,
  isLoading,
  title = "Enter PIN",
  subtitle = "Enter your PIN to access settings",
}: PinEntryProps) {
  const [pin, setPin] = useState("");
  const [countdown, setCountdown] = useState(lockoutRemaining);

  // Update countdown timer
  useEffect(() => {
    if (lockoutRemaining > 0) {
      setCountdown(lockoutRemaining);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutRemaining]);

  const handleDigitPress = useCallback((digit: string) => {
    if (pin.length < 6 && !locked && !isLoading) {
      setPin((prev) => prev + digit);
    }
  }, [pin.length, locked, isLoading]);

  const handleBackspace = useCallback(() => {
    if (!locked && !isLoading) {
      setPin((prev) => prev.slice(0, -1));
    }
  }, [locked, isLoading]);

  const handleSubmit = useCallback(async (pinToSubmit: string) => {
    if (pinToSubmit.length >= 4 && !locked && !isLoading) {
      await onSubmit(pinToSubmit);
      setPin("");
    }
  }, [locked, isLoading, onSubmit]);

  // Auto-submit when 4 digits entered (capture pin value in closure)
  useEffect(() => {
    if (pin.length === 4) {
      const currentPin = pin; // Capture current value
      const timer = setTimeout(() => {
        handleSubmit(currentPin);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pin, handleSubmit]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (locked || isLoading) return;

      if (e.key >= "0" && e.key <= "9") {
        handleDigitPress(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter" && pin.length >= 4) {
        handleSubmit(pin);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigitPress, handleBackspace, handleSubmit, locked, isLoading, pin]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${
                i < pin.length
                  ? "bg-indigo-600 border-indigo-600"
                  : "border-gray-300"
              }`}
              animate={i < pin.length ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-center text-sm mb-4"
          >
            {error}
          </motion.div>
        )}

        {/* Lockout message */}
        {locked && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 text-center text-sm p-3 rounded-xl mb-4"
          >
            Too many attempts. Try again in {formatTime(countdown)}
          </motion.div>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigitPress(digit.toString())}
              disabled={locked || isLoading}
              className="h-16 text-2xl font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {digit}
            </button>
          ))}
          <div /> {/* Empty cell */}
          <button
            onClick={() => handleDigitPress("0")}
            disabled={locked || isLoading}
            className="h-16 text-2xl font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={locked || isLoading}
            className="h-16 text-2xl text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ⌫
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center mt-6">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
