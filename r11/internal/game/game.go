package game

import (
	"airwar/internal/boss"
	"airwar/internal/bullet"
	"airwar/internal/collision"
	"airwar/internal/config"
	"airwar/internal/entity"
	"airwar/internal/enemy"
	"airwar/internal/level"
	"airwar/internal/player"
	"airwar/internal/powerup"
	"airwar/internal/storage"
	"fmt"
	"image/color"
	"math/rand"
	"time"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/ebitenutil"
	"github.com/hajimehoshi/ebiten/v2/inpututil"
)

type Game struct {
	Settings        *config.Settings
	Rankings        []config.RankingEntry
	Player          *player.Player
	LevelManager    *level.LevelManager
	CurrentState    int
	PlayerNickname  string
	HighScore       int

	enemies         []*enemy.Enemy
	bossEntity      *boss.Boss
	playerBullets   []*bullet.Bullet
	enemyBullets    []*bullet.Bullet
	powerUps        []*powerup.PowerUp
	explosions      []*entity.Explosion

	score           int
	lives           int
	level           int
}

func NewGame() (*Game, error) {
	settings, err := storage.LoadSettings()
	if err != nil {
		return nil, err
	}

	rankings, err := storage.LoadRankings()
	if err != nil {
		return nil, err
	}

	highScore := 0
	if len(rankings) > 0 {
		highScore = rankings[0].Score
	}

	g := &Game{
		Settings:       settings,
		Rankings:       rankings,
		CurrentState:   config.GameStateMenu,
		PlayerNickname: settings.DefaultNickname,
		HighScore:      highScore,
	}

	bullet.InitBulletPool()
	g.resetGame()

	return g, nil
}

func (g *Game) resetGame() {
	g.Player = player.NewPlayer(g.Settings)
	g.Player.HighScore = g.HighScore
	g.LevelManager = level.NewLevelManager(g.Settings)

	g.enemies = []*enemy.Enemy{}
	g.bossEntity = nil
	g.playerBullets = []*bullet.Bullet{}
	g.enemyBullets = []*bullet.Bullet{}
	g.powerUps = []*powerup.PowerUp{}
	g.explosions = []*entity.Explosion{}

	g.score = 0
	g.lives = 3
	g.level = 1
}

func (g *Game) Update() error {
	switch g.CurrentState {
	case config.GameStateMenu:
		g.updateMenu()
	case config.GameStatePlaying:
		g.updatePlaying()
	case config.GameStatePaused:
		g.updatePaused()
	case config.GameStateGameOver:
		g.updateGameOver()
	case config.GameStateLeaderboard:
		g.updateLeaderboard()
	}

	return nil
}

func (g *Game) updateMenu() {
	if inpututil.IsKeyJustPressed(ebiten.KeyEnter) || inpututil.IsKeyJustPressed(ebiten.KeySpace) {
		g.startGame()
	}
	if inpututil.IsKeyJustPressed(ebiten.KeyL) {
		g.CurrentState = config.GameStateLeaderboard
	}
	if inpututil.IsKeyJustPressed(ebiten.KeyM) {
		g.Settings.SoundEnabled = !g.Settings.SoundEnabled
		storage.SaveSettings(g.Settings)
	}
}

func (g *Game) updatePlaying() {
	if inpututil.IsKeyJustPressed(ebiten.KeyEscape) || inpututil.IsKeyJustPressed(ebiten.KeyP) {
		g.CurrentState = config.GameStatePaused
		return
	}

	g.Player.Update()

	playerBullets := g.Player.GetBullets()
	g.playerBullets = append(g.playerBullets, playerBullets...)

	if g.LevelManager.ShouldSpawnEnemy() {
		enemyType := g.LevelManager.GetEnemyType()
		newEnemy := enemy.NewEnemy(g.Settings, enemyType)
		g.enemies = append(g.enemies, newEnemy)
	}

	if g.LevelManager.ShouldSpawnBoss() && g.bossEntity == nil {
		g.bossEntity = boss.NewBoss(g.Settings, g.LevelManager.GetLevel())
	}

	for _, e := range g.enemies {
		e.Update()
		if e.ShouldShoot() {
			g.enemyBullets = append(g.enemyBullets, e.GetBullet())
		}
	}

	if g.bossEntity != nil {
		g.bossEntity.Update()
		if g.bossEntity.ShouldShoot() {
			g.enemyBullets = append(g.enemyBullets, g.bossEntity.GetBullets()...)
		}
		if g.bossEntity.ShouldUseSkill() {
			g.enemyBullets = append(g.enemyBullets, g.bossEntity.GetSkillBullets(g.Player.X, g.Player.Y)...)
		}
	}

	for _, b := range g.playerBullets {
		b.Update()
	}
	for _, b := range g.enemyBullets {
		b.Update()
	}
	for _, p := range g.powerUps {
		p.Update()
	}
	for _, e := range g.explosions {
		e.Update()
	}

	g.checkCollisions()
	g.cleanupInactive()

	g.score = g.Player.Score
	g.lives = g.Player.Lives
	g.level = g.LevelManager.GetLevel()
}

