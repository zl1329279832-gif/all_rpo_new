package service

import (
	"file-batch-tool/internal/model"
	"file-batch-tool/internal/utils"
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// ConfigService 配置服务实现 - 实现model.ConfigManager接口
type ConfigService struct {
	configPath string
	config     *model.Config
}

// 确保ConfigService实现了ConfigManager接口
var _ model.ConfigManager = (*ConfigService)(nil)

// NewConfigService 创建新的配置服务
func NewConfigService(configPath string) *ConfigService {
	return &ConfigService{
		configPath: configPath,
		config: &model.Config{
			DefaultScanDir:   "",
			ExcludeDirs:      []string{".git", "node_modules", "dist", "bin", "tmp"},
			DefaultFileTypes: []string{"txt", "jpg", "png", "pdf", "docx", "xlsx"},
			LogPath:          "logs/app.log",
			Theme:            "light",
			WorkerPoolSize:   model.DefaultWorkerPoolSize,
			BufferSize:       model.DefaultBufferSize,
		},
	}
}

// Load 加载配置
func (cs *ConfigService) Load() error {
	if _, err := os.Stat(cs.configPath); os.IsNotExist(err) {
		// 配置文件不存在，保存默认配置
		return cs.Save()
	}

	data, err := os.ReadFile(cs.configPath)
	if err != nil {
		return fmt.Errorf("read config file failed: %w", err)
	}

	if err := yaml.Unmarshal(data, cs.config); err != nil {
		return fmt.Errorf("parse config file failed: %w", err)
	}

	// 验证并设置默认值
	if cs.config.WorkerPoolSize <= 0 {
		cs.config.WorkerPoolSize = model.DefaultWorkerPoolSize
	}
	if cs.config.BufferSize <= 0 {
		cs.config.BufferSize = model.DefaultBufferSize
	}

	return nil
}

// Save 保存配置
func (cs *ConfigService) Save() error {
	if err := utils.EnsureDir(filepath.Dir(cs.configPath)); err != nil {
		return fmt.Errorf("create config dir failed: %w", err)
	}

	data, err := yaml.Marshal(cs.config)
	if err != nil {
		return fmt.Errorf("marshal config failed: %w", err)
	}

	if err := os.WriteFile(cs.configPath, data, 0644); err != nil {
		return fmt.Errorf("write config file failed: %w", err)
	}

	return nil
}

// Get 获取配置
func (cs *ConfigService) Get() *model.Config {
	return cs.config
}

// Update 更新配置
func (cs *ConfigService) Update(config *model.Config) {
	cs.config = config
}
