import React, { useState } from "react";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem.jsx";
import { v4 as uuidv4 } from "uuid";
import { useDroppable } from "@dnd-kit/core";

const COLUMN_COLORS = {
  todo: "bg-gray-500",
  inProgress: "bg-yellow-500",
  done: "bg-green-500",
};
const COLUMN_NAMES = {
  todo: "To Do",
  inProgress: "In Progress",
  done: "Done",
};

// Bin Dropzone
function BinDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "bin" });
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center mt-2 mb-2 mx-auto rounded-full w-24 h-24 bg-gray-300 ${
        isOver ? "bg-red-500 text-white scale-110" : "hover:bg-gray-400"
      } transition-all cursor-pointer`}
      style={{ fontSize: 45 }}
    >
      <span role="img" aria-label="Delete">🗑️</span>
    </div>
  );
}

export default function App() {
  const [columns, setColumns] = useState({
    todo: { name: COLUMN_NAMES.todo, items: [] },
    inProgress: { name: COLUMN_NAMES.inProgress, items: [] },
    done: { name: COLUMN_NAMES.done, items: [] },
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "Medium" });
  const [activeId, setActiveId] = useState(null);

  // Drag start
  const onDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Drag end
  const onDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    // Bin dropzone logic
    if (over.id === "bin") {
      handleDeleteTask(active.id);
      return;
    }

    // Move/reorder logic as usual
    const activeId = active.id;
    const overId = over.id;
    let fromColId = null;
    let fromIndex = -1;
    for (const colId in columns) {
      const idx = columns[colId].items.findIndex((task) => task.id === activeId);
      if (idx !== -1) {
        fromColId = colId;
        fromIndex = idx;
        break;
      }
    }

    let toColId = null;
    let toIndex = -1;
    if (columns[overId]) {
      toColId = overId;
      toIndex = columns[overId].items.length;
    } else {
      for (const colId in columns) {
        const idx = columns[colId].items.findIndex((task) => task.id === overId);
        if (idx !== -1) {
          toColId = colId;
          toIndex = idx;
          break;
        }
      }
    }

    if (!toColId || fromColId === null || fromIndex === -1) return;

    if (fromColId === toColId) {
      const newItems = arrayMove(columns[fromColId].items, fromIndex, toIndex);
      setColumns({
        ...columns,
        [fromColId]: { ...columns[fromColId], items: newItems },
      });
    } else {
      const fromItems = [...columns[fromColId].items];
      const [movedTask] = fromItems.splice(fromIndex, 1);
      const toItems = [...columns[toColId].items];
      toItems.splice(toIndex, 0, movedTask);
      setColumns({
        ...columns,
        [fromColId]: { ...columns[fromColId], items: fromItems },
        [toColId]: { ...columns[toColId], items: toItems },
      });
    }
  };

  const onDragCancel = () => {
    setActiveId(null);
  };

  function DroppableColumn({ id, children, className }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
      <div
        ref={setNodeRef}
        className={`${className} ${isOver ? "ring-2 ring-blue-500" : ""}`}
      >
        {children}
      </div>
    );
  }

  // Add Task handler
  const handleAddTask = () => {
    const { title, description, priority } = newTask;
    if (!title.trim() || !description.trim()) return;
    const task = {
      id: uuidv4(),
      title,
      description,
      priority,
    };
    setColumns((prev) => ({
      ...prev,
      todo: {
        ...prev.todo,
        items: [...prev.todo.items, task],
      },
    }));
    setNewTask({ title: "", description: "", priority: "Medium" });
    setIsModalOpen(false);
  };

  // Delete Task handler
  const handleDeleteTask = (taskId) => {
    setColumns((prevColumns) => {
      const updated = {};
      for (const colId in prevColumns) {
        updated[colId] = {
          ...prevColumns[colId],
          items: prevColumns[colId].items.filter((task) => task.id !== taskId),
        };
      }
      return { ...updated };
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-black";
      case "Low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-8 bg-gray-900">
        <h1 className="text-4xl font-extrabold text-white tracking-wide">TaskFlow</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          + Add Task
        </button>
      </div>
      {/* BIN */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <BinDropZone />
        {/* BOARD */}
        <div className="flex-1 flex gap-5 p-8 bg-gray-100 overflow-x-auto">
          {Object.entries(columns).map(([colId, col]) => (
            <DroppableColumn
              key={colId}
              id={colId}
              className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg p-4 min-w-[260px]"
            >
              <div className={`rounded-xl px-4 py-2 text-white font-bold text-lg mb-4 ${COLUMN_COLORS[colId]}`}>
                {col.name}
              </div>
              <SortableContext items={col.items.map((task) => task.id)} strategy={rectSortingStrategy}>
                <div className="flex-1 overflow-y-auto">
                  {col.items.map((task) => (
                    <SortableItem key={task.id} id={task.id}>
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 shadow flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{task.title}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{task.description}</p>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DroppableColumn>
          ))}
          <DragOverlay>
            {activeId ? (() => {
              let activeTask = null;
              for (const col of Object.values(columns)) {
                activeTask = col.items.find((item) => item.id === activeId);
                if (activeTask) break;
              }
              if (!activeTask) return null;
              return (
                <div className="bg-gray-50 rounded-lg p-3 shadow flex flex-col" style={{ width: 260 }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{activeTask.title}</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(
                        activeTask.priority
                      )}`}
                    >
                      {activeTask.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{activeTask.description}</p>
                </div>
              );
            })() : null}
          </DragOverlay>
        </div>
      </DndContext>
      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-[350px]">
            <h2 className="text-2xl font-bold mb-3">Add New Task</h2>
            {/* TITLE */}
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg"
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
              placeholder="Task title"
            />
            {/* DESCRIPTION */}
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg resize-none"
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
              placeholder="Task description"
            />
            {/* PRIORITY */}
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              className="w-full mb-5 px-3 py-2 border border-gray-300 rounded-lg"
              value={newTask.priority}
              onChange={(e) => setNewTask((t) => ({ ...t, priority: e.target.value }))}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            {/* BUTTONS */}
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200">
                Cancel
              </button>
              <button onClick={handleAddTask} className="px-4 py-2 rounded-lg bg-blue-600 text-white">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
