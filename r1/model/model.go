package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type JSON json.RawMessage

func (j *JSON) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	result := json.RawMessage{}
	err := json.Unmarshal(bytes, &result)
	*j = JSON(result)
	return err
}

func (j JSON) Value() (driver.Value, error) {
	if len(j) == 0 {
		return nil, nil
	}
	return json.RawMessage(j).MarshalJSON()
}

type Rule struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	Code        string    `gorm:"size:100;not null;uniqueIndex" json:"code"`
	Description string    `gorm:"type:text" json:"description"`
	Expression  string    `gorm:"type:text;not null" json:"expression"`
	RiskLevel   string    `gorm:"size:50;not null;default:'medium'" json:"risk_level"`
	Status      string    `gorm:"size:50;not null;default:'active'" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RuleVersion struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	RuleID      uint64    `gorm:"not null;index" json:"rule_id"`
	Version     int       `gorm:"not null" json:"version"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	Expression  string    `gorm:"type:text;not null" json:"expression"`
	Description string    `gorm:"type:text" json:"description"`
	RiskLevel   string    `gorm:"size:50;not null" json:"risk_level"`
	CreatedBy   string    `gorm:"size:100" json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	Rule        Rule      `gorm:"foreignKey:RuleID" json:"rule,omitempty"`
}

type Sample struct {
	ID             uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	BatchID        string    `gorm:"size:100;index" json:"batch_id"`
	Data           JSON      `gorm:"type:json;not null" json:"data"`
	ExpectedResult string    `gorm:"size:50" json:"expected_result"`
	Source         string    `gorm:"size:100;index" json:"source"`
	CreatedAt      time.Time `json:"created_at"`
}

type BacktestTask struct {
	ID              uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name            string     `gorm:"size:255;not null" json:"name"`
	Description     string     `gorm:"type:text" json:"description"`
	RuleVersionIDs  JSON       `gorm:"type:json;not null" json:"rule_version_ids"`
	SampleBatchIDs  JSON       `gorm:"type:json" json:"sample_batch_ids"`
	SampleCount     int        `gorm:"default:0" json:"sample_count"`
	Status          string     `gorm:"size:50;not null;default:'pending';index" json:"status"`
	Progress        int        `gorm:"default:0" json:"progress"`
	ResultSummary   JSON       `gorm:"type:json" json:"result_summary"`
	StartedAt       *time.Time `json:"started_at"`
	CompletedAt     *time.Time `json:"completed_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type BacktestResult struct {
	ID             uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	TaskID         uint64    `gorm:"not null;index" json:"task_id"`
	SampleID       uint64    `gorm:"not null;index" json:"sample_id"`
	ActualResult   string    `gorm:"size:50;not null;index" json:"actual_result"`
	ExpectedResult string    `gorm:"size:50" json:"expected_result"`
	HitRuleCount   int       `gorm:"default:0" json:"hit_rule_count"`
	IsCorrect      *bool     `json:"is_correct"`
	CreatedAt      time.Time `json:"created_at"`
}

type RuleHitDetail struct {
	ID             uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	TaskID         uint64    `gorm:"not null;index" json:"task_id"`
	ResultID       uint64    `gorm:"not null;index" json:"result_id"`
	SampleID       uint64    `gorm:"not null;index" json:"sample_id"`
	RuleID         uint64    `gorm:"not null;index" json:"rule_id"`
	RuleVersionID  uint64    `gorm:"not null" json:"rule_version_id"`
	RuleCode       string    `gorm:"size:100;not null" json:"rule_code"`
	RuleName       string    `gorm:"size:255;not null" json:"rule_name"`
	Expression     string    `gorm:"type:text;not null" json:"expression"`
	CreatedAt      time.Time `json:"created_at"`
}

type ResultSummary struct {
	TotalCount     int                  `json:"total_count"`
	PassCount      int                  `json:"pass_count"`
	RejectCount    int                  `json:"reject_count"`
	HitCount       int                  `json:"hit_count"`
	HitRate        float64              `json:"hit_rate"`
	PassRate       float64              `json:"pass_rate"`
	RejectRate     float64              `json:"reject_rate"`
	CorrectCount   int                  `json:"correct_count"`
	Accuracy       float64              `json:"accuracy"`
	FalsePositive  int                  `json:"false_positive"`
	FalseNegative  int                  `json:"false_negative"`
	RuleContrib    map[uint64]RuleStats `json:"rule_contrib"`
}

type RuleStats struct {
	RuleID    uint64 `json:"rule_id"`
	RuleCode  string `json:"rule_code"`
	RuleName  string `json:"rule_name"`
	HitCount  int    `json:"hit_count"`
	HitRate   float64 `json:"hit_rate"`
	Contrib   float64 `json:"contrib"`
}
