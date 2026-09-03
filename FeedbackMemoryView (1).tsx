import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  Tag,
  Zap,
} from 'lucide-react';
import { FeedbackMemory } from '../types';

interface FeedbackMemoryViewProps {
  memories: FeedbackMemory[];
  onSelectMemory?: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const FeedbackMemoryView: React.FC<FeedbackMemoryViewProps> = ({
  memories,
  onNavigateTab,
}) => {
  const [testInput, setTestInput] = useState<string>(
    'I was charged twice on my Visa statement for subscription'
  );
  const [testResult, setTestResult] = useState<{
    matched: boolean;
    memory?: FeedbackMemory;
    matchedKeywords?: string[];
  } | null>(null);

  const handleTestSimilarity = (e: React.FormEvent) => {
    e.preventDefault();
    const query = testInput.toLowerCase();
    let bestMatch: FeedbackMemory | null = null;
    let bestScore = 0;
    let matchedKws: string[] = [];

    for (const mem of memories) {
      const hits = mem.keywords.filter((k) => query.includes(k.toLowerCase()));
      if (hits.length > bestScore) {
        bestScore = hits.length;
        bestMatch = mem;
        matchedKws = hits;
      }
    }

    if (bestMatch && bestScore > 0) {
      setTestResult({
        matched: true,
        memory: bestMatch,
        matchedKeywords: matchedKws,
      });
    } else {
      setTestResult({ matched: false });
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <BrainCircuit className="w-6 h-6 text-indigo-400" />
          <span>Human Feedback Loop & Feedback Memory</span>
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Auditable memory knowledge base derived from human reviewer corrections. Guides future similar emails without claiming dangerous model retraining.
        </p>
      </div>

      {/* Architecture Concept Banner */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Feedback Loop Process Flow
          </span>
          <span className="text-xs text-slate-400">Zero Model Drift &bull; Deterministic Safety Guaranteed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {[
            { step: '1. Human Correction', desc: 'Operator corrects AI classification in Review Queue' },
            { step: '2. HumanFeedback', desc: 'Audit record created documenting before/after values' },
            { step: '3. FeedbackMemory', desc: 'Indexed keyword snippet added to memory store' },
            { step: '4. Future Similar Email', desc: 'New email matches historical correction keywords' },
            { step: '5. Informed Suggestion', desc: 'Surfaces recommendation while safety rules stay 100% active' },
          ].map((s, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 relative group hover:border-indigo-500/40"
            >
              <div className="font-semibold text-indigo-300">{s.step}</div>
              <div className="text-[11px] text-slate-400 mt-1">{s.desc}</div>
              {idx < 4 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Crucial Safety Rule:</strong> When Feedback Memory triggers a suggestion, safety guardrails (such as blocking automated refunds or data deletions) remain 100% active!
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Similarity Matcher Tester */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Interactive Feedback Memory Tester</h3>
          </div>
          <span className="text-xs text-slate-400">Live Memory Retrieval Test</span>
        </div>

        <form onSubmit={handleTestSimilarity} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Type an email snippet (e.g. 'I was charged twice on my credit card')..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Evaluate Match</span>
            </button>
          </div>
        </form>

        {testResult && (
          <div className="pt-2">
            {testResult.matched && testResult.memory ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Feedback Memory Matched!</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">
                    Memory ID: {testResult.memory.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-200 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Matched Keywords</span>
                    <span className="font-semibold text-emerald-300">
                      {testResult.matchedKeywords?.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Suggested Intent</span>
                    <span className="font-semibold text-white">
                      {testResult.memory.correctedIntent}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Suggested Action</span>
                    <span className="font-semibold text-indigo-300">
                      {testResult.memory.correctedAction}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 italic pt-1">
                  Reviewer Note: "{testResult.memory.reviewerNote}"
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-400 text-center">
                No matching feedback memory found for this query. The system would fall back to standard Gemini understanding.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Saved Feedback Memories Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Stored Feedback Memories ({memories.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Search-Indexed Knowledge Base</span>
        </div>

        <div className="space-y-3">
          {memories.map((mem) => (
            <div
              key={mem.id}
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/50 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">{mem.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Intent: {mem.correctedIntent}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    Action: {mem.correctedAction}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Created: {new Date(mem.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Indexed Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {mem.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-[11px] font-mono"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Reviewer Note
                  </span>
                  <p className="text-slate-300 italic text-[11px]">"{mem.reviewerNote}"</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                <strong className="text-slate-300 block mb-0.5">Example Subject:</strong>{' '}
                {mem.exampleEmailSubject}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
