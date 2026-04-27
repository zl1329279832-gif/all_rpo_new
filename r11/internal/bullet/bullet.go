package bullet

import (
	"airwar/internal/entity"
	"image/color"

	"github.com/hajimehoshi/ebiten/v2"
)

type BulletType int

const (
	BulletTypePlayer BulletType = iota
	BulletTypeEnemy
	BulletTypeBoss
)

type Bullet struct {
	entity.GameObject
	Type       BulletType
	Damage     int
	Speed      float64
	Angle      float64
	Color      color.Color
	IsPooled   bool
}

type BulletPool struct {
	playerBullets []*Bullet
	enemyBullets  []*Bullet
	bossBullets   []*Bullet
}

var pool *BulletPool

func InitBulletPool() {
	pool = &BulletPool{
		playerBullets: make([]*Bullet, 0, 100),
		enemyBullets:  make([]*Bullet, 0, 50),
		bossBullets:   make([]*Bullet, 0, 100),
	}
}

func GetBullet(bulletType BulletType) *Bullet {
	var b *Bullet
	switch bulletType {
	case BulletTypePlayer:
		if len(pool.playerBullets) > 0 {
			b = pool.playerBullets[len(pool.playerBullets)-1]
			pool.playerBullets = pool.playerBullets[:len(pool.playerBullets)-1]
		} else {
			b = &Bullet{IsPooled: true}
		}
	case BulletTypeEnemy:
		if len(pool.enemyBullets) > 0 {
			b = pool.enemyBullets[len(pool.enemyBullets)-1]
			pool.enemyBullets = pool.enemyBullets[:len(pool.enemyBullets)-1]
		} else {
			b = &Bullet{IsPooled: true}
		}
	case BulletTypeBoss:
		if len(pool.bossBullets) > 0 {
			b = pool.bossBullets[len(pool.bossBullets)-1]
			pool.bossBullets = pool.bossBullets[:len(pool.bossBullets)-1]
		} else {
			b = &Bullet{IsPooled: true}
		}
	}
	b.Active = true
	return b
}

func ReturnBullet(b *Bullet) {
	if !b.IsPooled || !b.Active {
		return
	}
	b.Active = false
	switch b.Type {
	case BulletTypePlayer:
		pool.playerBullets = append(pool.playerBullets, b)
	case BulletTypeEnemy:
		pool.enemyBullets = append(pool.enemyBullets, b)
	case BulletTypeBoss:
		pool.bossBullets = append(pool.bossBullets, b)
	}
}

func NewPlayerBullet(x, y float64) *Bullet {
	b := GetBullet(BulletTypePlayer)
	b.Type = BulletTypePlayer
	b.X = x
	b.Y = y
	b.Width = 6
	b.Height = 16
	b.Damage = 1
	b.Speed = 10
	b.Angle = 0
	b.Color = color.RGBA{0, 255, 255, 255}
	return b
}

func NewEnemyBullet(x, y float64) *Bullet {
	b := GetBullet(BulletTypeEnemy)
	b.Type = BulletTypeEnemy
	b.X = x
	b.Y = y
	b.Width = 8
	b.Height = 8
	b.Damage = 1
	b.Speed = 5
	b.Angle = 0
	b.Color = color.RGBA{255, 100, 100, 255}
	return b
}

func NewBossBullet(x, y float64, angle float64) *Bullet {
	b := GetBullet(BulletTypeBoss)
	b.Type = BulletTypeBoss
	b.X = x
	b.Y = y
	b.Width = 10
	b.Height = 10
	b.Damage = 1
	b.Speed = 4
	b.Angle = angle
	b.Color = color.RGBA{255, 0, 255, 255}
	return b
}

func (b *Bullet) Update() {
	if !b.Active {
		return
	}

	if b.Type == BulletTypePlayer {
		b.Y -= b.Speed
	} else {
		b.X += b.Speed * cos(b.Angle)
		b.Y += b.Speed * sin(b.Angle)
	}

	if b.Y < -50 || b.Y > 700 || b.X < -50 || b.X > 530 {
		ReturnBullet(b)
	}
}

func (b *Bullet) Draw(screen *ebiten.Image) {
	if !b.Active {
		return
	}

	drawBullet(screen, b)
}

func drawBullet(screen *ebiten.Image, b *Bullet) {
	img := ebiten.NewImage(int(b.Width), int(b.Height))
	img.Fill(b.Color)

	op := &ebiten.DrawImageOptions{}
	op.GeoM.Translate(-b.Width/2, -b.Height/2)
	op.GeoM.Translate(b.X, b.Y)
	screen.DrawImage(img, op)
}

func cos(angle float64) float64 {
	if angle == 0 {
		return 0
	}
	if angle == 45 {
		return 0.707
	}
	if angle == -45 {
		return -0.707
	}
	if angle == 90 {
		return 1
	}
	if angle == -90 {
		return -1
	}
	return 0
}

func sin(angle float64) float64 {
	if angle == 0 {
		return 1
	}
	if angle == 45 {
		return 0.707
	}
	if angle == -45 {
		return 0.707
	}
	if angle == 90 {
		return 0
	}
	if angle == -90 {
		return 0
	}
	return 1
}
