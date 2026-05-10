package com.monitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "servers")
public class Server {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(name = "ip_address", nullable = false, unique = true, length = 50)
    private String ipAddress;
    
    @Column(length = 100)
    private String hostname;
    
    @Column(name = "os_type", length = 50)
    private String osType;
    
    @Column(name = "os_version", length = 100)
    private String osVersion;
    
    @Column(name = "cpu_cores")
    private Integer cpuCores;
    
    @Column(name = "total_memory_gb", precision = 10, scale = 2)
    private BigDecimal totalMemoryGb;
    
    @Column(name = "total_disk_gb", precision = 10, scale = 2)
    private BigDecimal totalDiskGb;
    
    @Column(nullable = false, length = 20)
    private String status = "OFFLINE";
    
    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;
    
    @Column(length = 500)
    private String description;
    
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
