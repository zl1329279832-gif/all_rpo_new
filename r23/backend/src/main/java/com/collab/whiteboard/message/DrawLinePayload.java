package com.collab.whiteboard.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DrawLinePayload {
    private String elementId;
    private List<Point> points;
    private String color;
    private Integer lineWidth;
    private String lineCap;
    private String lineJoin;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Point {
        private Double x;
        private Double y;
    }
}
