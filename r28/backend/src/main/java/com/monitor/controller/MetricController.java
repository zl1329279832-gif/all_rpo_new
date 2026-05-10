package com.monitor.controller;

import com.monitor.dto.ApiResponse;
import com.monitor.dto.MetricReport;
import com.monitor.entity.Metric;
import com.monitor.service.MetricService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class MetricController {
    
    private final MetricService metricService;
    
    public MetricController(MetricService metricService) {
        this.metricService = metricService;
    }
    
    @PostMapping("/report")
    public ResponseEntity<ApiResponse<Metric>> reportMetric(@RequestBody MetricReport report) {
        try {
            if (report.getIpAddress() == null || report.getIpAddress().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("IP地址不能为空"));
            }
            Metric metric = metricService.reportMetric(report);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("指标上报成功", metric));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("指标上报失败: " + e.getMessage()));
        }
    }
    
    @GetMapping("/server/{serverId}")
    public ApiResponse<List<Metric>> getMetricsByServerId(@PathVariable Long serverId) {
        return ApiResponse.success(metricService.getMetricsByServerId(serverId));
    }
    
    @GetMapping("/server/{serverId}/range")
    public ApiResponse<List<Metric>> getMetricsByServerIdAndRange(
            @PathVariable Long serverId,
            @RequestParam(name = "hours", defaultValue = "24") Integer hours) {
        LocalDateTime startTime = LocalDateTime.now().minusHours(hours);
        return ApiResponse.success(metricService.getMetricsByServerIdAndTimeRange(serverId, startTime));
    }
    
    @GetMapping("/server/{serverId}/latest")
    public ResponseEntity<ApiResponse<Metric>> getLatestMetric(@PathVariable Long serverId) {
        Optional<Metric> metric = metricService.getLatestMetric(serverId);
        return metric.map(value -> ResponseEntity.ok(ApiResponse.success(value)))
                     .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                             .body(ApiResponse.error("暂无监控数据")));
    }
}
