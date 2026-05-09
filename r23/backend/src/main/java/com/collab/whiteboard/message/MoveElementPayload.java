package com.collab.whiteboard.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoveElementPayload {
    private String elementId;
    private Double deltaX;
    private Double deltaY;
    private Double newX;
    private Double newY;
}
