package com.community.groupbuy.service;

import com.community.groupbuy.dto.LoginDTO;
import com.community.groupbuy.security.LoginUser;
import com.community.groupbuy.vo.LoginVO;

import java.util.List;

public interface AuthService {

    LoginVO login(LoginDTO loginDTO);

    void logout();

    LoginUser getCurrentUser();

    List<String> getPermissions();
}
