package model

import (
	"encoding/json"
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestJSONType(t *testing.T) {
	testData := map[string]interface{}{
		"amount":    1500,
		"userLevel": "new",
	}
	
	dataBytes, err := json.Marshal(testData)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	
	jsonType := JSON(dataBytes)
	
	var result map[string]interface{}
	err = json.Unmarshal([]byte(jsonType), &result)
	if err != nil {
		t.Fatalf("json.Unmarshal() error = %v", err)
	}
	
	if result["amount"] != float64(1500) {
		t.Errorf("Expected amount 1500, got %v", result["amount"])
	}
	
	if result["userLevel"] != "new" {
		t.Errorf("Expected userLevel new, got %v", result["userLevel"])
	}
}

func TestRuleStruct(t *testing.T) {
	rule := Rule{
		Name:        "Test Rule",
		Code:        "TEST001",
		Description: "A test rule",
		Expression:  "amount > 1000",
		RiskLevel:   "high",
		Status:      "active",
	}
	
	if rule.Name != "Test Rule" {
		t.Errorf("Expected Name 'Test Rule', got '%s'", rule.Name)
	}
	
	if rule.Code != "TEST001" {
		t.Errorf("Expected Code 'TEST001', got '%s'", rule.Code)
	}
	
	if rule.Expression != "amount > 1000" {
		t.Errorf("Expected Expression 'amount > 1000', got '%s'", rule.Expression)
	}
}

func TestSampleStruct(t *testing.T) {
	data := map[string]interface{}{
		"amount": 2000,
	}
	dataBytes, _ := json.Marshal(data)
	
	sample := Sample{
		BatchID:        "BATCH001",
		Data:           JSON(dataBytes),
		ExpectedResult: "reject",
		Source:         "test",
	}
	
	if sample.BatchID != "BATCH001" {
		t.Errorf("Expected BatchID 'BATCH001', got '%s'", sample.BatchID)
	}
	
	if sample.ExpectedResult != "reject" {
		t.Errorf("Expected ExpectedResult 'reject', got '%s'", sample.ExpectedResult)
	}
}

func TestDatabaseMigration(t *testing.T) {
	db, err := setupTestDB()
	if err != nil {
		t.Fatalf("setupTestDB() error = %v", err)
	}
	
	err = db.AutoMigrate(&Rule{}, &RuleVersion{}, &Sample{}, &BacktestTask{}, &BacktestResult{}, &RuleHitDetail{})
	if err != nil {
		t.Fatalf("AutoMigrate() error = %v", err)
	}
}

func setupTestDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err
	}
	return db, nil
}
