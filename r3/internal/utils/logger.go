package utils

import (
	"file-batch-tool/internal/model"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const (
	// LogLevelInfo 信息级别
	LogLevelInfo = "INFO"
	// LogLevelWarn 警告级别
	LogLevelWarn = "WARN"
	// LogLevelError 错误级别
	LogLevelError = "ERROR"
	// MaxLogEntries 最大日志条目数
	MaxLogEntries = 1000
)

// Logger 日志实现 - 实现model.Logger接口
type Logger struct {
	logs     []string
	mu       sync.RWMutex
	logFile  *os.File
	logPath  string
}

// 确保Logger实现了model.Logger接口
var _ model.Logger = (*Logger)(nil)

// NewLogger 创建新的日志记录器
func NewLogger(logPath string) (*Logger, error) {
	logger := &Logger{
		logs:    make([]string, 0, MaxLogEntries),
		logPath: logPath,
	}

	if logPath != "" {
		if err := EnsureDir(filepath.Dir(logPath)); err != nil {
			return nil, fmt.Errorf("create log dir failed: %w", err)
		}

		file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			return nil, fmt.Errorf("open log file failed: %w", err)
		}
		logger.logFile = file
	}

	return logger, nil
}

// Info 记录信息日志
func (l *Logger) Info(msg string) {
	l.log(LogLevelInfo, msg)
}

// Error 记录错误日志
func (l *Logger) Error(msg string) {
	l.log(LogLevelError, msg)
}

// Warn 记录警告日志
func (l *Logger) Warn(msg string) {
	l.log(LogLevelWarn, msg)
}

// log 内部日志记录方法
func (l *Logger) log(level, msg string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	entry := fmt.Sprintf("[%s] [%s] %s", timestamp, level, msg)

	l.mu.Lock()
	// 限制内存中的日志数量
	if len(l.logs) >= MaxLogEntries {
		l.logs = l.logs[1:] // 移除最旧的日志
	}
	l.logs = append(l.logs, entry)
	l.mu.Unlock()

	// 写入文件（异步？考虑性能，暂时同步）
	if l.logFile != nil {
		if _, err := l.logFile.WriteString(entry + "\n"); err != nil {
			fmt.Fprintf(os.Stderr, "write log failed: %v\n", err)
		}
	}
}

// GetLogs 获取所有日志
func (l *Logger) GetLogs() []string {
	l.mu.RLock()
	defer l.mu.RUnlock()
	
	return append([]string(nil), l.logs...) // 返回副本防止外部修改
}

// Clear 清空日志
func (l *Logger) Clear() {
	l.mu.Lock()
	l.logs = make([]string, 0, MaxLogEntries)
	l.mu.Unlock()
}

// Close 关闭日志文件
func (l *Logger) Close() {
	if l.logFile != nil {
		if err := l.logFile.Close(); err != nil {
			fmt.Fprintf(os.Stderr, "close log file failed: %v\n", err)
		}
	}
}
