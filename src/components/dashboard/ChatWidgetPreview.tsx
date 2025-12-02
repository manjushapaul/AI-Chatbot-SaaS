'use client';

import { X, Send } from 'lucide-react';

interface ChatWidgetPreviewProps {
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

export function ChatWidgetPreview({
  title = 'Live chat',
  welcomeMessage = 'Hello! How can I help you today?',
  primaryColor = '#2563EB',
  secondaryColor = '#F5F5F5',
  theme = 'light',
  size = 'medium',
  showAvatar = true,
  botInitials = 'AI',
}: ChatWidgetPreviewProps) {
  // Size-based styling
  const sizeConfig = {
    small: {
      width: 'w-[320px]',
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

  const config = sizeConfig[size];

  // Sample messages for preview
  const sampleMessages: Message[] = [
    {
      id: '1',
      content: welcomeMessage,
      role: 'assistant',
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
    },
    {
      id: '2',
      content: 'Hello! I need help with my order.',
      role: 'user',
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
    },
  ];

  // Theme-based colors
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

  return (
    <div
      className={`${config.width} ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md border flex flex-col overflow-hidden`}
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
          minHeight: '280px',
          maxHeight: '400px',
        }}
      >
        <div className="p-4 space-y-4">
          {sampleMessages.map((message, index) => {
            const isUser = message.role === 'user';
            const showTimestamp =
              index === 0 ||
              sampleMessages[index - 1].timestamp.getTime() !==
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
            type="text"
            placeholder="Type your message…"
            className={`flex-1 ${config.inputText} ${config.inputPadding} rounded-md border focus:outline-none focus:ring-2`}
            style={{
              backgroundColor: isDark ? '#4B5563' : '#FFFFFF',
              borderColor: borderColor,
              color: textColor,
              '--tw-ring-color': primaryColor,
            } as React.CSSProperties}
            readOnly
          />
          <button
            className={`${config.buttonPadding} ${config.buttonText} font-medium rounded-md text-white flex items-center gap-1.5 flex-shrink-0 transition-colors hover:opacity-90`}
            style={{ backgroundColor: primaryColor }}
            disabled
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

