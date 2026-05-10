package com.example.onlinecoursesystem.controller;

import com.example.onlinecoursesystem.dto.ApiResponse;
import com.example.onlinecoursesystem.dto.CourseDTO;
import com.example.onlinecoursesystem.entity.Assignment;
import com.example.onlinecoursesystem.entity.AssignmentSubmission;
import com.example.onlinecoursesystem.entity.Course;
import com.example.onlinecoursesystem.entity.CourseMaterial;
import com.example.onlinecoursesystem.entity.User;
import com.example.onlinecoursesystem.service.AssignmentService;
import com.example.onlinecoursesystem.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
public class TeacherController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private AssignmentService assignmentService;

    @GetMapping("/courses")
    public ApiResponse<List<CourseDTO>> getTeacherCourses(@AuthenticationPrincipal User user) {
        return ApiResponse.success(courseService.getTeacherCourses(user.getId()));
    }

    @PostMapping("/courses")
    public ApiResponse<CourseDTO> createCourse(
            @RequestBody Course course,
            @AuthenticationPrincipal User user) {
        try {
            return ApiResponse.success("课程创建成功", 
                    courseService.createCourse(course, user.getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/courses/{id}")
    public ApiResponse<CourseDTO> updateCourse(
            @PathVariable Long id,
            @RequestBody Course course,
            @AuthenticationPrincipal User user) {
        try {
            return ApiResponse.success("课程更新成功", 
                    courseService.updateCourse(id, course, user.getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/courses/{id}")
    public ApiResponse<Void> deleteCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        try {
            courseService.deleteCourse(id, user.getId());
            return ApiResponse.success("课程删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/courses/{courseId}/materials")
    public ApiResponse<CourseMaterial> addCourseMaterial(
            @PathVariable Long courseId,
            @RequestBody CourseMaterial material,
            @AuthenticationPrincipal User user) {
        material.setCourseId(courseId);
        return ApiResponse.success("资料添加成功", courseService.addCourseMaterial(material));
    }

    @DeleteMapping("/materials/{materialId}")
    public ApiResponse<Void> deleteCourseMaterial(
            @PathVariable Long materialId,
            @AuthenticationPrincipal User user) {
        try {
            courseService.deleteCourseMaterial(materialId, user.getId());
            return ApiResponse.success("资料删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/assignments")
    public ApiResponse<List<Assignment>> getTeacherAssignments(@AuthenticationPrincipal User user) {
        return ApiResponse.success(assignmentService.getTeacherAssignments(user.getId()));
    }

    @GetMapping("/assignments/{id}")
    public ApiResponse<Assignment> getAssignmentById(@PathVariable Long id) {
        try {
            return ApiResponse.success(assignmentService.getAssignmentById(id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/assignments")
    public ApiResponse<Assignment> createAssignment(
            @RequestBody Assignment assignment,
            @AuthenticationPrincipal User user) {
        try {
            return ApiResponse.success("作业发布成功", 
                    assignmentService.createAssignment(assignment, user.getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/assignments/{id}")
    public ApiResponse<Assignment> updateAssignment(
            @PathVariable Long id,
            @RequestBody Assignment assignment,
            @AuthenticationPrincipal User user) {
        try {
            return ApiResponse.success("作业更新成功", 
                    assignmentService.updateAssignment(id, assignment, user.getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/assignments/{id}")
    public ApiResponse<Void> deleteAssignment(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        try {
            assignmentService.deleteAssignment(id, user.getId());
            return ApiResponse.success("作业删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    public ApiResponse<List<AssignmentSubmission>> getAssignmentSubmissions(
            @PathVariable Long assignmentId) {
        return ApiResponse.success(assignmentService.getAssignmentSubmissions(assignmentId));
    }

    @PostMapping("/submissions/{submissionId}/grade")
    public ApiResponse<AssignmentSubmission> gradeSubmission(
            @PathVariable Long submissionId,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User user) {
        try {
            Integer score = (Integer) request.get("score");
            String feedback = (String) request.get("feedback");
            
            return ApiResponse.success("批改完成", 
                    assignmentService.gradeSubmission(submissionId, score, feedback, user.getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
