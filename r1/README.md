# 规则引擎风控回测系统

基于 Go 1.22 + Gin + GORM + MySQL 构建的风险控制规则引擎回测系统，用于模拟金融、订单或用户行为场景下的风险规则判断。

## 功能特性

- **规则配置管理**：创建、编辑、删除风控规则
- **规则版本管理**：自动保存规则版本，支持历史版本回溯
- **样本数据管理**：导入历史数据样本用于回测
- **规则表达式解析**：支持 `>`, `<`, `>=`, `<=`, `==`, `!=` 等操作符，支持 `AND` / `OR` 条件组合
- **回测执行**：选择规则版本和样本数据执行批量回测
- **结果统计**：命中率、通过率、拒绝率、误伤率、规则贡献度等
- **详细报告**：回测结果明细、规则命中明细

## 项目结构

```
r1/
├── config/         # 配置管理
├── engine/         # 规则引擎
├── handler/        # HTTP 处理器
├── middleware/     # 中间件
├── model/          # 数据模型
├── repository/     # 数据访问层
├── router/         # 路由配置
├── service/        # 业务逻辑层
├── sql/            # 数据库脚本
├── docs/           # 文档
├── main.go         # 程序入口
├── go.mod
├── go.sum
└── README.md
```

## 快速开始

### 1. 环境要求

- Go 1.22+
- MySQL 5.7+

### 2. 数据库准备

创建数据库：

```sql
CREATE DATABASE risk_engine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

执行建表脚本：

```bash
mysql -u root -p risk_engine < sql/schema.sql
```

### 3. 配置环境变量

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=risk_engine
export SERVER_PORT=8081
```

### 4. 安装依赖

```bash
go mod download
```

### 5. 运行服务

```bash
go run main.go
```

服务将在 `http://localhost:8080` 启动。

## API 文档

### 健康检查

```http
GET /health
```

### 规则管理

#### 创建规则

```http
POST /api/v1/rules
Content-Type: application/json

{
  "name": "大额交易规则",
  "code": "RULE_001",
  "description": "交易金额超过10000元",
  "expression": "amount > 10000",
  "risk_level": "high"
}
```

#### 查询规则列表

```http
GET /api/v1/rules?offset=0&limit=20
```

#### 查询单个规则

```http
GET /api/v1/rules/:id
```

#### 更新规则

```http
PUT /api/v1/rules/:id
Content-Type: application/json

{
  "name": "大额交易规则",
  "expression": "amount > 15000",
  "risk_level": "medium",
  "status": "active"
}
```

#### 查询规则版本

```http
GET /api/v1/rules/:id/versions
```

### 样本数据管理

#### 创建单条样本

```http
POST /api/v1/samples
Content-Type: application/json

{
  "batch_id": "BATCH_001",
  "data": {
    "amount": 12000,
    "userLevel": "new",
    "ipRiskScore": 85
  },
  "expected_result": "reject",
  "source": "historical_data"
}
```

#### 批量创建样本

```http
POST /api/v1/samples/batch
Content-Type: application/json

{
  "batch_id": "BATCH_001",
  "source": "historical_data",
  "samples": [
    {
      "data": {
        "amount": 12000,
        "userLevel": "new"
      },
      "expected_result": "reject"
    },
    {
      "data": {
        "amount": 500,
        "userLevel": "vip"
      },
      "expected_result": "pass"
    }
  ]
}
```

#### 查询样本列表

```http
GET /api/v1/samples?offset=0&limit=20
```

### 回测任务管理

#### 创建回测任务

```http
POST /api/v1/backtests
Content-Type: application/json

{
  "name": "第一轮回测",
  "description": "测试新规则集",
  "rule_version_ids": [1, 2, 3],
  "sample_batch_ids": ["BATCH_001"]
}
```

#### 查询回测任务列表

```http
GET /api/v1/backtests?offset=0&limit=20
```

#### 执行回测

```http
POST /api/v1/backtests/:id/run
```

#### 查询回测任务详情

```http
GET /api/v1/backtests/:id
```

#### 查询回测结果

```http
GET /api/v1/backtests/:id/results?offset=0&limit=20
```

#### 查询规则命中明细

```http
GET /api/v1/backtests/:id/details
```

### 规则测试

```http
POST /api/v1/test
Content-Type: application/json

{
  "expression": "amount > 1000 AND userLevel == \"new\"",
  "data": {
    "amount": 1500,
    "userLevel": "new"
  }
}
```

## 规则表达式语法

### 基本操作符

- `>` : 大于
- `<` : 小于
- `>=` : 大于等于
- `<=` : 小于等于
- `==` : 等于
- `!=` : 不等于

### 逻辑操作符

- `AND` : 与
- `OR` : 或

### 示例

```
# 简单条件
amount > 10000
userLevel == "new"
ipRiskScore >= 80

# AND 组合
amount > 1000 AND userLevel == "new"

# OR 组合
ipRiskScore >= 80 OR country != "CN"

# 复杂组合 (支持括号)
(amount > 10000 AND userLevel == "new") OR ipRiskScore >= 90
```

## 回测流程说明

1. **创建规则**：定义风控规则表达式，系统自动创建初始版本
2. **导入样本**：准备历史数据样本，可标注预期结果用于准确性验证
3. **创建回测任务**：选择要测试的规则版本和样本批次
4. **执行回测**：后台异步执行，可实时查看进度
5. **查看报告**：查看统计摘要、样本结果明细、规则命中详情
6. **分析优化**：根据回测结果调整规则，创建新版本再次回测

## 数据库表说明

| 表名 | 说明 |
|------|------|
| rules | 规则主表 |
| rule_versions | 规则版本表 |
| samples | 样本数据表 |
| backtest_tasks | 回测任务表 |
| backtest_results | 回测结果表 |
| rule_hit_details | 规则命中明细表 |

## 示例数据

### 示例规则

1. **大额交易**：`amount > 10000`
2. **新用户**：`userLevel == "new"`
3. **高风险IP**：`ipRiskScore >= 80`
4. **组合规则**：`amount > 5000 AND userLevel == "new"`

### 示例样本

```json
{
  "batch_id": "TEST_BATCH_01",
  "samples": [
    {
      "data": {"amount": 12000, "userLevel": "new", "ipRiskScore": 70},
      "expected_result": "reject"
    },
    {
      "data": {"amount": 3000, "userLevel": "vip", "ipRiskScore": 20},
      "expected_result": "pass"
    },
    {
      "data": {"amount": 8000, "userLevel": "new", "ipRiskScore": 85},
      "expected_result": "reject"
    }
  ]
}
```

## 许可证

MIT
