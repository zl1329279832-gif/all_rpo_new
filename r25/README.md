# 企业内部组件配置与接口联调平台

基于 Vue 3 + Vite + TypeScript + Spring Boot 3 开发的企业级组件配置与接口联调平台。

## 项目结构

```
r25/
├── frontend/               # 前端项目
│   ├── src/
│   │   ├── api/           # API接口层
│   │   ├── layouts/       # 布局组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # Pinia状态管理
│   │   ├── types/         # TypeScript类型定义
│   │   ├── utils/         # 工具函数
│   │   └── views/         # 页面组件
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/               # 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/com/example/componentconfig/
│   │       │   ├── common/          # 通用类
│   │       │   ├── config/          # 配置类
│   │       │   ├── controller/      # 控制器层
│   │       │   ├── entity/          # 实体类
│   │       │   ├── repository/      # 数据访问层
│   │       │   └── service/         # 业务逻辑层
│   │       └── resources/
│   │           └── application.yml  # 配置文件
│   └── pom.xml
└── .gitignore
```

## 技术栈

### 前端
- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **TypeScript** - JavaScript的超集
- **Element Plus** - Vue 3组件库
- **Vue Router** - Vue.js官方路由
- **Pinia** - Vue状态管理库
- **Axios** - HTTP客户端

### 后端
- **Spring Boot 3** - 企业级Java框架
- **Spring Data JPA** - 数据访问层
- **H2 Database** - 内存数据库（开发用）
- **MySQL** - 生产数据库
- **SpringDoc OpenAPI** - API文档生成
- **Hutool** - Java工具类库
- **Lombok** - 简化Java代码

## 功能模块

### 前端功能
1. **仪表盘** - 数据统计概览
2. **组件列表** - 组件配置管理
3. **组件配置表单** - 新建/编辑组件配置
4. **JSON参数编辑器** - 在线编辑JSON配置
5. **接口调试面板** - 在线API测试
6. **请求历史记录** - 历史请求查看
7. **响应结果格式化展示** - 美观的JSON展示
8. **操作日志** - 用户操作记录

### 后端接口
1. **组件配置管理** - CRUD操作
2. **接口请求转发** - 第三方API代理
3. **历史记录查询** - 请求历史管理
4. **用户操作日志** - 操作审计

## 快速开始

### 环境要求
- Node.js >= 20.19.0 或 >= 22.12.0
- JDK 17+
- Maven 3.6+

### 后端启动

```bash
cd backend

# 方式1: 使用Maven命令
mvn spring-boot:run

# 方式2: 先打包再运行
mvn clean package
java -jar target/component-config-platform-1.0.0.jar
```

后端服务地址: http://localhost:8080

API文档地址: http://localhost:8080/swagger-ui.html

H2控制台: http://localhost:8080/h2-console

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

前端服务地址: http://localhost:5173

## API接口文档

### 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1715308800000
}
```

### 组件配置接口

#### 1. 获取组件列表
- **URL**: `GET /api/component/list`
- **参数**:
  - `current`: 当前页码，默认1
  - `size`: 每页大小，默认10
  - `keyword`: 搜索关键字（可选）
  - `componentType`: 组件类型（可选）

#### 2. 获取组件详情
- **URL**: `GET /api/component/{id}`

#### 3. 创建组件
- **URL**: `POST /api/component`
- **Body**:
```json
{
  "name": "组件名称",
  "description": "组件描述",
  "componentType": "input",
  "defaultValue": "",
  "isRequired": false,
  "validationRule": "",
  "placeholder": "",
  "options": "[]",
  "apiUrl": "",
  "apiMethod": "GET",
  "apiHeaders": "{}",
  "apiParams": "{}"
}
```

#### 4. 更新组件
- **URL**: `PUT /api/component/{id}`
- **Body**: 同创建接口

#### 5. 删除组件
- **URL**: `DELETE /api/component/{id}`

### 接口转发接口

#### 转发API请求
- **URL**: `POST /api/forward`
- **Body**:
```json
{
  "url": "https://api.example.com/users",
  "method": "GET",
  "headers": {
    "Content-Type": "application/json"
  },
  "params": {
    "page": 1,
    "size": 10
  },
  "body": null,
  "componentId": "1",
  "componentName": "获取用户列表"
}
```

### 请求历史接口

#### 1. 获取请求历史列表
- **URL**: `GET /api/request/history`
- **参数**:
  - `current`: 当前页码
  - `size`: 每页大小
  - `keyword`: 搜索关键字（可选）
  - `componentId`: 组件ID（可选）

#### 2. 获取请求详情
- **URL**: `GET /api/request/{id}`

#### 3. 清空历史记录
- **URL**: `DELETE /api/request/history`

### 操作日志接口

#### 1. 获取操作日志列表
- **URL**: `GET /api/log/operation`
- **参数**:
  - `current`: 当前页码
  - `size`: 每页大小
  - `keyword`: 搜索关键字（可选）
  - `module`: 模块（可选）
  - `action`: 操作类型（可选）
  - `startTime`: 开始时间（可选）
  - `endTime`: 结束时间（可选）

#### 2. 获取日志详情
- **URL**: `GET /api/log/{id}`

## 组件类型说明

| 类型 | 说明 | 选项配置 |
|------|------|----------|
| input | 文本框 | 不需要 |
| select | 下拉框 | 需要JSON数组 |
| radio | 单选框 | 需要JSON数组 |
| checkbox | 多选框 | 需要JSON数组 |
| textarea | 文本域 | 不需要 |
| date | 日期选择 | 不需要 |
| number | 数字框 | 不需要 |

选项配置示例：
```json
[
  {"label": "选项1", "value": "value1"},
  {"label": "选项2", "value": "value2"}
]
```

## 生产部署

### 数据库切换到MySQL

修改 `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/component_config?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: root
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update
    database-platform: org.hibernate.dialect.MySQLDialect
```

### 前端构建部署

```bash
cd frontend
npm run build
```

将 `frontend/dist` 目录部署到Nginx或其他静态资源服务器。

## License

MIT
