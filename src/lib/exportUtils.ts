export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) => {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const headers = columns
    ? columns.map(col => col.label)
    : Object.keys(data[0]);

  const rows = data.map(item => {
    if (columns) {
      return columns.map(col => {
        const value = item[col.key];
        return formatCSVValue(value);
      });
    }
    return Object.values(item).map(formatCSVValue);
  });

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv");
};

export const exportToJSON = <T>(data: T[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, "application/json");
};

const formatCSVValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  
  const stringValue = String(value);
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
