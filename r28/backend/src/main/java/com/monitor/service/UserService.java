package com.monitor.service;

import com.monitor.dto.LoginRequest;
import com.monitor.dto.LoginResponse;
import com.monitor.entity.Role;
import com.monitor.entity.User;
import com.monitor.repository.RoleRepository;
import com.monitor.repository.UserRepository;
import com.monitor.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    
    public UserService(UserRepository userRepository, 
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }
    
    public LoginResponse login(LoginRequest request) {
        Optional<User> userOptional = userRepository.findByUsername(request.getUsername());
        
        if (userOptional.isEmpty()) {
            throw new RuntimeException("用户名或密码错误");
        }
        
        User user = userOptional.get();
        
        if (!user.getEnabled()) {
            throw new RuntimeException("账户已被禁用");
        }
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        
        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().getName());
        
        return new LoginResponse(
            token,
            user.getId(),
            user.getUsername(),
            user.getRealName(),
            user.getEmail(),
            user.getRole().getName()
        );
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    @Transactional
    public User createUser(User user, String rawPassword) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        
        user.setPassword(passwordEncoder.encode(rawPassword));
        
        if (user.getRole() != null && user.getRole().getId() != null) {
            Optional<Role> roleOptional = roleRepository.findById(user.getRole().getId());
            roleOptional.ifPresent(user::setRole);
        }
        
        return userRepository.save(user);
    }
    
    @Transactional
    public User updateUser(Long id, User userDetails, String rawPassword) {
        return userRepository.findById(id).map(user -> {
            if (userDetails.getUsername() != null && 
                !userDetails.getUsername().equals(user.getUsername()) &&
                userRepository.existsByUsername(userDetails.getUsername())) {
                throw new RuntimeException("用户名已存在");
            }
            
            if (userDetails.getUsername() != null) {
                user.setUsername(userDetails.getUsername());
            }
            if (rawPassword != null && !rawPassword.isEmpty()) {
                user.setPassword(passwordEncoder.encode(rawPassword));
            }
            if (userDetails.getEmail() != null) {
                user.setEmail(userDetails.getEmail());
            }
            if (userDetails.getRealName() != null) {
                user.setRealName(userDetails.getRealName());
            }
            if (userDetails.getEnabled() != null) {
                user.setEnabled(userDetails.getEnabled());
            }
            if (userDetails.getRole() != null && userDetails.getRole().getId() != null) {
                Optional<Role> roleOptional = roleRepository.findById(userDetails.getRole().getId());
                roleOptional.ifPresent(user::setRole);
            }
            
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("用户不存在"));
    }
    
    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
