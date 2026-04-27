package enemy

import (
	"airwar/internal/bullet"
	"airwar/internal/config"
	"image/color"
	"math"
	"math/rand"
	"time"

	"github.com/hajimehoshi/ebiten/v2"
)

type EnemyType int

const (
	EnemyTypeSmall EnemyType = iota
	EnemyTypeMedium
	EnemyTypeLarge
)

type MovePattern int

const (
	MovePatternStraight MovePattern = iota
	MovePatternZigzag
	MovePatternSine
	MovePatternDiagonal
)

type Enemy struct {
	X, Y          float64
	Width, Height float64
	Type          EnemyType
	MovePattern   MovePattern
	Speed         float64
	Health        int
	MaxHealth     int
	Score         int
	Color         color.Color
	Active        bool
	ShootInterval time.Duration
	LastShot      time.Time
	CanShoot      bool
	Time          float64
	StartX        float64
	StartY        float64
}

func NewEnemy(settings *config.Settings, enemyType EnemyType) *Enemy {
	e := &Enemy{
		Active:        true,
		Time:          0,
	}

	switch enemyType {
	case EnemyTypeSmall:
		e.Width = 30
		e.Height = 30
		e.Health = 1
		e.MaxHealth = 1
		e.Score = 100
		e.Speed = 3
		e.Color = color.RGBA{255, 100, 100, 255}
		e.CanShoot = false
		e.MovePattern = MovePattern(rand.Intn(3))
	case EnemyTypeMedium:
		e.Width = 45
		e.Height = 45
		e.Health = 3
		e.MaxHealth = 3
		e.Score = 300
		e.Speed = 2.5
		e.Color = color.RGBA{255, 150, 50, 255}
		e.CanShoot = true
		e.ShootInterval = 2 * time.Second
		e.MovePattern = MovePattern(rand.Intn(4))
	case EnemyTypeLarge:
		e.Width = 60
		e.Height = 60
		e.Health = 5
		e.MaxHealth = 5
		e.Score = 500
		e.Speed = 1.5
		e.Color = color.RGBA{200, 0, 0, 255}
		e.CanShoot = true
		e.ShootInterval = 1500 * time.Millisecond
		e.MovePattern = MovePatternZigzag
	}

	e.X = float64(rand.Intn(settings.WindowWidth-int(e.Width))) + e.Width/2
	e.Y = -e.Height
	e.StartX = e.X
	e.StartY = e.Y
	e.LastShot = time.Now()

	return e
}

func (e *Enemy) Update() {
	if !e.Active {
		return
	}

	e.Time += 0.05

	switch e.MovePattern {
	case MovePatternStraight:
		e.Y += e.Speed
	case MovePatternZigzag:
		e.Y += e.Speed
		e.X = e.StartX + math.Sin(e.Time*2)*50
	case MovePatternSine:
		e.Y += e.Speed * 0.8
		e.X = e.StartX + math.Sin(e.Time*1.5)*80
	case MovePatternDiagonal:
		e.Y += e.Speed
		if e.StartX < 240 {
			e.X += e.Speed * 0.5
		} else {
			e.X -= e.Speed * 0.5
		}
	}

	if e.Y > 700 {
		e.Active = false
	}
}

func (e *Enemy) ShouldShoot() bool {
	if !e.Active || !e.CanShoot {
		return false
	}

	now := time.Now()
	if now.Sub(e.LastShot) >= e.ShootInterval {
		e.LastShot = now
		return true
	}
	return false
}

func (e *Enemy) GetBullet() *bullet.Bullet {
	return bullet.NewEnemyBullet(e.X, e.Y+e.Height/2)
}

func (e *Enemy) Draw(screen *ebiten.Image) {
	if !e.Active {
		return
	}

	img := ebiten.NewImage(int(e.Width), int(e.Height))
	img.Fill(e.Color)

	op := &ebiten.DrawImageOptions{}
	op.GeoM.Translate(-e.Width/2, -e.Height/2)
	op.GeoM.Translate(e.X, e.Y)
	screen.DrawImage(img, op)

	if e.MaxHealth > 1 {
		barWidth := e.Width
		barHeight := 4.0
		barImg := ebiten.NewImage(int(barWidth), int(barHeight))
		barImg.Fill(color.RGBA{100, 100, 100, 255})
		barOp := &ebiten.DrawImageOptions{}
		barOp.GeoM.Translate(-barWidth/2, -e.Height/2-10)
		barOp.GeoM.Translate(e.X, e.Y)
		screen.DrawImage(barImg, barOp)

		healthPercent := float64(e.Health) / float64(e.MaxHealth)
		healthWidth := barWidth * healthPercent
		healthImg := ebiten.NewImage(int(healthWidth), int(barHeight))
		healthImg.Fill(color.RGBA{0, 255, 0, 255})
		healthOp := &ebiten.DrawImageOptions{}
		healthOp.GeoM.Translate(-barWidth/2, -e.Height/2-10)
		healthOp.GeoM.Translate(e.X, e.Y)
		screen.DrawImage(healthImg, healthOp)
	}
}

func (e *Enemy) TakeDamage() bool {
	e.Health--
	return e.Health <= 0
}

func (e *Enemy) GetBounds() (x1, y1, x2, y2 float64) {
	return e.X - e.Width/2, e.Y - e.Height/2, e.X + e.Width/2, e.Y + e.Height/2
}
