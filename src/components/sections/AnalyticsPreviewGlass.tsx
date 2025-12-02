'use client';

import { Activity, Clock, CheckCircle } from 'lucide-react';

export function AnalyticsPreviewGlass() {
  return (
    <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/40 shadow-[0_18px_45px_rgba(15,23,42,0.25)] p-6 md:p-7 h-full">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-white border-2 border-white/60 flex items-center justify-center"
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-fuchsia-400 to-sky-400"></div>
              </div>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-white">3 Collaborators</p>
            <p className="text-xs text-white/70">Created 2 weeks ago</p>
          </div>
        </div>
        
        <h4 className="text-base font-semibold text-white mb-4">
          Observation of AI chats
        </h4>
      </div>

      {/* Chat Preview */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-5 border border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500/80 to-sky-500/80 border border-white/30"></div>
          <div className="flex-1">
            <div className="h-2 bg-white/30 rounded-full mb-2"></div>
            <div className="h-2 bg-white/30 rounded-full w-3/4"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-white/30 rounded-full"></div>
          <div className="h-2 bg-white/30 rounded-full w-5/6"></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-r from-fuchsia-500/80 to-sky-500/80 rounded-lg p-3 border border-white/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-medium text-white">Active</span>
          </div>
          <p className="text-lg font-bold text-white">22</p>
        </div>
        <div className="bg-gradient-to-r from-amber-500/80 to-amber-500/80 rounded-lg p-3 border border-white/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-medium text-white">Running</span>
          </div>
          <p className="text-lg font-bold text-white">32</p>
        </div>
        <div className="bg-gradient-to-r from-red-500/80 to-orange-500/80 rounded-lg p-3 border border-white/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-medium text-white">Completed</span>
          </div>
          <p className="text-lg font-bold text-white">0</p>
        </div>
      </div>
    </div>
  );
}



