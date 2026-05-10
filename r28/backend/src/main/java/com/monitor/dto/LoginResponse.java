package com.monitor.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String realName;
    private String email;
    private String roleName;
    
    public LoginResponse(String token, Long userId, String username, String realName, String email, String roleName) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.realName = realName;
        this.email = email;
        this.roleName = roleName;
    }
}
