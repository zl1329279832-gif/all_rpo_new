package com.example.onlinecoursesystem.controller;

import com.example.onlinecoursesystem.dto.ApiResponse;
import com.example.onlinecoursesystem.dto.LoginRequest;
import com.example.onlinecoursesystem.dto.RegisterRequest;
import com.example.onlinecoursesystem.entity.User;
import com.example.onlinecoursesystem.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        try {
            Map<String, Object> result = authService.login(request);
            return ApiResponse.success("登录成功", result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            Map<String, Object> result = authService.register(request);
            return ApiResponse.success("注册成功", result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal User user) {
        if (user != null) {
            authService.logout(user.getUsername());
        }
        return ApiResponse.success("退出登录成功", null);
    }

    @GetMapping("/me")
    public ApiResponse<User> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ApiResponse.error("未登录");
        }
        User safeUser = new User();
        safeUser.setId(user.getId());
        safeUser.setUsername(user.getUsername());
        safeUser.setNickname(user.getNickname());
        safeUser.setEmail(user.getEmail());
        safeUser.setPhone(user.getPhone());
        safeUser.setRole(user.getRole());
        safeUser.setAvatar(user.getAvatar());
        safeUser.setStatus(user.getStatus());
        safeUser.setCreatedAt(user.getCreatedAt());
        return ApiResponse.success(safeUser);
    }
}
