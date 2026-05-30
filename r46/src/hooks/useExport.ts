import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'

interface ExportColumn {
  key: string
  title: string
  formatter?: (value: any, row: any) => string
}

export function useExport() {
  const exporting = ref(false)

  const exportToExcel = (
    data: any[],
    columns: ExportColumn[],
    filename: string = 'export.xlsx',
    sheetName: string = 'Sheet1'
  ) => {
    exporting.value = true

    try {
      const exportData = data.map((row) => {
        const newRow: Record<string, any> = {}
        columns.forEach((col) => {
          newRow[col.title] = col.formatter ? col.formatter(row[col.key], row) : row[col.key]
        })
        return newRow
      })

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
      XLSX.writeFile(workbook, filename)

      ElMessage.success('导出成功')
    } catch (error) {
      ElMessage.error('导出失败')
      console.error(error)
    } finally {
      exporting.value = false
    }
  }

  const exportToCsv = (
    data: any[],
    columns: ExportColumn[],
    filename: string = 'export.csv'
  ) => {
    exporting.value = true

    try {
      const header = columns.map((col) => col.title).join(',')
      const rows = data.map((row) =>
        columns
          .map((col) => {
            const value = col.formatter ? col.formatter(row[col.key], row) : row[col.key]
            return `"${String(value ?? '').replace(/"/g, '""')}"`
          })
          .join(',')
      )

      const csvContent = [header, ...rows].join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()

      ElMessage.success('导出成功')
    } catch (error) {
      ElMessage.error('导出失败')
      console.error(error)
    } finally {
      exporting.value = false
    }
  }

  const exportSelected = (
    selectedIds: string[],
    allData: any[],
    columns: ExportColumn[],
    filename: string,
    format: 'xlsx' | 'csv' = 'xlsx'
  ) => {
    const selectedData = allData.filter((item) => selectedIds.includes(item.id))

    if (selectedData.length === 0) {
      ElMessage.warning('请选择要导出的数据')
      return
    }

    if (format === 'xlsx') {
      exportToExcel(selectedData, columns, filename)
    } else {
      exportToCsv(selectedData, columns, filename)
    }
  }

  const exportAll = (
    allData: any[],
    columns: ExportColumn[],
    filename: string,
    format: 'xlsx' | 'csv' = 'xlsx'
  ) => {
    if (allData.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }

    if (format === 'xlsx') {
      exportToExcel(allData, columns, filename)
    } else {
      exportToCsv(allData, columns, filename)
    }
  }

  return {
    exporting,
    exportToExcel,
    exportToCsv,
    exportSelected,
    exportAll,
  }
}
