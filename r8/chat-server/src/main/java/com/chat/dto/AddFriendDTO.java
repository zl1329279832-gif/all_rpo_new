package com.chat.dto;

import jakarta.validation.constraints.NotNull;

public class AddFriendDTO {

    @NotNull(message = "好友ID不能为空")
    private Long friendId;

    private String remark;

    public Long getFriendId() {
        return friendId;
    }

    public void setFriendId(Long friendId) {
        this.friendId = friendId;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
