'use client';

import { Activity, Clock, CheckCircle } from 'lucide-react';

export function AnalyticsPreviewSolid() {
  return (
    <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-6 md:p-7 w-full h-full">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-white"
              />
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">3 Collaborators</p>
            <p className="text-xs text-slate-500">Created 2 weeks ago</p>
          </div>
        </div>
        
        <h4 className="text-base font-semibold text-slate-900 mb-4">
          Observation of AI chats
        </h4>
      </div>

      {/* Chat Preview */}
      <div className="bg-slate-50 rounded-lg p-4 mb-5 border border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600"></div>
          <div className="flex-1">
            <div className="h-2 bg-slate-200 rounded-full mb-2"></div>
            <div className="h-2 bg-slate-200 rounded-full w-3/4"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-slate-200 rounded-full"></div>
          <div className="h-2 bg-slate-200 rounded-full w-5/6"></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-900">Active</span>
          </div>
          <p className="text-lg font-bold text-amber-900">22</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-900">Running</span>
          </div>
          <p className="text-lg font-bold text-amber-900">32</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-red-600" />
            <span className="text-xs font-medium text-red-900">Completed</span>
          </div>
          <p className="text-lg font-bold text-red-900">0</p>
        </div>
      </div>
    </div>
  );
}


