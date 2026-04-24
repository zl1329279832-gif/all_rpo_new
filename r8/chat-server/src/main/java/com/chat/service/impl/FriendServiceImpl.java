package com.chat.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chat.common.BusinessException;
import com.chat.dto.AddFriendDTO;
import com.chat.entity.Friend;
import com.chat.entity.User;
import com.chat.mapper.FriendMapper;
import com.chat.service.FriendService;
import com.chat.service.UserService;
import com.chat.vo.FriendVO;
import com.chat.vo.UserVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FriendServiceImpl extends ServiceImpl<FriendMapper, Friend> implements FriendService {

    private static final Logger log = LoggerFactory.getLogger(FriendServiceImpl.class);

    private final UserService userService;

    public FriendServiceImpl(UserService userService) {
        this.userService = userService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addFriend(Long userId, AddFriendDTO dto) {
        if (userId.equals(dto.getFriendId())) {
            throw new BusinessException("不能添加自己为好友");
        }

        User friendUser = userService.getById(dto.getFriendId());
        if (friendUser == null) {
            throw new BusinessException("用户不存在");
        }

        if (isFriend(userId, dto.getFriendId())) {
            throw new BusinessException("已经是好友");
        }

        Friend existRequest = this.getOne(new LambdaQueryWrapper<Friend>()
                .eq(Friend::getUserId, userId)
                .eq(Friend::getFriendId, dto.getFriendId())
                .eq(Friend::getStatus, 0));

        if (existRequest != null) {
            throw new BusinessException("已发送好友申请，等待对方同意");
        }

        Friend friend = new Friend();
        friend.setUserId(userId);
        friend.setFriendId(dto.getFriendId());
        friend.setRemark(dto.getRemark());
        friend.setStatus(0);
        friend.setCreateTime(LocalDateTime.now());

        this.save(friend);
        log.info("发送好友申请: from={}, to={}", userId, dto.getFriendId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void acceptFriend(Long userId, Long friendId) {
        Friend request = this.getOne(new LambdaQueryWrapper<Friend>()
                .eq(Friend::getUserId, friendId)
                .eq(Friend::getFriendId, userId)
                .eq(Friend::getStatus, 0));

        if (request == null) {
            throw new BusinessException("好友申请不存在");
        }

        request.setStatus(1);
        this.updateById(request);

        Friend friend = new Friend();
        friend.setUserId(userId);
        friend.setFriendId(friendId);
        friend.setStatus(1);
        friend.setCreateTime(LocalDateTime.now());
        this.save(friend);

        log.info("接受好友申请: userId={}, friendId={}", userId, friendId);
    }

    @Override
    public void rejectFriend(Long userId, Long friendId) {
        Friend request = this.getOne(new LambdaQueryWrapper<Friend>()
                .eq(Friend::getUserId, friendId)
                .eq(Friend::getFriendId, userId)
                .eq(Friend::getStatus, 0));

        if (request != null) {
            this.removeById(request);
            log.info("拒绝好友申请: userId={}, friendId={}", userId, friendId);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeFriend(Long userId, Long friendId) {
        this.remove(new LambdaQueryWrapper<Friend>()
                .eq(Friend::getUserId, userId)
                .eq(Friend::getFriendId, friendId));

        this.remove(new LambdaQueryWrapper<Friend>()
                .eq(Friend::getUserId, friendId)
                .eq(Friend::getFriendId, userId));

        log.info("删除好友: userId={}, friendId={}", userId, friendId);
    }

    @Override
    public List<FriendVO> getFriendList(Long userId) {
        List<Friend> friends = this.list(new LambdaQueryWrapper<Friend>()
                .eq(Friend::getUserId, userId)
                .eq(Friend::getStatus, 1)
                .orderByDesc(Friend::getCreateTime));

        if (friends.isEmpty()) {
            return List.of();
        }

        Set<Long> friendIds = friends.stream()
                .map(Friend::getFriendId)
                .collect(Collectors.toSet());

        List<User> users = userService.listByIds(friendIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return friends.stream()
                .map(friend -> {
                    FriendVO vo = new FriendVO();
                    BeanUtils.copyProperties(friend, vo);
                    
                    User user = userMap.get(friend.getFriendId());
                    if (user != null) {
                        UserVO userVO = new UserVO();
                        BeanUtils.copyProperties(user, userVO);
                        userVO.setOnline(userService.isOnline(user.getId()));
                        vo.setFriendInfo(userVO);
                    }
                    return vo;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<FriendVO> getPendingRequests(Long userId) {
        List<Friend> requests = this.list(new LambdaQueryWrapper<Friend>()
                .eq(Friend::getFriendId, userId)
                .eq(Friend::getStatus, 0)
                .orderByDesc(Friend::getCreateTime));

        if (requests.isEmpty()) {
            return List.of();
        }

        Set<Long> userIds = requests.stream()
                .map(Friend::getUserId)
                .collect(Collectors.toSet());

        List<User> users = userService.listByIds(userIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return requests.stream()
                .map(request -> {
                    FriendVO vo = new FriendVO();
                    BeanUtils.copyProperties(request, vo);
                    
                    User user = userMap.get(request.getUserId());
                    if (user != null) {
                        UserVO userVO = new UserVO();
                        BeanUtils.copyProperties(user, userVO);
                        userVO.setOnline(userService.isOnline(user.getId()));
                        vo.setFriendInfo(userVO);
                    }
                    return vo;
                })
                .collect(Collectors.toList());
    }

    @Override
    public boolean isFriend(Long userId1, Long userId2) {
        Long count = this.count(new LambdaQueryWrapper<Friend>()
                .eq(Friend::getUserId, userId1)
                .eq(Friend::getFriendId, userId2)
                .eq(Friend::getStatus, 1));
        return count > 0;
    }
}
