import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setStreaming(true);

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMsg]);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Chat failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + delta };
                }
                return updated;
              });
            }
          } catch {
            // non-JSON SSE line, skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message);
      // Remove empty assistant message on error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <h2 className="text-xl font-semibold text-slate-100">Chat</h2>
        <p className="text-sm text-slate-400 mt-1">Chat with your OpenClaw agent</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Send a message to start chatting with your agent.
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 rounded p-3">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your agent… (Enter to send, Shift+Enter for newline)"
            rows={2}
            disabled={streaming}
            className="flex-1 resize-none bg-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          {streaming ? (
            <button
              onClick={stop}
              className="self-end px-4 py-2 text-sm font-medium bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => void send()}
              disabled={!input.trim()}
              className="self-end px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-200'
        }`}
      >
        {message.content || <span className="opacity-50">▋</span>}
      </div>
    </div>
  );
}
