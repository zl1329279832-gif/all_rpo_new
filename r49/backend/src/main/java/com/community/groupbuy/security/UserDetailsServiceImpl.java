package com.community.groupbuy.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        LoginUser loginUser = new LoginUser();
        loginUser.setId(1L);
        loginUser.setUsername(username);
        loginUser.setPassword("$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2");
        loginUser.setNickname("管理员");
        loginUser.setStatus(0);

        List<String> permissions = new ArrayList<>();
        permissions.add("admin");
        permissions.add("user:list");
        permissions.add("user:add");
        permissions.add("user:edit");
        permissions.add("user:delete");
        loginUser.setPermissions(permissions);

        return loginUser;
    }
}
