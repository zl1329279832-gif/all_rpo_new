package com.collaborative.whiteboard.dto;

import lombok.Data;

@Data
public class WhiteboardMessage {

    private String type;
    private String roomId;
    private String userId;
    private String elementId;
    private Object payload;
    private Long timestamp;

    public WhiteboardMessage() {
        this.timestamp = System.currentTimeMillis();
    }
}