func (g *Game) updatePaused() {
	if inpututil.IsKeyJustPressed(ebiten.KeyEscape) || inpututil.IsKeyJustPressed(ebiten.KeyP) {
		g.CurrentState = config.GameStatePlaying
	}
	if inpututil.IsKeyJustPressed(ebiten.KeyR) {
		g.resetGame()
		g.CurrentState = config.GameStateMenu
	}
}

func (g *Game) updateGameOver() {
	if inpututil.IsKeyJustPressed(ebiten.KeyR) {
		g.resetGame()
		g.startGame()
	}
	if inpututil.IsKeyJustPressed(ebiten.KeyEscape) {
		g.CurrentState = config.GameStateMenu
	}
}

func (g *Game) updateLeaderboard() {
	if inpututil.IsKeyJustPressed(ebiten.KeyEscape) || inpututil.IsKeyJustPressed(ebiten.KeyM) {
		g.CurrentState = config.GameStateMenu
	}
}

func (g *Game) startGame() {
	g.resetGame()
	g.CurrentState = config.GameStatePlaying
}

func (g *Game) checkCollisions() {
	for i := len(g.playerBullets) - 1; i >= 0; i-- {
		b := g.playerBullets[i]
		if !b.Active {
			continue
		}

		for j := len(g.enemies) - 1; j >= 0; j-- {
			e := g.enemies[j]
			if !e.Active {
				continue
			}

			if collision.CheckCollision(b, e) {
				bullet.ReturnBullet(b)
				if e.TakeDamage() {
					g.explosions = append(g.explosions, entity.NewExplosion(e.X, e.Y, e.Width))
					g.Player.AddScore(e.Score)
					g.LevelManager.AddEnemyKilled()
					e.Active = false

					if rand.Float64() < 0.2 {
						g.powerUps = append(g.powerUps, powerup.NewPowerUp(e.X, e.Y))
					}
				}
				break
			}
		}

		if g.bossEntity != nil && g.bossEntity.Active && b.Active {
			if collision.CheckCollision(b, g.bossEntity) {
				bullet.ReturnBullet(b)
				if g.bossEntity.TakeDamage() {
					g.explosions = append(g.explosions, entity.NewLargeExplosion(g.bossEntity.X, g.bossEntity.Y))
					g.Player.AddScore(g.bossEntity.Score)
					g.LevelManager.BossDefeatedNotify()
					g.bossEntity.Active = false
					g.bossEntity = nil

					for i := -2; i <= 2; i++ {
						g.powerUps = append(g.powerUps, powerup.NewPowerUp(
							float64(g.Settings.WindowWidth)/2+float64(i*60),
							150,
						))
					}

					go func() {
						time.Sleep(2 * time.Second)
						g.LevelManager.NextLevel()
					}()
				}
			}
		}
	}

	for i := len(g.enemyBullets) - 1; i >= 0; i-- {
		b := g.enemyBullets[i]
		if !b.Active {
			continue
		}

		if collision.CheckCollision(b, g.Player) {
			bullet.ReturnBullet(b)
			if g.Player.TakeDamage() {
				g.gameOver()
			}
		}
	}

	for i := len(g.enemies) - 1; i >= 0; i-- {
		e := g.enemies[i]
		if !e.Active {
			continue
		}

		if collision.CheckCollision(e, g.Player) {
			g.explosions = append(g.explosions, entity.NewExplosion(e.X, e.Y, e.Width))
			e.Active = false
			if g.Player.TakeDamage() {
				g.gameOver()
			}
		}
	}

	for i := len(g.powerUps) - 1; i >= 0; i-- {
		p := g.powerUps[i]
		if !p.Active {
			continue
		}

		if collision.CheckCollision(p, g.Player) {
			g.applyPowerUp(p)
			p.Active = false
		}
	}
}

func (g *Game) applyPowerUp(p *powerup.PowerUp) {
	switch p.Type {
	case powerup.PowerUpTypeHealth:
		g.Player.Heal()
	case powerup.PowerUpTypeShield:
		g.Player.ActivateShield()
	case powerup.PowerUpTypeDoubleFire:
		g.Player.ActivateDoubleFire()
	case powerup.PowerUpTypeMultiBall:
		g.Player.ActivateMultiBall()
	case powerup.PowerUpTypeBomb:
		g.clearScreen()
	}
}

