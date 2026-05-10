package com.monitor.config;

import com.monitor.entity.Role;
import com.monitor.entity.User;
import com.monitor.repository.RoleRepository;
import com.monitor.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        initRoles();
        initAdminUser();
    }

    private void initRoles() {
        createRoleIfNotExists("ADMIN", "系统管理员，拥有所有权限");
        createRoleIfNotExists("OPERATOR", "运维人员，可以管理服务器和告警");
        createRoleIfNotExists("VIEWER", "只读用户，只能查看监控数据");
    }

    private void createRoleIfNotExists(String name, String description) {
        if (!roleRepository.existsByName(name)) {
            Role role = new Role();
            role.setName(name);
            role.setDescription(description);
            roleRepository.save(role);
            logger.info("Created role: {}", name);
        }
    }

    private void initAdminUser() {
        if (!userRepository.existsByUsername("admin")) {
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("ADMIN role not found"));

            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setEmail("admin@example.com");
            admin.setRealName("系统管理员");
            admin.setRole(adminRole);
            admin.setEnabled(true);
            userRepository.save(admin);
            logger.info("Created default admin user with password: admin123");
        } else {
            User admin = userRepository.findByUsername("admin").orElse(null);
            if (admin != null) {
                String testPassword = "admin123";
                if (!passwordEncoder.matches(testPassword, admin.getPassword())) {
                    admin.setPassword(passwordEncoder.encode(testPassword));
                    userRepository.save(admin);
                    logger.info("Reset admin password to: admin123");
                }
            }
        }
    }
}
