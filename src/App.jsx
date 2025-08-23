import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";

const initialColumns = {
  todo: {
    name: "Planned🗒️",
    items: [
      { id: "1", title: "Assignment 1", description: "due date - 1aug" },
      { id: "2", title: "Assignment 2", description: "due date - 5aug" },
    ],
  },
  doing: { name: "Ongoing", items: [] },
  done: { name: "Finished!🎯", items: [] },
};

function App() {
  const [columns, setColumns] = useState(initialColumns);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [editingTask, setEditingTask] = useState(null); // { columnId, taskId }
  const [editingValues, setEditingValues] = useState({ title: "", description: "" });

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];

    const sourceItems = Array.from(sourceCol.items);
    const destItems = Array.from(destCol.items);

    const [movedItem] = sourceItems.splice(source.index, 1);
    destItems.splice(destination.index, 0, movedItem);

    setColumns({
      ...columns,
      [source.droppableId]: { ...sourceCol, items: sourceItems },
      [destination.droppableId]: { ...destCol, items: destItems },
    });
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    setColumns((prev) => ({
      ...prev,
      todo: {
        ...prev.todo,
        items: [...prev.todo.items, { ...newTask, id: Date.now().toString() }],
      },
    }));
    setNewTask({ title: "", description: "" });
    setShowModal(false);
  };

  const deleteTask = (columnId, taskId) => {
    setColumns((prevColumns) => {
      const column = prevColumns[columnId];
      const filteredItems = column.items.filter((item) => item.id !== taskId);
      return {
        ...prevColumns,
        [columnId]: { ...column, items: filteredItems },
      };
    });
  };

  const startEditing = (columnId, task) => {
    setEditingTask({ columnId, taskId: task.id });
    setEditingValues({ title: task.title, description: task.description });
  };

  const saveEditedTask = (columnId, taskId) => {
    setColumns((prevColumns) => {
      const column = prevColumns[columnId];
      const updatedItems = column.items.map((item) => {
        if (item.id === taskId) {
          return { ...item, ...editingValues };
        }
        return item;
      });
      return {
        ...prevColumns,
        [columnId]: { ...column, items: updatedItems },
      };
    });
    setEditingTask(null);
  };

  return (
    <div className="h-screen w-screen bg-purple-50 font-sans overflow-x-auto">
      <div className="relative">
        <header className="flex justify-between items-center bg-gray-700 text-white px-8 py-6 font-bold text-lg">
          <span className="text-3xl">TaskFlow</span>
          <div className="relative inline-block">
            <button
              onClick={() => setShowModal(true)}
              className="text-white font-semibold px-4 py-2 rounded hover:bg-gray-600 transition"
            >
              + ADD TASK
            </button>
            {showModal && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg p-6 flex flex-col space-y-4 z-50">
                <input
                  type="text"
                  placeholder="Project Name"
                  className="bg-gray-100 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Description"
                  className="bg-gray-100 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={addTask}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-purple-700 transition"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-gray-200 text-red-600 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex justify-center items-start gap-8 px-8 py-6 min-h-[calc(100vh-80px)]">
          {Object.entries(columns).map(([colId, col]) => (
            <Droppable droppableId={colId} key={colId}>
              {(provided, snapshot) => (
                <div
                  className="bg-gray-700 rounded-xl p-8 min-w-[360px] flex flex-col items-center"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <h2 className="text-white font-bold text-2xl mb-8">{col.name}</h2>
                  {col.items.map((item, idx) => (
                    <Draggable key={item.id} draggableId={item.id} index={idx}>
                      {(provided, snapshot) => (
                        <div
                          className={`bg-gray-600 rounded-lg p-6 mb-6 w-full max-w-[340px] text-white select-none relative flex flex-col ${
                            snapshot.isDragging ? "shadow-lg opacity-80" : ""
                          }`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col w-full">
                              {editingTask &&
                              editingTask.taskId === item.id &&
                              editingTask.columnId === colId ? (
                                <>
                                  <input
                                    className="mb-2 p-1 rounded bg-gray-300 text-black w-full"
                                    value={editingValues.title}
                                    onChange={(e) =>
                                      setEditingValues({ ...editingValues, title: e.target.value })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveEditedTask(colId, item.id);
                                    }}
                                    autoFocus
                                  />
                                  <input
                                    className="p-1 rounded bg-gray-300 text-black w-full"
                                    value={editingValues.description}
                                    onChange={(e) =>
                                      setEditingValues({ ...editingValues, description: e.target.value })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveEditedTask(colId, item.id);
                                    }}
                                  />
                                  <div className="flex space-x-2 mt-2">
                                    <button
                                      onClick={() => saveEditedTask(colId, item.id)}
                                      className="bg-purple-600 text-white px-3 py-1 rounded"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingTask(null)}
                                      className="bg-gray-400 text-white px-3 py-1 rounded"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <strong
                                    className="block mb-1 text-lg cursor-pointer"
                                    onClick={() => startEditing(colId, item)}
                                    title="Click to edit"
                                  >
                                    {item.title}
                                  </strong>
                                  <span
                                    className="text-gray-300 text-base cursor-pointer"
                                    onClick={() => startEditing(colId, item)}
                                    title="Click to edit"
                                  >
                                    {item.description}
                                  </span>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => deleteTask(colId, item.id)}
                              className="bg-gray-700 hover:bg-red-600 rounded-md p-1 flex items-center justify-center transition duration-200 ml-4"
                              aria-label="Delete task"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-red-300 hover:text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 7h12M9 7V6a3 3 0 116 0v1M9 7v10a2 2 0 002 2h2a2 2 0 002-2V7"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default App;
