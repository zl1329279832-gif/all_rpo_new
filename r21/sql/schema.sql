-- 创建数据库
CREATE DATABASE IF NOT EXISTS api_gateway_manager DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE api_gateway_manager;

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(加密)',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  `nickname` VARCHAR(50) COMMENT '昵称',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除:0-未删除,1-已删除',
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- API应用表
CREATE TABLE IF NOT EXISTS `api_app` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '应用ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `app_name` VARCHAR(100) NOT NULL COMMENT '应用名称',
  `app_description` VARCHAR(500) COMMENT '应用描述',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除:0-未删除,1-已删除',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_app_name` (`app_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API应用表';

-- 接口密钥表
CREATE TABLE IF NOT EXISTS `api_key` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '密钥ID',
  `app_id` BIGINT NOT NULL COMMENT '应用ID',
  `api_key` VARCHAR(255) NOT NULL UNIQUE COMMENT 'API Key',
  `api_secret` VARCHAR(255) NOT NULL COMMENT 'API Secret',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `total_calls` BIGINT DEFAULT 0 COMMENT '总调用次数',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除:0-未删除,1-已删除',
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_api_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='接口密钥表';

-- 访问日志表
CREATE TABLE IF NOT EXISTS `access_log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  `api_key` VARCHAR(255) COMMENT 'API Key',
  `app_id` BIGINT COMMENT '应用ID',
  `user_id` BIGINT COMMENT '用户ID',
  `request_method` VARCHAR(10) COMMENT '请求方法',
  `request_path` VARCHAR(500) COMMENT '请求路径',
  `request_params` TEXT COMMENT '请求参数',
  `request_ip` VARCHAR(50) COMMENT '请求IP',
  `response_status` INT COMMENT '响应状态',
  `response_time` BIGINT COMMENT '响应时间(ms)',
  `error_message` TEXT COMMENT '错误信息',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_api_key` (`api_key`),
  INDEX `idx_app_id` (`app_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访问日志表';

-- 限流配置表
CREATE TABLE IF NOT EXISTS `rate_limit` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
  `target_type` TINYINT NOT NULL COMMENT '限流目标类型:1-API Key,2-IP,3-用户',
  `target_value` VARCHAR(255) NOT NULL COMMENT '目标值',
  `limit_type` TINYINT NOT NULL COMMENT '限流类型:1-QPS,2-每日限制,3-每月限制',
  `limit_value` INT NOT NULL COMMENT '限制次数',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `remark` VARCHAR(255) COMMENT '备注',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除:0-未删除,1-已删除',
  INDEX `idx_target` (`target_type`, `target_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='限流配置表';

-- 黑名单表
CREATE TABLE IF NOT EXISTS `blacklist` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '黑名单ID',
  `target_type` TINYINT NOT NULL COMMENT '目标类型:1-IP,2-API Key,3-用户',
  `target_value` VARCHAR(255) NOT NULL COMMENT '目标值',
  `reason` VARCHAR(500) COMMENT '原因',
  `expire_time` DATETIME COMMENT '过期时间',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除:0-未删除,1-已删除',
  UNIQUE INDEX `uk_target` (`target_type`, `target_value`),
  INDEX `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='黑名单表';

-- 调用统计表（用于快速查询统计数据）
CREATE TABLE IF NOT EXISTS `call_statistics` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `api_key` VARCHAR(255) COMMENT 'API Key',
  `app_id` BIGINT COMMENT '应用ID',
  `user_id` BIGINT COMMENT '用户ID',
  `total_calls` BIGINT DEFAULT 0 COMMENT '总调用次数',
  `success_calls` BIGINT DEFAULT 0 COMMENT '成功调用次数',
  `fail_calls` BIGINT DEFAULT 0 COMMENT '失败调用次数',
  `avg_response_time` INT DEFAULT 0 COMMENT '平均响应时间',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE INDEX `uk_date_target` (`stat_date`, `api_key`),
  INDEX `idx_stat_date` (`stat_date`),
  INDEX `idx_api_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调用统计表';
