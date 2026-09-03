import React from 'react';
import {
  Inbox,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Clock,
  ArrowRight,
  TrendingUp,
  Brain,
  Layers,
  ArrowUpRight,
  Sparkles,
  Bot,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { Email, SystemHealthStats, AuditEvent } from '../types';

interface DashboardViewProps {
  stats: SystemHealthStats | null;
  emails: Email[];
  auditLogs: AuditEvent[];
  onSelectEmail: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  onRunQuickDemo: (scenario: 'billing' | 'refund' | 'ambiguous') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  emails,
  auditLogs,
  onSelectEmail,
  onNavigateTab,
  onRunQuickDemo,
}) => {
  const pendingEmails = emails.filter((e) => e.status === 'RECEIVED').length;
  const humanReviewEmails = emails.filter((e) => e.status === 'HUMAN_REVIEW').length;
  const completedEmails = emails.filter((e) => e.status === 'COMPLETED').length;

  const kpiCards = [
    {
      label: 'Total Ingested',
      value: emails.length,
      sub: `${pendingEmails} pending processing`,
      icon: Inbox,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Auto-Completed',
      value: stats?.autoCompletedCount || completedEmails,
      sub: 'Safe automated department routing',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Human Review Queue',
      value: stats?.humanReviewCount || humanReviewEmails,
      sub: 'Safety flagged or ambiguous',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      action: () => onNavigateTab('review'),
    },
    {
      label: 'Safety Blocks Raised',
      value: stats?.safetyBlockCount || 0,
      sub: 'Financial, refund & deletion blocks',
      icon: ShieldAlert,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: 'Avg Latency',
      value: `${stats?.averageProcessingTimeMs || 480} ms`,
      sub: 'Multi-stage pipeline execution',
      icon: Clock,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Pipeline Success',
      value: `${stats?.successRate || 100}%`,
      sub: 'Zero unhandled exceptions',
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  const pipelineStages = [
    { name: '1. Ingestion', desc: 'MIME validation & length limits' },
    { name: '2. Gemini AI', desc: 'Intent, details & confidence' },
    { name: '3. Schema Check', desc: 'JSON validator & retry logic' },
    { name: '4. Decision Engine', desc: 'Deterministic business rules' },
    { name: '5. Guardrails', desc: 'Financial & safety check' },
    { name: '6. Outcome', desc: 'Human Review vs Auto-Route' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Welcome & Assessment Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 rounded-2xl border border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assessment Architecture Active</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              AI-Powered Email Processing Control Center
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              InboxPilot enforces a strict barrier between non-deterministic LLM understanding (Gemini) and deterministic, code-governed business rules with automated safety guardrails.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onRunQuickDemo('billing')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Demo: Normal Billing
            </button>
            <button
              onClick={() => onRunQuickDemo('refund')}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              Demo: Refund Guardrail
            </button>
            <button
              onClick={() => onNavigateTab('tests')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Run 12 Tests</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.action}
              className={`p-4 rounded-xl border ${kpi.bg} transition-all ${
                kpi.action ? 'cursor-pointer hover:border-amber-400/50 hover:scale-[1.02]' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{kpi.value}</div>
              <div className="text-[11px] text-slate-400 mt-1 leading-tight">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Interactive Architecture Flow Diagram */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">
              End-to-End Processing Pipeline Architecture
            </h2>
          </div>
          <span className="text-xs text-slate-400">Strict Separation of AI vs Business Logic</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {pipelineStages.map((stage, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 relative group hover:border-indigo-500/40 transition-colors"
            >
              <div className="text-xs font-semibold text-indigo-300">{stage.name}</div>
              <div className="text-[11px] text-slate-400 mt-1">{stage.desc}</div>
              {i < pipelineStages.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Safety Note */}
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Safety Invariant:</strong> Financial transactions, refunds, cancellations, and deletions never execute automatically. Urgency cannot bypass human approval.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('docs')}
            className="text-amber-400 hover:underline font-semibold shrink-0 ml-3"
          >
            Read Architecture &rarr;
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Ingested Emails & Real-time Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Ingested Emails */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Inbox className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Recent Emails in System</h3>
              </div>
              <button
                onClick={() => onNavigateTab('inbox')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 cursor-pointer"
              >
                <span>View Inbox ({emails.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {emails.slice(0, 5).map((email) => (
                <div
                  key={email.id}
                  onClick={() => onSelectEmail(email.id)}
                  className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-white truncate max-w-[220px]">
                        {email.subject}
                      </span>
                      {email.categoryTag && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">
                          {email.categoryTag}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      From: {email.sender}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        email.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : email.status === 'HUMAN_REVIEW'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : email.status === 'PROCESSING'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {email.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Click any email to inspect AI analysis & decision trace</span>
            <button
              onClick={() => onNavigateTab('inbox')}
              className="text-indigo-400 hover:underline font-medium"
            >
              Open Inbox &rarr;
            </button>
          </div>
        </div>

        {/* Real-time Audit Activity Stream */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Live Audit Event Log</h3>
              </div>
              <span className="text-xs text-slate-400">Sanitized & Immutable</span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {auditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-indigo-400">
                      {log.eventType}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1 leading-snug">{log.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Recorded {auditLogs.length} total system events</span>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-indigo-400 hover:underline font-medium"
            >
              View Processing Runs &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
