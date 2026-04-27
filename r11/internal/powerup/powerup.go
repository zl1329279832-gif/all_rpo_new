package powerup

import (
	"image/color"
	"math/rand"

	"github.com/hajimehoshi/ebiten/v2"
)

type PowerUpType int

const (
	PowerUpTypeHealth PowerUpType = iota
	PowerUpTypeShield
	PowerUpTypeDoubleFire
	PowerUpTypeMultiBall
	PowerUpTypeBomb
)

type PowerUp struct {
	X, Y          float64
	Width, Height float64
	Type          PowerUpType
	Speed         float64
	Active        bool
	Color         color.Color
}

func NewPowerUp(x, y float64) *PowerUp {
	pu := &PowerUp{
		Width:  30,
		Height: 30,
		X:      x,
		Y:      y,
		Speed:  2,
		Active: true,
	}

	types := []PowerUpType{
		PowerUpTypeHealth,
		PowerUpTypeShield,
		PowerUpTypeDoubleFire,
		PowerUpTypeMultiBall,
		PowerUpTypeBomb,
	}

	weights := []int{30, 20, 20, 15, 15}
	totalWeight := 0
	for _, w := range weights {
		totalWeight += w
	}

	r := rand.Intn(totalWeight)
	for i, w := range weights {
		r -= w
		if r <= 0 {
			pu.Type = types[i]
			break
		}
	}

	switch pu.Type {
	case PowerUpTypeHealth:
		pu.Color = color.RGBA{255, 0, 100, 255}
	case PowerUpTypeShield:
		pu.Color = color.RGBA{0, 200, 255, 255}
	case PowerUpTypeDoubleFire:
		pu.Color = color.RGBA{255, 200, 0, 255}
	case PowerUpTypeMultiBall:
		pu.Color = color.RGBA{200, 0, 255, 255}
	case PowerUpTypeBomb:
		pu.Color = color.RGBA{255, 100, 0, 255}
	}

	return pu
}

func (p *PowerUp) Update() {
	if !p.Active {
		return
	}

	p.Y += p.Speed

	if p.Y > 700 {
		p.Active = false
	}
}

func (p *PowerUp) Draw(screen *ebiten.Image) {
	if !p.Active {
		return
	}

	img := ebiten.NewImage(int(p.Width), int(p.Height))
	img.Fill(p.Color)

	op := &ebiten.DrawImageOptions{}
	op.GeoM.Translate(-p.Width/2, -p.Height/2)
	op.GeoM.Translate(p.X, p.Y)
	screen.DrawImage(img, op)

	labelImg := ebiten.NewImage(16, 16)
	var labelColor color.Color
	switch p.Type {
	case PowerUpTypeHealth:
		labelColor = color.RGBA{255, 255, 255, 255}
	case PowerUpTypeShield:
		labelColor = color.RGBA{255, 255, 255, 255}
	case PowerUpTypeDoubleFire:
		labelColor = color.RGBA{255, 255, 255, 255}
	case PowerUpTypeMultiBall:
		labelColor = color.RGBA{255, 255, 255, 255}
	case PowerUpTypeBomb:
		labelColor = color.RGBA{255, 255, 255, 255}
	}
	labelImg.Fill(labelColor)

	labelOp := &ebiten.DrawImageOptions{}
	labelOp.GeoM.Translate(-8, -8)
	labelOp.GeoM.Translate(p.X, p.Y)
	screen.DrawImage(labelImg, labelOp)
}

func (p *PowerUp) GetBounds() (x1, y1, x2, y2 float64) {
	return p.X - p.Width/2, p.Y - p.Height/2, p.X + p.Width/2, p.Y + p.Height/2
}
