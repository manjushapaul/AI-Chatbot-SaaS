'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, X, Loader2 } from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { typography } from '@/lib/design-tokens';
import { useTheme } from '@/contexts/ThemeContext';

interface BotData {
  id: string;
  name: string;
  description?: string;
  model: string;
  avatar?: string;
  personality?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function BotChatPage() {
  const { theme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;
  
  const [bot, setBot] = useState<BotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch bot data
  useEffect(() => {
    const fetchBot = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/bots/${botId}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setBot(result.data);
            // Add welcome message
            if (result.data.personality) {
              setMessages([{
                role: 'assistant',
                content: result.data.personality
              }]);
            }
          } else {
            setError(result.error || 'Failed to fetch bot');
          }
        } else {
          setError('Bot not found');
        }
      } catch (error) {
        console.error('Error fetching bot:', error);
        setError('Failed to fetch bot');
      } finally {
        setIsLoading(false);
      }
    };

    if (botId) {
      fetchBot();
    }
  }, [botId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when page loads
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !bot || isSending) return;

    const userMessage: ChatMessage = { role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          botId: bot.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const assistantMessage: ChatMessage = { 
            role: 'assistant', 
            content: result.data.message || 'No response received' 
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const errorMessage: ChatMessage = { 
            role: 'assistant', 
            content: `Error: ${result.error || 'Failed to get response'}` 
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        // Try to parse error message from response
        let errorText = 'Failed to communicate with bot';
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorText;
        } catch (e) {
          // If response is not JSON, use status text
          errorText = response.statusText || errorText;
        }
        const errorMessage: ChatMessage = { 
          role: 'assistant', 
          content: `Error: ${errorText}` 
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: `Error: ${error instanceof Error ? error.message : 'Network error occurred'}` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending && inputValue.trim()) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <AppPage>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent-soft" />
        </div>
      </AppPage>
    );
  }

  if (error || !bot) {
    return (
      <AppPage>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error || 'Bot not found'}
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.push('/dashboard/bots')}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bots
          </button>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/70 bg-white/80 backdrop-blur rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => router.push(`/dashboard/bots/${botId}`)}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-full transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg flex items-center justify-center text-lg flex-shrink-0 shadow-md">
              {bot.avatar || '🤖'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`${typography.pageTitle} truncate`}>
                {bot.name}
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {bot.model || 'Model not set'}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/dashboard/bots/${botId}`)}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 overflow-y-auto px-6 py-4 ${
          theme === 'dark' 
            ? 'bg-gradient-to-b from-[#F5E6D3] via-[#E8D5C4] to-[#D4C4B0]'
            : 'bg-gradient-to-b from-white via-[#F7EAFB] to-[#FDEFF6]'
        }`}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-accent-soft/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">{bot.avatar || '🤖'}</span>
              </div>
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
                    className={`max-w-[70%] px-4 py-2.5 text-sm shadow-sm rounded-2xl ${
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
              
              {isSending && (
                <div className="flex justify-start">
                  <div className={`${theme === 'dark' ? 'bg-[#F5E6D3]' : 'bg-white/90'} text-gray-800 px-4 py-2.5 shadow-sm rounded-2xl`}>
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
        <div className="border-t border-white/60 bg-white/70 backdrop-blur-lg px-6 py-4 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1 bg-white/90 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-accent-soft/60 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="bg-accent-soft px-5 py-2.5 text-sm font-medium text-white rounded-full shadow hover:bg-accent-soft/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </AppPage>
  );
}

