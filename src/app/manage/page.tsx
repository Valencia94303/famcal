"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PointsSection, RewardsSection, SettingsSection, TasksSection, ShoppingSection, HabitsSection, ScheduleSection, AuditLogSection } from "@/components/manage";
import { ManageHome, SectionType } from "@/components/manage/ManageHome";
import { AvatarPicker } from "@/components/manage/AvatarPicker";
import { MealsSection } from "@/components/manage/MealsSection";
import { PinGate } from "@/components/auth/PinGate";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, CreditCard, Smartphone, ArrowLeft, Home } from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  avatar: string | null;
  avatarType: string;
  color: string;
  role: string;
  birthday: string | null;
  nfcCardId: string | null;
}

interface Chore {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  points: number;
  priority: string;
  recurrence: string | null;
  recurDays: string | null;
  assignees: FamilyMember[];
  isCompleted: boolean;
}

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
];

const DAYS = [
  { id: "MON", label: "Mon" },
  { id: "TUE", label: "Tue" },
  { id: "WED", label: "Wed" },
  { id: "THU", label: "Thu" },
  { id: "FRI", label: "Fri" },
  { id: "SAT", label: "Sat" },
  { id: "SUN", label: "Sun" },
];

export default function ManagePage() {
  const [activeSection, setActiveSection] = useState<SectionType | "home">("home");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRedemptions, setPendingRedemptions] = useState(0);

  // Summary data for home cards
  const [summaryData, setSummaryData] = useState({
    familyCount: 0,
    choreCount: 0,
    choresToday: 0,
    taskCount: 0,
    habitCount: 0,
    shoppingCount: 0,
    mealPlanWeek: 1,
    rewardCount: 0,
    pendingRedemptions: 0,
    auditCount: 0,
  });

  // Family form state
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberColor, setMemberColor] = useState(COLORS[0]);
  const [memberRole, setMemberRole] = useState("CHILD");
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);
  const [memberAvatarType, setMemberAvatarType] = useState<"emoji" | "library" | "custom">("emoji");
  const [memberBirthday, setMemberBirthday] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [qrMember, setQrMember] = useState<FamilyMember | null>(null);
  const [nfcMember, setNfcMember] = useState<FamilyMember | null>(null);
  const [nfcCardInput, setNfcCardInput] = useState("");
  const [posQrMember, setPosQrMember] = useState<FamilyMember | null>(null);

  // Chore form state
  const [showChoreForm, setShowChoreForm] = useState(false);
  const [choreTitle, setChoreTitle] = useState("");
  const [choreDescription, setChoreDescription] = useState("");
  const [chorePoints, setChorePoints] = useState(0);
  const [choreRecurrence, setChoreRecurrence] = useState("");
  const [choreRecurDays, setChoreRecurDays] = useState<string[]>([]);
  const [choreAssignees, setChoreAssignees] = useState<string[]>([]);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, choresRes, redemptionsRes, tasksRes, habitsRes, shoppingRes, rewardsRes] = await Promise.all([
        fetch("/api/family"),
        fetch("/api/chores?all=true"),
        fetch("/api/rewards/redemptions?status=PENDING"),
        fetch("/api/tasks"),
        fetch("/api/habits"),
        fetch("/api/shopping"),
        fetch("/api/rewards"),
      ]);
      const membersData = await membersRes.json();
      const choresData = await choresRes.json();
      const redemptionsData = await redemptionsRes.json();
      const tasksData = await tasksRes.json();
      const habitsData = await habitsRes.json();
      const shoppingData = await shoppingRes.json();
      const rewardsData = await rewardsRes.json();

      setMembers(membersData.members || []);
      setChores(choresData.chores || []);
      setPendingRedemptions(redemptionsData.pendingCount || 0);

      // Calculate summary data
      const allChores = choresData.chores || [];
      const todayChores = allChores.filter((c: Chore) => !c.isCompleted);
      const pendingTasks = (tasksData.tasks || []).filter((t: { isCompleted: boolean }) => !t.isCompleted);
      const shoppingItems = (shoppingData.items || []).filter((i: { isPurchased: boolean }) => !i.isPurchased);

      // Get current meal plan week (1-4 based on week of month)
      const weekOfMonth = Math.ceil(new Date().getDate() / 7);
      const mealPlanWeek = ((weekOfMonth - 1) % 4) + 1;

      setSummaryData({
        familyCount: membersData.members?.length || 0,
        choreCount: allChores.length,
        choresToday: todayChores.length,
        taskCount: pendingTasks.length,
        habitCount: habitsData.habits?.length || 0,
        shoppingCount: shoppingItems.length,
        mealPlanWeek,
        rewardCount: rewardsData.rewards?.length || 0,
        pendingRedemptions: redemptionsData.pendingCount || 0,
        auditCount: 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Family member functions
  const handleSaveMember = async () => {
    if (!memberName.trim()) return;

    try {
      const memberData = {
        name: memberName,
        color: memberColor,
        role: memberRole,
        avatar: memberAvatar || memberName[0].toUpperCase(),
        avatarType: memberAvatarType,
        birthday: memberBirthday ? new Date(memberBirthday).toISOString() : null,
      };

      if (editingMember) {
        await fetch(`/api/family/${editingMember.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberData),
        });
      } else {
        await fetch("/api/family", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberData),
        });
      }
      resetMemberForm();
      fetchData();
    } catch (error) {
      console.error("Error saving member:", error);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Delete this family member?")) return;
    try {
      await fetch(`/api/family/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  const editMember = (member: FamilyMember) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberColor(member.color);
    setMemberRole(member.role);
    setMemberAvatar(member.avatar);
    setMemberAvatarType(member.avatarType as "emoji" | "library" | "custom");
    setMemberBirthday(member.birthday ? member.birthday.split("T")[0] : "");
    setShowMemberForm(true);
  };

  const resetMemberForm = () => {
    setShowMemberForm(false);
    setEditingMember(null);
    setMemberName("");
    setMemberColor(COLORS[0]);
    setMemberRole("CHILD");
    setMemberAvatar(null);
    setMemberAvatarType("emoji");
    setMemberBirthday("");
    setShowAvatarPicker(false);
  };

  const handleAvatarSelect = (avatar: string, type: "emoji" | "library" | "custom") => {
    setMemberAvatar(avatar);
    setMemberAvatarType(type);
    setShowAvatarPicker(false);
  };

  const handleRegisterNfcCard = async () => {
    if (!nfcMember || !nfcCardInput.trim()) return;
    try {
      const res = await fetch(`/api/member/card/${nfcCardInput.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: nfcMember.id }),
      });
      if (res.ok) {
        alert(`Card registered to ${nfcMember.name}!`);
        setNfcMember(null);
        setNfcCardInput("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to register card");
      }
    } catch (error) {
      console.error("Error registering card:", error);
    }
  };

  const handleUnregisterNfcCard = async (member: FamilyMember) => {
    if (!member.nfcCardId) return;
    if (!confirm(`Remove NFC card from ${member.name}?`)) return;
    try {
      await fetch(`/api/member/card/${member.nfcCardId}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error unregistering card:", error);
    }
  };

  // Chore functions
  const handleSaveChore = async () => {
    if (!choreTitle.trim()) return;

    try {
      const choreData = {
        title: choreTitle,
        description: choreDescription || null,
        points: chorePoints,
        recurrence: choreRecurrence || null,
        recurDays: choreRecurDays.length > 0 ? choreRecurDays : null,
        assigneeIds: choreAssignees,
      };

      if (editingChore) {
        await fetch(`/api/chores/${editingChore.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(choreData),
        });
      } else {
        await fetch("/api/chores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(choreData),
        });
      }
      resetChoreForm();
      fetchData();
    } catch (error) {
      console.error("Error saving chore:", error);
    }
  };

  const handleDeleteChore = async (id: string) => {
    if (!confirm("Delete this chore?")) return;
    try {
      await fetch(`/api/chores/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting chore:", error);
    }
  };

  const handleCompleteChore = async (choreId: string, completedById: string) => {
    try {
      await fetch(`/api/chores/${choreId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedById }),
      });
      fetchData();
    } catch (error) {
      console.error("Error completing chore:", error);
    }
  };

  const handleUncompleteChore = async (choreId: string) => {
    try {
      await fetch(`/api/chores/${choreId}/complete`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error uncompleting chore:", error);
    }
  };

  const editChore = (chore: Chore) => {
    setEditingChore(chore);
    setChoreTitle(chore.title);
    setChoreDescription(chore.description || "");
    setChorePoints(chore.points);
    setChoreRecurrence(chore.recurrence || "");
    setChoreRecurDays(chore.recurDays ? JSON.parse(chore.recurDays) : []);
    setChoreAssignees(chore.assignees.map((a) => a.id));
    setShowChoreForm(true);
  };

  const resetChoreForm = () => {
    setShowChoreForm(false);
    setEditingChore(null);
    setChoreTitle("");
    setChoreDescription("");
    setChorePoints(0);
    setChoreRecurrence("");
    setChoreRecurDays([]);
    setChoreAssignees([]);
  };

  const toggleRecurDay = (day: string) => {
    setChoreRecurDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleAssignee = (id: string) => {
    setChoreAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const getSectionTitle = (section: SectionType): string => {
    const titles: Record<SectionType, string> = {
      family: "Family Members",
      chores: "Chores",
      tasks: "Tasks",
      habits: "Habits",
      shopping: "Shopping List",
      meals: "Meal Planning",
      schedule: "Schedule",
      rewards: "Rewards",
      points: "Points",
      audit: "Audit Log",
      settings: "Settings",
    };
    return titles[section] || section;
  };

  return (
    <PinGate>
    <div className="fixed inset-0 bg-gradient-to-br from-slate-100 to-slate-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeSection !== "home" && (
              <button
                onClick={() => setActiveSection("home")}
                className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            <h1 className="text-xl font-bold text-slate-800">
              {activeSection === "home" ? "FamCal Admin" : getSectionTitle(activeSection)}
            </h1>
          </div>
          <a
            href="/"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Home View */}
            {activeSection === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ManageHome
                  onSelectSection={(section) => setActiveSection(section)}
                  summaryData={summaryData}
                />
              </motion.div>
            )}

            {/* Family Tab */}
            {activeSection === "family" && (
              <motion.div
                key="family"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">
                      Family Members ({members.length})
                    </h2>
                    <button
                      onClick={() => setShowMemberForm(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium min-h-[44px] active:scale-95 transition-transform"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Member Form */}
                  <AnimatePresence>
                    {showMemberForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-4 bg-slate-50 rounded-xl"
                      >
                        <h3 className="font-semibold text-slate-700 mb-4">
                          {editingMember ? "Edit Member" : "New Member"}
                        </h3>
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Name"
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base min-h-[48px]"
                          />
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                              Color
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {COLORS.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setMemberColor(color)}
                                  className={`w-10 h-10 rounded-full transition-transform ${
                                    memberColor === color
                                      ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                                      : ""
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                              Role
                            </label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setMemberRole("PARENT")}
                                className={`flex-1 px-4 py-3 rounded-xl font-medium min-h-[48px] transition-colors ${
                                  memberRole === "PARENT"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                Parent
                              </button>
                              <button
                                onClick={() => setMemberRole("CHILD")}
                                className={`flex-1 px-4 py-3 rounded-xl font-medium min-h-[48px] transition-colors ${
                                  memberRole === "CHILD"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                Child
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                              Avatar
                            </label>
                            <button
                              onClick={() => setShowAvatarPicker(true)}
                              className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full"
                            >
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                                style={{ backgroundColor: memberColor + "30" }}
                              >
                                {memberAvatarType === "custom" && memberAvatar ? (
                                  <img
                                    src={memberAvatar}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  memberAvatar || memberName?.[0]?.toUpperCase() || "?"
                                )}
                              </div>
                              <span className="text-slate-600">
                                {memberAvatar ? "Change Avatar" : "Choose Avatar"}
                              </span>
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                              Birthday (optional)
                            </label>
                            <input
                              type="date"
                              value={memberBirthday}
                              onChange={(e) => setMemberBirthday(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base min-h-[48px]"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveMember}
                              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium min-h-[48px] active:scale-95 transition-transform"
                            >
                              Save
                            </button>
                            <button
                              onClick={resetMemberForm}
                              className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium min-h-[48px] active:scale-95 transition-transform"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Members List */}
                  <div className="space-y-3">
                    {members.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">
                        No family members yet. Add your first member!
                      </p>
                    ) : (
                      members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {member.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {member.role === "PARENT" ? "Parent" : "Child"}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              if (member.nfcCardId) {
                                handleUnregisterNfcCard(member);
                              } else {
                                setNfcMember(member);
                                setNfcCardInput("");
                              }
                            }}
                            className={`p-2 rounded-lg min-h-[40px] ${
                              member.nfcCardId
                                ? "text-green-600 hover:bg-green-50"
                                : "text-slate-400 hover:bg-slate-100"
                            }`}
                            title={member.nfcCardId ? "Card registered (click to remove)" : "Register NFC Card"}
                          >
                            <CreditCard className="w-5 h-5" />
                          </button>
                          {member.nfcCardId && (
                            <button
                              onClick={() => setPosQrMember(member)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg min-h-[40px]"
                              title="Show POS QR Code"
                            >
                              <Smartphone className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => setQrMember(member)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg min-h-[40px]"
                            title="Show QR Code"
                          >
                            <QrCode className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => editMember(member)}
                            className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-lg min-h-[40px]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg min-h-[40px]"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Chores Tab */}
            {activeSection === "chores" && (
              <motion.div
                key="chores"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">
                      Chores ({chores.length})
                    </h2>
                    <button
                      onClick={() => setShowChoreForm(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium min-h-[44px] active:scale-95 transition-transform"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Chore Form */}
                  <AnimatePresence>
                    {showChoreForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-4 bg-slate-50 rounded-xl"
                      >
                        <h3 className="font-semibold text-slate-700 mb-4">
                          {editingChore ? "Edit Chore" : "New Chore"}
                        </h3>
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Chore title"
                            value={choreTitle}
                            onChange={(e) => setChoreTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base min-h-[48px]"
                          />
                          <textarea
                            placeholder="Description (optional)"
                            value={choreDescription}
                            onChange={(e) => setChoreDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 min-h-[80px]"
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-600 mb-2">
                                Points
                              </label>
                              <input
                                type="number"
                                value={chorePoints}
                                onChange={(e) =>
                                  setChorePoints(parseInt(e.target.value) || 0)
                                }
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 min-h-[48px]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-600 mb-2">
                                Recurrence
                              </label>
                              <select
                                value={choreRecurrence}
                                onChange={(e) => setChoreRecurrence(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 min-h-[48px] bg-white"
                              >
                                <option value="">One-time</option>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="CUSTOM">Custom</option>
                              </select>
                            </div>
                          </div>

                          {(choreRecurrence === "WEEKLY" ||
                            choreRecurrence === "CUSTOM") && (
                            <div>
                              <label className="block text-sm font-medium text-slate-600 mb-2">
                                Days
                              </label>
                              <div className="flex gap-1 flex-wrap">
                                {DAYS.map((day) => (
                                  <button
                                    key={day.id}
                                    onClick={() => toggleRecurDay(day.id)}
                                    className={`px-3 py-2 rounded-lg font-medium text-sm min-h-[40px] transition-colors ${
                                      choreRecurDays.includes(day.id)
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {day.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">
                              Assign to
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {members.map((member) => (
                                <button
                                  key={member.id}
                                  onClick={() => toggleAssignee(member.id)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl min-h-[44px] transition-all ${
                                    choreAssignees.includes(member.id)
                                      ? "ring-2 ring-indigo-500 bg-indigo-50"
                                      : "bg-slate-100"
                                  }`}
                                >
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: member.color }}
                                  >
                                    {member.avatar}
                                  </div>
                                  <span className="text-sm font-medium">
                                    {member.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                            {members.length === 0 && (
                              <p className="text-sm text-slate-500 mt-2">
                                Add family members first.
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveChore}
                              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium min-h-[48px] active:scale-95 transition-transform"
                            >
                              Save
                            </button>
                            <button
                              onClick={resetChoreForm}
                              className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium min-h-[48px] active:scale-95 transition-transform"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Chores List */}
                  <div className="space-y-3">
                    {chores.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">
                        No chores yet. Add your first chore!
                      </p>
                    ) : (
                      chores.map((chore) => (
                        <div
                          key={chore.id}
                          className={`p-4 bg-slate-50 rounded-xl transition-opacity ${
                            chore.isCompleted ? "opacity-60" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() =>
                                chore.isCompleted
                                  ? handleUncompleteChore(chore.id)
                                  : chore.assignees[0] &&
                                    handleCompleteChore(
                                      chore.id,
                                      chore.assignees[0].id
                                    )
                              }
                              className={`mt-1 w-7 h-7 rounded-lg border-2 flex items-center justify-center min-w-[28px] transition-colors ${
                                chore.isCompleted
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-slate-300 hover:border-green-500"
                              }`}
                            >
                              {chore.isCompleted && (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-semibold text-slate-800 ${
                                  chore.isCompleted ? "line-through" : ""
                                }`}
                              >
                                {chore.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {chore.points > 0 && (
                                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                                    {chore.points} pts
                                  </span>
                                )}
                                {chore.recurrence && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {chore.recurrence.toLowerCase()}
                                  </span>
                                )}
                              </div>
                              {chore.assignees.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {chore.assignees.map((assignee) => (
                                    <div
                                      key={assignee.id}
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{ backgroundColor: assignee.color }}
                                      title={assignee.name}
                                    >
                                      {assignee.avatar}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => editChore(chore)}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-200 rounded-lg text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteChore(chore.id)}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tasks Tab */}
            {activeSection === "tasks" && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <TasksSection onDataChange={fetchData} />
              </motion.div>
            )}

            {/* Habits Tab */}
            {activeSection === "habits" && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <HabitsSection members={members} onDataChange={fetchData} />
              </motion.div>
            )}

            {/* Shopping Tab */}
            {activeSection === "shopping" && (
              <motion.div
                key="shopping"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ShoppingSection onDataChange={fetchData} />
              </motion.div>
            )}

            {/* Meals Tab */}
            {activeSection === "meals" && (
              <motion.div
                key="meals"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <MealsSection />
              </motion.div>
            )}

            {/* Schedule Tab */}
            {activeSection === "schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ScheduleSection onDataChange={fetchData} />
              </motion.div>
            )}

            {/* Rewards Tab */}
            {activeSection === "rewards" && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <RewardsSection onDataChange={fetchData} />
              </motion.div>
            )}

            {/* Points Tab */}
            {activeSection === "points" && (
              <motion.div
                key="points"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <PointsSection members={members} onDataChange={fetchData} />
              </motion.div>
            )}

            {/* Audit Tab */}
            {activeSection === "audit" && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <AuditLogSection />
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeSection === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <SettingsSection />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <AvatarPicker
          memberId={editingMember?.id || "new"}
          currentAvatar={memberAvatar}
          currentType={memberAvatarType}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

      {/* QR Code Modal */}
      {qrMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {qrMember.name}&apos;s Portal
              </h3>
              <button
                onClick={() => setQrMember(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/member/${qrMember.name.toLowerCase()}`}
                size={200}
                level="M"
                includeMargin
              />
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Scan this code to open {qrMember.name}&apos;s personal portal
            </p>

            <div className="bg-slate-100 rounded-lg p-3 text-sm text-slate-700 break-all">
              {typeof window !== "undefined" ? window.location.origin : ""}/member/{qrMember.name.toLowerCase()}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/member/${qrMember.name.toLowerCase()}`
                );
                alert("Link copied!");
              }}
              className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl font-medium"
            >
              Copy Link
            </button>
          </motion.div>
        </div>
      )}

      {/* NFC Card Registration Modal */}
      {nfcMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Register NFC Card
              </h3>
              <button
                onClick={() => setNfcMember(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-2"
                style={{ backgroundColor: nfcMember.color }}
              >
                {nfcMember.avatar}
              </div>
              <p className="font-semibold text-slate-800">{nfcMember.name}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Card ID
                </label>
                <input
                  type="text"
                  value={nfcCardInput}
                  onChange={(e) => setNfcCardInput(e.target.value)}
                  placeholder="Scan card or enter ID..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">
                  Scan the NFC card with your phone, or manually enter the card ID
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>POS URL:</strong> After registering, program the NFC card to open:
                </p>
                <code className="block mt-2 text-xs bg-white rounded p-2 break-all">
                  {typeof window !== "undefined" ? window.location.origin : ""}/pos?card=CARD_ID
                </code>
              </div>

              <button
                onClick={handleRegisterNfcCard}
                disabled={!nfcCardInput.trim()}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                Register Card
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* POS QR Code Modal */}
      {posQrMember && posQrMember.nfcCardId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {posQrMember.name}&apos;s POS Card
              </h3>
              <button
                onClick={() => setPosQrMember(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block mb-4 border-2 border-purple-200">
              <QRCodeSVG
                value={`http://192.168.1.47:3000/pos?card=${posQrMember.nfcCardId}`}
                size={200}
                level="M"
                includeMargin
              />
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Scan this code to open {posQrMember.name}&apos;s Point of Sale
            </p>

            <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-700 break-all mb-4">
              http://192.168.1.47:3000/pos?card={posQrMember.nfcCardId}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `http://192.168.1.47:3000/pos?card=${posQrMember.nfcCardId}`
                  );
                  alert("Link copied!");
                }}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium"
              >
                Copy Link
              </button>
              <a
                href={`/qr-codes/${posQrMember.name.toLowerCase()}-pos-qr.png`}
                download={`${posQrMember.name.toLowerCase()}-pos-qr.png`}
                className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium text-center"
              >
                Download PNG
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </PinGate>
  );
}
