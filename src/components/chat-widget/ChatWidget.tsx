'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Minimize2, Maximize2, MessageCircle, Bot } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatWidgetProps {
  widgetId: string;
  botId: string;
  config: {
    theme: 'light' | 'dark' | 'auto';
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'inline';
    size: 'small' | 'medium' | 'large';
    welcomeMessage: string;
    primaryColor: string;
    secondaryColor: string;
    showAvatar: boolean;
    showBranding: boolean;
    autoOpen: boolean;
    chatTitle: string;
  };
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

export default function ChatWidget({
  widgetId,
  botId,
  config,
  onClose,
  onMinimize,
  onMaximize
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(config.autoOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-open effect
  useEffect(() => {
    if (config.autoOpen) {
      setIsOpen(true);
    }
  }, [config.autoOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Load conversation history if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      loadConversationHistory();
    }
  }, [conversationId]);

  const loadConversationHistory = async () => {
    if (!conversationId) return;
    
    try {
      const response = await fetch(`/api/chat/public?conversationId=${conversationId}&botId=${botId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.messages) {
          const historyMessages: Message[] = data.data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role as 'user' | 'assistant',
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(historyMessages);
        }
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          botId,
          conversationId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: data.data.message,
            role: 'assistant',
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, assistantMessage]);
          
          if (!conversationId) {
            setConversationId(data.data.conversationId);
          }
        }
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Determine theme based on config and system preference
  const getTheme = () => {
    if (config.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return config.theme;
  };

  const theme = getTheme();
  const isDark = theme === 'dark';

  // Size classes
  const sizeClasses = {
    small: 'w-80 h-96',
    medium: 'w-96 h-[28rem]',
    large: 'w-[28rem] h-[32rem]',
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    'inline': 'relative',
  };

  if (config.position === 'inline') {
    return (
      <div className={`${sizeClasses[config.size]} border rounded-lg shadow-lg flex flex-col ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div 
          className="p-4 rounded-t-lg flex items-center justify-between"
          style={{ backgroundColor: config.primaryColor }}
        >
          <div className="flex items-center space-x-2">
            {config.showAvatar && (
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" style={{ color: config.primaryColor }} />
              </div>
            )}
            <span className="text-white font-medium">{config.chatTitle}</span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {config.welcomeMessage && (
            <div className="flex justify-start">
              <div 
                className="max-w-xs p-3 rounded-lg text-sm"
                style={{ 
                  backgroundColor: config.secondaryColor,
                  color: '#FFFFFF'
                }}
              >
                {config.welcomeMessage}
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg text-sm ${
                  message.role === 'user'
                    ? 'text-white'
                    : isDark ? 'text-gray-900' : 'text-gray-700'
                }`}
                style={{
                  backgroundColor:
                    message.role === 'user'
                      ? config.primaryColor
                      : isDark ? '#E5E7EB' : '#F3F4F6',
                }}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs p-3 rounded-lg text-sm bg-gray-200 text-gray-600">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t" style={{ borderColor: config.secondaryColor }}>
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ 
                borderColor: config.secondaryColor,
                backgroundColor: isDark ? '#374151' : '#FFFFFF',
                color: isDark ? '#FFFFFF' : '#000000'
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: config.primaryColor }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleWidget}
          className={`fixed ${positionClasses[config.position]} z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110`}
          style={{ backgroundColor: config.primaryColor }}
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`fixed ${positionClasses[config.position]} z-50 ${sizeClasses[config.size]} border rounded-lg shadow-2xl flex flex-col ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          {/* Header */}
          <div 
            className="p-4 rounded-t-lg flex items-center justify-between"
            style={{ backgroundColor: config.primaryColor }}
          >
            <div className="flex items-center space-x-2">
              {config.showAvatar && (
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" style={{ color: config.primaryColor }} />
                </div>
              )}
              <span className="text-white font-medium">{config.chatTitle}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMinimize}
                className="text-white hover:text-gray-200 p-1"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose || toggleWidget}
                className="text-white hover:text-gray-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {config.welcomeMessage && (
                  <div className="flex justify-start">
                    <div 
                      className="max-w-xs p-3 rounded-lg text-sm"
                      style={{ 
                        backgroundColor: config.secondaryColor,
                        color: '#FFFFFF'
                      }}
                    >
                      {config.welcomeMessage}
                    </div>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'text-white'
                          : isDark ? 'text-gray-900' : 'text-gray-700'
                      }`}
                      style={{
                        backgroundColor:
                          message.role === 'user'
                            ? config.primaryColor
                            : isDark ? '#E5E7EB' : '#F3F4F6',
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-xs p-3 rounded-lg text-sm bg-gray-200 text-gray-600">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t" style={{ borderColor: config.secondaryColor }}>
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      borderColor: config.secondaryColor,
                      backgroundColor: isDark ? '#374151' : '#FFFFFF',
                      color: isDark ? '#FFFFFF' : '#000000'
                    }}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Branding */}
          {config.showBranding && (
            <div className="px-4 py-2 text-center text-xs text-gray-500 border-t">
              Powered by AI Chatbot
            </div>
          )}
        </div>
      )}
    </>
  );
} 