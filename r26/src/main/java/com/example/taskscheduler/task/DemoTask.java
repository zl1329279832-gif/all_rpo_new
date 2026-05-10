package com.example.taskscheduler.task;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class DemoTask {

    public String execute(String params) {
        log.info("DemoTask 执行开始, params={}", params);
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        String result = "DemoTask 执行成功, params=" + params;
        log.info("DemoTask 执行结束, result={}", result);
        return result;
    }
}