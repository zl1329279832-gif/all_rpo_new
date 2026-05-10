#!/bin/bash

BASE_URL="http://localhost:8080"
GLOBAL_TASK_ID=""

print_header() {
    echo ""
    echo "============================================================"
    echo "  $1"
    echo "============================================================"
    echo ""
}

api_test() {
    local name="$1"
    local method="$2"
    local url="$3"
    local body="$4"
    local is_optional="${5:-false}"
    
    echo ""
    echo ">>> $name"
    echo "    Method: $method"
    echo "    URL: $BASE_URL$url"
    
    if [ -n "$body" ]; then
        echo "    Body: $body"
        response=$(curl -s -X "$method" "$BASE_URL$url" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -d "$body" \
            --write-out " HTTP:%{http_code}")
    else
        response=$(curl -s -X "$method" "$BASE_URL$url" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            --write-out " HTTP:%{http_code}")
    fi
    
    http_code=$(echo "$response" | grep -oP 'HTTP:\K[0-9]+')
    body=$(echo "$response" | sed 's/ HTTP:[0-9]*$//')
    
    if [[ "$http_code" == "200" ]]; then
        echo -e "\e[32m    Status: $http_code OK\e[0m"
        if [ -n "$body" ]; then
            echo "    Response:"
            echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        fi
        echo "$body"
        return 0
    else
        if [ "$is_optional" = "true" ]; then
            echo -e "\e[33m    Status: $http_code (Optional, skipped)\e[0m"
        else
            echo -e "\e[31m    Status: $http_code FAILED\e[0m"
            echo "    Error: $body"
        fi
        return 1
    fi
}

check_server() {
    echo ""
    echo ">>> 检查服务是否在运行..."
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        response=$(curl -s -o /dev/null -w "%{http_code}" \
            "$BASE_URL/api/tasks/page?pageNum=1&pageSize=5" \
            --max-time 2)
        if [ "$response" = "200" ]; then
            echo -e "\e[32m    服务运行正常！\e[0m"
            return 0
        fi
        attempt=$((attempt + 1))
        echo "    等待服务启动... ($attempt/$max_attempts)"
        sleep 2
    done
    
    echo -e "\e[31m    服务无法连接，请先启动 Spring Boot 应用！\e[0m"
    echo "    运行命令: mvn spring-boot:run"
    return 1
}

if ! check_server; then
    exit 1
fi

print_header "1. 任务管理接口测试"

create_body1='{
    "taskName": "API测试任务1",
    "taskGroup": "TEST_GROUP",
    "cronExpression": "0/30 * * * * ?",
    "targetClass": "com.example.taskscheduler.task.DemoTask",
    "targetMethod": "execute",
    "methodParams": "{\"message\":\"API测试参数1\"}",
    "maxRetryCount": 3,
    "remark": "这是一个通过API创建的测试任务"
}'

result=$(api_test "创建任务1" "POST" "/api/tasks" "$create_body1")
if [ $? -eq 0 ] && [ -n "$result" ]; then
    GLOBAL_TASK_ID=$(echo "$result" | grep -oP '"id":\K[0-9]+' | head -1)
    echo ""
    echo -e "\e[36m    保存任务ID: $GLOBAL_TASK_ID\e[0m"
fi

create_body2='{
    "taskName": "API测试任务2",
    "taskGroup": "DATA_SYNC",
    "cronExpression": "0 0/5 * * * ?",
    "targetClass": "com.example.taskscheduler.task.DataSyncTask",
    "targetMethod": "syncAll",
    "maxRetryCount": 5,
    "remark": "数据同步测试任务"
}'

api_test "创建任务2" "POST" "/api/tasks" "$create_body2"

print_header "2. 任务查询接口测试"

api_test "查询任务列表（第1页，每页5条）" "GET" "/api/tasks/page?pageNum=1&pageSize=5"

api_test "查询任务列表（按名称模糊查询）" "GET" "/api/tasks/page?taskName=API%E6%B5%8B%E8%AF%95&pageNum=1&pageSize=10"

