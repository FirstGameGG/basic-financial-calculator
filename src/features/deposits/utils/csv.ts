const escapeCsvValue = (value: string) => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
};

export const downloadCsv = (filename: string, rows: string[][]) => {
  const csvContent = rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', filename);
  anchor.click();
  URL.revokeObjectURL(url);
};
