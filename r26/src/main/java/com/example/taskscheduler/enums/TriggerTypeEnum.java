package com.example.taskscheduler.enums;

import lombok.Getter;

@Getter
public enum TriggerTypeEnum {
    SCHEDULED("SCHEDULED", "定时触发"),
    MANUAL("MANUAL", "手动触发"),
    RETRY("RETRY", "重试触发");

    private final String code;
    private final String desc;

    TriggerTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}