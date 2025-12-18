"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string | null;
  dueDate: string | null;
  startDate: string | null;
  scheduledDate: string | null;
  recurrence: string | null;
  notes: string | null;
  sourceFile: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface ParsedTask {
  title: string;
  completed: boolean;
  priority: string | null;
  dueDate: string | null;
  startDate: string | null;
  scheduledDate: string | null;
  recurrence: string | null;
}

interface TasksSectionProps {
  onDataChange?: () => void;
}

export function TasksSection({ onDataChange }: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add task form state
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState("");

  // Import state
  const [importPreview, setImportPreview] = useState<ParsedTask[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?showCompleted=${showCompleted}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [showCompleted]);

  const handleToggleComplete = async (task: Task) => {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      fetchTasks();
      onDataChange?.();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      fetchTasks();
      onDataChange?.();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          priority: newPriority || null,
          dueDate: newDueDate || null,
        }),
      });
      setNewTitle("");
      setNewPriority("");
      setNewDueDate("");
      setShowAddForm(false);
      fetchTasks();
      onDataChange?.();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const text = await file.text();

    try {
      const res = await fetch("/api/tasks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: text }),
      });
      const data = await res.json();
      setImportPreview(data.tasks || []);
      setShowImportModal(true);
    } catch (error) {
      console.error("Error parsing file:", error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportConfirm = async () => {
    setIsImporting(true);
    try {
      // Re-read and import
      const res = await fetch("/api/tasks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: importPreview
            .map((t) => {
              let line = `- [${t.completed ? "x" : " "}] ${t.title}`;
              if (t.priority === "HIGH") line += " ⏫";
              if (t.priority === "MEDIUM") line += " 🔼";
              if (t.priority === "LOW") line += " 🔽";
              if (t.dueDate) line += ` 📅 ${t.dueDate}`;
              if (t.startDate) line += ` 🛫 ${t.startDate}`;
              if (t.scheduledDate) line += ` ⏳ ${t.scheduledDate}`;
              if (t.recurrence) line += ` 🔁 ${t.recurrence}`;
              return line;
            })
            .join("\n"),
          save: true,
          sourceFile: importFileName,
        }),
      });
      const data = await res.json();
      if (data.imported) {
        setShowImportModal(false);
        setImportPreview([]);
        setImportFileName("");
        fetchTasks();
        onDataChange?.();
      }
    } catch (error) {
      console.error("Error importing tasks:", error);
    }
    setIsImporting(false);
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;
    const colors: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700",
      MEDIUM: "bg-yellow-100 text-yellow-700",
      LOW: "bg-blue-100 text-blue-700",
    };
    const icons: Record<string, string> = {
      HIGH: "⏫",
      MEDIUM: "🔼",
      LOW: "🔽",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[priority]}`}>
        {icons[priority]} {priority.toLowerCase()}
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Tasks ({tasks.filter((t) => !t.completed).length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium min-h-[44px] active:scale-95 transition-transform text-sm"
            >
              Import
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium min-h-[44px] active:scale-95 transition-transform"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

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
                <input
                  type="text"
                  placeholder="Task title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base min-h-[48px]"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white min-h-[44px]"
                    >
                      <option value="">None</option>
                      <option value="HIGH">High ⏫</option>
                      <option value="MEDIUM">Medium 🔼</option>
                      <option value="LOW">Low 🔽</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTask}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium min-h-[48px]"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTitle("");
                      setNewPriority("");
                      setNewDueDate("");
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

        {/* Tasks List */}
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No tasks yet. Add one or import from Obsidian!
            </p>
          ) : (
            tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 p-3 bg-slate-50 rounded-xl ${
                  task.completed ? "opacity-60" : ""
                }`}
              >
                <button
                  onClick={() => handleToggleComplete(task)}
                  className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    task.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-slate-300 hover:border-green-500"
                  }`}
                >
                  {task.completed && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-slate-800 ${task.completed ? "line-through" : ""}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {getPriorityBadge(task.priority)}
                    {task.dueDate && (
                      <span className="text-xs text-slate-500">
                        📅 {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.recurrence && (
                      <span className="text-xs text-slate-500">
                        🔁 {task.recurrence}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                >
                  Delete
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* Show completed toggle */}
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="w-full mt-4 py-2 text-slate-500 text-sm font-medium"
        >
          {showCompleted ? "Hide completed" : "Show completed"}
        </button>
      </div>

      {/* Import Preview Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Import Preview</h3>
                <p className="text-sm text-slate-500">{importFileName}</p>
              </div>
              <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
                {importPreview.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No tasks found in file</p>
                ) : (
                  importPreview.map((task, idx) => (
                    <div
                      key={idx}
                      className={`p-3 bg-slate-50 rounded-xl ${task.completed ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={task.completed ? "text-green-500" : "text-slate-300"}>
                          {task.completed ? "✓" : "○"}
                        </span>
                        <span className={`font-medium ${task.completed ? "line-through text-slate-500" : "text-slate-800"}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-6 flex-wrap">
                        {getPriorityBadge(task.priority)}
                        {task.dueDate && (
                          <span className="text-xs text-slate-500">📅 {task.dueDate}</span>
                        )}
                        {task.startDate && (
                          <span className="text-xs text-slate-500">🛫 {task.startDate}</span>
                        )}
                        {task.scheduledDate && (
                          <span className="text-xs text-slate-500">⏳ {task.scheduledDate}</span>
                        )}
                        {task.recurrence && (
                          <span className="text-xs text-slate-500">🔁 {task.recurrence}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-slate-200 flex gap-2">
                <button
                  onClick={handleImportConfirm}
                  disabled={importPreview.length === 0 || isImporting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {isImporting ? "Importing..." : `Import ${importPreview.length} tasks`}
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPreview([]);
                    setImportFileName("");
                  }}
                  className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
