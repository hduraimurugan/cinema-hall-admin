import * as XLSX from 'xlsx'

/**
 * Converts an array of plain objects to a CSV string and triggers a browser download.
 * @param {Object[]} data - Flat array of objects; keys become column headers.
 * @param {string} filename - Base filename without extension.
 */
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] == null ? '' : String(row[h])
        // Wrap in quotes if the value contains commas, quotes, or newlines
        const escaped = val.replace(/"/g, '""')
        return /[,"\n\r]/.test(escaped) ? `"${escaped}"` : escaped
      }).join(',')
    ),
  ]

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Converts an array of plain objects to an Excel (.xlsx) file and triggers a browser download.
 * @param {Object[]} data - Flat array of objects; keys become column headers.
 * @param {string} filename - Base filename without extension.
 */
export function exportToExcel(data, filename) {
  if (!data || data.length === 0) return

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
