'use client';

import { useEffect, useRef } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface Bot {
  id: string;
  name: string;
  description?: string;
  model: string;
  avatar?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TestChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: Bot | null;
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoading?: boolean;
}

export function TestChatModal({
  isOpen,
  onClose,
  bot,
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading = false,
}: TestChatModalProps) {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !bot) return null;

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && inputValue.trim()) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="relative mx-auto w-full max-w-3xl bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl border border-white/60 flex flex-col max-h-[70vh] transition-all transform"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 md:px-8 md:py-6 border-b border-white/70 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg flex items-center justify-center text-lg flex-shrink-0 shadow-md">
                {bot.avatar || '🤖'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {bot.name}
                </h3>
                <p className="text-xs text-gray-400 truncate">
                  {bot.model || 'Model not set'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 overflow-y-auto px-6 py-4 min-h-0 ${
            theme === 'dark' 
              ? 'bg-gradient-to-b from-[#F5E6D3] via-[#E8D5C4] to-[#D4C4B0]'
              : 'bg-gradient-to-b from-white via-[#F7EAFB] to-[#FDEFF6]'
          }`}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Start a conversation with {bot.name}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 text-sm shadow-sm ${
                        message.role === 'user'
                          ? 'bg-accent-soft text-white'
                          : theme === 'dark'
                            ? 'bg-[#F5E6D3] text-gray-800'
                            : 'bg-white/90 text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`${theme === 'dark' ? 'bg-[#F5E6D3]' : 'bg-white/90'} text-gray-800 px-4 py-2.5 shadow-sm`}>
                      <div className="flex items-center space-x-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="border-t border-white/60 bg-white/70 backdrop-blur-lg px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-white/90 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-accent-soft/60 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={onSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-accent-soft px-5 py-2 text-sm font-medium text-white shadow hover:bg-accent-soft/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

