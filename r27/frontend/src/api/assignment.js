import request from '@/utils/request'

export const getStudentAssignments = () => {
  return request({
    url: '/assignments',
    method: 'get'
  })
}

export const getAssignmentById = (id) => {
  return request({
    url: `/assignments/${id}`,
    method: 'get'
  })
}

export const getSubmission = (assignmentId) => {
  return request({
    url: `/assignments/${assignmentId}/submission`,
    method: 'get'
  })
}

export const submitAssignment = (assignmentId, data) => {
  return request({
    url: `/assignments/${assignmentId}/submit`,
    method: 'post',
    data
  })
}

export const saveDraft = (assignmentId, data) => {
  return request({
    url: `/assignments/${assignmentId}/draft`,
    method: 'post',
    data
  })
}

export const getGrades = () => {
  return request({
    url: '/assignments/grades',
    method: 'get'
  })
}

export const getTeacherAssignments = () => {
  return request({
    url: '/teacher/assignments',
    method: 'get'
  })
}

export const getTeacherAssignmentById = (id) => {
  return request({
    url: `/teacher/assignments/${id}`,
    method: 'get'
  })
}

export const createAssignment = (data) => {
  return request({
    url: '/teacher/assignments',
    method: 'post',
    data
  })
}

export const updateAssignment = (id, data) => {
  return request({
    url: `/teacher/assignments/${id}`,
    method: 'put',
    data
  })
}

export const deleteAssignment = (id) => {
  return request({
    url: `/teacher/assignments/${id}`,
    method: 'delete'
  })
}

export const getAssignmentSubmissions = (assignmentId) => {
  return request({
    url: `/teacher/assignments/${assignmentId}/submissions`,
    method: 'get'
  })
}

export const gradeSubmission = (submissionId, data) => {
  return request({
    url: `/teacher/submissions/${submissionId}/grade`,
    method: 'post',
    data
  })
}