api_test "查询任务列表（按分组查询）" "GET" "/api/tasks/page?taskGroup=TEST_GROUP&pageNum=1&pageSize=10"

if [ -n "$GLOBAL_TASK_ID" ]; then
    api_test "查询单个任务详情" "GET" "/api/tasks/$GLOBAL_TASK_ID"
fi

api_test "查询运行中的任务列表" "GET" "/api/tasks/running"

print_header "3. 任务状态管理接口测试"

if [ -n "$GLOBAL_TASK_ID" ]; then
    api_test "启动任务" "POST" "/api/tasks/$GLOBAL_TASK_ID/start"
    
    sleep 2
    
    api_test "查询运行中的任务（验证启动）" "GET" "/api/tasks/running"
    
    api_test "暂停任务" "POST" "/api/tasks/$GLOBAL_TASK_ID/pause"
    
    sleep 1
    
    api_test "恢复任务" "POST" "/api/tasks/$GLOBAL_TASK_ID/resume"
    
    sleep 1
    
    api_test "停止任务" "POST" "/api/tasks/$GLOBAL_TASK_ID/stop"
fi

print_header "4. 任务修改接口测试"

if [ -n "$GLOBAL_TASK_ID" ]; then
    update_body="{
        \"id\": $GLOBAL_TASK_ID,
        \"taskName\": \"API测试任务1（已修改）\",
        \"cronExpression\": \"0/15 * * * * ?\",
        \"maxRetryCount\": 5,
        \"remark\": \"任务已通过API更新\"
    }"
    
    api_test "修改任务信息" "PUT" "/api/tasks" "$update_body"
    
    api_test "验证修改结果" "GET" "/api/tasks/$GLOBAL_TASK_ID"
fi

print_header "5. 手动执行任务接口测试"

if [ -n "$GLOBAL_TASK_ID" ]; then
    api_test "手动执行任务（同步执行）" "POST" "/api/tasks/$GLOBAL_TASK_ID/execute"
fi

print_header "6. 任务执行日志接口测试"

api_test "查询执行日志列表" "GET" "/api/task-logs/page?pageNum=1&pageSize=10"

api_test "查询执行日志列表（按状态筛选）" "GET" "/api/task-logs/page?executeStatus=SUCCESS&pageNum=1&pageSize=10"

if [ -n "$GLOBAL_TASK_ID" ]; then
    api_test "查询任务的最新执行日志" "GET" "/api/task-logs/task/$GLOBAL_TASK_ID/latest?limit=5"
    
    api_test "获取任务最新执行结果（Redis缓存）" "GET" "/api/task-logs/task/$GLOBAL_TASK_ID/latest-result" "" "true"
fi

print_header "7. 异常场景测试"

invalid_cron_body='{
    "taskName": "无效Cron测试任务",
    "taskGroup": "TEST_GROUP",
    "cronExpression": "invalid cron",
    "targetClass": "com.example.taskscheduler.task.DemoTask",
    "targetMethod": "execute",
    "maxRetryCount": 3
}'

api_test "测试无效的Cron表达式" "POST" "/api/tasks" "$invalid_cron_body" "true"

api_test "测试查询不存在的任务" "GET" "/api/tasks/999999" "" "true"

api_test "测试查询不存在的日志" "GET" "/api/task-logs/999999" "" "true"

if [ -n "$GLOBAL_TASK_ID" ]; then
    api_test "重复停止任务（测试异常）" "POST" "/api/tasks/$GLOBAL_TASK_ID/stop" "" "true"
fi

print_header "8. 清理测试数据"

if [ -n "$GLOBAL_TASK_ID" ]; then
    api_test "删除测试任务1" "DELETE" "/api/tasks/$GLOBAL_TASK_ID"
fi

print_header "接口测试完成"

echo ""
echo "测试总结："
echo "  - 任务管理接口：完整测试"
echo "  - 任务状态管理：完整测试"
echo "  - 任务执行日志：完整测试"
echo "  - Redis 缓存：测试完成"
echo "  - 异常场景：测试完成"
echo ""
echo -e "\e[32m所有核心接口测试已完成！\e[0m"
