"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileNav, TabType, PointsSection, RewardsSection, SettingsSection, TasksSection, ShoppingSection, HabitsSection, ScheduleSection, PhotosSection } from "@/components/manage";

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: string;
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
  const [tab, setTab] = useState<TabType>("family");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRedemptions, setPendingRedemptions] = useState(0);

  // Family form state
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberColor, setMemberColor] = useState(COLORS[0]);
  const [memberRole, setMemberRole] = useState("CHILD");
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

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
      const [membersRes, choresRes, redemptionsRes] = await Promise.all([
        fetch("/api/family"),
        fetch("/api/chores?all=true"),
        fetch("/api/rewards/redemptions?status=PENDING"),
      ]);
      const membersData = await membersRes.json();
      const choresData = await choresRes.json();
      const redemptionsData = await redemptionsRes.json();
      setMembers(membersData.members || []);
      setChores(choresData.chores || []);
      setPendingRedemptions(redemptionsData.pendingCount || 0);
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
      if (editingMember) {
        await fetch(`/api/family/${editingMember.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: memberName,
            color: memberColor,
            role: memberRole,
            avatar: memberName[0].toUpperCase(),
          }),
        });
      } else {
        await fetch("/api/family", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: memberName,
            color: memberColor,
            role: memberRole,
          }),
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
    setShowMemberForm(true);
  };

  const resetMemberForm = () => {
    setShowMemberForm(false);
    setEditingMember(null);
    setMemberName("");
    setMemberColor(COLORS[0]);
    setMemberRole("CHILD");
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

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-100 to-slate-200 overflow-y-auto pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">FamCal Admin</h1>
          <a
            href="/"
            className="px-3 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm min-h-[40px] flex items-center"
          >
            ← Dashboard
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
            {/* Family Tab */}
            {tab === "family" && (
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
            {tab === "chores" && (
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
            {tab === "tasks" && (
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
            {tab === "habits" && (
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
            {tab === "shopping" && (
              <motion.div
                key="shopping"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ShoppingSection onDataChange={fetchData} />
              </motion.div>
            )}

            {/* Schedule Tab */}
            {tab === "schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ScheduleSection onDataChange={fetchData} />
              </motion.div>
            )}

            {/* Photos Tab */}
            {tab === "photos" && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <PhotosSection onDataChange={fetchData} />
              </motion.div>
            )}

            {/* Rewards Tab */}
            {tab === "rewards" && (
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
            {tab === "points" && (
              <motion.div
                key="points"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <PointsSection members={members} onDataChange={fetchData} />
              </motion.div>
            )}

            {/* Settings Tab */}
            {tab === "settings" && (
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

      {/* Bottom Navigation */}
      <MobileNav
        activeTab={tab}
        onTabChange={setTab}
        pendingRedemptions={pendingRedemptions}
      />
    </div>
  );
}
