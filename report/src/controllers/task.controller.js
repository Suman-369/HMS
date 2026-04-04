import Task from '../models/task.model.js';


// Create task (admin only)
export const createTask = async (req, res) => {
  try {
    const { title, description, priority, deadline, staffId } = req.body;

    // Validate deadline not in past
    if (new Date(deadline) < new Date()) {
      return res.status(400).json({ message: 'Deadline cannot be in the past' });
    }

    const task = new Task({
      title,
      description, 
      priority,
      deadline,
      staffId,
      createdBy: req.user.id 
    });

    await task.save();

    // Populate staff name
await task.populate('staffId', 'fullname.firstName fullname.lastName email');
    await task.populate('createdBy', 'name');

    res.status(201).json({ 
      success: true, 
      task,
      message: 'Task created successfully' 
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all tasks (admin)
export const getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, staffId } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (staffId) query.staffId = staffId;

      const tasks = await Task.find(query)
      .populate('staffId', 'fullname.firstName fullname.lastName email')
      .populate('createdBy', 'fullname.firstName fullname.lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      tasks,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tasks by staff (staff view)
export const getTasksByStaff = async (req, res) => {
  try {
    const tasks = await Task.find({ staffId: req.user.id })
      .populate('createdBy', 'name')
      .sort({ deadline: 1 });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task (admin only)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate deadline not in past if provided
    if (updateData.deadline && new Date(updateData.deadline) < new Date()) {
      return res.status(400).json({ message: 'Deadline cannot be in the past' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('staffId', 'fullname.firstName fullname.lastName email').populate('createdBy', 'fullname.firstName fullname.lastName');

    res.json({
      success: true,
      task: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update task status (staff only)
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findOne({ _id: id, staffId: req.user.id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found or not assigned to you' });
    }

    task.status = status;
    await task.save();

    await task.populate('staffId createdBy', 'fullname.firstName fullname.lastName');

    res.json({
      success: true,
      task,
      message: 'Task status updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Delete task (admin only)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

