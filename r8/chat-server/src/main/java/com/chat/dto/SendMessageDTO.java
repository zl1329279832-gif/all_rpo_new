package com.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageDTO {

    @NotNull(message = "聊天类型不能为空")
    private Integer chatType;

    private Long toUserId;

    private Long groupId;

    @NotNull(message = "消息类型不能为空")
    private Integer messageType;

    @NotBlank(message = "消息内容不能为空")
    private String content;
}
