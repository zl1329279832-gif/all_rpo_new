<template>
  <div class="sidebar">
    <div class="logo">
      <h1 v-show="!isCollapse" class="title">社区团购</h1>
      <el-icon v-show="isCollapse" class="logo-icon"><ShoppingCart /></el-icon>
    </div>
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        mode="vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#ffd04b"
        router
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu
            v-if="route.children && route.children.length > 0 && !route.meta?.hidden"
            :index="route.path"
          >
            <template #title>
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children"
              :key="child.path"
              :index="resolvePath(route.path, child.path)"
              v-if="!child.meta?.hidden"
            >
              <el-icon v-if="child.meta?.icon">
                <component :is="child.meta.icon" />
              </el-icon>
              <span>{{ child.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-else-if="!route.meta?.hidden"
            :index="route.path"
          >
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <template #title>
              <span>{{ route.meta?.title }}</span>
            </template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/modules/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const isCollapse = computed(() => !appStore.sidebar.opened)

const activeMenu = computed(() => {
  return route.path
})

const menuRoutes = computed(() => {
  return router.options.routes.filter(r => r.path !== '/login' && r.path !== '/:pathMatch(.*)*')
})

function resolvePath(parent, child) {
  if (child.startsWith('/')) {
    return child
  }
  return `${parent}/${child}`.replace(/\/+/g, '/')
}
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100%;
  width: 100%;
  background-color: #304156;

  .logo {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2b2f3a;
    color: #fff;
    font-size: 18px;
    font-weight: bold;

    .title {
      margin: 0;
      font-size: 16px;
    }

    .logo-icon {
      font-size: 28px;
    }
  }

  .scrollbar-wrapper {
    height: calc(100% - 50px);
  }

  :deep(.el-menu) {
    border-right: none;
  }

  :deep(.el-menu-item:hover),
  :deep(.el-sub-menu__title:hover) {
    background-color: #263445 !important;
  }

  :deep(.el-menu-item.is-active) {
    background-color: #409eff !important;
    color: #fff !important;
  }
}
</style>
