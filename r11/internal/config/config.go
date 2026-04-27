package config

type Settings struct {
	SoundEnabled  bool   `json:"sound_enabled"`
	WindowWidth   int    `json:"window_width"`
	WindowHeight  int    `json:"window_height"`
	DefaultNickname string `json:"default_nickname"`
	AutoShoot     bool   `json:"auto_shoot"`
}

type RankingEntry struct {
	Nickname string `json:"nickname"`
	Score    int    `json:"score"`
	Level    int    `json:"level"`
	Date     string `json:"date"`
}

var DefaultSettings = Settings{
	SoundEnabled:    true,
	WindowWidth:     480,
	WindowHeight:    640,
	DefaultNickname: "Player",
	AutoShoot:       true,
}

const (
	DataDir         = "data"
	SettingsFile    = "data/settings.json"
	RankingsFile    = "data/rankings.json"
	MaxRankings     = 10
)

const (
	GameStateMenu = iota
	GameStatePlaying
	GameStatePaused
	GameStateGameOver
	GameStateLeaderboard
)
