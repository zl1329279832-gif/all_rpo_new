package entity

import (
	"image/color"
	"time"

	"github.com/hajimehoshi/ebiten/v2"
)

type Explosion struct {
	GameObject
	MaxSize    float64
	Frame     int
	TotalFrames int
	Duration  time.Duration
	StartTime time.Time
	Color     color.Color
}

func NewExplosion(x, y float64, size float64) *Explosion {
	return &Explosion{
		GameObject: GameObject{
			X:      x,
			Y:      y,
			Width:  size,
			Height: size,
			Active: true,
		},
		MaxSize:     size,
		Frame:       0,
		TotalFrames: 10,
		Duration:    300 * time.Millisecond,
		StartTime:   time.Now(),
		Color:       color.RGBA{255, 200, 0, 255},
	}
}

func NewLargeExplosion(x, y float64) *Explosion {
	e := NewExplosion(x, y, 80)
	e.Color = color.RGBA{255, 100, 0, 255}
	e.Duration = 500 * time.Millisecond
	return e
}

func (e *Explosion) Update() {
	if !e.Active {
		return
	}

	elapsed := time.Since(e.StartTime)
	progress := float64(elapsed) / float64(e.Duration)

	if progress >= 1.0 {
		e.Active = false
		return
	}

	e.Frame = int(progress * float64(e.TotalFrames))

	var targetSize float64
	if progress < 0.3 {
		targetSize = e.MaxSize * (progress / 0.3)
	} else if progress > 0.7 {
		fadeProgress := (progress - 0.7) / 0.3
		targetSize = e.MaxSize * (1 - fadeProgress*0.5)
	} else {
		targetSize = e.MaxSize
	}

	e.Width = max(1.0, targetSize)
	e.Height = max(1.0, targetSize)
}

func (e *Explosion) Draw(screen *ebiten.Image) {
	if !e.Active {
		return
	}

	elapsed := time.Since(e.StartTime)
	progress := float64(elapsed) / float64(e.Duration)

	alpha := 255
	if progress > 0.5 {
		alpha = int(255 * (1 - (progress-0.5)/0.5))
	}

	layers := []struct {
		size  float64
		color color.Color
	}{
		{max(2.0, e.Width*0.3), color.RGBA{255, 255, 200, uint8(alpha)}},
		{max(3.0, e.Width*0.6), color.RGBA{255, 200, 50, uint8(alpha * 3 / 4)}},
		{max(4.0, e.Width), color.RGBA{255, 100, 0, uint8(alpha / 2)}},
	}

	for _, layer := range layers {
		width := int(layer.size)
		height := int(layer.size)
		if width <= 0 {
			width = 1
		}
		if height <= 0 {
			height = 1
		}

		img := ebiten.NewImage(width, height)
		img.Fill(layer.color)

		op := &ebiten.DrawImageOptions{}
		op.GeoM.Translate(-layer.size/2, -layer.size/2)
		op.GeoM.Translate(e.X, e.Y)
		screen.DrawImage(img, op)
	}
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}
