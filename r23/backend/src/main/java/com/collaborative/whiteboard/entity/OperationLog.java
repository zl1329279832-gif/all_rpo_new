package com.collaborative.whiteboard.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "operation_logs", indexes = {
    @Index(name = "idx_room_user", columnList = "room_id, user_id")
})
public class OperationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false, length = 50)
    private String roomId;

    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(name = "operation_type", nullable = false, length = 20)
    private String operationType;

    @Column(name = "element_id", length = 50)
    private String elementId;

    @Column(name = "element_type", length = 20)
    private String elementType;

    @Lob
    @Column(name = "before_data", columnDefinition = "TEXT")
    private String beforeData;

    @Lob
    @Column(name = "after_data", columnDefinition = "TEXT")
    private String afterData;

    @Lob
    @Column(name = "operation_data", columnDefinition = "TEXT")
    private String operationData;

    @Column(name = "sequence", nullable = false)
    private Long sequence = 0L;

    @Column(name = "is_undone", nullable = false)
    private Boolean isUndone = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
