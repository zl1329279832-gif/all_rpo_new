package com.chat.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class GroupVO {

    private Long id;

    private String groupName;

    private String groupAvatar;

    private String groupNotice;

    private Long ownerId;

    private UserVO ownerInfo;

    private Integer maxMembers;

    private Integer memberCount;

    private List<GroupMemberVO> members;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
