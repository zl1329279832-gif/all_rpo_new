package com.monitor.controller;

import com.monitor.dto.ApiResponse;
import com.monitor.entity.User;
import com.monitor.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<User>> getAllUsers() {
        return ApiResponse.success(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(value -> ResponseEntity.ok(ApiResponse.success(value)))
                   .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                           .body(ApiResponse.error("用户不存在")));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> createUser(@RequestBody Map<String, Object> request) {
        try {
            User user = new User();
            user.setUsername((String) request.get("username"));
            user.setEmail((String) request.get("email"));
            user.setRealName((String) request.get("realName"));
            user.setEnabled((Boolean) request.getOrDefault("enabled", true));
            
            if (request.get("roleId") != null) {
                var role = new com.monitor.entity.Role();
                role.setId(Long.valueOf(request.get("roleId").toString()));
                user.setRole(role);
            }
            
            String password = (String) request.get("password");
            User created = userService.createUser(user, password);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("用户创建成功", created));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            User userDetails = new User();
            if (request.containsKey("username")) {
                userDetails.setUsername((String) request.get("username"));
            }
            if (request.containsKey("email")) {
                userDetails.setEmail((String) request.get("email"));
            }
            if (request.containsKey("realName")) {
                userDetails.setRealName((String) request.get("realName"));
            }
            if (request.containsKey("enabled")) {
                userDetails.setEnabled((Boolean) request.get("enabled"));
            }
            if (request.get("roleId") != null) {
                var role = new com.monitor.entity.Role();
                role.setId(Long.valueOf(request.get("roleId").toString()));
                userDetails.setRole(role);
            }
            
            String password = (String) request.get("password");
            User updated = userService.updateUser(id, userDetails, password);
            return ResponseEntity.ok(ApiResponse.success("用户更新成功", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("用户删除成功", null));
    }
}
