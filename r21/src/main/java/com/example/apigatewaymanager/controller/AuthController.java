package com.example.apigatewaymanager.controller;

import com.example.apigatewaymanager.common.Result;
import com.example.apigatewaymanager.dto.LoginDTO;
import com.example.apigatewaymanager.dto.RegisterDTO;
import com.example.apigatewaymanager.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterDTO registerDTO) {
        authService.register(registerDTO);
        return Result.success("注册成功", null);
    }

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginDTO loginDTO) {
        Map<String, Object> result = authService.login(loginDTO);
        return Result.success("登录成功", result);
    }
}
