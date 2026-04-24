package com.chat.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chat.dto.AddFriendDTO;
import com.chat.entity.Friend;
import com.chat.vo.FriendVO;

import java.util.List;

public interface FriendService extends IService<Friend> {

    void addFriend(Long userId, AddFriendDTO dto);

    void acceptFriend(Long userId, Long friendId);

    void rejectFriend(Long userId, Long friendId);

    void removeFriend(Long userId, Long friendId);

    List<FriendVO> getFriendList(Long userId);

    List<FriendVO> getPendingRequests(Long userId);

    boolean isFriend(Long userId1, Long userId2);
}
