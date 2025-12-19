"use client";

import { useState, useEffect, useRef } from "react";

interface Backup {
  id: string;
  name: string;
  description: string | null;
  version: string;
  createdAt: string;
}

interface PhotoStats {
  totalPhotos: number;
  optimizedPhotos: number;
  unoptimizedPhotos: number;
  totalOriginalSizeFormatted: string;
  totalOptimizedSizeFormatted: string;
  savedBytesFormatted: string;
  savedPercent: number;
}

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
  weatherCity: string | null;
  // Photo Mode settings
  screensaverEnabled: boolean;
  screensaverPhotoPath: string;
  screensaverInterval: number;
}

export function SettingsSection() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Backup state
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [showBackupForm, setShowBackupForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [carouselInterval, setCarouselInterval] = useState(30);
  const [carouselAnimation, setCarouselAnimation] = useState("arrivingTogether");
  // Weather & Header state
  const [headerMode, setHeaderMode] = useState("clock");
  const [headerAlternateInterval, setHeaderAlternateInterval] = useState(30);
  const [weatherLat, setWeatherLat] = useState<string>("");
  const [weatherLon, setWeatherLon] = useState<string>("");
  const [weatherCity, setWeatherCity] = useState<string>("");
  // Photo Mode state
  const [screensaverEnabled, setScreensaverEnabled] = useState(false);
  const [screensaverPhotoPath, setScreensaverPhotoPath] = useState("/home/pi/famcal-photos");
  const [screensaverInterval, setScreensaverInterval] = useState(15);

  // Photo optimization state
  const [photoStats, setPhotoStats] = useState<PhotoStats | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // PIN authentication state
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinConfigured, setPinConfigured] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinLoading, setIsPinLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchBackups();
    fetchPhotoStats();
    fetchPinStatus();
  }, []);

  const fetchPinStatus = async () => {
    try {
      const res = await fetch("/api/auth/pin/status");
      const data = await res.json();
      setPinEnabled(data.enabled);
      setPinConfigured(data.configured);
    } catch (error) {
      console.error("Error fetching PIN status:", error);
    }
  };

  const handleSetupPin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError("PIN must be 4-6 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }

    setIsPinLoading(true);
    setPinError(null);

    try {
      const res = await fetch("/api/auth/pin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin, confirmPin }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "PIN set up successfully!" });
        setShowPinSetup(false);
        setNewPin("");
        setConfirmPin("");
        fetchPinStatus();
      } else {
        const data = await res.json();
        setPinError(data.error || "Failed to set up PIN");
      }
    } catch (error) {
      setPinError("Failed to set up PIN");
    }

    setIsPinLoading(false);
  };

  const handleChangePin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError("New PIN must be 4-6 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("New PINs do not match");
      return;
    }

    setIsPinLoading(true);
    setPinError(null);

    try {
      const res = await fetch("/api/auth/pin/change", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin, confirmPin }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "PIN changed successfully!" });
        setShowPinChange(false);
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        const data = await res.json();
        setPinError(data.error || "Failed to change PIN");
      }
    } catch (error) {
      setPinError("Failed to change PIN");
    }

    setIsPinLoading(false);
  };

  const handleDisablePin = async () => {
    if (!confirm("Are you sure you want to disable PIN protection?")) return;

    setIsPinLoading(true);
    setPinError(null);

    try {
      const res = await fetch("/api/auth/pin/change", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: currentPin }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "PIN protection disabled" });
        setShowPinChange(false);
        setCurrentPin("");
        fetchPinStatus();
      } else {
        const data = await res.json();
        setPinError(data.error || "Failed to disable PIN");
      }
    } catch (error) {
      setPinError("Failed to disable PIN");
    }

    setIsPinLoading(false);
  };

  const fetchPhotoStats = async () => {
    try {
      const res = await fetch("/api/photos/stats");
      const data = await res.json();
      setPhotoStats(data);
    } catch (error) {
      console.error("Error fetching photo stats:", error);
    }
  };

  const optimizePhotos = async () => {
    setIsOptimizing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/photos/optimize", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Optimized ${data.optimized} photos! Saved ${data.totalSavedFormatted}`,
        });
        fetchPhotoStats();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to optimize photos" });
      }
    } catch (error) {
      console.error("Error optimizing photos:", error);
      setMessage({ type: "error", text: "Failed to optimize photos" });
    }

    setIsOptimizing(false);
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error("Error fetching backups:", error);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    setMessage(null);

    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: backupName || undefined }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Backup created successfully!" });
        setBackupName("");
        setShowBackupForm(false);
        fetchBackups();
      } else {
        setMessage({ type: "error", text: "Failed to create backup" });
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      setMessage({ type: "error", text: "Failed to create backup" });
    }

    setIsCreatingBackup(false);
  };

  const downloadBackup = async (id?: string) => {
    try {
      const url = id ? `/api/backup/${id}` : "/api/backup/export";
      const res = await fetch(url);
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `famcal-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading backup:", error);
      setMessage({ type: "error", text: "Failed to download backup" });
    }
  };

  const deleteBackup = async (id: string) => {
    if (!confirm("Are you sure you want to delete this backup?")) return;

    try {
      const res = await fetch(`/api/backup/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Backup deleted" });
        fetchBackups();
      } else {
        setMessage({ type: "error", text: "Failed to delete backup" });
      }
    } catch (error) {
      console.error("Error deleting backup:", error);
      setMessage({ type: "error", text: "Failed to delete backup" });
    }
  };

  const handleRestoreFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm("Are you sure you want to restore from this backup? This will replace all current data!")) {
      event.target.value = "";
      return;
    }

    setIsRestoring(true);
    setMessage(null);

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData),
      });

      if (res.ok) {
        const result = await res.json();
        setMessage({
          type: "success",
          text: `Restored successfully! (${Object.entries(result.restored).map(([k, v]) => `${k}: ${v}`).join(", ")})`
        });
        fetchSettings();
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to restore backup" });
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      setMessage({ type: "error", text: "Failed to parse backup file" });
    }

    setIsRestoring(false);
    event.target.value = "";
  };

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
        setWeatherCity(data.settings.weatherCity || "");
        // Photo Mode settings
        setScreensaverEnabled(data.settings.screensaverEnabled || false);
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
          weatherCity: weatherCity || null,
          // Photo Mode settings
          screensaverEnabled,
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Sherwoods Manor"
                  value={weatherCity}
                  onChange={(e) => setWeatherCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coordinates
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Use Google Maps to find coordinates (right-click → copy coordinates)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                    <input
                      type="text"
                      placeholder="e.g., 38.0417"
                      value={weatherLat}
                      onChange={(e) => setWeatherLat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                    <input
                      type="text"
                      placeholder="e.g., -121.3641"
                      value={weatherLon}
                      onChange={(e) => setWeatherLon(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Mode Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Photo Mode</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enable Photo Mode
              </label>
              <p className="text-xs text-gray-500">
                Photos as background with mini dashboard in corner
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
              {/* How it works */}
              <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-indigo-800">📸 How Photo Mode Works</p>
                <ul className="text-xs text-indigo-700 space-y-1 list-disc list-inside">
                  <li>Photos display full-screen with Ken Burns effect</li>
                  <li>Mini dashboard shows in a random corner</li>
                  <li>Full dashboard appears at <span className="font-semibold">:25-:35</span> and <span className="font-semibold">:55-:05</span> each hour</li>
                  <li>Dashboard interruptions only between <span className="font-semibold">6 AM - Midnight</span></li>
                  <li>Outside those hours: photos only (no interruptions)</li>
                </ul>
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
                  Photos will cycle every{" "}
                  <span className="font-bold text-indigo-600">{screensaverInterval} seconds</span>
                  {" "}with the full dashboard appearing for 10 minutes around each half-hour (6 AM - Midnight).
                </p>
              </div>

              <hr className="border-gray-100" />

              {/* Photo Optimization */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Photo Optimization</p>
                    <p className="text-xs text-gray-500">
                      Resize and compress photos for faster loading
                    </p>
                  </div>
                  <button
                    onClick={optimizePhotos}
                    disabled={isOptimizing || (photoStats?.unoptimizedPhotos === 0)}
                    className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isOptimizing ? "Optimizing..." : "Optimize Now"}
                  </button>
                </div>

                {photoStats && (
                  <div className="bg-green-50 rounded-xl p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total Photos</p>
                        <p className="font-semibold text-gray-800">{photoStats.totalPhotos}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Optimized</p>
                        <p className="font-semibold text-green-600">
                          {photoStats.optimizedPhotos} / {photoStats.totalPhotos}
                        </p>
                      </div>
                    </div>
                    {photoStats.optimizedPhotos > 0 && (
                      <div className="pt-2 border-t border-green-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Space Saved</span>
                          <span className="font-semibold text-green-600">
                            {photoStats.savedBytesFormatted} ({photoStats.savedPercent}%)
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Original: {photoStats.totalOriginalSizeFormatted}</span>
                          <span>Optimized: {photoStats.totalOptimizedSizeFormatted}</span>
                        </div>
                      </div>
                    )}
                    {photoStats.unoptimizedPhotos > 0 && (
                      <p className="text-xs text-amber-600 pt-2">
                        {photoStats.unoptimizedPhotos} photos waiting to be optimized
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* PIN Security */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Security</h3>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">PIN Protection</p>
              <p className="text-xs text-gray-500">
                {pinConfigured ? "PIN is set up" : "Protect settings with a PIN"}
              </p>
            </div>
            {!pinConfigured ? (
              <button
                onClick={() => setShowPinSetup(true)}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors"
              >
                Set Up PIN
              </button>
            ) : (
              <button
                onClick={() => setShowPinChange(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Manage
              </button>
            )}
          </div>

          {/* PIN Setup Form */}
          {showPinSetup && (
            <div className="p-4 bg-indigo-50 rounded-xl space-y-4">
              <p className="text-sm text-indigo-800 font-medium">Create a 4-6 digit PIN</p>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {pinError && <p className="text-sm text-red-500">{pinError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSetupPin}
                  disabled={isPinLoading}
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {isPinLoading ? "..." : "Set PIN"}
                </button>
                <button
                  onClick={() => {
                    setShowPinSetup(false);
                    setNewPin("");
                    setConfirmPin("");
                    setPinError(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* PIN Change Form */}
          {showPinChange && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <p className="text-sm text-gray-700 font-medium">Change or disable PIN</p>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Current PIN"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="New PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Confirm New PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {pinError && <p className="text-sm text-red-500">{pinError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleChangePin}
                  disabled={isPinLoading}
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {isPinLoading ? "..." : "Change PIN"}
                </button>
                <button
                  onClick={handleDisablePin}
                  disabled={isPinLoading || !currentPin}
                  className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                >
                  Disable
                </button>
                <button
                  onClick={() => {
                    setShowPinChange(false);
                    setCurrentPin("");
                    setNewPin("");
                    setConfirmPin("");
                    setPinError(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {pinConfigured && !showPinChange && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-700">
                PIN protection is active. You will need to enter your PIN to access settings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Backup & Restore</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick Export */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Quick Export</p>
              <p className="text-xs text-gray-500">Download current state as JSON file</p>
            </div>
            <button
              onClick={() => downloadBackup()}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors"
            >
              Export
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Create Backup */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Saved Backups</p>
                <p className="text-xs text-gray-500">Create and manage named backups</p>
              </div>
              <button
                onClick={() => setShowBackupForm(!showBackupForm)}
                className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-colors"
              >
                {showBackupForm ? "Cancel" : "New Backup"}
              </button>
            </div>

            {showBackupForm && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Backup name (optional)"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={createBackup}
                  disabled={isCreatingBackup}
                  className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {isCreatingBackup ? "..." : "Save"}
                </button>
              </div>
            )}

            {/* Backup List */}
            {backups.length > 0 ? (
              <div className="space-y-2">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {backup.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(backup.createdAt).toLocaleDateString()} at{" "}
                        {new Date(backup.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => downloadBackup(backup.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteBackup(backup.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No saved backups yet
              </p>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Restore from File */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Restore from File</p>
              <p className="text-xs text-gray-500">Upload a backup JSON to restore</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="px-4 py-2 bg-amber-100 text-amber-700 font-medium rounded-lg hover:bg-amber-200 disabled:opacity-50 transition-colors"
            >
              {isRestoring ? "Restoring..." : "Restore"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              <span className="font-medium">Warning:</span> Restoring a backup will replace all current data including family members, chores, rewards, and settings.
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
