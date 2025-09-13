import * as XLSX from "xlsx"

export interface ParsedData {
  headers: string[]
  rows: any[]
  numericColumns: string[]
  dateColumns: string[]
  categoricalColumns: string[]
}

/**
 * Parses Excel or CSV files and properly identifies column types
 */
export function parseDataFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const rows: any[] = []
        let headers: string[] = []

        if (file.name.endsWith(".csv")) {
          // Parse CSV
          const text = data as string
          const lines = text.split("\n").filter((line) => line.trim() !== "")

          if (lines.length === 0) {
            throw new Error("Empty CSV file")
          }

          // Detect delimiter
          let delimiter = ","
          if (lines[0].includes(";")) delimiter = ";"
          else if (lines[0].includes("\t")) delimiter = "\t"

          // Find the actual header row - look for a row with more than 3 columns
          let headerRowIndex = 0
          for (let i = 0; i < Math.min(5, lines.length); i++) {
            const columns = parseCSVLine(lines[i], delimiter)
            if (columns.length > 3) {
              headerRowIndex = i
              break
            }
          }

          headers = parseCSVLine(lines[headerRowIndex], delimiter).map((h) => h.trim().replace(/^"|"$/g, ""))
          console.log(`CSV headers: ${headers.join(", ")}`)

          for (let i = headerRowIndex + 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue

            const values = parseCSVLine(lines[i], delimiter)
            const row: any = {}

            headers.forEach((header, index) => {
              if (index < values.length) {
                // Try to convert numeric values
                const value = values[index].trim().replace(/^"|"$/g, "")
                const numValue = Number(value)
                row[header] = !isNaN(numValue) && value !== "" ? numValue : value
              } else {
                row[header] = null
              }
            })

            rows.push(row)
          }

          console.log(`Parsed ${rows.length} rows from CSV`)
        } else {
          // Parse Excel
          try {
            const workbook = XLSX.read(data, { type: "binary" })
            const firstSheet = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheet]

            // Get the range of the worksheet
            const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1")

            // Find the header row - look for a row with more than 3 non-empty cells
            let headerRowIndex = 0
            for (let r = range.s.r; r <= Math.min(range.s.r + 5, range.e.r); r++) {
              let nonEmptyCells = 0
              for (let c = range.s.c; c <= range.e.c; c++) {
                const cellAddress = XLSX.utils.encode_cell({ r, c })
                if (worksheet[cellAddress] && worksheet[cellAddress].v) {
                  nonEmptyCells++
                }
              }
              if (nonEmptyCells > 3) {
                headerRowIndex = r
                break
              }
            }

            // Extract headers from the header row
            headers = []
            for (let c = range.s.c; c <= range.e.c; c++) {
              const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c })
              if (worksheet[cellAddress]) {
                headers.push(String(worksheet[cellAddress].v).trim())
              } else {
                headers.push(`Column${c + 1}`)
              }
            }

            // Extract data rows
            for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
              const row: any = {}
              let hasData = false

              for (let c = range.s.c; c <= range.e.c; c++) {
                const cellAddress = XLSX.utils.encode_cell({ r, c })
                const header = headers[c - range.s.c]

                if (worksheet[cellAddress]) {
                  const value = worksheet[cellAddress].v
                  row[header] = value
                  hasData = true
                } else {
                  row[header] = null
                }
              }

              if (hasData) {
                rows.push(row)
              }
            }

            console.log(`Parsed ${rows.length} rows from Excel with headers: ${headers.join(", ")}`)
          } catch (error) {
            console.error("Error parsing Excel file:", error)
            throw new Error("Invalid Excel file format")
          }
        }

        if (rows.length === 0) {
          throw new Error("No data found in file")
        }

        // Clean up headers - replace empty or duplicate headers
        headers = headers.map((header, index) => {
          if (!header || header.trim() === "") {
            return `Column${index + 1}`
          }
          return header
        })

        // Identify column types
        const numericColumns: string[] = []
        const dateColumns: string[] = []
        const categoricalColumns: string[] = []

        headers.forEach((header) => {
          // Check first 10 rows (or all if less) to determine column type
          const sampleSize = Math.min(10, rows.length)
          let numericCount = 0
          let dateCount = 0
          let nonEmptyCount = 0

          for (let i = 0; i < sampleSize; i++) {
            const value = rows[i][header]
            if (value === null || value === undefined || value === "") continue

            nonEmptyCount++

            // Check if numeric
            if (typeof value === "number" || (!isNaN(Number(value)) && value !== "")) {
              numericCount++
            }

            // Check if date
            const dateValue = new Date(value)
            if (
              (!isNaN(dateValue.getTime()) && String(value).match(/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/)) ||
              String(value).match(/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/)
            ) {
              dateCount++
            }
          }

          // Classify column based on majority of non-empty values
          if (nonEmptyCount > 0) {
            if (numericCount / nonEmptyCount > 0.7) {
              numericColumns.push(header)
            } else if (dateCount / nonEmptyCount > 0.7) {
              dateColumns.push(header)
            } else {
              categoricalColumns.push(header)
            }
          } else {
            categoricalColumns.push(header)
          }
        })

        console.log(`Identified ${numericColumns.length} numeric columns: ${numericColumns.join(", ")}`)
        console.log(`Identified ${dateColumns.length} date columns: ${dateColumns.join(", ")}`)
        console.log(`Identified ${categoricalColumns.length} categorical columns: ${categoricalColumns.join(", ")}`)

        resolve({
          headers,
          rows,
          numericColumns,
          dateColumns,
          categoricalColumns,
        })
      } catch (error) {
        console.error("Error parsing file:", error)
        reject(error)
      }
    }

    reader.onerror = (error) => {
      console.error("FileReader error:", error)
      reject(new Error("Error reading file"))
    }

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  })
}

/**
 * Parse a CSV line handling quoted values with delimiters inside
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = []
  let currentValue = ""
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      values.push(currentValue)
      currentValue = ""
    } else {
      currentValue += char
    }
  }

  values.push(currentValue) // Add the last value

  // If simple splitting works better (no quotes), use it
  if (values.length === 0 || (line.includes(delimiter) && values.length === 1)) {
    return line.split(delimiter)
  }

  return values
}
