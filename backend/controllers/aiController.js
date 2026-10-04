const User = require('../models/User');

/**
 * Controller for Gemini-Powered AI Bot Study Advice & Planning
 * Endpoint: POST /api/ai/study-advice
 * Access: Private (PRO Users Only)
 */
const getStudyAdvice = async (req, res) => {
  try {
    // 1. Verify User & PRO Status
    const user = req.user;
    if (!user || !user.isPro) {
      return res.status(403).json({
        success: false,
        message: '🔒 AI Bot is a PRO feature. Upgrade to PRO to access personalized AI study assistance.',
      });
    }

    const { query, action, topic, subject, examDate, availableHours, context } = req.body;

    if (!query && !action && !topic) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a study query or action.',
      });
    }

    // 2. Read Gemini API Key from backend environment variable ONLY
    const rawKey = process.env.GEMINI_API_KEY;
    const apiKey = rawKey ? rawKey.trim().replace(/^["']|["']$/g, '') : null;
    if (!apiKey) {
      return res.status(200).json({
        success: true,
        reply: '⚠️ GEMINI_API_KEY is not configured in backend/.env. Please set a valid GEMINI_API_KEY in backend/.env to receive live Gemini AI responses.',
      });
    }

    // 3. Construct System Prompt & User Context
    let systemInstruction = `You are StudyTrack AI Bot, an expert academic tutor and study advisor.
Your primary goal is to provide naturally structured, highly educational, ChatGPT-style answers with clean visual hierarchy.

GUIDELINES FOR YOUR RESPONSES:
1. STRUCTURE & FLOW:
   - For educational topics, start directly with a clear definition/overview.
   - Use natural section headings (e.g. ## Definition, ## Key Concepts, ## Why It Matters, ## Examples, ## Comparison, ## Summary).
   - Use bullet points for features, advantages, or examples, and numbered lists for steps, algorithms, or ordered concepts.
   - Bold important technical terms, concepts, and key definitions.
   - Provide concrete examples, code snippets, or ASCII/text diagrams when they genuinely aid understanding.
   - Adapt response length: keep simple questions concise, and provide structured depth for complex topics or study plans.

2. MARKDOWN FORMATTING:
   - Output clean, standard GitHub-Flavored Markdown.
   - Use headings (## Subtopic, ### Component) for visual hierarchy.
   - For code, use fenced code blocks with language specifiers (e.g. \`\`\`sql, \`\`\`cpp).
   - Use Markdown tables (e.g. | Feature | Option A | Option B |) when comparing concepts.
   - Avoid generic conversational filler like "Sure! Here is..." or "As an AI...". Begin directly with the clear, educational content.
   - When generating flashcards, format clearly as:
Card 1
Q: [Question]
A: [Answer]`;

    let userPrompt = '';

    if (action === 'create_flashcards') {
      userPrompt = `Generate 6-8 concise, high-yield study flashcards for the topic: "${topic || query || 'Core Concepts'}". 
Format each flashcard clearly as:
Card 1
Q: [Question]
A: [Answer]
Card 2
Q: [Question]
A: [Answer]`;
    } else if (action === 'create_study_plan') {
      userPrompt = `Create a realistic, step-by-step study plan for ${subject || topic || query}.
Available Study Time: ${availableHours || '3 hours/day'}
Target Date/Exam: ${examDate || 'Next 7 days'}
Structure it day-by-day with specific topics to cover, practice tasks, and revision checkpoints.`;
    } else if (action === 'help_me_revise') {
      userPrompt = `Give me an effective revision strategy and high-priority concept checklist for: "${topic || query}". Include active recall questions and key revision points.`;
    } else if (action === 'prepare_for_exam') {
      userPrompt = `Create an exam preparation strategy for ${subject || topic || query}. 
Target Exam Date: ${examDate || '1 week from now'}
Available Time: ${availableHours || '3 hours/day'}
Detail the preparation stages: High-yield concepts, practice questions, and exam-day strategies.`;
    } else if (action === 'explain_topic') {
      userPrompt = `Explain the topic "${topic || query}" in a simple, clear, student-friendly way. Include:
1. Definition
2. Intuitive Analogy / Concept
3. Practical Example
4. Common Mistakes to Avoid
5. Quick Summary`;
    } else {
      userPrompt = query;
    }

    if (context && typeof context === 'string') {
      userPrompt += `\n\nUser Context:\n${context}`;
    }

    // 4. Send Request to Google Gemini REST API (with model fallback)
    const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-pro'];
    let replyText = null;
    let lastErrorMsg = null;

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                parts: [{ text: userPrompt }],
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const extractedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (extractedText) {
            replyText = extractedText;
            break;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastErrorMsg = errData?.error?.message || `HTTP ${response.status}`;
          console.error(`Gemini Model ${model} returned error:`, lastErrorMsg);
        }
      } catch (err) {
        console.error(`Gemini request failed for model ${model}:`, err.message);
      }
    }

    if (!replyText) {
      return res.status(200).json({
        success: true,
        reply: `AI Bot encountered an issue with Gemini (${lastErrorMsg || 'Network error'}). Please verify your GEMINI_API_KEY in backend/.env.`,
      });
    }

    return res.status(200).json({
      success: true,
      reply: replyText,
    });
  } catch (error) {
    console.error('AI Bot Controller Error:', error.message);
    return res.status(200).json({
      success: true,
      reply: 'AI Bot is currently unavailable. Please check your backend network connection or GEMINI_API_KEY.',
    });
  }
};

module.exports = {
  getStudyAdvice,
};
