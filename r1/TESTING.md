# 测试文档

## 测试类型

本项目包含以下测试：

### 1. 单元测试
- **engine/parser_test.go** - 测试规则表达式解析引擎
- **model/model_test.go** - 测试数据模型
- **repository/repository_test.go** - 测试数据访问层

### 2. 集成测试
- **handler/handler_test.go** - 测试 API 接口

## 如何运行测试

### 运行所有测试
```bash
go test -v ./...
```

### 运行特定包的测试
```bash
# 只测试引擎
go test -v ./engine

# 只测试模型
go test -v ./model

# 只测试数据访问层
go test -v ./repository

# 只测试处理器
go test -v ./handler
```

### 查看测试覆盖率
```bash
go test -cover ./...
```

### 生成 HTML 覆盖率报告
```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 测试覆盖的功能

### 规则引擎测试
- ✅ 简单比较运算 (> < >= <= == !=)
- ✅ AND 逻辑组合
- ✅ OR 逻辑组合
- ✅ 括号优先级
- ✅ 字段缺失处理
- ✅ JSON 数据处理

### 数据库操作测试
- ✅ 规则 CRUD
- ✅ 规则版本管理
- ✅ 样本数据操作
- ✅ 回测任务管理
- ✅ 批量操作

### API 接口测试
- ✅ 健康检查接口
- ✅ 规则创建/查询接口
- ✅ 样本数据创建接口
- ✅ 规则测试接口
- ✅ 回测任务创建/查询接口
- ✅ 完整工作流测试

## 手动测试指南

如果自动化测试无法运行，可以按以下步骤手动测试：

### 1. 启动服务
```bash
go run main.go
```

### 2. 测试健康检查
访问 http://localhost:8081/health

### 3. 测试规则创建
使用 curl 或 Postman 发送：
```bash
curl -X POST http://localhost:8081/api/v1/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Rule",
    "code": "TEST001",
    "description": "A test rule",
    "expression": "amount > 1000",
    "risk_level": "high"
  }'
```

### 4. 测试规则查询
```bash
curl http://localhost:8081/api/v1/rules
```

### 5. 测试规则引擎
```bash
curl -X POST http://localhost:8081/api/v1/test \
  -H "Content-Type: application/json" \
  -d '{
    "expression": "amount > 1000",
    "data": {"amount": 1500}
  }'
```

### 6. 测试样本创建
```bash
curl -X POST http://localhost:8081/api/v1/samples \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "BATCH001",
    "data": {"amount": 1500, "userLevel": "new"},
    "expected_result": "reject",
    "source": "manual_test"
  }'
```

### 7. 测试回测任务创建
```bash
curl -X POST http://localhost:8081/api/v1/backtests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Backtest",
    "description": "A test backtest",
    "rule_version_ids": [1],
    "sample_batch_ids": ["BATCH001"]
  }'
```

## 测试数据

### 示例规则表达式
```
amount > 1000
userLevel == "new"
ipRiskScore >= 80
amount > 1000 AND userLevel == "new"
(amount > 1000 OR ipRiskScore >= 80) AND country != "CN"
```

### 示例样本数据
```json
{
  "amount": 1500,
  "userLevel": "new",
  "ipRiskScore": 85,
  "country": "CN"
}
```

## 预期功能

系统应能完成以下操作：

1. ✅ **数据存储** - 创建规则、样本、任务后，数据应持久化在数据库
2. ✅ **数据查询** - 可以按ID、列表等方式查询数据
3. ✅ **数据修改** - 可以更新规则等数据
4. ✅ **规则引擎** - 能正确解析和评估规则表达式
5. ✅ **回测执行** - 能创建和执行回测任务
6. ✅ **结果分析** - 能生成回测统计结果

## 常见问题

### 测试失败排查
1. 确保数据库连接正常
2. 检查端口是否被占用
3. 查看服务器日志中的错误信息

### 数据库问题
如果 MySQL 连接有问题，可以修改 `config/config.go` 使用 SQLite 进行测试
