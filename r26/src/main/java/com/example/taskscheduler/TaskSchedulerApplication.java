package com.example.taskscheduler;

import cn.hutool.cron.CronUtil;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.example.taskscheduler.mapper")
public class TaskSchedulerApplication {

    public static void main(String[] args) {
        CronUtil.setMatchSecond(true);
        SpringApplication.run(TaskSchedulerApplication.class, args);
        CronUtil.start();
    }
}