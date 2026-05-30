package com.community.groupbuy.vo;

import com.community.groupbuy.security.LoginUser;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginVO {

    private String token;

    private LoginUser userInfo;

    private List<String> permissions;
}
