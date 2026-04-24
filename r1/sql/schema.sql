-- 规则引擎风控回测系统 - 数据库表结构

-- 规则表
CREATE TABLE IF NOT EXISTS `rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `name` VARCHAR(255) NOT NULL COMMENT '规则名称',
  `code` VARCHAR(100) NOT NULL UNIQUE COMMENT '规则编码',
  `description` TEXT COMMENT '规则描述',
  `expression` TEXT NOT NULL COMMENT '规则表达式',
  `risk_level` VARCHAR(50) NOT NULL DEFAULT 'medium' COMMENT '风险等级: low, medium, high',
  `status` VARCHAR(50) NOT NULL DEFAULT 'active' COMMENT '状态: active, inactive',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_code (`code`),
  INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规则表';

-- 规则版本表
CREATE TABLE IF NOT EXISTS `rule_versions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `rule_id` BIGINT UNSIGNED NOT NULL COMMENT '规则ID',
  `version` INT NOT NULL COMMENT '版本号',
  `name` VARCHAR(255) NOT NULL COMMENT '规则名称（快照）',
  `expression` TEXT NOT NULL COMMENT '规则表达式（快照）',
  `description` TEXT COMMENT '规则描述（快照）',
  `risk_level` VARCHAR(50) NOT NULL COMMENT '风险等级（快照）',
  `created_by` VARCHAR(100) COMMENT '创建者',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_rule_id (`rule_id`),
  INDEX idx_version (`version`),
  UNIQUE KEY uk_rule_version (`rule_id`, `version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规则版本表';

-- 样本数据表
CREATE TABLE IF NOT EXISTS `samples` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `batch_id` VARCHAR(100) COMMENT '批次ID',
  `data` JSON NOT NULL COMMENT '样本数据JSON',
  `expected_result` VARCHAR(50) COMMENT '预期结果: pass, reject',
  `source` VARCHAR(100) COMMENT '数据来源',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_batch_id (`batch_id`),
  INDEX idx_source (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='样本数据表';

-- 回测任务表
CREATE TABLE IF NOT EXISTS `backtest_tasks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `name` VARCHAR(255) NOT NULL COMMENT '回测任务名称',
  `description` TEXT COMMENT '任务描述',
  `rule_version_ids` JSON NOT NULL COMMENT '使用的规则版本ID列表',
  `sample_batch_ids` JSON COMMENT '样本批次ID列表',
  `sample_count` INT DEFAULT 0 COMMENT '样本总数',
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT '状态: pending, running, completed, failed',
  `progress` INT DEFAULT 0 COMMENT '进度 0-100',
  `result_summary` JSON COMMENT '回测结果汇总',
  `started_at` DATETIME COMMENT '开始时间',
  `completed_at` DATETIME COMMENT '完成时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_status (`status`),
  INDEX idx_created_at (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='回测任务表';

-- 回测结果表
CREATE TABLE IF NOT EXISTS `backtest_results` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `task_id` BIGINT UNSIGNED NOT NULL COMMENT '回测任务ID',
  `sample_id` BIGINT UNSIGNED NOT NULL COMMENT '样本ID',
  `actual_result` VARCHAR(50) NOT NULL COMMENT '实际结果: pass, reject',
  `expected_result` VARCHAR(50) COMMENT '预期结果',
  `hit_rule_count` INT DEFAULT 0 COMMENT '命中规则数',
  `is_correct` BOOLEAN COMMENT '是否正确',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_task_id (`task_id`),
  INDEX idx_sample_id (`sample_id`),
  INDEX idx_actual_result (`actual_result`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='回测结果表';

-- 规则命中明细表
CREATE TABLE IF NOT EXISTS `rule_hit_details` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `task_id` BIGINT UNSIGNED NOT NULL COMMENT '回测任务ID',
  `result_id` BIGINT UNSIGNED NOT NULL COMMENT '回测结果ID',
  `sample_id` BIGINT UNSIGNED NOT NULL COMMENT '样本ID',
  `rule_id` BIGINT UNSIGNED NOT NULL COMMENT '规则ID',
  `rule_version_id` BIGINT UNSIGNED NOT NULL COMMENT '规则版本ID',
  `rule_code` VARCHAR(100) NOT NULL COMMENT '规则编码',
  `rule_name` VARCHAR(255) NOT NULL COMMENT '规则名称',
  `expression` TEXT NOT NULL COMMENT '规则表达式',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_task_id (`task_id`),
  INDEX idx_result_id (`result_id`),
  INDEX idx_rule_id (`rule_id`),
  INDEX idx_sample_id (`sample_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规则命中明细表';
