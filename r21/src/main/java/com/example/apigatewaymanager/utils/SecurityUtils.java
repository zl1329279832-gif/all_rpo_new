package com.example.apigatewaymanager.utils;

import com.example.apigatewaymanager.exception.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new BusinessException(401, "未授权访问");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        try {
            return Long.valueOf(principal.toString());
        } catch (NumberFormatException e) {
            throw new BusinessException(401, "用户信息无效");
        }
    }
}
