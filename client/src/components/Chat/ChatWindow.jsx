import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  FileText, 
  AlertCircle,
  Loader2,
  HelpCircle,
  Compass
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import { api } from '../../services/api';

export default function ChatWindow({ documents = [], selectedDocId, setSelectedDocId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      answer: "Hello! I am **NexusRAG**, your dedicated knowledge intelligence assistant. I provide accurate, factual answers grounded strictly in your uploaded PDF and DOCX documents with automated source citations and zero hallucination.\n\nUpload a document or select one above to begin querying!",
      sources: [],
      isGrounded: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (customPrompt) => {
    const questionText = (customPrompt || input).trim();
    if (!questionText || isLoading) return;

    setError(null);
    setInput('');

    // Append user message
    const userMsg = { role: 'user', content: questionText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build conversation history (previous turns)
      const history = updatedMessages
        .filter(m => m.content || m.answer)
        .map(m => ({
          role: m.role,
          content: m.role === 'user' ? m.content : m.answer
        }));

      const response = await api.chat({
        question: questionText,
        documentId: selectedDocId,
        conversationHistory: history,
        topK: 4
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          answer: response.answer,
          sources: response.sources || [],
          metrics: response.metrics,
          isGrounded: response.isGrounded
        }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to generate answer from NexusRAG pipeline.');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          answer: `**Retrieval Error:** ${err.message || 'Unable to complete retrieval. Please verify your document indexing and try again.'}`,
          sources: [],
          isGrounded: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        answer: 'Chat cleared. Ask any question about your indexed documents!',
        sources: [],
        isGrounded: true
      }
    ]);
    setError(null);
  };

  const samplePrompts = [
    "Summarize the executive summary and main findings.",
    "What methodology or architecture is proposed?",
    "List the critical constraints, limitations, and risks.",
    "Extract all key metrics, numbers, and deadlines mentioned."
  ];

  const targetDocName = documents.find(d => d.id === selectedDocId)?.filename;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0e18] relative overflow-hidden">
      {/* Scope Header Banner */}
      <div className="px-8 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Active Scope:</span>
          {targetDocName ? (
            <span className="font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {targetDocName}
            </span>
          ) : (
            <span className="font-semibold text-slate-200">
              All Indexed Documents ({documents.length})
            </span>
          )}
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors text-xs font-medium"
          title="Clear current chat"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-6">
            <div className="flex gap-3 max-w-[80%] items-center">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-[#131b2e] border border-slate-800 text-slate-300 text-sm flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                <span>Searching vector index & generating grounded answer with Gemini...</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State / Suggestions when only greeting exists */}
        {messages.length === 1 && documents.length > 0 && (
          <div className="mt-8 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Compass className="w-4 h-4" /> Quick Inquiry Suggestions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-left p-3 rounded-xl bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 text-xs text-slate-300 transition-all leading-relaxed"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-6 bg-[#0d121f]/90 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto space-y-2">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative rounded-xl bg-slate-900 border border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 shadow-lg">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                documents.length === 0
                  ? "Upload a document first to start querying..."
                  : targetDocName
                  ? `Ask anything about ${targetDocName}... (Press Enter to send)`
                  : "Ask a grounded question across all indexed documents... (Press Enter to send)"
              }
              disabled={isLoading}
              className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm p-3.5 pr-24 focus:outline-none resize-none leading-relaxed"
            />

            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/30 active:scale-95"
                title="Send Question"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Powered by Gemini 1.5 & Qdrant Cosine Vector Search</span>
            <span>Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
