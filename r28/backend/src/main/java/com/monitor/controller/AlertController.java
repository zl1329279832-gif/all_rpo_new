package com.monitor.controller;

import com.monitor.dto.ApiResponse;
import com.monitor.entity.Alert;
import com.monitor.entity.AlertRule;
import com.monitor.entity.User;
import com.monitor.service.AlertService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AlertController {
    
    private final AlertService alertService;
    
    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }
    
    @GetMapping
    public ApiResponse<List<Alert>> getActiveAlerts() {
        return ApiResponse.success(alertService.getAllAlerts());
    }
    
    @GetMapping("/stats")
    public ApiResponse<Map<String, Long>> getAlertStatistics() {
        return ApiResponse.success(alertService.getAlertStatistics());
    }
    
    @GetMapping("/server/{serverId}")
    public ApiResponse<List<Alert>> getAlertsByServerId(@PathVariable Long serverId) {
        return ApiResponse.success(alertService.getAlertsByServerId(serverId));
    }
    
    @GetMapping("/status/{status}")
    public ApiResponse<List<Alert>> getAlertsByStatus(@PathVariable String status) {
        return ApiResponse.success(alertService.getAlertsByStatus(status.toUpperCase()));
    }
    
    @GetMapping("/level/{level}")
    public ApiResponse<List<Alert>> getAlertsByLevel(@PathVariable Integer level) {
        return ApiResponse.success(alertService.getAlertsByLevel(level));
    }
    
    @GetMapping("/recent")
    public ApiResponse<List<Alert>> getRecentAlerts(
            @RequestParam(name = "hours", defaultValue = "24") Integer hours) {
        LocalDateTime startTime = LocalDateTime.now().minusHours(hours);
        return ApiResponse.success(alertService.getAlertsSince(startTime));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Alert>> getAlertById(@PathVariable Long id) {
        Optional<Alert> alert = alertService.getAlertById(id);
        return alert.map(value -> ResponseEntity.ok(ApiResponse.success(value)))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error("告警不存在")));
    }
    
    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<Alert>> acknowledgeAlert(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        try {
            Long userId = (user != null) ? user.getId() : null;
            Alert alert = alertService.acknowledgeAlert(id, userId);
            return ResponseEntity.ok(ApiResponse.success("告警已确认", alert));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<Alert>> resolveAlert(@PathVariable Long id) {
        try {
            Alert alert = alertService.resolveAlert(id);
            return ResponseEntity.ok(ApiResponse.success("告警已处理", alert));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/level")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<Alert>> updateAlertLevel(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer newLevel = request.get("alertLevel");
            if (newLevel == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("告警级别不能为空"));
            }
            Alert alert = alertService.updateAlertLevel(id, newLevel);
            return ResponseEntity.ok(ApiResponse.success("告警级别已更新", alert));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/rules")
    public ApiResponse<List<AlertRule>> getAllRules() {
        return ApiResponse.success(alertService.getAllRules());
    }
    
    @GetMapping("/rules/{id}")
    public ResponseEntity<ApiResponse<AlertRule>> getRuleById(@PathVariable Long id) {
        Optional<AlertRule> rule = alertService.getRuleById(id);
        return rule.map(value -> ResponseEntity.ok(ApiResponse.success(value)))
                   .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                           .body(ApiResponse.error("规则不存在")));
    }
    
    @PostMapping("/rules")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<AlertRule>> createRule(@RequestBody AlertRule rule) {
        AlertRule created = alertService.createRule(rule);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("规则创建成功", created));
    }
    
    @PutMapping("/rules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<AlertRule>> updateRule(
            @PathVariable Long id,
            @RequestBody AlertRule ruleDetails) {
        try {
            AlertRule updated = alertService.updateRule(id, ruleDetails);
            return ResponseEntity.ok(ApiResponse.success("规则更新成功", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable Long id) {
        alertService.deleteRule(id);
        return ResponseEntity.ok(ApiResponse.success("规则删除成功", null));
    }
}
