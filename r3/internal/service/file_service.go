package service

import (
	"file-batch-tool/internal/model"
	"file-batch-tool/internal/utils"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// FileService 文件服务实现 - 实现model.FileOperator接口
type FileService struct {
	logger     model.Logger
	bufferSize int
}

// 确保FileService实现了FileOperator接口
var _ model.FileOperator = (*FileService)(nil)

// NewFileService 创建新的文件服务
func NewFileService(logger model.Logger) *FileService {
	return &FileService{
		logger:     logger,
		bufferSize: model.DefaultBufferSize,
	}
}

// SetBufferSize 设置IO缓冲区大小
func (fs *FileService) SetBufferSize(size int) {
	if size > 0 {
		fs.bufferSize = size
	}
}

// ==================== 目录扫描 ====================

// ScanDirectory 扫描目录（优化版）
func (fs *FileService) ScanDirectory(dir string, excludeDirs []string, fileTypes []string) ([]*model.FileInfo, error) {
	fs.logger.Info(fmt.Sprintf("start scan directory: %s", dir))
	
	var files []*model.FileInfo
	var mu sync.Mutex
	
	// 使用filepath.WalkDir（Go 1.16+更高效的API）
	err := filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			fs.logger.Error(fmt.Sprintf("access path failed: %s, error: %v", path, err))
			return nil
		}

		if d.IsDir() {
			if utils.IsExcludedDir(path, excludeDirs) && path != dir {
				return filepath.SkipDir
			}
			return nil
		}

		// 文件类型过滤
		fileType := utils.GetFileType(path)
		if len(fileTypes) > 0 {
			match := false
			for _, ft := range fileTypes {
				if strings.EqualFold(fileType, ft) {
					match = true
					break
				}
			}
			if !match {
				return nil
			}
		}

		// 获取文件信息
		info, err := d.Info()
		if err != nil {
			fs.logger.Error(fmt.Sprintf("get file info failed: %s, error: %v", path, err))
			return nil
		}

		// 构建文件信息（延迟计算Hash）
		fileInfo := &model.FileInfo{
			Path:     path,
			Name:     d.Name(),
			Size:     info.Size(),
			ModTime:  info.ModTime(),
			IsDir:    false,
			FileType: fileType,
			Selected: false,
		}

		mu.Lock()
		files = append(files, fileInfo)
		mu.Unlock()

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("scan directory failed: %w", err)
	}

	fs.logger.Info(fmt.Sprintf("scan completed, found %d files", len(files)))
	return files, nil
}

// ==================== 重复文件检测 ====================

// FindDuplicates 查找重复文件（优化版：并发计算哈希）
func (fs *FileService) FindDuplicates(files []*model.FileInfo) map[string][]*model.FileInfo {
	fs.logger.Info("start find duplicate files")
	
	hashMap := make(map[string][]*model.FileInfo)
	var mu sync.Mutex
	
	// 使用工作池并发计算哈希
	workerCount := model.DefaultWorkerPoolSize
	pool := utils.NewWorkerPool(workerCount)
	pool.Start()
	
	for _, file := range files {
		file := file // 避免闭包捕获问题
		pool.Submit(func() error {
			// 只对有大小的文件计算哈希
			if file.Size > 0 {
				hash, err := utils.CalculateFileHash(file.Path, fs.bufferSize)
				if err != nil {
					fs.logger.Warn(fmt.Sprintf("calculate hash failed: %s, error: %v", file.Name, err))
					return nil
				}
				file.Hash = hash
				
				mu.Lock()
				hashMap[hash] = append(hashMap[hash], file)
				mu.Unlock()
			}
			
			// 更新进度（这里不显示进度，避免UI阻塞）
			return nil
		})
	}
	
	// 等待所有任务完成
	pool.Wait()
	
	// 过滤只有一个文件的哈希
	duplicates := make(map[string][]*model.FileInfo)
	for hash, fileList := range hashMap {
		if len(fileList) > 1 {
			duplicates[hash] = fileList
			fs.logger.Warn(fmt.Sprintf("found duplicate group (Hash: %s): %d files", hash[:16], len(fileList)))
		}
	}

	fs.logger.Info(fmt.Sprintf("duplicate check completed, found %d groups", len(duplicates)))
	return duplicates
}

// ==================== 批量重命名 ====================

