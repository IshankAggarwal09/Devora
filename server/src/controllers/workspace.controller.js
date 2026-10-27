import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import Sprint from '../models/sprint.model.js';
import User from '../models/user.model.js';

// ─── Project Controllers ──────────────────────────────────────────────────────

// POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { name, description, visibility, tags } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'owner',
        },
      ],
      status: 'active',
      visibility: visibility === 'public' ? 'public' : 'private',
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatarUrl')
      .populate('members.user', 'name email avatarUrl');

    res.status(201).json(populatedProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Server error creating project' });
  }
};

// GET /api/projects/mine
export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id,
    })
      .populate('owner', 'name email avatarUrl')
      .populate('members.user', 'name email avatarUrl')
      .sort({ updatedAt: -1 });

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching my projects:', error);
    res.status(500).json({ error: 'Server error fetching projects' });
  }
};

// POST /api/projects/:projectId/invite
export const inviteMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify current user has permission (owner or admin)
    const requester = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
      return res.status(403).json({ error: 'Only project owners and admins can invite members' });
    }

    const userToInvite = await User.findOne({ email: email.trim().toLowerCase() });
    if (!userToInvite) {
      return res.status(404).json({ error: `User with email "${email}" not found` });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userToInvite._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    project.members.push({
      user: userToInvite._id,
      role: 'member',
      joinedAt: new Date(),
    });

    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'name email avatarUrl')
      .populate('members.user', 'name email avatarUrl');

    res.status(200).json({
      message: 'User added to project successfully',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ error: 'Server error inviting member' });
  }
};

// ─── Task Controllers ─────────────────────────────────────────────────────────

// POST /api/projects/:projectId/tasks
export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, status, priority, dueDate, labels } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify current user is a member of the project
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: 'You must be a project member to create tasks' });
    }

    // Optional assignee validation
    let assigneeId = null;
    if (assignedTo) {
      const isAssigneeMember = project.members.some(
        (m) => m.user.toString() === assignedTo.toString()
      );
      if (!isAssigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the project' });
      }
      assigneeId = assignedTo;
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      project: project._id,
      assignedTo: assigneeId,
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: Array.isArray(labels) ? labels.map((l) => String(l).trim()).filter(Boolean) : [],
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl');

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
};

// GET /api/projects/:projectId/tasks
export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, assignee, priority } = req.query;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember && project.visibility !== 'public') {
      return res.status(403).json({ error: 'Access denied to this project tasks' });
    }

    const filter = { project: projectId };

    if (status) {
      filter.status = status;
    }

    if (assignee) {
      if (assignee === 'unassigned') {
        filter.assignedTo = null;
      } else {
        filter.assignedTo = assignee;
      }
    }

    if (priority) {
      filter.priority = priority;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
};

// PATCH /api/tasks/:taskId
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, assignedTo, priority, dueDate, labels } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }

    // Verify member permissions
    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: 'You must be a member of the project to update this task' });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (labels !== undefined && Array.isArray(labels)) {
      task.labels = labels.map((l) => String(l).trim()).filter(Boolean);
    }

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '') {
        task.assignedTo = null;
      } else {
        const isAssigneeMember = project.members.some(
          (m) => m.user.toString() === assignedTo.toString()
        );
        if (!isAssigneeMember) {
          return res.status(400).json({ error: 'Assignee must be a member of the project' });
        }
        task.assignedTo = assignedTo;
      }
    }

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('assignedTo', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl');

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
};

// ─── Sprint Controllers ───────────────────────────────────────────────────────

// POST /api/projects/:projectId/sprints
export const createSprint = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, startDate, endDate, tasks, goal, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Sprint name is required' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const requester = project.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
      return res.status(403).json({ error: 'Only owners or admins can create sprints' });
    }

    const sprint = await Sprint.create({
      project: project._id,
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      tasks: Array.isArray(tasks) ? tasks : [],
      goal: goal?.trim() || '',
      status: status || 'planning',
    });

    const populatedSprint = await Sprint.findById(sprint._id).populate({
      path: 'tasks',
      populate: { path: 'assignedTo', select: 'name email avatarUrl' },
    });

    res.status(201).json(populatedSprint);
  } catch (error) {
    console.error('Error creating sprint:', error);
    res.status(500).json({ error: 'Server error creating sprint' });
  }
};

// GET /api/projects/:projectId/sprints
export const getProjectSprints = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = project.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember && project.visibility !== 'public') {
      return res.status(403).json({ error: 'Access denied to this project sprints' });
    }

    const sprints = await Sprint.find({ project: projectId })
      .populate({
        path: 'tasks',
        populate: { path: 'assignedTo', select: 'name email avatarUrl' },
      })
      .sort({ startDate: -1 });

    res.status(200).json(sprints);
  } catch (error) {
    console.error('Error fetching project sprints:', error);
    res.status(500).json({ error: 'Server error fetching sprints' });
  }
};

// GET /api/sprints/:sprintId
export const getSprintById = async (req, res) => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId).populate({
      path: 'tasks',
      populate: { path: 'assignedTo', select: 'name email avatarUrl' },
    });

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    const project = await Project.findById(sprint.project);
    const isMember = project?.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember && project?.visibility !== 'public') {
      return res.status(403).json({ error: 'Access denied to this sprint' });
    }

    res.status(200).json(sprint);
  } catch (error) {
    console.error('Error fetching sprint by ID:', error);
    res.status(500).json({ error: 'Server error fetching sprint' });
  }
};

// PUT or PATCH /api/sprints/:sprintId
export const updateSprint = async (req, res) => {
  try {
    const { sprintId } = req.params;
    const { name, startDate, endDate, tasks, goal, status } = req.body;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    const project = await Project.findById(sprint.project);
    const requester = project?.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
      return res.status(403).json({ error: 'Only project owners and admins can update sprints' });
    }

    if (name !== undefined) sprint.name = name.trim();
    if (startDate !== undefined) sprint.startDate = new Date(startDate);
    if (endDate !== undefined) sprint.endDate = new Date(endDate);
    if (goal !== undefined) sprint.goal = goal.trim();
    if (status !== undefined) sprint.status = status;
    if (tasks !== undefined && Array.isArray(tasks)) sprint.tasks = tasks;

    await sprint.save();

    const updatedSprint = await Sprint.findById(sprintId).populate({
      path: 'tasks',
      populate: { path: 'assignedTo', select: 'name email avatarUrl' },
    });

    res.status(200).json(updatedSprint);
  } catch (error) {
    console.error('Error updating sprint:', error);
    res.status(500).json({ error: 'Server error updating sprint' });
  }
};

// DELETE /api/sprints/:sprintId
export const deleteSprint = async (req, res) => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    const project = await Project.findById(sprint.project);
    const requester = project?.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
      return res.status(403).json({ error: 'Only project owners and admins can delete sprints' });
    }

    await Sprint.findByIdAndDelete(sprintId);

    res.status(200).json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    console.error('Error deleting sprint:', error);
    res.status(500).json({ error: 'Server error deleting sprint' });
  }
};
