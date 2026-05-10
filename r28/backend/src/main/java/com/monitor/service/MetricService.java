package com.monitor.service;

import com.monitor.dto.MetricReport;
import com.monitor.entity.Alert;
import com.monitor.entity.AlertRule;
import com.monitor.entity.Metric;
import com.monitor.entity.Server;
import com.monitor.repository.AlertRepository;
import com.monitor.repository.AlertRuleRepository;
import com.monitor.repository.MetricRepository;
import com.monitor.repository.ServerRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class MetricService {
    
    private final MetricRepository metricRepository;
    private final ServerRepository serverRepository;
    private final AlertRuleRepository alertRuleRepository;
    private final AlertRepository alertRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final String LATEST_METRIC_KEY = "metric:latest:";
    private static final long CACHE_EXPIRE_SECONDS = 300;
    
    public MetricService(MetricRepository metricRepository,
                         ServerRepository serverRepository,
                         AlertRuleRepository alertRuleRepository,
                         AlertRepository alertRepository,
                         RedisTemplate<String, Object> redisTemplate) {
        this.metricRepository = metricRepository;
        this.serverRepository = serverRepository;
        this.alertRuleRepository = alertRuleRepository;
        this.alertRepository = alertRepository;
        this.redisTemplate = redisTemplate;
    }
    
    public List<Metric> getMetricsByServerId(Long serverId) {
        return metricRepository.findTop100ByServerIdOrderByTimestampDesc(serverId);
    }
    
    public List<Metric> getMetricsByServerIdAndTimeRange(Long serverId, LocalDateTime startTime) {
        return metricRepository.findByServerIdAndTimestampAfterOrderByTimestampAsc(serverId, startTime);
    }
    
    public Optional<Metric> getLatestMetric(Long serverId) {
        String cacheKey = LATEST_METRIC_KEY + serverId;
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached instanceof Metric) {
                return Optional.of((Metric) cached);
            }
        } catch (Exception ignored) {
        }
        
        Optional<Metric> metric = metricRepository.findLatestByServerId(serverId);
        metric.ifPresent(m -> {
            try {
                redisTemplate.opsForValue().set(cacheKey, m, CACHE_EXPIRE_SECONDS, TimeUnit.SECONDS);
            } catch (Exception ignored) {
            }
        });
        
        return metric;
    }
    
    @Transactional
    public Metric reportMetric(MetricReport report) {
        Server server = getOrCreateServer(report);
        server.setLastHeartbeat(LocalDateTime.now());
        server.setStatus("ONLINE");
        serverRepository.save(server);
        
        Metric metric = new Metric();
        metric.setServerId(server.getId());
        metric.setCpuUsage(report.getCpuUsage());
        metric.setMemoryUsage(report.getMemoryUsage());
        metric.setMemoryUsedGb(report.getMemoryUsedGb());
        metric.setDiskUsage(report.getDiskUsage());
        metric.setDiskUsedGb(report.getDiskUsedGb());
        metric.setNetworkInMbps(report.getNetworkInMbps());
        metric.setNetworkOutMbps(report.getNetworkOutMbps());
        metric.setTimestamp(report.getTimestamp() != null ? report.getTimestamp() : LocalDateTime.now());
        
        Metric savedMetric = metricRepository.save(metric);
        
        checkAndCreateAlerts(server, savedMetric);
        
        String cacheKey = LATEST_METRIC_KEY + server.getId();
        try {
            redisTemplate.opsForValue().set(cacheKey, savedMetric, CACHE_EXPIRE_SECONDS, TimeUnit.SECONDS);
        } catch (Exception ignored) {
        }
        
        return savedMetric;
    }
    
    private Server getOrCreateServer(MetricReport report) {
        Optional<Server> serverOptional = serverRepository.findByIpAddress(report.getIpAddress());
        
        if (serverOptional.isPresent()) {
            Server server = serverOptional.get();
            if (report.getHostname() != null) server.setHostname(report.getHostname());
            if (report.getOsType() != null) server.setOsType(report.getOsType());
            if (report.getOsVersion() != null) server.setOsVersion(report.getOsVersion());
            if (report.getCpuCores() != null) server.setCpuCores(report.getCpuCores());
            if (report.getTotalMemoryGb() != null) server.setTotalMemoryGb(report.getTotalMemoryGb());
            if (report.getTotalDiskGb() != null) server.setTotalDiskGb(report.getTotalDiskGb());
            return serverRepository.save(server);
        }
        
        Server newServer = new Server();
        newServer.setName(report.getHostname() != null ? report.getHostname() : report.getIpAddress());
        newServer.setIpAddress(report.getIpAddress());
        newServer.setHostname(report.getHostname());
        newServer.setOsType(report.getOsType());
        newServer.setOsVersion(report.getOsVersion());
        newServer.setCpuCores(report.getCpuCores());
        newServer.setTotalMemoryGb(report.getTotalMemoryGb());
        newServer.setTotalDiskGb(report.getTotalDiskGb());
        newServer.setStatus("ONLINE");
        
        return serverRepository.save(newServer);
    }
    
    private void checkAndCreateAlerts(Server server, Metric metric) {
        List<AlertRule> globalRules = alertRuleRepository.findByServerIdIsNullAndEnabledTrueAndSilencedFalse();
        List<AlertRule> serverRules = alertRuleRepository.findByServerIdAndEnabledTrueAndSilencedFalse(server.getId());
        
        List<AlertRule> allRules = new ArrayList<>();
        allRules.addAll(globalRules);
        allRules.addAll(serverRules);
        
        for (AlertRule rule : allRules) {
            checkRuleAndCreateAlert(server, metric, rule);
        }
    }
    
    private void checkRuleAndCreateAlert(Server server, Metric metric, AlertRule rule) {
        BigDecimal currentValue = getMetricValueByType(metric, rule.getMetricType());
        if (currentValue == null) return;
        
        boolean triggered = evaluateCondition(currentValue, rule.getThreshold(), rule.getOperator());
        
        if (triggered) {
            Alert alert = new Alert();
            alert.setRuleId(rule.getId());
            alert.setServerId(server.getId());
            alert.setMetricType(rule.getMetricType());
            alert.setCurrentValue(currentValue);
            alert.setThresholdValue(rule.getThreshold());
            alert.setAlertLevel(rule.getAlertLevel());
            alert.setMessage(String.format("服务器[%s] %s 当前值: %.2f, 阈值: %.2f, 触发条件: %s",
                    server.getName(),
                    getMetricTypeName(rule.getMetricType()),
                    currentValue,
                    rule.getThreshold(),
                    rule.getOperator()));
            alert.setStatus("ACTIVE");
            alert.setOccurredAt(LocalDateTime.now());
            
            alertRepository.save(alert);
            
            updateServerStatusByAlertLevel(server, rule.getAlertLevel());
        }
    }
    
    private BigDecimal getMetricValueByType(Metric metric, String metricType) {
        return switch (metricType) {
            case "CPU" -> metric.getCpuUsage();
            case "MEMORY" -> metric.getMemoryUsage();
            case "DISK" -> metric.getDiskUsage();
            case "NETWORK" -> metric.getNetworkInMbps() != null ? 
                    metric.getNetworkInMbps().add(metric.getNetworkOutMbps() != null ? metric.getNetworkOutMbps() : BigDecimal.ZERO) : null;
            default -> null;
        };
    }
    
    private String getMetricTypeName(String metricType) {
        return switch (metricType) {
            case "CPU" -> "CPU使用率";
            case "MEMORY" -> "内存使用率";
            case "DISK" -> "磁盘使用率";
            case "NETWORK" -> "网络带宽";
            default -> metricType;
        };
    }
    
    private boolean evaluateCondition(BigDecimal current, BigDecimal threshold, String operator) {
        int compare = current.compareTo(threshold);
        return switch (operator) {
            case ">" -> compare > 0;
            case ">=" -> compare >= 0;
            case "<" -> compare < 0;
            case "<=" -> compare <= 0;
            case "==" -> compare == 0;
            case "!=" -> compare != 0;
            default -> false;
        };
    }
    
    private void updateServerStatusByAlertLevel(Server server, Integer alertLevel) {
        String newStatus = switch (alertLevel) {
            case 4 -> "CRITICAL";
            case 3 -> "ERROR";
            case 2 -> "WARNING";
            default -> null;
        };
        
        if (newStatus != null && !newStatus.equals(server.getStatus())) {
            server.setStatus(newStatus);
            serverRepository.save(server);
        }
    }
}
