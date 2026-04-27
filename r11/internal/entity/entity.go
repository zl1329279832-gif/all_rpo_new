package entity

import "github.com/hajimehoshi/ebiten/v2"

type Entity interface {
	Update()
	Draw(screen *ebiten.Image)
	IsActive() bool
}

type GameObject struct {
	X, Y          float64
	Width, Height float64
	Active        bool
}

func (g *GameObject) IsActive() bool {
	return g.Active
}

func (g *GameObject) GetBounds() (x1, y1, x2, y2 float64) {
	return g.X - g.Width/2, g.Y - g.Height/2, g.X + g.Width/2, g.Y + g.Height/2
}
