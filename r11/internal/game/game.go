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
	"math"
	"math/rand"
	"time"
	"unicode/utf8"

	"github.com/hajimehoshi/bitmapfont/v3"
	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/text"
	"github.com/hajimehoshi/ebiten/v2/inpututil"
	"golang.org/x/image/font"
)

type Star struct {
	X, Y   float64
	Speed  float64
	Size   float64
	Bright uint8
}

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
	stars           []*Star

	score           int
	lives           int
	level           int
	gameTime        float64

	smallFont       font.Face
	normalFont      font.Face
	largeFont       font.Face
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
		smallFont:      bitmapfont.Face,
		normalFont:     bitmapfont.Face,
		largeFont:      bitmapfont.Face,
	}

	bullet.InitBulletPool()
	g.initStars()
	g.resetGame()

	return g, nil
}

func (g *Game) initStars() {
	g.stars = make([]*Star, 50)
	for i := range g.stars {
		g.stars[i] = &Star{
			X:      rand.Float64() * float64(g.Settings.WindowWidth),
			Y:      rand.Float64() * float64(g.Settings.WindowHeight),
			Speed:  1 + rand.Float64()*3,
			Size:   1 + rand.Float64()*2,
			Bright: uint8(100 + rand.Intn(155)),
		}
	}
}

func (g *Game) updateStars() {
	g.gameTime += 1.0 / 60.0

	for _, star := range g.stars {
		star.Y += star.Speed
		if star.Y > float64(g.Settings.WindowHeight) {
			star.Y = -star.Size
			star.X = rand.Float64() * float64(g.Settings.WindowWidth)
			star.Speed = 1 + rand.Float64()*3
			star.Size = 1 + rand.Float64()*2
			star.Bright = uint8(100 + rand.Intn(155))
		}
	}
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
	g.gameTime = 0
}

