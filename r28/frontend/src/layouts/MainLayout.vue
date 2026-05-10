<template>
  <el-container style="height: 100vh;">
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <Monitor :size="28" />
          <span>服务器监控系统</span>
        </div>
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          router
          class="nav-menu"
        >
          <el-menu-item index="/dashboard">
            <DataAnalysis />
            <span>监控看板</span>
          </el-menu-item>
          <el-menu-item index="/servers">
            <Monitor />
            <span>服务器管理</span>
          </el-menu-item>
          <el-menu-item index="/alerts">
            <Warning />
            <span>告警记录</span>
            <el-badge :value="alertCount" :hidden="alertCount === 0" class="badge" />
          </el-menu-item>
          <el-menu-item index="/alert-rules">
            <Setting />
            <span>告警规则</span>
          </el-menu-item>
          <el-menu-item v-if="isAdmin" index="/users">
            <User />
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="user-name">
              <UserFilled />
              {{ authStore.userInfo?.realName || authStore.userInfo?.username }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item divided>
                  当前角色: {{ authStore.userInfo?.roleName }}
                </el-dropdown-item>
                <el-dropdown-item command="logout">
                  <SwitchButton /> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { alertApi } from '@/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const alertCount = ref(0)
let refreshTimer = null

const activeMenu = computed(() => {
  if (route.path.startsWith('/servers/')) {
    return '/servers'
  }
  return route.path
})

const isAdmin = computed(() => authStore.isAdmin)

async function loadAlertCount() {
  try {
    const res = await alertApi.getStats()
    alertCount.value = res.data.totalActive || 0
  } catch (e) {
  }
}

function handleCommand(command) {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}

onMounted(() => {
  loadAlertCount()
  refreshTimer = setInterval(loadAlertCount, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.header {
  background-color: #001529;
  padding: 0;
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
  gap: 10px;
}

.nav-menu {
  flex: 1;
  background-color: transparent;
  border-bottom: none;
}

.nav-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.8);
  margin: 0 10px;
}

.nav-menu .el-menu-item:hover {
  color: #fff;
  background-color: transparent;
}

.nav-menu .el-menu-item.is-active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.user-info {
  color: #fff;
}

.user-name {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.badge {
  margin-left: 5px;
}

:deep(.el-dropdown-menu__item) {
  padding: 12px 20px;
}
</style>
