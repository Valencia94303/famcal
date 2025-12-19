"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface PinSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function PinSetup({ onComplete, onSkip }: PinSetupProps) {
  const [step, setStep] = useState<"intro" | "enter" | "confirm">("intro");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDigitPress = useCallback((digit: string) => {
    const target = step === "enter" ? pin : confirmPin;
    const setter = step === "enter" ? setPin : setConfirmPin;

    if (target.length < 6 && !isLoading) {
      setter(target + digit);
      setError(null);
    }
  }, [step, pin, confirmPin, isLoading]);

  const handleBackspace = useCallback(() => {
    const setter = step === "enter" ? setPin : setConfirmPin;
    if (!isLoading) {
      setter((prev) => prev.slice(0, -1));
    }
  }, [step, isLoading]);

  const handleNext = useCallback(async () => {
    if (step === "enter") {
      if (pin.length < 4) {
        setError("PIN must be at least 4 digits");
        return;
      }
      setStep("confirm");
    } else if (step === "confirm") {
      if (confirmPin !== pin) {
        setError("PINs do not match");
        setConfirmPin("");
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/pin/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin, confirmPin }),
        });

        if (res.ok) {
          onComplete();
        } else {
          const data = await res.json();
          setError(data.error || "Failed to set up PIN");
        }
      } catch (error) {
        setError("Failed to set up PIN");
      }
      setIsLoading(false);
    }
  }, [step, pin, confirmPin, onComplete]);

  // Auto-advance when 4+ digits entered
  useEffect(() => {
    const current = step === "enter" ? pin : confirmPin;
    if (current.length >= 4 && current.length <= 6) {
      const timer = setTimeout(() => {
        if (current.length >= 4) {
          handleNext();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pin, confirmPin, step, handleNext]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === "intro") return;
      if (isLoading) return;

      if (e.key >= "0" && e.key <= "9") {
        handleDigitPress(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, handleDigitPress, handleBackspace, handleNext, isLoading]);

  const handleBack = () => {
    if (step === "confirm") {
      setConfirmPin("");
      setStep("enter");
      setError(null);
    }
  };

  const currentPin = step === "enter" ? pin : confirmPin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm"
      >
        {step === "intro" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Protect Your Settings</h1>
            <p className="text-gray-500 mb-8">
              Set up a PIN to prevent unauthorized access to the manage section.
              Only parents should know this PIN.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setStep("enter")}
                className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Set Up PIN
              </button>
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="w-full py-4 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                >
                  Skip for Now
                </button>
              )}
            </div>
          </motion.div>
        )}

        {(step === "enter" || step === "confirm") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">{step === "enter" ? "🔐" : "✅"}</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {step === "enter" ? "Create PIN" : "Confirm PIN"}
              </h1>
              <p className="text-gray-500 text-sm">
                {step === "enter"
                  ? "Enter a 4-6 digit PIN"
                  : "Enter your PIN again to confirm"}
              </p>
            </div>

            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 ${
                    i < currentPin.length
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300"
                  }`}
                  animate={i < currentPin.length ? { scale: [1, 1.2, 1] } : {}}
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

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigitPress(digit.toString())}
                  disabled={isLoading}
                  className="h-16 text-2xl font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleBack}
                disabled={step === "enter" || isLoading}
                className="h-16 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handleDigitPress("0")}
                disabled={isLoading}
                className="h-16 text-2xl font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                disabled={isLoading}
                className="h-16 text-2xl text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 transition-colors"
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
        )}
      </motion.div>
    </div>
  );
}
