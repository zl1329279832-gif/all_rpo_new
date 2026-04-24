package model

import (
	"time"
)

type FileInfo struct {
	Path     string
	Name     string
	Size     int64
	ModTime  time.Time
	IsDir    bool
	FileType string
	Hash     string
	Selected bool
}

type Config struct {
	DefaultScanDir   string   `yaml:"default_scan_dir"`
	ExcludeDirs      []string `yaml:"exclude_dirs"`
	DefaultFileTypes []string `yaml:"default_file_types"`
	LogPath          string   `yaml:"log_path"`
	Theme            string   `yaml:"theme"`
}

type TaskResult struct {
	TotalFiles   int
	SuccessCount int
	FailCount    int
	Errors       []string
	Duration     time.Duration
}

type LogEntry struct {
	Timestamp time.Time
	Level     string
	Message   string
}
