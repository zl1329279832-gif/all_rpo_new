package boss

import (
	"airwar/internal/bullet"
	"airwar/internal/config"
	"image/color"
	"math"
	"math/rand"
	"time"

	"github.com/hajimehoshi/ebiten/v2"
)

type Boss struct {
	X, Y          float64
	Width, Height float64
	Health        int
	MaxHealth     int
	Score         int
	Active        bool
	Time          float64
	Phase         int
	LastShot      time.Time
	SkillCooldown time.Duration
	LastSkill     time.Time
	TargetX       float64
	TargetY       float64
	Settings      *config.Settings
}

func NewBoss(settings *config.Settings, level int) *Boss {
	b := &Boss{
		Width:         100,
		Height:        80,
		Health:        20 + level*10,
		MaxHealth:     20 + level*10,
		Score:         2000 + level*500,
		Active:        true,
		Time:          0,
		Phase:         1,
		SkillCooldown: 3 * time.Second,
		Settings:      settings,
	}

	b.X = float64(settings.WindowWidth) / 2
	b.Y = -b.Height
	b.TargetX = b.X
	b.TargetY = 100
	b.LastShot = time.Now()
	b.LastSkill = time.Now()

	return b
}

func (b *Boss) Update() {
	if !b.Active {
		return
	}

	b.Time += 0.05

	if b.Y < b.TargetY {
		b.Y += 2
	} else {
		b.TargetX = float64(b.Settings.WindowWidth)/2 + math.Sin(b.Time)*150
		dx := b.TargetX - b.X
		if math.Abs(dx) > 3 {
			b.X += dx * 0.02
		}
	}

	healthPercent := float64(b.Health) / float64(b.MaxHealth)
	if healthPercent < 0.3 {
		b.Phase = 3
	} else if healthPercent < 0.6 {
		b.Phase = 2
	}
}

func (b *Boss) ShouldShoot() bool {
	if !b.Active {
		return false
	}

	var interval time.Duration
	switch b.Phase {
	case 1:
		interval = 800 * time.Millisecond
	case 2:
		interval = 500 * time.Millisecond
	case 3:
		interval = 300 * time.Millisecond
	}

	now := time.Now()
	if now.Sub(b.LastShot) >= interval {
		b.LastShot = now
		return true
	}
	return false
}

func (b *Boss) ShouldUseSkill() bool {
	if !b.Active {
		return false
	}

	now := time.Now()
	cooldown := b.SkillCooldown
	if b.Phase >= 2 {
		cooldown = b.SkillCooldown / 2
	}

	if now.Sub(b.LastSkill) >= cooldown {
		b.LastSkill = now
		return true
	}
	return false
}

func (b *Boss) GetBullets() []*bullet.Bullet {
	var bullets []*bullet.Bullet

	switch b.Phase {
	case 1:
		bullets = append(bullets, bullet.NewBossBullet(b.X, b.Y+b.Height/2, 0))
	case 2:
		for _, angle := range []float64{-30, 0, 30} {
			bullets = append(bullets, bullet.NewBossBullet(b.X, b.Y+b.Height/2, angle))
		}
	case 3:
		angles := []float64{-60, -30, 0, 30, 60}
		for _, angle := range angles {
			bullets = append(bullets, bullet.NewBossBullet(b.X, b.Y+b.Height/2, angle))
		}
	}

	return bullets
}

func (b *Boss) GetSkillBullets(playerX, playerY float64) []*bullet.Bullet {
	var bullets []*bullet.Bullet

	skillType := rand.Intn(3)
	switch skillType {
	case 0:
		for i := -4; i <= 4; i++ {
			angle := float64(i * 20)
			bullets = append(bullets, bullet.NewBossBullet(b.X, b.Y+b.Height/2, angle))
		}
	case 1:
		angle := math.Atan2(playerY-b.Y, playerX-b.X) * 180 / math.Pi
		for i := -1; i <= 1; i++ {
			bullets = append(bullets, bullet.NewBossBullet(b.X, b.Y+b.Height/2, angle+float64(i*15)))
		}
	case 2:
		numBullets := 12
		for i := 0; i < numBullets; i++ {
			angle := float64(i * 360 / numBullets)
			bullets = append(bullets, bullet.NewBossBullet(b.X, b.Y, angle))
		}
	}

	return bullets
}

func (b *Boss) Draw(screen *ebiten.Image) {
	if !b.Active {
		return
	}

	img := ebiten.NewImage(int(b.Width), int(b.Height))
	var bossColor color.Color
	switch b.Phase {
	case 1:
		bossColor = color.RGBA{150, 0, 200, 255}
	case 2:
		bossColor = color.RGBA{200, 0, 150, 255}
	case 3:
		bossColor = color.RGBA{255, 0, 100, 255}
	}
	img.Fill(bossColor)

	op := &ebiten.DrawImageOptions{}
	op.GeoM.Translate(-b.Width/2, -b.Height/2)
	op.GeoM.Translate(b.X, b.Y)
	screen.DrawImage(img, op)

	barWidth := b.Width
	barHeight := 8.0
	barImg := ebiten.NewImage(int(barWidth), int(barHeight))
	barImg.Fill(color.RGBA{100, 100, 100, 255})
	barOp := &ebiten.DrawImageOptions{}
	barOp.GeoM.Translate(-barWidth/2, -b.Height/2-15)
	barOp.GeoM.Translate(b.X, b.Y)
	screen.DrawImage(barImg, barOp)

	healthPercent := float64(b.Health) / float64(b.MaxHealth)
	healthWidth := barWidth * healthPercent
	healthImg := ebiten.NewImage(int(healthWidth), int(barHeight))
	healthColor := color.RGBA{255, 0, 0, 255}
	if healthPercent > 0.5 {
		healthColor = color.RGBA{0, 255, 0, 255}
	} else if healthPercent > 0.25 {
		healthColor = color.RGBA{255, 255, 0, 255}
	}
	healthImg.Fill(healthColor)
	healthOp := &ebiten.DrawImageOptions{}
	healthOp.GeoM.Translate(-barWidth/2, -b.Height/2-15)
	healthOp.GeoM.Translate(b.X, b.Y)
	screen.DrawImage(healthImg, healthOp)
}

func (b *Boss) TakeDamage() bool {
	b.Health--
	return b.Health <= 0
}

func (b *Boss) GetBounds() (x1, y1, x2, y2 float64) {
	return b.X - b.Width/2, b.Y - b.Height/2, b.X + b.Width/2, b.Y + b.Height/2
}
