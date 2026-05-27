import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'

export interface ExportColumn<T = any> {
  key: keyof T | string
  title: string
  width?: number
  format?: (value: any, row: T) => string
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = 'export.xlsx'
) {
  try {
    const exportData = data.map(row => {
      const obj: Record<string, any> = {}
      columns.forEach(col => {
        const key = col.key as string
        const value = (row as any)[key]
        obj[col.title] = col.format ? col.format(value, row) : value
      })
      return obj
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

    const colWidths = columns.map(col => ({
      wch: col.width || Math.max(col.title.length * 2, 15)
    }))
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, filename)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error(error)
  }
}

export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
