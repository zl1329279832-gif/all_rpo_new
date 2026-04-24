package com.chat.service.impl;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chat.common.BusinessException;
import com.chat.dto.LoginDTO;
import com.chat.dto.RegisterDTO;
import com.chat.entity.User;
import com.chat.mapper.UserMapper;
import com.chat.service.UserService;
import com.chat.utils.JwtUtil;
import com.chat.vo.LoginVO;
import com.chat.vo.UserVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);
    private static final String ONLINE_USERS_KEY = "chat:online:users";
    private static final String ONLINE_STATUS_KEY_PREFIX = "chat:online:user:";

    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, Object> redisTemplate;

    public UserServiceImpl(JwtUtil jwtUtil, RedisTemplate<String, Object> redisTemplate) {
        this.jwtUtil = jwtUtil;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public LoginVO login(LoginDTO dto) {
        User user = this.getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, dto.getUsername()));
        
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        if (!BCrypt.checkpw(dto.getPassword(), user.getPassword())) {
            throw new BusinessException("密码错误");
        }

        if (user.getStatus() != 1) {
            throw new BusinessException("账号已被禁用");
        }

        user.setLastLoginTime(LocalDateTime.now());
        this.updateById(user);

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        updateOnlineStatus(user.getId(), true);

        LoginVO vo = new LoginVO();
        vo.setToken(token);
        vo.setUser(toUserVO(user, true));

        log.info("用户登录成功: userId={}, username={}", user.getId(), user.getUsername());
        return vo;
    }

    @Override
    public void register(RegisterDTO dto) {
        if (!dto.getPassword().equals(dto.getConfirmPassword())) {
            throw new BusinessException("两次输入的密码不一致");
        }

        User existUser = this.getOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, dto.getUsername()));
        
        if (existUser != null) {
            throw new BusinessException("用户名已存在");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(BCrypt.hashpw(dto.getPassword()));
        user.setNickname(dto.getNickname() != null ? dto.getNickname() : dto.getUsername());
        user.setStatus(1);
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        user.setDeleted(0);

        this.save(user);
        log.info("用户注册成功: userId={}, username={}", user.getId(), user.getUsername());
    }

    @Override
    public void logout(Long userId) {
        updateOnlineStatus(userId, false);
        log.info("用户登出: userId={}", userId);
    }

    @Override
    public UserVO getUserInfo(Long userId) {
        User user = this.getById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        return toUserVO(user, isOnline(userId));
    }

    @Override
    public List<UserVO> searchUsers(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }

        List<User> users = this.list(new LambdaQueryWrapper<User>()
                .like(User::getUsername, keyword)
                .or()
                .like(User::getNickname, keyword)
                .last("LIMIT 50"));

        return users.stream()
                .map(user -> toUserVO(user, isOnline(user.getId())))
                .collect(Collectors.toList());
    }

    @Override
    public void updateOnlineStatus(Long userId, boolean online) {
        String key = ONLINE_STATUS_KEY_PREFIX + userId;
        if (online) {
            redisTemplate.opsForValue().set(key, 1, 24, TimeUnit.HOURS);
            redisTemplate.opsForSet().add(ONLINE_USERS_KEY, userId);
        } else {
            redisTemplate.delete(key);
            redisTemplate.opsForSet().remove(ONLINE_USERS_KEY, userId);
        }
    }

    @Override
    public boolean isOnline(Long userId) {
        String key = ONLINE_STATUS_KEY_PREFIX + userId;
        Boolean exists = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(exists);
    }

    @Override
    public List<UserVO> getOnlineUsers() {
        Set<Object> onlineUserIds = redisTemplate.opsForSet().members(ONLINE_USERS_KEY);
        if (onlineUserIds == null || onlineUserIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> ids = onlineUserIds.stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());

        List<User> users = this.listByIds(ids);
        return users.stream()
                .map(user -> toUserVO(user, true))
                .collect(Collectors.toList());
    }

    private UserVO toUserVO(User user, boolean online) {
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        vo.setOnline(online);
        return vo;
    }
}
