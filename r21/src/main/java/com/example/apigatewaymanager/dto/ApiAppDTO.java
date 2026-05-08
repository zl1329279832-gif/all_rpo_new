package com.example.apigatewaymanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ApiAppDTO {
    @NotBlank(message = "应用名称不能为空")
    @Size(max = 100, message = "应用名称长度不能超过100")
    private String appName;

    @Size(max = 500, message = "应用描述长度不能超过500")
    private String appDescription;
}
