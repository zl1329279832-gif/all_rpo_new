package com.collaborative.whiteboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInfo {

    private String userId;
    private String username;
    private String color;
    private Long joinTime;
}
