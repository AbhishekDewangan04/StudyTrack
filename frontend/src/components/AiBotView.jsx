import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../services/api';
import {
  Bot,
  Send,
  Sparkles,
  Crown,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  Flame,
  CheckCircle2,
  Lock,
  RotateCcw,
} from 'lucide-react';

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3 mb-2 pb-1 border-b border-slate-200">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-3.5 mb-1.5 flex items-center gap-1.5">
      <span className="w-1.5 h-4 bg-indigo-600 rounded-full inline-block shrink-0" />
      <span>{children}</span>
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2.5 mb-1">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xs sm:text-sm font-bold text-slate-800 mt-2 mb-1">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed my-1.5 font-normal">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-extrabold text-slate-900 bg-indigo-50/80 px-1 py-0.5 rounded text-[13px] border border-indigo-100/60">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-slate-700">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 my-2 text-xs sm:text-sm text-slate-700 pl-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1.5 my-2 text-xs sm:text-sm text-slate-700 pl-1">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed font-normal inline-block w-full">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-indigo-500 bg-indigo-50/50 p-3 my-2.5 rounded-r-xl text-xs text-indigo-950 italic font-medium shadow-2xs">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-t border-slate-200 my-3" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-2xl border border-slate-200 shadow-2xs">
      <table className="w-full text-left text-xs border-collapse bg-white">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-wider">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-100 text-slate-700">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-50/80 transition">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="p-2.5 font-bold border-b border-indigo-700">{children}</th>
  ),
  td: ({ children }) => (
    <td className="p-2.5 font-medium">{children}</td>
  ),
  code: ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match) {
      return (
        <div className="my-3 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 text-slate-100 shadow-md">
          <div className="px-4 py-1.5 bg-slate-800 border-b border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>{match[1]}</span>
            <span>Code Snippet</span>
          </div>
          <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-indigo-200">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    }
    return (
      <code
        className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-[11px] text-indigo-600 font-semibold"
        {...props}
      >
        {children}
      </code>
    );
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 font-semibold underline hover:text-indigo-800"
    >
      {children}
    </a>
  ),
};

