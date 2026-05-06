import { useState } from "react";
import { exportReport } from "./exportReport";

type AgentResult = {
  classification: {
    intent: string;
    confidence: number;
    summary: string;
  };
  actions: Array<
    | { type: "reply"; message: string }
    | { type: "create_issue"; title: string; body: string; suspectedFiles?: Array<{ path: string; url?: string }> }
    | { type: "generate_doc"; title: string; markdown: string }
    | { type: "human_review"; reason: string; suggestedNextStep: string }
  >;
  executedActions: Array<{ type: string; url?: string; message: string }>;
  trace: string[];
};

export function ReportsPage() {
  const [feedback, setFeedback] = useState("Clicking Export CSV crashes when no rows are loaded.");
  const [status, setStatus] = useState("Ready");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rows = undefined;

  function handleExportClick() {
    const csv = exportReport(rows);
    console.log(csv);
  }

  async function handleFeedbackSubmit() {
    if (isSubmitting) {
      return;
    }

    setStatus("Sending feedback...");
    setResult(null);
    setIsSubmitting(true);

    try {
      const result = await fetch("http://localhost:3001/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source: "web",
          currentPage: window.location.pathname,
          userId: "sample-user-1",
          message: feedback
        })
      });

      const payload = await result.json();
      setStatus(result.ok ? "Processed" : "Failed");
      setResult(payload);
    } catch {
      setStatus("Failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Reports</h1>
      <p>Revenue report for the current quarter.</p>
      <div className="toolbar">
        <strong>Quarterly revenue</strong>
        <button onClick={handleExportClick}>Export CSV</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Region</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2}>No rows loaded</td>
          </tr>
        </tbody>
      </table>
      <section className="feedback-panel">
        <h2>Submit feedback</h2>
        <p className="feedback-hint">
          This form sends feedback to the SDK backend. The backend analyzes the GitHub repository configured in its
          environment variables.
        </p>
        <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} />
        <div className="feedback-actions">
          <button onClick={handleFeedbackSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Send Feedback"}
          </button>
          <span>{status}</span>
        </div>
        {result ? <AgentResultView result={result} /> : null}
      </section>
    </main>
  );
}

function AgentResultView({ result }: { result: AgentResult }) {
  const replyAction = result.actions.find((action) => action.type === "reply");
  const workflowAction = result.actions.find((action) => action.type !== "reply");

  return (
    <section className="agent-result">
      <div className="result-summary">
        <div>
          <span>Intent</span>
          <strong>{result.classification.intent}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{Math.round(result.classification.confidence * 100)}%</strong>
        </div>
      </div>

      <article className="result-card">
        <h3>Summary</h3>
        <p>{result.classification.summary}</p>
      </article>

      {replyAction ? <ActionView action={replyAction} /> : null}
      {workflowAction ? <ActionView action={workflowAction} /> : null}

      {result.executedActions.length > 0 ? (
        <article className="result-card">
          <h3>Executed</h3>
          {result.executedActions.map((executedAction) => (
            <p key={`${executedAction.type}-${executedAction.url ?? executedAction.message}`}>
              {executedAction.message}
              {executedAction.url && isExternalUrl(executedAction.url) ? (
                <a href={executedAction.url} target="_blank" rel="noreferrer">
                  Open
                </a>
              ) : executedAction.url ? (
                <code>{executedAction.url}</code>
              ) : null}
            </p>
          ))}
        </article>
      ) : null}

      <article className="result-card">
        <h3>Trace</h3>
        <ol>
          {result.trace.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>
    </section>
  );
}

function ActionView({ action }: { action: AgentResult["actions"][number] }) {
  if (action.type === "reply") {
    return (
      <article className="result-card">
        <h3>Reply</h3>
        <p>{action.message}</p>
      </article>
    );
  }

  if (action.type === "create_issue") {
    return (
      <article className="result-card">
        <h3>Bug Issue</h3>
        <p>
          <strong>{action.title}</strong>
        </p>
        {action.suspectedFiles && action.suspectedFiles.length > 0 ? (
          <>
            <h4>Suspected files</h4>
            <ul>
              {action.suspectedFiles.map((file) => (
                <li key={file.path}>
                  {file.url ? (
                    <a href={file.url} target="_blank" rel="noreferrer">
                      {file.path}
                    </a>
                  ) : (
                    file.path
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </article>
    );
  }

  if (action.type === "generate_doc") {
    return (
      <article className="result-card">
        <h3>Feature Doc</h3>
        <p>
          <strong>{action.title}</strong>
        </p>
        <p>{firstParagraph(action.markdown)}</p>
      </article>
    );
  }

  return (
    <article className="result-card">
      <h3>Human Review</h3>
      <p>{action.reason}</p>
      <p>{action.suggestedNextStep}</p>
    </article>
  );
}

function firstParagraph(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#")) ?? "Generated requirements document.";
}

function isExternalUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}
