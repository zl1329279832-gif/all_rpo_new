-- 实时协同白板与文档批注系统数据库表结构
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

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    room_id VARCHAR(50) NOT NULL COMMENT '房间ID',
    user_id VARCHAR(50) DEFAULT NULL COMMENT '用户ID',
    operation_type VARCHAR(20) NOT NULL COMMENT '操作类型: ADD, UPDATE, DELETE, DRAW, JOIN, LEAVE',
    element_id VARCHAR(50) DEFAULT NULL COMMENT '关联元素ID',
    operation_data TEXT COMMENT '操作数据(JSON格式)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    INDEX idx_room_id (room_id),
    INDEX idx_user_id (user_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 插入示例数据
INSERT INTO rooms (id, name, description, created_by) VALUES 
('demo001', '演示房间1', '这是一个演示用的白板房间', 'system'),
('demo002', '团队协作室', '用于团队协作讨论的白板房间', 'system');
