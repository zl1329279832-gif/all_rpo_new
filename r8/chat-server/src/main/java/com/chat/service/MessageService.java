package com.chat.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.chat.dto.SendMessageDTO;
import com.chat.entity.ChatMessage;
import com.chat.vo.MessageVO;
import com.chat.vo.UnreadCountVO;

import java.util.List;

public interface MessageService extends IService<ChatMessage> {

    MessageVO sendMessage(Long fromUserId, SendMessageDTO dto);

    Page<MessageVO> getHistoryMessages(Long userId, Long targetId, Integer chatType, 
                                        Integer pageNum, Integer pageSize);

    List<UnreadCountVO> getUnreadCounts(Long userId);

    Integer getUnreadCount(Long userId, Long targetId, Integer chatType);

    void markAsRead(Long userId, Long targetId, Integer chatType);

    void markMessageAsRead(Long messageId);

    List<MessageVO> getOfflineMessages(Long userId);

    void clearOfflineMessages(Long userId);

    void saveOfflineMessage(Long messageId, Long userId);
}
