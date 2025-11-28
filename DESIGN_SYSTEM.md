# Design System - Typography & Icon Colors

This document outlines the typography and icon color system for the AI Chatbot SaaS dashboard.

## Text Colors

### Page Titles / Main Headings
- **Color**: `#1F2933` (Dark Slate)
- **Tailwind Class**: `text-slate-900`
- **Usage**: Main page titles (h1 elements)
- **Example**: 
  ```tsx
  <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
  ```

### Card Titles & Sidebar Labels
- **Color**: `#111827` or `#4B5563` (Dark Gray)
- **Tailwind Classes**: `text-gray-900` or `text-gray-700`
- **Usage**: Card headers, section titles, sidebar navigation labels
- **Example**:
  ```tsx
  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
  <span className="text-sm font-medium text-gray-700">Total Bots</span>
  ```

### Secondary/Description Text
- **Color**: `#6B7280` (Medium Gray)
- **Tailwind Class**: `text-gray-500`
- **Usage**: Descriptions, helper text, secondary information
- **Example**:
  ```tsx
  <p className="text-sm text-gray-500">Welcome to your AI ChatBot SaaS platform</p>
  <span className="text-sm text-gray-500">Active bots in your system</span>
  ```

### Meta Text (Timestamps, Status Messages)
- **Color**: `#9CA3AF` (Light Gray)
- **Tailwind Class**: `text-gray-400`
- **Usage**: Timestamps, "No active users", metadata
- **Example**:
  ```tsx
  <p className="text-xs text-gray-400">{activity.timestamp}</p>
  <p className="text-xs text-gray-400">No active users</p>
  ```

## Icon Colors

### Default Navigation & Action Icons
- **Color**: `#4B5563` (Gray-700)
- **Tailwind Class**: `text-gray-700`
- **Usage**: Sidebar icons, card icons, default action icons
- **Example**:
  ```tsx
  <Bot className="w-5 h-5 text-gray-700" />
  <MessageSquare className="w-6 h-6 text-gray-700" />
  ```

### Status Icons

#### Success
- **Color**: `#10B981` (Emerald-500)
- **Tailwind Class**: `text-emerald-500`
- **Usage**: Success states, completed actions, online status
- **Example**:
  ```tsx
  <CheckCircle className="w-5 h-5 text-emerald-500" />
  ```

#### Info/Neutral
- **Color**: `#3B82F6` (Blue-500)
- **Tailwind Class**: `text-blue-500`
- **Usage**: Informational states, neutral status, info icons
- **Example**:
  ```tsx
  <Info className="w-4 h-4 text-blue-500" />
  <MessageSquare className="w-5 h-5 text-blue-500" />
  ```

#### Warning
- **Color**: `#F59E0B` (Amber-500)
- **Tailwind Class**: `text-amber-500`
- **Usage**: Warning states, caution indicators
- **Example**:
  ```tsx
  <AlertTriangle className="w-5 h-5 text-amber-500" />
  <TrendingUp className="w-5 h-5 text-amber-500" />
  ```

## Component Examples

### Sidebar Item Component
```tsx
<Link
  href="/dashboard/bots"
  className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
    isActive
      ? 'bg-[#e501aee6]/50 text-white'
      : 'text-gray-700 hover:bg-gray-100'
  }`}
>
  <Bot className="w-5 h-5 text-gray-700" />
  <span>Bots</span>
</Link>
```

### Dashboard Card Component
```tsx
<div className="bg-white/20 backdrop-blur-md p-6 rounded-lg border border-white/30 shadow-2xl">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-700">Total Bots</p>
      <p className="text-2xl font-bold text-gray-900">{stats.totalBots}</p>
    </div>
    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
      <Bot className="w-6 h-6 text-gray-700" />
    </div>
  </div>
  <div className="mt-4 flex items-center text-sm text-gray-500">
    <TrendingUp className="w-4 h-4 mr-1 text-gray-700" />
    <span>Active bots in your system</span>
  </div>
</div>
```

### Status Chip Component (Platform Health)
```tsx
<div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-4 py-3 flex items-center space-x-3 shadow-md border border-green-100/50">
  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
    <CheckCircle className="w-5 h-5 text-emerald-500" />
  </div>
  <div className="flex-1">
    <p className="text-sm font-semibold text-gray-900">System Online</p>
    <p className="text-xs text-gray-400">No active users</p>
  </div>
</div>
```

## Migration Guide

### Before (Old Colors)
```tsx
// Pink icons everywhere
<Bot className="w-5 h-5 text-[#e501aee6]" />
<h1 className="text-2xl font-bold text-gray-900">Title</h1>
<p className="text-sm text-gray-600">Description</p>
```

### After (New Colors)
```tsx
// Professional gray icons
<Bot className="w-5 h-5 text-gray-700" />
<h1 className="text-2xl font-bold text-slate-900">Title</h1>
<p className="text-sm text-gray-500">Description</p>
```

## Quick Reference

| Element | Old Color | New Color | Tailwind Class |
|---------|-----------|-----------|----------------|
| Page Titles | `text-gray-900` | `text-slate-900` | `text-slate-900` |
| Card Titles | `text-gray-600` | `text-gray-700` | `text-gray-700` |
| Descriptions | `text-gray-600` | `text-gray-500` | `text-gray-500` |
| Meta Text | `text-gray-500` | `text-gray-400` | `text-gray-400` |
| Default Icons | `text-[#e501aee6]` | `text-gray-700` | `text-gray-700` |
| Success Icons | Various | `text-emerald-500` | `text-emerald-500` |
| Info Icons | Various | `text-blue-500` | `text-blue-500` |
| Warning Icons | Various | `text-amber-500` | `text-amber-500` |

## Notes

- Keep the existing pastel gradient backgrounds unchanged
- Only update text and icon colors for better contrast and professionalism
- Active states (when `bg-[#e501aee6]/50` is used) should still use white text and icons
- Status-specific icons should use semantic colors (emerald for success, blue for info, amber for warning)

