package com.monitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alerts")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "rule_id", nullable = false)
    private Long ruleId;
    
    @Column(name = "server_id", nullable = false)
    private Long serverId;
    
    @Column(name = "metric_type", nullable = false, length = 50)
    private String metricType;
    
    @Column(name = "current_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentValue;
    
    @Column(name = "threshold_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal thresholdValue;
    
    @Column(name = "alert_level", nullable = false)
    private Integer alertLevel;
    
    @Column(nullable = false, length = 1000)
    private String message;
    
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";
    
    @Column(name = "acknowledged_by")
    private Long acknowledgedBy;
    
    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
