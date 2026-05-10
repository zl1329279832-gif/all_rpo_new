package com.example.taskscheduler.common;

import lombok.Getter;

@Getter
public enum ResultCode {
    SUCCESS(200, "操作成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未授权"),
    FORBIDDEN(403, "禁止访问"),
    NOT_FOUND(404, "资源不存在"),
    INTERNAL_SERVER_ERROR(500, "服务器内部错误"),
    
    TASK_NOT_FOUND(1001, "任务不存在"),
    TASK_ALREADY_EXISTS(1002, "任务已存在"),
    TASK_ALREADY_RUNNING(1003, "任务已在运行中"),
    TASK_ALREADY_STOPPED(1004, "任务已停止"),
    INVALID_CRON_EXPRESSION(1005, "无效的Cron表达式"),
    TASK_EXECUTE_FAILED(1006, "任务执行失败"),
    TASK_INVALID_STATUS(1007, "任务状态无效");

    private final Integer code;
    private final String message;

    ResultCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}