func (g *Game) clearScreen() {
	for _, e := range g.enemies {
		if e.Active {
			g.explosions = append(g.explosions, entity.NewExplosion(e.X, e.Y, e.Width))
			g.Player.AddScore(e.Score / 2)
			e.Active = false
		}
	}

	for _, b := range g.enemyBullets {
		bullet.ReturnBullet(b)
	}
}

func (g *Game) cleanupInactive() {
	activeEnemies := []*enemy.Enemy{}
	for _, e := range g.enemies {
		if e.Active {
			activeEnemies = append(activeEnemies, e)
		}
	}
	g.enemies = activeEnemies

	activePlayerBullets := []*bullet.Bullet{}
	for _, b := range g.playerBullets {
		if b.Active {
			activePlayerBullets = append(activePlayerBullets, b)
		}
	}
	g.playerBullets = activePlayerBullets

	activeEnemyBullets := []*bullet.Bullet{}
	for _, b := range g.enemyBullets {
		if b.Active {
			activeEnemyBullets = append(activeEnemyBullets, b)
		}
	}
	g.enemyBullets = activeEnemyBullets

	activePowerUps := []*powerup.PowerUp{}
	for _, p := range g.powerUps {
		if p.Active {
			activePowerUps = append(activePowerUps, p)
		}
	}
	g.powerUps = activePowerUps

	activeExplosions := []*entity.Explosion{}
	for _, e := range g.explosions {
		if e.Active {
			activeExplosions = append(activeExplosions, e)
		}
	}
	g.explosions = activeExplosions
}

func (g *Game) gameOver() {
	g.CurrentState = config.GameStateGameOver

	entry := config.RankingEntry{
		Nickname: g.PlayerNickname,
		Score:    g.Player.Score,
		Level:    g.LevelManager.GetLevel(),
		Date:     time.Now().Format("2006-01-02 15:04"),
	}

	storage.AddRanking(entry)

	rankings, _ := storage.LoadRankings()
	g.Rankings = rankings

	if len(rankings) > 0 {
		g.HighScore = rankings[0].Score
	}
}

func (g *Game) Draw(screen *ebiten.Image) {
	screen.Fill(color.RGBA{20, 20, 40, 255})

	switch g.CurrentState {
	case config.GameStateMenu:
		g.drawMenu(screen)
	case config.GameStatePlaying:
		g.drawPlaying(screen)
	case config.GameStatePaused:
		g.drawPlaying(screen)
		g.drawPauseOverlay(screen)
	case config.GameStateGameOver:
		g.drawGameOver(screen)
	case config.GameStateLeaderboard:
		g.drawLeaderboard(screen)
	}
}

func (g *Game) drawMenu(screen *ebiten.Image) {
	title := "飞机大战"
	subtitle := "Air War"
	instruction1 := "按 Enter 或 空格 开始游戏"
	instruction2 := "按 L 查看排行榜"
	instruction3 := fmt.Sprintf("按 M 切换音效 (当前: %s)", g.getSoundStatus())
	instruction4 := "控制: 方向键/WASD 移动, 空格 射击, P 暂停"

	ebitenutil.DebugPrintAt(screen, title, g.Settings.WindowWidth/2-60, 150)
	ebitenutil.DebugPrintAt(screen, subtitle, g.Settings.WindowWidth/2-40, 180)
	ebitenutil.DebugPrintAt(screen, instruction1, g.Settings.WindowWidth/2-120, 300)
	ebitenutil.DebugPrintAt(screen, instruction2, g.Settings.WindowWidth/2-70, 330)
	ebitenutil.DebugPrintAt(screen, instruction3, g.Settings.WindowWidth/2-100, 360)
	ebitenutil.DebugPrintAt(screen, instruction4, g.Settings.WindowWidth/2-150, 420)

	highScoreText := fmt.Sprintf("最高分: %d", g.HighScore)
	ebitenutil.DebugPrintAt(screen, highScoreText, g.Settings.WindowWidth/2-50, 500)
}

func (g *Game) getSoundStatus() string {
	if g.Settings.SoundEnabled {
		return "开启"
	}
	return "关闭"
}

func (g *Game) drawPlaying(screen *ebiten.Image) {
	for _, e := range g.enemies {
		e.Draw(screen)
	}

	if g.bossEntity != nil {
		g.bossEntity.Draw(screen)
	}

	g.Player.Draw(screen)

	for _, b := range g.playerBullets {
		b.Draw(screen)
	}
	for _, b := range g.enemyBullets {
		b.Draw(screen)
	}

	for _, p := range g.powerUps {
		p.Draw(screen)
	}

	for _, e := range g.explosions {
		e.Draw(screen)
	}

	g.drawHUD(screen)
}

