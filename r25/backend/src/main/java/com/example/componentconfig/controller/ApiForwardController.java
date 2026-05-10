package com.example.componentconfig.controller;

import com.example.componentconfig.common.Result;
import com.example.componentconfig.service.ApiForwardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "API转发", description = "接口请求转发接口")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin
public class ApiForwardController {

    private final ApiForwardService apiForwardService;

    @Operation(summary = "转发API请求")
    @PostMapping("/forward")
    public Result<ApiForwardService.ForwardResult> forward(@RequestBody ForwardRequest request) {
        ApiForwardService.ForwardResult result = apiForwardService.forward(
                request.getUrl(),
                request.getMethod(),
                request.getHeaders(),
                request.getParams(),
                request.getBody(),
                request.getComponentId(),
                request.getComponentName()
        );
        return Result.success(result);
    }

    @Data
    public static class ForwardRequest {
        private String url;
        private String method;
        private Map<String, String> headers;
        private Map<String, Object> params;
        private Object body;
        private String componentId;
        private String componentName;
    }
}
