import React, { useState } from 'react';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Bot,
  Layers,
} from 'lucide-react';
import { ProcessingRun, AuditEvent, Email } from '../types';

interface ProcessingHistoryViewProps {
  runs: ProcessingRun[];
  auditLogs: AuditEvent[];
  emails: Email[];
  onSelectEmail: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const ProcessingHistoryView: React.FC<ProcessingHistoryViewProps> = ({
  runs,
  auditLogs,
  emails,
  onSelectEmail,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const filteredRuns = runs.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.emailId.toLowerCase().includes(q) ||
      (r.error && r.error.toLowerCase().includes(q))
    );
  });

  const getEmailSubject = (emailId: string) => {
    const em = emails.find((e) => e.id === emailId);
    return em ? em.subject : 'Unknown Email';
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 text-indigo-400" />
            <span>Processing History & Execution Runs</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Audit waterfall timelines, retry attempts, backoff executions, and schema validation traces.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Run ID or Email ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Runs Table / Accordion */}
      <div className="space-y-3">
        {filteredRuns.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-500 text-xs">
            No processing runs found.
          </div>
        ) : (
          filteredRuns.map((run) => {
            const isExpanded = expandedRunId === run.id;
            const runAudits = auditLogs.filter((a) => a.emailId === run.emailId);

            return (
              <div
                key={run.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden transition-all"
              >
                {/* Run Row Summary */}
                <div
                  onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <button className="text-slate-500">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-white">{run.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            run.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : run.status === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {run.status}
                        </span>
                        {run.retryCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {run.retryCount} {run.retryCount === 1 ? 'Retry' : 'Retries'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1.5">
                        <span className="font-mono text-indigo-400">{run.emailId}</span>
                        <span>&bull;</span>
                        <span className="truncate max-w-[320px] text-slate-300">
                          {getEmailSubject(run.emailId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{run.processingTimeMs} ms</span>
                    </div>
                    <span>{new Date(run.startedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Expanded Detailed Waterfall & Audits */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800 bg-slate-950/40 space-y-5">
                    {/* Execution Attempts Waterfall */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span>Execution Pipeline Waterfall & Attempts</span>
                      </h4>

                      <div className="space-y-2">
                        {run.attempts.length === 0 ? (
                          <div className="p-3 rounded-lg bg-slate-900 text-slate-500 text-xs">
                            Direct execution without retries.
                          </div>
                        ) : (
                          run.attempts.map((att, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                att.success
                                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                {att.success ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400" />
                                )}
                                <div>
                                  <span className="font-bold">
                                    Attempt #{att.attemptNumber}: Stage {att.stage}
                                  </span>
                                  {att.error && (
                                    <p className="text-[11px] text-rose-300 mt-0.5">
                                      Error: {att.error}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {att.durationMs} ms
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Associated Audit Events */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        <span>Sanitized Audit Events for this Email ({runAudits.length})</span>
                      </h4>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {runAudits.map((aud) => (
                          <div
                            key={aud.id}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-start justify-between gap-3"
                          >
                            <div>
                              <span className="font-mono text-[10px] font-bold text-indigo-400">
                                {aud.eventType}
                              </span>
                              <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">
                                {aud.message}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(aud.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          onSelectEmail(run.emailId);
                          onNavigateTab('inbox');
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                      >
                        Inspect in Inbox &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
