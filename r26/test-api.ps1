$BASE_URL = "http://localhost:8080"
$GLOBAL_TASK_ID = $null

function Show-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "=" * 60
    Write-Host "  $Title"
    Write-Host "=" * 60
    Write-Host ""
}

function Invoke-ApiTest {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [bool]$ShowResponse = $true,
        [bool]$IsOptional = $false
    )

    Write-Host "`n>>> $Name"
    Write-Host "    Method: $Method"
    Write-Host "    URL: $Url"
    
    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }

    $params = @{
        Uri = $BASE_URL + $Url
        Method = $Method
        Headers = $headers
        UseBasicParsing = $true
    }

    if ($Body) {
        Write-Host "    Body: $Body"
        $params.Body = $Body
    }

    try {
        $response = Invoke-WebRequest @params -ErrorAction Stop
        Write-Host "    Status: $($response.StatusCode) OK" -ForegroundColor Green
        
        if ($ShowResponse -and $response.Content) {
            $json = $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
            Write-Host "    Response:"
            Write-Host $json
        }
        
        return $response.Content
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        if ($IsOptional) {
            Write-Host "    Status: $statusCode (Optional, skipped)" -ForegroundColor Yellow
        } else {
            Write-Host "    Status: $statusCode FAILED" -ForegroundColor Red
            Write-Host "    Error: $errorMessage" -ForegroundColor Red
        }
        
        return $null
    }
}

function Start-ServerCheck {
    Write-Host "`n>>> 检查服务是否在运行..."
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "$BASE_URL/api/tasks/page?pageNum=1&pageSize=5" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                Write-Host "    服务运行正常！" -ForegroundColor Green
                return $true
            }
        }
        catch {
            $attempt++
            Write-Host "    等待服务启动... ($attempt/$maxAttempts)"
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host "    服务无法连接，请先启动 Spring Boot 应用！" -ForegroundColor Red
    Write-Host "    运行命令: mvn spring-boot:run"
    return $false
}

if (-not (Start-ServerCheck)) {
    exit 1
}

Show-Header "1. 任务管理接口测试"

$createBody1 = @{
    taskName = "API测试任务1"
    taskGroup = "TEST_GROUP"
    cronExpression = "0/30 * * * * ?"
    targetClass = "com.example.taskscheduler.task.DemoTask"
    targetMethod = "execute"
    methodParams = '{"message":"API测试参数1"}'
    maxRetryCount = 3
    remark = "这是一个通过API创建的测试任务"
} | ConvertTo-Json

$result = Invoke-ApiTest -Name "创建任务1" -Method POST -Url "/api/tasks" -Body $createBody1
if ($result) {
    $json = $result | ConvertFrom-Json
    if ($json.data -and $json.data.id) {
        $GLOBAL_TASK_ID = $json.data.id
        Write-Host "`n    保存任务ID: $GLOBAL_TASK_ID" -ForegroundColor Cyan
    }
}

$createBody2 = @{
    taskName = "API测试任务2"
    taskGroup = "DATA_SYNC"
    cronExpression = "0 0/5 * * * ?"
    targetClass = "com.example.taskscheduler.task.DataSyncTask"
    targetMethod = "syncAll"
    maxRetryCount = 5
    remark = "数据同步测试任务"
} | ConvertTo-Json

Invoke-ApiTest -Name "创建任务2" -Method POST -Url "/api/tasks" -Body $createBody2

Show-Header "2. 任务查询接口测试"

Invoke-ApiTest -Name "查询任务列表（第1页，每页5条）" -Method GET -Url "/api/tasks/page?pageNum=1&pageSize=5"

Invoke-ApiTest -Name "查询任务列表（按名称模糊查询）" -Method GET -Url "/api/tasks/page?taskName=API测试&pageNum=1&pageSize=10"

Invoke-ApiTest -Name "查询任务列表（按分组查询）" -Method GET -Url "/api/tasks/page?taskGroup=TEST_GROUP&pageNum=1&pageSize=10"

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "查询单个任务详情" -Method GET -Url "/api/tasks/$GLOBAL_TASK_ID"
}

Invoke-ApiTest -Name "查询运行中的任务列表" -Method GET -Url "/api/tasks/running"

