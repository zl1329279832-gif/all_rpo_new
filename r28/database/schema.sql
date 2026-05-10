-- 服务器资源监控与告警管理系统数据库结构
-- 数据库: monitor_system
-- 字符集: utf8mb4

CREATE DATABASE IF NOT EXISTS monitor_system 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE monitor_system;

-- ============================================================
-- 用户权限管理模块
-- ============================================================

-- 角色表
CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称: ADMIN, OPERATOR, VIEWER',
    `description` VARCHAR(255) COMMENT '角色描述',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    `email` VARCHAR(100),
    `real_name` VARCHAR(50),
    `role_id` BIGINT NOT NULL,
    `enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`),
    INDEX `idx_username` (`username`),
    INDEX `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 服务器管理模块
-- ============================================================

-- 服务器信息表
CREATE TABLE IF NOT EXISTS `servers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT '服务器名称',
    `ip_address` VARCHAR(50) NOT NULL COMMENT '服务器IP地址',
    `hostname` VARCHAR(100) COMMENT '主机名',
    `os_type` VARCHAR(50) COMMENT '操作系统类型',
    `os_version` VARCHAR(100) COMMENT '操作系统版本',
    `cpu_cores` INT COMMENT 'CPU核心数',
    `total_memory_gb` DECIMAL(10,2) COMMENT '总内存(GB)',
    `total_disk_gb` DECIMAL(10,2) COMMENT '总磁盘(GB)',
    `status` VARCHAR(20) DEFAULT 'OFFLINE' COMMENT '服务器状态: ONLINE, OFFLINE, WARNING, CRITICAL',
    `last_heartbeat` DATETIME COMMENT '最后心跳时间',
    `description` VARCHAR(500) COMMENT '描述',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_ip_address` (`ip_address`),
    INDEX `idx_status` (`status`),
    INDEX `idx_last_heartbeat` (`last_heartbeat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务器信息表';

-- ============================================================
-- 监控指标模块
-- ============================================================

