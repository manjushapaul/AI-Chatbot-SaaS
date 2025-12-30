"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export function TrialExpiredScreen() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb] p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Your Free Trial Has Ended
        </h1>
        <p className="text-slate-600 mb-6">
          Your 14-day free trial has expired. To continue using all features of AI Chatbot,
          please upgrade your plan. Otherwise, your account will be limited to the Free plan.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/billing/expired')}
            className="inline-flex items-center justify-center rounded-full bg-amber-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            View Upgrade Options
          </button>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center rounded-full border-2 border-amber-600 bg-white px-6 py-3 text-base font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}



