import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store';
import { processEmailPipeline } from './server/pipeline';
import { runAllTestCases } from './server/testSuite';
import { Email, FinalOutcome, RecommendedAction } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health & System Stats
  app.get('/api/health', (req, res) => {
    const stats = store.getStats();
    res.json({
      status: 'ok',
      service: 'InboxPilot Email Processing System',
      llmStatus: stats.llmStatus,
      apiKeyConfigured: stats.apiKeyConfigured,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/stats', (req, res) => {
    res.json(store.getStats());
  });

  // 2. Config Endpoints
  app.get('/api/config', (req, res) => {
    res.json(store.config);
  });

  app.post('/api/config', (req, res) => {
    const { maxRetries, maxEmailLength, maxOutputTokens, maxProcessingTimeMs, minConfidenceThreshold } = req.body;
    if (typeof maxRetries === 'number') store.config.maxRetries = maxRetries;
    if (typeof maxEmailLength === 'number') store.config.maxEmailLength = maxEmailLength;
    if (typeof maxOutputTokens === 'number') store.config.maxOutputTokens = maxOutputTokens;
    if (typeof maxProcessingTimeMs === 'number') store.config.maxProcessingTimeMs = maxProcessingTimeMs;
    if (typeof minConfidenceThreshold === 'number') store.config.minConfidenceThreshold = minConfidenceThreshold;
    res.json({ success: true, config: store.config });
  });

  // 3. Email CRUD & Seeding
  app.get('/api/emails', (req, res) => {
    const emailsList = Array.from(store.emails.values()).sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
    res.json(emailsList);
  });

  app.get('/api/emails/:id', (req, res) => {
    const email = store.emails.get(req.params.id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const analysis = store.analyses.get(email.id);
    const decision = store.decisions.get(email.id);
    const feedback = store.feedbacks.get(email.id);
    const runs = Array.from(store.processingRuns.values()).filter((r) => r.emailId === email.id);
    const audits = store.auditEvents.filter((a) => a.emailId === email.id);

    res.json({
      email,
      analysis,
      decision,
      feedback,
      runs,
      audits,
    });
  });

  app.post('/api/emails', (req, res) => {
    const { sender, subject, body, categoryTag } = req.body;
    if (!sender || !subject || !body) {
      return res.status(400).json({ error: 'Sender, subject, and body are required.' });
    }

    const newEmail: Email = {
      id: `em-user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: sender.trim(),
      subject: subject.trim(),
      body: body.trim(),
      receivedAt: new Date().toISOString(),
      status: 'RECEIVED',
      categoryTag: categoryTag || 'Custom Test Email',
    };

    store.emails.set(newEmail.id, newEmail);
    store.logAudit(
      newEmail.id,
      'EMAIL_RECEIVED',
      `Manual test email ingested from ${newEmail.sender}: "${newEmail.subject}"`,
      { sender: newEmail.sender, subject: newEmail.subject }
    );

    res.status(201).json(newEmail);
  });

  app.post('/api/emails/seed', (req, res) => {
    store.seedInitialData();
    res.json({ success: true, message: 'Store reset and re-seeded successfully.' });
  });

  // 4. Processing Pipeline Endpoints
  app.post('/api/process/:id', async (req, res) => {
    try {
      const { forceMalformedAI, forceLLMFailure, forceLowConfidence, simulatedRetries } = req.body || {};
      const result = await processEmailPipeline(req.params.id, {
        forceMalformedAI,
        forceLLMFailure,
        forceLowConfidence,
        simulatedRetries,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Pipeline processing failed' });
    }
  });

  app.post('/api/process-all', async (req, res) => {
    try {
      const pendingEmails = Array.from(store.emails.values()).filter(
        (e) => e.status === 'RECEIVED' || e.status === 'FAILED'
      );
      const results = [];
      for (const email of pendingEmails) {
        const resPipeline = await processEmailPipeline(email.id);
        results.push(resPipeline);
      }
      res.json({ processedCount: results.length, results });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Human Review and Feedback Endpoints
  app.post('/api/human-review', (req, res) => {
    const {
      emailId,
      action, // 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'CORRECT'
      reviewerNotes,
      correctedIntent,
      correctedUrgency,
      correctedAction,
    } = req.body;

    const email = store.emails.get(emailId);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const decision = store.decisions.get(emailId);
    const analysis = store.analyses.get(emailId);

    if (action === 'CORRECT') {
      if (!correctedIntent || !correctedAction) {
        return res.status(400).json({ error: 'correctedIntent and correctedAction are required for correction' });
      }

      const feedbackId = `fb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const feedbackRecord = {
        id: feedbackId,
        emailId,
        previousIntent: analysis?.intent || 'Unknown',
        correctedIntent,
        previousUrgency: analysis?.urgency || 'Unknown',
        correctedUrgency: correctedUrgency || analysis?.urgency || 'Medium',
        previousAction: decision?.recommendedAction || 'Unable to Determine',
        correctedAction,
        reviewerNote: reviewerNotes || 'Reviewer updated classification and routing rule.',
        createdAt: new Date().toISOString(),
      };
      store.feedbacks.set(emailId, feedbackRecord);

      // Create FeedbackMemory
      const memoryId = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      // Extract keywords from subject + body
      const rawWords = `${email.subject} ${email.body}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !['hello', 'please', 'regards', 'thanks', 'about', 'would', 'could'].includes(w));
      const uniqueKeywords = Array.from(new Set(rawWords)).slice(0, 6);

      store.feedbackMemories.set(memoryId, {
        id: memoryId,
        exampleEmailSubject: email.subject,
        exampleEmailBody: email.body.slice(0, 160),
        keywords: uniqueKeywords.length > 0 ? uniqueKeywords : [correctedIntent.toLowerCase()],
        correctedIntent,
        correctedUrgency: correctedUrgency || 'Medium',
        correctedAction,
        reviewerNote: reviewerNotes || 'Human correction rule added',
        timesApplied: 0,
        createdAt: new Date().toISOString(),
      });

      // Update decision
      if (decision) {
        decision.recommendedAction = correctedAction;
        decision.reason = `Human corrected: ${reviewerNotes || 'Updated by reviewer'}`;
        decision.finalOutcome = 'Human Approved';
        decision.resolvedAt = new Date().toISOString();
        decision.resolvedBy = 'Human Reviewer';
        decision.reviewerNotes = reviewerNotes;
      }
      email.status = 'COMPLETED';

      store.logAudit(
        emailId,
        'HUMAN_CORRECTION_SAVED',
        `Human correction saved: Intent "${analysis?.intent}" -> "${correctedIntent}", Action "${decision?.recommendedAction}" -> "${correctedAction}". Stored in FeedbackMemory.`,
        { correctedIntent, correctedAction, memoryId }
      );

      return res.json({ success: true, email, decision, feedback: feedbackRecord });
    }

    let finalOutcome: FinalOutcome = 'Completed';
    let auditType: any = 'HUMAN_APPROVAL_GRANTED';

    if (action === 'APPROVE') {
      email.status = 'COMPLETED';
      finalOutcome = 'Human Approved';
      auditType = 'HUMAN_APPROVAL_GRANTED';
    } else if (action === 'REJECT') {
      email.status = 'COMPLETED';
      finalOutcome = 'Rejected';
      auditType = 'HUMAN_APPROVAL_REJECTED';
    } else if (action === 'REQUEST_INFO') {
      email.status = 'COMPLETED';
      finalOutcome = 'More Info Needed';
      auditType = 'HUMAN_INFO_REQUESTED';
    }

    if (decision) {
      decision.finalOutcome = finalOutcome;
      decision.resolvedAt = new Date().toISOString();
      decision.resolvedBy = 'Human Reviewer';
      decision.reviewerNotes = reviewerNotes;
    }

    store.logAudit(
      emailId,
      auditType,
      `Human reviewer resolved review with outcome: ${finalOutcome}. Notes: ${reviewerNotes || 'None'} (Simulated external execution - no real external mutations performed)`,
      { action, reviewerNotes, outcome: finalOutcome }
    );

    res.json({ success: true, email, decision });
  });

  // 6. Feedback Memory Endpoints
  app.get('/api/feedback-memory', (req, res) => {
    const list = Array.from(store.feedbackMemories.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(list);
  });

  // 7. Processing History & Runs
  app.get('/api/processing-runs', (req, res) => {
    const runs = Array.from(store.processingRuns.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    res.json(runs);
  });

  // 8. Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    res.json(store.auditEvents);
  });

  // 9. Automated Test Suite
  app.get('/api/test-cases/run', async (req, res) => {
    try {
      const results = await runAllTestCases();
      const passedCount = results.filter((r) => r.passed).length;
      res.json({
        total: results.length,
        passed: passedCount,
        failed: results.length - passedCount,
        successRate: Math.round((passedCount / results.length) * 100),
        results,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InboxPilot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
