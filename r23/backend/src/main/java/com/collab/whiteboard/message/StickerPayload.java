package com.collab.whiteboard.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StickerPayload {
    private String elementId;
    private String text;
    private Double x;
    private Double y;
    private Double width;
    private Double height;
    private String backgroundColor;
    private String textColor;
    private Integer fontSize;
}
