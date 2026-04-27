package player

import (
	"airwar/internal/bullet"
	"airwar/internal/config"
	"image/color"
	"math"
	"time"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/inpututil"
)

type Player struct {
	X, Y              float64
	Width, Height     float64
	Lives             int
	Score             int
	HighScore         int
	Shield            bool
	ShieldTime        time.Time
	DoubleFire        bool
	DoubleFireTime    time.Time
	AutoShoot         bool
	LastShot          time.Time
	ShotInterval      time.Duration
	MultiBall         bool
	MultiBallTime     time.Time
	Invincible        bool
	InvincibleTime    time.Time
	Speed             float64
	Settings          *config.Settings
}

func NewPlayer(settings *config.Settings) *Player {
	return &Player{
		X:           float64(settings.WindowWidth) / 2,
		Y:           float64(settings.WindowHeight) - 100,
		Width:       40,
		Height:      40,
		Lives:       3,
		Score:       0,
		HighScore:   0,
		Shield:      false,
		DoubleFire:  false,
		AutoShoot:   settings.AutoShoot,
		ShotInterval: 150 * time.Millisecond,
		MultiBall:   false,
		Invincible:  false,
		Speed:       6,
		Settings:    settings,
	}
}

func (p *Player) Update() {
	p.handleInput()
	p.updatePowerups()
	p.handleShooting()
	p.clampPosition()
}

func (p *Player) handleInput() {
	speed := p.Speed

	if ebiten.IsKeyPressed(ebiten.KeyLeft) || ebiten.IsKeyPressed(ebiten.KeyA) {
		p.X -= speed
	}
	if ebiten.IsKeyPressed(ebiten.KeyRight) || ebiten.IsKeyPressed(ebiten.KeyD) {
		p.X += speed
	}
	if ebiten.IsKeyPressed(ebiten.KeyUp) || ebiten.IsKeyPressed(ebiten.KeyW) {
		p.Y -= speed
	}
	if ebiten.IsKeyPressed(ebiten.KeyDown) || ebiten.IsKeyPressed(ebiten.KeyS) {
		p.Y += speed
	}

	if inpututil.IsKeyJustPressed(ebiten.KeyP) {
		p.AutoShoot = !p.AutoShoot
	}
}

func (p *Player) updatePowerups() {
	now := time.Now()

	if p.Shield && now.Sub(p.ShieldTime) > 10*time.Second {
		p.Shield = false
	}

	if p.DoubleFire && now.Sub(p.DoubleFireTime) > 10*time.Second {
		p.DoubleFire = false
	}

	if p.MultiBall && now.Sub(p.MultiBallTime) > 10*time.Second {
		p.MultiBall = false
	}

	if p.Invincible && now.Sub(p.InvincibleTime) > 3*time.Second {
		p.Invincible = false
	}
}

func (p *Player) handleShooting() {
	canShoot := p.AutoShoot || ebiten.IsKeyPressed(ebiten.KeySpace)
	if !canShoot {
		return
	}

	now := time.Now()
	if now.Sub(p.LastShot) < p.ShotInterval {
		return
	}

	p.LastShot = now
}

func (p *Player) GetBullets() []*bullet.Bullet {
	var bullets []*bullet.Bullet

	now := time.Now()
	if now.Sub(p.LastShot) > p.ShotInterval*2 {
		return bullets
	}

	if now.Sub(p.LastShot) > p.ShotInterval/2 {
		return bullets
	}

	if p.MultiBall {
		for _, angle := range []float64{-15, 0, 15} {
			b := bullet.NewPlayerBullet(p.X, p.Y-p.Height/2)
			b.Angle = angle
			b.X += angle * 0.5
			bullets = append(bullets, b)
		}
	} else if p.DoubleFire {
		bullets = append(bullets, bullet.NewPlayerBullet(p.X-15, p.Y-p.Height/2))
		bullets = append(bullets, bullet.NewPlayerBullet(p.X+15, p.Y-p.Height/2))
	} else {
		bullets = append(bullets, bullet.NewPlayerBullet(p.X, p.Y-p.Height/2))
	}

	return bullets
}

func (p *Player) clampPosition() {
	minX := p.Width / 2
	maxX := float64(p.Settings.WindowWidth) - p.Width/2
	minY := p.Height / 2
	maxY := float64(p.Settings.WindowHeight) - p.Height/2

	p.X = math.Max(minX, math.Min(maxX, p.X))
	p.Y = math.Max(minY, math.Min(maxY, p.Y))
}

func (p *Player) Draw(screen *ebiten.Image) {
	if p.Invincible && int(time.Now().UnixMilli())/100%2 == 0 {
		return
	}

	img := ebiten.NewImage(int(p.Width), int(p.Height))
	playerColor := color.RGBA{0, 200, 255, 255}
	img.Fill(playerColor)

	op := &ebiten.DrawImageOptions{}
	op.GeoM.Translate(-p.Width/2, -p.Height/2)
	op.GeoM.Translate(p.X, p.Y)
	screen.DrawImage(img, op)

	if p.Shield {
		shieldImg := ebiten.NewImage(int(p.Width+20), int(p.Height+20))
		shieldColor := color.RGBA{0, 255, 255, 100}
		shieldImg.Fill(shieldColor)
		shieldOp := &ebiten.DrawImageOptions{}
		shieldOp.GeoM.Translate(-(p.Width+20)/2, -(p.Height+20)/2)
		shieldOp.GeoM.Translate(p.X, p.Y)
		screen.DrawImage(shieldImg, shieldOp)
	}
}

func (p *Player) TakeDamage() bool {
	if p.Invincible || p.Shield {
		return false
	}

	p.Lives--
	p.Invincible = true
	p.InvincibleTime = time.Now()

	return p.Lives <= 0
}

func (p *Player) ActivateShield() {
	p.Shield = true
	p.ShieldTime = time.Now()
}

func (p *Player) ActivateDoubleFire() {
	p.DoubleFire = true
	p.DoubleFireTime = time.Now()
}

func (p *Player) ActivateMultiBall() {
	p.MultiBall = true
	p.MultiBallTime = time.Now()
}

func (p *Player) Heal() {
	if p.Lives < 5 {
		p.Lives++
	}
}

func (p *Player) AddScore(points int) {
	p.Score += points
	if p.Score > p.HighScore {
		p.HighScore = p.Score
	}
}

func (p *Player) Reset() {
	p.X = float64(p.Settings.WindowWidth) / 2
	p.Y = float64(p.Settings.WindowHeight) - 100
	p.Lives = 3
	p.Score = 0
	p.Shield = false
	p.DoubleFire = false
	p.MultiBall = false
	p.Invincible = false
}

func (p *Player) GetBounds() (x1, y1, x2, y2 float64) {
	return p.X - p.Width/2, p.Y - p.Height/2, p.X + p.Width/2, p.Y + p.Height/2
}
