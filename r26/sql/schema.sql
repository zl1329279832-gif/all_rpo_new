CREATE DATABASE IF NOT EXISTS task_scheduler DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE task_scheduler;

DROP TABLE IF EXISTS task_log;
DROP TABLE IF EXISTS task;

CREATE TABLE task (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '任务ID',
    task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
    task_group VARCHAR(50) DEFAULT 'DEFAULT' COMMENT '任务分组',
    cron_expression VARCHAR(100) NOT NULL COMMENT 'Cron表达式',
    target_class VARCHAR(255) NOT NULL COMMENT '目标类名',
    target_method VARCHAR(100) NOT NULL COMMENT '目标方法名',
    method_params TEXT COMMENT '方法参数JSON',
    task_status TINYINT DEFAULT 0 COMMENT '任务状态: 0-停止, 1-运行中, 2-暂停',
    max_retry_count INT DEFAULT 3 COMMENT '最大重试次数',
    current_retry_count INT DEFAULT 0 COMMENT '当前重试次数',
    last_execute_time DATETIME COMMENT '上次执行时间',
    next_execute_time DATETIME COMMENT '下次执行时间',
    last_execute_result VARCHAR(50) COMMENT '上次执行结果: SUCCESS, FAILURE',
    last_execute_message TEXT COMMENT '上次执行消息',
    remark VARCHAR(500) COMMENT '备注',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除: 0-未删除, 1-已删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_task_group_name (task_group, task_name),
    KEY idx_task_status (task_status),
    KEY idx_task_group (task_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';

CREATE TABLE task_log (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
    task_id BIGINT NOT NULL COMMENT '任务ID',
    task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
    task_group VARCHAR(50) DEFAULT 'DEFAULT' COMMENT '任务分组',
    trigger_type VARCHAR(20) NOT NULL COMMENT '触发类型: SCHEDULED, MANUAL, RETRY',
    execute_status VARCHAR(20) NOT NULL COMMENT '执行状态: SUCCESS, FAILURE, RUNNING',
    execute_start_time DATETIME NOT NULL COMMENT '执行开始时间',
    execute_end_time DATETIME COMMENT '执行结束时间',
    execute_duration BIGINT COMMENT '执行耗时(毫秒)',
    execute_result TEXT COMMENT '执行结果',
    error_message TEXT COMMENT '错误信息',
    retry_count INT DEFAULT 0 COMMENT '重试次数',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_task_id (task_id),
    KEY idx_execute_status (execute_status),
    KEY idx_created_time (created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务执行日志表';

INSERT INTO task (task_name, task_group, cron_expression, target_class, target_method, method_params, task_status, max_retry_count, remark)
VALUES 
('DemoTask1', 'DEFAULT', '0/30 * * * * ?', 'com.example.taskscheduler.task.DemoTask', 'execute', '{"message":"Hello World"}', 0, 3, '示例任务1 - 每30秒执行一次'),
('DemoTask2', 'DATA_SYNC', '0 0 2 * * ?', 'com.example.taskscheduler.task.DataSyncTask', 'syncAll', NULL, 0, 5, '示例任务2 - 每天凌晨2点数据同步');