func (g *Game) Update() error {
	g.updateStars()

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
	screen.Fill(color.RGBA{10, 10, 30, 255})
	g.drawStars(screen)

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

func (g *Game) drawStars(screen *ebiten.Image) {
	for _, star := range g.stars {
		starColor := color.RGBA{
			R: star.Bright,
			G: star.Bright,
			B: uint8(min(255, int(star.Bright)+50)),
			A: 255,
		}

		size := int(math.Max(1, star.Size))
		starImg := ebiten.NewImage(size, size)
		starImg.Fill(starColor)

		op := &ebiten.DrawImageOptions{}
		op.GeoM.Translate(star.X, star.Y)
		screen.DrawImage(starImg, op)
	}
}

func (g *Game) drawMenu(screen *ebiten.Image) {
	title := "飞机大战"
	instruction1 := "按 Enter 或 空格键 开始游戏"
	instruction2 := "按 L 键 查看排行榜"
	instruction3 := fmt.Sprintf("按 M 键 切换音效 (当前: %s)", g.getSoundStatus())
	instruction4 := "控制说明:"
	instruction5 := "  方向键/WASD - 移动飞机"
	instruction6 := "  空格键 - 射击 (自动射击默认开启)"
	instruction7 := "  P键/ESC - 暂停游戏"

	centerX := g.Settings.WindowWidth / 2

	g.drawTextWithShadow(screen, title, centerX, 120, color.RGBA{0, 255, 255, 255}, 2.0, true)

	g.drawText(screen, instruction1, centerX, 280, color.RGBA{200, 200, 200, 255}, 1.0, true)
	g.drawText(screen, instruction2, centerX, 310, color.RGBA{200, 200, 200, 255}, 1.0, true)
	g.drawText(screen, instruction3, centerX, 340, color.RGBA{200, 200, 200, 255}, 1.0, true)

	g.drawText(screen, instruction4, centerX, 400, color.RGBA{150, 255, 150, 255}, 1.0, true)
	g.drawText(screen, instruction5, centerX, 430, color.RGBA{150, 150, 150, 255}, 1.0, true)
	g.drawText(screen, instruction6, centerX, 455, color.RGBA{150, 150, 150, 255}, 1.0, true)
	g.drawText(screen, instruction7, centerX, 480, color.RGBA{150, 150, 150, 255}, 1.0, true)

	highScoreText := fmt.Sprintf("历史最高分: %d", g.HighScore)
	g.drawText(screen, highScoreText, centerX, 550, color.RGBA{255, 215, 0, 255}, 1.0, true)

	versionText := "版本 1.0"
	g.drawText(screen, versionText, g.Settings.WindowWidth-60, g.Settings.WindowHeight-20, color.RGBA{100, 100, 100, 255}, 0.8, false)
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

	panelImg := ebiten.NewImage(g.Settings.WindowWidth, 60)
	panelImg.Fill(color.RGBA{0, 0, 0, 180})
	panelOp := &ebiten.DrawImageOptions{}
	panelOp.GeoM.Translate(0, 0)
	screen.DrawImage(panelImg, panelOp)

	g.drawText(screen, scoreText, 20, 25, color.RGBA{255, 255, 0, 255}, 1.0, false)
	g.drawText(screen, livesText, 20, 48, color.RGBA{255, 100, 100, 255}, 1.0, false)
	g.drawText(screen, levelText, g.Settings.WindowWidth-100, 25, color.RGBA{100, 255, 100, 255}, 1.0, false)
	g.drawText(screen, highScoreText, g.Settings.WindowWidth-100, 48, color.RGBA{255, 215, 0, 255}, 1.0, false)

	if g.LevelManager.IsBossStage() && g.bossEntity == nil {
		flash := (int(g.gameTime*60) / 30) % 2
		if flash == 0 {
			warningText := "⚠ 警告: BOSS即将出现! ⚠"
			g.drawTextWithShadow(screen, warningText, g.Settings.WindowWidth/2, g.Settings.WindowHeight/2, color.RGBA{255, 50, 50, 255}, 1.5, true)
		}
	}

	if g.Player.Shield {
		shieldText := "🛡 护盾已激活"
		g.drawText(screen, shieldText, g.Settings.WindowWidth/2, 80, color.RGBA{0, 200, 255, 255}, 0.9, true)
	}
	if g.Player.DoubleFire {
		doubleText := "⚡ 双倍火力"
		g.drawText(screen, doubleText, g.Settings.WindowWidth/2, 100, color.RGBA{255, 200, 0, 255}, 0.9, true)
	}
	if g.Player.MultiBall {
		multiText := "🌟 多弹道射击"
		g.drawText(screen, multiText, g.Settings.WindowWidth/2, 120, color.RGBA{200, 0, 255, 255}, 0.9, true)
	}
}

func (g *Game) drawPauseOverlay(screen *ebiten.Image) {
	overlay := ebiten.NewImage(g.Settings.WindowWidth, g.Settings.WindowHeight)
	overlay.Fill(color.RGBA{0, 0, 0, 180})
	screen.DrawImage(overlay, nil)

	centerX := g.Settings.WindowWidth / 2
	centerY := g.Settings.WindowHeight / 2

	pauseText := "游戏暂停"
	resumeText := "按 P 键 或 ESC 键 继续游戏"
	restartText := "按 R 键 返回主菜单"

	g.drawTextWithShadow(screen, pauseText, centerX, centerY-60, color.RGBA{255, 255, 255, 255}, 1.8, true)
	g.drawText(screen, resumeText, centerX, centerY, color.RGBA{200, 200, 200, 255}, 1.0, true)
	g.drawText(screen, restartText, centerX, centerY+40, color.RGBA{200, 200, 200, 255}, 1.0, true)
}

func (g *Game) drawGameOver(screen *ebiten.Image) {
	centerX := g.Settings.WindowWidth / 2

	gameOverText := "游戏结束"
	scoreText := fmt.Sprintf("最终分数: %d", g.Player.Score)
	levelText := fmt.Sprintf("到达关卡: 第 %d 关", g.LevelManager.GetLevel())
	newHighScore := ""

	isNewHighScore := g.Player.Score >= g.HighScore && g.Player.Score > 0
	if isNewHighScore {
		newHighScore = "🎉 新纪录! 🎉"
	}

	restartText := "按 R 键 重新开始"
	menuText := "按 ESC 键 返回主菜单"

	g.drawTextWithShadow(screen, gameOverText, centerX, 150, color.RGBA{255, 50, 50, 255}, 2.0, true)

	if isNewHighScore {
		g.drawTextWithShadow(screen, newHighScore, centerX, 220, color.RGBA{255, 215, 0, 255}, 1.5, true)
	}

	g.drawText(screen, scoreText, centerX, 280, color.RGBA{255, 255, 0, 255}, 1.2, true)
	g.drawText(screen, levelText, centerX, 320, color.RGBA{100, 255, 100, 255}, 1.2, true)

	g.drawText(screen, restartText, centerX, 420, color.RGBA{200, 200, 200, 255}, 1.0, true)
	g.drawText(screen, menuText, centerX, 460, color.RGBA{200, 200, 200, 255}, 1.0, true)
}

func (g *Game) drawLeaderboard(screen *ebiten.Image) {
	title := "🏆 排行榜 🏆"
	centerX := g.Settings.WindowWidth / 2

	g.drawTextWithShadow(screen, title, centerX, 60, color.RGBA{255, 215, 0, 255}, 1.8, true)

	if len(g.Rankings) == 0 {
		emptyText := "暂无游戏记录"
		g.drawText(screen, emptyText, centerX, 180, color.RGBA{150, 150, 150, 255}, 1.0, true)
	} else {
		headers := []string{"排名", "玩家", "分数", "关卡"}
		headerColors := []color.RGBA{
			{255, 100, 100, 255},
			{100, 255, 100, 255},
			{255, 255, 100, 255},
			{100, 200, 255, 255},
		}

		colX := []int{60, 140, 280, 400}
		for i, header := range headers {
			g.drawText(screen, header, colX[i], 110, headerColors[i], 1.0, false)
		}

		sepImg := ebiten.NewImage(g.Settings.WindowWidth-40, 2)
		sepImg.Fill(color.RGBA{100, 100, 100, 255})
		sepOp := &ebiten.DrawImageOptions{}
		sepOp.GeoM.Translate(20, 125)
		screen.DrawImage(sepImg, sepOp)

		for i, entry := range g.Rankings {
			if i >= 10 {
				break
			}

			y := 150 + i*35
			rankText := fmt.Sprintf("%d", i+1)
			nameText := entry.Nickname
			scoreText := fmt.Sprintf("%d", entry.Score)
			levelText := fmt.Sprintf("第%d关", entry.Level)

			var rankColor color.RGBA
			switch i {
			case 0:
				rankColor = color.RGBA{255, 215, 0, 255}
			case 1:
				rankColor = color.RGBA{192, 192, 192, 255}
			case 2:
				rankColor = color.RGBA{205, 127, 50, 255}
			default:
				rankColor = color.RGBA{200, 200, 200, 255}
			}

			g.drawText(screen, rankText, colX[0], y, rankColor, 1.0, false)
			g.drawText(screen, nameText, colX[1], y, color.RGBA{200, 255, 200, 255}, 1.0, false)
			g.drawText(screen, scoreText, colX[2], y, color.RGBA{255, 255, 150, 255}, 1.0, false)
			g.drawText(screen, levelText, colX[3], y, color.RGBA{150, 200, 255, 255}, 1.0, false)
		}
	}

	instruction := "按 ESC 键 或 M 键 返回主菜单"
	g.drawText(screen, instruction, centerX, g.Settings.WindowHeight-30, color.RGBA{150, 150, 150, 255}, 1.0, true)
}

func (g *Game) drawText(screen *ebiten.Image, textStr string, x, y int, textColor color.Color, scale float64, centered bool) {
	face := bitmapfont.Face

	drawX := x
	drawY := y + 16

	if centered {
		approxWidth := measureTextWidth(textStr)
		drawX = x - approxWidth/2
	}

	text.Draw(screen, textStr, face, drawX, drawY, textColor)
}

func (g *Game) drawTextWithShadow(screen *ebiten.Image, textStr string, x, y int, textColor color.Color, scale float64, centered bool) {
	face := bitmapfont.Face

	drawX := x
	drawY := y + 16

	if centered {
		approxWidth := measureTextWidth(textStr)
		drawX = x - approxWidth/2
	}

	shadowColor := color.RGBA{0, 0, 0, 180}
	text.Draw(screen, textStr, face, drawX+1, drawY+1, shadowColor)
	text.Draw(screen, textStr, face, drawX, drawY, textColor)
}

func measureTextWidth(textStr string) int {
	runeCount := utf8.RuneCountInString(textStr)
	return runeCount * 16
}

func (g *Game) Layout(outsideWidth, outsideHeight int) (int, int) {
	return g.Settings.WindowWidth, g.Settings.WindowHeight
}

func (g *Game) Run() error {
	ebiten.SetWindowSize(g.Settings.WindowWidth, g.Settings.WindowHeight)
	ebiten.SetWindowTitle("飞机大战 - 经典射击游戏")
	ebiten.SetWindowResizingMode(ebiten.WindowResizingModeDisabled)
	return ebiten.RunGame(g)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
