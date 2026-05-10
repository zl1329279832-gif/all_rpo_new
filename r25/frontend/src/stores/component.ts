import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ComponentConfig, PageResult } from '../types';
import { getComponentList, createComponent, updateComponent, deleteComponent } from '../api/component';

export const useComponentStore = defineStore('component', () => {
  const components = ref<ComponentConfig[]>([]);
  const currentComponent = ref<ComponentConfig | null>(null);
  const loading = ref(false);
  const total = ref(0);
  const current = ref(1);
  const size = ref(10);

  const pagination = computed(() => ({
    current: current.value,
    size: size.value,
    total: total.value
  }));

  async function fetchComponents(params?: { keyword?: string; componentType?: string }) {
    loading.value = true;
    try {
      const res = await getComponentList({
        current: current.value,
        size: size.value,
        ...params
      });
      const data = res.data as PageResult<ComponentConfig>;
      components.value = data.records;
      total.value = data.total;
    } catch (error) {
      console.error('Failed to fetch components:', error);
    } finally {
      loading.value = false;
    }
  }

  async function fetchComponentDetail(id: string) {
    loading.value = true;
    try {
      const res = await getComponentList({ current: 1, size: 1000 });
      const data = res.data as PageResult<ComponentConfig>;
      currentComponent.value = data.records.find(c => c.id === id) || null;
      return currentComponent.value;
    } catch (error) {
      console.error('Failed to fetch component detail:', error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function addComponent(data: Partial<ComponentConfig>) {
    loading.value = true;
    try {
      await createComponent(data);
      await fetchComponents();
    } finally {
      loading.value = false;
    }
  }

  async function editComponent(id: string, data: Partial<ComponentConfig>) {
    loading.value = true;
    try {
      await updateComponent(id, data);
      await fetchComponents();
    } finally {
      loading.value = false;
    }
  }

  async function removeComponent(id: string) {
    loading.value = true;
    try {
      await deleteComponent(id);
      await fetchComponents();
    } finally {
      loading.value = false;
    }
  }

  function setCurrentComponent(component: ComponentConfig | null) {
    currentComponent.value = component;
  }

  function setPagination(page: number, pageSize: number) {
    current.value = page;
    size.value = pageSize;
  }

  return {
    components,
    currentComponent,
    loading,
    total,
    current,
    size,
    pagination,
    fetchComponents,
    fetchComponentDetail,
    addComponent,
    editComponent,
    removeComponent,
    setCurrentComponent,
    setPagination
  };
});
