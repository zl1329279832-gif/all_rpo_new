# 社区团购管理系统

基于 Spring Boot + Vue 3 的前后端分离社区团购平台。

## 项目简介

社区团购管理系统是一个面向社区团购业务的全流程管理平台，支持运营人员、仓库人员、团长、配送员、管理员等多角色协作，覆盖商品批次、团购活动、用户订单、仓库分拣、线路配送、团长签收、售后退款、佣金计算和结算审核等完整业务链路。

## 技术栈

### 后端
- **框架**: Spring Boot 2.7.18
- **ORM**: MyBatis Plus 3.5.5
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **认证**: Spring Security + JWT
- **权限**: 基于角色的权限控制（RBAC）
- **Excel导出**: EasyExcel 3.3.2
- **工具库**: Hutool 5.8.25

### 前端
- **框架**: Vue 3.4 + Vite 5
- **UI组件**: Element Plus 2.5
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **图表**: ECharts 5
- **HTTP客户端**: Axios

## 业务功能

### 平台角色
1. **超级管理员**: 系统最高权限，管理用户、角色、权限
2. **运营人员**: 活动配置、商品管理、订单管理、售后处理、经营统计
3. **仓库人员**: 仓库分拣管理
4. **配送员**: 配送线路管理、配送进度跟踪
5. **团长**: 订单查看、签收管理、佣金结算

### 核心功能模块
1. **商品管理**: 商品信息、商品批次管理
2. **活动管理**: 团购活动配置、活动商品SKU、库存管理
3. **订单管理**: 订单创建、支付、取消、详情查询
4. **仓库分拣**: 分拣单创建、打印、分拣作业、差异处理
5. **配送管理**: 配送单创建、发车、到达、缺货登记
6. **团长签收**: 签收单创建、差异处理、签收确认
7. **售后处理**: 售后申请、审核、退款、完成
8. **佣金结算**: 佣金计算、结算单创建、审核、打款、导出
9. **经营统计**: 销售趋势、商品排行、团长业绩、售后统计

### 业务规则
- **活动库存校验**: 创建订单时扣减库存，使用乐观锁防止超卖
- **订单截单时间**: 截单时间后不允许下单
- **重复退款校验**: 同一订单项不能重复申请售后
- **团长签收差异**: 签收时记录数量差异和原因
- **配送缺货处理**: 配送时登记缺货数量和原因
- **佣金重复结算**: 防止同一佣金被多次结算
- **分布式锁**: Redis实现防重复提交和并发控制

## 项目结构

```
r49/
├── backend/                              # 后端项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/community/groupbuy/
│   │   │   │   ├── annotation/           # 自定义注解
│   │   │   │   ├── aspect/               # AOP切面
│   │   │   │   ├── common/               # 公共类
│   │   │   │   ├── config/               # 配置类
│   │   │   │   ├── controller/           # 控制器
│   │   │   │   ├── dto/                  # 数据传输对象
│   │   │   │   ├── entity/               # 实体类
│   │   │   │   ├── exception/            # 异常处理
│   │   │   │   ├── mapper/               # 数据访问层
│   │   │   │   ├── security/             # 安全认证
│   │   │   │   ├── service/              # 业务逻辑层
│   │   │   │   ├── task/                 # 定时任务
│   │   │   │   ├── vo/                   # 视图对象
│   │   │   │   └── GroupBuyApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml       # 主配置
│   │   │       ├── application-dev.yml   # 开发环境配置
│   │   │       └── logback-spring.xml    # 日志配置
│   │   └── test/
│   ├── sql/
│   │   ├── schema.sql                    # 数据库表结构
│   │   └── data.sql                      # 测试数据
│   └── pom.xml
├── frontend/                             # 前端项目
│   ├── src/
│   │   ├── api/                          # API接口
│   │   ├── layout/                       # 布局组件
│   │   ├── router/                       # 路由配置
│   │   ├── store/                        # 状态管理
│   │   ├── styles/                       # 全局样式
│   │   ├── utils/                        # 工具函数
│   │   ├── views/                        # 页面组件
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

## 快速开始

### 环境要求
- JDK 1.8+
- Node.js 16+
- MySQL 8.0+
- Redis 5.0+
- Maven 3.6+

### 数据库初始化

1. 创建数据库
```sql
CREATE DATABASE community_groupbuy DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

2. 执行表结构脚本
```bash
mysql -u root -p community_groupbuy < backend/sql/schema.sql
```

3. 执行测试数据脚本（可选）
```bash
mysql -u root -p community_groupbuy < backend/sql/data.sql
```

### 后端启动

1. 修改数据库和Redis配置
```bash
cd backend
# 编辑 src/main/resources/application-dev.yml
# 修改 MySQL 和 Redis 连接信息
```

2. 启动应用
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务启动后访问: http://localhost:8080/api

### 前端启动

1. 安装依赖
```bash
cd frontend
npm install
```

2. 启动开发服务
```bash
npm run dev
```

前端服务启动后访问: http://localhost:5173

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 超级管理员 | admin | 123456 |
| 运营人员 | operator1 | 123456 |
| 仓库人员 | warehouse1 | 123456 |
| 配送员 | delivery1 | 123456 |
| 团长 | leader1 | 123456 |

