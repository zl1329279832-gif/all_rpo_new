package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.community.groupbuy.dto.LoginDTO;
import com.community.groupbuy.entity.SysUser;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.SysUserMapper;
import com.community.groupbuy.security.JwtTokenUtil;
import com.community.groupbuy.security.LoginUser;
import com.community.groupbuy.service.AuthService;
import com.community.groupbuy.vo.LoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final SysUserMapper sysUserMapper;

    @Override
    public LoginVO login(LoginDTO loginDTO) {
        if (loginDTO.getUsername() == null || loginDTO.getUsername().trim().isEmpty()) {
            throw new BusinessException("用户名不能为空");
        }
        if (loginDTO.getPassword() == null || loginDTO.getPassword().trim().isEmpty()) {
            throw new BusinessException("密码不能为空");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDTO.getUsername(), loginDTO.getPassword())
        );

        LoginUser loginUser = (LoginUser) authentication.getPrincipal();

        String token = jwtTokenUtil.generateToken(loginUser);

        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, loginDTO.getUsername());
        SysUser sysUser = sysUserMapper.selectOne(wrapper);
        if (sysUser != null) {
            sysUser.setLoginIp("127.0.0.1");
            sysUser.setLoginTime(LocalDateTime.now());
            sysUserMapper.updateById(sysUser);
        }

        List<String> permissions = loginUser.getPermissions();
        List<String> distinctPermissions = permissions != null ? permissions.stream().distinct().collect(Collectors.toList()) : null;

        return new LoginVO(token, loginUser, distinctPermissions);
    }

    @Override
    public void logout() {
        SecurityContextHolder.clearContext();
    }

    @Override
    public LoginUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof LoginUser) {
            return (LoginUser) authentication.getPrincipal();
        }
        throw new BusinessException("用户未登录");
    }

    @Override
    public List<String> getPermissions() {
        LoginUser loginUser = getCurrentUser();
        List<String> permissions = loginUser.getPermissions();
        return permissions != null ? permissions.stream().distinct().collect(Collectors.toList()) : null;
    }
}
