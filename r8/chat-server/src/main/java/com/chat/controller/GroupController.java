package com.chat.controller;

import com.chat.common.Result;
import com.chat.dto.CreateGroupDTO;
import com.chat.service.GroupService;
import com.chat.vo.GroupMemberVO;
import com.chat.vo.GroupVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/group")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping("/create")
    public Result<GroupVO> createGroup(HttpServletRequest request, @Valid @RequestBody CreateGroupDTO dto) {
        Long userId = (Long) request.getAttribute("userId");
        GroupVO vo = groupService.createGroup(userId, dto);
        return Result.success("群组创建成功", vo);
    }

    @DeleteMapping("/dissolve/{groupId}")
    public Result<String> dissolveGroup(HttpServletRequest request, @PathVariable Long groupId) {
        Long userId = (Long) request.getAttribute("userId");
        groupService.dissolveGroup(userId, groupId);
        return Result.success("群组已解散");
    }

    @PostMapping("/add-members")
    public Result<String> addMembers(HttpServletRequest request, 
                                    @RequestParam Long groupId,
                                    @RequestParam List<Long> userIds) {
        Long userId = (Long) request.getAttribute("userId");
        groupService.addMember(userId, groupId, userIds);
        return Result.success("添加成员成功");
    }

    @PostMapping("/remove-member")
    public Result<String> removeMember(HttpServletRequest request,
                                      @RequestParam Long groupId,
                                      @RequestParam Long memberId) {
        Long userId = (Long) request.getAttribute("userId");
        groupService.removeMember(userId, groupId, memberId);
        return Result.success("移除成员成功");
    }

    @PostMapping("/quit/{groupId}")
    public Result<String> quitGroup(HttpServletRequest request, @PathVariable Long groupId) {
        Long userId = (Long) request.getAttribute("userId");
        groupService.quitGroup(userId, groupId);
        return Result.success("已退出群组");
    }

    @GetMapping("/info/{groupId}")
    public Result<GroupVO> getGroupInfo(@PathVariable Long groupId) {
        GroupVO vo = groupService.getGroupInfo(groupId);
        return Result.success(vo);
    }

    @GetMapping("/my")
    public Result<List<GroupVO>> getMyGroups(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<GroupVO> groups = groupService.getMyGroups(userId);
        return Result.success(groups);
    }

    @GetMapping("/members/{groupId}")
    public Result<List<GroupMemberVO>> getGroupMembers(@PathVariable Long groupId) {
        List<GroupMemberVO> members = groupService.getGroupMembers(groupId);
        return Result.success(members);
    }
}
