package storage

import (
	"airwar/internal/config"
	"encoding/json"
	"os"
	"sort"
)

func ensureDataDir() error {
	if err := os.MkdirAll(config.DataDir, 0755); err != nil {
		return err
	}
	return nil
}

func LoadSettings() (*config.Settings, error) {
	if err := ensureDataDir(); err != nil {
		return nil, err
	}

	data, err := os.ReadFile(config.SettingsFile)
	if err != nil {
		if os.IsNotExist(err) {
			defaultSettings := config.DefaultSettings
			if err := SaveSettings(&defaultSettings); err != nil {
				return nil, err
			}
			return &defaultSettings, nil
		}
		return nil, err
	}

	var settings config.Settings
	if err := json.Unmarshal(data, &settings); err != nil {
		return nil, err
	}

	return &settings, nil
}

func SaveSettings(settings *config.Settings) error {
	if err := ensureDataDir(); err != nil {
		return err
	}

	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(config.SettingsFile, data, 0644)
}

func LoadRankings() ([]config.RankingEntry, error) {
	if err := ensureDataDir(); err != nil {
		return nil, err
	}

	data, err := os.ReadFile(config.RankingsFile)
	if err != nil {
		if os.IsNotExist(err) {
			defaultRankings := []config.RankingEntry{}
			if err := SaveRankings(defaultRankings); err != nil {
				return nil, err
			}
			return defaultRankings, nil
		}
		return nil, err
	}

	var rankings []config.RankingEntry
	if err := json.Unmarshal(data, &rankings); err != nil {
		return nil, err
	}

	sortRankings(rankings)
	return rankings, nil
}

func SaveRankings(rankings []config.RankingEntry) error {
	if err := ensureDataDir(); err != nil {
		return err
	}

	sortRankings(rankings)
	if len(rankings) > config.MaxRankings {
		rankings = rankings[:config.MaxRankings]
	}

	data, err := json.MarshalIndent(rankings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(config.RankingsFile, data, 0644)
}

func AddRanking(entry config.RankingEntry) error {
	rankings, err := LoadRankings()
	if err != nil {
		return err
	}

	rankings = append(rankings, entry)
	return SaveRankings(rankings)
}

func sortRankings(rankings []config.RankingEntry) {
	sort.Slice(rankings, func(i, j int) bool {
		return rankings[i].Score > rankings[j].Score
	})
}

func GetHighScore() int {
	rankings, err := LoadRankings()
	if err != nil || len(rankings) == 0 {
		return 0
	}
	return rankings[0].Score
}
