/**
 * Google Calendar Integration & OAuth 2.0 REST Service
 * Handles OAuth authentication, token refresh, and Google Calendar event CRUD operations.
 * Credentials remain strictly server-side.
 */

const https = require('https');
const User = require('../models/User');

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Generate Google OAuth Authorization URL with state CSRF protection
 */
const getGoogleAuthUrl = (userId) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    return {
      configured: false,
      message: 'Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_REDIRECT_URI) not configured in backend .env file.',
    };
  }

  // Base64 encode state object containing userId for CSRF protection & callback matching
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');

  const options = {
    redirect_uri: GOOGLE_REDIRECT_URI,
    client_id: GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    state,
  };

  const qs = new URLSearchParams(options).toString();
  return {
    configured: true,
    url: `${GOOGLE_AUTH_ENDPOINT}?${qs}`,
  };
};

/**
 * Exchange Authorization Code for Access & Refresh Tokens
 */
const exchangeCodeForTokens = async (code) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Google OAuth credentials not fully configured on server.');
  }

  const postData = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request(
      GOOGLE_TOKEN_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const expiry_date = Date.now() + (data.expires_in || 3600) * 1000;
              resolve({
                access_token: data.access_token,
                refresh_token: data.refresh_token || null,
                token_type: data.token_type || 'Bearer',
                scope: data.scope,
                expiry_date,
              });
            } else {
              reject(new Error(data.error_description || data.error || 'Failed to exchange Google OAuth code'));
            }
          } catch (e) {
            reject(new Error('Failed to parse Google OAuth token response'));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
};

/**
 * Get Valid Access Token (Refreshes token automatically if expired)
 */
const getValidAccessToken = async (user) => {
  if (!user.googleTokens || !user.googleTokens.access_token) {
    throw new Error('Google Calendar account is not connected.');
  }

  const { access_token, refresh_token, expiry_date } = user.googleTokens;
  const isExpired = !expiry_date || Date.now() >= expiry_date - 5 * 60 * 1000; // 5 min buffer

  if (!isExpired) {
    return access_token;
  }

  if (!refresh_token) {
    throw new Error('Google access token expired and no refresh token available. Re-authorization required.');
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  const postData = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token,
    grant_type: 'refresh_token',
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request(
      GOOGLE_TOKEN_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', async () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const newExpiryDate = Date.now() + (data.expires_in || 3600) * 1000;
              const updatedTokens = {
                ...user.googleTokens,
                access_token: data.access_token,
                expiry_date: newExpiryDate,
              };

              // Persist refreshed access token in database
              await User.findByIdAndUpdate(user._id, { googleTokens: updatedTokens });
              resolve(data.access_token);
            } else {
              reject(new Error(data.error_description || 'Failed to refresh Google access token'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
};

/**
 * Generic HTTPS JSON request helper for Google Calendar API
 */
const googleCalendarRequest = ({ method, path, accessToken, bodyData }) => {
  return new Promise((resolve, reject) => {
    const postData = bodyData ? JSON.stringify(bodyData) : '';
    const req = https.request(
      `${GOOGLE_CALENDAR_API_BASE}${path}`,
      {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(bodyData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const data = body ? JSON.parse(body) : { success: true };
              resolve(data);
            } else {
              const errData = body ? JSON.parse(body) : {};
              reject(new Error(errData.error?.message || `Google Calendar API error HTTP ${res.statusCode}`));
            }
          } catch (e) {
            reject(new Error('Failed to parse Google Calendar API response'));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (bodyData) req.write(postData);
    req.end();
  });
};

/**
 * Create Event on Primary Google Calendar
 */
const createCalendarEvent = async (accessToken, task) => {
  const startTime = new Date(task.deadline);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

  const locationParts = [task.locationName, task.locationAddress].filter((s) => s && String(s).trim()).join(', ');

  const eventPayload = {
    summary: `StudyTrack: ${task.title}`,
    description: `${task.description ? task.description + '\n\n' : ''}Subject: ${task.subject}\nStatus: ${task.status}\nSynced via StudyTrack PRO App`,
    start: { dateTime: startTime.toISOString() },
    end: { dateTime: endTime.toISOString() },
    ...(locationParts ? { location: locationParts } : {}),
  };

  return googleCalendarRequest({
    method: 'POST',
    path: '/calendars/primary/events',
    accessToken,
    bodyData: eventPayload,
  });
};

/**
 * Update Event on Primary Google Calendar
 */
const updateCalendarEvent = async (accessToken, eventId, task) => {
  const startTime = new Date(task.deadline);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  const locationParts = [task.locationName, task.locationAddress].filter((s) => s && String(s).trim()).join(', ');

  const eventPayload = {
    summary: `StudyTrack: ${task.title}`,
    description: `${task.description ? task.description + '\n\n' : ''}Subject: ${task.subject}\nStatus: ${task.status}\nSynced via StudyTrack PRO App`,
    start: { dateTime: startTime.toISOString() },
    end: { dateTime: endTime.toISOString() },
    ...(locationParts ? { location: locationParts } : {}),
  };

  return googleCalendarRequest({
    method: 'PUT',
    path: `/calendars/primary/events/${eventId}`,
    accessToken,
    bodyData: eventPayload,
  });
};

/**
 * Delete Event from Primary Google Calendar
 */
const deleteCalendarEvent = async (accessToken, eventId) => {
  return googleCalendarRequest({
    method: 'DELETE',
    path: `/calendars/primary/events/${eventId}`,
    accessToken,
  });
};

/**
 * Revoke Google OAuth Access
 */
const revokeGoogleAccess = async (token) => {
  if (!token) return;
  return new Promise((resolve) => {
    const postData = `token=${token}`;
    const req = https.request(
      'https://oauth2.googleapis.com/revoke',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      () => resolve(true)
    );
    req.on('error', () => resolve(false));
    req.write(postData);
    req.end();
  });
};

module.exports = {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  getValidAccessToken,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  revokeGoogleAccess,
};
