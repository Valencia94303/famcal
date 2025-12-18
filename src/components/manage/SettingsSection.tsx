"use client";

import { useState, useEffect } from "react";

interface Settings {
  carouselInterval: number;
  carouselAnimation: string;
  displayName: string;
  theme: string;
  // Weather & Header settings
  headerMode: string;
  headerAlternateInterval: number;
  weatherLat: number | null;
  weatherLon: number | null;
  // Screensaver settings
  screensaverEnabled: boolean;
  screensaverStartHour: number;
  screensaverEndHour: number;
  screensaverPhotoPath: string;
  screensaverInterval: number;
}

export function SettingsSection() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [carouselInterval, setCarouselInterval] = useState(30);
  const [carouselAnimation, setCarouselAnimation] = useState("arrivingTogether");
  // Weather & Header state
  const [headerMode, setHeaderMode] = useState("clock");
  const [headerAlternateInterval, setHeaderAlternateInterval] = useState(30);
  const [weatherLat, setWeatherLat] = useState<string>("");
  const [weatherLon, setWeatherLon] = useState<string>("");
  // Screensaver state
  const [screensaverEnabled, setScreensaverEnabled] = useState(false);
  const [screensaverStartHour, setScreensaverStartHour] = useState(18);
  const [screensaverEndHour, setScreensaverEndHour] = useState(23);
  const [screensaverPhotoPath, setScreensaverPhotoPath] = useState("/home/pi/famcal-photos");
  const [screensaverInterval, setScreensaverInterval] = useState(15);

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
        // Weather & Header settings
        setHeaderMode(data.settings.headerMode || "clock");
        setHeaderAlternateInterval(data.settings.headerAlternateInterval || 30);
        setWeatherLat(data.settings.weatherLat?.toString() || "");
        setWeatherLon(data.settings.weatherLon?.toString() || "");
        // Screensaver settings
        setScreensaverEnabled(data.settings.screensaverEnabled || false);
        setScreensaverStartHour(data.settings.screensaverStartHour ?? 18);
        setScreensaverEndHour(data.settings.screensaverEndHour ?? 23);
        setScreensaverPhotoPath(data.settings.screensaverPhotoPath || "/home/pi/famcal-photos");
        setScreensaverInterval(data.settings.screensaverInterval ?? 15);
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
        body: JSON.stringify({
          carouselInterval,
          carouselAnimation,
          // Weather & Header settings
          headerMode,
          headerAlternateInterval,
          weatherLat: weatherLat ? parseFloat(weatherLat) : null,
          weatherLon: weatherLon ? parseFloat(weatherLon) : null,
          // Screensaver settings
          screensaverEnabled,
          screensaverStartHour,
          screensaverEndHour,
          screensaverPhotoPath,
          screensaverInterval,
        }),
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
      value: "jellyWobble",
      label: "Jelly Wobble",
      description: "Widgets wobble in like wobbly jelly!",
      icon: "🍮",
    },
    {
      value: "rocketLaunch",
      label: "Rocket Launch",
      description: "Widgets blast off from below like rockets!",
      icon: "🚀",
    },
    {
      value: "swingIn",
      label: "Swing In",
      description: "Widgets swing in like a pendulum!",
      icon: "🎪",
    },
    {
      value: "tumbleIn",
      label: "Tumble In",
      description: "Widgets roll and tumble in from the sides!",
      icon: "🎲",
    },
    {
      value: "balloonFloat",
      label: "Balloon Float",
      description: "Widgets float up gently like balloons!",
      icon: "🎈",
    },
    {
      value: "cycle",
      label: "Surprise Me!",
      description: "Cycles through all animations every 5 minutes",
      icon: "🎰",
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

      {/* Header Display Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Header Display</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Header Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header Display Mode
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Show clock, weather, or alternate between them
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "clock", label: "Clock Only", icon: "🕐" },
                { value: "weather", label: "Weather Only", icon: "🌤️" },
                { value: "alternate", label: "Alternate", icon: "🔄" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setHeaderMode(option.value)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                    headerMode === option.value
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="text-xl">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alternate Interval */}
          {headerMode === "alternate" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Switch Interval
              </label>
              <p className="text-xs text-gray-500 mb-2">
                How often to switch between clock and weather
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={headerAlternateInterval}
                  onChange={(e) => setHeaderAlternateInterval(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-700 w-16">
                  {headerAlternateInterval}s
                </span>
              </div>
            </div>
          )}

          {/* Weather Location */}
          {(headerMode === "weather" || headerMode === "alternate") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weather Location
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Enter latitude and longitude for weather data (use Google Maps to find coordinates)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                  <input
                    type="text"
                    placeholder="e.g., 40.7128"
                    value={weatherLat}
                    onChange={(e) => setWeatherLat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g., -74.0060"
                    value={weatherLon}
                    onChange={(e) => setWeatherLon(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screensaver Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Photo Screensaver</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enable Screensaver
              </label>
              <p className="text-xs text-gray-500">
                Show photo slideshow during configured hours
              </p>
            </div>
            <button
              onClick={() => setScreensaverEnabled(!screensaverEnabled)}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                screensaverEnabled ? "bg-indigo-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  screensaverEnabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {screensaverEnabled && (
            <>
              {/* Active Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Hours
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Screensaver will activate during these hours
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Hour</label>
                    <select
                      value={screensaverStartHour}
                      onChange={(e) => setScreensaverStartHour(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Hour</label>
                    <select
                      value={screensaverEndHour}
                      onChange={(e) => setScreensaverEndHour(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Photo Folder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Folder Path
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Local folder containing photos (upload via SFTP)
                </p>
                <input
                  type="text"
                  value={screensaverPhotoPath}
                  onChange={(e) => setScreensaverPhotoPath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="/home/pi/famcal-photos"
                />
              </div>

              {/* Photo Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Duration
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  How long each photo is displayed
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={screensaverInterval}
                    onChange={(e) => setScreensaverInterval(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 w-16">
                    {screensaverInterval}s
                  </span>
                </div>
              </div>

              {/* Preview info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  Screensaver will be active from{" "}
                  <span className="font-bold text-indigo-600">
                    {screensaverStartHour === 0 ? "12 AM" : screensaverStartHour < 12 ? `${screensaverStartHour} AM` : screensaverStartHour === 12 ? "12 PM" : `${screensaverStartHour - 12} PM`}
                  </span>
                  {" "}to{" "}
                  <span className="font-bold text-indigo-600">
                    {screensaverEndHour === 0 ? "12 AM" : screensaverEndHour < 12 ? `${screensaverEndHour} AM` : screensaverEndHour === 12 ? "12 PM" : `${screensaverEndHour - 12} PM`}
                  </span>
                  , showing photos every{" "}
                  <span className="font-bold text-indigo-600">{screensaverInterval} seconds</span>.
                </p>
              </div>
            </>
          )}
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
