package com.example.componentconfig.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "request_history", indexes = {
    @Index(name = "idx_component_id", columnList = "component_id"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
public class RequestHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "component_id")
    private String componentId;

    @Column(name = "component_name", length = 100)
    private String componentName;

    @Column(name = "url", nullable = false, length = 1000)
    private String url;

    @Column(name = "method", nullable = false, length = 10)
    private String method;

    @Column(name = "headers", columnDefinition = "TEXT")
    private String headers;

    @Column(name = "params", columnDefinition = "TEXT")
    private String params;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "response_status")
    private Integer responseStatus;

    @Column(name = "response_data", columnDefinition = "TEXT")
    private String responseData;

    @Column(name = "response_headers", columnDefinition = "TEXT")
    private String responseHeaders;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "duration")
    private Long duration;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
