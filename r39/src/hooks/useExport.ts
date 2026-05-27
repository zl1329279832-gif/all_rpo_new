import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { exportToExcel, type ExportColumn } from '../utils/export'

export function useExport<T = any>(columns: ExportColumn<T>[], filename: string) {
  const exporting = ref(false)

  async function handleExport(data: T[], customFilename?: string) {
    if (data.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    exporting.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      exportToExcel(data, columns, customFilename || filename)
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    handleExport
  }
}
