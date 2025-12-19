"use client";

import { useState, useEffect, useRef } from "react";

interface AvatarPickerProps {
  memberId: string;
  currentAvatar: string | null;
  currentType: string;
  onSelect: (avatar: string, type: "emoji" | "library" | "custom") => void;
  onClose: () => void;
}

interface LibraryAvatar {
  id?: string;
  name: string;
  emoji?: string;
  imageUrl?: string;
}

type LibraryData = Record<string, LibraryAvatar[]>;

const COMMON_EMOJIS = [
  "😊", "😎", "🥰", "😇", "🤗", "😋", "🤓", "🧐",
  "😴", "🤔", "🙄", "😏", "😌", "🥳", "🤩", "😆",
  "😊", "😄", "😁", "😀", "🙂", "😉", "😍", "🥹",
];

export function AvatarPicker({
  memberId,
  currentAvatar,
  currentType,
  onSelect,
  onClose,
}: AvatarPickerProps) {
  const [activeTab, setActiveTab] = useState<"emoji" | "library" | "upload">(
    currentType === "custom" ? "upload" : currentType === "library" ? "library" : "emoji"
  );
  const [library, setLibrary] = useState<LibraryData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("animals");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const res = await fetch("/api/avatars/library");
      const data = await res.json();
      setLibrary(data.library || {});
      if (data.library) {
        setSelectedCategory(Object.keys(data.library)[0] || "animals");
      }
    } catch (error) {
      console.error("Error fetching avatar library:", error);
    }
    setIsLoading(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji, "emoji");
  };

  const handleLibrarySelect = (avatar: LibraryAvatar) => {
    const value = avatar.emoji || avatar.imageUrl || "";
    onSelect(value, avatar.emoji ? "emoji" : "library");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`/api/family/${memberId}/avatar`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onSelect(data.avatarUrl, "custom");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar");
    }

    setIsUploading(false);
    event.target.value = "";
  };

  const handleCustomEmojiSubmit = () => {
    if (customEmoji.trim()) {
      onSelect(customEmoji.trim(), "emoji");
      setCustomEmoji("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Choose Avatar</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { id: "emoji", label: "Emoji", icon: "😊" },
            { id: "library", label: "Library", icon: "📚" },
            { id: "upload", label: "Upload", icon: "📷" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-indigo-600 border-b-2 border-indigo-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Emoji Tab */}
              {activeTab === "emoji" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-8 gap-2">
                    {COMMON_EMOJIS.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiSelect(emoji)}
                        className={`p-2 text-2xl rounded-lg hover:bg-gray-100 transition-colors ${
                          currentAvatar === emoji && currentType === "emoji"
                            ? "bg-indigo-100 ring-2 ring-indigo-500"
                            : ""
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-2">Or enter your own emoji:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customEmoji}
                        onChange={(e) => setCustomEmoji(e.target.value)}
                        placeholder="Paste emoji here..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        maxLength={4}
                      />
                      <button
                        onClick={handleCustomEmojiSubmit}
                        disabled={!customEmoji.trim()}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Library Tab */}
              {activeTab === "library" && (
                <div className="space-y-4">
                  {/* Category selector */}
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(library).map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 text-sm rounded-full capitalize transition-colors ${
                          selectedCategory === category
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Avatar grid */}
                  <div className="grid grid-cols-6 gap-2">
                    {library[selectedCategory]?.map((avatar, index) => (
                      <button
                        key={avatar.id || index}
                        onClick={() => handleLibrarySelect(avatar)}
                        className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                          currentAvatar === (avatar.emoji || avatar.imageUrl)
                            ? "bg-indigo-100 ring-2 ring-indigo-500"
                            : ""
                        }`}
                        title={avatar.name}
                      >
                        {avatar.emoji ? (
                          <span className="text-2xl">{avatar.emoji}</span>
                        ) : avatar.imageUrl ? (
                          <img
                            src={avatar.imageUrl}
                            alt={avatar.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Tab */}
              {activeTab === "upload" && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors ${
                      isUploading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2" />
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">📷</div>
                        <p className="text-sm font-medium text-gray-700">
                          Click to upload a photo
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPEG, PNG, WebP, or GIF (max 5MB)
                        </p>
                      </>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />

                  {currentType === "custom" && currentAvatar && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Current custom avatar:</p>
                      <img
                        src={currentAvatar}
                        alt="Current avatar"
                        className="w-16 h-16 rounded-full object-cover mx-auto"
                      />
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500">
                      Uploaded images will be resized to 256x256 pixels and converted to WebP format for optimal display.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
