package level

import (
	"airwar/internal/config"
	"airwar/internal/enemy"
	"math/rand"
	"time"
)

type LevelManager struct {
	CurrentLevel        int
	Score               int
	EnemiesKilled       int
	BossDefeated        bool
	BossActive          bool
	EnemySpawnInterval  time.Duration
	LastEnemySpawn      time.Time
	EnemiesPerLevel     int
	Settings            *config.Settings
}

func NewLevelManager(settings *config.Settings) *LevelManager {
	return &LevelManager{
		CurrentLevel:       1,
		Score:              0,
		EnemiesKilled:      0,
		BossDefeated:       false,
		BossActive:         false,
		EnemySpawnInterval: 2 * time.Second,
		LastEnemySpawn:     time.Now(),
		EnemiesPerLevel:    20,
		Settings:           settings,
	}
}

func (l *LevelManager) ShouldSpawnEnemy() bool {
	if l.BossActive {
		return false
	}

	now := time.Now()
	if now.Sub(l.LastEnemySpawn) >= l.EnemySpawnInterval {
		l.LastEnemySpawn = now
		return true
	}
	return false
}

func (l *LevelManager) ShouldSpawnBoss() bool {
	if l.BossActive || l.BossDefeated {
		return false
	}

	if l.EnemiesKilled >= l.EnemiesPerLevel {
		l.BossActive = true
		return true
	}
	return false
}

func (l *LevelManager) GetEnemyType() enemy.EnemyType {
	randVal := rand.Intn(100)

	if l.CurrentLevel <= 2 {
		if randVal < 80 {
			return enemy.EnemyTypeSmall
		}
		return enemy.EnemyTypeMedium
	} else if l.CurrentLevel <= 5 {
		if randVal < 60 {
			return enemy.EnemyTypeSmall
		} else if randVal < 90 {
			return enemy.EnemyTypeMedium
		}
		return enemy.EnemyTypeLarge
	} else {
		if randVal < 40 {
			return enemy.EnemyTypeSmall
		} else if randVal < 75 {
			return enemy.EnemyTypeMedium
		}
		return enemy.EnemyTypeLarge
	}
}

func (l *LevelManager) AddEnemyKilled() {
	l.EnemiesKilled++
}

func (l *LevelManager) BossDefeatedNotify() {
	l.BossDefeated = true
	l.BossActive = false
}

func (l *LevelManager) NextLevel() {
	l.CurrentLevel++
	l.EnemiesKilled = 0
	l.BossDefeated = false
	l.BossActive = false
	l.EnemiesPerLevel = 20 + l.CurrentLevel*5

	baseInterval := 2000 * time.Millisecond
	minInterval := 500 * time.Millisecond
	l.EnemySpawnInterval = time.Duration(
		max(int64(minInterval), int64(baseInterval)-int64(l.CurrentLevel)*100_000_000),
	)
}

func (l *LevelManager) Reset() {
	l.CurrentLevel = 1
	l.EnemiesKilled = 0
	l.BossDefeated = false
	l.BossActive = false
	l.EnemySpawnInterval = 2 * time.Second
	l.LastEnemySpawn = time.Now()
	l.EnemiesPerLevel = 20
}

func (l *LevelManager) GetLevel() int {
	return l.CurrentLevel
}

func (l *LevelManager) IsBossStage() bool {
	return l.BossActive || l.EnemiesKilled >= l.EnemiesPerLevel
}

func max(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}
