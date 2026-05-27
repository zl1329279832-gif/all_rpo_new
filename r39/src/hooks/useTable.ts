import { ref, reactive, onMounted } from 'vue'
import type { PageParams } from '../types'

interface UseTableOptions<T, P> {
  apiFn: (params: P) => Promise<any>
  defaultParams?: Partial<P>
  immediate?: boolean
}

export function useTable<T = any, P extends PageParams = PageParams>(
  options: UseTableOptions<T, P>
) {
  const { apiFn, defaultParams = {}, immediate = true } = options

  const loading = ref(false)
  const data = ref<T[]>([])
  const total = ref(0)

  const params = reactive<PageParams>({
    page: 1,
    pageSize: 10,
    ...defaultParams
  })

  async function fetchData() {
    loading.value = true
    try {
      const res = await apiFn(params as P)
      if (res.code === 200) {
        data.value = res.data.list
        total.value = res.data.total
      }
    } finally {
      loading.value = false
    }
  }

  function handleSizeChange(size: number) {
    params.pageSize = size
    params.page = 1
    fetchData()
  }

  function handleCurrentChange(page: number) {
    params.page = page
    fetchData()
  }

  function refresh() {
    params.page = 1
    fetchData()
  }

  function updateParams(newParams: Partial<P>) {
    Object.assign(params, newParams)
    params.page = 1
    fetchData()
  }

  function resetParams() {
    Object.assign(params, { page: 1, pageSize: 10, ...defaultParams })
    fetchData()
  }

  onMounted(() => {
    if (immediate) {
      fetchData()
    }
  })

  return {
    loading,
    data,
    total,
    params,
    fetchData,
    handleSizeChange,
    handleCurrentChange,
    refresh,
    updateParams,
    resetParams
  }
}
