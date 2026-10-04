/**
 * Server-Side Automated Scheduler Service
 * Periodically checks for upcoming task deadlines, overdue tasks, and weekly summaries.
 * Operates independently of frontend browser state.
 */

const Task = require('../models/Task');
const User = require('../models/User');
const {
  sendDeadlineReminderEmail,
  sendOverdueNoticeEmail,
  sendWeeklySummaryEmail,
} = require('./emailService');

// Run background job scan
const runSchedulerJobs = async () => {
  try {
    const now = new Date();

    // 1. Task Deadline Reminders (Tasks due within next 24 hours)
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcomingTasks = await Task.find({
      status: 'Pending',
      deadlineReminderSent: false,
      deadline: { $gt: now, $lte: twentyFourHoursFromNow },
    }).populate('user', 'name email');

    for (const task of upcomingTasks) {
      if (task.user && task.user.email) {
        const result = await sendDeadlineReminderEmail({
          to: task.user.email,
          name: task.user.name,
          taskTitle: task.title,
          subjectName: task.subject,
          deadline: task.deadline,
        });

        // Only mark reminder as sent AFTER successful email dispatch/simulation
        if (result && result.success) {
          try {
            await Task.findByIdAndUpdate(task._id, {
              deadlineReminderSent: true,
              deadlineReminderSentAt: new Date(),
            });
          } catch (dbErr) {
            console.error(`⚠️ [Scheduler] Failed to update deadlineReminderSent for task ${task._id}:`, dbErr.message);
          }
        }
      }
    }

    // 2. Overdue Task Notifications (Pending tasks past deadline)
    const overdueTasks = await Task.find({
      status: 'Pending',
      overdueNoticeSent: false,
      deadline: { $lt: now },
    }).populate('user', 'name email');

    for (const task of overdueTasks) {
      if (task.user && task.user.email) {
        const result = await sendOverdueNoticeEmail({
          to: task.user.email,
          name: task.user.name,
          taskTitle: task.title,
          subjectName: task.subject,
          deadline: task.deadline,
        });

        // Only mark overdue notice as sent AFTER successful email dispatch/simulation
        if (result && result.success) {
          try {
            await Task.findByIdAndUpdate(task._id, {
              overdueNoticeSent: true,
              overdueNoticeSentAt: new Date(),
            });
          } catch (dbErr) {
            console.error(`⚠️ [Scheduler] Failed to update overdueNoticeSent for task ${task._id}:`, dbErr.message);
          }
        }
      }
    }

    // 3. Deterministic Weekly Study Summaries (Per user, minimum 7-day interval)
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const users = await User.find({});

    for (const user of users) {
      const lastSent = user.lastWeeklySummarySentAt ? new Date(user.lastWeeklySummarySentAt).getTime() : 0;
      const timeSinceLastSent = now.getTime() - lastSent;

      // Only send if user has never received a summary or it has been at least 7 days since last dispatch
      if (lastSent === 0 || timeSinceLastSent >= SEVEN_DAYS_MS) {
        // Calculate task stats for user
        const totalTasks = await Task.countDocuments({ user: user._id });
        const completedTasks = await Task.countDocuments({ user: user._id, status: 'Completed' });
        const pendingTasks = await Task.countDocuments({ user: user._id, status: 'Pending', deadline: { $gte: now } });
        const overdueTasks = await Task.countDocuments({ user: user._id, status: 'Pending', deadline: { $lt: now } });

        // Only send if user has tasks created
        if (totalTasks > 0) {
          const result = await sendWeeklySummaryEmail({
            to: user.email,
            name: user.name,
            stats: {
              totalTasks,
              completedTasks,
              pendingTasks,
              overdueTasks,
            },
          });

          if (result && result.success) {
            try {
              await User.findByIdAndUpdate(user._id, {
                lastWeeklySummarySentAt: new Date(),
              });
            } catch (dbErr) {
              console.error(`⚠️ [Scheduler] Failed to update lastWeeklySummarySentAt for user ${user._id}:`, dbErr.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ [Scheduler] Error during scheduled jobs execution:', error.message);
  }
};

const { isTestEnvironment } = require('../utils/testContext');

// Initialize background scheduler
const initScheduler = () => {
  if (isTestEnvironment()) {
    console.log('⏰ [Scheduler] Background Email Scheduler Service disabled in test environment');
    return;
  }
  console.log('⏰ [Scheduler] Background Email Scheduler Service Initialized (Interval: 15 mins)');
  // Run once on startup after 10 seconds buffer
  setTimeout(runSchedulerJobs, 10000);
  // Run every 15 minutes (900,000 ms)
  setInterval(runSchedulerJobs, 15 * 60 * 1000);
};

module.exports = {
  initScheduler,
  runSchedulerJobs,
};
