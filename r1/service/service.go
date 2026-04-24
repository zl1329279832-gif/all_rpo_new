package service

import (
	"encoding/json"
	"r1/engine"
	"r1/model"
	"r1/repository"
	"time"

	"gorm.io/gorm"
)

type Service struct {
	db              *gorm.DB
	ruleRepo        *repository.RuleRepository
	versionRepo     *repository.RuleVersionRepository
	sampleRepo      *repository.SampleRepository
	taskRepo        *repository.BacktestTaskRepository
	resultRepo      *repository.BacktestResultRepository
	hitDetailRepo   *repository.RuleHitDetailRepository
	engine          *engine.RuleEngine
}

func NewService(db *gorm.DB) *Service {
	return &Service{
		db:              db,
		ruleRepo:        repository.NewRuleRepository(db),
		versionRepo:     repository.NewRuleVersionRepository(db),
		sampleRepo:      repository.NewSampleRepository(db),
		taskRepo:        repository.NewBacktestTaskRepository(db),
		resultRepo:      repository.NewBacktestResultRepository(db),
		hitDetailRepo:   repository.NewRuleHitDetailRepository(db),
		engine:          engine.NewRuleEngine(),
	}
}

func (s *Service) CreateRule(req *CreateRuleRequest) (*model.Rule, error) {
	rule := &model.Rule{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Expression:  req.Expression,
		RiskLevel:   req.RiskLevel,
		Status:      "active",
	}
	if err := s.ruleRepo.Create(rule); err != nil {
		return nil, err
	}
	version := &model.RuleVersion{
		RuleID:      rule.ID,
		Version:     1,
		Name:        rule.Name,
		Expression:  rule.Expression,
		Description: rule.Description,
		RiskLevel:   rule.RiskLevel,
		CreatedBy:   "system",
	}
	if err := s.versionRepo.Create(version); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *Service) UpdateRule(id uint64, req *UpdateRuleRequest) (*model.Rule, error) {
	rule, err := s.ruleRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if req.Name != "" {
		rule.Name = req.Name
	}
	if req.Description != "" {
		rule.Description = req.Description
	}
	if req.Expression != "" {
		rule.Expression = req.Expression
	}
	if req.RiskLevel != "" {
		rule.RiskLevel = req.RiskLevel
	}
	if req.Status != "" {
		rule.Status = req.Status
	}
	if err := s.ruleRepo.Update(rule); err != nil {
		return nil, err
	}
	latestVer, _ := s.versionRepo.GetLatestVersion(id)
	nextVersion := 1
	if latestVer != nil {
		nextVersion = latestVer.Version + 1
	}
	newVersion := &model.RuleVersion{
		RuleID:      rule.ID,
		Version:     nextVersion,
		Name:        rule.Name,
		Expression:  rule.Expression,
		Description: rule.Description,
		RiskLevel:   rule.RiskLevel,
		CreatedBy:   "system",
	}
	if err := s.versionRepo.Create(newVersion); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *Service) GetRule(id uint64) (*model.Rule, error) {
	return s.ruleRepo.GetByID(id)
}

func (s *Service) ListRules(offset, limit int) ([]model.Rule, int64, error) {
	return s.ruleRepo.List(offset, limit)
}

func (s *Service) ListRuleVersions(ruleID uint64) ([]model.RuleVersion, error) {
	return s.versionRepo.ListByRuleID(ruleID)
}

func (s *Service) CreateSample(req *CreateSampleRequest) (*model.Sample, error) {
	dataJSON, err := json.Marshal(req.Data)
	if err != nil {
		return nil, err
	}
	sample := &model.Sample{
		BatchID:        req.BatchID,
		Data:           model.JSON(dataJSON),
		ExpectedResult: req.ExpectedResult,
		Source:         req.Source,
	}
	if err := s.sampleRepo.Create(sample); err != nil {
		return nil, err
	}
	return sample, nil
}

func (s *Service) BatchCreateSamples(req *BatchCreateSamplesRequest) error {
	samples := make([]model.Sample, len(req.Samples))
	for i, sreq := range req.Samples {
		dataJSON, _ := json.Marshal(sreq.Data)
		samples[i] = model.Sample{
			BatchID:        req.BatchID,
			Data:           model.JSON(dataJSON),
			ExpectedResult: sreq.ExpectedResult,
			Source:         req.Source,
		}
	}
	return s.sampleRepo.BatchCreate(samples)
}

