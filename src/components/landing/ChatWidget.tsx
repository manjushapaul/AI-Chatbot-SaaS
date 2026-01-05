'use client';

import React, { useEffect } from 'react';

const ChatWidget = () => {
  useEffect(() => {
    // Only load the script if we're on the client side
    if (typeof window === 'undefined') return;

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="chat.js"]');
    if (existingScript) {
      return; // Script already loaded, don't add again
    }

    const script = document.createElement('script');
    // Use the current origin to support both localhost and production
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    script.src = `${baseUrl}/chat.js`;
    script.setAttribute('data-widget-id', 'de7ee0f5a456420eae69658896eb4f79');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts
      const scriptToRemove = document.querySelector('script[src*="chat.js"][data-widget-id="de7ee0f5a456420eae69658896eb4f79"]');
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
    };
  }, []);

  return null;
};

export default ChatWidget;

