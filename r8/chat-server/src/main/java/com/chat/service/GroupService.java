package com.chat.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chat.dto.CreateGroupDTO;
import com.chat.entity.ChatGroup;
import com.chat.entity.GroupMember;
import com.chat.vo.GroupMemberVO;
import com.chat.vo.GroupVO;

import java.util.List;

public interface GroupService extends IService<ChatGroup> {

    GroupVO createGroup(Long userId, CreateGroupDTO dto);

    void dissolveGroup(Long userId, Long groupId);

    void addMember(Long userId, Long groupId, List<Long> userIds);

    void removeMember(Long userId, Long groupId, Long memberId);

    void quitGroup(Long userId, Long groupId);

    GroupVO getGroupInfo(Long groupId);

    List<GroupVO> getMyGroups(Long userId);

    List<GroupMemberVO> getGroupMembers(Long groupId);

    boolean isGroupMember(Long userId, Long groupId);

    boolean isGroupOwner(Long userId, Long groupId);
}
