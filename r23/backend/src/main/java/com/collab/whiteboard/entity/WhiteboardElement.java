package com.collab.whiteboard.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "whiteboard_elements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhiteboardElement {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "room_id", nullable = false, length = 50)
    private String roomId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ElementType type;

    @Column(columnDefinition = "TEXT")
    private String data;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    public enum ElementType {
        LINE,
        STICKER,
        SHAPE
    }
}
