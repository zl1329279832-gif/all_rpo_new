package com.monitor.repository;

import com.monitor.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByServerIdOrderByOccurredAtDesc(Long serverId);
    List<Alert> findByStatusOrderByOccurredAtDesc(String status);
    List<Alert> findByAlertLevelOrderByOccurredAtDesc(Integer alertLevel);
    
    @Query("SELECT a FROM Alert a WHERE a.occurredAt >= :startTime ORDER BY a.occurredAt DESC")
    List<Alert> findByOccurredAtAfter(@Param("startTime") LocalDateTime startTime);
    
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.status = 'ACTIVE'")
    long countActiveAlerts();
    
    @Query("SELECT COUNT(a) FROM Alert a WHERE a.status = 'ACTIVE' AND a.alertLevel = :level")
    long countActiveAlertsByLevel(@Param("level") Integer level);
}
