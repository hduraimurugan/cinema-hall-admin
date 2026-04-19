import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportToCSV, exportToExcel } from '@/utils/exportUtils'

/**
 * Reusable export button that offers CSV and Excel download options.
 *
 * @param {Object[]} data     - Array of flat objects to export. Keys become column headers.
 * @param {string}   filename - Base filename without extension.
 * @param {boolean}  [disabled] - Disable the button (e.g. while data is loading).
 */
export function ExportButton({ data = [], filename = 'export', disabled = false }) {
  const isEmpty = !data || data.length === 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isEmpty}
          className="gap-1.5"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToCSV(data, filename)}>
          <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToExcel(data, filename)}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-muted-foreground" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
