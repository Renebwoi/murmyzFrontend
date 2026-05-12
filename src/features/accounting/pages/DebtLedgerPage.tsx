import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAuth } from "../../../auth/AuthProvider";
import { formatCurrency } from "../utils";
import {
  debtLedgerService,
  type DebtLedgerEntry,
} from "../../../services/debtLedgerService";
import "./DebtLedgerPage.css";

function statusLabel(status: DebtLedgerEntry["status"]) {
  if (status === "pending-admin") return "Pending Admin Review";
  if (status === "accepted-admin") return "Accepted (Expense Applied)";
  if (status === "rejected-admin") return "Rejected by Admin";
  return "Paid by Boss";
}

export function DebtLedgerPage() {
  const { user } = useAuth();
  const entries = useSyncExternalStore(
    debtLedgerService.subscribe,
    debtLedgerService.getEntries,
    debtLedgerService.getEntries,
  );
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [module, setModule] = useState<"vip" | "bar" | "reception">("vip");
  const [amount, setAmount] = useState("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const role = user?.role;

  // Decide what controls to show based on the logged-in user's role.
  const moduleOptions = role ? debtLedgerService.getRoleModuleOptions(role) : [];
  const canSubmit =
    role === "vip-master" || role === "bar-master" || role === "receptionist";
  const canAdminReview = role === "admin" || role === "boss";
  const canBossMarkPaid = role === "boss";

  // Keep the table focused on one day and sorted newest-first.
  const filteredEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.date === date)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [entries, date],
  );

  const acceptedExpense = useMemo(
    () =>
      filteredEntries
        .filter((entry) => entry.status === "accepted-admin")
        .reduce((sum, entry) => sum + entry.amount, 0),
    [filteredEntries],
  );

  const pendingReview = filteredEntries.filter(
    (entry) => entry.status === "pending-admin",
  ).length;

  // Load entries when the selected date changes.
  useEffect(() => {
    void debtLedgerService.refresh({ date });
  }, [date]);

  if (!user) return null;

  const submitDebt = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Only worker roles can create debt ledger entries.");
      return;
    }

    const numericAmount = Number(amount);
    if (
      !date ||
      !module ||
      !explanation.trim() ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Date, module, amount, and explanation are required.");
      return;
    }

    try {
      await debtLedgerService.createEntry({
        module,
        date,
        amount: numericAmount,
        explanation: explanation.trim(),
        submittedBy: user.username,
      });

      setAmount("");
      setExplanation("");
      await debtLedgerService.refresh({ date });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit debt entry.",
      );
    }
  };

  const approve = async (id: string) => {
    try {
      await debtLedgerService.approveEntry(id, user.username);
      await debtLedgerService.refresh({ date });
    } catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : "Unable to accept debt entry.",
      );
    }
  };

  const reject = async (id: string) => {
    try {
      await debtLedgerService.rejectEntry(id, user.username);
      await debtLedgerService.refresh({ date });
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : "Unable to reject debt entry.",
      );
    }
  };

  const markPaid = async (id: string) => {
    try {
      await debtLedgerService.markPaid(id, user.username);
      await debtLedgerService.refresh({ date });
    } catch (paidError) {
      setError(
        paidError instanceof Error
          ? paidError.message
          : "Unable to mark debt as paid.",
      );
    }
  };

  return (
    <div className="debt-ledger-page">
      {/* Intro block: explains why this page exists. */}
      <div className="debt-ledger-hero">
        <h2>Debt & Explanation Ledger</h2>
        <p>
          Workers submit daily debts here. Accepted debts are treated as
          same-day expenses and keep accounts partially resolved until boss
          marks paid.
        </p>
      </div>

      {/* Quick daily summary block for operators and reviewers. */}
      <div className="debt-ledger-summary">
        <div>
          <span>Selected Date</span>
          <strong>{date}</strong>
        </div>
        <div>
          <span>Accepted Expense</span>
          <strong>{formatCurrency(acceptedExpense)}</strong>
        </div>
        <div>
          <span>Pending Admin Review</span>
          <strong>{pendingReview}</strong>
        </div>
      </div>

      {/* Date filter block controls which day's ledger is shown. */}
      <div className="debt-ledger-toolbar">
        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      {/* Worker-only form block for creating a debt entry. */}
      {canSubmit ? (
        <form className="debt-ledger-form" onSubmit={submitDebt}>
          <h3>New Debt Entry</h3>
          <div className="debt-ledger-grid">
            <label>
              Module
              <select
                value={module}
                onChange={(e) =>
                  setModule(e.target.value as "vip" | "bar" | "reception")
                }
              >
                {moduleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Debt Amount (₦)
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
          </div>
          <label>
            Explanation
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit">Submit Debt Entry</button>
        </form>
      ) : null}

      {/* Main ledger table block with review/pay actions by role. */}
      <div className="debt-ledger-table-wrap">
        <table className="debt-ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Module</th>
              <th>Amount</th>
              <th>Explanation</th>
              <th>Submitted By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.date}</td>
                <td>{entry.module.toUpperCase()}</td>
                <td>{formatCurrency(entry.amount)}</td>
                <td>{entry.explanation}</td>
                <td>{entry.submittedBy}</td>
                <td>
                  <span className={`ledger-status status-${entry.status}`}>
                    {statusLabel(entry.status)}
                  </span>
                </td>
                <td>
                  <div className="ledger-actions">
                    <button
                      type="button"
                      disabled={
                        !canAdminReview || entry.status !== "pending-admin"
                      }
                      onClick={() => approve(entry.id)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={
                        !canAdminReview || entry.status !== "pending-admin"
                      }
                      onClick={() => reject(entry.id)}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={
                        !canBossMarkPaid || entry.status !== "accepted-admin"
                      }
                      onClick={() => markPaid(entry.id)}
                    >
                      Mark Paid
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
