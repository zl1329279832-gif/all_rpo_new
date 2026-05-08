package com.example.apigatewaymanager.controller;

import com.example.apigatewaymanager.common.Result;
import com.example.apigatewaymanager.entity.User;
import com.example.apigatewaymanager.service.AuthService;
import com.example.apigatewaymanager.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @GetMapping("/profile")
    public Result<User> getProfile() {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = authService.getUserById(userId);
        return Result.success(user);
    }
}
