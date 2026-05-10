package com.monitor.service;

import com.monitor.entity.Alert;
import com.monitor.entity.AlertRule;
import com.monitor.repository.AlertRepository;
import com.monitor.repository.AlertRuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AlertService {
    
    private final AlertRepository alertRepository;
    private final AlertRuleRepository alertRuleRepository;
    
    public AlertService(AlertRepository alertRepository, AlertRuleRepository alertRuleRepository) {
        this.alertRepository = alertRepository;
        this.alertRuleRepository = alertRuleRepository;
    }
    
    public List<Alert> getAllAlerts() {
        return alertRepository.findByStatusOrderByOccurredAtDesc("ACTIVE");
    }
    
    public List<Alert> getAlertsByServerId(Long serverId) {
        return alertRepository.findByServerIdOrderByOccurredAtDesc(serverId);
    }
    
    public List<Alert> getAlertsByStatus(String status) {
        return alertRepository.findByStatusOrderByOccurredAtDesc(status);
    }
    
    public List<Alert> getAlertsByLevel(Integer alertLevel) {
        return alertRepository.findByAlertLevelOrderByOccurredAtDesc(alertLevel);
    }
    
    public List<Alert> getAlertsSince(LocalDateTime startTime) {
        return alertRepository.findByOccurredAtAfter(startTime);
    }
    
    public Optional<Alert> getAlertById(Long id) {
        return alertRepository.findById(id);
    }
    
    public Map<String, Long> getAlertStatistics() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalActive", alertRepository.countActiveAlerts());
        stats.put("critical", alertRepository.countActiveAlertsByLevel(4));
        stats.put("error", alertRepository.countActiveAlertsByLevel(3));
        stats.put("warning", alertRepository.countActiveAlertsByLevel(2));
        stats.put("info", alertRepository.countActiveAlertsByLevel(1));
        return stats;
    }
    
    @Transactional
    public Alert acknowledgeAlert(Long id, Long userId) {
        return alertRepository.findById(id).map(alert -> {
            alert.setStatus("ACKNOWLEDGED");
            alert.setAcknowledgedBy(userId);
            alert.setAcknowledgedAt(LocalDateTime.now());
            return alertRepository.save(alert);
        }).orElseThrow(() -> new RuntimeException("告警不存在"));
    }
    
    @Transactional
    public Alert resolveAlert(Long id) {
        return alertRepository.findById(id).map(alert -> {
            alert.setStatus("RESOLVED");
            alert.setResolvedAt(LocalDateTime.now());
            return alertRepository.save(alert);
        }).orElseThrow(() -> new RuntimeException("告警不存在"));
    }
    
    @Transactional
    public Alert updateAlertLevel(Long id, Integer newLevel) {
        return alertRepository.findById(id).map(alert -> {
            alert.setAlertLevel(newLevel);
            return alertRepository.save(alert);
        }).orElseThrow(() -> new RuntimeException("告警不存在"));
    }
    
    public List<AlertRule> getAllRules() {
        return alertRuleRepository.findAll();
    }
    
    public Optional<AlertRule> getRuleById(Long id) {
        return alertRuleRepository.findById(id);
    }
    
    @Transactional
    public AlertRule createRule(AlertRule rule) {
        return alertRuleRepository.save(rule);
    }
    
    @Transactional
    public AlertRule updateRule(Long id, AlertRule ruleDetails) {
        return alertRuleRepository.findById(id).map(rule -> {
            if (ruleDetails.getName() != null) {
                rule.setName(ruleDetails.getName());
            }
            if (ruleDetails.getMetricType() != null) {
                rule.setMetricType(ruleDetails.getMetricType());
            }
            if (ruleDetails.getOperator() != null) {
                rule.setOperator(ruleDetails.getOperator());
            }
            if (ruleDetails.getThreshold() != null) {
                rule.setThreshold(ruleDetails.getThreshold());
            }
            if (ruleDetails.getAlertLevel() != null) {
                rule.setAlertLevel(ruleDetails.getAlertLevel());
            }
            if (ruleDetails.getDescription() != null) {
                rule.setDescription(ruleDetails.getDescription());
            }
            if (ruleDetails.getEnabled() != null) {
                rule.setEnabled(ruleDetails.getEnabled());
            }
            if (ruleDetails.getSilenced() != null) {
                rule.setSilenced(ruleDetails.getSilenced());
            }
            if (ruleDetails.getServerId() != null) {
                rule.setServerId(ruleDetails.getServerId());
            }
            
            return alertRuleRepository.save(rule);
        }).orElseThrow(() -> new RuntimeException("告警规则不存在"));
    }
    
    @Transactional
    public void deleteRule(Long id) {
        alertRuleRepository.deleteById(id);
    }
}
