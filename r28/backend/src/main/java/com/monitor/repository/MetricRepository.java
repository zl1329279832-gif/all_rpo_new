package com.monitor.repository;

import com.monitor.entity.Metric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MetricRepository extends JpaRepository<Metric, Long> {
    List<Metric> findByServerIdOrderByTimestampDesc(Long serverId);
    
    @Query("SELECT m FROM Metric m WHERE m.serverId = :serverId AND m.timestamp >= :startTime ORDER BY m.timestamp ASC")
    List<Metric> findByServerIdAndTimestampAfterOrderByTimestampAsc(
            @Param("serverId") Long serverId,
            @Param("startTime") LocalDateTime startTime);
    
    @Query("SELECT m FROM Metric m WHERE m.serverId = :serverId ORDER BY m.timestamp DESC")
    List<Metric> findTop100ByServerIdOrderByTimestampDesc(@Param("serverId") Long serverId);
    
    @Query("SELECT m FROM Metric m WHERE m.serverId = :serverId ORDER BY m.timestamp DESC LIMIT 1")
    Optional<Metric> findLatestByServerId(@Param("serverId") Long serverId);
}
