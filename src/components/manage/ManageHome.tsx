"use client";

import { motion } from "framer-motion";
import {
  Users,
  ClipboardCheck,
  CheckCircle2,
  Target,
  ShoppingCart,
  UtensilsCrossed,
  Calendar,
  Gift,
  Star,
  Shield,
  Settings,
  LucideIcon,
} from "lucide-react";

export type SectionType =
  | "family"
  | "chores"
  | "tasks"
  | "habits"
  | "shopping"
  | "meals"
  | "schedule"
  | "rewards"
  | "points"
  | "audit"
  | "settings";

interface SectionCard {
  id: SectionType;
  label: string;
  Icon: LucideIcon;
  color: string;
  bgColor: string;
}

interface ManageHomeProps {
  onSelectSection: (section: SectionType) => void;
  summaryData: {
    familyCount: number;
    choreCount: number;
    choresToday: number;
    taskCount: number;
    habitCount: number;
    shoppingCount: number;
    mealPlanWeek: number;
    rewardCount: number;
    pendingRedemptions: number;
    auditCount: number;
  };
}

const sections: SectionCard[] = [
  {
    id: "family",
    label: "Family",
    Icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "chores",
    label: "Chores",
    Icon: ClipboardCheck,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "tasks",
    label: "Tasks",
    Icon: CheckCircle2,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "habits",
    label: "Habits",
    Icon: Target,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    id: "shopping",
    label: "Shopping",
    Icon: ShoppingCart,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    id: "meals",
    label: "Meals",
    Icon: UtensilsCrossed,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    id: "schedule",
    label: "Schedule",
    Icon: Calendar,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  {
    id: "rewards",
    label: "Rewards",
    Icon: Gift,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    id: "points",
    label: "Points",
    Icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    id: "audit",
    label: "Audit Log",
    Icon: Shield,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  {
    id: "settings",
    label: "Settings",
    Icon: Settings,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
];

export function ManageHome({ onSelectSection, summaryData }: ManageHomeProps) {
  const getSummaryText = (id: SectionType): string | null => {
    switch (id) {
      case "family":
        return `${summaryData.familyCount} member${summaryData.familyCount !== 1 ? "s" : ""}`;
      case "chores":
        return summaryData.choresToday > 0
          ? `${summaryData.choresToday} due today`
          : `${summaryData.choreCount} total`;
      case "tasks":
        return summaryData.taskCount > 0
          ? `${summaryData.taskCount} pending`
          : "All done!";
      case "habits":
        return `${summaryData.habitCount} tracked`;
      case "shopping":
        return summaryData.shoppingCount > 0
          ? `${summaryData.shoppingCount} items`
          : "List empty";
      case "meals":
        return `Week ${summaryData.mealPlanWeek}`;
      case "rewards":
        return summaryData.pendingRedemptions > 0
          ? `${summaryData.pendingRedemptions} pending`
          : `${summaryData.rewardCount} available`;
      case "audit":
        return "View history";
      case "settings":
        return "Configure";
      default:
        return null;
    }
  };

  const hasBadge = (id: SectionType): number => {
    if (id === "rewards" && summaryData.pendingRedemptions > 0) {
      return summaryData.pendingRedemptions;
    }
    return 0;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {sections.map((section, index) => {
        const badge = hasBadge(section.id);
        const summary = getSummaryText(section.id);

        return (
          <motion.button
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectSection(section.id)}
            className={`relative p-5 rounded-2xl ${section.bgColor} hover:shadow-lg transition-all active:scale-95 text-left`}
          >
            {/* Badge */}
            {badge > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                {badge > 9 ? "9+" : badge}
              </span>
            )}

            {/* Icon */}
            <div className={`${section.color} mb-3`}>
              <section.Icon className="w-7 h-7" />
            </div>

            {/* Label */}
            <h3 className="font-semibold text-slate-800 text-lg">
              {section.label}
            </h3>

            {/* Summary */}
            {summary && (
              <p className="text-sm text-slate-500 mt-1">{summary}</p>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
