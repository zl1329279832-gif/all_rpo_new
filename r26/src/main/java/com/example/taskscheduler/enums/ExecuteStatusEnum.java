package com.example.taskscheduler.enums;

import lombok.Getter;

@Getter
public enum ExecuteStatusEnum {
    RUNNING("RUNNING", "执行中"),
    SUCCESS("SUCCESS", "成功"),
    FAILURE("FAILURE", "失败");

    private final String code;
    private final String desc;

    ExecuteStatusEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}