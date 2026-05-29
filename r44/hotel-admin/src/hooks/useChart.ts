import { ref, onMounted, onUnmounted, watch, type Ref, type ComputedRef } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption, SetOptionOpts } from 'echarts'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type EChartsInstance = ReturnType<typeof echarts.init>

export interface ChartOptions {
  theme?: ThemeMode
  renderer?: 'canvas' | 'svg'
  autoResize?: boolean
  loading?: boolean
  loadingText?: string
}

export interface UseChartReturn {
  chartRef: Ref<HTMLElement | null>
  chartInstance: Ref<EChartsInstance | null>
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void
  resize: () => void
  showLoading: (text?: string) => void
  hideLoading: () => void
  dispose: () => void
  initChart: () => void
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

const getEChartsTheme = (mode: ThemeMode): string => {
  if (mode === 'auto') {
    return getSystemTheme() === 'dark' ? 'dark' : 'light'
  }
  return mode === 'dark' ? 'dark' : 'light'
}

export function useChart(
  options: ChartOptions = {},
  themeMode?: Ref<ThemeMode> | ComputedRef<ThemeMode>
): UseChartReturn {
  const {
    theme = 'light',
    renderer = 'canvas',
    autoResize = true,
    loadingText = '加载中...'
  } = options

  const chartRef = ref<HTMLElement | null>(null)
  const chartInstance = ref<any>(null)
  const currentTheme = ref<ThemeMode>(theme)

  let resizeObserver: ResizeObserver | null = null
  let mediaQueryList: MediaQueryList | null = null

  const initChart = () => {
    if (!chartRef.value) {
      console.warn('Chart container element not found')
      return
    }

    if (chartInstance.value) {
      chartInstance.value.dispose()
    }

    const echartsTheme = getEChartsTheme(currentTheme.value)
    chartInstance.value = echarts.init(chartRef.value, echartsTheme, {
      renderer
    })
  }

  const setOption = (option: EChartsOption, opts?: SetOptionOpts) => {
    if (!chartInstance.value) {
      initChart()
    }
    chartInstance.value?.setOption(option, opts)
  }

  const resize = () => {
    chartInstance.value?.resize()
  }

  const showLoading = (text: string = loadingText) => {
    chartInstance.value?.showLoading({
      text,
      maskColor: 'rgba(255, 255, 255, 0.8)',
      zlevel: 0
    })
  }

  const hideLoading = () => {
    chartInstance.value?.hideLoading()
  }

  const dispose = () => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (mediaQueryList) {
      mediaQueryList.removeEventListener('change', handleSystemThemeChange)
      mediaQueryList = null
    }
    chartInstance.value?.dispose()
    chartInstance.value = null
  }

  const handleSystemThemeChange = (_e?: MediaQueryListEvent) => {
    if (currentTheme.value === 'auto') {
      if (chartInstance.value) {
        const option = chartInstance.value.getOption()
        dispose()
        initChart()
        setOption(option as EChartsOption, { notMerge: true })
      }
    }
  }

  const handleResize = () => {
    resize()
  }

  onMounted(() => {
    initChart()

    if (autoResize && chartRef.value) {
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(chartRef.value)
      } else {
        window.addEventListener('resize', handleResize)
      }
    }

    if (currentTheme.value === 'auto' && typeof window !== 'undefined') {
      mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQueryList.addEventListener('change', handleSystemThemeChange)
    }
  })

  onUnmounted(() => {
    dispose()
    if (!resizeObserver) {
      window.removeEventListener('resize', handleResize)
    }
  })

  if (themeMode) {
    watch(
      themeMode,
      (newMode) => {
        currentTheme.value = newMode
        if (chartInstance.value) {
          const option = chartInstance.value.getOption()
          dispose()
          initChart()
          setOption(option as EChartsOption, { notMerge: true })
        }
      },
      { immediate: true }
    )
  }

  return {
    chartRef,
    chartInstance,
    setOption,
    resize,
    showLoading,
    hideLoading,
    dispose,
    initChart
  }
}

export default useChart
