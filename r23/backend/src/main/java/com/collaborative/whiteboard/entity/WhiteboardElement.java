package com.collaborative.whiteboard.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "whiteboard_elements")
public class WhiteboardElement {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "room_id", nullable = false, length = 50)
    private String roomId;

    @Column(nullable = false, length = 20)
    private String type;

    @Lob
    @Column(name = "data", columnDefinition = "TEXT")
    private String data;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
