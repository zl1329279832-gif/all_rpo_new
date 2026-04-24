package com.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CreateGroupDTO {

    @NotBlank(message = "群组名称不能为空")
    @Size(max = 50, message = "群组名称长度不能超过 50 个字符")
    private String groupName;

    @Size(max = 500, message = "群公告长度不能超过 500 个字符")
    private String groupNotice;

    private List<Long> memberIds;

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getGroupNotice() {
        return groupNotice;
    }

    public void setGroupNotice(String groupNotice) {
        this.groupNotice = groupNotice;
    }

    public List<Long> getMemberIds() {
        return memberIds;
    }

    public void setMemberIds(List<Long> memberIds) {
        this.memberIds = memberIds;
    }
}
