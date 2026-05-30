package com.community.groupbuy.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledTask {

    private final SettlementTask settlementTask;

    @Scheduled(cron = "0 0 1 * * ?")
    public void settleCommissionDaily() {
        try {
            log.info("每日凌晨1点佣金结算任务开始执行");
            settlementTask.settleCommission();
            log.info("每日凌晨1点佣金结算任务执行完成");
        } catch (Exception e) {
            log.error("每日凌晨1点佣金结算任务执行失败", e);
        }
    }
}
