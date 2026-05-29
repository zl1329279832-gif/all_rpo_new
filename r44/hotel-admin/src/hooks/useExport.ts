import { ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'

export type ExportFormat = 'csv' | 'excel'

export interface ExportColumn<T = any> {
  key: keyof T | string
  title: string
  formatter?: (value: any, row: T) => string | number
}

export interface ExportOptions {
  filename?: string
  format?: ExportFormat
  bom?: boolean
  delimiter?: string
}

export interface UseExportReturn {
  exporting: Ref<boolean>
  exportToCsv: <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn<T>[],
    options?: Omit<ExportOptions, 'format'>
  ) => Promise<void>
  exportToExcel: <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn<T>[],
    options?: Omit<ExportOptions, 'format'>
  ) => Promise<void>
  exportData: <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn<T>[],
    options?: ExportOptions
  ) => Promise<void>
}

const BOM = '\uFEFF'

export function useExport(): UseExportReturn {
  const exporting = ref(false)

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return ''
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  const getCsvRow = <T extends Record<string, any>>(
    row: T,
    columns: ExportColumn<T>[],
    delimiter: string
  ): string => {
    return columns
      .map((col) => {
        let value
        if (col.formatter) {
          value = col.formatter(row[col.key as keyof T], row)
        } else {
          value = row[col.key as keyof T]
        }
        const formatted = formatValue(value)
        if (formatted.includes(delimiter) || formatted.includes('"') || formatted.includes('\n')) {
          return `"${formatted.replace(/"/g, '""')}"`
        }
        return formatted
      })
      .join(delimiter)
  }

  const generateCsvContent = <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn<T>[],
    delimiter: string
  ): string => {
    const header = columns.map((col) => col.title).join(delimiter)
    const rows = data.map((row) => getCsvRow(row, columns, delimiter))
    return [header, ...rows].join('\n')
  }

  const generateExcelXml = <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn<T>[]
  ): string => {
    const headerRow = columns
      .map((col) => `<Cell><Data ss:Type="String">${col.title}</Data></Cell>`)
      .join('')

    const dataRows = data
      .map((row) => {
        const cells = columns
          .map((col) => {
            let value
            if (col.formatter) {
              value = col.formatter(row[col.key as keyof T], row)
            } else {
              value = row[col.key as keyof T]
            }
            const formatted = formatValue(value)
            const type = isNaN(Number(formatted)) ? 'String' : 'Number'
            return `<Cell><Data ss:Type="${type}">${formatted}</Data></Cell>`
          })
          .join('')
        return `<Row>${cells}</Row>`
      })
      .join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Sheet1">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`
  }

  const downloadBlob = (content: string, filename: string, mimeType: string, bom: boolean) => {
    const blobContent = bom ? BOM + content : content
    const blob = new Blob([blobContent], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getFilename = (filename?: string, format: ExportFormat = 'csv'): string => {
    const timestamp = new Date().toISOString().slice(0, 10)
    const name = filename || 'export'
    const ext = format === 'excel' ? 'xls' : 'csv'
    return `${name}_${timestamp}.${ext}`
  }

  const exportToCsv = async <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn<T>[],
    options: Omit<ExportOptions, 'format'> = {}
  ): Promise<void> => {
    return exportData(data, columns, { ...options, format: 'csv' })
  }

  const exportToExcel = async <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn<T>[],
    options: Omit<ExportOptions, 'format'> = {}
  ): Promise<void> => {
    return exportData(data, columns, { ...options, format: 'excel' })
  }

  const exportData = async <T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn<T>[],
    options: ExportOptions = {}
  ): Promise<void> => {
    const { filename, format = 'csv', bom = true, delimiter = ',' } = options

    if (!data || data.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    if (!columns || columns.length === 0) {
      ElMessage.error('请配置导出列')
      return
    }

    exporting.value = true

    try {
      let content: string
      let mimeType: string

      if (format === 'excel') {
        content = generateExcelXml(data, columns)
        mimeType = 'application/vnd.ms-excel'
      } else {
        content = generateCsvContent(data, columns, delimiter)
        mimeType = 'text/csv;charset=utf-8'
      }

      const fullFilename = getFilename(filename, format)
      downloadBlob(content, fullFilename, mimeType, bom)

      ElMessage.success('导出成功')
    } catch (error) {
      console.error('Export error:', error)
      ElMessage.error('导出失败，请稍后重试')
      throw error
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportToCsv,
    exportToExcel,
    exportData
  }
}

export default useExport
