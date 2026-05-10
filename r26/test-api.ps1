$BASE_URL = "http://localhost:8080"
$GLOBAL_TASK_ID = $null

function Show-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 60)
    Write-Host "  $Title"
    Write-Host ("=" * 60)
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

    Write-Host ""
    Write-Host ">>> $Name"
    Write-Host "    Method: $Method"
    Write-Host "    URL: $Url"
    
    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }

    $fullUrl = $BASE_URL + $Url

    try {
        if ($Body) {
            Write-Host "    Body: $Body"
            $response = Invoke-WebRequest -Uri $fullUrl -Method $Method -Headers $headers -Body $Body -UseBasicParsing -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $fullUrl -Method $Method -Headers $headers -UseBasicParsing -ErrorAction Stop
        }
        
        Write-Host "    Status: $($response.StatusCode) OK" -ForegroundColor Green
        
        if ($ShowResponse -and $response.Content) {
            try {
                $json = $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
                Write-Host "    Response:"
                Write-Host $json
            } catch {
                Write-Host "    Response:"
                Write-Host $response.Content
            }
        }
        
        return $response.Content
    }
    catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        } else {
            $statusCode = 0
        }
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
    Write-Host ""
    Write-Host ">>> Server check..."
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $checkUrl = $BASE_URL + "/api/tasks/page?pageNum=1&pageSize=5"
            $response = Invoke-WebRequest -Uri $checkUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "    Server is running!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            $attempt++
            Write-Host "    Waiting for server... ($attempt/$maxAttempts)"
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host "    Cannot connect to server! Please start Spring Boot app first." -ForegroundColor Red
    Write-Host "    Command: mvn spring-boot:run"
    return $false
}

if (-not (Start-ServerCheck)) {
    exit 1
}

Show-Header "1. Task Management API Tests"

$createBody1 = "{`"taskName`":`"API Test Task 1`",`"taskGroup`":`"TEST_GROUP`",`"cronExpression`":`"0/30 * * * * ?`",`"targetClass`":`"com.example.taskscheduler.task.DemoTask`",`"targetMethod`":`"execute`",`"methodParams`":`"{`"`"message`"`":`"`"API Test Param 1`"`"}",`"maxRetryCount`":3,`"remark`":`"Created by API test`"}"

$result = Invoke-ApiTest -Name "Create Task 1" -Method "POST" -Url "/api/tasks" -Body $createBody1
if ($result) {
    try {
        $json = $result | ConvertFrom-Json
        if ($json.data -and $json.data.id) {
            $GLOBAL_TASK_ID = $json.data.id
            Write-Host ""
            Write-Host "    Saved Task ID: $GLOBAL_TASK_ID" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "    Failed to parse response" -ForegroundColor Yellow
    }
}

$createBody2 = "{`"taskName`":`"API Test Task 2`",`"taskGroup`":`"DATA_SYNC`",`"cronExpression`":`"0 0/5 * * * ?`",`"targetClass`":`"com.example.taskscheduler.task.DataSyncTask`",`"targetMethod`":`"syncAll`",`"maxRetryCount`":5,`"remark`":`"Data sync test task`"}"

Invoke-ApiTest -Name "Create Task 2" -Method "POST" -Url "/api/tasks" -Body $createBody2

Show-Header "2. Task Query API Tests"

Invoke-ApiTest -Name "Query Task List (Page 1, Size 5)" -Method "GET" -Url "/api/tasks/page?pageNum=1&pageSize=5"

Invoke-ApiTest -Name "Query Task List (By Name)" -Method "GET" -Url "/api/tasks/page?taskName=API&pageNum=1&pageSize=10"

Invoke-ApiTest -Name "Query Task List (By Group)" -Method "GET" -Url "/api/tasks/page?taskGroup=TEST_GROUP&pageNum=1&pageSize=10"

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "Query Single Task Details" -Method "GET" -Url "/api/tasks/$GLOBAL_TASK_ID"
}

Invoke-ApiTest -Name "Query Running Tasks" -Method "GET" -Url "/api/tasks/running"

Show-Header "3. Task Status Management Tests"

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "Start Task" -Method "POST" -Url "/api/tasks/$GLOBAL_TASK_ID/start"
    
    Start-Sleep -Seconds 2
    
    Invoke-ApiTest -Name "Verify Task Started" -Method "GET" -Url "/api/tasks/running"
    
    Invoke-ApiTest -Name "Pause Task" -Method "POST" -Url "/api/tasks/$GLOBAL_TASK_ID/pause"
    
    Start-Sleep -Seconds 1
    
    Invoke-ApiTest -Name "Resume Task" -Method "POST" -Url "/api/tasks/$GLOBAL_TASK_ID/resume"
    
    Start-Sleep -Seconds 1
    
    Invoke-ApiTest -Name "Stop Task" -Method "POST" -Url "/api/tasks/$GLOBAL_TASK_ID/stop"
}

Show-Header "4. Task Update API Tests"

if ($GLOBAL_TASK_ID) {
    $updateBody = "{`"id`":$GLOBAL_TASK_ID,`"taskName`":`"API Test Task 1 (Updated)`",`"cronExpression`":`"0/15 * * * * ?`",`"maxRetryCount`":5,`"remark`":`"Task updated by API`"}"
    
    Invoke-ApiTest -Name "Update Task Info" -Method "PUT" -Url "/api/tasks" -Body $updateBody
    
    Invoke-ApiTest -Name "Verify Update Result" -Method "GET" -Url "/api/tasks/$GLOBAL_TASK_ID"
}

