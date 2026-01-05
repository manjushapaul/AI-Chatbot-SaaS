(function() {
  'use strict';

  // Widget configuration and state
  let widgetConfig = null;
  let widgetElement = null;
  let isInitialized = false;

  // Default configuration
  const defaultConfig = {
    theme: 'light',
    position: 'bottom-right',
    size: 'medium',
    welcomeMessage: 'Hello! How can I help you today?',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    showAvatar: true,
    showBranding: true,
    autoOpen: false,
    chatTitle: 'Chat with us',
    botId: null
  };

  // Size classes mapping
  const sizeClasses = {
    small: 'w-80 h-96',
    medium: 'w-96 h-[28rem]',
    large: 'w-[28rem] h-[32rem]'
  };

  // Position classes mapping
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    'inline': 'relative'
  };

  // Utility functions
  function getTheme() {
    if (widgetConfig.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return widgetConfig.theme;
  }

  function createElement(tag, className, styles = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    Object.assign(element.style, styles);
    return element;
  }

  function addStyles() {
    if (typeof document === 'undefined' || !document) return;
    if (document.getElementById('ai-chatbot-widget-styles')) return;

    const styles = `
      .ai-chatbot-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 999999;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border-radius: 12px;
        transition: all 0.3s ease;
      }
      
      .ai-chatbot-widget * {
        box-sizing: border-box;
      }
      
      .ai-chatbot-widget button {
        cursor: pointer;
        border: none;
        outline: none;
        transition: all 0.2s ease;
      }
      
      .ai-chatbot-widget button:hover {
        transform: scale(1.05);
      }
      
      .ai-chatbot-widget input {
        border: none;
        outline: none;
        transition: all 0.2s ease;
      }
      
      .ai-chatbot-widget input:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .ai-chatbot-widget .message {
        max-width: 80%;
        word-wrap: break-word;
        line-height: 1.4;
      }
      
      .ai-chatbot-widget .typing-indicator {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      
      .ai-chatbot-widget .typing-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: currentColor;
        animation: typing-bounce 1.4s infinite ease-in-out;
      }
      
      .ai-chatbot-widget .typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .ai-chatbot-widget .typing-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes typing-bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      
      .ai-chatbot-widget .fade-in {
        animation: fadeIn 0.3s ease-in;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'ai-chatbot-widget-styles';
    styleSheet.textContent = styles;
    
    if (document.head) {
      document.head.appendChild(styleSheet);
    } else {
      // Fallback: append to body if head is not available
      if (document.body) {
        document.body.appendChild(styleSheet);
      } else {
        // Wait for head or body to be available
        setTimeout(() => {
          if (document.head) {
            document.head.appendChild(styleSheet);
          } else if (document.body) {
            document.body.appendChild(styleSheet);
          }
        }, 100);
      }
    }
  }

  function createFloatingButton() {
    const button = createElement('button', 'ai-chatbot-widget ai-chatbot-floating-button fade-in');
    button.style.cssText = `
      position: fixed;
      ${positionClasses[widgetConfig.position]};
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background-color: ${widgetConfig.primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 999999;
    `;

    const icon = createElement('div');
    icon.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    `;

    button.appendChild(icon);
    button.addEventListener('click', toggleWidget);
    return button;
  }

  function createWidget() {
    const widget = createElement('div', 'ai-chatbot-widget ai-chatbot-main fade-in');
    widget.style.cssText = `
      position: fixed;
      ${positionClasses[widgetConfig.position]};
      ${sizeClasses[widgetConfig.size]};
      background-color: ${getTheme() === 'dark' ? '#1F2937' : '#FFFFFF'};
      color: ${getTheme() === 'dark' ? '#FFFFFF' : '#000000'};
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
    `;

    // Header
    const header = createElement('div', 'ai-chatbot-header');
    header.style.cssText = `
      padding: 16px;
      background-color: ${widgetConfig.primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 12px 12px 0 0;
    `;

    const headerLeft = createElement('div');
    headerLeft.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    if (widgetConfig.showAvatar) {
      const avatar = createElement('div');
      avatar.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${widgetConfig.primaryColor};
        font-weight: bold;
        font-size: 14px;
      `;
      avatar.textContent = 'AI';
      headerLeft.appendChild(avatar);
    }

    const title = createElement('span');
    title.textContent = widgetConfig.chatTitle;
    title.style.cssText = 'font-weight: 500; font-size: 16px;';
    headerLeft.appendChild(title);

    const headerRight = createElement('div');
    headerRight.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const minimizeBtn = createElement('button');
    minimizeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
      </svg>
    `;
    minimizeBtn.style.cssText = 'background: none; color: white; padding: 4px; border-radius: 4px;';
    minimizeBtn.addEventListener('click', toggleMinimize);
    headerRight.appendChild(minimizeBtn);

    const closeBtn = createElement('button');
    closeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    `;
    closeBtn.style.cssText = 'background: none; color: white; padding: 4px; border-radius: 4px;';
    closeBtn.addEventListener('click', toggleWidget);
    headerRight.appendChild(closeBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerRight);

    // Chat area
    const chatArea = createElement('div', 'ai-chatbot-chat-area');
    chatArea.style.cssText = `
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    // Welcome message
    if (widgetConfig.welcomeMessage) {
      const welcomeMsg = createElement('div', 'ai-chatbot-message ai-chatbot-welcome');
      welcomeMsg.style.cssText = `
        align-self: flex-start;
        max-width: 80%;
        padding: 12px;
        border-radius: 12px;
        background-color: ${widgetConfig.secondaryColor};
        color: white;
        font-size: 14px;
        line-height: 1.4;
      `;
      welcomeMsg.textContent = widgetConfig.welcomeMessage;
      chatArea.appendChild(welcomeMsg);
    }

    // Input area
    const inputArea = createElement('div', 'ai-chatbot-input-area');
    inputArea.style.cssText = `
      padding: 16px;
      border-top: 1px solid ${widgetConfig.secondaryColor};
      display: flex;
      gap: 8px;
    `;

    const input = createElement('input', 'ai-chatbot-input');
    input.type = 'text';
    input.placeholder = 'Type your message...';
    input.style.cssText = `
      flex: 1;
      padding: 12px;
      border: 1px solid ${widgetConfig.secondaryColor};
      border-radius: 8px;
      font-size: 14px;
      background-color: ${getTheme() === 'dark' ? '#374151' : '#FFFFFF'};
      color: ${getTheme() === 'dark' ? '#FFFFFF' : '#000000'};
    `;

    const sendBtn = createElement('button', 'ai-chatbot-send-btn');
    sendBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
      </svg>
    `;
    sendBtn.style.cssText = `
      padding: 12px;
      border-radius: 8px;
      background-color: ${widgetConfig.primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    sendBtn.addEventListener('click', sendMessage);

    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);

    // Branding
    if (widgetConfig.showBranding) {
      const branding = createElement('div', 'ai-chatbot-branding');
      branding.style.cssText = `
        padding: 8px 16px;
        text-align: center;
        font-size: 12px;
        color: #6B7280;
        border-top: 1px solid #E5E7EB;
        background-color: ${getTheme() === 'dark' ? '#374151' : '#F9FAFB'};
      `;
      branding.textContent = 'Powered by AI Chatbot';
      widget.appendChild(branding);
    }

    widget.appendChild(header);
    widget.appendChild(chatArea);
    widget.appendChild(inputArea);

    // Add event listeners
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    return widget;
  }

  function toggleWidget() {
    if (!document || !document.body) {
      console.warn('Document body not available');
      return;
    }
    
    if (widgetElement) {
      if (document.body.contains(widgetElement)) {
        document.body.removeChild(widgetElement);
      }
      widgetElement = null;
    } else {
      widgetElement = createWidget();
      document.body.appendChild(widgetElement);
      
      // Focus input
      setTimeout(() => {
        const input = widgetElement.querySelector('.ai-chatbot-input');
        if (input) input.focus();
      }, 100);
    }
  }

  function toggleMinimize() {
    if (widgetElement) {
      const chatArea = widgetElement.querySelector('.ai-chatbot-chat-area');
      const inputArea = widgetElement.querySelector('.ai-chatbot-input-area');
      const branding = widgetElement.querySelector('.ai-chatbot-branding');
      
      if (chatArea.style.display === 'none') {
        chatArea.style.display = 'flex';
        inputArea.style.display = 'flex';
        if (branding) branding.style.display = 'block';
      } else {
        chatArea.style.display = 'none';
        inputArea.style.display = 'none';
        if (branding) branding.style.display = 'none';
      }
    }
  }

  function sendMessage() {
    const input = widgetElement?.querySelector('.ai-chatbot-input');
    const chatArea = widgetElement?.querySelector('.ai-chatbot-chat-area');
    
    if (!input || !chatArea || !input.value.trim()) return;
    
    // Check if botId is available
    if (!widgetConfig.botId) {
      console.error('Bot ID not available');
      return;
    }

    const message = input.value.trim();
    input.value = '';

    // Add user message
    const userMsg = createElement('div', 'ai-chatbot-message ai-chatbot-user-message');
    userMsg.style.cssText = `
      align-self: flex-end;
      max-width: 80%;
      padding: 12px;
      border-radius: 12px;
      background-color: ${widgetConfig.primaryColor};
      color: white;
      font-size: 14px;
      line-height: 1.4;
    `;
    userMsg.textContent = message;
    chatArea.appendChild(userMsg);

    // Add typing indicator
    const typingIndicator = createElement('div', 'ai-chatbot-message ai-chatbot-typing');
    typingIndicator.style.cssText = `
      align-self: flex-start;
      max-width: 80%;
      padding: 12px;
      border-radius: 12px;
      background-color: ${getTheme() === 'dark' ? '#E5E7EB' : '#F3F4F6'};
      color: ${getTheme() === 'dark' ? '#374151' : '#6B7280'};
      font-size: 14px;
    `;
    typingIndicator.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    chatArea.appendChild(typingIndicator);

    // Scroll to bottom
    chatArea.scrollTop = chatArea.scrollHeight;

    // Get the base URL from the script source
    const script = document.currentScript || document.querySelector('script[src*="chat.js"]');
    const scriptSrc = script ? script.src : '';
    const baseUrl = scriptSrc ? scriptSrc.substring(0, scriptSrc.lastIndexOf('/')) : '';
    
    // Send message to chat API
    fetch(`${baseUrl}/api/chat/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        botId: widgetConfig.botId,
        conversationId: window.aiChatbotConversationId || null,
      }),
    })
    .then(response => response.json())
    .then(data => {
      chatArea.removeChild(typingIndicator);
      
      if (data.success) {
        const aiMsg = createElement('div', 'ai-chatbot-message ai-chatbot-ai-message');
        aiMsg.style.cssText = `
          align-self: flex-start;
          max-width: 80%;
          padding: 12px;
          border-radius: 12px;
          background-color: ${getTheme() === 'dark' ? '#E5E7EB' : '#F3F4F6'};
          color: ${getTheme() === 'dark' ? '#374151' : '#6B7280'};
          font-size: 14px;
          line-height: 1.4;
        `;
        aiMsg.textContent = data.data.message;
        chatArea.appendChild(aiMsg);
        
        // Store conversation ID for future messages
        if (data.data.conversationId) {
          window.aiChatbotConversationId = data.data.conversationId;
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
      
      chatArea.scrollTop = chatArea.scrollHeight;
    })
    .catch(error => {
      console.error('Chat API error:', error);
      chatArea.removeChild(typingIndicator);
      
      const errorMsg = createElement('div', 'ai-chatbot-message ai-chatbot-error');
      errorMsg.style.cssText = `
        align-self: flex-start;
        max-width: 80%;
        padding: 12px;
        border-radius: 12px;
        background-color: #FEE2E2;
        color: #DC2626;
        font-size: 14px;
        line-height: 1.4;
      `;
      errorMsg.textContent = 'Sorry, I encountered an error. Please try again.';
      chatArea.appendChild(errorMsg);
      
      chatArea.scrollTop = chatArea.scrollHeight;
    });
  }

  function initialize() {
    if (isInitialized) return;

    // Get widget configuration from script tag
    const script = document.currentScript || document.querySelector('script[src*="chat.js"]');
    if (!script) return;

    const widgetId = script.getAttribute('data-widget-id');
    if (!widgetId) return;

    // Get the base URL from the script source
    const scriptSrc = script ? script.src : '';
    const baseUrl = scriptSrc ? scriptSrc.substring(0, scriptSrc.lastIndexOf('/')) : '';
    
    // Load widget configuration from API
    fetch(`${baseUrl}/api/widgets/${widgetId}/config`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.data) {
          widgetConfig = { 
            ...defaultConfig, 
            ...data.data.config,
            botId: data.data.botId // Ensure botId is included
          };
          
          console.log('[Chat Widget] Widget config loaded:', { 
            widgetId, 
            botId: widgetConfig.botId ? widgetConfig.botId.substring(0, 8) + '...' : 'none',
            position: widgetConfig.position,
            primaryColor: widgetConfig.primaryColor
          });
          
          // Add styles
          addStyles();
          
          // Create floating button
          const button = createFloatingButton();
          if (document && document.body) {
            document.body.appendChild(button);
            console.log('[Chat Widget] Floating button created and added to page');
          } else {
            // Wait for body to be available
            setTimeout(() => {
              if (document && document.body) {
                document.body.appendChild(button);
                console.log('[Chat Widget] Floating button created and added to page (delayed)');
              } else {
                console.error('[Chat Widget] Cannot create button - document.body not available');
              }
            }, 100);
          }
          
          // Auto-open if configured
          if (widgetConfig.autoOpen) {
            setTimeout(toggleWidget, 1000);
          }
          
          isInitialized = true;
        } else {
          throw new Error('Invalid response format');
        }
      })
      .catch(error => {
        console.error('[Chat Widget] Failed to load widget configuration:', error);
        console.warn('[Chat Widget] Using default configuration. Widget will appear but may not function without botId.');
        
        // Fallback to default config (no botId available)
        widgetConfig = { ...defaultConfig };
        addStyles();
        
        const button = createFloatingButton();
        if (document && document.body) {
          document.body.appendChild(button);
          console.log('[Chat Widget] Floating button created with default config');
        } else {
          // Wait for body to be available
          setTimeout(() => {
            if (document && document.body) {
              document.body.appendChild(button);
              console.log('[Chat Widget] Floating button created with default config (delayed)');
            } else {
              console.error('[Chat Widget] Cannot create button - document.body not available');
            }
          }, 100);
        }
        
        isInitialized = true;
      });
  }

  // Initialize when DOM is ready
  function safeInitialize() {
    // Check if document and body exist
    if (typeof document === 'undefined' || !document) {
      setTimeout(safeInitialize, 100);
      return;
    }
    
    if (document.body) {
      initialize();
    } else {
      // Wait for body to be available
      if (document.readyState === 'loading') {
        if (document.addEventListener) {
          document.addEventListener('DOMContentLoaded', safeInitialize);
        } else {
          setTimeout(safeInitialize, 100);
        }
      } else {
        // Use a small delay to ensure body exists
        setTimeout(safeInitialize, 100);
      }
    }
  }

  // Start initialization - ensure document exists first
  if (typeof document !== 'undefined' && document) {
    if (document.readyState === 'loading' && document.addEventListener) {
      document.addEventListener('DOMContentLoaded', safeInitialize);
    } else {
      safeInitialize();
    }
  } else {
    // If document doesn't exist yet, wait a bit and try again
    setTimeout(safeInitialize, 100);
  }

  // Expose widget API globally
  if (typeof window !== 'undefined') {
    window.AIChatbotWidget = {
      open: toggleWidget,
      close: () => {
        if (widgetElement && document && document.body && document.body.contains(widgetElement)) {
          document.body.removeChild(widgetElement);
          widgetElement = null;
        }
      },
    sendMessage: (message) => {
      if (widgetElement) {
        const input = widgetElement.querySelector('.ai-chatbot-input');
        if (input) {
          input.value = message;
          sendMessage();
        }
      }
    }
    };
  }
})(); 