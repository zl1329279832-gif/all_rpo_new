package com.collaborative.whiteboard.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "operation_logs")
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

    @Lob
    @Column(name = "operation_data", columnDefinition = "TEXT")
    private String operationData;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
