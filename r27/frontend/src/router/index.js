import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/student',
    component: () => import('@/views/student/StudentLayout.vue'),
    meta: { requiresAuth: true, role: 'STUDENT' },
    children: [
      {
        path: '',
        redirect: 'courses'
      },
      {
        path: 'courses',
        name: 'StudentCourses',
        component: () => import('@/views/student/Courses.vue')
      },
      {
        path: 'courses/:id',
        name: 'StudentCourseDetail',
        component: () => import('@/views/student/CourseDetail.vue')
      },
      {
        path: 'assignments',
        name: 'StudentAssignments',
        component: () => import('@/views/student/Assignments.vue')
      },
      {
        path: 'assignments/:id',
        name: 'StudentAssignmentDetail',
        component: () => import('@/views/student/AssignmentDetail.vue')
      },
      {
        path: 'grades',
        name: 'StudentGrades',
        component: () => import('@/views/student/Grades.vue')
      }
    ]
  },
  {
    path: '/teacher',
    component: () => import('@/views/teacher/TeacherLayout.vue'),
    meta: { requiresAuth: true, role: ['TEACHER', 'ADMIN'] },
    children: [
      {
        path: '',
        redirect: 'courses'
      },
      {
        path: 'courses',
        name: 'TeacherCourses',
        component: () => import('@/views/teacher/Courses.vue')
      },
      {
        path: 'courses/:id',
        name: 'TeacherCourseDetail',
        component: () => import('@/views/teacher/CourseDetail.vue')
      },
      {
        path: 'assignments',
        name: 'TeacherAssignments',
        component: () => import('@/views/teacher/Assignments.vue')
      },
      {
        path: 'assignments/:id',
        name: 'TeacherAssignmentDetail',
        component: () => import('@/views/teacher/AssignmentDetail.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.guest && userStore.isLoggedIn) {
    if (userStore.isTeacher || userStore.isAdmin) {
      next('/teacher/courses')
    } else {
      next('/student/courses')
    }
    return
  }
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  
  if (to.meta.role) {
    const roles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role]
    if (!roles.includes(userStore.user?.role)) {
      if (userStore.isTeacher || userStore.isAdmin) {
        next('/teacher/courses')
      } else {
        next('/student/courses')
      }
      return
    }
  }
  
  next()
})

export default router
