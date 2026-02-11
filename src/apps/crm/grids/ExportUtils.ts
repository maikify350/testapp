import type { Client } from '../types';

const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  address: 'Address',
  city: 'City',
  state: 'State',
  zip_code: 'Zip Code',
  website: 'Website',
  created_at: 'Created',
};

function getColumnValue(client: Client, columnId: string): string | number {
  if (columnId === 'created_at') {
    return new Date(client.created_at).toLocaleDateString('en-US');
  }
  const value = client[columnId as keyof Client];
  return value ?? '';
}

export function exportToCSV(
  data: Client[],
  columnOrder: string[],
  columnVisibility: Record<string, boolean>,
  filename: string = 'clients.csv'
) {
  // Filter to visible columns only (excluding select and actions)
  const visibleColumns = columnOrder.filter(
    col => col !== 'select' && col !== 'actions' && columnVisibility[col] !== false
  );

  // Get headers for visible columns
  const headers = visibleColumns.map(col => COLUMN_LABELS[col] || col);

  // Convert data to CSV rows with only visible columns in order
  const rows = data.map(client =>
    visibleColumns.map(col => getColumnValue(client, col))
  );

  // Escape fields that contain commas, quotes, or newlines
  const escapeField = (field: string | number): string => {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV content
  const csvContent = [
    headers.map(escapeField).join(','),
    ...rows.map(row => row.map(escapeField).join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(
  data: Client[],
  columnOrder: string[],
  columnVisibility: Record<string, boolean>,
  filename: string = 'clients.xlsx'
) {
  // For Excel, we'll create an HTML table and download it as .xls
  // This is a simple approach that works without external libraries
  // Modern Excel can open HTML tables saved with .xls extension

  // Filter to visible columns only (excluding select and actions)
  const visibleColumns = columnOrder.filter(
    col => col !== 'select' && col !== 'actions' && columnVisibility[col] !== false
  );

  // Get headers for visible columns
  const headers = visibleColumns.map(col => COLUMN_LABELS[col] || col);

  // Convert data to rows with only visible columns in order
  const rows = data.map(client =>
    visibleColumns.map(col => getColumnValue(client, col))
  );

  // Build HTML table
  let htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Clients</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th { background-color: #4472C4; color: white; font-weight: bold; padding: 8px; border: 1px solid #ccc; }
        td { padding: 8px; border: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Create and trigger download
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
