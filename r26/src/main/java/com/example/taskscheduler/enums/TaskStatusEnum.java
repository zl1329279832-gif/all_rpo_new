package com.example.taskscheduler.enums;

import lombok.Getter;

@Getter
public enum TaskStatusEnum {
    STOPPED(0, "停止"),
    RUNNING(1, "运行中"),
    PAUSED(2, "暂停");

    private final Integer code;
    private final String desc;

    TaskStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static TaskStatusEnum getByCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (TaskStatusEnum value : values()) {
            if (value.getCode().equals(code)) {
                return value;
            }
        }
        return null;
    }
}