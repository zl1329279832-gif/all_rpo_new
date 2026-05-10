package com.example.onlinecoursesystem.controller;

import com.example.onlinecoursesystem.dto.ApiResponse;
import com.example.onlinecoursesystem.dto.CourseDTO;
import com.example.onlinecoursesystem.entity.Course;
import com.example.onlinecoursesystem.entity.CourseEnrollment;
import com.example.onlinecoursesystem.entity.CourseMaterial;
import com.example.onlinecoursesystem.entity.User;
import com.example.onlinecoursesystem.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @GetMapping
    public ApiResponse<List<CourseDTO>> getAllCourses() {
        return ApiResponse.success(courseService.getAllCourses());
    }

    @GetMapping("/{id}")
    public ApiResponse<CourseDTO> getCourseById(@PathVariable Long id) {
        try {
            return ApiResponse.success(courseService.getCourseById(id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}/materials")
    public ApiResponse<List<CourseMaterial>> getCourseMaterials(@PathVariable Long id) {
        return ApiResponse.success(courseService.getCourseMaterials(id));
    }

    @GetMapping("/enrolled")
    public ApiResponse<List<CourseDTO>> getEnrolledCourses(@AuthenticationPrincipal User user) {
        return ApiResponse.success(courseService.getStudentEnrolledCourses(user.getId()));
    }

    @PostMapping("/{id}/enroll")
    public ApiResponse<CourseEnrollment> enrollCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        try {
            return ApiResponse.success("选课成功", 
                    courseService.enrollCourse(id, user.getId()));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/enroll")
    public ApiResponse<Void> unenrollCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        try {
            courseService.unenrollCourse(id, user.getId());
            return ApiResponse.success("退选成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}
