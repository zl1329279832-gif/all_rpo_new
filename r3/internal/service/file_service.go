package service

import (
	"file-batch-tool/internal/model"
	"file-batch-tool/internal/utils"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type FileService struct {
	logger *utils.Logger
}

func NewFileService(logger *utils.Logger) *FileService {
	return &FileService{
		logger: logger,
	}
}

func (fs *FileService) ScanDirectory(dir string, excludeDirs []string, fileTypes []string) ([]*model.FileInfo, error) {
	fs.logger.Info(fmt.Sprintf("开始扫描目录: %s", dir))
	var files []*model.FileInfo

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			fs.logger.Error(fmt.Sprintf("访问路径失败: %s, 错误: %v", path, err))
			return nil
		}

		if info.IsDir() {
			if utils.IsExcludedDir(path, excludeDirs) && path != dir {
				return filepath.SkipDir
			}
			return nil
		}

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

		hash, _ := utils.CalculateFileHash(path)
		files = append(files, &model.FileInfo{
			Path:     path,
			Name:     info.Name(),
			Size:     info.Size(),
			ModTime:  info.ModTime(),
			IsDir:    false,
			FileType: fileType,
			Hash:     hash,
			Selected: false,
		})

		return nil
	})

	if err != nil {
		return nil, err
	}

	fs.logger.Info(fmt.Sprintf("扫描完成，共找到 %d 个文件", len(files)))
	return files, nil
}

func (fs *FileService) FindDuplicates(files []*model.FileInfo) map[string][]*model.FileInfo {
	fs.logger.Info("开始检测重复文件")
	hashMap := make(map[string][]*model.FileInfo)

	for _, file := range files {
		if file.Hash != "" {
			hashMap[file.Hash] = append(hashMap[file.Hash], file)
		}
	}

	duplicates := make(map[string][]*model.FileInfo)
	for hash, fileList := range hashMap {
		if len(fileList) > 1 {
			duplicates[hash] = fileList
			fs.logger.Warn(fmt.Sprintf("发现重复文件组 (Hash: %s): %d 个文件", hash[:8], len(fileList)))
		}
	}

	fs.logger.Info(fmt.Sprintf("重复文件检测完成，发现 %d 组重复文件", len(duplicates)))
	return duplicates
}

func (fs *FileService) BatchRename(files []*model.FileInfo, prefix string, startNum int, progressChan chan<- int) *model.TaskResult {
	result := &model.TaskResult{
		TotalFiles: len(files),
		Errors:     make([]string, 0),
	}
	startTime := time.Now()

	for i, file := range files {
		ext := filepath.Ext(file.Name)
		newName := fmt.Sprintf("%s%d%s", prefix, startNum+i, ext)
		newPath := filepath.Join(filepath.Dir(file.Path), newName)

		if err := os.Rename(file.Path, newPath); err != nil {
			result.FailCount++
			errMsg := fmt.Sprintf("重命名失败 %s: %v", file.Name, err)
			result.Errors = append(result.Errors, errMsg)
			fs.logger.Error(errMsg)
		} else {
			result.SuccessCount++
			fs.logger.Info(fmt.Sprintf("重命名成功: %s -> %s", file.Name, newName))
		}

		if progressChan != nil {
			progressChan <- i + 1
		}
	}

	result.Duration = time.Since(startTime)
	return result
}

func (fs *FileService) BatchCopy(files []*model.FileInfo, destDir string, progressChan chan<- int) *model.TaskResult {
	result := &model.TaskResult{
		TotalFiles: len(files),
		Errors:     make([]string, 0),
	}
	startTime := time.Now()

	if err := utils.EnsureDir(destDir); err != nil {
		result.FailCount = len(files)
		errMsg := fmt.Sprintf("创建目标目录失败: %v", err)
		result.Errors = append(result.Errors, errMsg)
		fs.logger.Error(errMsg)
		return result
	}

	for i, file := range files {
		destPath := filepath.Join(destDir, file.Name)
		
		counter := 1
		for {
			if _, err := os.Stat(destPath); os.IsNotExist(err) {
				break
			}
			ext := filepath.Ext(file.Name)
			nameWithoutExt := file.Name[:len(file.Name)-len(ext)]
			destPath = filepath.Join(destDir, fmt.Sprintf("%s_%d%s", nameWithoutExt, counter, ext))
			counter++
		}

		if err := utils.CopyFile(file.Path, destPath); err != nil {
			result.FailCount++
			errMsg := fmt.Sprintf("复制失败 %s: %v", file.Name, err)
			result.Errors = append(result.Errors, errMsg)
			fs.logger.Error(errMsg)
		} else {
			result.SuccessCount++
			fs.logger.Info(fmt.Sprintf("复制成功: %s -> %s", file.Name, destPath))
		}

		if progressChan != nil {
			progressChan <- i + 1
		}
	}

	result.Duration = time.Since(startTime)
	return result
}

func (fs *FileService) BatchMove(files []*model.FileInfo, destDir string, progressChan chan<- int) *model.TaskResult {
	result := &model.TaskResult{
		TotalFiles: len(files),
		Errors:     make([]string, 0),
	}
	startTime := time.Now()

	if err := utils.EnsureDir(destDir); err != nil {
		result.FailCount = len(files)
		errMsg := fmt.Sprintf("创建目标目录失败: %v", err)
		result.Errors = append(result.Errors, errMsg)
		fs.logger.Error(errMsg)
		return result
	}

	for i, file := range files {
		destPath := filepath.Join(destDir, file.Name)
		
		counter := 1
		for {
			if _, err := os.Stat(destPath); os.IsNotExist(err) {
				break
			}
			ext := filepath.Ext(file.Name)
			nameWithoutExt := file.Name[:len(file.Name)-len(ext)]
			destPath = filepath.Join(destDir, fmt.Sprintf("%s_%d%s", nameWithoutExt, counter, ext))
			counter++
		}

		if err := os.Rename(file.Path, destPath); err != nil {
			result.FailCount++
			errMsg := fmt.Sprintf("移动失败 %s: %v", file.Name, err)
			result.Errors = append(result.Errors, errMsg)
			fs.logger.Error(errMsg)
		} else {
			result.SuccessCount++
			fs.logger.Info(fmt.Sprintf("移动成功: %s -> %s", file.Name, destPath))
		}

		if progressChan != nil {
			progressChan <- i + 1
		}
	}

	result.Duration = time.Since(startTime)
	return result
}

func (fs *FileService) BatchDelete(files []*model.FileInfo, progressChan chan<- int) *model.TaskResult {
	result := &model.TaskResult{
		TotalFiles: len(files),
		Errors:     make([]string, 0),
	}
	startTime := time.Now()

	var wg sync.WaitGroup
	var mu sync.Mutex

	for i, file := range files {
		wg.Add(1)
		go func(idx int, f *model.FileInfo) {
			defer wg.Done()
			
			if err := os.Remove(f.Path); err != nil {
				mu.Lock()
				result.FailCount++
				errMsg := fmt.Sprintf("删除失败 %s: %v", f.Name, err)
				result.Errors = append(result.Errors, errMsg)
				fs.logger.Error(errMsg)
				mu.Unlock()
			} else {
				mu.Lock()
				result.SuccessCount++
				fs.logger.Info(fmt.Sprintf("删除成功: %s", f.Name))
				mu.Unlock()
			}

			if progressChan != nil {
				progressChan <- idx + 1
			}
		}(i, file)
	}

	wg.Wait()
	result.Duration = time.Since(startTime)
	return result
}