func (s *Service) GetSample(id uint64) (*model.Sample, error) {
	return s.sampleRepo.GetByID(id)
}

func (s *Service) ListSamples(offset, limit int) ([]model.Sample, int64, error) {
	return s.sampleRepo.List(offset, limit)
}

func (s *Service) CreateBacktestTask(req *CreateBacktestTaskRequest) (*model.BacktestTask, error) {
	ruleVersionIDs, _ := json.Marshal(req.RuleVersionIDs)
	sampleBatchIDs, _ := json.Marshal(req.SampleBatchIDs)
	task := &model.BacktestTask{
		Name:           req.Name,
		Description:    req.Description,
		RuleVersionIDs: model.JSON(ruleVersionIDs),
		SampleBatchIDs: model.JSON(sampleBatchIDs),
		Status:         "pending",
		Progress:       0,
	}
	if err := s.taskRepo.Create(task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *Service) RunBacktest(taskID uint64) error {
	task, err := s.taskRepo.GetByID(taskID)
	if err != nil {
		return err
	}
	now := time.Now()
	task.Status = "running"
	task.StartedAt = &now
	s.taskRepo.Update(task)
	go s.executeBacktest(task)
	return nil
}

func (s *Service) executeBacktest(task *model.BacktestTask) {
	defer func() {
		now := time.Now()
		task.Status = "completed"
		task.CompletedAt = &now
		task.Progress = 100
		s.taskRepo.Update(task)
	}()
	var ruleVersionIDs []uint64
	json.Unmarshal(task.RuleVersionIDs, &ruleVersionIDs)
	ruleVersions, err := s.versionRepo.GetByIDs(ruleVersionIDs)
	if err != nil {
		task.Status = "failed"
		s.taskRepo.Update(task)
		return
	}
	var sampleBatchIDs []string
	json.Unmarshal(task.SampleBatchIDs, &sampleBatchIDs)
	samples, err := s.sampleRepo.ListByBatchIDs(sampleBatchIDs)
	if err != nil {
		task.Status = "failed"
		s.taskRepo.Update(task)
		return
	}
	task.SampleCount = len(samples)
	s.taskRepo.Update(task)
	results := make([]model.BacktestResult, 0)
	hitDetails := make([]model.RuleHitDetail, 0)
	ruleStats := make(map[uint64]*model.RuleStats)
	for _, rv := range ruleVersions {
		ruleStats[rv.ID] = &model.RuleStats{
			RuleID:   rv.RuleID,
			RuleCode: "",
			RuleName: rv.Name,
		}
	}
	for i, sample := range samples {
		var data map[string]interface{}
		json.Unmarshal(sample.Data, &data)
		hitRuleCount := 0
		actualResult := "pass"
		sampleHitDetails := make([]model.RuleHitDetail, 0)
		for _, rv := range ruleVersions {
			hit, _ := s.engine.Evaluate(rv.Expression, data)
			if hit {
				hitRuleCount++
				actualResult = "reject"
				hd := model.RuleHitDetail{
					TaskID:        task.ID,
					SampleID:      sample.ID,
					RuleID:        rv.RuleID,
					RuleVersionID: rv.ID,
					RuleCode:      "",
					RuleName:      rv.Name,
					Expression:    rv.Expression,
				}
				sampleHitDetails = append(sampleHitDetails, hd)
				if stats, ok := ruleStats[rv.ID]; ok {
					stats.HitCount++
				}
			}
		}
		var isCorrect *bool
		if sample.ExpectedResult != "" {
			correct := (sample.ExpectedResult == actualResult)
			isCorrect = &correct
		}
		result := model.BacktestResult{
			TaskID:         task.ID,
			SampleID:       sample.ID,
			ActualResult:   actualResult,
			ExpectedResult: sample.ExpectedResult,
			HitRuleCount:   hitRuleCount,
			IsCorrect:      isCorrect,
		}
		results = append(results, result)
		s.resultRepo.Create(&result)
		for _, hd := range sampleHitDetails {
			hd.ResultID = result.ID
			hitDetails = append(hitDetails, hd)
			s.hitDetailRepo.Create(&hd)
		}
		progress := int(float64(i+1) / float64(len(samples)) * 100)
		if progress > task.Progress {
			task.Progress = progress
			s.taskRepo.Update(task)
		}
	}
	summary := s.calculateSummary(results, hitDetails, ruleStats, len(ruleVersions))
	summaryJSON, _ := json.Marshal(summary)
	task.ResultSummary = model.JSON(summaryJSON)
}

func (s *Service) calculateSummary(results []model.BacktestResult, hitDetails []model.RuleHitDetail, ruleStats map[uint64]*model.RuleStats, ruleCount int) *model.ResultSummary {
	summary := &model.ResultSummary{
		TotalCount:   len(results),
		RuleContrib:  make(map[uint64]model.RuleStats),
	}
	totalHits := 0
	for _, r := range results {
		if r.ActualResult == "pass" {
			summary.PassCount++
		} else {
			summary.RejectCount++
		}
		if r.HitRuleCount > 0 {
			summary.HitCount++
			totalHits += r.HitRuleCount
		}
		if r.IsCorrect != nil && *r.IsCorrect {
			summary.CorrectCount++
		}
		if r.ExpectedResult == "pass" && r.ActualResult == "reject" {
			summary.FalsePositive++
		}
		if r.ExpectedResult == "reject" && r.ActualResult == "pass" {
			summary.FalseNegative++
		}
	}
	if summary.TotalCount > 0 {
		summary.HitRate = float64(summary.HitCount) / float64(summary.TotalCount)
		summary.PassRate = float64(summary.PassCount) / float64(summary.TotalCount)
		summary.RejectRate = float64(summary.RejectCount) / float64(summary.TotalCount)
		summary.Accuracy = float64(summary.CorrectCount) / float64(summary.TotalCount)
	}
	for id, stats := range ruleStats {
		if summary.TotalCount > 0 {
			stats.HitRate = float64(stats.HitCount) / float64(summary.TotalCount)
		}
		if totalHits > 0 {
			stats.Contrib = float64(stats.HitCount) / float64(totalHits)
		}
		summary.RuleContrib[id] = *stats
	}
	return summary
}

func (s *Service) GetBacktestTask(id uint64) (*model.BacktestTask, error) {
	return s.taskRepo.GetByID(id)
}

func (s *Service) ListBacktestTasks(offset, limit int) ([]model.BacktestTask, int64, error) {
	return s.taskRepo.List(offset, limit)
}

func (s *Service) GetBacktestResults(taskID uint64, offset, limit int) ([]model.BacktestResult, int64, error) {
	return s.resultRepo.ListByTaskID(taskID, offset, limit)
}

func (s *Service) GetHitDetails(taskID uint64) ([]model.RuleHitDetail, error) {
	return s.hitDetailRepo.ListByTaskID(taskID)
}

func (s *Service) TestRule(expression string, data map[string]interface{}) (bool, error) {
	return s.engine.Evaluate(expression, data)
}

type CreateRuleRequest struct {
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
	Expression  string `json:"expression"`
	RiskLevel   string `json:"risk_level"`
}

type UpdateRuleRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Expression  string `json:"expression"`
	RiskLevel   string `json:"risk_level"`
	Status      string `json:"status"`
}

type CreateSampleRequest struct {
	BatchID        string                 `json:"batch_id"`
	Data           map[string]interface{} `json:"data"`
	ExpectedResult string                 `json:"expected_result"`
	Source         string                 `json:"source"`
}

type BatchCreateSamplesRequest struct {
	BatchID string                 `json:"batch_id"`
	Samples []SampleRequest        `json:"samples"`
	Source  string                 `json:"source"`
}

type SampleRequest struct {
	Data           map[string]interface{} `json:"data"`
	ExpectedResult string                 `json:"expected_result"`
}

type CreateBacktestTaskRequest struct {
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	RuleVersionIDs []uint64 `json:"rule_version_ids"`
	SampleBatchIDs []string `json:"sample_batch_ids"`
}
