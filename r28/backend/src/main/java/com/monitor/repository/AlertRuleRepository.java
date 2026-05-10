package com.monitor.repository;

import com.monitor.entity.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, Long> {
    List<AlertRule> findByEnabledTrueAndSilencedFalse();
    List<AlertRule> findByServerIdAndEnabledTrueAndSilencedFalse(Long serverId);
    List<AlertRule> findByServerIdIsNullAndEnabledTrueAndSilencedFalse();
}
