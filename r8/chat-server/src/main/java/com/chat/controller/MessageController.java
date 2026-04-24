package com.chat.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.chat.common.Result;
import com.chat.dto.SendMessageDTO;
import com.chat.service.MessageService;
import com.chat.vo.MessageVO;
import com.chat.vo.UnreadCountVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/message")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/send")
    public Result<MessageVO> sendMessage(HttpServletRequest request, @Valid @RequestBody SendMessageDTO dto) {
        Long userId = (Long) request.getAttribute("userId");
        MessageVO vo = messageService.sendMessage(userId, dto);
        return Result.success("消息发送成功", vo);
    }

    @GetMapping("/history")
    public Result<Page<MessageVO>> getHistoryMessages(
            HttpServletRequest request,
            @RequestParam Long targetId,
            @RequestParam Integer chatType,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "50") Integer pageSize) {
        Long userId = (Long) request.getAttribute("userId");
        Page<MessageVO> messages = messageService.getHistoryMessages(userId, targetId, chatType, pageNum, pageSize);
        return Result.success(messages);
    }

    @GetMapping("/unread/counts")
    public Result<List<UnreadCountVO>> getUnreadCounts(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<UnreadCountVO> counts = messageService.getUnreadCounts(userId);
        return Result.success(counts);
    }

    @GetMapping("/unread/count")
    public Result<Integer> getUnreadCount(
            HttpServletRequest request,
            @RequestParam Long targetId,
            @RequestParam Integer chatType) {
        Long userId = (Long) request.getAttribute("userId");
        Integer count = messageService.getUnreadCount(userId, targetId, chatType);
        return Result.success(count);
    }

    @PostMapping("/read")
    public Result<Void> markAsRead(
            HttpServletRequest request,
            @RequestParam Long targetId,
            @RequestParam Integer chatType) {
        Long userId = (Long) request.getAttribute("userId");
        messageService.markAsRead(userId, targetId, chatType);
        return Result.success("已标记为已读");
    }

    @GetMapping("/offline")
    public Result<List<MessageVO>> getOfflineMessages(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<MessageVO> messages = messageService.getOfflineMessages(userId);
        return Result.success(messages);
    }

    @PostMapping("/offline/clear")
    public Result<Void> clearOfflineMessages(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        messageService.clearOfflineMessages(userId);
        return Result.success("已清除离线消息");
    }
}
