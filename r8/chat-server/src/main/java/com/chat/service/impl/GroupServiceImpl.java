package com.chat.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chat.common.BusinessException;
import com.chat.dto.CreateGroupDTO;
import com.chat.entity.ChatGroup;
import com.chat.entity.GroupMember;
import com.chat.entity.User;
import com.chat.mapper.ChatGroupMapper;
import com.chat.mapper.GroupMemberMapper;
import com.chat.service.GroupService;
import com.chat.service.UserService;
import com.chat.vo.GroupMemberVO;
import com.chat.vo.GroupVO;
import com.chat.vo.UserVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

@Service
public class GroupServiceImpl extends ServiceImpl<ChatGroupMapper, ChatGroup> implements GroupService {

    private static final Logger log = LoggerFactory.getLogger(GroupServiceImpl.class);

    private final GroupMemberMapper groupMemberMapper;
    private final UserService userService;

    public GroupServiceImpl(GroupMemberMapper groupMemberMapper, UserService userService) {
        this.groupMemberMapper = groupMemberMapper;
        this.userService = userService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public GroupVO createGroup(Long userId, CreateGroupDTO dto) {
        ChatGroup group = new ChatGroup();
        group.setGroupName(dto.getGroupName());
        group.setGroupNotice(dto.getGroupNotice());
        group.setOwnerId(userId);
        group.setMaxMembers(500);
        group.setCreateTime(LocalDateTime.now());
        group.setUpdateTime(LocalDateTime.now());
        this.save(group);

        GroupMember ownerMember = new GroupMember();
        ownerMember.setGroupId(group.getId());
        ownerMember.setUserId(userId);
        ownerMember.setRole(1);
        ownerMember.setJoinTime(LocalDateTime.now());
        groupMemberMapper.insert(ownerMember);

        if (dto.getMemberIds() != null && !dto.getMemberIds().isEmpty()) {
            for (Long memberId : dto.getMemberIds()) {
                if (!memberId.equals(userId)) {
                    GroupMember member = new GroupMember();
                    member.setGroupId(group.getId());
                    member.setUserId(memberId);
                    member.setRole(0);
                    member.setJoinTime(LocalDateTime.now());
                    groupMemberMapper.insert(member);
                }
            }
        }

        log.info("创建群组: groupId={}, ownerId={}", group.getId(), userId);
        return getGroupInfo(group.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void dissolveGroup(Long userId, Long groupId) {
        ChatGroup group = this.getById(groupId);
        if (group == null) {
            throw new BusinessException("群组不存在");
        }

        if (!group.getOwnerId().equals(userId)) {
            throw new BusinessException("只有群主可以解散群组");
        }

        groupMemberMapper.delete(new LambdaQueryWrapper<GroupMember>()
                .eq(GroupMember::getGroupId, groupId));

        this.removeById(groupId);
        log.info("解散群组: groupId={}, userId={}", groupId, userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addMember(Long userId, Long groupId, List<Long> userIds) {
        if (!isGroupMember(userId, groupId)) {
            throw new BusinessException("不是群成员");
        }

        for (Long memberId : userIds) {
            if (isGroupMember(memberId, groupId)) {
                continue;
            }

            GroupMember member = new GroupMember();
            member.setGroupId(groupId);
            member.setUserId(memberId);
            member.setRole(0);
            member.setJoinTime(LocalDateTime.now());
            groupMemberMapper.insert(member);
        }

        log.info("添加群成员: groupId={}, userId={}, members={}", groupId, userId, userIds);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeMember(Long userId, Long groupId, Long memberId) {
        ChatGroup group = this.getById(groupId);
        if (group == null) {
            throw new BusinessException("群组不存在");
        }

        if (!group.getOwnerId().equals(userId)) {
            throw new BusinessException("只有群主可以移除成员");
        }

        if (group.getOwnerId().equals(memberId)) {
            throw new BusinessException("不能移除群主");
        }

        groupMemberMapper.delete(new LambdaQueryWrapper<GroupMember>()
                .eq(GroupMember::getGroupId, groupId)
                .eq(GroupMember::getUserId, memberId));

        log.info("移除群成员: groupId={}, userId={}, memberId={}", groupId, userId, memberId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void quitGroup(Long userId, Long groupId) {
        ChatGroup group = this.getById(groupId);
        if (group == null) {
            throw new BusinessException("群组不存在");
        }

        if (group.getOwnerId().equals(userId)) {
            throw new BusinessException("群主不能退出群组，请先解散或转让群组");
        }

        groupMemberMapper.delete(new LambdaQueryWrapper<GroupMember>()
                .eq(GroupMember::getGroupId, groupId)
                .eq(GroupMember::getUserId, userId));

        log.info("退出群组: groupId={}, userId={}", groupId, userId);
    }

    @Override
    public GroupVO getGroupInfo(Long groupId) {
        ChatGroup group = this.getById(groupId);
        if (group == null) {
            throw new BusinessException("群组不存在");
        }

        GroupVO vo = new GroupVO();
        BeanUtils.copyProperties(group, vo);

        User owner = userService.getById(group.getOwnerId());
        if (owner != null) {
            UserVO ownerVO = new UserVO();
            BeanUtils.copyProperties(owner, ownerVO);
            ownerVO.setOnline(userService.isOnline(owner.getId()));
            vo.setOwnerInfo(ownerVO);
        }

        Long memberCount = groupMemberMapper.selectCount(new LambdaQueryWrapper<GroupMember>()
                .eq(GroupMember::getGroupId, groupId));
        vo.setMemberCount(memberCount.intValue());

        return vo;
    }

    @Override
    public List<GroupVO> getMyGroups(Long userId) {
        List<GroupMember> members = groupMemberMapper.selectList(new LambdaQueryWrapper<GroupMember>()
                .eq(GroupMember::getUserId, userId));

        if (members.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> groupIds = members.stream()
                .map(GroupMember::getGroupId)
                .collect(Collectors.toSet());

        List<ChatGroup> groups = this.listByIds(groupIds);
        Map<Long, ChatGroup> groupMap = groups.stream()
                .collect(Collectors.toMap(ChatGroup::getId, g -> g));

        List<Long> allMemberGroupIds = new ArrayList<>(groupIds);
        List<GroupMember> allMembers = groupMemberMapper.selectList(new LambdaQueryWrapper<GroupMember>()
                .in(GroupMember::getGroupId, allMemberGroupIds));

        Map<Long, Long> groupMemberCountMap = allMembers.stream()
                .collect(Collectors.groupingBy(GroupMember::getGroupId, Collectors.counting()));

        return groups.stream()
                .map(group -> {
                    GroupVO vo = new GroupVO();
                    BeanUtils.copyProperties(group, vo);
                    vo.setMemberCount(groupMemberCountMap.getOrDefault(group.getId(), 0L).intValue());
                    return vo;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<GroupMemberVO> getGroupMembers(Long groupId) {
        List<GroupMember> members = groupMemberMapper.selectList(new LambdaQueryWrapper<GroupMember>()
                .eq(GroupMember::getGroupId, groupId)
                .orderByAsc(GroupMember::getJoinTime));

        if (members.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> userIds = members.stream()
                .map(GroupMember::getUserId)
                .collect(Collectors.toSet());

        List<User> users = userService.listByIds(userIds);
        Map<Long, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return members.stream()
                .map(member -> {
                    GroupMemberVO vo = new GroupMemberVO();
                    BeanUtils.copyProperties(member, vo);

                    User user = userMap.get(member.getUserId());
                    if (user != null) {
                        UserVO userVO = new UserVO();
                        BeanUtils.copyProperties(user, userVO);
                        userVO.setOnline(userService.isOnline(user.getId()));
                        vo.setUserInfo(userVO);
                    }
                    return vo;
                })
                .collect(Collectors.toList());
    }

    @Override
    public boolean isGroupMember(Long userId, Long groupId) {
        Long count = groupMemberMapper.selectCount(new LambdaQueryWrapper<GroupMember>()
                .eq(GroupMember::getGroupId, groupId)
                .eq(GroupMember::getUserId, userId));
        return count > 0;
    }

    @Override
    public boolean isGroupOwner(Long userId, Long groupId) {
        ChatGroup group = this.getById(groupId);
        return group != null && group.getOwnerId().equals(userId);
    }
}
