import type { BudgetTransaction } from "@/lib/queries/budget";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportTransactionsCSV(
  transactions: BudgetTransaction[],
  filename: string
) {
  const headers = ["Date", "Description", "Amount", "Currency", "Category", "Investment"];
  const rows = transactions.map((tx) => [
    tx.date,
    escapeCSV(tx.description),
    String(tx.amount),
    tx.currency,
    tx.category_id ?? "",
    tx.is_investment ? "Yes" : "No",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadFile(csv, filename, "text/csv");
}

export function exportSummaryCSV(
  categories: { name: string; budget: number; spent: number; remaining: number; pct: number }[],
  summary: { income: number; spend: number; savings: number; saving_rate: number; currency: string },
  filename: string
) {
  const lines: string[] = [];

  // Summary section
  lines.push("Budget Summary");
  lines.push(`Income,${summary.income}`);
  lines.push(`Spend,${summary.spend}`);
  lines.push(`Savings,${summary.savings}`);
  lines.push(`Saving Rate,${summary.saving_rate}%`);
  lines.push(`Currency,${summary.currency}`);
  lines.push("");

  // Category breakdown
  lines.push("Category,Budget,Spent,Remaining,% of Total");
  for (const cat of categories) {
    lines.push(
      `${escapeCSV(cat.name)},${cat.budget},${cat.spent},${cat.remaining},${cat.pct}%`
    );
  }

  downloadFile(lines.join("\n"), filename, "text/csv");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
