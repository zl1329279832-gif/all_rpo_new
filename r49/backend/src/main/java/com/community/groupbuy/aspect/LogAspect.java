package com.community.groupbuy.aspect;

import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;

@Slf4j
@Aspect
@Component
public class LogAspect {

    @Pointcut("execution(* com.community.groupbuy.controller..*.*(..))")
    public void logPointCut() {
    }

    @Around("logPointCut()")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        long startTime = System.currentTimeMillis();

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();

        String className = point.getTarget().getClass().getName();
        String methodName = method.getName();
        String requestUri = request != null ? request.getRequestURI() : "";
        String requestMethod = request != null ? request.getMethod() : "";
        String remoteAddr = request != null ? request.getRemoteAddr() : "";
        Object[] args = point.getArgs();

        log.info("请求开始：URI={}, Method={}, IP={}, Class={}, MethodName={}",
                requestUri, requestMethod, remoteAddr, className, methodName);

        try {
            if (args != null && args.length > 0) {
                log.info("请求参数：{}", JSON.toJSONString(args));
            }
        } catch (Exception e) {
            log.warn("请求参数序列化失败：{}", e.getMessage());
        }

        Object result = point.proceed();

        long endTime = System.currentTimeMillis();
        long duration = endTime - startTime;

        try {
            if (result != null) {
                log.info("请求响应：{}", JSON.toJSONString(result));
            }
        } catch (Exception e) {
            log.warn("响应参数序列化失败：{}", e.getMessage());
        }

        log.info("请求结束：URI={}, 耗时={}ms", requestUri, duration);

        return result;
    }
}
