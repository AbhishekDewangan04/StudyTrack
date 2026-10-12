const Task = require('../models/Task');
const { buildGoogleMapsUrl } = require('../utils/mapsHelper');

/**
 * Calculates next occurrence deadline date based on recurrence type.
 */
const calculateNextDeadline = (currentDeadline, recurrenceType) => {
  const d = new Date(currentDeadline);
  if (recurrenceType === 'daily') {
    d.setDate(d.getDate() + 1);
  } else if (recurrenceType === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (recurrenceType === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
};

// @desc    Get all tasks for logged-in user (with optional advanced filtering)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status, subject, deadline, location, recurrence, search } = req.query;

    // Data isolation: Always restrict query to logged-in user ID
    const query = { user: req.user._id };

    // 1. Status Filter
    if (status) {
      const statusVal = String(status).toLowerCase().trim();
      if (statusVal === 'pending') {
        query.status = 'Pending';
      } else if (statusVal === 'completed') {
        query.status = 'Completed';
      } else if (statusVal === 'overdue') {
        query.status = 'Pending';
        query.deadline = { $lt: new Date() };
      }
    }

    // 2. Subject Filter (case-insensitive regex search)
    if (subject && String(subject).trim()) {
      query.subject = { $regex: String(subject).trim(), $options: 'i' };
    }

    // 3. Deadline Filter
    if (deadline && String(deadline).toLowerCase().trim() !== 'all') {
      const now = new Date();
      const deadlineVal = String(deadline).toLowerCase().trim();

      if (deadlineVal === 'overdue') {
        query.status = 'Pending';
        query.deadline = { $lt: now };
      } else if (deadlineVal === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        query.deadline = { $gte: startOfDay, $lte: endOfDay };
      } else if (deadlineVal === 'thisweek' || deadlineVal === 'this_week') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000);
        query.deadline = { $gte: startOfDay, $lte: endOfWeek };
      } else if (deadlineVal === 'thismonth' || deadlineVal === 'this_month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        query.deadline = { $gte: startOfMonth, $lte: endOfMonth };
      }
    }

    // 4. Location Filter
    if (location && String(location).toLowerCase().trim() !== 'all') {
      const locVal = String(location).toLowerCase().trim();
      if (locVal === 'withlocation' || locVal === 'with_location' || locVal === 'true') {
        query.$or = [
          { locationName: { $exists: true, $ne: '' } },
          { locationAddress: { $exists: true, $ne: '' } },
          { locationLatitude: { $ne: null } },
        ];
      } else if (locVal === 'withoutlocation' || locVal === 'without_location' || locVal === 'false') {
        query.locationName = { $in: ['', null] };
        query.locationAddress = { $in: ['', null] };
        query.locationLatitude = null;
      }
    }

    // 5. Recurrence Filter
    if (recurrence && String(recurrence).toLowerCase().trim() !== 'all') {
      const recVal = String(recurrence).toLowerCase().trim();
      if (recVal === 'recurring' || recVal === 'true') {
        query.isRecurring = true;
      } else if (recVal === 'onetime' || recVal === 'one-time' || recVal === 'false') {
        query.isRecurring = { $ne: true };
      }
    }

    // 6. Search across title, description, subject, locationName, locationAddress
    if (search && String(search).trim()) {
      const searchRegex = { $regex: String(search).trim(), $options: 'i' };
      const searchOrConditions = [
        { title: searchRegex },
        { description: searchRegex },
        { subject: searchRegex },
        { locationName: searchRegex },
        { locationAddress: searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOrConditions }];
        delete query.$or;
      } else {
        query.$or = searchOrConditions;
      }
    }

    // Sort by deadline ascending (earliest deadline first)
    const tasks = await Task.find(query).sort({ deadline: 1 });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('GetTasks Error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve tasks', error: error.message });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Security Check: Verify user owns this task
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view this task' });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error('GetTaskById Error:', error.message);
    return res.status(500).json({ message: 'Error retrieving task', error: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      deadline,
      status,
      locationName,
      locationAddress,
      locationLatitude,
      locationLongitude,
      googleMapsUrl,
      isRecurring,
      recurrenceType,
      recurrenceEndDate,
    } = req.body;

    if (!title || !subject || !deadline) {
      return res.status(400).json({ message: 'Please provide title, subject, and deadline' });
    }

    // Recurrence validation
    const recurringBool = Boolean(isRecurring);
    let recType = recurrenceType ? String(recurrenceType).toLowerCase().trim() : 'none';
    let recEndDate = null;

    if (!['none', 'daily', 'weekly', 'monthly'].includes(recType)) {
      return res.status(400).json({ message: 'recurrenceType must be one of: none, daily, weekly, monthly' });
    }

    if (!recurringBool) {
      recType = 'none';
      recEndDate = null;
    } else {
      if (recType === 'none') {
        return res.status(400).json({ message: 'Recurring task must specify recurrenceType: daily, weekly, or monthly' });
      }
      if (recurrenceEndDate) {
        recEndDate = new Date(recurrenceEndDate);
        if (isNaN(recEndDate.getTime())) {
          return res.status(400).json({ message: 'Invalid recurrenceEndDate format' });
        }
        const taskDeadlineDate = new Date(deadline);
        if (recEndDate < taskDeadlineDate) {
          return res.status(400).json({ message: 'recurrenceEndDate cannot be earlier than the task deadline' });
        }
      }
    }

    // Validate coordinates if provided
    let parsedLat = null;
    if (locationLatitude !== undefined && locationLatitude !== null && locationLatitude !== '') {
      parsedLat = Number(locationLatitude);
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        return res.status(400).json({ message: 'Latitude must be a valid number between -90 and 90' });
      }
    }

    let parsedLng = null;
    if (locationLongitude !== undefined && locationLongitude !== null && locationLongitude !== '') {
      parsedLng = Number(locationLongitude);
      if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        return res.status(400).json({ message: 'Longitude must be a valid number between -180 and 180' });
      }
    }

    const trimmedName = locationName ? String(locationName).trim() : '';
    const trimmedAddress = locationAddress ? String(locationAddress).trim() : '';

    const computedMapsUrl = buildGoogleMapsUrl({
      locationName: trimmedName,
      locationAddress: trimmedAddress,
      locationLatitude: parsedLat,
      locationLongitude: parsedLng,
      googleMapsUrl,
    });

    const task = await Task.create({
      user: req.user._id, // Data isolation: Assign task to logged-in user
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      subject: String(subject).trim(),
      deadline,
      status: status || 'Pending',
      completedAt: (status || 'Pending') === 'Completed' ? new Date() : null,
      locationName: trimmedName,
      locationAddress: trimmedAddress,
      locationLatitude: parsedLat,
      locationLongitude: parsedLng,
      googleMapsUrl: computedMapsUrl,
      isRecurring: recurringBool,
      recurrenceType: recType,
      recurrenceEndDate: recEndDate,
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('CreateTask Error:', error.message);
    return res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

// @desc    Update existing task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Security Check: Verify user owns this task
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to modify this task' });
    }

    const updateFields = { ...req.body };

    // Recurrence validation
    if (updateFields.isRecurring !== undefined) {
      updateFields.isRecurring = Boolean(updateFields.isRecurring);
    }

    if (updateFields.recurrenceType !== undefined) {
      const recType = String(updateFields.recurrenceType).toLowerCase().trim();
      if (!['none', 'daily', 'weekly', 'monthly'].includes(recType)) {
        return res.status(400).json({ message: 'recurrenceType must be one of: none, daily, weekly, monthly' });
      }
      updateFields.recurrenceType = recType;
    }

    const finalIsRecurring =
      updateFields.isRecurring !== undefined ? updateFields.isRecurring : task.isRecurring;
    const finalRecType =
      updateFields.recurrenceType !== undefined ? updateFields.recurrenceType : task.recurrenceType;

    if (!finalIsRecurring) {
      updateFields.recurrenceType = 'none';
      updateFields.recurrenceEndDate = null;
    } else {
      if (finalRecType === 'none') {
        return res.status(400).json({ message: 'Recurring task must specify recurrenceType: daily, weekly, or monthly' });
      }
      if (
        updateFields.recurrenceEndDate !== undefined &&
        updateFields.recurrenceEndDate !== null &&
        updateFields.recurrenceEndDate !== ''
      ) {
        const endDateObj = new Date(updateFields.recurrenceEndDate);
        if (isNaN(endDateObj.getTime())) {
          return res.status(400).json({ message: 'Invalid recurrenceEndDate format' });
        }
        const taskDeadlineDate = new Date(updateFields.deadline || task.deadline);
        if (endDateObj < taskDeadlineDate) {
          return res.status(400).json({ message: 'recurrenceEndDate cannot be earlier than the task deadline' });
        }
        updateFields.recurrenceEndDate = endDateObj;
      } else if (updateFields.recurrenceEndDate === '' || updateFields.recurrenceEndDate === null) {
        updateFields.recurrenceEndDate = null;
      }
    }

    // Reset reminder state if explicit deadline change is provided
    if (updateFields.deadline) {
      const newDead = new Date(updateFields.deadline);
      const oldDead = new Date(task.deadline);
      if (!isNaN(newDead.getTime()) && newDead.getTime() !== oldDead.getTime()) {
        updateFields.deadlineReminderSent = false;
        updateFields.deadlineReminderSentAt = null;
        updateFields.overdueNoticeSent = false;
        updateFields.overdueNoticeSentAt = null;
      }
    }

    // Handle Recurring Task progression on completion
    if (updateFields.status === 'Completed' && task.status !== 'Completed') {
      if (finalIsRecurring && finalRecType && finalRecType !== 'none') {
        const nextDeadline = calculateNextDeadline(task.deadline, finalRecType);
        const endDateObj = updateFields.recurrenceEndDate || task.recurrenceEndDate;

        // If next deadline is within recurrence end date (or no end date set)
        if (!endDateObj || nextDeadline <= new Date(endDateObj)) {
          updateFields.deadline = nextDeadline;
          updateFields.status = 'Pending'; // Advance to next scheduled occurrence as Pending
          updateFields.completedAt = null;
          updateFields.deadlineReminderSent = false;
          updateFields.deadlineReminderSentAt = null;
          updateFields.overdueNoticeSent = false;
          updateFields.overdueNoticeSentAt = null;
        } else {
          // Recurrence period finished
          updateFields.isRecurring = false;
          updateFields.recurrenceType = 'none';
          updateFields.status = 'Completed';
          updateFields.completedAt = new Date();
        }
      } else {
        updateFields.completedAt = new Date();
      }
    } else if (updateFields.status === 'Pending') {
      updateFields.completedAt = null;
    } else if (updateFields.status === 'Completed') {
      updateFields.completedAt = task.completedAt || new Date();
    }

    // Validate location latitude if present in body
    if (
      updateFields.locationLatitude !== undefined &&
      updateFields.locationLatitude !== null &&
      updateFields.locationLatitude !== ''
    ) {
      const parsedLat = Number(updateFields.locationLatitude);
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        return res.status(400).json({ message: 'Latitude must be a valid number between -90 and 90' });
      }
      updateFields.locationLatitude = parsedLat;
    } else if (updateFields.locationLatitude === '' || updateFields.locationLatitude === null) {
      updateFields.locationLatitude = null;
    }

    // Validate location longitude if present in body
    if (
      updateFields.locationLongitude !== undefined &&
      updateFields.locationLongitude !== null &&
      updateFields.locationLongitude !== ''
    ) {
      const parsedLng = Number(updateFields.locationLongitude);
      if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        return res.status(400).json({ message: 'Longitude must be a valid number between -180 and 180' });
      }
      updateFields.locationLongitude = parsedLng;
    } else if (updateFields.locationLongitude === '' || updateFields.locationLongitude === null) {
      updateFields.locationLongitude = null;
    }

    if (updateFields.locationName !== undefined) {
      updateFields.locationName = updateFields.locationName ? String(updateFields.locationName).trim() : '';
    }
    if (updateFields.locationAddress !== undefined) {
      updateFields.locationAddress = updateFields.locationAddress ? String(updateFields.locationAddress).trim() : '';
    }

    // Calculate updated location object for map URL generation
    const isLocationFieldUpdated =
      updateFields.locationName !== undefined ||
      updateFields.locationAddress !== undefined ||
      updateFields.locationLatitude !== undefined ||
      updateFields.locationLongitude !== undefined;

    const mergedLocation = {
      locationName: updateFields.locationName !== undefined ? updateFields.locationName : task.locationName,
      locationAddress:
        updateFields.locationAddress !== undefined ? updateFields.locationAddress : task.locationAddress,
      locationLatitude:
        updateFields.locationLatitude !== undefined ? updateFields.locationLatitude : task.locationLatitude,
      locationLongitude:
        updateFields.locationLongitude !== undefined ? updateFields.locationLongitude : task.locationLongitude,
      googleMapsUrl:
        updateFields.googleMapsUrl !== undefined
          ? updateFields.googleMapsUrl
          : isLocationFieldUpdated
          ? ''
          : task.googleMapsUrl,
    };

    updateFields.googleMapsUrl = buildGoogleMapsUrl(mergedLocation);

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    // Asynchronously update Google Calendar event if task is synced
    if (updatedTask.googleCalendarEventId) {
      const User = require('../models/User');
      const { getValidAccessToken, updateCalendarEvent } = require('../services/googleCalendarService');
      User.findById(req.user._id).then(async (u) => {
        if (u && u.googleCalendarConnected && u.googleTokens) {
          try {
            const accessToken = await getValidAccessToken(u);
            await updateCalendarEvent(accessToken, updatedTask.googleCalendarEventId, updatedTask);
          } catch (err) {
            console.error('Async Google Event Update Error:', err.message);
          }
        }
      }).catch(() => {});
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error('UpdateTask Error:', error.message);
    return res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Security Check: Verify user owns this task
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this task' });
    }

    const deletedTitle = task.title;
    const googleEventId = task.googleCalendarEventId;

    await task.deleteOne();

    // Asynchronously remove Google Calendar event if synced
    if (googleEventId) {
      const User = require('../models/User');
      const { getValidAccessToken, deleteCalendarEvent } = require('../services/googleCalendarService');
      User.findById(req.user._id).then(async (u) => {
        if (u && u.googleCalendarConnected && u.googleTokens) {
          try {
            const accessToken = await getValidAccessToken(u);
            await deleteCalendarEvent(accessToken, googleEventId);
          } catch (err) {
            console.error('Async Google Event Delete Error:', err.message);
          }
        }
      }).catch(() => {});
    }

    return res.status(200).json({ id: req.params.id, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('DeleteTask Error:', error.message);
    return res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};

// @desc    Get dashboard statistics for logged-in user
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const now = new Date();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
    const overdueTasks = tasks.filter(
      (t) => t.status === 'Pending' && new Date(t.deadline) < now
    ).length;

    return res.status(200).json({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
    });
  } catch (error) {
    console.error('GetTaskStats Error:', error.message);
    return res.status(500).json({ message: 'Failed to compute task statistics', error: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
};
