import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, X, Loader2 } from 'lucide-react';
import TaskCard from './TaskCard';

export const KanbanColumn = ({
  column,
  tasks,
  onAddTask,
  isAddingTask,
  onStatusChange,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onAddTask({
      title: title.trim(),
      priority,
      status: column.id,
    });

    setTitle('');
    setPriority('medium');
    setIsFormOpen(false);
  };

  const taskIds = tasks.map((t) => t._id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-surface/50 border rounded-sm transition-colors duration-200 min-h-[500px] w-full ${
        isOver
          ? 'border-signal bg-surface/80 ring-1 ring-signal/30'
          : 'border-hairline'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-hairline flex items-center justify-between shrink-0 bg-surface/80">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.indicatorColor || 'bg-signal'}`} />
          <h3 className="font-display font-bold text-sm tracking-wide text-foreground">
            {column.title}
          </h3>
        </div>
        <span className="text-xs font-utility px-2 py-0.5 rounded-full bg-ink border border-hairline/80 text-muted">
          {tasks.length}
        </span>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isFormOpen && (
          <div className="h-28 border border-dashed border-hairline/60 rounded-sm flex items-center justify-center text-xs text-muted/60 font-utility">
            Drop tasks here
          </div>
        )}
      </div>

      {/* Column Footer: Inline Add Task Form / Button */}
      <div className="p-3 border-t border-hairline/60 shrink-0 bg-surface/40">
        {isFormOpen ? (
          <form onSubmit={handleFormSubmit} className="space-y-3 bg-ink p-3 rounded-sm border border-hairline">
            <textarea
              autoFocus
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              className="w-full bg-surface border border-hairline rounded-sm p-2 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-signal font-utility resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e);
                }
              }}
            />

            <div className="flex items-center justify-between gap-2">
              {/* Priority Selector */}
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="bg-surface text-foreground text-xs border border-hairline rounded-sm px-2 py-1 focus:outline-none focus:border-signal font-utility"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setTitle('');
                  }}
                  className="p-1.5 text-muted hover:text-foreground transition-colors rounded-sm hover:bg-surface"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || isAddingTask}
                  className="px-3 py-1 bg-signal text-ink font-semibold text-xs rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1"
                >
                  {isAddingTask ? <Loader2 size={12} className="animate-spin" /> : null}
                  Add
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface border border-dashed border-hairline rounded-sm transition-colors"
          >
            <Plus size={14} className="text-signal" />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
