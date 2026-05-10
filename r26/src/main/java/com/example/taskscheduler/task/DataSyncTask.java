package com.example.taskscheduler.task;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class DataSyncTask {

    public String syncAll(String params) {
        log.info("DataSyncTask 数据同步开始, params={}", params);
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        String result = "数据同步完成, 同步记录数: 1000";
        log.info("DataSyncTask 数据同步结束, result={}", result);
        return result;
    }

    public String syncIncrement(String params) {
        log.info("DataSyncTask 增量同步开始, params={}", params);
        try {
            Thread.sleep(200);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        String result = "增量同步完成, 同步记录数: 100";
        log.info("DataSyncTask 增量同步结束, result={}", result);
        return result;
    }
}