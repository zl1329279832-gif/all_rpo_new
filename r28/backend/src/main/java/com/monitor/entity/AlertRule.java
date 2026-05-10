package com.monitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alert_rules")
public class AlertRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(name = "server_id")
    private Long serverId;
    
    @Column(name = "metric_type", nullable = false, length = 50)
    private String metricType;
    
    @Column(nullable = false, length = 10)
    private String operator;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal threshold;
    
    @Column(name = "alert_level", nullable = false)
    private Integer alertLevel = 2;
    
    @Column(length = 500)
    private String description;
    
    @Column(nullable = false)
    private Boolean enabled = true;
    
    @Column(nullable = false)
    private Boolean silenced = false;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
