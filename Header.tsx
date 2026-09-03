import React from 'react';
import {
  ShieldAlert,
  Bot,
  Inbox,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Play,
  RotateCcw,
  Layers,
  FileText,
  Activity,
  UserCheck,
  BrainCircuit,
} from 'lucide-react';
import { SystemHealthStats } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: SystemHealthStats | null;
  pendingReviewCount: number;
  onSeedData: () => void;
  onProcessAll: () => void;
  isProcessingAll: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  pendingReviewCount,
  onSeedData,
  onProcessAll,
  isProcessingAll,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    {
      id: 'review',
      label: 'Human Review',
      icon: UserCheck,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
      badgeColor: 'bg-amber-600 text-white',
    },
    { id: 'feedback', label: 'Feedback Loop', icon: BrainCircuit },
    { id: 'history', label: 'Processing History', icon: RefreshCw },
    { id: 'tests', label: 'Test Cases', icon: CheckCircle2 },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'docs', label: 'Documentation', icon: FileText },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Banner with System Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">InboxPilot</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI Assessment Core
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Email Understanding & Deterministic Guardrails
              </p>
            </div>
          </div>

          {/* Real-time Status Badges & Quick Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* LLM Status Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  stats?.llmStatus === 'ONLINE'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-sky-400'
                }`}
              />
              <span className="text-slate-300 font-medium hidden sm:inline">AI Engine:</span>
              <span
                className={
                  stats?.llmStatus === 'ONLINE'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-sky-400 font-semibold'
                }
              >
                {stats?.llmStatus === 'ONLINE' ? 'Gemini 3.8 Flash' : 'Simulated Sandbox'}
              </span>
            </div>

            {/* Guardrails Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">Guardrails:</span>
              <span className="text-emerald-400 font-semibold">Active (Deterministic)</span>
            </div>

            {/* Quick Process All Button */}
            <button
              onClick={onProcessAll}
              disabled={isProcessingAll}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
              title="Process all pending emails"
            >
              {isProcessingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Process All</span>
                </>
              )}
            </button>

            {/* Reset / Seed Store */}
            <button
              onClick={onSeedData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Reset sample test emails"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      item.badgeColor || 'bg-indigo-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
