package service

import (
	"file-batch-tool/internal/model"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

type ConfigService struct {
	configPath string
	config     *model.Config
}

func NewConfigService(configPath string) *ConfigService {
	return &ConfigService{
		configPath: configPath,
		config: &model.Config{
			DefaultScanDir:   "",
			ExcludeDirs:      []string{".git", "node_modules", "dist", "bin", "tmp"},
			DefaultFileTypes: []string{"txt", "jpg", "png", "pdf", "docx", "xlsx"},
			LogPath:          "logs/app.log",
			Theme:            "light",
		},
	}
}

func (cs *ConfigService) Load() error {
	if _, err := os.Stat(cs.configPath); os.IsNotExist(err) {
		return cs.Save()
	}

	data, err := os.ReadFile(cs.configPath)
	if err != nil {
		return err
	}

	return yaml.Unmarshal(data, cs.config)
}

func (cs *ConfigService) Save() error {
	if err := os.MkdirAll(filepath.Dir(cs.configPath), 0755); err != nil {
		return err
	}

	data, err := yaml.Marshal(cs.config)
	if err != nil {
		return err
	}

	return os.WriteFile(cs.configPath, data, 0644)
}

func (cs *ConfigService) Get() *model.Config {
	return cs.config
}

func (cs *ConfigService) Update(config *model.Config) {
	cs.config = config
}
