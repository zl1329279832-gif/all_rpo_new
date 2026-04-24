package utils

import (
	"bufio"
	"crypto/md5"
	"encoding/hex"
	"file-batch-tool/internal/model"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// ==================== 文件工具函数 ====================

// GetFileType 获取文件类型（扩展名）
func GetFileType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		return "folder"
	}
	// 移除点号
	return ext[1:]
}

// CalculateFileHash 计算文件MD5哈希值（优化版：使用缓冲IO）
func CalculateFileHash(filePath string, bufferSize int) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("open file failed: %w", err)
	}
	defer file.Close()

	// 使用缓冲IO提升性能
	if bufferSize <= 0 {
		bufferSize = model.DefaultBufferSize
	}
	reader := bufio.NewReaderSize(file, bufferSize)

	hash := md5.New()
	if _, err := io.Copy(hash, reader); err != nil {
		return "", fmt.Errorf("calculate hash failed: %w", err)
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

// CopyFile 复制文件（高性能版本）
func CopyFile(src, dst string, bufferSize int) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("open source file failed: %w", err)
	}
	defer sourceFile.Close()

	sourceInfo, err := sourceFile.Stat()
	if err != nil {
		return fmt.Errorf("stat source file failed: %w", err)
	}

	destFile, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, sourceInfo.Mode())
	if err != nil {
		return fmt.Errorf("create dest file failed: %w", err)
	}
	defer destFile.Close()

	// 使用缓冲IO和更大的缓冲区
	if bufferSize <= 0 {
		bufferSize = model.DefaultBufferSize
	}
	writer := bufio.NewWriterSize(destFile, bufferSize)
	defer writer.Flush()

	reader := bufio.NewReaderSize(sourceFile, bufferSize)
	if _, err := io.Copy(writer, reader); err != nil {
		return fmt.Errorf("copy data failed: %w", err)
	}

	return nil
}

// EnsureDir 确保目录存在
func EnsureDir(path string) error {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		if err := os.MkdirAll(path, 0755); err != nil {
			return fmt.Errorf("create directory failed: %w", err)
		}
	}
	return nil
}

// IsExcludedDir 检查是否是排除目录
func IsExcludedDir(path string, excludeDirs []string) bool {
	for _, dir := range excludeDirs {
		if strings.Contains(path, dir) {
			return true
		}
	}
	return false
}

// GenerateUniqueFileName 生成唯一文件名
func GenerateUniqueFileName(destDir, fileName string) string {
	ext := filepath.Ext(fileName)
	nameWithoutExt := fileName[:len(fileName)-len(ext)]
	counter := 1
	
	destPath := filepath.Join(destDir, fileName)
	
	for {
		if _, err := os.Stat(destPath); os.IsNotExist(err) {
			return destPath
		}
		destPath = filepath.Join(destDir, fmt.Sprintf("%s_%d%s", nameWithoutExt, counter, ext))
		counter++
	}
}

// ==================== 工作池实现 ====================

// Task 任务函数类型
type Task func() error

// WorkerPool 工作池 - 用于并发处理文件任务
type WorkerPool struct {
	tasks    chan Task
	results  chan error
	wg       sync.WaitGroup
	workerCount int
	closed   bool
}

// NewWorkerPool 创建新的工作池
func NewWorkerPool(workerCount int) *WorkerPool {
	if workerCount <= 0 {
		workerCount = model.DefaultWorkerPoolSize
	}
	
	return &WorkerPool{
		tasks:       make(chan Task, workerCount*2),
		results:     make(chan error, workerCount*2),
		workerCount: workerCount,
	}
}

// Start 启动工作池
func (wp *WorkerPool) Start() {
	for i := 0; i < wp.workerCount; i++ {
		wp.wg.Add(1)
		go wp.worker()
	}
}

// worker 工作协程
func (wp *WorkerPool) worker() {
	defer wp.wg.Done()
	
	for task := range wp.tasks {
		if task != nil {
			wp.results <- task()
		}
	}
}

// Submit 提交任务
func (wp *WorkerPool) Submit(task Task) {
	if !wp.closed {
		wp.tasks <- task
	}
}

// Results 获取结果通道
func (wp *WorkerPool) Results() <-chan error {
	return wp.results
}

// Wait 等待所有任务完成
func (wp *WorkerPool) Wait() {
	close(wp.tasks)
	wp.wg.Wait()
	close(wp.results)
}

// Close 关闭工作池
func (wp *WorkerPool) Close() {
	wp.closed = true
}

// ==================== 格式化工具 ====================

// FormatSize 格式化文件大小
func FormatSize(size int64) string {
	const unit = 1024
	if size < unit {
		return fmt.Sprintf("%d B", size)
	}
	
	div, exp := int64(unit), 0
	for n := size / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	
	return fmt.Sprintf("%.1f %cB", float64(size)/float64(div), "KMGTPE"[exp])
}

// FormatDuration 格式化耗时
func FormatDuration(d time.Duration) string {
	if d < time.Second {
		return fmt.Sprintf("%d ms", d.Milliseconds())
	}
	if d < time.Minute {
		return fmt.Sprintf("%.1f s", d.Seconds())
	}
	return fmt.Sprintf("%.1f min", d.Minutes())
}
