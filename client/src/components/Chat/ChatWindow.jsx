import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  Trash2, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import { api } from '../../services/api';

export default function ChatWindow({ documents = [], selectedDocId, setSelectedDocId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      answer: "Ask a question about your uploaded documents to get answers with source citations.",
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    const questionText = input.trim();
    if (!questionText || isLoading) return;

    setError(null);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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
      setError(err.message || 'Failed to retrieve answer.');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          answer: `Could not retrieve an answer: ${err.message || 'Please check your connection and try again.'}`,
          sources: []
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
        answer: 'Chat cleared. Ask a question about your documents to begin.',
        sources: []
      }
    ]);
    setError(null);
  };

  const targetDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] relative overflow-hidden">
      {/* Scrollable Conversation Column */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header Action Row */}
          {messages.length > 1 && (
            <div className="flex justify-end pb-2">
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1.5 text-xs text-[#71717a] hover:text-[#e4e4e7] transition-colors py-1 px-2 rounded hover:bg-[#18181b]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear chat</span>
              </button>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 py-4 text-[#a1a1aa] text-[15px]">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Searching documents and generating answer...</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-[#1c1214] border border-[#3f1d24] text-[#fca5a5] text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#f87171]" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Bottom Input Area */}
      <div className="p-4 sm:p-6 bg-[#09090b]/90 backdrop-blur-sm border-t border-[#27272a]/60">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl bg-[#141416] border border-[#27272a] focus-within:border-[#52525b] transition-colors shadow-lg">
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                documents.length === 0
                  ? "Upload a document to start asking questions..."
                  : targetDoc
                  ? `Ask about ${targetDoc.filename}...`
                  : "Ask a question about your documents..."
              }
              disabled={isLoading}
              className="w-full bg-transparent text-white placeholder-[#71717a] text-[16px] p-4 pr-14 focus:outline-none resize-none leading-relaxed min-h-[56px] max-h-[160px]"
            />

            <div className="absolute right-3 bottom-3 flex items-center">
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 rounded-xl bg-white hover:bg-[#e4e4e7] disabled:opacity-20 disabled:hover:bg-white text-black flex items-center justify-center transition-all shadow"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <ArrowUp className="w-5 h-5 text-black stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
