"use client";

import { motion } from "framer-motion";

export type TabType = "family" | "chores" | "rewards" | "points" | "settings";

interface MobileNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingRedemptions?: number;
}

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: "family", label: "Family", icon: "users" },
  { id: "chores", label: "Chores", icon: "clipboard" },
  { id: "rewards", label: "Rewards", icon: "gift" },
  { id: "points", label: "Points", icon: "star" },
  { id: "settings", label: "Settings", icon: "cog" },
];

function TabIcon({ icon, isActive }: { icon: string; isActive: boolean }) {
  const color = isActive ? "text-indigo-600" : "text-slate-400";

  switch (icon) {
    case "users":
      return (
        <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      );
    case "clipboard":
      return (
        <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case "gift":
      return (
        <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      );
    case "star":
      return (
        <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case "cog":
      return (
        <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export function MobileNav({ activeTab, onTabChange, pendingRedemptions = 0 }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex flex-col items-center justify-center w-full h-full min-h-[48px] touch-manipulation"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-x-2 top-1 bottom-1 bg-indigo-50 rounded-xl"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <TabIcon icon={tab.icon} isActive={activeTab === tab.id} />
              <span
                className={`text-xs mt-1 font-medium ${
                  activeTab === tab.id ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                {tab.label}
              </span>
            </div>
            {/* Badge for pending redemptions */}
            {tab.id === "points" && pendingRedemptions > 0 && (
              <span className="absolute top-1 right-1/4 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {pendingRedemptions > 9 ? "9+" : pendingRedemptions}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
