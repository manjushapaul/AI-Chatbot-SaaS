'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

interface PopupChatWidgetProps {
  title?: string;
  welcomeMessage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  showAvatar?: boolean;
  botInitials?: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export function PopupChatWidget({
  title = 'Chat with us',
  welcomeMessage = 'Hello! How can I help you today?',
  primaryColor = '#121212',
  secondaryColor = '#ffffff',
  theme = 'light',
  size = 'large',
  showAvatar = false,
  botInitials = 'AI',
}: PopupChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ensure component only renders on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && welcomeMessage) {
      setMessages([
        {
          id: '1',
          content: welcomeMessage || 'Hello! How can I help you today?',
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
    }
  }, [welcomeMessage, messages.length]);

  // Update welcome message when it changes (if it's the first message)
  useEffect(() => {
    if (messages.length > 0 && messages[0]?.role === 'assistant' && welcomeMessage) {
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[0] && newMessages[0].role === 'assistant' && newMessages[0].content !== welcomeMessage) {
          newMessages[0] = {
            ...newMessages[0],
            content: welcomeMessage,
          };
        }
        return newMessages;
      });
    }
  }, [welcomeMessage, messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key to close popup
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Thank you for your message! This is a preview. In production, the bot will respond based on your knowledge base.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Size-based styling
  const sizeConfig = {
    small: {
      width: 'w-[320px]',
      height: 'h-[480px]',
      headerHeight: 'h-[52px]',
      headerPadding: 'px-4',
      headerTitle: 'text-[14px]',
      headerSubtitle: 'text-[11px]',
      messageText: 'text-[12px]',
      messagePadding: 'px-3 py-2',
      inputText: 'text-[12px]',
      inputPadding: 'px-3 py-2',
      buttonPadding: 'px-3 py-2',
      buttonText: 'text-[12px]',
      avatarSize: 'w-5 h-5',
      avatarText: 'text-[10px]',
    },
    medium: {
      width: 'w-[380px]',
      height: 'h-[560px]',
      headerHeight: 'h-[56px]',
      headerPadding: 'px-4',
      headerTitle: 'text-[15px]',
      headerSubtitle: 'text-[12px]',
      messageText: 'text-[13px]',
      messagePadding: 'px-3.5 py-2.5',
      inputText: 'text-[13px]',
      inputPadding: 'px-3.5 py-2.5',
      buttonPadding: 'px-4 py-2.5',
      buttonText: 'text-[13px]',
      avatarSize: 'w-6 h-6',
      avatarText: 'text-[11px]',
    },
    large: {
      width: 'w-[420px]',
      height: 'h-[600px]',
      headerHeight: 'h-[56px]',
      headerPadding: 'px-4',
      headerTitle: 'text-[16px]',
      headerSubtitle: 'text-[13px]',
      messageText: 'text-[14px]',
      messagePadding: 'px-4 py-3',
      inputText: 'text-[14px]',
      inputPadding: 'px-4 py-3',
      buttonPadding: 'px-5 py-3',
      buttonText: 'text-[14px]',
      avatarSize: 'w-6 h-6',
      avatarText: 'text-[12px]',
    },
  };

  // Ensure size is valid, default to 'large' if not
  const validSize = size && size in sizeConfig ? size : 'large';
  const config = sizeConfig[validSize];

  // Theme-based colors - ensure theme is valid
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1F2937' : '#F5F5F5';
  const messageBg = isDark ? '#374151' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const borderColor = isDark ? '#4B5563' : '#E5E7EB';
  const mutedText = isDark ? '#9CA3AF' : '#6B7280';

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  // Don't render until mounted (client-side only)
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
        style={{ backgroundColor: primaryColor }}
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Popup Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 ${config.width} ${config.height} ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl border flex flex-col overflow-hidden z-50`}
          style={{
            borderColor: borderColor,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {/* Header */}
          <div
            className={`${config.headerHeight} ${config.headerPadding} flex items-center justify-between`}
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {showAvatar && (
                <div
                  className={`${config.avatarSize} rounded-full bg-white/20 flex items-center justify-center flex-shrink-0`}
                  style={{ border: '1px solid rgba(255, 255, 255, 0.3)' }}
                >
                  <span
                    className={`${config.avatarText} font-semibold text-white`}
                  >
                    {botInitials}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3
                  className={`${config.headerTitle} font-semibold text-white truncate`}
                >
                  {title}
                </h3>
                <p
                  className={`${config.headerSubtitle} text-white/80 truncate`}
                  style={{ opacity: 0.9 }}
                >
                  Typically replies in a few minutes
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-white/80 transition-colors p-1 flex-shrink-0"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              backgroundColor: bgColor,
            }}
          >
            <div className="p-4 space-y-4">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                const showTimestamp =
                  index === 0 ||
                  messages[index - 1].timestamp.getTime() !==
                    message.timestamp.getTime();

                return (
                  <div key={message.id} className="space-y-1">
                    {showTimestamp && (
                      <div className="text-center mb-2">
                        <span
                          className={`${config.headerSubtitle}`}
                          style={{ color: mutedText }}
                        >
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] ${config.messagePadding} rounded-lg ${config.messageText} leading-relaxed`}
                        style={{
                          backgroundColor: isUser ? primaryColor : messageBg,
                          color: isUser ? '#FFFFFF' : textColor,
                          border: isUser
                            ? 'none'
                            : `1px solid ${borderColor}`,
                        }}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Bar */}
          <div
            className="p-4 border-t"
            style={{
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              borderColor: borderColor,
            }}
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`flex-1 ${config.inputText} ${config.inputPadding} rounded-md border focus:outline-none focus:ring-2`}
                style={{
                  backgroundColor: isDark ? '#4B5563' : '#FFFFFF',
                  borderColor: borderColor,
                  color: textColor,
                  '--tw-ring-color': primaryColor,
                } as React.CSSProperties}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`${config.buttonPadding} ${config.buttonText} font-medium rounded-md text-white flex items-center gap-1.5 flex-shrink-0 transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

