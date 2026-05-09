package com.collab.whiteboard.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage {
    private MessageType type;
    private String roomId;
    private String userId;
    private String userName;
    private Object payload;
    private Long timestamp;
}
