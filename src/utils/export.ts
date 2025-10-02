import * as XLSX from 'xlsx';

/**
 * Escape CSV value for proper formatting
 */
const escapeCsvValue = (value: string) => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * Download data as CSV file
 * @param filename - Name of the file to download (without extension)
 * @param rows - 2D array of string data
 */
export const downloadCsv = (filename: string, rows: string[][]) => {
  const csvContent = rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', `${filename}.csv`);
  anchor.click();
  URL.revokeObjectURL(url);
};

/**
 * Download data as XLSX file
 * @param filename - Name of the file to download (without extension)
 * @param rows - 2D array of data (strings or numbers)
 * @param sheetName - Optional name for the worksheet (default: 'Sheet1')
 */
export const downloadXlsx = (filename: string, rows: (string | number)[][], sheetName = 'Sheet1') => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // Auto-size columns based on content
  const maxLengths: number[] = [];
  rows.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const cellLength = String(cell).length;
      maxLengths[colIndex] = Math.max(maxLengths[colIndex] || 0, cellLength);
    });
  });
  
  worksheet['!cols'] = maxLengths.map((len) => ({ wch: Math.min(len + 2, 50) }));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Download data as both CSV and XLSX with user choice
 * @param filename - Name of the file to download (without extension)
 * @param rows - 2D array of data
 * @param format - Export format ('csv' or 'xlsx')
 * @param sheetName - Optional name for the worksheet (only for XLSX)
 */
export const exportTable = (
  filename: string,
  rows: (string | number)[][],
  format: 'csv' | 'xlsx',
  sheetName = 'Sheet1'
) => {
  // Convert all values to strings for CSV
  const stringRows = rows.map((row) => row.map((cell) => String(cell)));
  
  if (format === 'csv') {
    downloadCsv(filename, stringRows);
  } else {
    downloadXlsx(filename, rows, sheetName);
  }
};
