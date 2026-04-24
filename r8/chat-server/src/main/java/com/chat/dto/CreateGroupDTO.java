package com.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateGroupDTO {

    @NotBlank(message = "群组名称不能为空")
    @Size(max = 50, message = "群组名称长度不能超过 50 个字符")
    private String groupName;

    @Size(max = 500, message = "群公告长度不能超过 500 个字符")
    private String groupNotice;

    private List<Long> memberIds;
}
