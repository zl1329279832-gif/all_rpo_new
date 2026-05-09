-- 实时协同白板与文档批注系统数据库表结构
-- v2.0: 新增角色权限管理和撤销重做功能

-- 创建数据库
CREATE DATABASE IF NOT EXISTS whiteboard_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE whiteboard_db;

-- 房间表
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(50) PRIMARY KEY COMMENT '房间ID',
    name VARCHAR(100) NOT NULL COMMENT '房间名称',
    description VARCHAR(500) DEFAULT '' COMMENT '房间描述',
    created_by VARCHAR(50) DEFAULT NULL COMMENT '创建者ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房间表';

-- 房间成员表（新增：用于角色权限管理）
CREATE TABLE IF NOT EXISTS room_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(50) NOT NULL COMMENT '房间ID',
    user_id VARCHAR(50) NOT NULL COMMENT '用户ID',
    username VARCHAR(100) DEFAULT NULL COMMENT '用户昵称',
    role ENUM('OWNER', 'EDITOR', 'VIEWER') NOT NULL DEFAULT 'VIEWER' COMMENT '角色: OWNER-房主, EDITOR-编辑者, VIEWER-查看者',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_room_user (room_id, user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role (role),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房间成员表';

-- 白板元素表
CREATE TABLE IF NOT EXISTS whiteboard_elements (
    id VARCHAR(50) PRIMARY KEY COMMENT '元素ID',
    room_id VARCHAR(50) NOT NULL COMMENT '房间ID',
    type VARCHAR(20) NOT NULL COMMENT '元素类型: pen, line, rect, circle, text, sticky',
    data TEXT COMMENT '元素数据(JSON格式)',
    created_by VARCHAR(50) DEFAULT NULL COMMENT '创建者ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_room_id (room_id),
    INDEX idx_type (type),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='白板元素表';

-- 操作日志表（更新：支持撤销重做）
CREATE TABLE IF NOT EXISTS operation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    room_id VARCHAR(50) NOT NULL COMMENT '房间ID',
    user_id VARCHAR(50) DEFAULT NULL COMMENT '用户ID',
    operation_type VARCHAR(20) NOT NULL COMMENT '操作类型: ADD, UPDATE, DELETE, DRAW, JOIN, LEAVE, CLEAR',
    element_id VARCHAR(50) DEFAULT NULL COMMENT '关联元素ID',
    element_type VARCHAR(20) DEFAULT NULL COMMENT '元素类型',
    before_data TEXT COMMENT '操作前数据(JSON格式，用于撤销)',
    after_data TEXT COMMENT '操作后数据(JSON格式，用于重做)',
    operation_data TEXT COMMENT '操作数据(JSON格式)',
    sequence BIGINT NOT NULL DEFAULT 0 COMMENT '操作序列号',
    is_undone BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已撤销',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    INDEX idx_room_id (room_id),
    INDEX idx_user_id (user_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_created_at (created_at),
    INDEX idx_room_user (room_id, user_id),
    INDEX idx_sequence (room_id, sequence),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 插入示例数据
INSERT INTO rooms (id, name, description, created_by) VALUES 
('demo001', '演示房间1', '这是一个演示用的白板房间', 'system'),
('demo002', '团队协作室', '用于团队协作讨论的白板房间', 'system');

-- 插入示例成员数据
INSERT INTO room_members (room_id, user_id, username, role) VALUES 
('demo001', 'owner1', '张三', 'OWNER'),
('demo001', 'editor1', '李四', 'EDITOR'),
('demo001', 'viewer1', '王五', 'VIEWER'),
('demo002', 'owner2', '赵六', 'OWNER');
