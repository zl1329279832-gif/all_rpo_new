import request from '@/utils/request'

export const getAllCourses = () => {
  return request({
    url: '/courses',
    method: 'get'
  })
}

export const getCourseById = (id) => {
  return request({
    url: `/courses/${id}`,
    method: 'get'
  })
}

export const getCourseMaterials = (courseId) => {
  return request({
    url: `/courses/${courseId}/materials`,
    method: 'get'
  })
}

export const getEnrolledCourses = () => {
  return request({
    url: '/courses/enrolled',
    method: 'get'
  })
}

export const enrollCourse = (courseId) => {
  return request({
    url: `/courses/${courseId}/enroll`,
    method: 'post'
  })
}

export const unenrollCourse = (courseId) => {
  return request({
    url: `/courses/${courseId}/enroll`,
    method: 'delete'
  })
}

export const getTeacherCourses = () => {
  return request({
    url: '/teacher/courses',
    method: 'get'
  })
}

export const createCourse = (data) => {
  return request({
    url: '/teacher/courses',
    method: 'post',
    data
  })
}

export const updateCourse = (id, data) => {
  return request({
    url: `/teacher/courses/${id}`,
    method: 'put',
    data
  })
}

export const deleteCourse = (id) => {
  return request({
    url: `/teacher/courses/${id}`,
    method: 'delete'
  })
}

export const addCourseMaterial = (courseId, data) => {
  return request({
    url: `/teacher/courses/${courseId}/materials`,
    method: 'post',
    data
  })
}

export const deleteCourseMaterial = (materialId) => {
  return request({
    url: `/teacher/materials/${materialId}`,
    method: 'delete'
  })
}
