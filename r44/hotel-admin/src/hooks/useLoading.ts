import { ref, type Ref } from 'vue'
import { ElLoading, ElMessage, ElNotification, type LoadingInstance } from 'element-plus'

export type MessageType = 'success' | 'warning' | 'info' | 'error'

export interface LoadingOptions {
  text?: string
  background?: string
  spinner?: string
  customClass?: string
  fullscreen?: boolean
  showMessage?: boolean
  successMessage?: string
  errorMessage?: string
  showNotification?: boolean
}

export interface UseLoadingReturn {
  loading: Ref<boolean>
  startLoading: (options?: LoadingOptions) => void
  stopLoading: () => void
  withLoading: <T>(
    fn: () => Promise<T>,
    options?: LoadingOptions
  ) => Promise<T | null>
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
  showNotification: (title: string, message: string, type?: MessageType) => void
}

export function useLoading(): UseLoadingReturn {
  const loading = ref(false)
  let loadingInstance: LoadingInstance | null = null

  const startLoading = (options: LoadingOptions = {}) => {
    const {
      text = '加载中...',
      background = 'rgba(0, 0, 0, 0.7)',
      fullscreen = true,
      customClass = ''
    } = options

    loading.value = true
    loadingInstance = ElLoading.service({
      lock: true,
      text,
      background,
      fullscreen,
      customClass
    })
  }

  const stopLoading = () => {
    loading.value = false
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
  }

  const showSuccess = (message: string) => {
    ElMessage.success(message)
  }

  const showError = (message: string) => {
    ElMessage.error(message)
  }

  const showWarning = (message: string) => {
    ElMessage.warning(message)
  }

  const showInfo = (message: string) => {
    ElMessage.info(message)
  }

  const showNotification = (
    title: string,
    message: string,
    type: MessageType = 'info'
  ) => {
    ElNotification({
      title,
      message,
      type,
      duration: 3000
    })
  }

  const withLoading = async <T>(
    fn: () => Promise<T>,
    options: LoadingOptions = {}
  ): Promise<T | null> => {
    const {
      showMessage = true,
      successMessage,
      errorMessage,
      showNotification: shouldShowNotification = false,
      ...loadingOptions
    } = options

    startLoading(loadingOptions)

    try {
      const result = await fn()
      stopLoading()

      if (showMessage && successMessage) {
        if (shouldShowNotification) {
          showNotification('操作成功', successMessage, 'success')
        } else {
          showSuccess(successMessage)
        }
      }

      return result
    } catch (error) {
      stopLoading()

      const errorMsg = error instanceof Error ? error.message : '操作失败'
      const finalErrorMessage = errorMessage || errorMsg

      if (showMessage) {
        if (shouldShowNotification) {
          showNotification('操作失败', finalErrorMessage, 'error')
        } else {
          showError(finalErrorMessage)
        }
      }

      console.error('Operation error:', error)
      return null
    }
  }

  return {
    loading,
    startLoading,
    stopLoading,
    withLoading,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification
  }
}

export default useLoading