// BatchRename 批量重命名
func (fs *FileService) BatchRename(files []*model.FileInfo, prefix string, startNum int, progress chan<- int) *model.TaskResult {
	result := model.NewTaskResult(len(files))
	defer result.Complete()
	
	var mu sync.Mutex
	
	for i, file := range files {
		ext := filepath.Ext(file.Name)
		newName := fmt.Sprintf("%s%d%s", prefix, startNum+i, ext)
		newPath := filepath.Join(filepath.Dir(file.Path), newName)

		if err := os.Rename(file.Path, newPath); err != nil {
			errMsg := fmt.Sprintf("rename failed %s: %v", file.Name, err)
			mu.Lock()
			result.AddError(errMsg)
			mu.Unlock()
			fs.logger.Error(errMsg)
		} else {
			mu.Lock()
			result.AddSuccess()
			mu.Unlock()
			fs.logger.Info(fmt.Sprintf("rename success: %s -> %s", file.Name, newName))
		}

		if progress != nil {
			progress <- i + 1
		}
	}

	return result
}

// ==================== 批量复制 ====================

// BatchCopy 批量复制（优化版：使用工作池并发处理）
func (fs *FileService) BatchCopy(files []*model.FileInfo, destDir string, progress chan<- int) *model.TaskResult {
	result := model.NewTaskResult(len(files))
	defer result.Complete()

	// 确保目标目录存在
	if err := utils.EnsureDir(destDir); err != nil {
		errMsg := fmt.Sprintf("create dest dir failed: %v", err)
		result.AddError(errMsg)
		fs.logger.Error(errMsg)
		return result
	}

	var mu sync.Mutex
	processed := 0
	
	// 使用工作池
	pool := utils.NewWorkerPool(model.DefaultWorkerPoolSize)
	pool.Start()
	
	for _, file := range files {
		file := file
		pool.Submit(func() error {
			destPath := utils.GenerateUniqueFileName(destDir, file.Name)
			
			if err := utils.CopyFile(file.Path, destPath, fs.bufferSize); err != nil {
				errMsg := fmt.Sprintf("copy failed %s: %v", file.Name, err)
				mu.Lock()
				result.AddError(errMsg)
				mu.Unlock()
				fs.logger.Error(errMsg)
			} else {
				mu.Lock()
				result.AddSuccess()
				mu.Unlock()
				fs.logger.Info(fmt.Sprintf("copy success: %s -> %s", file.Name, destPath))
			}
			
			// 更新进度
			mu.Lock()
			processed++
			if progress != nil {
				progress <- processed
			}
			mu.Unlock()
			
			return nil
		})
	}
	
	pool.Wait()
	return result
}

// ==================== 批量移动 ====================

// BatchMove 批量移动（优化版：并发处理）
func (fs *FileService) BatchMove(files []*model.FileInfo, destDir string, progress chan<- int) *model.TaskResult {
	result := model.NewTaskResult(len(files))
	defer result.Complete()

	// 确保目标目录存在
	if err := utils.EnsureDir(destDir); err != nil {
		errMsg := fmt.Sprintf("create dest dir failed: %v", err)
		result.AddError(errMsg)
		fs.logger.Error(errMsg)
		return result
	}

	var mu sync.Mutex
	processed := 0
	
	// 使用工作池
	pool := utils.NewWorkerPool(model.DefaultWorkerPoolSize)
	pool.Start()
	
	for _, file := range files {
		file := file
		pool.Submit(func() error {
			destPath := utils.GenerateUniqueFileName(destDir, file.Name)
			
			if err := os.Rename(file.Path, destPath); err != nil {
				errMsg := fmt.Sprintf("move failed %s: %v", file.Name, err)
				mu.Lock()
				result.AddError(errMsg)
				mu.Unlock()
				fs.logger.Error(errMsg)
			} else {
				mu.Lock()
				result.AddSuccess()
				mu.Unlock()
				fs.logger.Info(fmt.Sprintf("move success: %s -> %s", file.Name, destPath))
			}
			
			// 更新进度
			mu.Lock()
			processed++
			if progress != nil {
				progress <- processed
			}
			mu.Unlock()
			
			return nil
		})
	}
	
	pool.Wait()
	return result
}

// ==================== 批量删除（扩展功能） ====================

// BatchDelete 批量删除
func (fs *FileService) BatchDelete(files []*model.FileInfo, progress chan<- int) *model.TaskResult {
	result := model.NewTaskResult(len(files))
	defer result.Complete()

	var mu sync.Mutex
	processed := 0
	
	pool := utils.NewWorkerPool(model.DefaultWorkerPoolSize)
	pool.Start()
	
	for _, file := range files {
		file := file
		pool.Submit(func() error {
			if err := os.Remove(file.Path); err != nil {
				errMsg := fmt.Sprintf("delete failed %s: %v", file.Name, err)
				mu.Lock()
				result.AddError(errMsg)
				mu.Unlock()
				fs.logger.Error(errMsg)
			} else {
				mu.Lock()
				result.AddSuccess()
				mu.Unlock()
				fs.logger.Info(fmt.Sprintf("delete success: %s", file.Name))
			}
			
			mu.Lock()
			processed++
			if progress != nil {
				progress <- processed
			}
			mu.Unlock()
			
			return nil
		})
	}
	
	pool.Wait()
	return result
}