## 数据库表说明

| 表名 | 说明 |
|------|------|
| sys_user | 用户表 |
| sys_role | 角色表 |
| sys_user_role | 用户角色关联表 |
| sys_permission | 权限表 |
| sys_role_permission | 角色权限关联表 |
| product | 商品表 |
| product_batch | 商品批次表 |
| group_activity | 团购活动表 |
| group_activity_sku | 活动商品SKU表 |
| user_order | 用户订单表 |
| order_item | 订单明细表 |
| warehouse_sort | 仓库分拣表 |
| warehouse_sort_item | 分拣明细表 |
| delivery_route | 配送线路表 |
| delivery_order | 配送单表 |
| delivery_item | 配送明细表 |
| leader_receipt | 团长签收表 |
| receipt_item | 签收明细表 |
| after_sale | 售后表 |
| after_sale_item | 售后明细表 |
| commission | 佣金表 |
| settlement | 结算单表 |
| settlement_item | 结算明细表 |

## API接口说明

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/info` - 获取当前用户信息

### 系统管理
- `GET /api/system/user/page` - 用户分页查询
- `POST /api/system/user` - 新增用户
- `PUT /api/system/user` - 修改用户
- `DELETE /api/system/user/{id}` - 删除用户

### 商品管理
- `GET /api/product/page` - 商品分页查询
- `POST /api/product` - 新增商品
- `PUT /api/product` - 修改商品
- `DELETE /api/product/{id}` - 删除商品

### 活动管理
- `GET /api/activity/page` - 活动分页查询
- `POST /api/activity` - 创建活动
- `PUT /api/activity` - 修改活动
- `DELETE /api/activity/{id}` - 删除活动
- `PUT /api/activity/{id}/status` - 更新活动状态

### 订单管理
- `GET /api/order/page` - 订单分页查询
- `GET /api/order/{id}` - 订单详情
- `POST /api/order` - 创建订单
- `PUT /api/order/{id}/cancel` - 取消订单
- `PUT /api/order/{id}/pay` - 支付订单

### 分拣管理
- `GET /api/warehouse/sort/page` - 分拣单分页查询
- `POST /api/warehouse/sort` - 创建分拣单
- `PUT /api/warehouse/sort/{id}/print` - 打印分拣单
- `PUT /api/warehouse/sort/{id}/start` - 开始分拣
- `PUT /api/warehouse/sort/{id}/complete` - 完成分拣

### 配送管理
- `GET /api/delivery/order/page` - 配送单分页查询
- `POST /api/delivery/order` - 创建配送单
- `PUT /api/delivery/order/{id}/depart` - 发车
- `PUT /api/delivery/order/{id}/arrive` - 到达
- `PUT /api/delivery/order/{id}/complete` - 完成配送

### 售后管理
- `GET /api/after-sale/page` - 售后分页查询
- `POST /api/after-sale` - 申请售后
- `PUT /api/after-sale/{id}/audit` - 审核售后
- `PUT /api/after-sale/{id}/complete` - 完成售后

### 结算管理
- `GET /api/settlement/page` - 结算单分页查询
- `POST /api/settlement` - 创建结算单
- `PUT /api/settlement/{id}/audit` - 审核结算
- `PUT /api/settlement/{id}/complete` - 完成结算
- `GET /api/settlement/{id}/export` - 导出结算表

### 统计接口
- `GET /api/statistics/overview` - 经营概览
- `GET /api/statistics/sales-trend` - 销售趋势
- `GET /api/statistics/product-rank` - 商品销量排行
- `GET /api/statistics/leader-rank` - 团长业绩排行
- `GET /api/statistics/after-sale` - 售后统计

## 定时任务

系统内置以下定时任务（可在 application.yml 中配置 cron 表达式）：

1. **每日自动结算**: 每日凌晨1点自动统计各团长待结算佣金并生成结算单
2. **活动状态自动更新**: 每小时检查并更新活动状态（未开始→进行中→已结束）
3. **过期订单自动取消**: 每半小时检查并取消超时未支付订单

## 开发规范

### 后端规范
- 使用 RESTful API 设计风格
- 统一返回格式：`Result<T>`
- 统一异常处理：`GlobalExceptionHandler`
- 事务注解：`@Transactional(rollbackFor = Exception.class)`
- 参数校验：使用 `@Valid` + JSR-380 注解

### 前端规范
- 使用 Vue 3 Composition API + `<script setup>`
- 组件命名：大驼峰命名法
- API接口统一放在 `src/api/` 目录
- 状态管理使用 Pinia
- 路由懒加载优化首屏加载速度

## 部署说明

### 后端部署
```bash
cd backend
mvn clean package -DskipTests
java -jar target/groupbuy-1.0.0.jar --spring.profiles.active=prod
```

### 前端部署
```bash
cd frontend
npm run build
# 将 dist 目录部署到 Nginx 或其他 Web 服务器
```

### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态资源
    location / {
        root /var/www/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 许可证

MIT License
