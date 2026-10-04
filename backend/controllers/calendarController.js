const User = require('../models/User');
const Task = require('../models/Task');
const {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  getValidAccessToken,
  createCalendarEvent,
  updateCalendarEvent,
  revokeGoogleAccess,
} = require('../services/googleCalendarService');
const { sendEmail } = require('../services/emailService');

// @desc    Get Google OAuth Authorization URL
// @route   GET /api/calendar/auth-url
// @access  Private
const getAuthUrl = async (req, res) => {
  try {
    const authData = getGoogleAuthUrl(req.user._id.toString());
    return res.status(200).json(authData);
  } catch (error) {
    console.error('GetAuthUrl Error:', error.message);
    return res.status(500).json({ message: 'Failed to generate Google authorization URL' });
  }
};

// @desc    Google OAuth Redirect Callback
// @route   GET /api/calendar/callback
// @access  Public (State token contains user ID verification)
const googleOAuthCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (error || !code) {
      console.error('Google OAuth Callback Error:', error || 'No authorization code returned');
      return res.redirect(`${clientUrl}/?calendar_error=${encodeURIComponent(error || 'Authorization denied')}`);
    }

    // Decode state to retrieve userId and verify CSRF timestamp
    let userId = null;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        userId = decoded.userId;
      } catch (e) {
        console.error('State decoding error:', e.message);
      }
    }

    if (!userId) {
      return res.status(400).json({ message: 'Invalid or missing state parameter' });
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Save tokens and update Google Calendar connected status for user
    await User.findByIdAndUpdate(userId, {
      googleTokens: tokens,
      googleCalendarConnected: true,
      googleCalendarConnectedAt: new Date(),
    });

    return res.redirect(`${clientUrl}/?google_connected=success#calendar`);
  } catch (error) {
    console.error('Google OAuth Callback Server Error:', error.message);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/?calendar_error=${encodeURIComponent('Failed to complete Google Calendar authorization')}`);
  }
};

// @desc    Get Google Calendar Connection Status
// @route   GET /api/calendar/status
// @access  Private
const getCalendarStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('googleCalendarConnected googleCalendarConnectedAt googleCalendarLastSyncAt');
    return res.status(200).json({
      connected: !!user?.googleCalendarConnected,
      connectedAt: user?.googleCalendarConnectedAt || null,
      lastSyncAt: user?.googleCalendarLastSyncAt || null,
    });
  } catch (error) {
    console.error('GetCalendarStatus Error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve calendar status' });
  }
};

// @desc    Disconnect Google Calendar Access
// @route   POST /api/calendar/disconnect
// @access  Private
const disconnectCalendar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user && user.googleTokens && user.googleTokens.access_token) {
      await revokeGoogleAccess(user.googleTokens.access_token);
    }

    // Reset user calendar connection status and tokens
    await User.findByIdAndUpdate(req.user._id, {
      googleTokens: null,
      googleCalendarConnected: false,
      googleCalendarConnectedAt: null,
      googleCalendarLastSyncAt: null,
    });

    // Clear Google Calendar Event IDs from user's tasks
    await Task.updateMany(
      { user: req.user._id },
      { googleCalendarEventId: null, googleCalendarSyncedAt: null }
    );

    return res.status(200).json({
      success: true,
      message: 'Google Calendar disconnected successfully.',
    });
  } catch (error) {
    console.error('DisconnectCalendar Error:', error.message);
    return res.status(500).json({ message: 'Failed to disconnect Google Calendar' });
  }
};

// @desc    Sync All User Tasks with Google Calendar
// @route   POST /api/calendar/sync-all
// @access  Private
const syncAllTasks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleCalendarConnected || !user.googleTokens) {
      return res.status(400).json({ message: 'Google Calendar is not connected.' });
    }

    const accessToken = await getValidAccessToken(user);

    // Fetch all active/pending tasks belonging to the user
    const tasks = await Task.find({ user: req.user._id });

    let createdCount = 0;
    let updatedCount = 0;

    for (const task of tasks) {
      try {
        if (!task.googleCalendarEventId) {
          // Create new Google Calendar event
          const event = await createCalendarEvent(accessToken, task);
          if (event && event.id) {
            await Task.findByIdAndUpdate(task._id, {
              googleCalendarEventId: event.id,
              googleCalendarSyncedAt: new Date(),
            });
            createdCount++;
          }
        } else {
          // Update existing Google Calendar event
          await updateCalendarEvent(accessToken, task.googleCalendarEventId, task);
          await Task.findByIdAndUpdate(task._id, { googleCalendarSyncedAt: new Date() });
          updatedCount++;
        }
      } catch (err) {
        console.error(`⚠️ Failed to sync task "${task.title}" to Google Calendar:`, err.message);
      }
    }

    const now = new Date();
    await User.findByIdAndUpdate(req.user._id, { googleCalendarLastSyncAt: now });

    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${createdCount + updatedCount} tasks with Google Calendar (${createdCount} created, ${updatedCount} updated).`,
      createdCount,
      updatedCount,
      lastSyncAt: now,
    });
  } catch (error) {
    console.error('SyncAllTasks Error:', error.message);
    return res.status(500).json({ message: error.message || 'Failed to sync tasks with Google Calendar' });
  }
};

// @desc    Sync Single Task Deadline with Google Calendar & Email
// @route   POST /api/calendar/sync-task/:id
// @access  Private
const syncTaskDeadline = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to access this assignment' });
    }

    const user = await User.findById(req.user._id);

    let googleSynced = false;
    let googleError = null;

    // Attempt Google Calendar Sync if connected
    if (user.googleCalendarConnected && user.googleTokens) {
      try {
        const accessToken = await getValidAccessToken(user);
        if (task.googleCalendarEventId) {
          await updateCalendarEvent(accessToken, task.googleCalendarEventId, task);
        } else {
          const event = await createCalendarEvent(accessToken, task);
          if (event && event.id) {
            task.googleCalendarEventId = event.id;
          }
        }
        task.googleCalendarSyncedAt = new Date();
        await task.save();
        googleSynced = true;
      } catch (err) {
        console.error('Single Task Google Sync Error:', err.message);
        googleError = err.message;
      }
    }

    // Trigger transactional reminder email via emailService
    const emailResult = await sendEmail({
      to: req.user.email,
      subject: `[StudyTrack Reminder] ${task.title} Deadline Alert`,
      text: `Hello ${req.user.name},\n\nThis is a reminder for your assignment: "${task.title}" (${task.subject}).\nDeadline: ${new Date(task.deadline).toLocaleString()}.\n\nBest,\nStudyTrack Team`,
    });

    return res.status(200).json({
      success: true,
      message: `Sync reminder initiated for "${task.title}".`,
      googleSynced,
      googleError,
      emailStatus: emailResult,
    });
  } catch (error) {
    console.error('SyncTaskDeadline Error:', error.message);
    return res.status(500).json({ message: 'Failed to sync task deadline', error: error.message });
  }
};

module.exports = {
  getAuthUrl,
  googleOAuthCallback,
  getCalendarStatus,
  disconnectCalendar,
  syncAllTasks,
  syncTaskDeadline,
};
