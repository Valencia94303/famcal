"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
}

interface PhotosSectionProps {
  onDataChange?: () => void;
}

export function PhotosSection({ onDataChange }: PhotosSectionProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");

  const fetchPhotos = async () => {
    try {
      const res = await fetch("/api/photos");
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleAddPhoto = async () => {
    if (!newUrl.trim()) return;
    try {
      await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl,
          caption: newCaption || null,
        }),
      });
      setNewUrl("");
      setNewCaption("");
      setShowAddForm(false);
      fetchPhotos();
      onDataChange?.();
    } catch (error) {
      console.error("Error adding photo:", error);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Delete this photo?")) return;
    try {
      await fetch(`/api/photos/${id}`, { method: "DELETE" });
      fetchPhotos();
      onDataChange?.();
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Family Photos ({photos.length})
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium min-h-[44px] active:scale-95 transition-transform"
          >
            + Add
          </button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-slate-50 rounded-xl"
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base min-h-[48px]"
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Tip: Use Google Photos sharing links or any public image URL
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base min-h-[48px]"
                />
                {newUrl && (
                  <div className="bg-slate-100 rounded-xl p-2">
                    <p className="text-xs text-slate-500 mb-2">Preview:</p>
                    <img
                      src={newUrl}
                      alt="Preview"
                      className="max-h-32 rounded-lg mx-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddPhoto}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium min-h-[48px]"
                  >
                    Add Photo
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewUrl("");
                      setNewCaption("");
                    }}
                    className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium min-h-[48px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No photos yet. Add family photos to display on the dashboard!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                layout
                className="relative group"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || "Family photo"}
                  className="w-full h-32 object-cover rounded-xl"
                />
                {photo.caption && (
                  <p className="text-xs text-slate-600 mt-1 truncate">
                    {photo.caption}
                  </p>
                )}
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
