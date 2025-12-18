"use client";

import { useState, useEffect } from "react";

interface Settings {
  carouselInterval: number;
  carouselAnimation: string;
  displayName: string;
  theme: string;
}

export function SettingsSection() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [carouselInterval, setCarouselInterval] = useState(30);
  const [carouselAnimation, setCarouselAnimation] = useState("arrivingTogether");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setCarouselInterval(data.settings.carouselInterval);
        setCarouselAnimation(data.settings.carouselAnimation || "arrivingTogether");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
    setIsLoading(false);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carouselInterval, carouselAnimation }),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setMessage({ type: "success", text: "Settings saved!" });
      } else {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings" });
    }

    setIsSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const intervalOptions = [
    { value: 10, label: "10 seconds" },
    { value: 15, label: "15 seconds" },
    { value: 20, label: "20 seconds" },
    { value: 30, label: "30 seconds" },
    { value: 45, label: "45 seconds" },
    { value: 60, label: "1 minute" },
    { value: 120, label: "2 minutes" },
    { value: 300, label: "5 minutes" },
  ];

  const animationOptions = [
    {
      value: "arrivingTogether",
      label: "Arriving Together",
      description: "Widgets arrive from opposite sides with playful wiggles",
      icon: "🤝",
    },
    {
      value: "racingFriends",
      label: "Racing Friends",
      description: "Both race in from the same side - one stops first!",
      icon: "🏃",
    },
    {
      value: "bouncyBall",
      label: "Bouncy Ball",
      description: "Widgets drop from above and bounce like a ball!",
      icon: "🏀",
    },
    {
      value: "peekaBoo",
      label: "Peek-a-Boo",
      description: "Widgets pop out from tiny to big - BOO!",
      icon: "👀",
    },
    {
      value: "airplaneLanding",
      label: "Airplane Landing",
      description: "Widgets swoop in from the sky like airplanes",
      icon: "✈️",
    },
    {
      value: "sillySpin",
      label: "Silly Spin",
      description: "Widgets spin in while growing - so dizzy!",
      icon: "🌀",
    },
    {
      value: "trampolineJump",
      label: "Trampoline Jump",
      description: "Widgets bounce up from below like on a trampoline!",
      icon: "🤸",
    },
    {
      value: "crashAndRecover",
      label: "Crash & Recover",
      description: "Widgets crash in the middle, crumple up, then pop back!",
      icon: "💥",
    },
    {
      value: "cycle",
      label: "Surprise Me!",
      description: "Cycles through all animations every 5 minutes",
      icon: "🎲",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-white font-medium ${
            message.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Dashboard Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Dashboard Display</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Carousel Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Rotation Interval
            </label>
            <p className="text-xs text-gray-500 mb-2">
              How often the dashboard carousel rotates to show different widgets
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {intervalOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCarouselInterval(option.value)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    carouselInterval === option.value
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Animation Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Animation Style
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Choose how widgets animate when rotating
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {animationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCarouselAnimation(option.value)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    carouselAnimation === option.value
                      ? "bg-indigo-500 text-white ring-2 ring-indigo-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className={`text-xs truncate ${
                        carouselAnimation === option.value ? "text-indigo-100" : "text-gray-500"
                      }`}>
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Current setting:</span> Widgets will rotate every{" "}
              <span className="font-bold text-indigo-600">
                {carouselInterval < 60
                  ? `${carouselInterval} seconds`
                  : `${carouselInterval / 60} minute${carouselInterval > 60 ? "s" : ""}`}
              </span>
              {" "}with{" "}
              <span className="font-bold text-indigo-600">
                {animationOptions.find(o => o.value === carouselAnimation)?.label || "Arriving Together"}
              </span>
              {" "}animation
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveSettings}
        disabled={isSaving}
        className="w-full py-4 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 active:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
