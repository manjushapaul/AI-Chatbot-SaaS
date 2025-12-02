'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/contexts/ThemeContext';
import type { EmojiClickData } from 'emoji-picker-react';

// Dynamically import emoji picker to avoid SSR issues
const Picker = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false }
);

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
  className?: string;
}

export function EmojiPicker({ value, onChange, placeholder = '🤖', className = '' }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { theme } = useTheme();

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Close on Escape key
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-base text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none flex items-center justify-between hover:bg-white/90 transition-colors min-h-[44px]"
        aria-label="Choose emoji"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-sm text-gray-700 flex-shrink-0">Choose emoji</span>
        <span 
          className="text-2xl flex-shrink-0 ml-2 leading-none flex items-center justify-center w-8 h-8" 
          style={{ 
            fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
            lineHeight: '1'
          }}
          role="img"
          aria-label="Selected emoji"
        >
          {value && value.trim() ? value : placeholder}
        </span>
      </button>

      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute z-50 mt-2 shadow-lg rounded-lg overflow-hidden"
          role="dialog"
          aria-label="Emoji picker"
        >
          <Picker
            onEmojiClick={handleEmojiSelect}
            theme={theme === 'dark' ? 'dark' : 'light'}
            skinTonesDisabled
            searchDisabled={false}
            previewConfig={{
              showPreview: false
            }}
          />
        </div>
      )}
    </div>
  );
}

