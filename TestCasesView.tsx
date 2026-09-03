import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  Zap,
  Clock,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { TestCaseResult } from '../types';

interface TestCasesViewProps {
  testResults: TestCaseResult[];
  onRunTests: () => Promise<void>;
  isRunningTests: boolean;
}

export const TestCasesView: React.FC<TestCasesViewProps> = ({
  testResults,
  onRunTests,
  isRunningTests,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const passedCount = testResults.filter((t) => t.passed).length;
  const failedCount = testResults.filter((t) => !t.passed).length;
  const totalCount = testResults.length;
  const successRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  const filteredTests = testResults.filter((t) => {
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    return true;
  });

  const categories = [
    'ALL',
    'Standard Classification',
    'Safety & Guardrails',
    'Reliability & Resilience',
    'Feedback Loop',
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Header & Run Control */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 rounded-2xl border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Assessment Test Matrix (12 Scenarios)</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Automated Verification Test Suite
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Executes live tests verifying Gemini classification, deterministic guardrails, 3-retry resilience, and feedback memory.
            </p>
          </div>

          <button
            onClick={onRunTests}
            disabled={isRunningTests}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isRunningTests ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Test Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run All 12 Test Cases</span>
              </>
            )}
          </button>
        </div>

        {/* Results Banner Metrics */}
        {totalCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <span className="text-slate-400 block text-[11px]">Total Scenarios</span>
              <span className="text-xl font-bold text-white">{totalCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <span className="text-emerald-400 block text-[11px]">Passed</span>
              <span className="text-xl font-bold text-emerald-400">{passedCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
              <span className="text-rose-400 block text-[11px]">Failed</span>
              <span className="text-xl font-bold text-rose-400">{failedCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
              <span className="text-indigo-400 block text-[11px]">Success Rate</span>
              <span className="text-xl font-bold text-indigo-300">{successRate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`py-1.5 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-500 text-xs">
            No tests executed yet. Click <strong>"Run All 12 Test Cases"</strong> above to verify the system.
          </div>
        ) : (
          filteredTests.map((test) => {
            const isExpanded = expandedTestId === test.id;
            return (
              <div
                key={test.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
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
                        <span className="font-mono text-xs font-bold text-slate-400">{test.id}</span>
                        <h3 className="text-xs font-bold text-white">{test.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {test.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{test.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[11px] text-slate-500">{test.executionTimeMs} ms</span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase flex items-center space-x-1 ${
                        test.passed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {test.passed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASSED</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>FAILED</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800 bg-slate-950/40 space-y-4 text-xs">
                    {/* Input Snippet */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider block">
                        Input Test Email
                      </span>
                      <div className="text-white font-medium">Subject: {test.inputEmail.subject}</div>
                      <div className="text-slate-300 text-[11px] italic">"{test.inputEmail.body}"</div>
                    </div>

                    {/* Expected vs Actual Comparison Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Expected */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <span className="text-indigo-400 font-bold uppercase text-[10px] tracking-wider block">
                          Expected Constraints
                        </span>
                        <div className="text-slate-300">
                          Intent: <strong className="text-white">{test.expected.intent || 'Any'}</strong>
                        </div>
                        <div className="text-slate-300">
                          Requires Review:{' '}
                          <strong className="text-white">
                            {test.expected.requiresHumanReview ? 'YES' : 'NO'}
                          </strong>
                        </div>
                        {test.expected.expectedSafetyFlag && (
                          <div className="text-amber-300">
                            Expected Guardrail: <strong>{test.expected.expectedSafetyFlag}</strong>
                          </div>
                        )}
                      </div>

                      {/* Actual */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider block">
                          Actual System Execution
                        </span>
                        <div className="text-slate-300">
                          Intent: <strong className="text-white">{test.actual.intent || 'N/A'}</strong> (Conf: {test.actual.confidence ? `${(test.actual.confidence * 100).toFixed(0)}%` : 'N/A'})
                        </div>
                        <div className="text-slate-300">
                          Action: <strong className="text-white">{test.actual.recommendedAction || 'N/A'}</strong>
                        </div>
                        <div className="text-slate-300">
                          Requires Review:{' '}
                          <strong className="text-white">
                            {test.actual.requiresHumanReview ? 'YES' : 'NO'}
                          </strong>
                        </div>
                        {test.actual.safetyFlags && test.actual.safetyFlags.length > 0 && (
                          <div className="text-rose-300">
                            Raised Flags: <strong>{test.actual.safetyFlags.join(', ')}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Diagnostic Summary */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                      <strong>Verification Note:</strong> {test.details}
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