-- 监控指标数据表
CREATE TABLE IF NOT EXISTS `metrics` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `server_id` BIGINT NOT NULL,
    `cpu_usage` DECIMAL(5,2) COMMENT 'CPU使用率(%)',
    `memory_usage` DECIMAL(5,2) COMMENT '内存使用率(%)',
    `memory_used_gb` DECIMAL(10,2) COMMENT '已用内存(GB)',
    `disk_usage` DECIMAL(5,2) COMMENT '磁盘使用率(%)',
    `disk_used_gb` DECIMAL(10,2) COMMENT '已用磁盘(GB)',
    `network_in_mbps` DECIMAL(10,2) COMMENT '入站网络带宽(Mbps)',
    `network_out_mbps` DECIMAL(10,2) COMMENT '出站网络带宽(Mbps)',
    `timestamp` DATETIME NOT NULL COMMENT '指标采集时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE,
    INDEX `idx_server_id` (`server_id`),
    INDEX `idx_timestamp` (`timestamp`),
    INDEX `idx_server_timestamp` (`server_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='监控指标数据表';

-- ============================================================
-- 告警管理模块
-- ============================================================

-- 告警级别枚举
-- 1: INFO, 2: WARNING, 3: ERROR, 4: CRITICAL

-- 告警规则表
CREATE TABLE IF NOT EXISTS `alert_rules` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL COMMENT '规则名称',
    `server_id` BIGINT COMMENT '关联的服务器ID, NULL表示全局规则',
    `metric_type` VARCHAR(50) NOT NULL COMMENT '指标类型: CPU, MEMORY, DISK, NETWORK',
    `operator` VARCHAR(10) NOT NULL COMMENT '比较符: >, >=, <, <=, ==, !=',
    `threshold` DECIMAL(10,2) NOT NULL COMMENT '阈值',
    `alert_level` TINYINT NOT NULL DEFAULT 2 COMMENT '告警级别: 1=INFO, 2=WARNING, 3=ERROR, 4=CRITICAL',
    `description` VARCHAR(500) COMMENT '规则描述',
    `enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    `silenced` TINYINT(1) DEFAULT 0 COMMENT '是否静默(抑制告警)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_server_id` (`server_id`),
    INDEX `idx_metric_type` (`metric_type`),
    INDEX `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='告警规则表';

-- 告警记录表
CREATE TABLE IF NOT EXISTS `alerts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `rule_id` BIGINT NOT NULL,
    `server_id` BIGINT NOT NULL,
    `metric_type` VARCHAR(50) NOT NULL,
    `current_value` DECIMAL(10,2) NOT NULL COMMENT '当前值',
    `threshold_value` DECIMAL(10,2) NOT NULL COMMENT '触发时的阈值',
    `alert_level` TINYINT NOT NULL COMMENT '告警级别: 1=INFO, 2=WARNING, 3=ERROR, 4=CRITICAL',
    `message` VARCHAR(1000) NOT NULL COMMENT '告警消息',
    `status` VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '告警状态: ACTIVE, ACKNOWLEDGED, RESOLVED',
    `acknowledged_by` BIGINT COMMENT '确认人用户ID',
    `acknowledged_at` DATETIME COMMENT '确认时间',
    `resolved_at` DATETIME COMMENT '恢复时间',
    `occurred_at` DATETIME NOT NULL COMMENT '告警发生时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`rule_id`) REFERENCES `alert_rules`(`id`),
    FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`acknowledged_by`) REFERENCES `users`(`id`),
    INDEX `idx_server_id` (`server_id`),
    INDEX `idx_rule_id` (`rule_id`),
    INDEX `idx_alert_level` (`alert_level`),
    INDEX `idx_status` (`status`),
    INDEX `idx_occurred_at` (`occurred_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='告警记录表';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 插入默认角色
INSERT INTO `roles` (`name`, `description`) VALUES
('ADMIN', '系统管理员，拥有所有权限'),
('OPERATOR', '运维人员，可以管理服务器和告警'),
('VIEWER', '只读用户，只能查看监控数据')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- 默认管理员用户会在应用启动时由 DataInitializer 自动创建
-- 账号: admin, 密码: admin123
-- DataInitializer 会自动确保密码正确，并在每次启动时校验

-- 插入示例服务器
INSERT INTO `servers` (`name`, `ip_address`, `hostname`, `os_type`, `os_version`, `cpu_cores`, `total_memory_gb`, `total_disk_gb`, `status`, `description`)
SELECT '生产服务器-01', '192.168.1.101', 'prod-server-01', 'Linux', 'CentOS 7', 8, 32.00, 500.00, 'ONLINE', '主业务服务器'
WHERE NOT EXISTS (SELECT 1 FROM `servers` WHERE `ip_address` = '192.168.1.101');

INSERT INTO `servers` (`name`, `ip_address`, `hostname`, `os_type`, `os_version`, `cpu_cores`, `total_memory_gb`, `total_disk_gb`, `status`, `description`)
SELECT '生产服务器-02', '192.168.1.102', 'prod-server-02', 'Linux', 'Ubuntu 20.04', 16, 64.00, 1000.00, 'ONLINE', '数据库服务器'
WHERE NOT EXISTS (SELECT 1 FROM `servers` WHERE `ip_address` = '192.168.1.102');

-- 插入示例告警规则 (全局规则)
INSERT INTO `alert_rules` (`name`, `metric_type`, `operator`, `threshold`, `alert_level`, `description`, `enabled`)
SELECT 'CPU使用率过高', 'CPU', '>', 80.00, 2, 'CPU使用率超过80%时触发警告', 1
WHERE NOT EXISTS (SELECT 1 FROM `alert_rules` WHERE `name` = 'CPU使用率过高');

INSERT INTO `alert_rules` (`name`, `metric_type`, `operator`, `threshold`, `alert_level`, `description`, `enabled`)
SELECT '内存使用率过高', 'MEMORY', '>', 85.00, 3, '内存使用率超过85%时触发错误告警', 1
WHERE NOT EXISTS (SELECT 1 FROM `alert_rules` WHERE `name` = '内存使用率过高');

INSERT INTO `alert_rules` (`name`, `metric_type`, `operator`, `threshold`, `alert_level`, `description`, `enabled`)
SELECT '磁盘使用率过高', 'DISK', '>', 90.00, 4, '磁盘使用率超过90%时触发严重告警', 1
WHERE NOT EXISTS (SELECT 1 FROM `alert_rules` WHERE `name` = '磁盘使用率过高');
