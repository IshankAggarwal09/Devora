import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  fetchProjectTasks,
  createTask,
  updateTask,
  optimisticMoveTask,
  revertMoveTask,
  setFilters,
  resetFilters,
} from '../store/taskSlice';
import KanbanColumn from '../components/KanbanColumn';
import TaskCard from '../components/TaskCard';
import api from '../services/api';
import {
  Kanban,
  Filter,
  ArrowLeft,
  X,
  Users,
  AlertCircle,
  RefreshCw,
  FolderKanban,
} from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To Do', indicatorColor: 'bg-muted' },
  { id: 'in-progress', title: 'In Progress', indicatorColor: 'bg-signal' },
  { id: 'done', title: 'Done', indicatorColor: 'bg-verdict-green' },
  { id: 'blocked', title: 'Blocked', indicatorColor: 'bg-verdict-red' },
];

const KanbanBoard = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();

  const { tasks, isLoading, isCreating, error, filters } = useSelector(
    (state) => state.tasks
  );

  const [project, setProject] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  // Configure DnD Sensors (requiring a 5px drag distance to avoid accidental clicks)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch project details (for member list in assignee filter)
  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await api.get(`/projects/${projectId}`);
        setProject(response.data);
      } catch (err) {
        console.warn('Could not fetch project details:', err);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  // Fetch tasks when projectId or filters change
  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectTasks({ projectId, filters }));
    }
  }, [dispatch, projectId, filters]);

  // Filter tasks locally based on assignee & priority selectors
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filter by assignee
      if (filters.assignee) {
        const selectedAssignees = filters.assignee.split(',').filter(Boolean);
        if (selectedAssignees.length > 0) {
          const taskAssigneeId = task.assignedTo?._id || task.assignedTo || 'unassigned';
          if (!selectedAssignees.includes(taskAssigneeId)) {
            return false;
          }
        }
      }

      // Filter by priority
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Group tasks into the four Kanban columns
  const tasksByColumn = useMemo(() => {
    const map = {
      todo: [],
      'in-progress': [],
      done: [],
      blocked: [],
    };

    filteredTasks.forEach((task) => {
      if (map[task.status]) {
        map[task.status].push(task);
      } else {
        map.todo.push(task);
      }
    });

    return map;
  }, [filteredTasks]);

  // ─── DnD Event Handlers ──────────────────────────────────────────────────────

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the current dragged task
    const currentTask = tasks.find((t) => t._id === activeId);
    if (!currentTask) return;

    // Determine target column ID:
    // `overId` can be a column container ID ('todo', 'in-progress', etc.)
    // or another task ID inside that column.
    let targetStatus = null;
    const isOverColumn = COLUMNS.some((col) => col.id === overId);

    if (isOverColumn) {
      targetStatus = overId;
    } else {
      const overTask = tasks.find((t) => t._id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (!targetStatus || targetStatus === currentTask.status) {
      return;
    }

    const previousStatus = currentTask.status;

    // 1. Optimistic UI update in Redux
    dispatch(optimisticMoveTask({ taskId: activeId, newStatus: targetStatus }));

    // 2. Persistent API call to PATCH /api/tasks/:taskId
    try {
      const resultAction = await dispatch(
        updateTask({ taskId: activeId, updates: { status: targetStatus } })
      );
      if (updateTask.rejected.match(resultAction)) {
        // Revert on failure
        dispatch(revertMoveTask({ taskId: activeId, previousStatus }));
      }
    } catch (err) {
      dispatch(revertMoveTask({ taskId: activeId, previousStatus }));
    }
  };

  // Mobile fallback status change handler
  const handleStatusChange = async (taskId, newStatus) => {
    const currentTask = tasks.find((t) => t._id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    const previousStatus = currentTask.status;
    dispatch(optimisticMoveTask({ taskId, newStatus }));

    try {
      const result = await dispatch(
        updateTask({ taskId, updates: { status: newStatus } })
      );
      if (updateTask.rejected.match(result)) {
        dispatch(revertMoveTask({ taskId, previousStatus }));
      }
    } catch {
      dispatch(revertMoveTask({ taskId, previousStatus }));
    }
  };

  // Add Task inline action
  const handleAddTask = async (taskData) => {
    await dispatch(createTask({ projectId, taskData }));
  };

  // Toggle assignee filter helper (multi-select)
  const toggleAssigneeFilter = (assigneeId) => {
    const currentList = filters.assignee ? filters.assignee.split(',').filter(Boolean) : [];
    let updated;
    if (currentList.includes(assigneeId)) {
      updated = currentList.filter((id) => id !== assigneeId);
    } else {
      updated = [...currentList, assigneeId];
    }
    dispatch(setFilters({ assignee: updated.join(',') }));
  };

  const projectMembers = project?.members || [];
  const selectedAssignees = filters.assignee ? filters.assignee.split(',').filter(Boolean) : [];
  const hasActiveFilters = Boolean(filters.assignee || filters.priority);

  return (
    <div className="min-h-screen bg-ink text-foreground flex flex-col">
      {/* ── Top Header & Breadcrumb Bar ── */}
      <header className="bg-surface border-b border-hairline px-4 sm:px-8 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors font-utility"
            >
              <ArrowLeft size={13} /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-signal" />
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight">
                {project?.name || 'Project'} — Kanban Board
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(fetchProjectTasks({ projectId, filters }))}
              title="Refresh board"
              className="p-2 bg-ink hover:bg-hairline border border-hairline rounded-sm text-muted hover:text-foreground transition-colors"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-signal' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Filters Toolbar ── */}
      <div className="bg-surface/60 border-b border-hairline px-4 sm:px-8 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted font-utility font-semibold uppercase tracking-wider">
              <Filter size={13} className="text-signal" />
              <span>Filters</span>
            </div>

            {/* Multi-Select Assignee Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-utility border transition-colors ${
                  selectedAssignees.length > 0
                    ? 'bg-signal/15 border-signal/40 text-signal font-semibold'
                    : 'bg-ink border-hairline text-muted hover:text-foreground'
                }`}
              >
                <Users size={13} />
                <span>
                  {selectedAssignees.length === 0
                    ? 'Assignee: All'
                    : `Assignee (${selectedAssignees.length})`}
                </span>
              </button>

              {isAssigneeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsAssigneeDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-1 w-56 bg-surface border border-hairline rounded-sm shadow-xl p-2 space-y-1 z-30 font-utility text-xs">
                    <button
                      type="button"
                      onClick={() => toggleAssigneeFilter('unassigned')}
                      className={`w-full text-left px-2 py-1.5 rounded-sm flex items-center justify-between transition-colors ${
                        selectedAssignees.includes('unassigned')
                          ? 'bg-signal/20 text-signal font-semibold'
                          : 'hover:bg-hairline text-foreground'
                      }`}
                    >
                      <span>Unassigned</span>
                      {selectedAssignees.includes('unassigned') && <span>✓</span>}
                    </button>

                    <div className="h-px bg-hairline/60 my-1" />

                    {projectMembers.map((m) => {
                      const memberId = m.user?._id || m.user;
                      const isSelected = selectedAssignees.includes(memberId);
                      return (
                        <button
                          key={memberId}
                          type="button"
                          onClick={() => toggleAssigneeFilter(memberId)}
                          className={`w-full text-left px-2 py-1.5 rounded-sm flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-signal/20 text-signal font-semibold'
                              : 'hover:bg-hairline text-foreground'
                          }`}
                        >
                          <span className="truncate">{m.user?.name || 'Member'}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Priority Selector */}
            <select
              value={filters.priority}
              onChange={(e) => dispatch(setFilters({ priority: e.target.value }))}
              className={`text-xs px-3 py-1.5 rounded-sm font-utility border focus:outline-none focus:border-signal transition-colors ${
                filters.priority
                  ? 'bg-signal/15 border-signal/40 text-signal font-semibold'
                  : 'bg-ink border-hairline text-muted hover:text-foreground'
              }`}
            >
              <option value="">Priority: All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                onClick={() => dispatch(resetFilters())}
                className="flex items-center gap-1 text-xs text-muted hover:text-signal transition-colors font-utility"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>

          <div className="text-xs text-muted font-utility">
            Showing <strong className="text-foreground">{filteredTasks.length}</strong> tasks
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4 w-full">
          <div className="bg-verdict-red/10 border border-verdict-red/25 p-3 rounded-sm text-verdict-red text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ── Main Kanban Columns Grid (Drag and Drop Context) ── */}
      <main className="flex-1 p-4 sm:p-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Responsive grid: stacks on mobile, 4 columns on lg screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={tasksByColumn[col.id] || []}
                  onAddTask={handleAddTask}
                  isAddingTask={isCreating}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>

            {/* Drag Overlay: Shows lifted card when dragging */}
            <DragOverlay dropAnimation={null}>
              {activeTask ? (
                <TaskCard task={activeTask} isOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>
    </div>
  );
};

export default KanbanBoard;
