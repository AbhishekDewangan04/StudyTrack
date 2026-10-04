const Task = require('../models/Task');

/**
 * Calculates current and longest productivity streaks based on completion dates.
 */
const calculateStreaks = (completedTasks) => {
  if (!completedTasks || completedTasks.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Extract unique completion dates (YYYY-MM-DD)
  const dateSet = new Set();
  completedTasks.forEach((t) => {
    if (t.updatedAt) {
      const d = new Date(t.updatedAt);
      const dateStr = d.toISOString().split('T')[0];
      dateSet.add(dateStr);
    }
  });

  const sortedDates = Array.from(dateSet).sort();
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate longest streak
  let maxStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else if (diffDays > 1) {
      tempStreak = 1;
    }
  }

  // Calculate current streak working backwards from today or yesterday
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  let currStreak = 0;
  let checkDate = new Date();

  if (dateSet.has(today)) {
    currStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (dateSet.has(yesterday)) {
    currStreak = 1;
    checkDate.setDate(checkDate.getDate() - 2);
  } else {
    currStreak = 0;
  }

  if (currStreak > 0) {
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        currStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    currentStreak: currStreak,
    longestStreak: Math.max(maxStreak, currStreak),
  };
};

// @desc    Get complete analytics overview for authenticated user
// @route   GET /api/analytics/overview
// @access  Private
const getAnalyticsOverview = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const now = new Date();

    const totalTasks = tasks.length;
    const completedTasksList = tasks.filter((t) => t.status === 'Completed');
    const completedTasks = completedTasksList.length;
    const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
    const overdueTasks = tasks.filter(
      (t) => t.status === 'Pending' && new Date(t.deadline) < now
    ).length;

    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const recurringTasksCount = tasks.filter((t) => t.isRecurring === true).length;
    const locationTasksCount = tasks.filter((t) =>
      Boolean(t.locationName || t.locationAddress || t.locationLatitude !== null)
    ).length;

    // Calculate tasks completed this week & this month
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const tasksCompletedThisWeek = completedTasksList.filter(
      (t) => t.updatedAt && new Date(t.updatedAt) >= startOfWeek
    ).length;

    const tasksCompletedThisMonth = completedTasksList.filter(
      (t) => t.updatedAt && new Date(t.updatedAt) >= startOfMonth
    ).length;

    // Streaks
    const { currentStreak, longestStreak } = calculateStreaks(completedTasksList);

    // Most Productive Subject
    const subjectCompletedCount = {};
    completedTasksList.forEach((t) => {
      const s = t.subject ? t.subject.trim() : 'General';
      subjectCompletedCount[s] = (subjectCompletedCount[s] || 0) + 1;
    });

    let mostProductiveSubject = null;
    let maxCompleted = 0;
    Object.keys(subjectCompletedCount).forEach((s) => {
      if (subjectCompletedCount[s] > maxCompleted) {
        maxCompleted = subjectCompletedCount[s];
        mostProductiveSubject = s;
      }
    });

    return res.status(200).json({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionPercentage,
      recurringTasksCount,
      locationTasksCount,
      tasksCompletedThisWeek,
      tasksCompletedThisMonth,
      currentStreak,
      longestStreak,
      mostProductiveSubject,
    });
  } catch (error) {
    console.error('GetAnalyticsOverview Error:', error.message);
    return res.status(500).json({ message: 'Failed to compute analytics overview', error: error.message });
  }
};

// @desc    Get subject-wise analytics breakdown
// @route   GET /api/analytics/subjects
// @access  Private
const getSubjectAnalytics = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const now = new Date();

    const subjectMap = {};

    tasks.forEach((t) => {
      const subj = t.subject ? t.subject.trim() : 'General';
      if (!subjectMap[subj]) {
        subjectMap[subj] = { total: 0, completed: 0, pending: 0, overdue: 0 };
      }

      subjectMap[subj].total += 1;
      if (t.status === 'Completed') {
        subjectMap[subj].completed += 1;
      } else {
        subjectMap[subj].pending += 1;
        if (new Date(t.deadline) < now) {
          subjectMap[subj].overdue += 1;
        }
      }
    });

    const result = Object.keys(subjectMap).map((subj) => {
      const total = subjectMap[subj].total;
      const completed = subjectMap[subj].completed;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        subject: subj,
        total,
        completed,
        pending: subjectMap[subj].pending,
        overdue: subjectMap[subj].overdue,
        completionRate,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('GetSubjectAnalytics Error:', error.message);
    return res.status(500).json({ message: 'Failed to compute subject analytics', error: error.message });
  }
};

// @desc    Get completion trends & deadline stats
// @route   GET /api/analytics/trends
// @access  Private
const getAnalyticsTrends = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const now = new Date();

    // Weekly completion trend (past 7 days)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTrend = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];

      const completedCount = tasks.filter(
        (t) =>
          t.status === 'Completed' &&
          t.updatedAt &&
          new Date(t.updatedAt).toISOString().split('T')[0] === dateStr
      ).length;

      weeklyTrend.push({
        day: dayName,
        date: dateStr,
        completedCount,
      });
    }

    // Upcoming deadlines in next 7 days
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlinesCount = tasks.filter(
      (t) => t.status === 'Pending' && new Date(t.deadline) >= now && new Date(t.deadline) <= nextWeek
    ).length;

    const overdueCount = tasks.filter(
      (t) => t.status === 'Pending' && new Date(t.deadline) < now
    ).length;

    return res.status(200).json({
      weeklyTrend,
      upcomingDeadlinesCount,
      overdueCount,
    });
  } catch (error) {
    console.error('GetAnalyticsTrends Error:', error.message);
    return res.status(500).json({ message: 'Failed to compute analytics trends', error: error.message });
  }
};

module.exports = {
  getAnalyticsOverview,
  getSubjectAnalytics,
  getAnalyticsTrends,
};
