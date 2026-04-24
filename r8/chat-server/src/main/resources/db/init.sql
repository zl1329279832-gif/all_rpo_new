-- ============================================
-- 聊天室系统数据库初始化脚本
-- 数据库: chat_room
-- 字符集: utf8mb4
-- ============================================

CREATE DATABASE IF NOT EXISTS chat_room DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chat_room;

-- ============================================
-- 用户表
-- ============================================
DROP TABLE IF EXISTS chat_user;
CREATE TABLE chat_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（BCrypt加密）',
    nickname VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    avatar VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '是否删除：0-否，1-是',
    UNIQUE KEY uk_username (username),
    KEY idx_status (status),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 好友关系表
-- ============================================
DROP TABLE IF EXISTS chat_friend;
CREATE TABLE chat_friend (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    friend_id BIGINT NOT NULL COMMENT '好友ID',
    remark VARCHAR(50) DEFAULT NULL COMMENT '备注名',
    status TINYINT DEFAULT 0 COMMENT '状态：0-待确认，1-已通过',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_user_id (user_id),
    KEY idx_friend_id (friend_id),
    KEY idx_status (status),
    UNIQUE KEY uk_user_friend (user_id, friend_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- ============================================
-- 群组表
-- ============================================
DROP TABLE IF EXISTS chat_group;
CREATE TABLE chat_group (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '群组ID',
    group_name VARCHAR(100) NOT NULL COMMENT '群组名称',
    group_avatar VARCHAR(500) DEFAULT NULL COMMENT '群组头像URL',
    group_notice VARCHAR(500) DEFAULT NULL COMMENT '群公告',
    owner_id BIGINT NOT NULL COMMENT '群主ID',
    max_members INT DEFAULT 500 COMMENT '最大成员数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_owner_id (owner_id),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组表';

-- ============================================
-- 群成员表
-- ============================================
DROP TABLE IF EXISTS chat_group_member;
CREATE TABLE chat_group_member (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    group_id BIGINT NOT NULL COMMENT '群组ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    nickname VARCHAR(50) DEFAULT NULL COMMENT '群内昵称',
    role TINYINT DEFAULT 0 COMMENT '角色：0-普通成员，1-群主，2-管理员',
    join_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    UNIQUE KEY uk_group_user (group_id, user_id),
    KEY idx_group_id (group_id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群成员表';

-- ============================================
-- 聊天消息表
-- ============================================
DROP TABLE IF EXISTS chat_message;
CREATE TABLE chat_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
    from_user_id BIGINT NOT NULL COMMENT '发送者ID',
    to_user_id BIGINT DEFAULT NULL COMMENT '接收者ID（私聊）',
    group_id BIGINT DEFAULT NULL COMMENT '群组ID（群聊）',
    chat_type TINYINT NOT NULL COMMENT '聊天类型：1-私聊，2-群聊',
    message_type TINYINT DEFAULT 1 COMMENT '消息类型：1-文本，2-图片，3-文件，4-系统消息',
    content TEXT NOT NULL COMMENT '消息内容',
    status TINYINT DEFAULT 0 COMMENT '消息状态：0-已发送，1-已送达，2-已读',
    send_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
    read_time DATETIME DEFAULT NULL COMMENT '已读时间',
    KEY idx_chat_type (chat_type),
    KEY idx_from_user (from_user_id),
    KEY idx_to_user (to_user_id),
    KEY idx_group (group_id),
    KEY idx_send_time (send_time),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- ============================================
-- 离线消息表
-- ============================================
DROP TABLE IF EXISTS chat_offline_message;
CREATE TABLE chat_offline_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    message_id BIGINT NOT NULL COMMENT '消息ID',
    user_id BIGINT NOT NULL COMMENT '接收用户ID',
    status TINYINT DEFAULT 0 COMMENT '状态：0-未读，1-已读',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_user_id (user_id),
    KEY idx_message_id (message_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='离线消息表';

-- ============================================
-- 插入测试数据
-- ============================================

-- 测试用户（密码：123456）
-- 密码使用 BCrypt 加密，123456 的加密结果为：$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E
-- 注意：实际使用时请使用 BCrypt 重新生成密码

INSERT INTO chat_user (username, password, nickname, status, create_time) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '管理员', 1, NOW()),
('user1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '用户一', 1, NOW()),
('user2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '用户二', 1, NOW()),
('user3', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '用户三', 1, NOW());

-- 建立好友关系
INSERT INTO chat_friend (user_id, friend_id, remark, status, create_time) VALUES
(1, 2, '用户一', 1, NOW()),
(2, 1, '管理员', 1, NOW()),
(1, 3, '用户二', 1, NOW()),
(3, 1, '管理员', 1, NOW()),
(2, 3, '用户二', 1, NOW()),
(3, 2, '用户一', 1, NOW());

-- 创建测试群组
INSERT INTO chat_group (group_name, group_notice, owner_id, max_members, create_time) VALUES
('技术交流群', '欢迎加入技术交流群，一起学习共同进步！', 1, 500, NOW()),
('好友群', '好友聊天群', 2, 500, NOW());

-- 添加群成员
INSERT INTO chat_group_member (group_id, user_id, nickname, role, join_time) VALUES
(1, 1, '管理员', 1, NOW()),
(1, 2, '用户一', 0, NOW()),
(1, 3, '用户二', 0, NOW()),
(1, 4, '用户三', 0, NOW()),
(2, 2, '用户一', 1, NOW()),
(2, 1, '管理员', 0, NOW()),
(2, 3, '用户二', 0, NOW());
