package com.example.apigatewaymanager.common;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ResultCode {
    SUCCESS(200, "操作成功"),
    
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未授权访问"),
    FORBIDDEN(403, "无权限访问"),
    NOT_FOUND(404, "资源不存在"),
    
    INTERNAL_SERVER_ERROR(500, "服务器内部错误"),
    
    USERNAME_EXISTS(1001, "用户名已存在"),
    EMAIL_EXISTS(1002, "邮箱已被注册"),
    USER_NOT_FOUND(1003, "用户不存在"),
    PASSWORD_ERROR(1004, "密码错误"),
    USER_DISABLED(1005, "用户已被禁用"),
    
    APP_NOT_FOUND(2001, "应用不存在"),
    APP_NOT_OWNER(2002, "无权限操作该应用"),
    
    API_KEY_NOT_FOUND(3001, "API密钥不存在"),
    API_KEY_DISABLED(3002, "API密钥已被禁用"),
    
    BLACKLISTED(4001, "IP或密钥已被拉黑"),
    RATE_LIMIT_EXCEEDED(4002, "请求次数超限"),
    
    TOKEN_INVALID(5001, "Token无效"),
    TOKEN_EXPIRED(5002, "Token已过期");

    private final Integer code;
    private final String message;
}