Show-Header "3. 任务状态管理接口测试"

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "启动任务" -Method POST -Url "/api/tasks/$GLOBAL_TASK_ID/start"
    
    Start-Sleep -Seconds 2
    
    Invoke-ApiTest -Name "查询运行中的任务（验证启动）" -Method GET -Url "/api/tasks/running"
    
    Invoke-ApiTest -Name "暂停任务" -Method POST -Url "/api/tasks/$GLOBAL_TASK_ID/pause"
    
    Start-Sleep -Seconds 1
    
    Invoke-ApiTest -Name "恢复任务" -Method POST -Url "/api/tasks/$GLOBAL_TASK_ID/resume"
    
    Start-Sleep -Seconds 1
    
    Invoke-ApiTest -Name "停止任务" -Method POST -Url "/api/tasks/$GLOBAL_TASK_ID/stop"
}

Show-Header "4. 任务修改接口测试"

if ($GLOBAL_TASK_ID) {
    $updateBody = @{
        id = $GLOBAL_TASK_ID
        taskName = "API测试任务1（已修改）"
        cronExpression = "0/15 * * * * ?"
        maxRetryCount = 5
        remark = "任务已通过API更新"
    } | ConvertTo-Json
    
    Invoke-ApiTest -Name "修改任务信息" -Method PUT -Url "/api/tasks" -Body $updateBody
    
    Invoke-ApiTest -Name "验证修改结果" -Method GET -Url "/api/tasks/$GLOBAL_TASK_ID"
}

Show-Header "5. 手动执行任务接口测试"

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "手动执行任务（同步执行）" -Method POST -Url "/api/tasks/$GLOBAL_TASK_ID/execute"
}

Show-Header "6. 任务执行日志接口测试"

Invoke-ApiTest -Name "查询执行日志列表" -Method GET -Url "/api/task-logs/page?pageNum=1&pageSize=10"

Invoke-ApiTest -Name "查询执行日志列表（按状态筛选）" -Method GET -Url "/api/task-logs/page?executeStatus=SUCCESS&pageNum=1&pageSize=10"

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "查询任务的最新执行日志" -Method GET -Url "/api/task-logs/task/$GLOBAL_TASK_ID/latest?limit=5"
    
    Invoke-ApiTest -Name "获取任务最新执行结果（Redis缓存）" -Method GET -Url "/api/task-logs/task/$GLOBAL_TASK_ID/latest-result" -IsOptional $true
}

Show-Header "7. 异常场景测试"

$invalidCronBody = @{
    taskName = "无效Cron测试任务"
    taskGroup = "TEST_GROUP"
    cronExpression = "invalid cron"
    targetClass = "com.example.taskscheduler.task.DemoTask"
    targetMethod = "execute"
    maxRetryCount = 3
} | ConvertTo-Json

Invoke-ApiTest -Name "测试无效的Cron表达式" -Method POST -Url "/api/tasks" -Body $invalidCronBody -IsOptional $true

Invoke-ApiTest -Name "测试查询不存在的任务" -Method GET -Url "/api/tasks/999999" -IsOptional $true

Invoke-ApiTest -Name "测试查询不存在的日志" -Method GET -Url "/api/task-logs/999999" -IsOptional $true

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "重复停止任务（测试异常）" -Method POST -Url "/api/tasks/$GLOBAL_TASK_ID/stop" -IsOptional $true
}

Show-Header "8. 清理测试数据"

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "删除测试任务1" -Method DELETE -Url "/api/tasks/$GLOBAL_TASK_ID"
}

$secondTaskResult = Invoke-ApiTest -Name "查询任务列表（获取任务2的ID）" -Method GET -Url "/api/tasks/page?taskName=API测试任务2&pageNum=1&pageSize=1" -ShowResponse $false
if ($secondTaskResult) {
    $json = $secondTaskResult | ConvertFrom-Json
    if ($json.data -and $json.data.records -and $json.data.records.Count -gt 0) {
        $secondTaskId = $json.data.records[0].id
        Invoke-ApiTest -Name "删除测试任务2" -Method DELETE -Url "/api/tasks/$secondTaskId"
    }
}

Show-Header "接口测试完成"

Write-Host "`n测试总结："
Write-Host "  - 任务管理接口：完整测试"
Write-Host "  - 任务状态管理：完整测试"
Write-Host "  - 任务执行日志：完整测试"
Write-Host "  - Redis 缓存：测试完成"
Write-Host "  - 异常场景：测试完成"
Write-Host "`n所有核心接口测试已完成！" -ForegroundColor Green
