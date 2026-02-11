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
  rowLimit: number = 0,
  excludeHeaders: boolean = false,
  filename: string = 'clients.csv'
) {
  // Limit rows if specified
  const limitedData = rowLimit > 0 ? data.slice(0, rowLimit) : data;

  // Filter to visible columns only (excluding select and actions)
  const visibleColumns = columnOrder.filter(
    col => col !== 'select' && col !== 'actions' && columnVisibility[col] !== false
  );

  // Get headers for visible columns
  const headers = visibleColumns.map(col => COLUMN_LABELS[col] || col);

  // Convert data to CSV rows with only visible columns in order
  const rows = limitedData.map(client =>
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
  const csvRows = excludeHeaders
    ? rows.map(row => row.map(escapeField).join(','))
    : [headers.map(escapeField).join(','), ...rows.map(row => row.map(escapeField).join(','))];
  const csvContent = csvRows.join('\n');

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
  rowLimit: number = 0,
  excludeHeaders: boolean = false,
  filename: string = 'clients.xlsx'
) {
  // For Excel, we'll create an HTML table and download it as .xls
  // This is a simple approach that works without external libraries
  // Modern Excel can open HTML tables saved with .xls extension

  // Limit rows if specified
  const limitedData = rowLimit > 0 ? data.slice(0, rowLimit) : data;

  // Filter to visible columns only (excluding select and actions)
  const visibleColumns = columnOrder.filter(
    col => col !== 'select' && col !== 'actions' && columnVisibility[col] !== false
  );

  // Get headers for visible columns
  const headers = visibleColumns.map(col => COLUMN_LABELS[col] || col);

  // Convert data to rows with only visible columns in order
  const rows = limitedData.map(client =>
    visibleColumns.map(col => getColumnValue(client, col))
  );

  // Build thead section conditionally
  const theadHtml = excludeHeaders ? '' : `
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>`;

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
      <table>${theadHtml}
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

export function exportToPDF(
  data: Client[],
  columnOrder: string[],
  columnVisibility: Record<string, boolean>,
  rowLimit: number = 0,
  excludeHeaders: boolean = false
) {
  // Limit rows if specified
  const limitedData = rowLimit > 0 ? data.slice(0, rowLimit) : data;

  // Filter to visible columns only (excluding select and actions)
  const visibleColumns = columnOrder.filter(
    col => col !== 'select' && col !== 'actions' && columnVisibility[col] !== false
  );

  // Get headers for visible columns
  const headers = visibleColumns.map(col => COLUMN_LABELS[col] || col);

  // Convert data to rows with only visible columns in order
  const rows = limitedData.map(client =>
    visibleColumns.map(col => getColumnValue(client, col))
  );

  // Build thead section conditionally
  const theadHtml = excludeHeaders ? '' : `
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>`;

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export to PDF');
    return;
  }

  // Build HTML content with landscape orientation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Clients Export</title>
      <style>
        @page {
          size: landscape;
          margin: 0.5in;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        th {
          background-color: #4472C4;
          color: white;
          font-weight: bold;
          padding: 8px 6px;
          border: 1px solid #ccc;
          text-align: left;
        }
        td {
          padding: 6px;
          border: 1px solid #ccc;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
      </style>
    </head>
    <body>
      <h1>Clients Export - ${new Date().toLocaleDateString()}</h1>
      <table>${theadHtml}
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load then trigger print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Close the window after printing (user can cancel)
    setTimeout(() => {
      printWindow.close();
    }, 100);
  };
}

export function exportToJSON(
  data: Client[],
  columnOrder: string[],
  columnVisibility: Record<string, boolean>,
  rowLimit: number = 0,
  excludeHeaders: boolean = false,
  filename: string = 'clients.json'
) {
  // Limit rows if specified
  const limitedData = rowLimit > 0 ? data.slice(0, rowLimit) : data;

  // Filter to visible columns only (excluding select and actions)
  const visibleColumns = columnOrder.filter(
    col => col !== 'select' && col !== 'actions' && columnVisibility[col] !== false
  );

  // Build JSON data with only visible columns
  const jsonData = limitedData.map(client => {
    const row: Record<string, any> = {};
    visibleColumns.forEach(col => {
      row[col] = client[col as keyof Client] ?? null;
    });
    return row;
  });

  // Create JSON structure - with or without metadata header
  const jsonOutput = excludeHeaders ? jsonData : {
    metadata: {
      exportDate: new Date().toISOString(),
      recordCount: jsonData.length,
      columnCount: visibleColumns.length,
      columns: visibleColumns.map(col => ({
        id: col,
        label: COLUMN_LABELS[col] || col
      }))
    },
    data: jsonData
  };

  // Convert to JSON string with pretty formatting
  const jsonString = JSON.stringify(jsonOutput, null, 2);

  // Create and trigger download
  const blob = new Blob([jsonString], { type: 'application/json' });
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

export function exportToXML(
  data: Client[],
  columnOrder: string[],
  columnVisibility: Record<string, boolean>,
  rowLimit: number = 0,
  excludeHeaders: boolean = false,
  filename: string = 'clients.xml'
) {
  // Limit rows if specified
  const limitedData = rowLimit > 0 ? data.slice(0, rowLimit) : data;

  // Filter to visible columns only (excluding select and actions)
  const visibleColumns = columnOrder.filter(
    col => col !== 'select' && col !== 'actions' && columnVisibility[col] !== false
  );

  // Helper function to escape XML special characters
  const escapeXML = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Build XML content
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlContent += '<export>\n';

  // Metadata section (conditionally include)
  if (!excludeHeaders) {
    xmlContent += '  <metadata>\n';
    xmlContent += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
    xmlContent += `    <recordCount>${limitedData.length}</recordCount>\n`;
    xmlContent += `    <columnCount>${visibleColumns.length}</columnCount>\n`;
    xmlContent += '    <columns>\n';

    visibleColumns.forEach(col => {
      xmlContent += '      <column>\n';
      xmlContent += `        <id>${escapeXML(col)}</id>\n`;
      xmlContent += `        <label>${escapeXML(COLUMN_LABELS[col] || col)}</label>\n`;
      xmlContent += '      </column>\n';
    });

    xmlContent += '    </columns>\n';
    xmlContent += '  </metadata>\n';
  }
  
  // Data section
  xmlContent += '  <data>\n';
  
  limitedData.forEach(client => {
    xmlContent += '    <record>\n';
    visibleColumns.forEach(col => {
      const value = client[col as keyof Client];
      xmlContent += `      <${col}>${escapeXML(value)}</${col}>\n`;
    });
    xmlContent += '    </record>\n';
  });
  
  xmlContent += '  </data>\n';
  xmlContent += '</export>';

  // Create and trigger download
  const blob = new Blob([xmlContent], { type: 'application/xml' });
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
