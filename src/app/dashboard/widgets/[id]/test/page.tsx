'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Settings, Copy, Download, Play, Pause, RotateCcw, MessageSquare } from 'lucide-react';

interface Widget {
  id: string;
  name: string;
  type: 'CHAT_WIDGET' | 'POPUP' | 'EMBEDDED' | 'FLOATING';
  bot: {
    name: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING';
  config: {
    theme: string;
    position: string;
    size: string;
    welcomeMessage?: string;
    primaryColor: string;
    secondaryColor: string;
    showAvatar: boolean;
    showBranding: boolean;
    autoOpen: boolean;
    chatTitle: string;
  };
  createdAt: string;
}

export default function WidgetTestPage() {
  const params = useParams();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'bot', timestamp: Date}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const widgetId = params.id as string;

  // Fetch widget data
  useEffect(() => {
    const fetchWidget = async () => {
      try {
        const response = await fetch(`/api/widgets/${widgetId}`);
        if (response.ok) {
          const data = await response.json();
          setWidget(data.data);
          
          // Add initial welcome message
          const welcomeMessage = data.data.config.welcomeMessage || `Hello! I'm ${data.data.bot?.name || 'your AI assistant'}. I'm here to help you with any questions. Try asking me about our services, pricing, or company information!`;
          setChatMessages([{
            id: '1',
            text: welcomeMessage,
            sender: 'bot',
            timestamp: new Date()
          }]);
          
          // Auto-open widget if configured
          if (data.data.config.autoOpen) {
            setIsWidgetOpen(true);
          }
        } else {
          setError('Failed to fetch widget');
        }
      } catch (error) {
        setError('Failed to fetch widget');
      } finally {
        setIsLoading(false);
      }
    };

    if (widgetId) {
      fetchWidget();
    }
  }, [widgetId]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !widget) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send message to AI chat API
      const response = await fetch('/api/chat/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          widgetId: widget.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Add AI response to chat
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot' as const,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, botResponse]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response if API fails
      const fallbackResponse = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I'm having trouble processing your request right now. Please try again in a moment.`,
        sender: 'bot' as const,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetTest = () => {
    const welcomeMessage = widget?.config.welcomeMessage || `Hello! I'm ${widget?.bot?.name || 'your AI assistant'}. I'm here to help you with any questions. Try asking me about our services, pricing, or company information!`;
    setChatMessages([{
      id: '1',
      text: welcomeMessage,
      sender: 'bot',
      timestamp: new Date()
    }]);
    setIsWidgetOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Widget not found</h1>
          <button
            onClick={() => window.close()}
            className="bg-gradient-to-r from-amber-50 via-amber-100 to-amber-200 text-gray-900 px-4 py-2 rounded-lg hover:opacity-90"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Controls Header */}
      <div className="bg-white/20 backdrop-blur-md border-b border-white/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.close()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-accent-strong" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Widget Live Test</h1>
              <p className="text-sm text-gray-600">
                Testing: {widget.name} • Bot: {widget.bot?.name || 'Unknown Bot'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsWidgetOpen(!isWidgetOpen)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isWidgetOpen 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isWidgetOpen ? <Pause className="w-4 h-4 text-accent-strong" /> : <Play className="w-4 h-4 text-accent-strong" />}
              <span className="ml-2">{isWidgetOpen ? 'Hide Widget' : 'Show Widget'}</span>
            </button>
            
            <button
              onClick={resetTest}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4 inline mr-2 text-accent-strong" />
              Reset Test
            </button>
            
            <button
              onClick={() => window.open(`/dashboard/widgets/${widget.id}/edit`, '_blank')}
              className="px-4 py-2 bg-accent-strong/50 text-white rounded-lg hover:bg-accent-strong/50 transition-colors text-sm font-medium"
            >
              <Settings className="w-4 h-4 inline mr-2 text-accent-strong" />
              Configure
            </button>
          </div>
        </div>
      </div>

      {/* Test Website Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-2xl p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Our Test Website</h2>
          <p className="text-lg text-gray-600 mb-6">
            This is a simulated website environment where you can test how your chat widget will appear and function.
            The widget below will behave exactly as it would on a real website.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">About Our Company</h3>
              <p className="text-gray-600 mb-4">
                We provide cutting-edge AI solutions for businesses looking to enhance their customer experience.
                Our chatbots are powered by advanced language models and can handle complex customer inquiries.
              </p>
              <p className="text-gray-600">
                Test the widget by asking questions about our services, pricing, or any other topics you&apos;d like to explore.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Natural language processing
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Multi-language support
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Customizable appearance
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Integration with knowledge bases
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Widget Configuration Info */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Widget Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Theme:</span>
              <span className="ml-2 font-medium">{widget.config.theme}</span>
            </div>
            <div>
              <span className="text-gray-600">Position:</span>
              <span className="ml-2 font-medium">{widget.config.position}</span>
            </div>
            <div>
              <span className="text-gray-600">Size:</span>
              <span className="ml-2 font-medium">{widget.config.size}</span>
            </div>
            <div>
              <span className="text-gray-600">Auto-open:</span>
              <span className="ml-2 font-medium">{widget.config.autoOpen ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Widget */}
      {isWidgetOpen && (
        <div 
          className={`fixed shadow-2xl border border-white/30 rounded-lg bg-white/20 backdrop-blur-md transition-all duration-300 ${
            widget.config.size === 'small' ? 'w-80 h-96' :
            widget.config.size === 'large' ? 'w-96 h-[32rem]' : 'w-80 h-[28rem]'
          }`}
          style={{
            [widget.config.position.includes('right') ? 'right' : 'left']: '20px',
            [widget.config.position.includes('bottom') ? 'bottom' : 'top']: '20px',
            backgroundColor: widget.config.theme === 'dark' ? '#1f2937' : '#ffffff',
            color: widget.config.theme === 'dark' ? '#f9fafb' : '#111827',
          }}
        >
          {/* Widget Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {widget.config.showAvatar && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: widget.config.primaryColor }}
                >
                  {(widget.bot?.name || 'B').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 
                  className="font-medium"
                  style={{ color: widget.config.primaryColor }}
                >
                  {widget.config.chatTitle || 'Chat with us'}
                </h4>
                <p className="text-xs text-gray-500">
                  {widget.bot?.name || 'Unknown Bot'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsWidgetOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <span className="text-xl">×</span>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto max-h-64">
            <div className="space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.sender === 'user' ? 'text-white' : 'text-white'
                    }`}
                    style={{ 
                      backgroundColor: message.sender === 'user' 
                        ? widget.config.primaryColor 
                        : widget.config.secondaryColor
                    }}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              
              {/* Conversation Starters */}
              {chatMessages.length === 1 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => {
                      setInputMessage("What can you help me with?");
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                  >
                    What can you help me with?
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage("Tell me about your pricing");
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                  >
                    Pricing info
                  </button>
                  <button
                    onClick={() => {
                      setInputMessage("How do I contact support?");
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                  >
                    Contact support
                  </button>
                </div>
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div 
                    className="px-3 py-2 rounded-lg text-sm text-white"
                    style={{ backgroundColor: widget.config.secondaryColor }}
                  >
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                style={{
                  backgroundColor: widget.config.theme === 'dark' ? '#374151' : '#ffffff',
                  color: widget.config.theme === 'dark' ? '#f9fafb' : '#111827',
                  borderColor: widget.config.theme === 'dark' ? '#4b5563' : '#d1d5db',
                }}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: widget.config.primaryColor }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Widget Toggle Button */}
      {!isWidgetOpen && (
        <button
          onClick={() => setIsWidgetOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{ backgroundColor: widget.config.primaryColor }}
        >
          <MessageSquare className="w-6 h-6 text-accent-strong" />
        </button>
      )}
    </div>
  );
} 