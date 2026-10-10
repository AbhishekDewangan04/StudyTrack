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
  HelpCircle,
  Lock,
  Layers,
} from 'lucide-react';

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-xl font-black text-white tracking-tight mt-3 mb-2 pb-1 border-b border-[#191B2B] font-display">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-white tracking-tight mt-3 mb-1.5 flex items-center gap-1.5 font-display">
      <span className="w-1.5 h-4 bg-[#9B6BFF] rounded-full inline-block shrink-0" />
      <span>{children}</span>
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold text-slate-100 mt-2 mb-1">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed my-1.5 font-normal">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-extrabold text-white">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-slate-300">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 my-2 text-xs sm:text-sm text-slate-300 pl-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1.5 my-2 text-xs sm:text-sm text-slate-300 pl-1">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed font-normal">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-[#9B6BFF] bg-[#9B6BFF]/10 p-3 my-2.5 rounded-r-xl text-xs text-[#C4A7FF] italic font-medium">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-t border-[#191B2B] my-3" />,
  code: ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match) {
      return (
        <div className="my-3 rounded-2xl overflow-hidden bg-[#090B12] border border-[#191B2B] text-slate-100 shadow-xl">
          <div className="px-4 py-1.5 bg-[#111522] border-b border-[#191B2B] text-[10px] font-bold uppercase tracking-wider text-[#C4A7FF] flex items-center justify-between">
            <span>{match[1]}</span>
            <span>Code Snippet</span>
          </div>
          <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-[#C4A7FF]">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    }
    return (
      <code
        className="px-1.5 py-0.5 bg-[#111522] border border-[#191B2B] rounded-md font-mono text-[11px] text-[#C4A7FF] font-semibold"
        {...props}
      >
        {children}
      </code>
    );
  },
};

const AiBotView = ({ onOpenProModal, tasks = [] }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "👋 Hi! I'm **AI Assistant**, your StudyTrack personal academic guide. Ask me anything about your assignments, or use quick actions to generate study plans, flashcards, or revision strategies!",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModalAction, setActiveModalAction] = useState(null);

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
        text: res.reply || 'Here are your study suggestions.',
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
          text: '⚠️ AI Assistant is temporarily unavailable. Please check your backend network setup.',
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
      const prompt = `Create exam strategy for ${subjectInput || 'Data Structures'}`;
      handleSendMessage(prompt, 'prepare_for_exam', {
        subject: subjectInput,
        availableHours: timeInput,
        examDate: examDateInput,
      });
    } else if (action === 'explain_topic') {
      const prompt = `Explain topic: ${topicInput || 'Memory Paging'}`;
      handleSendMessage(prompt, 'explain_topic', { topic: topicInput });
    }

    setActiveModalAction(null);
    setTopicInput('');
    setSubjectInput('');
  };

  const cleanMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*\*+/g, '')
      .replace(/---+/g, '---')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  };

  // IF FREE USER -> Render Polished PRO Locked Card
  if (!user?.isPro) {
    return (
      <div className="space-y-6">
        <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9B6BFF] text-white flex items-center justify-center font-bold shadow-md shadow-[#9B6BFF]/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                AI Study Assistant
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                Personalized study guidance powered by Gemini AI
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-[#191B2B] border border-[#FFBF69]/30 p-8 sm:p-10 rounded-3xl shadow-2xl text-white text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-[#FFBF69]/20 border border-[#FFBF69]/40 flex items-center justify-center text-[#FFBF69] mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-[#FFBF69] uppercase tracking-widest px-3 py-1 bg-[#FFBF69]/10 rounded-full border border-[#FFBF69]/20">
              PRO FEATURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-2 font-display">
              AI Assistant Unlocks with PRO
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto font-medium">
              Generate custom study plans, flashcards, topic summaries, and exam strategies.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenProModal}
              className="px-8 py-3.5 bg-[#FFBF69] hover:bg-[#ffe3b3] text-[#090B12] font-black text-xs rounded-2xl shadow-xl transition cursor-pointer flex items-center justify-center space-x-2 mx-auto uppercase tracking-wider"
            >
              <Crown className="w-4 h-4 fill-[#090B12]" />
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
      <div className="bg-[#191B2B] border border-[#191B2B] p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#9B6BFF] text-white flex items-center justify-center font-bold shadow-md shadow-[#9B6BFF]/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
              AI Study Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              Personalized learning companion
            </p>
          </div>
        </div>

        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFBF69]/10 text-[#FFBF69] border border-[#FFBF69]/30">
          <Crown className="w-3.5 h-3.5 fill-[#FFBF69]/30" />
          <span>PRO Active</span>
        </span>
      </div>

      <div className="bg-[#191B2B] border border-[#191B2B] rounded-3xl shadow-xl flex flex-col overflow-hidden">
        {/* Messages Stream */}
        <div className="max-h-[500px] min-h-[160px] p-6 overflow-y-auto space-y-4 bg-[#090B12]/80">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-xl bg-[#9B6BFF] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isBot
                      ? 'bg-[#111522] border border-[#191B2B] text-slate-200 shadow-md space-y-2'
                      : 'bg-[#9B6BFF] text-white font-semibold shadow-md'
                  }`}
                >
                  {isBot ? (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {cleanMarkdown(msg.text)}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}

                  <span
                    className={`block text-[10px] pt-1 text-right font-normal ${
                      isBot ? 'text-slate-500' : 'text-[#C4A7FF]'
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
              <div className="w-8 h-8 rounded-xl bg-[#9B6BFF] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-[#111522] border border-[#191B2B] px-4 py-3 rounded-2xl text-xs text-slate-400 font-semibold flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#FFBF69] animate-spin" />
                <span>AI Assistant is generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Pills */}
        <div className="p-3 bg-[#111522] border-t border-[#191B2B] flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider px-2 shrink-0">
            Prompts:
          </span>

          <button
            onClick={() => handleSendMessage("Explain dynamic programming with an example.", 'explain_topic')}
            className="px-3 py-1.5 bg-[#191B2B] hover:bg-[#9B6BFF]/20 border border-[#191B2B] text-slate-300 font-bold rounded-xl transition shrink-0 cursor-pointer flex items-center space-x-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#9B6BFF]" />
            <span>Explain DP</span>
          </button>

          <button
            onClick={() => handleSendMessage("Create 5 revision flashcards for DBMS Normalization.", 'create_flashcards')}
            className="px-3 py-1.5 bg-[#191B2B] hover:bg-[#9B6BFF]/20 border border-[#191B2B] text-slate-300 font-bold rounded-xl transition shrink-0 cursor-pointer flex items-center space-x-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-[#FFBF69]" />
            <span>DBMS Flashcards</span>
          </button>
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-[#191B2B] border-t border-[#111522] flex items-center space-x-3">
          <input
            type="text"
            value={inputText}
            disabled={loading}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about your studies..."
            className="flex-1 px-4 py-3 bg-[#090B12] border border-[#111522] rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-[#9B6BFF]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
            className="px-5 py-3 gradient-btn-purple text-white font-extrabold text-xs rounded-2xl cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiBotView;
