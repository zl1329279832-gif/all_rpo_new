package com.example.componentconfig.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "operation_log", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_module", columnList = "module"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
public class OperationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(name = "username", length = 50)
    private String username;

    @Column(name = "action", length = 50)
    private String action;

    @Column(name = "module", length = 50)
    private String module;

    @Column(name = "detail", length = 500)
    private String detail;

    @Column(name = "ip", length = 50)
    private String ip;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
