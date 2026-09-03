import React, { useState } from 'react';
import {
  Inbox,
  Search,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Sparkles,
  Bot,
  BrainCircuit,
  Filter,
  RefreshCw,
  Send,
  HelpCircle,
  FileCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  Email,
  AIAnalysis,
  Decision,
  HumanFeedback,
  ProcessingRun,
  AuditEvent,
} from '../types';

interface InboxViewProps {
  emails: Email[];
  selectedEmailId: string | null;
  selectedEmailData: {
    email: Email;
    analysis?: AIAnalysis;
    decision?: Decision;
    feedback?: HumanFeedback;
    runs?: ProcessingRun[];
    audits?: AuditEvent[];
  } | null;
  onSelectEmail: (id: string) => void;
  onProcessEmail: (id: string, options?: {
    forceMalformedAI?: boolean;
    forceLLMFailure?: boolean;
    forceLowConfidence?: boolean;
    simulatedRetries?: number;
  }) => Promise<void>;
  onCreateEmail: (newEmail: { sender: string; subject: string; body: string; categoryTag?: string }) => void;
  onNavigateTab: (tab: string) => void;
  isProcessing: boolean;
}

export const InboxView: React.FC<InboxViewProps> = ({
  emails,
  selectedEmailId,
  selectedEmailData,
  onSelectEmail,
  onProcessEmail,
  onCreateEmail,
  onNavigateTab,
  isProcessing,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showComposeModal, setShowComposeModal] = useState<boolean>(false);
  const [composeSender, setComposeSender] = useState<string>('client@enterprise.com');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [composeTag, setComposeTag] = useState<string>('Custom Inquiry');

  // Simulation test flags for selected email
  const [forceSimError, setForceSimError] = useState<boolean>(false);
  const [forceMalformed, setForceMalformed] = useState<boolean>(false);
  const [forceLowConf, setForceLowConf] = useState<boolean>(false);

  const filteredEmails = emails.filter((e) => {
    if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.subject.toLowerCase().includes(q) ||
        e.sender.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject.trim() || !composeBody.trim()) return;
    onCreateEmail({
      sender: composeSender,
      subject: composeSubject,
      body: composeBody,
      categoryTag: composeTag,
    });
    setComposeSubject('');
    setComposeBody('');
    setShowComposeModal(false);
  };

  const currentEmail = selectedEmailData?.email;
  const currentAnalysis = selectedEmailData?.analysis;
  const currentDecision = selectedEmailData?.decision;
  const currentAudits = selectedEmailData?.audits || [];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Inbox className="w-6 h-6 text-indigo-400" />
            <span>Email Processing Inbox</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Ingest synthetic or custom emails, trigger multi-stage AI understanding, and inspect deterministic routing.
          </p>
        </div>

        <button
          onClick={() => setShowComposeModal(true)}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Compose Test Email</span>
        </button>
      </div>

      {/* Main Two-Pane Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Email List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4">
          {/* Filter Tabs & Search */}
          <div className="space-y-3">
            <div className="flex space-x-1 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-x-auto scrollbar-none">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'RECEIVED', label: 'Pending' },
                { id: 'HUMAN_REVIEW', label: 'In Review' },
                { id: 'COMPLETED', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterStatus === tab.id
                      ? 'bg-slate-700 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject, sender, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Email Items List */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredEmails.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No emails match the selected filter.
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedEmailId === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => onSelectEmail(email.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-indigo-500/70 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 mb-1">
                          {email.categoryTag && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {email.categoryTag}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(email.receivedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-white truncate max-w-[280px]">
                          {email.subject}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {email.sender}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
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
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Email Inspector & Multi-Stage Execution (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
          {!currentEmail ? (
            <div className="text-center py-20 text-slate-500">
              <Bot className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400">Select an email to inspect</p>
              <p className="text-xs text-slate-500 mt-1">
                Choose an item from the left pane to view message content, run AI understanding, and verify decision rules.
              </p>
            </div>
          ) : (
            <>
              {/* Email Header & Action Bar */}
              <div className="border-b border-slate-800 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-indigo-400 font-mono font-bold">
                        {currentEmail.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          currentEmail.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : currentEmail.status === 'HUMAN_REVIEW'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {currentEmail.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">
                      {currentEmail.subject}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      From: <strong className="text-slate-300">{currentEmail.sender}</strong> &bull; Received:{' '}
                      {new Date(currentEmail.receivedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Primary Trigger: Process Email */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        onProcessEmail(currentEmail.id, {
                          forceLLMFailure: forceSimError,
                          forceMalformedAI: forceMalformed,
                          forceLowConfidence: forceLowConf,
                        })
                      }
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Executing Pipeline...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Process Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Simulation Testing Tools Collapsible */}
                <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
                  <div className="flex items-center justify-between text-slate-400 font-medium mb-2">
                    <span className="flex items-center space-x-1.5">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Pipeline Simulation Controls (Assessment Testing):</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-slate-300">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forceSimError}
                        onChange={(e) => setForceSimError(e.target.checked)}
                        className="rounded bg-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Simulate LLM 503 Timeout & Retries</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forceMalformed}
                        onChange={(e) => setForceMalformed(e.target.checked)}
                        className="rounded bg-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Simulate Malformed JSON Payload</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forceLowConf}
                        onChange={(e) => setForceLowConf(e.target.checked)}
                        className="rounded bg-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Force Low Confidence (&lt;0.70)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Message Body Content */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Original Email Payload
                </div>
                <div className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {currentEmail.body}
                </div>
              </div>

              {/* Pipeline Results Section */}
              {currentAnalysis ? (
                <div className="space-y-4">
                  {/* AI Understanding Card */}
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          LLM AI Understanding (Gemini 3.8 Flash)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">Confidence:</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            currentAnalysis.confidence >= 0.8
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : currentAnalysis.confidence >= 0.7
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {(currentAnalysis.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Classified Intent</span>
                        <span className="font-semibold text-white">{currentAnalysis.intent}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Assessed Urgency</span>
                        <span
                          className={`font-semibold ${
                            currentAnalysis.urgency === 'Critical'
                              ? 'text-rose-400'
                              : currentAnalysis.urgency === 'High'
                              ? 'text-amber-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {currentAnalysis.urgency}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">Schema Validation</span>
                        <span
                          className={`font-semibold ${
                            currentAnalysis.validationPassed ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {currentAnalysis.validationPassed ? 'Passed (Strict JSON)' : 'Failed'}
                        </span>
                      </div>
                    </div>

                    {/* Important Details */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Important Details Extracted
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                        {currentAnalysis.importantDetails.map((det, i) => (
                          <li key={i}>{det}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Missing Information */}
                    {currentAnalysis.missingInformation.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                        <strong className="block mb-0.5">Missing Required Information:</strong>
                        <ul className="list-disc list-inside space-y-0.5">
                          {currentAnalysis.missingInformation.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reasoning Summary */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        AI Reasoning Evidence
                      </span>
                      <p className="text-xs text-slate-300 italic bg-slate-900/40 p-2 rounded-lg border border-slate-800">
                        "{currentAnalysis.reasoningSummary}"
                      </p>
                    </div>
                  </div>

                  {/* Deterministic Decision Card */}
                  {currentDecision && (
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <BrainCircuit className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Deterministic Decision Engine & Safety
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                            currentDecision.riskLevel === 'Critical'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : currentDecision.riskLevel === 'High'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : currentDecision.riskLevel === 'Medium'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          Risk: {currentDecision.riskLevel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-400 block text-[11px]">Recommended Action</span>
                          <span className="font-bold text-indigo-300 text-sm">
                            {currentDecision.recommendedAction}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-400 block text-[11px]">Human Approval Required</span>
                          <span
                            className={`font-semibold ${
                              currentDecision.requiresHumanApproval
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {currentDecision.requiresHumanApproval ? 'YES (Escalated to Review)' : 'NO (Auto-Routed)'}
                          </span>
                        </div>
                      </div>

                      {/* Feedback Memory Matched Notification */}
                      {currentDecision.feedbackMemoryMatched && (
                        <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start space-x-2">
                          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <strong>Feedback Memory Active:</strong> {currentDecision.feedbackMemoryMatched.matchedSnippet}
                            <div className="text-[11px] text-indigo-400 mt-0.5">
                              Reviewer Note: "{currentDecision.feedbackMemoryMatched.reviewerNote}" &bull; Suggesting: {currentDecision.feedbackMemoryMatched.suggestedAction}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Feedback memory used — not model training. Safety rules remain 100% active.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Safety Flags List */}
                      {currentDecision.safetyFlags.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
                            Safety Guardrails Triggered ({currentDecision.safetyFlags.length})
                          </span>
                          {currentDecision.safetyFlags.map((flag, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-0.5"
                            >
                              <div className="font-semibold flex items-center space-x-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                <span>[{flag.severity}] {flag.type}</span>
                              </div>
                              <p className="text-[11px] text-slate-300">{flag.description}</p>
                              <p className="text-[10px] text-slate-400 italic">{flag.triggeredRule}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Reason */}
                      <p className="text-xs text-slate-300">
                        <strong>Reason:</strong> {currentDecision.reason}
                      </p>

                      {/* If In Review Queue, direct button */}
                      {currentEmail.status === 'HUMAN_REVIEW' && (
                        <div className="pt-2 flex items-center justify-between border-t border-slate-700/60">
                          <span className="text-xs text-amber-400 font-medium">
                            Pending human review resolution
                          </span>
                          <button
                            onClick={() => onNavigateTab('review')}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
                          >
                            Open in Human Review Queue &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-800 text-center text-xs text-slate-500">
                  This email has not been processed yet. Click <strong>"Process Email"</strong> above to run through the AI understanding and decision pipeline.
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-2.5 rounded-lg bg-slate-800/30 border border-slate-800 text-[11px] text-slate-500 text-center">
                All external actions, refunds, cancellations, and department dispatches are safely simulated for assessment purposes.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compose Test Email Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Compose Synthetic Test Email</h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Sender Email</label>
                <input
                  type="email"
                  required
                  value={composeSender}
                  onChange={(e) => setComposeSender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding invoice #INV-9901 or Need refund"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Message Body</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter email body content..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Scenario Category Tag</label>
                <input
                  type="text"
                  value={composeTag}
                  onChange={(e) => setComposeTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow"
                >
                  Ingest Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
