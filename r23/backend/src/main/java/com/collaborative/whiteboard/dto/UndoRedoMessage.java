package com.collaborative.whiteboard.dto;

import lombok.Data;

@Data
public class UndoRedoMessage {

    private String roomId;
    private String userId;
    private String operationId;
    private String operationType;
    private String elementId;
    private Object elementData;
    private Boolean isUndo;
}
