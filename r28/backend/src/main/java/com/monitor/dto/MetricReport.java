package com.monitor.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class MetricReport {
    private String ipAddress;
    private String hostname;
    private String osType;
    private String osVersion;
    private Integer cpuCores;
    private BigDecimal totalMemoryGb;
    private BigDecimal totalDiskGb;
    private BigDecimal cpuUsage;
    private BigDecimal memoryUsage;
    private BigDecimal memoryUsedGb;
    private BigDecimal diskUsage;
    private BigDecimal diskUsedGb;
    private BigDecimal networkInMbps;
    private BigDecimal networkOutMbps;
    private LocalDateTime timestamp;
}
