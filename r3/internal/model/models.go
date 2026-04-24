package model

import (
	"time"
)

// ==================== 常量定义 ====================

const (
	// DefaultWorkerPoolSize 默认工作池大小
	DefaultWorkerPoolSize = 4
	// DefaultBufferSize 默认IO缓冲区大小
	DefaultBufferSize = 64 * 1024 // 64KB
	// HashChunkSize 哈希计算分块大小
	HashChunkSize = 128 * 1024 // 128KB
	// ProgressUpdateInterval 进度更新间隔（毫秒）
	ProgressUpdateInterval = 100
)

// ==================== 接口定义 ====================

// FileOperator 文件操作接口 - 实现解耦
type FileOperator interface {
	// ScanDirectory 扫描目录
	ScanDirectory(dir string, excludeDirs []string, fileTypes []string) ([]*FileInfo, error)
	// BatchRename 批量重命名
	BatchRename(files []*FileInfo, prefix string, startNum int, progress chan<- int) *TaskResult
	// BatchCopy 批量复制
	BatchCopy(files []*FileInfo, destDir string, progress chan<- int) *TaskResult
	// BatchMove 批量移动
	BatchMove(files []*FileInfo, destDir string, progress chan<- int) *TaskResult
	// FindDuplicates 查找重复文件
	FindDuplicates(files []*FileInfo) map[string][]*FileInfo
}

// ConfigManager 配置管理接口
type ConfigManager interface {
	Load() error
	Save() error
	Get() *Config
	Update(config *Config)
}

// Logger 日志接口
type Logger interface {
	Info(msg string)
	Error(msg string)
	Warn(msg string)
	GetLogs() []string
	Clear()
	Close()
}

// ==================== 数据模型 ====================

// FileInfo 文件信息模型
type FileInfo struct {
	Path     string `json:"path"`
	Name     string `json:"name"`
	Size     int64  `json:"size"`
	ModTime  time.Time `json:"mod_time"`
	IsDir    bool   `json:"is_dir"`
	FileType string `json:"file_type"`
	Hash     string `json:"hash,omitempty"` // omitempty: 可选字段
	Selected bool   `json:"-"` // 不序列化到JSON
}

// Config 配置模型
type Config struct {
	DefaultScanDir   string   `yaml:"default_scan_dir" json:"default_scan_dir"`
	ExcludeDirs      []string `yaml:"exclude_dirs" json:"exclude_dirs"`
	DefaultFileTypes []string `yaml:"default_file_types" json:"default_file_types"`
	LogPath          string   `yaml:"log_path" json:"log_path"`
	Theme            string   `yaml:"theme" json:"theme"`
	WorkerPoolSize   int      `yaml:"worker_pool_size" json:"worker_pool_size"` // 新增：工作池配置
	BufferSize       int      `yaml:"buffer_size" json:"buffer_size"`         // 新增：IO缓冲配置
}

// TaskResult 任务执行结果模型
type TaskResult struct {
	TotalFiles   int           `json:"total_files"`
	SuccessCount int           `json:"success_count"`
	FailCount    int           `json:"fail_count"`
	Errors       []string      `json:"errors"`
	Duration     time.Duration `json:"duration"`
	StartTime    time.Time     `json:"start_time"` // 新增：开始时间
}

// LogEntry 日志条目模型
type LogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Message   string    `json:"message"`
}

// ==================== 辅助方法 ====================

// NewTaskResult 创建新的任务结果
func NewTaskResult(totalFiles int) *TaskResult {
	return &TaskResult{
		TotalFiles: totalFiles,
		Errors:     make([]string, 0, totalFiles),
		StartTime:  time.Now(),
	}
}

// Complete 完成任务并计算耗时
func (tr *TaskResult) Complete() {
	tr.Duration = time.Since(tr.StartTime)
}

// AddError 添加错误信息
func (tr *TaskResult) AddError(errMsg string) {
	tr.Errors = append(tr.Errors, errMsg)
	tr.FailCount++
}

// AddSuccess 增加成功计数
func (tr *TaskResult) AddSuccess() {
	tr.SuccessCount++
}
