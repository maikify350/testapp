import type { Client } from '../types';

export function exportToCSV(data: Client[], filename: string = 'clients.csv') {
  // Define column headers
  const headers = [
    'ID', 'Name', 'Email', 'Phone', 'Company', 'Address',
    'City', 'State', 'Zip Code', 'Website', 'Created'
  ];

  // Convert data to CSV rows
  const rows = data.map(client => [
    client.id,
    client.name,
    client.email || '',
    client.phone || '',
    client.company || '',
    client.address || '',
    client.city || '',
    client.state || '',
    client.zip_code || '',
    client.website || '',
    new Date(client.created_at).toLocaleDateString('en-US')
  ]);

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

export function exportToExcel(data: Client[], filename: string = 'clients.xlsx') {
  // For Excel, we'll create an HTML table and download it as .xls
  // This is a simple approach that works without external libraries
  // Modern Excel can open HTML tables saved with .xls extension

  const headers = [
    'ID', 'Name', 'Email', 'Phone', 'Company', 'Address',
    'City', 'State', 'Zip Code', 'Website', 'Created'
  ];

  const rows = data.map(client => [
    client.id,
    client.name,
    client.email || '',
    client.phone || '',
    client.company || '',
    client.address || '',
    client.city || '',
    client.state || '',
    client.zip_code || '',
    client.website || '',
    new Date(client.created_at).toLocaleDateString('en-US')
  ]);

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
