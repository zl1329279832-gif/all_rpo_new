package com.chat.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chat.common.BusinessException;
import com.chat.dto.SendMessageDTO;
import com.chat.entity.ChatMessage;
import com.chat.entity.GroupMember;
import com.chat.entity.OfflineMessage;
import com.chat.entity.User;
import com.chat.mapper.ChatMessageMapper;
import com.chat.mapper.GroupMemberMapper;
import com.chat.mapper.OfflineMessageMapper;
import com.chat.service.FriendService;
import com.chat.service.GroupService;
import com.chat.service.MessageService;
import com.chat.service.UserService;
import com.chat.vo.MessageVO;
import com.chat.vo.UnreadCountVO;
import com.chat.vo.UserVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl extends ServiceImpl<ChatMessageMapper, ChatMessage> implements MessageService {

    private static final int CHAT_TYPE_PRIVATE = 1;
    private static final int CHAT_TYPE_GROUP = 2;

    private static final int MESSAGE_STATUS_SENT = 0;
    private static final int MESSAGE_STATUS_DELIVERED = 1;
    private static final int MESSAGE_STATUS_READ = 2;

    private final OfflineMessageMapper offlineMessageMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final UserService userService;
    private final FriendService friendService;
    private final GroupService groupService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MessageVO sendMessage(Long fromUserId, SendMessageDTO dto) {
        ChatMessage message = new ChatMessage();
        message.setFromUserId(fromUserId);
        message.setChatType(dto.getChatType());
        message.setMessageType(dto.getMessageType());
        message.setContent(dto.getContent());
        message.setStatus(MESSAGE_STATUS_SENT);
        message.setSendTime(LocalDateTime.now());

        if (dto.getChatType() == CHAT_TYPE_PRIVATE) {
            if (dto.getToUserId() == null) {
                throw new BusinessException("私聊消息必须指定接收用户");
            }
            if (!friendService.isFriend(fromUserId, dto.getToUserId())) {
                throw new BusinessException("不是好友，无法发送消息");
            }
            message.setToUserId(dto.getToUserId());
        } else if (dto.getChatType() == CHAT_TYPE_GROUP) {
            if (dto.getGroupId() == null) {
                throw new BusinessException("群聊消息必须指定群组");
            }
            if (!groupService.isGroupMember(fromUserId, dto.getGroupId())) {
                throw new BusinessException("不是群成员，无法发送消息");
            }
            message.setGroupId(dto.getGroupId());
        } else {
            throw new BusinessException("不支持的聊天类型");
        }

        this.save(message);

        if (dto.getChatType() == CHAT_TYPE_PRIVATE) {
            boolean isOnline = userService.isOnline(dto.getToUserId());
            if (!isOnline) {
                saveOfflineMessage(message.getId(), dto.getToUserId());
            }
        } else if (dto.getChatType() == CHAT_TYPE_GROUP) {
            List<GroupMember> members = groupMemberMapper.selectList(new LambdaQueryWrapper<GroupMember>()
                    .eq(GroupMember::getGroupId, dto.getGroupId())
                    .ne(GroupMember::getUserId, fromUserId));

            for (GroupMember member : members) {
                boolean isOnline = userService.isOnline(member.getUserId());
                if (!isOnline) {
                    saveOfflineMessage(message.getId(), member.getUserId());
                }
            }
        }

        log.info("发送消息: messageId={}, from={}, chatType={}", message.getId(), fromUserId, dto.getChatType());
        return toMessageVO(message);
    }

    @Override
    public Page<MessageVO> getHistoryMessages(Long userId, Long targetId, Integer chatType, 
                                                Integer pageNum, Integer pageSize) {
        Page<ChatMessage> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<ChatMessage> wrapper = new LambdaQueryWrapper<ChatMessage>()
                .orderByDesc(ChatMessage::getSendTime);

        if (chatType == CHAT_TYPE_PRIVATE) {
            wrapper.and(w -> w
                    .eq(ChatMessage::getFromUserId, userId).eq(ChatMessage::getToUserId, targetId)
                    .or()
                    .eq(ChatMessage::getFromUserId, targetId).eq(ChatMessage::getToUserId, userId)
            );
        } else if (chatType == CHAT_TYPE_GROUP) {
            wrapper.eq(ChatMessage::getGroupId, targetId);
        }

        Page<ChatMessage> messagePage = this.page(page, wrapper);

        Page<MessageVO> voPage = new Page<>();
        BeanUtils.copyProperties(messagePage, voPage, "records");

        if (messagePage.getRecords().isEmpty()) {
            voPage.setRecords(Collections.emptyList());
            return voPage;
        }

        Set<Long> userIds = messagePage.getRecords().stream()
                .map(ChatMessage::getFromUserId)
                .collect(Collectors.toSet());

        List<User> users = userService.listByIds(userIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<MessageVO> records = messagePage.getRecords().stream()
                .map(msg -> {
                    MessageVO vo = toMessageVO(msg);
                    User user = userMap.get(msg.getFromUserId());
                    if (user != null) {
                        UserVO userVO = new UserVO();
                        BeanUtils.copyProperties(user, userVO);
                        vo.setFromUser(userVO);
                    }
                    return vo;
                })
                .collect(Collectors.toList());

        Collections.reverse(records);
        voPage.setRecords(records);
        return voPage;
    }

    @Override
    public List<UnreadCountVO> getUnreadCounts(Long userId) {
        List<OfflineMessage> offlineMessages = offlineMessageMapper.selectList(new LambdaQueryWrapper<OfflineMessage>()
                .eq(OfflineMessage::getUserId, userId)
                .eq(OfflineMessage::getStatus, 0));

        if (offlineMessages.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> messageIds = offlineMessages.stream()
                .map(OfflineMessage::getMessageId)
                .collect(Collectors.toSet());

        List<ChatMessage> messages = this.listByIds(messageIds);
        Map<Long, ChatMessage> messageMap = messages.stream()
                .collect(Collectors.toMap(ChatMessage::getId, m -> m));

        Map<String, Long> countMap = offlineMessages.stream()
                .map(offline -> {
                    ChatMessage msg = messageMap.get(offline.getMessageId());
                    if (msg == null) return null;
                    
                    String key;
                    if (msg.getChatType() == CHAT_TYPE_PRIVATE) {
                        key = CHAT_TYPE_PRIVATE + "_" + msg.getFromUserId();
                    } else {
                        key = CHAT_TYPE_GROUP + "_" + msg.getGroupId();
                    }
                    return key;
                })
                .filter(key -> key != null)
                .collect(Collectors.groupingBy(k -> k, Collectors.counting()));

        return countMap.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split("_");
                    UnreadCountVO vo = new UnreadCountVO();
                    vo.setChatType(Integer.parseInt(parts[0]));
                    vo.setTargetId(Long.parseLong(parts[1]));
                    vo.setCount(entry.getValue().intValue());
                    return vo;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Integer getUnreadCount(Long userId, Long targetId, Integer chatType) {
        List<OfflineMessage> offlineMessages = offlineMessageMapper.selectList(new LambdaQueryWrapper<OfflineMessage>()
                .eq(OfflineMessage::getUserId, userId)
                .eq(OfflineMessage::getStatus, 0));

        if (offlineMessages.isEmpty()) {
            return 0;
        }

        Set<Long> messageIds = offlineMessages.stream()
                .map(OfflineMessage::getMessageId)
                .collect(Collectors.toSet());

        LambdaQueryWrapper<ChatMessage> wrapper = new LambdaQueryWrapper<ChatMessage>()
                .in(ChatMessage::getId, messageIds);

        if (chatType == CHAT_TYPE_PRIVATE) {
            wrapper.eq(ChatMessage::getChatType, CHAT_TYPE_PRIVATE)
                    .eq(ChatMessage::getFromUserId, targetId)
                    .eq(ChatMessage::getToUserId, userId);
        } else {
            wrapper.eq(ChatMessage::getChatType, CHAT_TYPE_GROUP)
                    .eq(ChatMessage::getGroupId, targetId);
        }

        return this.count(wrapper).intValue();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markAsRead(Long userId, Long targetId, Integer chatType) {
        List<OfflineMessage> offlineMessages = offlineMessageMapper.selectList(new LambdaQueryWrapper<OfflineMessage>()
                .eq(OfflineMessage::getUserId, userId)
                .eq(OfflineMessage::getStatus, 0));

        if (offlineMessages.isEmpty()) {
            return;
        }

        Set<Long> messageIds = offlineMessages.stream()
                .map(OfflineMessage::getMessageId)
                .collect(Collectors.toSet());

        LambdaQueryWrapper<ChatMessage> msgWrapper = new LambdaQueryWrapper<ChatMessage>()
                .in(ChatMessage::getId, messageIds);

        if (chatType == CHAT_TYPE_PRIVATE) {
            msgWrapper.eq(ChatMessage::getChatType, CHAT_TYPE_PRIVATE)
                    .eq(ChatMessage::getFromUserId, targetId)
                    .eq(ChatMessage::getToUserId, userId);
        } else {
            msgWrapper.eq(ChatMessage::getChatType, CHAT_TYPE_GROUP)
                    .eq(ChatMessage::getGroupId, targetId);
        }

        List<ChatMessage> messages = this.list(msgWrapper);
        if (messages.isEmpty()) {
            return;
        }

        Set<Long> readMessageIds = messages.stream()
                .map(ChatMessage::getId)
                .collect(Collectors.toSet());

        for (ChatMessage msg : messages) {
            msg.setStatus(MESSAGE_STATUS_READ);
            msg.setReadTime(LocalDateTime.now());
        }
        this.updateBatchById(messages);

        for (OfflineMessage offline : offlineMessages) {
            if (readMessageIds.contains(offline.getMessageId())) {
                offline.setStatus(1);
                offlineMessageMapper.updateById(offline);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void markMessageAsRead(Long messageId) {
        ChatMessage message = this.getById(messageId);
        if (message != null) {
            message.setStatus(MESSAGE_STATUS_READ);
            message.setReadTime(LocalDateTime.now());
            this.updateById(message);
        }
    }

    @Override
    public List<MessageVO> getOfflineMessages(Long userId) {
        List<OfflineMessage> offlineMessages = offlineMessageMapper.selectList(new LambdaQueryWrapper<OfflineMessage>()
                .eq(OfflineMessage::getUserId, userId)
                .eq(OfflineMessage::getStatus, 0)
                .orderByAsc(OfflineMessage::getCreateTime));

        if (offlineMessages.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> messageIds = offlineMessages.stream()
                .map(OfflineMessage::getMessageId)
                .collect(Collectors.toSet());

        List<ChatMessage> messages = this.listByIds(messageIds);
        Map<Long, ChatMessage> messageMap = messages.stream()
                .collect(Collectors.toMap(ChatMessage::getId, m -> m));

        Set<Long> userIds = messages.stream()
                .map(ChatMessage::getFromUserId)
                .collect(Collectors.toSet());

        List<User> users = userService.listByIds(userIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return offlineMessages.stream()
                .map(offline -> {
                    ChatMessage msg = messageMap.get(offline.getMessageId());
                    if (msg == null) return null;

                    MessageVO vo = toMessageVO(msg);
                    User user = userMap.get(msg.getFromUserId());
                    if (user != null) {
                        UserVO userVO = new UserVO();
                        BeanUtils.copyProperties(user, userVO);
                        vo.setFromUser(userVO);
                    }
                    return vo;
                })
                .filter(vo -> vo != null)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void clearOfflineMessages(Long userId) {
        offlineMessageMapper.delete(new LambdaQueryWrapper<OfflineMessage>()
                .eq(OfflineMessage::getUserId, userId));
    }

    @Override
    public void saveOfflineMessage(Long messageId, Long userId) {
        OfflineMessage offline = new OfflineMessage();
        offline.setMessageId(messageId);
        offline.setUserId(userId);
        offline.setStatus(0);
        offline.setCreateTime(LocalDateTime.now());
        offlineMessageMapper.insert(offline);
    }

    private MessageVO toMessageVO(ChatMessage message) {
        MessageVO vo = new MessageVO();
        BeanUtils.copyProperties(message, vo);
        return vo;
    }
}
