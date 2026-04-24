package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"r1/handler"
	"r1/model"
	"r1/router"
	"r1/service"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("Failed to setup test DB: %v", err)
	}

	err = db.AutoMigrate(
		&model.Rule{},
		&model.RuleVersion{},
		&model.Sample{},
		&model.BacktestTask{},
		&model.BacktestResult{},
		&model.RuleHitDetail{},
	)
	if err != nil {
		t.Fatalf("Failed to migrate DB: %v", err)
	}

	return db
}

func setupTestServer(t *testing.T) *gin.Engine {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	svc := service.NewService(db)
	h := handler.NewHandler(svc)
	return router.SetupRouter(h)
}

func TestHealthEndpoint(t *testing.T) {
	r := setupTestServer(t)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response handler.Response
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.Code != 200 {
		t.Errorf("Expected response code 200, got %d", response.Code)
	}
}

func TestCreateRule(t *testing.T) {
	r := setupTestServer(t)

	ruleReq := map[string]interface{}{
		"name":        "Integration Test Rule",
		"code":        "INT001",
		"description": "Integration test rule",
		"expression":  "amount > 5000",
		"risk_level":  "high",
	}

	body, _ := json.Marshal(ruleReq)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/rules", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}
}

func TestListRules(t *testing.T) {
	r := setupTestServer(t)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/rules?offset=0&limit=10", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}
}

func TestCreateSample(t *testing.T) {
	r := setupTestServer(t)

	sampleReq := map[string]interface{}{
		"batch_id": "INT_BATCH",
		"data": map[string]interface{}{
			"amount":    6000,
			"userLevel": "new",
		},
		"expected_result": "reject",
		"source":          "integration_test",
	}

	body, _ := json.Marshal(sampleReq)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/samples", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}
}

func TestTestRuleEndpoint(t *testing.T) {
	r := setupTestServer(t)

	testReq := map[string]interface{}{
		"expression": "amount > 1000",
		"data": map[string]interface{}{
			"amount": 1500,
		},
	}

	body, _ := json.Marshal(testReq)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/test", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var response handler.Response
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.Code != 200 {
		t.Errorf("Expected response code 200, got %d", response.Code)
	}

	dataMap, ok := response.Data.(map[string]interface{})
	if !ok {
		t.Fatalf("Expected data to be a map, got %T", response.Data)
	}

	hit, ok := dataMap["hit"].(bool)
	if !ok {
		t.Fatalf("Expected 'hit' to be a bool")
	}

	if !hit {
		t.Errorf("Expected hit to be true")
	}
}

func TestCreateBacktestTask(t *testing.T) {
	r := setupTestServer(t)

	taskReq := map[string]interface{}{
		"name":             "Integration Test Task",
		"description":      "Integration test backtest",
		"rule_version_ids": []uint64{1},
		"sample_batch_ids": []string{"INT_BATCH"},
	}

	body, _ := json.Marshal(taskReq)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/backtests", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}
}

func TestListBacktests(t *testing.T) {
	r := setupTestServer(t)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/backtests?offset=0&limit=10", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}
}

func TestCompleteWorkflow(t *testing.T) {
	r := setupTestServer(t)

	t.Run("1. Create Rule", func(t *testing.T) {
		ruleReq := map[string]interface{}{
			"name":        "Workflow Test Rule",
			"code":        "WORK001",
			"expression":  "amount > 3000",
			"risk_level":  "medium",
		}

		body, _ := json.Marshal(ruleReq)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/rules", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Failed to create rule: %d", w.Code)
		}
	})

	t.Run("2. Create Sample", func(t *testing.T) {
		sampleReq := map[string]interface{}{
			"batch_id": "WORK_BATCH",
			"data": map[string]interface{}{
				"amount": 4000,
			},
			"expected_result": "reject",
			"source":          "workflow_test",
		}

		body, _ := json.Marshal(sampleReq)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/samples", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Failed to create sample: %d", w.Code)
		}
	})

	t.Run("3. Test Rule Directly", func(t *testing.T) {
		testReq := map[string]interface{}{
			"expression": "amount > 3000",
			"data": map[string]interface{}{
				"amount": 4000,
			},
		}

		body, _ := json.Marshal(testReq)
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/api/v1/test", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Failed to test rule: %d", w.Code)
		}
	})
}
