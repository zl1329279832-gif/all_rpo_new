package com.example.onlinecoursesystem.controller;

import com.example.onlinecoursesystem.dto.ApiResponse;
import com.example.onlinecoursesystem.entity.Assignment;
import com.example.onlinecoursesystem.entity.AssignmentSubmission;
import com.example.onlinecoursesystem.entity.User;
import com.example.onlinecoursesystem.service.AssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getStudentAssignments(
            @AuthenticationPrincipal User user) {
        return ApiResponse.success(assignmentService.getStudentAssignments(user.getId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<Assignment> getAssignmentById(@PathVariable Long id) {
        try {
            return ApiResponse.success(assignmentService.getAssignmentById(id));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/{id}/submission")
    public ApiResponse<AssignmentSubmission> getSubmission(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ApiResponse.success(assignmentService.getSubmission(id, user.getId()));
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<AssignmentSubmission> submitAssignment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User user) {
        try {
            String content = (String) request.get("content");
            String fileUrl = (String) request.get("fileUrl");
            
            return ApiResponse.success("提交成功", 
                    assignmentService.submitAssignment(id, user.getId(), content, fileUrl));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/draft")
    public ApiResponse<AssignmentSubmission> saveDraft(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User user) {
        try {
            String content = (String) request.get("content");
            String fileUrl = (String) request.get("fileUrl");
            
            return ApiResponse.success("草稿保存成功", 
                    assignmentService.saveDraft(id, user.getId(), content, fileUrl));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/grades")
    public ApiResponse<List<Map<String, Object>>> getGrades(
            @AuthenticationPrincipal User user) {
        return ApiResponse.success(assignmentService.getStudentGrades(user.getId()));
    }
}
