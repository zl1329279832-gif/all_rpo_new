package com.community.groupbuy.controller;

import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.LoginDTO;
import com.community.groupbuy.security.LoginUser;
import com.community.groupbuy.service.AuthService;
import com.community.groupbuy.vo.LoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Result<LoginVO> login(@Validated @RequestBody LoginDTO loginDTO) {
        LoginVO loginVO = authService.login(loginDTO);
        return Result.success(loginVO);
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        authService.logout();
        return Result.success();
    }

    @GetMapping("/info")
    public Result<LoginUser> info() {
        LoginUser loginUser = authService.getCurrentUser();
        return Result.success(loginUser);
    }
}
