'use client';

import React, { useEffect } from 'react';

const ChatWidget = () => {
  useEffect(() => {
    // Only load the script if we're on the client side
    if (typeof window === 'undefined') return;

    const loadChatWidget = () => {
      const widgetId = '531ce35f391b43249c279d506b4efdb0';
      const scriptUrl = 'https://ai-chatbot-saas-vert.vercel.app/chat.js';
      
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src="${scriptUrl}"][data-widget-id="${widgetId}"]`);
      if (existingScript) {
        console.log('[ChatWidget] Script already loaded');
        return; // Script already loaded, don't add again
      }

      // Check if body is available
      if (!document.body) {
        console.log('[ChatWidget] Body not ready, retrying...');
        setTimeout(loadChatWidget, 100);
        return;
      }

      console.log('[ChatWidget] Loading chat widget script...');
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.setAttribute('data-widget-id', widgetId);
      script.async = true;
      
      // Add error handling
      script.onerror = (error) => {
        console.error('[ChatWidget] Failed to load chat.js:', error);
      };
      
      script.onload = () => {
        console.log('[ChatWidget] chat.js loaded successfully');
      };

      document.body.appendChild(script);
    };

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadChatWidget);
    } else {
      // DOM is already ready
      loadChatWidget();
    }

    return () => {
      // Cleanup: remove script when component unmounts
      const widgetId = '531ce35f391b43249c279d506b4efdb0';
      const scriptUrl = 'https://ai-chatbot-saas-vert.vercel.app/chat.js';
      const scriptToRemove = document.querySelector(`script[src="${scriptUrl}"][data-widget-id="${widgetId}"]`);
      if (scriptToRemove && scriptToRemove.parentNode) {
        console.log('[ChatWidget] Removing chat widget script');
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
    };
  }, []);

  return null;
};

export default ChatWidget;

