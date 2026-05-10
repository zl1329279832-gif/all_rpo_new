CREATE DATABASE IF NOT EXISTS online_course_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE online_course_system;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    avatar VARCHAR(500),
    status TINYINT DEFAULT 1 COMMENT '1: active, 0: disabled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    teacher_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    cover_image VARCHAR(500),
    category VARCHAR(100),
    status TINYINT DEFAULT 1 COMMENT '1: published, 0: draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    CONSTRAINT fk_course_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_materials (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    material_type ENUM('DOCUMENT', 'VIDEO', 'LINK', 'OTHER') NOT NULL DEFAULT 'DOCUMENT',
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course_id (course_id),
    INDEX idx_material_type (material_type),
    CONSTRAINT fk_material_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress INT DEFAULT 0 COMMENT '0-100',
    status TINYINT DEFAULT 1 COMMENT '1: enrolled, 0: unenrolled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_course_student (course_id, student_id),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    max_score INT DEFAULT 100,
    deadline DATETIME,
    status TINYINT DEFAULT 1 COMMENT '1: published, 0: draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course_id (course_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_status (status),
    INDEX idx_deadline (deadline),
    CONSTRAINT fk_assignment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    content TEXT,
    file_path VARCHAR(500),
    file_url VARCHAR(500),
    score INT,
    feedback TEXT,
    graded_by BIGINT,
    graded_at DATETIME,
    status ENUM('DRAFT', 'SUBMITTED', 'GRADED', 'LATE') DEFAULT 'DRAFT',
    submitted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_assignment_student (assignment_id, student_id),
    INDEX idx_student_id (student_id),
    INDEX idx_assignment_id (assignment_id),
    INDEX idx_status (status),
    CONSTRAINT fk_submission_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_graded_by FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, password, nickname, email, phone, role, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '系统管理员', 'admin@example.com', '13800000000', 'ADMIN', 1),
('teacher1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '张老师', 'teacher1@example.com', '13800000001', 'TEACHER', 1),
('teacher2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '李老师', 'teacher2@example.com', '13800000002', 'TEACHER', 1),
('student1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '王同学', 'student1@example.com', '13800000003', 'STUDENT', 1),
('student2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '李同学', 'student2@example.com', '13800000004', 'STUDENT', 1),
('student3', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', '赵同学', 'student3@example.com', '13800000005', 'STUDENT', 1);

INSERT INTO courses (teacher_id, title, description, cover_image, category, status) VALUES
(2, 'Java 编程基础', '本课程面向零基础学员，从 Java 语言基础语法开始，循序渐进地介绍 Java 核心概念。', 'https://img.example.com/java-course.jpg', '编程语言', 1),
(2, 'Spring Boot 实战', '深入学习 Spring Boot 框架，掌握企业级应用开发技能。', 'https://img.example.com/spring-boot.jpg', '后端开发', 1),
(3, 'Vue 3 前端开发', '学习 Vue 3 核心概念，包括 Composition API、响应式原理等。', 'https://img.example.com/vue3.jpg', '前端开发', 1);

INSERT INTO course_materials (course_id, title, material_type, file_url, description, sort_order) VALUES
(1, '第一章：Java 环境搭建', 'DOCUMENT', 'https://docs.example.com/java/ch1.pdf', '介绍如何安装 JDK、配置环境变量', 1),
(1, '第二章：变量与数据类型', 'DOCUMENT', 'https://docs.example.com/java/ch2.pdf', '讲解 Java 的基本数据类型和变量声明', 2),
(1, '第三章：控制流程', 'VIDEO', 'https://video.example.com/java/ch3.mp4', '视频讲解 if、switch、循环语句', 3),
(2, '第一章：Spring Boot 入门', 'DOCUMENT', 'https://docs.example.com/spring/ch1.pdf', 'Spring Boot 简介和快速开始', 1),
(2, '第二章：自动配置原理', 'DOCUMENT', 'https://docs.example.com/spring/ch2.pdf', '深入理解 Spring Boot 自动配置', 2),
(3, '第一章：Vue 3 简介', 'DOCUMENT', 'https://docs.example.com/vue/ch1.pdf', 'Vue 3 新特性介绍', 1),
(3, '第二章：Composition API', 'VIDEO', 'https://video.example.com/vue/ch2.mp4', '视频讲解 Composition API 的使用', 2);

INSERT INTO course_enrollments (course_id, student_id, progress, status) VALUES
(1, 4, 30, 1),
(1, 5, 50, 1),
(2, 4, 10, 1),
(2, 6, 80, 1),
(3, 5, 100, 1),
(3, 6, 20, 1);

INSERT INTO assignments (course_id, teacher_id, title, description, max_score, deadline, status) VALUES
(1, 2, '第一次作业：变量与表达式', '完成课本第 2 章课后习题，编写 3 个基础程序。', 100, '2024-06-15 23:59:59', 1),
(1, 2, '第二次作业：循环与数组', '使用循环和数组完成指定练习。', 100, '2024-06-30 23:59:59', 1),
(2, 2, '第一次作业：Spring Boot 基础', '创建第一个 Spring Boot 应用并实现 REST API。', 100, '2024-06-20 23:59:59', 1),
(3, 3, '第一次作业：Vue 组件练习', '使用 Vue 3 创建一个待办事项组件。', 100, '2024-06-25 23:59:59', 1);
