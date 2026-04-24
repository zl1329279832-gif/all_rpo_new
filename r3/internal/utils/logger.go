package utils

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type Logger struct {
	logs     []string
	mu       sync.RWMutex
	logFile  *os.File
	logPath  string
}

func NewLogger(logPath string) (*Logger, error) {
	l := &Logger{
		logs:    make([]string, 0),
		logPath: logPath,
	}

	if logPath != "" {
		if err := EnsureDir(filepath.Dir(logPath)); err != nil {
			return nil, err
		}

		f, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			return nil, err
		}
		l.logFile = f
	}

	return l, nil
}

func (l *Logger) Info(msg string) {
	l.log("INFO", msg)
}

func (l *Logger) Error(msg string) {
	l.log("ERROR", msg)
}

func (l *Logger) Warn(msg string) {
	l.log("WARN", msg)
}

func (l *Logger) log(level, msg string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	entry := fmt.Sprintf("[%s] [%s] %s", timestamp, level, msg)

	l.mu.Lock()
	l.logs = append(l.logs, entry)
	l.mu.Unlock()

	if l.logFile != nil {
		l.logFile.WriteString(entry + "\n")
	}
}

func (l *Logger) GetLogs() []string {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return append([]string(nil), l.logs...)
}

func (l *Logger) Clear() {
	l.mu.Lock()
	l.logs = make([]string, 0)
	l.mu.Unlock()
}

func (l *Logger) Close() {
	if l.logFile != nil {
		l.logFile.Close()
	}
}
