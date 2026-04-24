package com.chat.controller;

import com.chat.common.Result;
import com.chat.service.UserService;
import com.chat.vo.UserVO;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/info")
    public Result<UserVO> getUserInfo(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        UserVO vo = userService.getUserInfo(userId);
        return Result.success(vo);
    }

    @GetMapping("/info/id")
    public Result<UserVO> getUserInfoById(@RequestParam Long id) {
        UserVO vo = userService.getUserInfo(id);
        return Result.success(vo);
    }

    @GetMapping("/search")
    public Result<List<UserVO>> searchUsers(@RequestParam String keyword) {
        List<UserVO> users = userService.searchUsers(keyword);
        return Result.success(users);
    }

    @GetMapping("/online")
    public Result<List<UserVO>> getOnlineUsers() {
        List<UserVO> users = userService.getOnlineUsers();
        return Result.success(users);
    }
}