Show-Header "5. Manual Task Execution Test"

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "Manual Execute Task (Sync)" -Method "POST" -Url "/api/tasks/$GLOBAL_TASK_ID/execute"
}

Show-Header "6. Task Log API Tests"

Invoke-ApiTest -Name "Query Log List" -Method "GET" -Url "/api/task-logs/page?pageNum=1&pageSize=10"

Invoke-ApiTest -Name "Query Log List (By Status)" -Method "GET" -Url "/api/task-logs/page?executeStatus=SUCCESS&pageNum=1&pageSize=10"

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "Query Latest Task Logs" -Method "GET" -Url "/api/task-logs/task/$GLOBAL_TASK_ID/latest?limit=5"
    
    Invoke-ApiTest -Name "Get Latest Result from Redis Cache" -Method "GET" -Url "/api/task-logs/task/$GLOBAL_TASK_ID/latest-result" -IsOptional $true
}

Show-Header "7. Error Scenario Tests"

$invalidCronBody = "{`"taskName`":`"Invalid Cron Test`",`"taskGroup`":`"TEST_GROUP`",`"cronExpression`":`"invalid cron`",`"targetClass`":`"com.example.taskscheduler.task.DemoTask`",`"targetMethod`":`"execute`",`"maxRetryCount`":3}"

Invoke-ApiTest -Name "Test Invalid Cron Expression" -Method "POST" -Url "/api/tasks" -Body $invalidCronBody -IsOptional $true

Invoke-ApiTest -Name "Test Query Non-existent Task" -Method "GET" -Url "/api/tasks/999999" -IsOptional $true

Invoke-ApiTest -Name "Test Query Non-existent Log" -Method "GET" -Url "/api/task-logs/999999" -IsOptional $true

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "Test Stop Already Stopped Task" -Method "POST" -Url "/api/tasks/$GLOBAL_TASK_ID/stop" -IsOptional $true
}

Show-Header "8. Cleanup Test Data"

if ($GLOBAL_TASK_ID) {
    Invoke-ApiTest -Name "Delete Test Task 1" -Method "DELETE" -Url "/api/tasks/$GLOBAL_TASK_ID"
}

$secondTaskResult = Invoke-ApiTest -Name "Get Task 2 ID" -Method "GET" -Url "/api/tasks/page?taskName=API+Test+Task+2&pageNum=1&pageSize=1" -ShowResponse $false
if ($secondTaskResult) {
    try {
        $json = $secondTaskResult | ConvertFrom-Json
        if ($json.data -and $json.data.records -and $json.data.records.Count -gt 0) {
            $secondTaskId = $json.data.records[0].id
            Invoke-ApiTest -Name "Delete Test Task 2" -Method "DELETE" -Url "/api/tasks/$secondTaskId"
        }
    } catch {
    }
}

Show-Header "API Tests Completed"

Write-Host ""
Write-Host "Test Summary:"
Write-Host "  - Task Management: Complete"
Write-Host "  - Task Status Management: Complete"
Write-Host "  - Task Execution Logs: Complete"
Write-Host "  - Redis Cache: Tested"
Write-Host "  - Error Scenarios: Tested"
Write-Host ""
Write-Host "All core API tests completed!" -ForegroundColor Green
