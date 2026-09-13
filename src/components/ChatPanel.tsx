import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../playgroundStore';

interface ChatPanelProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  systemPrompt: string;
  routerMode: string;
  onSendMessage: (message: string) => void;
  onSetSystemPrompt: (prompt: string) => void;
  onSetRouterMode: (mode: string) => void;
  onClear: () => void;
}

export function ChatPanel({
  messages,
  isStreaming,
  systemPrompt,
  routerMode,
  onSendMessage,
  onSetSystemPrompt,
  onSetRouterMode,
  onClear,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col bg-[#2d2d2d] rounded-lg border border-[#3a3a3a] overflow-hidden flex-1">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3a3a3a]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">Chat</h2>
          <select
            value={routerMode}
            onChange={(e) => onSetRouterMode(e.target.value)}
            className="text-xs bg-[#3a3a3a] text-white px-2 py-1 rounded border border-[#4a4a4a] focus:outline-none focus:border-[#0a84ff]"
          >
            <option value="keyword_v3">Router: keyword_v3</option>
            <option value="v3q_diagnostic">Router: v3q_diagnostic</option>
            <option value="oracle">Router: oracle</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className="text-xs text-[#8e8e93] hover:text-white px-2 py-1 rounded hover:bg-[#3a3a3a] transition-colors"
          >
            System Prompt
          </button>
          <button
            onClick={onClear}
            className="text-xs text-[#8e8e93] hover:text-white px-2 py-1 rounded hover:bg-[#3a3a3a] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* System Prompt Editor */}
      {showSystemPrompt && (
        <div className="px-4 py-3 border-b border-[#3a3a3a] bg-[#1e1e1e]">
          <label className="text-xs text-[#8e8e93] mb-2 block">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => onSetSystemPrompt(e.target.value)}
            className="w-full bg-[#2d2d2d] text-white text-sm px-3 py-2 rounded border border-[#3a3a3a] focus:outline-none focus:border-[#0a84ff] resize-none"
            rows={3}
            placeholder="Enter system prompt..."
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#636366] text-sm">
            Start a conversation to test your adapters
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[#0a84ff] text-white'
                      : 'bg-[#3a3a3a] text-white'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                  {msg.role === 'assistant' && msg.ttft !== undefined && (
                    <div className="text-xs text-[#8e8e93] mt-2 flex items-center gap-3">
                      <span>{msg.ttft}ms TTFT</span>
                      <span>{msg.tokensPerSec?.toFixed(1)} tok/s</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-[#3a3a3a] rounded-lg px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[#3a3a3a] p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
            disabled={isStreaming}
            className="flex-1 bg-[#1e1e1e] text-white text-sm px-4 py-2 rounded border border-[#3a3a3a] focus:outline-none focus:border-[#0a84ff] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="bg-[#0a84ff] text-white text-sm px-4 py-2 rounded hover:bg-[#0a75e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
