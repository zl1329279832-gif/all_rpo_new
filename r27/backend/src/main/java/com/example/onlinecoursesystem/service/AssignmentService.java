package com.example.onlinecoursesystem.service;

import com.example.onlinecoursesystem.entity.Assignment;
import com.example.onlinecoursesystem.entity.AssignmentSubmission;
import com.example.onlinecoursesystem.entity.Course;
import com.example.onlinecoursesystem.entity.CourseEnrollment;
import com.example.onlinecoursesystem.repository.AssignmentRepository;
import com.example.onlinecoursesystem.repository.AssignmentSubmissionRepository;
import com.example.onlinecoursesystem.repository.CourseEnrollmentRepository;
import com.example.onlinecoursesystem.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AssignmentService {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository submissionRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseEnrollmentRepository enrollmentRepository;

    public Assignment createAssignment(Assignment assignment, Long teacherId) {
        Course course = courseRepository.findById(assignment.getCourseId())
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        if (!course.getTeacherId().equals(teacherId)) {
            throw new RuntimeException("无权在此课程发布作业");
        }
        
        assignment.setTeacherId(teacherId);
        return assignmentRepository.save(assignment);
    }

    public Assignment updateAssignment(Long id, Assignment assignmentDetails, Long teacherId) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("作业不存在"));
        
        if (!assignment.getTeacherId().equals(teacherId)) {
            throw new RuntimeException("无权修改此作业");
        }
        
        assignment.setTitle(assignmentDetails.getTitle());
        assignment.setDescription(assignmentDetails.getDescription());
        assignment.setMaxScore(assignmentDetails.getMaxScore());
        assignment.setDeadline(assignmentDetails.getDeadline());
        assignment.setStatus(assignmentDetails.getStatus());
        
        return assignmentRepository.save(assignment);
    }

    public void deleteAssignment(Long id, Long teacherId) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("作业不存在"));
        
        if (!assignment.getTeacherId().equals(teacherId)) {
            throw new RuntimeException("无权删除此作业");
        }
        
        assignmentRepository.delete(assignment);
    }

    public List<Assignment> getCourseAssignments(Long courseId) {
        return assignmentRepository.findByCourseId(courseId);
    }

    public List<Assignment> getTeacherAssignments(Long teacherId) {
        return assignmentRepository.findByTeacherId(teacherId);
    }

    public List<Map<String, Object>> getStudentAssignments(Long studentId) {
        List<CourseEnrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        List<Long> courseIds = enrollments.stream()
                .filter(e -> e.getStatus() == 1)
                .map(CourseEnrollment::getCourseId)
                .toList();
        
        if (courseIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<Assignment> assignments = assignmentRepository.findByCourseIdIn(courseIds);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Assignment assignment : assignments) {
            Map<String, Object> item = new HashMap<>();
            item.put("assignment", assignment);
            
            AssignmentSubmission submission = submissionRepository
                    .findByAssignmentIdAndStudentId(assignment.getId(), studentId)
                    .orElse(null);
            item.put("submission", submission);
            
            courseRepository.findById(assignment.getCourseId()).ifPresent(course -> 
                item.put("courseName", course.getTitle())
            );
            
            result.add(item);
        }
        
        return result;
    }

    public Assignment getAssignmentById(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("作业不存在"));
    }

    @Transactional
    public AssignmentSubmission submitAssignment(Long assignmentId, Long studentId, String content, String fileUrl) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("作业不存在"));
        
        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElse(new AssignmentSubmission());
        
        if (submission.getId() == null) {
            submission.setAssignmentId(assignmentId);
            submission.setStudentId(studentId);
        }
        
        submission.setContent(content);
        submission.setFileUrl(fileUrl);
        submission.setStatus(AssignmentSubmission.SubmissionStatus.SUBMITTED);
        submission.setSubmittedAt(LocalDateTime.now());
        
        if (assignment.getDeadline() != null && LocalDateTime.now().isAfter(assignment.getDeadline())) {
            submission.setStatus(AssignmentSubmission.SubmissionStatus.LATE);
        }
        
        return submissionRepository.save(submission);
    }

    public AssignmentSubmission saveDraft(Long assignmentId, Long studentId, String content, String fileUrl) {
        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElse(new AssignmentSubmission());
        
        if (submission.getId() == null) {
            submission.setAssignmentId(assignmentId);
            submission.setStudentId(studentId);
            submission.setStatus(AssignmentSubmission.SubmissionStatus.DRAFT);
        }
        
        submission.setContent(content);
        submission.setFileUrl(fileUrl);
        
        return submissionRepository.save(submission);
    }

    public AssignmentSubmission getSubmission(Long assignmentId, Long studentId) {
        return submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElse(null);
    }

    public List<AssignmentSubmission> getAssignmentSubmissions(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId);
    }

    @Transactional
    public AssignmentSubmission gradeSubmission(Long submissionId, Integer score, String feedback, Long teacherId) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("提交记录不存在"));
        
        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("作业不存在"));
        
        if (!assignment.getTeacherId().equals(teacherId)) {
            throw new RuntimeException("无权批改此作业");
        }
        
        if (score < 0 || score > assignment.getMaxScore()) {
            throw new RuntimeException("分数超出范围");
        }
        
        submission.setScore(score);
        submission.setFeedback(feedback);
        submission.setGradedBy(teacherId);
        submission.setGradedAt(LocalDateTime.now());
        submission.setStatus(AssignmentSubmission.SubmissionStatus.GRADED);
        
        return submissionRepository.save(submission);
    }

    public List<Map<String, Object>> getStudentGrades(Long studentId) {
        List<AssignmentSubmission> submissions = submissionRepository.findByStudentId(studentId);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (AssignmentSubmission submission : submissions) {
            if (submission.getScore() == null) continue;
            
            Map<String, Object> item = new HashMap<>();
            item.put("submission", submission);
            
            assignmentRepository.findById(submission.getAssignmentId()).ifPresent(assignment -> {
                item.put("assignment", assignment);
                courseRepository.findById(assignment.getCourseId()).ifPresent(course -> 
                    item.put("courseName", course.getTitle())
                );
            });
            
            result.add(item);
        }
        
        return result;
    }
}
