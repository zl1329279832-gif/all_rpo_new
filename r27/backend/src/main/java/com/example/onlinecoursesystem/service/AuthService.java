package com.example.onlinecoursesystem.service;

import com.example.onlinecoursesystem.dto.LoginRequest;
import com.example.onlinecoursesystem.dto.RegisterRequest;
import com.example.onlinecoursesystem.entity.User;
import com.example.onlinecoursesystem.repository.UserRepository;
import com.example.onlinecoursesystem.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public Map<String, Object> login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("用户不存在");
        }
        
        User user = userOpt.get();
        
        if (user.getStatus() == 0) {
            throw new RuntimeException("账号已被禁用");
        }
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        
        redisTemplate.opsForValue().set("token:" + user.getUsername(), token, 24, TimeUnit.HOURS);
        
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("nickname", user.getNickname());
        result.put("role", user.getRole().name());
        result.put("email", user.getEmail());
        result.put("phone", user.getPhone());
        result.put("avatar", user.getAvatar());
        
        return result;
    }

    public Map<String, Object> register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
        user.setStatus(1);
        
        User savedUser = userRepository.save(user);
        
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getUsername(), savedUser.getRole().name());
        redisTemplate.opsForValue().set("token:" + savedUser.getUsername(), token, 24, TimeUnit.HOURS);
        
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userId", savedUser.getId());
        result.put("username", savedUser.getUsername());
        result.put("nickname", savedUser.getNickname());
        result.put("role", savedUser.getRole().name());
        
        return result;
    }

    public void logout(String username) {
        redisTemplate.delete("token:" + username);
    }
}
