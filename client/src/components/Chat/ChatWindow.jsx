import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  Trash2, 
  Loader2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import { api } from '../../services/api';

export default function ChatWindow({ documents = [], selectedDocId, setSelectedDocId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      answer: "NexusRAG is active. Ask questions grounded strictly in your indexed documents. Answers include source citations and similarity scores.",
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

    const userMsg = { role: 'user', content: questionText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
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
      setError(err.message || 'Retrieval failed.');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          answer: `**Retrieval Error:** ${err.message || 'Unable to retrieve answer.'}`,
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
        answer: 'Chat reset. Enter a query regarding your indexed documents.',
        sources: [],
        isGrounded: true
      }
    ]);
    setError(null);
  };

  const samplePrompts = [
    "Summarize the executive summary and main findings.",
    "What methodology or architecture is proposed?",
    "List the critical constraints and limitations.",
    "Extract key numbers, metrics, and dates mentioned."
  ];

  const targetDocName = documents.find(d => d.id === selectedDocId)?.filename;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] relative overflow-hidden">
      {/* Scope Subheader */}
      <div className="px-6 py-2 bg-[#000000] border-b border-[#222222] flex items-center justify-between text-xs text-[#888888]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[#666666]">TARGET:</span>
          {targetDocName ? (
            <span className="text-white font-mono bg-[#141414] px-2 py-0.5 rounded border border-[#262626]">
              {targetDocName}
            </span>
          ) : (
            <span className="text-white font-mono">
              All Documents ({documents.length})
            </span>
          )}
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 text-[#666666] hover:text-white transition-colors text-xs font-mono"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-5">
            <div className="flex gap-2.5 max-w-[80%] items-center">
              <div className="w-7 h-7 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#222222] text-[#888888] text-xs font-mono">
                Searching vector index and synthesizing grounded answer...
              </div>
            </div>
          </div>
        )}

        {/* Suggestion prompt cards on initial turn */}
        {messages.length === 1 && documents.length > 0 && (
          <div className="mt-8 p-5 rounded-lg bg-[#0a0a0a] border border-[#222222] max-w-xl mx-auto">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#666666] mb-3">
              Suggested Inquiries
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-left p-2.5 rounded-md bg-[#000000] hover:bg-[#141414] border border-[#262626] hover:border-[#404040] text-xs text-[#cccccc] hover:text-white transition-colors"
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
      <div className="p-4 bg-[#000000] border-t border-[#222222]">
        <div className="max-w-3xl mx-auto space-y-2">
          {error && (
            <div className="p-2.5 rounded-md bg-[#141414] border border-[#333333] text-white text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#888888]" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative rounded-lg bg-[#0a0a0a] border border-[#262626] focus-within:border-[#555555] transition-colors">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                documents.length === 0
                  ? "Upload a document to begin querying..."
                  : targetDocName
                  ? `Ask about ${targetDocName}...`
                  : "Ask a grounded question across all documents..."
              }
              disabled={isLoading}
              className="w-full bg-transparent text-white placeholder-[#555555] text-xs p-3 pr-14 focus:outline-none resize-none leading-relaxed"
            />

            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="w-7 h-7 rounded-md bg-white hover:bg-[#e5e5e5] disabled:opacity-30 disabled:hover:bg-white text-black flex items-center justify-center transition-colors"
                title="Send"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#555555] font-mono px-1">
            <span>Grounded RAG Pipeline</span>
            <span>Enter to send • Shift+Enter for newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
