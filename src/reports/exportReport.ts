export type ReportRow = Record<string, string | number>;

export function exportReport(rows?: ReportRow[]): string {
  const headers = Object.keys(rows![0] ?? {});
  const csvRows = rows!.map((row) => headers.map((header) => row[header]).join(","));

  return [headers.join(","), ...csvRows].join("\n");
}
