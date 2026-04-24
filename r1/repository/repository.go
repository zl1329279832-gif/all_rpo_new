package repository

import (
	"r1/model"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

type RuleRepository struct {
	db *gorm.DB
}

func NewRuleRepository(db *gorm.DB) *RuleRepository {
	return &RuleRepository{db: db}
}

func (r *RuleRepository) Create(rule *model.Rule) error {
	return r.db.Create(rule).Error
}

func (r *RuleRepository) GetByID(id uint64) (*model.Rule, error) {
	var rule model.Rule
	err := r.db.First(&rule, id).Error
	return &rule, err
}

func (r *RuleRepository) GetByCode(code string) (*model.Rule, error) {
	var rule model.Rule
	err := r.db.Where("code = ?", code).First(&rule).Error
	return &rule, err
}

func (r *RuleRepository) List(offset, limit int) ([]model.Rule, int64, error) {
	var rules []model.Rule
	var total int64
	r.db.Model(&model.Rule{}).Count(&total)
	err := r.db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&rules).Error
	return rules, total, err
}

func (r *RuleRepository) Update(rule *model.Rule) error {
	return r.db.Save(rule).Error
}

func (r *RuleRepository) Delete(id uint64) error {
	return r.db.Delete(&model.Rule{}, id).Error
}

type RuleVersionRepository struct {
	db *gorm.DB
}

func NewRuleVersionRepository(db *gorm.DB) *RuleVersionRepository {
	return &RuleVersionRepository{db: db}
}

func (r *RuleVersionRepository) Create(version *model.RuleVersion) error {
	return r.db.Create(version).Error
}

func (r *RuleVersionRepository) GetByID(id uint64) (*model.RuleVersion, error) {
	var v model.RuleVersion
	err := r.db.First(&v, id).Error
	return &v, err
}

func (r *RuleVersionRepository) GetLatestVersion(ruleID uint64) (*model.RuleVersion, error) {
	var v model.RuleVersion
	err := r.db.Where("rule_id = ?", ruleID).Order("version DESC").First(&v).Error
	return &v, err
}

func (r *RuleVersionRepository) ListByRuleID(ruleID uint64) ([]model.RuleVersion, error) {
	var versions []model.RuleVersion
	err := r.db.Where("rule_id = ?", ruleID).Order("version DESC").Find(&versions).Error
	return versions, err
}

func (r *RuleVersionRepository) GetByIDs(ids []uint64) ([]model.RuleVersion, error) {
	var versions []model.RuleVersion
	err := r.db.Where("id IN ?", ids).Find(&versions).Error
	return versions, err
}

type SampleRepository struct {
	db *gorm.DB
}

func NewSampleRepository(db *gorm.DB) *SampleRepository {
	return &SampleRepository{db: db}
}

func (r *SampleRepository) Create(sample *model.Sample) error {
	return r.db.Create(sample).Error
}

func (r *SampleRepository) BatchCreate(samples []model.Sample) error {
	return r.db.CreateInBatches(samples, 100).Error
}

func (r *SampleRepository) GetByID(id uint64) (*model.Sample, error) {
	var sample model.Sample
	err := r.db.First(&sample, id).Error
	return &sample, err
}

func (r *SampleRepository) ListByBatchID(batchID string) ([]model.Sample, error) {
	var samples []model.Sample
	err := r.db.Where("batch_id = ?", batchID).Find(&samples).Error
	return samples, err
}

func (r *SampleRepository) List(offset, limit int) ([]model.Sample, int64, error) {
	var samples []model.Sample
	var total int64
	r.db.Model(&model.Sample{}).Count(&total)
	err := r.db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&samples).Error
	return samples, total, err
}

func (r *SampleRepository) ListByBatchIDs(batchIDs []string) ([]model.Sample, error) {
	var samples []model.Sample
	var err error
	if len(batchIDs) == 0 {
		err = r.db.Find(&samples).Error
	} else {
		err = r.db.Where("batch_id IN ?", batchIDs).Find(&samples).Error
	}
	return samples, err
}

type BacktestTaskRepository struct {
	db *gorm.DB
}

func NewBacktestTaskRepository(db *gorm.DB) *BacktestTaskRepository {
	return &BacktestTaskRepository{db: db}
}

func (r *BacktestTaskRepository) Create(task *model.BacktestTask) error {
	return r.db.Create(task).Error
}

func (r *BacktestTaskRepository) GetByID(id uint64) (*model.BacktestTask, error) {
	var task model.BacktestTask
	err := r.db.First(&task, id).Error
	return &task, err
}

func (r *BacktestTaskRepository) List(offset, limit int) ([]model.BacktestTask, int64, error) {
	var tasks []model.BacktestTask
	var total int64
	r.db.Model(&model.BacktestTask{}).Count(&total)
	err := r.db.Offset(offset).Limit(limit).Order("created_at DESC").Find(&tasks).Error
	return tasks, total, err
}

func (r *BacktestTaskRepository) Update(task *model.BacktestTask) error {
	return r.db.Save(task).Error
}

type BacktestResultRepository struct {
	db *gorm.DB
}

func NewBacktestResultRepository(db *gorm.DB) *BacktestResultRepository {
	return &BacktestResultRepository{db: db}
}

func (r *BacktestResultRepository) Create(result *model.BacktestResult) error {
	return r.db.Create(result).Error
}

func (r *BacktestResultRepository) BatchCreate(results []model.BacktestResult) error {
	return r.db.CreateInBatches(results, 100).Error
}

func (r *BacktestResultRepository) ListByTaskID(taskID uint64, offset, limit int) ([]model.BacktestResult, int64, error) {
	var results []model.BacktestResult
	var total int64
	r.db.Model(&model.BacktestResult{}).Where("task_id = ?", taskID).Count(&total)
	err := r.db.Where("task_id = ?", taskID).Offset(offset).Limit(limit).Order("created_at DESC").Find(&results).Error
	return results, total, err
}

type RuleHitDetailRepository struct {
	db *gorm.DB
}

func NewRuleHitDetailRepository(db *gorm.DB) *RuleHitDetailRepository {
	return &RuleHitDetailRepository{db: db}
}

func (r *RuleHitDetailRepository) Create(detail *model.RuleHitDetail) error {
	return r.db.Create(detail).Error
}

func (r *RuleHitDetailRepository) BatchCreate(details []model.RuleHitDetail) error {
	return r.db.CreateInBatches(details, 100).Error
}

func (r *RuleHitDetailRepository) ListByResultID(resultID uint64) ([]model.RuleHitDetail, error) {
	var details []model.RuleHitDetail
	err := r.db.Where("result_id = ?", resultID).Find(&details).Error
	return details, err
}

func (r *RuleHitDetailRepository) ListByTaskID(taskID uint64) ([]model.RuleHitDetail, error) {
	var details []model.RuleHitDetail
	err := r.db.Where("task_id = ?", taskID).Find(&details).Error
	return details, err
}
