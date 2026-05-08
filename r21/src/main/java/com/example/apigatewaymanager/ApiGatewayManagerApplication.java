package com.example.apigatewaymanager;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.example.apigatewaymanager.mapper")
public class ApiGatewayManagerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayManagerApplication.class, args);
    }
}
