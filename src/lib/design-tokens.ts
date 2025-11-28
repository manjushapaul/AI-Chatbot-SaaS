/**
 * Shared design tokens for consistent typography, spacing, and styling
 * across all dashboard pages.
 */

// Typography Scale
export const typography = {
  // Page title (e.g., 'Dashboard Overview', 'AI Bots', 'Knowledge Bases')
  pageTitle: 'text-xl font-semibold text-slate-900',
  
  // Large page title for forms (e.g., 'Create & Train Knowledge Base')
  pageTitleLarge: 'text-2xl font-semibold text-slate-900 leading-7',
  
  // Subtitle / description under title
  pageSubtitle: 'text-sm text-gray-500',
  
  // Section / card title (e.g., 'Recent Activity', 'Platform Health', 'Basic Information')
  sectionTitle: 'text-sm font-semibold text-gray-900',
  
  // Large section title for forms (e.g., 'Knowledge Base Settings', 'Training Configuration')
  sectionTitleLarge: 'text-base font-semibold text-gray-900 leading-6',
  
  // Label text above inputs
  label: 'text-xs font-medium text-gray-600',
  
  // Large label text for forms
  labelLarge: 'text-sm font-medium text-gray-700 leading-5',
  
  // Body text inside cards
  body: 'text-sm text-gray-700',
  
  // Large body text for better readability
  bodyLarge: 'text-[15px] text-gray-700 leading-6',
  
  // Helper text / hints under inputs
  helperText: 'text-xs text-gray-500',
  
  // Large helper text
  helperTextLarge: 'text-sm text-gray-500 leading-5',
  
  // Meta text (timestamps, hints, counts)
  meta: 'text-xs text-gray-400',
  
  // Large meta text
  metaLarge: 'text-xs text-gray-500 leading-5',
} as const;

// Card Base Styles
export const cardBase = 
  'rounded-2xl bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur border border-white/70';

// Card Padding Variants
export const cardPadding = {
  default: 'px-6 py-5',
  compact: 'px-6 py-4',
} as const;

// Spacing System
export const spacing = {
  // Vertical gaps between major blocks on a page
  pageBlock: 'space-y-6',
  
  // Space between card header and content
  cardContent: 'mt-4',
  
  // Grid gaps between cards
  cardGrid: 'gap-5',
  cardGridLarge: 'gap-6',
  
  // List spacing
  list: 'space-y-4',
} as const;