const AiBotView = ({ onOpenProModal, tasks = [] }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "👋 Hi! I'm **AI Bot**, your StudyTrack AI study advisor. Ask me anything about your studies, or use the quick actions below to generate study plans, flashcards, or revision strategies!",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModalAction, setActiveModalAction] = useState(null); // 'study_plan', 'flashcards', 'revise', 'exam', 'explain'

  // Input states for quick action modals/prompts
  const [topicInput, setTopicInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [timeInput, setTimeInput] = useState('3 hours/day');
  const [examDateInput, setExamDateInput] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Extract pending tasks summary context to help Gemini prioritize real tasks
  const getContextString = () => {
    if (!tasks || tasks.length === 0) return null;
    const pending = tasks.filter((t) => t.status === 'Pending').slice(0, 5);
    if (pending.length === 0) return null;
    return `User's Pending Tasks:\n` + pending.map((t) => `- ${t.title} (${t.subject}), Due: ${new Date(t.deadline).toLocaleDateString()}`).join('\n');
  };

  const handleSendMessage = async (customQuery = null, actionType = null, extraPayload = {}) => {
    const textToSend = customQuery || inputText;
    if (!textToSend.trim() && !actionType) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputText('');
    setLoading(true);

    try {
      const payload = {
        query: textToSend,
        action: actionType,
        context: getContextString(),
        ...extraPayload,
      };

      const res = await aiAPI.getStudyAdvice(payload);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply || 'Here are your personalized study suggestions.',
        timestamp: new Date(),
        actionType,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Error fetching AI study advice:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: '⚠️ AI Bot is temporarily unavailable. Please check your backend network or GEMINI_API_KEY in backend/.env.',
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickActionSubmit = (action) => {
    if (action === 'create_study_plan') {
      const prompt = `Create a study plan for ${subjectInput || 'DBMS'}`;
      handleSendMessage(prompt, 'create_study_plan', {
        subject: subjectInput,
        availableHours: timeInput,
        examDate: examDateInput,
      });
    } else if (action === 'create_flashcards') {
      const prompt = `Create 6 flashcards for ${topicInput || 'DBMS Normalization'}`;
      handleSendMessage(prompt, 'create_flashcards', { topic: topicInput });
    } else if (action === 'help_me_revise') {
      const prompt = `Help me revise ${topicInput || 'Operating Systems'}`;
      handleSendMessage(prompt, 'help_me_revise', { topic: topicInput });
    } else if (action === 'prepare_for_exam') {
      const prompt = `Create exam preparation strategy for ${subjectInput || 'Data Structures'}`;
      handleSendMessage(prompt, 'prepare_for_exam', {
        subject: subjectInput,
        availableHours: timeInput,
        examDate: examDateInput,
      });
    } else if (action === 'explain_topic') {
      const prompt = `Explain the topic: ${topicInput || 'Memory Paging'}`;
      handleSendMessage(prompt, 'explain_topic', { topic: topicInput });
    }

    // Reset modal inputs
    setActiveModalAction(null);
    setTopicInput('');
    setSubjectInput('');
  };

  // Helper to parse Q&A Flashcards out of text response for card UI
  const parseFlashcards = (text) => {
    const cards = [];
    const lines = text.split('\n');
    let currentQ = '';
    let currentA = '';

    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Q:') || trimmed.match(/^Q\d*:/i) || trimmed.startsWith('Question:')) {
        if (currentQ && currentA) {
          cards.push({ question: currentQ, answer: currentA });
          currentA = '';
        }
        currentQ = trimmed.replace(/^Q\d*:\s*/i, '').replace(/^Question:\s*/i, '');
      } else if (trimmed.startsWith('A:') || trimmed.match(/^A\d*:/i) || trimmed.startsWith('Answer:')) {
        currentA = trimmed.replace(/^A\d*:\s*/i, '').replace(/^Answer:\s*/i, '');
      }
    }
    if (currentQ && currentA) {
      cards.push({ question: currentQ, answer: currentA });
    }
    return cards;
  };

  // IF FREE USER -> Render Polished PRO Locked Card
  if (!user?.isPro) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                AI Bot
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Get personalized study suggestions and planning help.
              </p>
            </div>
          </div>
        </div>

        {/* Polished Locked PRO Card */}
        <div className="max-w-2xl mx-auto bg-[#0F172A] border border-amber-500/30 p-8 sm:p-10 rounded-3xl shadow-modal text-white text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
              PRO Feature
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-2">
              🔒 AI Bot is a PRO Feature
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto font-medium">
              Get personalized AI-powered study plans, flashcards, exam revision strategies, and topic explanations with StudyTrack PRO.
            </p>
          </div>

          {/* Quick Action Preview Pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-2 text-xs font-semibold text-slate-400">
            <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">✨ Create Study Plan</span>
            <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">🗂️ Generate Flashcards</span>
            <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">🎯 Prepare for Exam</span>
          </div>

          <div className="pt-4">
            <button
              onClick={onOpenProModal}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition cursor-pointer flex items-center justify-center space-x-2 mx-auto"
            >
              <Crown className="w-5 h-5 fill-slate-950" />
              <span>Upgrade to PRO</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PRO USER INTERFACE
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-card flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4F46E5] text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Bot
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Get personalized study suggestions and planning help.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/30">
          <Crown className="w-3.5 h-3.5 fill-amber-500/30" />
          <span>PRO Unlocked</span>
        </span>
      </div>

      {/* Main Chat & Quick Actions Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-card flex flex-col overflow-hidden">
        {/* Messages Stream */}
        <div className="max-h-[520px] min-h-[140px] p-6 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            const flashcards = isBot ? parseFlashcards(msg.text) : [];

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isBot
                      ? 'bg-white border border-slate-200 text-slate-800 shadow-2xs font-medium space-y-2'
                      : 'bg-[#4F46E5] text-white font-semibold shadow-md shadow-indigo-600/20'
                  }`}
                >
                  {/* Render Markdown for Bot responses, plain text for user */}
                  {isBot ? (
                    <div className="prose prose-slate max-w-none text-slate-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}

                  {/* Render Parsed Flashcards inside AI Bot stream if detected */}
                  {flashcards.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-1">
                        <Layers className="w-4 h-4" />
                        <span>Interactive Flashcards ({flashcards.length})</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {flashcards.map((card, idx) => (
                          <div
                            key={idx}
                            className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl space-y-1 text-xs"
                          >
                            <p className="font-bold text-indigo-900">Q: {card.question}</p>
                            <p className="text-slate-700 font-medium">A: {card.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <span
                    className={`block text-[10px] pt-1 text-right font-normal ${
                      isBot ? 'text-slate-400' : 'text-indigo-200'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl text-xs text-slate-500 font-semibold flex items-center space-x-2 shadow-2xs">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>AI Bot is thinking & analyzing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Buttons Toolbar */}
        <div className="p-3 bg-slate-100/70 border-t border-slate-200/80 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider px-2 shrink-0">
            Quick Actions:
          </span>

          <button
            onClick={() => setActiveModalAction('create_study_plan')}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-2xs transition shrink-0 cursor-pointer flex items-center space-x-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Create Study Plan</span>
          </button>

          <button
            onClick={() => setActiveModalAction('create_flashcards')}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-2xs transition shrink-0 cursor-pointer flex items-center space-x-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Create Flashcards</span>
          </button>

          <button
            onClick={() => setActiveModalAction('help_me_revise')}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-2xs transition shrink-0 cursor-pointer flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Help Me Revise</span>
          </button>

          <button
            onClick={() => setActiveModalAction('prepare_for_exam')}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-2xs transition shrink-0 cursor-pointer flex items-center space-x-1.5"
          >
            <Flame className="w-3.5 h-3.5 text-indigo-600" />
            <span>Prepare for an Exam</span>
          </button>

          <button
            onClick={() => setActiveModalAction('explain_topic')}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-2xs transition shrink-0 cursor-pointer flex items-center space-x-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Explain a Topic</span>
          </button>
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3">
          <input
            type="text"
            value={inputText}
            disabled={loading}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask AI Bot how to study..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
            className="px-5 py-3 bg-[#4F46E5] hover:bg-indigo-600 active:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>

      {/* Quick Action Dialog Popup */}
      {activeModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setActiveModalAction(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-modal z-10 p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>
                {activeModalAction === 'create_study_plan' && 'Create Study Plan'}
                {activeModalAction === 'create_flashcards' && 'Create Flashcards'}
                {activeModalAction === 'help_me_revise' && 'Help Me Revise'}
                {activeModalAction === 'prepare_for_exam' && 'Prepare for an Exam'}
                {activeModalAction === 'explain_topic' && 'Explain a Topic'}
              </span>
            </h3>

            {/* Form Fields according to action type */}
            <div className="space-y-3 text-xs">
              {(activeModalAction === 'create_study_plan' || activeModalAction === 'prepare_for_exam') && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Subject / Course Name</label>
                  <input
                    type="text"
                    placeholder="e.g. DBMS, Computer Networks, Operating Systems"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {(activeModalAction === 'create_flashcards' || activeModalAction === 'help_me_revise' || activeModalAction === 'explain_topic') && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Topic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. DBMS Normalization, Process Synchronization, Paging"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {(activeModalAction === 'create_study_plan' || activeModalAction === 'prepare_for_exam') && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Available Daily Hours</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 hours/day"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800">Exam Date / Days Remaining</label>
                    <input
                      type="text"
                      placeholder="e.g. 7 days from now, Oct 15"
                      value={examDateInput}
                      onChange={(e) => setExamDateInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveModalAction(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleQuickActionSubmit(activeModalAction)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Generate with AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiBotView;
