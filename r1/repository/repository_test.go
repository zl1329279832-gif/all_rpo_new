package repository

import (
	"encoding/json"
	"testing"

	"r1/model"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupTestDB(t *testing.T) *Repository {
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
	
	return NewRepository(db)
}

func TestRuleRepository(t *testing.T) {
	repo := setupTestDB(t)
	ruleRepo := NewRuleRepository(repo.db)
	
	t.Run("Create Rule", func(t *testing.T) {
		rule := &model.Rule{
			Name:        "Test Rule",
			Code:        "TEST001",
			Description: "Test Description",
			Expression:  "amount > 1000",
			RiskLevel:   "high",
			Status:      "active",
		}
		
		err := ruleRepo.Create(rule)
		if err != nil {
			t.Fatalf("Create() error = %v", err)
		}
		
		if rule.ID == 0 {
			t.Error("Expected rule to have an ID after create")
		}
	})
	
	t.Run("Get Rule By ID", func(t *testing.T) {
		rule := &model.Rule{
			Name:        "Get Test",
			Code:        "GET001",
			Expression:  "amount > 500",
			RiskLevel:   "medium",
			Status:      "active",
		}
		ruleRepo.Create(rule)
		
		retrieved, err := ruleRepo.GetByID(rule.ID)
		if err != nil {
			t.Fatalf("GetByID() error = %v", err)
		}
		
		if retrieved.Name != rule.Name {
			t.Errorf("Expected Name '%s', got '%s'", rule.Name, retrieved.Name)
		}
	})
	
	t.Run("Get Rule By Code", func(t *testing.T) {
		rule := &model.Rule{
			Name:        "Code Test",
			Code:        "CODE001",
			Expression:  "amount > 200",
			RiskLevel:   "low",
			Status:      "active",
		}
		ruleRepo.Create(rule)
		
		retrieved, err := ruleRepo.GetByCode("CODE001")
		if err != nil {
			t.Fatalf("GetByCode() error = %v", err)
		}
		
		if retrieved.Code != "CODE001" {
			t.Errorf("Expected Code 'CODE001', got '%s'", retrieved.Code)
		}
	})
	
	t.Run("List Rules", func(t *testing.T) {
		rules, total, err := ruleRepo.List(0, 10)
		if err != nil {
			t.Fatalf("List() error = %v", err)
		}
		
		if total < 3 {
			t.Errorf("Expected at least 3 rules, got %d", total)
		}
		
		if len(rules) == 0 {
			t.Error("Expected at least one rule in list")
		}
	})
	
	t.Run("Update Rule", func(t *testing.T) {
		rule := &model.Rule{
			Name:        "Update Test",
			Code:        "UPDATE001",
			Expression:  "amount > 100",
			RiskLevel:   "low",
			Status:      "active",
		}
		ruleRepo.Create(rule)
		
		rule.Name = "Updated Rule"
		rule.Expression = "amount > 200"
		
		err := ruleRepo.Update(rule)
		if err != nil {
			t.Fatalf("Update() error = %v", err)
		}
		
		updated, _ := ruleRepo.GetByID(rule.ID)
		if updated.Name != "Updated Rule" {
			t.Errorf("Expected updated name, got '%s'", updated.Name)
		}
	})
}

func TestRuleVersionRepository(t *testing.T) {
	repo := setupTestDB(t)
	ruleRepo := NewRuleRepository(repo.db)
	versionRepo := NewRuleVersionRepository(repo.db)
	
	rule := &model.Rule{
		Name:        "Version Test",
		Code:        "VERSION001",
		Expression:  "amount > 1000",
		RiskLevel:   "high",
		Status:      "active",
	}
	ruleRepo.Create(rule)
	
	t.Run("Create Rule Version", func(t *testing.T) {
		version := &model.RuleVersion{
			RuleID:     rule.ID,
			Version:    1,
			Name:       rule.Name,
			Expression: rule.Expression,
			RiskLevel:  rule.RiskLevel,
			CreatedBy:  "test",
		}
		
		err := versionRepo.Create(version)
		if err != nil {
			t.Fatalf("Create() error = %v", err)
		}
	})
	
	t.Run("List Versions By Rule ID", func(t *testing.T) {
		versions, err := versionRepo.ListByRuleID(rule.ID)
		if err != nil {
			t.Fatalf("ListByRuleID() error = %v", err)
		}
		
		if len(versions) < 1 {
			t.Error("Expected at least one version")
		}
	})
}

func TestSampleRepository(t *testing.T) {
	repo := setupTestDB(t)
	sampleRepo := NewSampleRepository(repo.db)
	
	t.Run("Create Sample", func(t *testing.T) {
		data := map[string]interface{}{"amount": 1500}
		dataBytes, _ := json.Marshal(data)
		
		sample := &model.Sample{
			BatchID:        "TEST_BATCH",
			Data:           model.JSON(dataBytes),
			ExpectedResult: "reject",
			Source:         "test",
		}
		
		err := sampleRepo.Create(sample)
		if err != nil {
			t.Fatalf("Create() error = %v", err)
		}
	})
	
	t.Run("Batch Create Samples", func(t *testing.T) {
		samples := []model.Sample{}
		for i := 0; i < 5; i++ {
			data := map[string]interface{}{"amount": 1000 + i*100}
			dataBytes, _ := json.Marshal(data)
			samples = append(samples, model.Sample{
				BatchID:        "BATCH_CREATE",
				Data:           model.JSON(dataBytes),
				ExpectedResult: "pass",
				Source:         "batch_test",
			})
		}
		
		err := sampleRepo.BatchCreate(samples)
		if err != nil {
			t.Fatalf("BatchCreate() error = %v", err)
		}
	})
	
	t.Run("List Samples", func(t *testing.T) {
		samples, total, err := sampleRepo.List(0, 10)
		if err != nil {
			t.Fatalf("List() error = %v", err)
		}
		
		if total < 6 {
			t.Errorf("Expected at least 6 samples, got %d", total)
		}
		
		if len(samples) == 0 {
			t.Error("Expected at least one sample in list")
		}
	})
}

func TestBacktestTaskRepository(t *testing.T) {
	repo := setupTestDB(t)
	taskRepo := NewBacktestTaskRepository(repo.db)
	
	t.Run("Create Backtest Task", func(t *testing.T) {
		ruleVersions, _ := json.Marshal([]uint64{1, 2})
		sampleBatches, _ := json.Marshal([]string{"BATCH1"})
		
		task := &model.BacktestTask{
			Name:           "Test Task",
			Description:    "Test Description",
			RuleVersionIDs: model.JSON(ruleVersions),
			SampleBatchIDs: model.JSON(sampleBatches),
			Status:         "pending",
		}
		
		err := taskRepo.Create(task)
		if err != nil {
			t.Fatalf("Create() error = %v", err)
		}
	})
	
	t.Run("List Backtest Tasks", func(t *testing.T) {
		tasks, total, err := taskRepo.List(0, 10)
		if err != nil {
			t.Fatalf("List() error = %v", err)
		}
		
		if total < 1 {
			t.Error("Expected at least one task")
		}
		
		if len(tasks) == 0 {
			t.Error("Expected at least one task in list")
		}
	})
}
