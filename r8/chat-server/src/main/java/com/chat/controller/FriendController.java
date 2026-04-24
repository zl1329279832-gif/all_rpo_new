package com.chat.controller;

import com.chat.common.Result;
import com.chat.dto.AddFriendDTO;
import com.chat.service.FriendService;
import com.chat.vo.FriendVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/friend")
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @PostMapping("/add")
    public Result<String> addFriend(HttpServletRequest request, @Valid @RequestBody AddFriendDTO dto) {
        Long userId = (Long) request.getAttribute("userId");
        friendService.addFriend(userId, dto);
        return Result.success("好友申请已发送");
    }

    @PostMapping("/accept")
    public Result<String> acceptFriend(HttpServletRequest request, @RequestParam Long friendId) {
        Long userId = (Long) request.getAttribute("userId");
        friendService.acceptFriend(userId, friendId);
        return Result.success("已接受好友申请");
    }

    @PostMapping("/reject")
    public Result<String> rejectFriend(HttpServletRequest request, @RequestParam Long friendId) {
        Long userId = (Long) request.getAttribute("userId");
        friendService.rejectFriend(userId, friendId);
        return Result.success("已拒绝好友申请");
    }

    @DeleteMapping("/remove")
    public Result<String> removeFriend(HttpServletRequest request, @RequestParam Long friendId) {
        Long userId = (Long) request.getAttribute("userId");
        friendService.removeFriend(userId, friendId);
        return Result.success("已删除好友");
    }

    @GetMapping("/list")
    public Result<List<FriendVO>> getFriendList(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<FriendVO> friends = friendService.getFriendList(userId);
        return Result.success(friends);
    }

    @GetMapping("/pending")
    public Result<List<FriendVO>> getPendingRequests(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<FriendVO> requests = friendService.getPendingRequests(userId);
        return Result.success(requests);
    }
}
