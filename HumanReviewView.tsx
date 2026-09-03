import React, { useState } from 'react';
import {
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Edit3,
  Bot,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
} from 'lucide-react';
import {
  Email,
  AIAnalysis,
  Decision,
  EmailIntent,
  EmailUrgency,
  RecommendedAction,
} from '../types';

interface HumanReviewViewProps {
  emails: Email[];
  selectedEmailData: {
    email: Email;
    analysis?: AIAnalysis;
    decision?: Decision;
  } | null;
  onSelectEmail: (id: string) => void;
  onSubmitReview: (params: {
    emailId: string;
    action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'CORRECT';
    reviewerNotes?: string;
    correctedIntent?: EmailIntent;
    correctedUrgency?: EmailUrgency;
    correctedAction?: RecommendedAction;
  }) => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

export const HumanReviewView: React.FC<HumanReviewViewProps> = ({
  emails,
  selectedEmailData,
  onSelectEmail,
  onSubmitReview,
  onNavigateTab,
}) => {
  const reviewEmails = emails.filter((e) => e.status === 'HUMAN_REVIEW');

  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState<boolean>(false);

  // Correction form fields
  const [correctedIntent, setCorrectedIntent] = useState<EmailIntent>('Billing');
  const [correctedUrgency, setCorrectedUrgency] = useState<EmailUrgency>('Medium');
  const [correctedAction, setCorrectedAction] = useState<RecommendedAction>('Route to Billing');

  const currentEmail = selectedEmailData?.email;
  const currentAnalysis = selectedEmailData?.analysis;
  const currentDecision = selectedEmailData?.decision;

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO') => {
    if (!currentEmail) return;
    setIsSubmitting(true);
    try {
      await onSubmitReview({
        emailId: currentEmail.id,
        action,
        reviewerNotes,
      });
      setReviewerNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmail) return;
    setIsSubmitting(true);
    try {
      await onSubmitReview({
        emailId: currentEmail.id,
        action: 'CORRECT',
        reviewerNotes,
        correctedIntent,
        correctedUrgency,
        correctedAction,
      });
      setShowCorrectionForm(false);
      setReviewerNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const intentsList: EmailIntent[] = [
    'Billing',
    'Technical Support',
    'Sales',
    'Account Support',
    'General Support',
    'Complaint',
    'Cancellation',
    'Refund',
    'Other',
    'Unknown',
  ];

  const actionsList: RecommendedAction[] = [
    'Route to Billing',
    'Route to Technical Support',
    'Route to Sales',
    'Route to Account Support',
    'Provide Information',
    'Ask for Missing Information',
    'Recommend Refund',
    'Recommend Cancellation',
    'Human Review',
    'No Action',
    'Unable to Determine',
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-amber-400" />
            <span>Human Review & Approval Queue</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Evaluate high-risk requests, verify financial recommendations, and submit corrections to populate Feedback Memory.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold">
            {reviewEmails.length} Pending Review
          </span>
        </div>
      </div>

      {/* Main Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue List (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Pending Review Queue ({reviewEmails.length})</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {reviewEmails.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/50" />
                <p className="font-semibold text-slate-400">Queue is Clear</p>
                <p>No emails currently require human review.</p>
              </div>
            ) : (
              reviewEmails.map((email) => {
                const isSelected = selectedEmailData?.email.id === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => onSelectEmail(email.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500/70 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono text-indigo-400 font-bold">{email.id}</span>
                      <span>
                        {new Date(email.receivedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate">{email.subject}</h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{email.sender}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Review Panel (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
          {!currentEmail || currentEmail.status !== 'HUMAN_REVIEW' ? (
            <div className="text-center py-20 text-slate-500">
              <UserCheck className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400">Select an email from the queue</p>
              <p className="text-xs text-slate-500 mt-1">
                Inspect triggered safety guardrails, AI evidence, and submit approval or corrections.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-indigo-400 font-mono font-bold">
                      {currentEmail.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Requires Human Approval
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      currentDecision?.riskLevel === 'Critical'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    Risk Level: {currentDecision?.riskLevel || 'High'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1.5">{currentEmail.subject}</h2>
                <p className="text-xs text-slate-400">
                  Sender: <strong className="text-slate-300">{currentEmail.sender}</strong> &bull; Received:{' '}
                  {new Date(currentEmail.receivedAt).toLocaleString()}
                </p>
              </div>

              {/* Side-by-side Original Message & AI Grounding */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Original Message */}
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Original Email Body
                  </div>
                  <div className="whitespace-pre-wrap text-slate-200 font-sans leading-relaxed text-xs">
                    {currentEmail.body}
                  </div>
                </div>

                {/* AI Extracted Evidence */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                      <Bot className="w-3.5 h-3.5" />
                      <span>Gemini AI Understanding</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Conf: {((currentAnalysis?.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div>
                      <span className="text-slate-400">Intent:</span>{' '}
                      <strong className="text-white">{currentAnalysis?.intent}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Urgency:</span>{' '}
                      <strong className="text-amber-300">{currentAnalysis?.urgency}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Reasoning:</span>{' '}
                      <span className="text-slate-300 italic">
                        "{currentAnalysis?.reasoningSummary}"
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Guardrails Alert Banner */}
              {currentDecision?.safetyFlags && currentDecision.safetyFlags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Triggered Safety Guardrails ({currentDecision.safetyFlags.length})</span>
                  </div>
                  {currentDecision.safetyFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 space-y-0.5"
                    >
                      <div className="font-semibold flex items-center space-x-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold">
                          {flag.severity}
                        </span>
                        <span>{flag.description}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        {flag.triggeredRule}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Action & Decision Reason */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                    Recommended Action
                  </span>
                  <span className="font-bold text-sm text-indigo-300">
                    {currentDecision?.recommendedAction}
                  </span>
                </div>
                <p className="text-slate-300">
                  <strong>Evaluation Reason:</strong> {currentDecision?.reason}
                </p>
              </div>

              {/* Reviewer Notes Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Reviewer Notes & Justification (Recorded in Audit Trail)
                </label>
                <textarea
                  rows={2}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="e.g. Verified customer invoice. Request approved within grace period."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Reviewer Action Buttons Bar */}
              {!showCorrectionForm ? (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAction('APPROVE')}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Action (Simulated)</span>
                    </button>

                    <button
                      onClick={() => handleAction('REJECT')}
                      disabled={isSubmitting}
                      className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleAction('REQUEST_INFO')}
                      disabled={isSubmitting}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Request More Info</span>
                    </button>
                  </div>

                  {/* Trigger Correction Form */}
                  <button
                    onClick={() => {
                      setCorrectedIntent(currentAnalysis?.intent || 'Billing');
                      setCorrectedUrgency(currentAnalysis?.urgency || 'Medium');
                      setCorrectedAction(currentDecision?.recommendedAction || 'Route to Billing');
                      setShowCorrectionForm(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Correct Classification (Memory Loop)</span>
                  </button>
                </div>
              ) : (
                /* Human Feedback Correction Form */
                <form
                  onSubmit={handleCorrection}
                  className="p-4 rounded-xl bg-slate-800/90 border border-indigo-500/40 space-y-4 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Human Feedback Correction & Memory Registration</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCorrectionForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300">
                    Correcting this classification creates an auditable <strong>FeedbackMemory</strong> entry to guide future similar emails without claiming model retraining.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Corrected Intent</label>
                      <select
                        value={correctedIntent}
                        onChange={(e) => setCorrectedIntent(e.target.value as EmailIntent)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      >
                        {intentsList.map((intent) => (
                          <option key={intent} value={intent}>
                            {intent}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Corrected Urgency</label>
                      <select
                        value={correctedUrgency}
                        onChange={(e) => setCorrectedUrgency(e.target.value as EmailUrgency)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      >
                        {['Low', 'Medium', 'High', 'Critical'].map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Corrected Action</label>
                      <select
                        value={correctedAction}
                        onChange={(e) => setCorrectedAction(e.target.value as RecommendedAction)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      >
                        {actionsList.map((act) => (
                          <option key={act} value={act}>
                            {act}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-700">
                    <button
                      type="button"
                      onClick={() => setShowCorrectionForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow cursor-pointer"
                    >
                      Save Correction & Update Feedback Memory
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
