import { exportReport } from "./exportReport";

export function ReportsPage() {
  const rows = undefined;

  function handleExportClick() {
    const csv = exportReport(rows);
    console.log(csv);
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
    </main>
  );
}
