import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, GripVertical, CheckCircle2 } from 'lucide-react';

const PRIORITY_CONFIG = {
  high: {
    color: 'bg-verdict-red',
    text: 'text-verdict-red',
    label: 'High',
  },
  medium: {
    color: 'bg-host-amber',
    text: 'text-host-amber',
    label: 'Medium',
  },
  low: {
    color: 'bg-verdict-green',
    text: 'text-verdict-green',
    label: 'Low',
  },
};

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
  { id: 'blocked', title: 'Blocked' },
];

export const TaskCard = ({
  task,
  isOverlay = false,
  onStatusChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityStyle = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  // Check if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-surface border border-hairline rounded-sm p-4 space-y-3 transition-shadow duration-150 ${
        isDragging
          ? 'opacity-40 border-signal/50 shadow-none'
          : 'hover:border-signal/50 hover:shadow-md'
      } ${isOverlay ? 'shadow-2xl border-signal bg-surface/95 rotate-1 cursor-grabbing' : ''}`}
    >
      {/* Top Header: Priority Dot & Drag Handle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${priorityStyle.color} shrink-0`}
            title={`Priority: ${priorityStyle.label}`}
          />
          <span className="text-[10px] font-utility font-semibold uppercase tracking-wider text-muted">
            {priorityStyle.label}
          </span>
        </div>

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag task card"
          className="text-muted/40 hover:text-foreground cursor-grab active:cursor-grabbing p-1 rounded-sm -mr-1 transition-colors"
        >
          <GripVertical size={14} />
        </button>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-foreground leading-snug break-words">
        {task.title}
      </h4>

      {/* Labels / Chips */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {task.labels.map((label, idx) => (
            <span
              key={idx}
              className="text-[10px] font-utility px-2 py-0.5 bg-ink border border-hairline/60 rounded-full text-muted tracking-wide"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Footer: Assignee, Due Date & Mobile "Move to..." */}
      <div className="pt-2 border-t border-hairline/60 flex items-center justify-between gap-2 text-xs">
        {/* Assignee Avatar + Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-ink border border-hairline/80 flex items-center justify-center shrink-0">
            {task.assignedTo?.avatarUrl ? (
              <img
                src={task.assignedTo.avatarUrl}
                alt={task.assignedTo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[9px] font-bold text-signal font-utility">
                {task.assignedTo?.name ? task.assignedTo.name.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
          <span className="text-xs text-muted truncate max-w-[100px] font-utility">
            {task.assignedTo?.name || 'Unassigned'}
          </span>
        </div>

        {/* Due Date Indicator */}
        {task.dueDate && (
          <span
            className={`flex items-center gap-1 text-[11px] font-utility ${
              isOverdue
                ? 'text-verdict-red font-semibold'
                : 'text-muted'
            }`}
            title={isOverdue ? 'Overdue' : 'Due date'}
          >
            <Calendar size={12} className={isOverdue ? 'text-verdict-red' : 'text-muted'} />
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>

      {/* Mobile-Friendly "Move to..." Fallback Selector */}
      <div className="md:hidden pt-2 border-t border-hairline/40 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted uppercase font-utility font-semibold">Move to:</span>
        <select
          value={task.status}
          onChange={(e) => onStatusChange && onStatusChange(task._id, e.target.value)}
          className="bg-ink border border-hairline text-foreground text-xs rounded-sm px-2 py-1 focus:outline-none focus:border-signal font-utility"
        >
          {COLUMNS.map((col) => (
            <option key={col.id} value={col.id}>
              {col.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TaskCard;
