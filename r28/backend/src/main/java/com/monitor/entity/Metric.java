package com.monitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "metrics")
public class Metric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "server_id", nullable = false)
    private Long serverId;
    
    @Column(name = "cpu_usage", precision = 5, scale = 2)
    private BigDecimal cpuUsage;
    
    @Column(name = "memory_usage", precision = 5, scale = 2)
    private BigDecimal memoryUsage;
    
    @Column(name = "memory_used_gb", precision = 10, scale = 2)
    private BigDecimal memoryUsedGb;
    
    @Column(name = "disk_usage", precision = 5, scale = 2)
    private BigDecimal diskUsage;
    
    @Column(name = "disk_used_gb", precision = 10, scale = 2)
    private BigDecimal diskUsedGb;
    
    @Column(name = "network_in_mbps", precision = 10, scale = 2)
    private BigDecimal networkInMbps;
    
    @Column(name = "network_out_mbps", precision = 10, scale = 2)
    private BigDecimal networkOutMbps;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
