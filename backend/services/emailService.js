const { isTestEnvironment } = require('../utils/testContext');

/**
 * Helper to identify automated test or placeholder email recipients
 */
const isTestRecipient = (to) => {
  if (!to || typeof to !== 'string') return true;
  const lower = to.toLowerCase().trim();
  return (
    lower.endsWith('@example.com') ||
    lower.includes('test_req_') ||
    lower.includes('test_user') ||
    lower.includes('testuser') ||
    lower.includes('placeholder')
  );
};

/**
 * Provider-Agnostic Email Service Abstraction
 * Configured via environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 * Safely operates in log-only simulated mode if SMTP credentials are missing or during automated tests.
 */

const sendEmail = async ({ to, subject, text, html, isTest }) => {
  // Check if running in test environment or if recipient is a test/placeholder address
  if (isTestEnvironment({ isTest }) || isTestRecipient(to)) {
    console.log(`📧 [Test Email Suppressed] Email to <${to}> suppressed in test environment (Subject: "${subject}")`);
    return {
      success: true,
      mode: 'test_suppressed',
      message: `[Test Email Suppressed] Email to <${to}> suppressed in test environment`,
      messageId: `test-mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  // Check if SMTP credentials are configured
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log(`📧 [EmailService: Safe Mode] Email to <${to}> suppressed - SMTP credentials not configured in .env`);
    return {
      success: true,
      mode: 'simulated',
      message: 'Email dispatch simulated successfully (SMTP environment variables missing)',
    };
  }

  try {
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM || '"StudyTrack" <no-reply@studytrack.io>',
      to,
      subject,
      text,
      html: html || text,
    });

    console.log(`📧 [EmailService] Email sent successfully to <${to}> (ID: ${info.messageId})`);
    return { success: true, mode: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [EmailService] Failed to send email to <${to}>: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * 1. Welcome Email
 */
const sendWelcomeEmail = async ({ to, name }) => {
  const subject = 'Welcome to StudyTrack! 🚀';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-top: 0;">Welcome to StudyTrack, ${name || 'Student'}! 👋</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Thank you for joining StudyTrack. We are excited to help you organize your coursework, track deadlines, and supercharge your academic productivity!
      </p>
      <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 6px;">
        <h4 style="margin: 0 0 8px 0; color: #1e293b;">Here is how to get started:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
          <li>Add your upcoming tasks and assignments with due dates</li>
          <li>Track your progress on your personal interactive dashboard</li>
          <li>Receive automatic deadline reminders and weekly study summaries</li>
        </ul>
      </div>
      <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">Happy Learning,<br><strong>The StudyTrack Team</strong></p>
    </div>
  `;
  return sendEmail({ to, subject, text: `Welcome to StudyTrack, ${name}! Start organizing your coursework today.`, html });
};

/**
 * 2. Task Deadline Reminder Email
 */
const sendDeadlineReminderEmail = async ({ to, name, taskTitle, subjectName, deadline }) => {
  const formattedDate = new Date(deadline).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const subject = `⏰ Reminder: "${taskTitle}" is due soon!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
      <h2 style="color: #d97706; margin-top: 0;">Task Deadline Approaching ⏰</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Hi ${name || 'Student'}, your task <strong>"${taskTitle}"</strong> is due soon!
      </p>
      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0; color: #92400e; font-size: 14px;"><strong>Task:</strong> ${taskTitle}</p>
        <p style="margin: 4px 0; color: #92400e; font-size: 14px;"><strong>Subject:</strong> ${subjectName}</p>
        <p style="margin: 4px 0; color: #b45309; font-size: 14px;"><strong>Due Date:</strong> ${formattedDate}</p>
      </div>
      <p style="color: #475569; font-size: 14px;">Log in to StudyTrack to complete your task on time!</p>
    </div>
  `;
  return sendEmail({ to, subject, text: `Reminder: "${taskTitle}" (${subjectName}) is due on ${formattedDate}.`, html });
};

/**
 * 3. Overdue Task Notification Email
 */
const sendOverdueNoticeEmail = async ({ to, name, taskTitle, subjectName, deadline }) => {
  const formattedDate = new Date(deadline).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const subject = `🚨 Overdue Task Alert: "${taskTitle}"`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
      <h2 style="color: #dc2626; margin-top: 0;">Task is Now Overdue 🚨</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Hi ${name || 'Student'}, the deadline for <strong>"${taskTitle}"</strong> has passed.
      </p>
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Task:</strong> ${taskTitle}</p>
        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Subject:</strong> ${subjectName}</p>
        <p style="margin: 4px 0; color: #b91c1c; font-size: 14px;"><strong>Was Due:</strong> ${formattedDate}</p>
      </div>
      <p style="color: #475569; font-size: 14px;">Please complete and mark this task as completed on StudyTrack as soon as possible.</p>
    </div>
  `;
  return sendEmail({ to, subject, text: `Overdue Alert: "${taskTitle}" (${subjectName}) was due on ${formattedDate}.`, html });
};

/**
 * 4. Weekly Study Summary Email
 */
const sendWeeklySummaryEmail = async ({ to, name, stats }) => {
  const subject = '📊 Your Weekly StudyTrack Performance Summary';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-top: 0;">Weekly Study Summary 📊</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Hi ${name || 'Student'}, here is your study task summary for this week:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; border-radius: 8px; overflow: hidden;">
        <tr style="background-color: #4f46e5; color: #ffffff; text-align: left;">
          <th style="padding: 12px; font-size: 14px;">Metric</th>
          <th style="padding: 12px; font-size: 14px;">Count</th>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px;">Total Tasks</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b; font-size: 14px;">${stats.totalTasks || 0}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #166534; font-size: 14px;">Completed Tasks</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #166534; font-size: 14px;">${stats.completedTasks || 0}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #854d0e; font-size: 14px;">Pending Tasks</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #854d0e; font-size: 14px;">${stats.pendingTasks || 0}</td>
        </tr>
        <tr>
          <td style="padding: 12px; color: #991b1b; font-size: 14px;">Overdue Tasks</td>
          <td style="padding: 12px; font-weight: bold; color: #991b1b; font-size: 14px;">${stats.overdueTasks || 0}</td>
        </tr>
      </table>
      <p style="color: #475569; font-size: 14px;">Keep up the great effort!</p>
    </div>
  `;
  return sendEmail({
    to,
    subject,
    text: `Weekly Summary: ${stats.completedTasks} completed out of ${stats.totalTasks} total tasks. (${stats.pendingTasks} pending, ${stats.overdueTasks} overdue).`,
    html,
  });
};

/**
 * 5. Password Reset Email
 */
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const subject = '🔒 StudyTrack Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-top: 0;">Password Reset Request 🔒</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Hi ${name || 'User'}, we received a request to reset your StudyTrack account password.
      </p>
      <p style="color: #334155; font-size: 14px;">
        Please click the button below to set a new password. This link is valid for <strong>10 minutes</strong>.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
        If you did not request a password reset, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `;
  return sendEmail({
    to,
    subject,
    text: `Password Reset Request: Use this link to reset your password (valid 10 minutes): ${resetUrl}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendDeadlineReminderEmail,
  sendOverdueNoticeEmail,
  sendWeeklySummaryEmail,
  sendPasswordResetEmail,
};