func (g *Game) drawHUD(screen *ebiten.Image) {
	scoreText := fmt.Sprintf("分数: %d", g.Player.Score)
	livesText := fmt.Sprintf("生命: %d", g.Player.Lives)
	levelText := fmt.Sprintf("关卡: %d", g.LevelManager.GetLevel())
	highScoreText := fmt.Sprintf("最高: %d", g.HighScore)

	ebitenutil.DebugPrintAt(screen, scoreText, 10, 10)
	ebitenutil.DebugPrintAt(screen, livesText, 10, 30)
	ebitenutil.DebugPrintAt(screen, levelText, g.Settings.WindowWidth-80, 10)
	ebitenutil.DebugPrintAt(screen, highScoreText, g.Settings.WindowWidth-80, 30)

	if g.LevelManager.IsBossStage() && g.bossEntity == nil {
		warningText := "BOSS即将出现!"
		ebitenutil.DebugPrintAt(screen, warningText, g.Settings.WindowWidth/2-80, g.Settings.WindowHeight/2)
	}
}

func (g *Game) drawPauseOverlay(screen *ebiten.Image) {
	overlay := ebiten.NewImage(g.Settings.WindowWidth, g.Settings.WindowHeight)
	overlay.Fill(color.RGBA{0, 0, 0, 150})
	screen.DrawImage(overlay, nil)

	pauseText := "游戏暂停"
	resumeText := "按 P 或 ESC 继续"
	restartText := "按 R 返回主菜单"

	ebitenutil.DebugPrintAt(screen, pauseText, g.Settings.WindowWidth/2-40, g.Settings.WindowHeight/2-50)
	ebitenutil.DebugPrintAt(screen, resumeText, g.Settings.WindowWidth/2-90, g.Settings.WindowHeight/2)
	ebitenutil.DebugPrintAt(screen, restartText, g.Settings.WindowWidth/2-80, g.Settings.WindowHeight/2+30)
}

func (g *Game) drawGameOver(screen *ebiten.Image) {
	screen.Fill(color.RGBA{40, 20, 20, 255})

	gameOverText := "游戏结束"
	scoreText := fmt.Sprintf("最终分数: %d", g.Player.Score)
	levelText := fmt.Sprintf("到达关卡: %d", g.LevelManager.GetLevel())
	newHighScore := ""

	if g.Player.Score >= g.HighScore && g.Player.Score > 0 {
		newHighScore = "新纪录!"
	}

	restartText := "按 R 重新开始"
	menuText := "按 ESC 返回主菜单"

	ebitenutil.DebugPrintAt(screen, gameOverText, g.Settings.WindowWidth/2-50, 200)
	ebitenutil.DebugPrintAt(screen, scoreText, g.Settings.WindowWidth/2-70, 280)
	ebitenutil.DebugPrintAt(screen, levelText, g.Settings.WindowWidth/2-60, 310)
	if newHighScore != "" {
		ebitenutil.DebugPrintAt(screen, newHighScore, g.Settings.WindowWidth/2-40, 340)
	}
	ebitenutil.DebugPrintAt(screen, restartText, g.Settings.WindowWidth/2-70, 400)
	ebitenutil.DebugPrintAt(screen, menuText, g.Settings.WindowWidth/2-80, 430)
}

func (g *Game) drawLeaderboard(screen *ebiten.Image) {
	screen.Fill(color.RGBA{30, 30, 60, 255})

	title := "排行榜"
	ebitenutil.DebugPrintAt(screen, title, g.Settings.WindowWidth/2-40, 50)

	if len(g.Rankings) == 0 {
		ebitenutil.DebugPrintAt(screen, "暂无记录", g.Settings.WindowWidth/2-40, 150)
	} else {
		for i, entry := range g.Rankings {
			if i >= 10 {
				break
			}
			rankText := fmt.Sprintf("%d. %s - %d分 (关卡%d)", i+1, entry.Nickname, entry.Score, entry.Level)
			ebitenutil.DebugPrintAt(screen, rankText, 50, 120+i*30)
		}
	}

	instruction := "按 ESC 或 M 返回主菜单"
	ebitenutil.DebugPrintAt(screen, instruction, g.Settings.WindowWidth/2-100, g.Settings.WindowHeight-50)
}

func (g *Game) Layout(outsideWidth, outsideHeight int) (int, int) {
	return g.Settings.WindowWidth, g.Settings.WindowHeight
}

func (g *Game) Run() error {
	ebiten.SetWindowSize(g.Settings.WindowWidth, g.Settings.WindowHeight)
	ebiten.SetWindowTitle("飞机大战 - Air War")
	return ebiten.RunGame(g)
}
