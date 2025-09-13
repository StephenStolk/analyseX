export function convertToCSV(data: any[], columns: string[]): string {
  if (!data || data.length === 0) return ""

  // Create header row
  const headers = columns.map((col) => `"${col.replace(/"/g, '""')}"`).join(",")

  // Create data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col]

        // Handle different data types
        if (value === null || value === undefined) {
          return '""'
        }

        // Convert to string and escape quotes
        const stringValue = String(value).replace(/"/g, '""')

        // Wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
          return `"${stringValue}"`
        }

        return `"${stringValue}"`
      })
      .join(",")
  })

  return [headers, ...rows].join("\n")
}

export function downloadCSV(data: any[], filename: string, columns: string[]): void {
  const csvContent = convertToCSV(data, columns)
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function downloadExcel(data: any[], filename: string, columns: string[]): void {
  // For Excel, we'll use CSV format with proper encoding
  // This ensures compatibility with Excel while keeping it simple
  const csvContent = convertToCSV(data, columns)

  // Add BOM for proper Excel UTF-8 handling
  const BOM = "\uFEFF"
  const blob = new Blob([BOM + csvContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function convertToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2)
}

export function downloadJSON(data: any[], filename: string): void {
  const jsonContent = convertToJSON(data)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
