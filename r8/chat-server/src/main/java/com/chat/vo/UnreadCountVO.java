package com.chat.vo;

import lombok.Data;

@Data
public class UnreadCountVO {

    private Long targetId;

    private Integer chatType;

    private Integer count;
}
