package main

import (
	"fmt"
	"image/color"
	"math"
	"math/rand"
	"time"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/text"
	"github.com/hajimehoshi/ebiten/v2/vector"
	"golang.org/x/image/font/basicfont"
)

const (
	ScreenWidth  = 800
	ScreenHeight = 600
	PaddleWidth  = 100
	PaddleHeight = 15
	BallRadius   = 8
	BrickWidth   = 70
	BrickHeight  = 25
	BrickColumns = 10
	BrickRows    = 6
)

type GameState int

const (
	StateMenu GameState = iota
	StatePlaying
	StatePaused
	StateGameOver
	StateVictory
	StateLevelComplete
)

type BrickType int

const (
	BrickNormal BrickType = iota
	BrickMultiHP
	BrickUnbreakable
)

type PowerUpType int

const (
	PowerUpNone PowerUpType = iota
	PowerUpPaddleLong
	PowerUpPaddleShort
	PowerUpBallSpeedUp
	PowerUpExtraLife
	PowerUpPenetrate
	PowerUpMultiBall
)

type Vector struct {
	X float64
	Y float64
}

type Paddle struct {
	X      float64
	Y      float64
	Width  float64
	Height float64
	Speed  float64
	BaseWidth float64
}

type Ball struct {
	X         float64
	Y         float64
	Radius    float64
	Velocity  Vector
	BaseSpeed float64
	IsPenetrating bool
}

type Brick struct {
	X          float64
	Y          float64
	Width      float64
	Height     float64
	Type       BrickType
	HP         int
	MaxHP      int
	Color      color.Color
	Active     bool
}

type PowerUp struct {
	X         float64
	Y         float64
	Type      PowerUpType
	Active    bool
	FallSpeed float64
	Width     float64
	Height    float64
}

type Game struct {
	State         GameState
	Score         int
	Lives         int
	Level         int
	Paddle        *Paddle
	Balls         []*Ball
	Bricks        []*Brick
	PowerUps      []*PowerUp
	LastTime      time.Time
	DeltaTime     float64
	PowerUpActive map[PowerUpType]bool
	PowerUpTimer  map[PowerUpType]float64
}

func NewGame() *Game {
	g := &Game{
		State:         StateMenu,
		Score:         0,
		Lives:         3,
		Level:         1,
		PowerUpActive: make(map[PowerUpType]bool),
		PowerUpTimer:  make(map[PowerUpType]float64),
	}
	return g
}

func (g *Game) ResetGame() {
	g.Score = 0
	g.Lives = 3
	g.Level = 1
	g.PowerUpActive = make(map[PowerUpType]bool)
	g.PowerUpTimer = make(map[PowerUpType]float64)
	g.InitLevel()
	g.State = StatePlaying
}

func (g *Game) InitLevel() {
	g.Paddle = &Paddle{
		X:         float64(ScreenWidth)/2 - float64(PaddleWidth)/2,
		Y:         float64(ScreenHeight) - 50,
		Width:     float64(PaddleWidth),
		Height:    float64(PaddleHeight),
		Speed:     400,
		BaseWidth: float64(PaddleWidth),
	}

	g.Balls = []*Ball{}
	g.AddBall()

	g.GenerateBricks()
	g.PowerUps = []*PowerUp{}
}

func (g *Game) AddBall() {
	ball := &Ball{
		X:         g.Paddle.X + g.Paddle.Width/2,
		Y:         g.Paddle.Y - BallRadius - 1,
		Radius:    float64(BallRadius),
		BaseSpeed: 300 + float64(g.Level)*20,
		Velocity: Vector{
			X: 200,
			Y: -250,
		},
	}
	g.NormalizeBallVelocity(ball)
	g.Balls = append(g.Balls, ball)
}

func (g *Game) NormalizeBallVelocity(ball *Ball) {
	speed := math.Sqrt(ball.Velocity.X*ball.Velocity.X + ball.Velocity.Y*ball.Velocity.Y)
	ball.Velocity.X = ball.Velocity.X / speed * ball.BaseSpeed
	ball.Velocity.Y = ball.Velocity.Y / speed * ball.BaseSpeed
}

func (g *Game) GenerateBricks() {
	g.Bricks = []*Brick{}
	startX := (ScreenWidth - BrickColumns*BrickWidth) / 2
	startY := 60

	for row := 0; row < BrickRows; row++ {
		for col := 0; col < BrickColumns; col++ {
			x := float64(startX + col*BrickWidth)
			y := float64(startY + row*(BrickHeight+5))

			rand.Seed(time.Now().UnixNano() + int64(row*100+col))
			r := rand.Float64()

			var brickType BrickType
			var hp int
			var brickColor color.Color

			levelMod := math.Min(float64(g.Level), 5.0)
			unbreakableChance := 0.05 + levelMod*0.02
			multiHPChance := 0.15 + levelMod*0.03

			if r < unbreakableChance && g.Level > 1 {
				brickType = BrickUnbreakable
				hp = 1
				brickColor = color.RGBA{128, 128, 128, 255}
			} else if r < multiHPChance+unbreakableChance {
				brickType = BrickMultiHP
				hp = 2 + int(math.Floor(levelMod/2))
				brickColor = color.RGBA{255, 165, 0, 255}
			} else {
				brickType = BrickNormal
				hp = 1
				colors := []color.Color{
					color.RGBA{255, 99, 71, 255},
					color.RGBA{60, 179, 113, 255},
					color.RGBA{30, 144, 255, 255},
					color.RGBA{255, 215, 0, 255},
					color.RGBA{255, 105, 180, 255},
					color.RGBA{138, 43, 226, 255},
				}
				brickColor = colors[row%len(colors)]
			}

			brick := &Brick{
				X:      x,
				Y:      y,
				Width:  float64(BrickWidth),
				Height: float64(BrickHeight),
				Type:   brickType,
				HP:     hp,
				MaxHP:  hp,
				Color:  brickColor,
				Active: true,
			}
			g.Bricks = append(g.Bricks, brick)
		}
	}
}

func (g *Game) Update() error {
	if g.LastTime.IsZero() {
		g.LastTime = time.Now()
		return nil
	}

	now := time.Now()
	g.DeltaTime = now.Sub(g.LastTime).Seconds()
	g.LastTime = now

	if g.DeltaTime > 0.1 {
		g.DeltaTime = 0.1
	}

	switch g.State {
	case StateMenu:
		g.UpdateMenu()
	case StatePlaying:
		g.UpdatePlaying()
	case StatePaused:
		g.UpdatePaused()
	case StateGameOver:
		g.UpdateGameOver()
	case StateVictory:
		g.UpdateVictory()
	case StateLevelComplete:
		g.UpdateLevelComplete()
	}

	return nil
}

func (g *Game) UpdateMenu() {
	if ebiten.IsKeyPressed(ebiten.KeyEnter) || ebiten.IsKeyPressed(ebiten.KeySpace) {
		g.ResetGame()
	}
}

func (g *Game) UpdatePlaying() {
	if ebiten.IsKeyPressed(ebiten.KeyEscape) {
		g.State = StatePaused
		return
	}

	g.UpdatePowerUpTimers()
	g.UpdatePaddle()
	g.UpdateBalls()
	g.UpdatePowerUps()
	g.CheckLevelComplete()
}

func (g *Game) UpdatePowerUpTimers() {
	for powerType, timer := range g.PowerUpTimer {
		if timer > 0 {
			g.PowerUpTimer[powerType] -= g.DeltaTime
			if g.PowerUpTimer[powerType] <= 0 {
				g.PowerUpActive[powerType] = false
				delete(g.PowerUpTimer, powerType)
				
				if powerType == PowerUpPaddleLong || powerType == PowerUpPaddleShort {
					g.Paddle.Width = g.Paddle.BaseWidth
					g.Paddle.X = g.Paddle.X + g.Paddle.Width/2 - g.Paddle.BaseWidth/2
				}
				
				if powerType == PowerUpPenetrate {
					for _, ball := range g.Balls {
						ball.IsPenetrating = false
					}
				}
			}
		}
	}
}

func (g *Game) UpdatePaddle() {
	moveSpeed := g.Paddle.Speed * g.DeltaTime

	if ebiten.IsKeyPressed(ebiten.KeyLeft) || ebiten.IsKeyPressed(ebiten.KeyA) {
		g.Paddle.X -= moveSpeed
	}
	if ebiten.IsKeyPressed(ebiten.KeyRight) || ebiten.IsKeyPressed(ebiten.KeyD) {
		g.Paddle.X += moveSpeed
	}

	if g.Paddle.X < 0 {
		g.Paddle.X = 0
	}
	if g.Paddle.X+g.Paddle.Width > float64(ScreenWidth) {
		g.Paddle.X = float64(ScreenWidth) - g.Paddle.Width
	}
}

func (g *Game) UpdateBalls() {
	ballsToRemove := []int{}
	
	for i, ball := range g.Balls {
		ball.X += ball.Velocity.X * g.DeltaTime
		ball.Y += ball.Velocity.Y * g.DeltaTime

		if ball.X-ball.Radius < 0 {
			ball.X = ball.Radius
			ball.Velocity.X = math.Abs(ball.Velocity.X)
		}
		if ball.X+ball.Radius > float64(ScreenWidth) {
			ball.X = float64(ScreenWidth) - ball.Radius
			ball.Velocity.X = -math.Abs(ball.Velocity.X)
		}
		if ball.Y-ball.Radius < 0 {
			ball.Y = ball.Radius
			ball.Velocity.Y = math.Abs(ball.Velocity.Y)
		}

		if ball.Y+ball.Radius > float64(ScreenHeight) {
			ballsToRemove = append(ballsToRemove, i)
			continue
		}

		if g.CheckPaddleCollision(ball) {
			continue
		}

		g.CheckBrickCollision(ball)
	}

	for i := len(ballsToRemove) - 1; i >= 0; i-- {
		idx := ballsToRemove[i]
		g.Balls = append(g.Balls[:idx], g.Balls[idx+1:]...)
	}

	if len(g.Balls) == 0 {
		g.Lives--
		if g.Lives <= 0 {
			g.State = StateGameOver
		} else {
			g.AddBall()
		}
	}
}

func (g *Game) CheckPaddleCollision(ball *Ball) bool {
	closestX := math.Max(g.Paddle.X, math.Min(ball.X, g.Paddle.X+g.Paddle.Width))
	closestY := math.Max(g.Paddle.Y, math.Min(ball.Y, g.Paddle.Y+g.Paddle.Height))
	
	dx := ball.X - closestX
	dy := ball.Y - closestY
	distanceSquared := dx*dx + dy*dy

	if distanceSquared < ball.Radius*ball.Radius {
		if ball.Velocity.Y > 0 {
			relativeIntersect := (g.Paddle.X + g.Paddle.Width/2) - ball.X
			normalizedIntersect := relativeIntersect / (g.Paddle.Width / 2)
			
			maxAngle := 75.0
			bounceAngle := normalizedIntersect * (maxAngle * math.Pi / 180.0)
			
			speed := ball.BaseSpeed
			if g.PowerUpActive[PowerUpBallSpeedUp] {
				speed *= 1.5
			}
			
			ball.Velocity.X = -math.Sin(bounceAngle) * speed
			ball.Velocity.Y = -math.Cos(bounceAngle) * speed
			
			ball.Y = g.Paddle.Y - ball.Radius
		}
		return true
	}
	return false
}

func (g *Game) CheckBrickCollision(ball *Ball) {
	for _, brick := range g.Bricks {
		if !brick.Active {
			continue
		}

		closestX := math.Max(brick.X, math.Min(ball.X, brick.X+brick.Width))
		closestY := math.Max(brick.Y, math.Min(ball.Y, brick.Y+brick.Height))
		
		dx := ball.X - closestX
		dy := ball.Y - closestY
		distanceSquared := dx*dx + dy*dy

		if distanceSquared < ball.Radius*ball.Radius {
			if !ball.IsPenetrating {
				centerX := brick.X + brick.Width/2
				centerY := brick.Y + brick.Height/2
				
				dxFromCenter := ball.X - centerX
				dyFromCenter := ball.Y - centerY
				
				halfWidth := brick.Width / 2
				halfHeight := brick.Height / 2
				
				intersectX := halfWidth - math.Abs(dxFromCenter)
				intersectY := halfHeight - math.Abs(dyFromCenter)
				
				if intersectX < intersectY {
					ball.Velocity.X = -ball.Velocity.X
				} else {
					ball.Velocity.Y = -ball.Velocity.Y
				}
			}

			if brick.Type != BrickUnbreakable {
				brick.HP--
				if brick.HP <= 0 {
					brick.Active = false
					points := 100
					if brick.Type == BrickMultiHP {
						points = 200 * brick.MaxHP
					}
					g.Score += points
					
					g.SpawnPowerUp(brick.X+brick.Width/2, brick.Y+brick.Height/2)
				}
			}
			
			if !ball.IsPenetrating {
				break
			}
		}
	}
}

func (g *Game) SpawnPowerUp(x, y float64) {
	rand.Seed(time.Now().UnixNano())
	r := rand.Float64()
	
	if r < 0.25 {
		var powerType PowerUpType
		powerRand := rand.Float64()
		
		if powerRand < 0.20 {
			powerType = PowerUpPaddleLong
		} else if powerRand < 0.35 {
			powerType = PowerUpPaddleShort
		} else if powerRand < 0.50 {
			powerType = PowerUpBallSpeedUp
		} else if powerRand < 0.65 {
			powerType = PowerUpExtraLife
		} else if powerRand < 0.80 {
			powerType = PowerUpPenetrate
		} else {
			powerType = PowerUpMultiBall
		}
		
		powerUp := &PowerUp{
			X:         x,
			Y:         y,
			Type:      powerType,
			Active:    true,
			FallSpeed: 150,
			Width:     24,
			Height:    24,
		}
		g.PowerUps = append(g.PowerUps, powerUp)
	}
}

func (g *Game) UpdatePowerUps() {
	for i := len(g.PowerUps) - 1; i >= 0; i-- {
		powerUp := g.PowerUps[i]
		if !powerUp.Active {
			continue
		}

		powerUp.Y += powerUp.FallSpeed * g.DeltaTime

		if powerUp.Y > float64(ScreenHeight) {
			g.PowerUps = append(g.PowerUps[:i], g.PowerUps[i+1:]...)
			continue
		}

		if g.CheckPowerUpPaddleCollision(powerUp) {
			g.ActivatePowerUp(powerUp.Type)
			powerUp.Active = false
			g.PowerUps = append(g.PowerUps[:i], g.PowerUps[i+1:]...)
		}
	}
}

func (g *Game) CheckPowerUpPaddleCollision(powerUp *PowerUp) bool {
	return powerUp.X+powerUp.Width/2 > g.Paddle.X &&
		powerUp.X-powerUp.Width/2 < g.Paddle.X+g.Paddle.Width &&
		powerUp.Y+powerUp.Height/2 > g.Paddle.Y &&
		powerUp.Y-powerUp.Height/2 < g.Paddle.Y+g.Paddle.Height
}

func (g *Game) ActivatePowerUp(powerType PowerUpType) {
	switch powerType {
	case PowerUpPaddleLong:
		if g.PowerUpActive[PowerUpPaddleShort] {
			g.Paddle.Width = g.Paddle.BaseWidth
		}
		g.Paddle.Width = g.Paddle.BaseWidth * 1.5
		g.PowerUpActive[PowerUpPaddleLong] = true
		g.PowerUpTimer[PowerUpPaddleLong] = 10.0
	case PowerUpPaddleShort:
		if g.PowerUpActive[PowerUpPaddleLong] {
			g.Paddle.Width = g.Paddle.BaseWidth
		}
		g.Paddle.Width = g.Paddle.BaseWidth * 0.6
		g.PowerUpActive[PowerUpPaddleShort] = true
		g.PowerUpTimer[PowerUpPaddleShort] = 10.0
	case PowerUpBallSpeedUp:
		for _, ball := range g.Balls {
			ball.BaseSpeed *= 1.3
			g.NormalizeBallVelocity(ball)
		}
		g.PowerUpActive[PowerUpBallSpeedUp] = true
		g.PowerUpTimer[PowerUpBallSpeedUp] = 8.0
	case PowerUpExtraLife:
		g.Lives++
	case PowerUpPenetrate:
		for _, ball := range g.Balls {
			ball.IsPenetrating = true
		}
		g.PowerUpActive[PowerUpPenetrate] = true
		g.PowerUpTimer[PowerUpPenetrate] = 6.0
	case PowerUpMultiBall:
		currentBalls := len(g.Balls)
		for i := 0; i < currentBalls; i++ {
			originalBall := g.Balls[i]
			newBall := &Ball{
				X:             originalBall.X,
				Y:             originalBall.Y,
				Radius:        originalBall.Radius,
				BaseSpeed:     originalBall.BaseSpeed,
				Velocity: Vector{
					X: -originalBall.Velocity.X,
					Y: originalBall.Velocity.Y,
				},
				IsPenetrating: originalBall.IsPenetrating,
			}
			g.Balls = append(g.Balls, newBall)
		}
	}
}

func (g *Game) CheckLevelComplete() {
	hasActiveBricks := false
	for _, brick := range g.Bricks {
		if brick.Active && brick.Type != BrickUnbreakable {
			hasActiveBricks = true
			break
		}
	}
	
	if !hasActiveBricks {
		g.Level++
		if g.Level > 10 {
			g.State = StateVictory
		} else {
			g.State = StateLevelComplete
		}
	}
}

func (g *Game) UpdatePaused() {
	if ebiten.IsKeyPressed(ebiten.KeyEscape) || ebiten.IsKeyPressed(ebiten.KeySpace) {
		g.State = StatePlaying
	}
}

func (g *Game) UpdateGameOver() {
	if ebiten.IsKeyPressed(ebiten.KeyEnter) || ebiten.IsKeyPressed(ebiten.KeySpace) {
		g.State = StateMenu
	}
}

func (g *Game) UpdateVictory() {
	if ebiten.IsKeyPressed(ebiten.KeyEnter) || ebiten.IsKeyPressed(ebiten.KeySpace) {
		g.State = StateMenu
	}
}

func (g *Game) UpdateLevelComplete() {
	if ebiten.IsKeyPressed(ebiten.KeyEnter) || ebiten.IsKeyPressed(ebiten.KeySpace) {
		g.InitLevel()
		g.State = StatePlaying
	}
}

func (g *Game) Draw(screen *ebiten.Image) {
	screen.Fill(color.RGBA{20, 20, 40, 255})

	switch g.State {
	case StateMenu:
		g.DrawMenu(screen)
	case StatePlaying, StatePaused:
		g.DrawGame(screen)
		if g.State == StatePaused {
			g.DrawPausedOverlay(screen)
		}
	case StateGameOver:
		g.DrawGame(screen)
		g.DrawGameOver(screen)
	case StateVictory:
		g.DrawGame(screen)
		g.DrawVictory(screen)
	case StateLevelComplete:
		g.DrawGame(screen)
		g.DrawLevelComplete(screen)
	}
}

func (g *Game) DrawMenu(screen *ebiten.Image) {
	title := "BREAKOUT"
	titleX := ScreenWidth/2 - len(title)*6
	text.Draw(screen, title, basicfont.Face7x13, titleX, 200, color.White)

	subtitle := "Arrow Keys or A/D to move"
	subtitleX := ScreenWidth/2 - len(subtitle)*6
	text.Draw(screen, subtitle, basicfont.Face7x13, subtitleX, 260, color.RGBA{180, 180, 180, 255})

	startText := "Press Enter or Space to start"
	startX := ScreenWidth/2 - len(startText)*6
	text.Draw(screen, startText, basicfont.Face7x13, startX, 320, color.RGBA{0, 255, 128, 255})

	instructions := []string{
		"How to play:",
		"  - Clear all breakable bricks to advance",
		"  - Gray bricks are unbreakable",
		"  - Orange bricks have multiple HP",
		"  - Collect power-ups for special abilities",
		"  - Press ESC to pause",
	}
	for i, line := range instructions {
		text.Draw(screen, line, basicfont.Face7x13, 50, 400+i*25, color.RGBA{200, 200, 200, 255})
	}
}

func (g *Game) DrawGame(screen *ebiten.Image) {
	g.DrawPaddle(screen)
	g.DrawBalls(screen)
	g.DrawBricks(screen)
	g.DrawPowerUps(screen)
	g.DrawUI(screen)
}

func (g *Game) DrawPaddle(screen *ebiten.Image) {
	paddleColor := color.RGBA{0, 200, 255, 255}
	
	if g.PowerUpActive[PowerUpPaddleLong] {
		paddleColor = color.RGBA{0, 255, 128, 255}
	} else if g.PowerUpActive[PowerUpPaddleShort] {
		paddleColor = color.RGBA{255, 128, 0, 255}
	}
	
	vector.DrawFilledRect(
		screen,
		float32(g.Paddle.X),
		float32(g.Paddle.Y),
		float32(g.Paddle.Width),
		float32(g.Paddle.Height),
		paddleColor,
		false,
	)
	
	vector.DrawFilledRect(
		screen,
		float32(g.Paddle.X+3),
		float32(g.Paddle.Y+3),
		float32(g.Paddle.Width-6),
		float32(g.Paddle.Height-6),
		color.RGBA{255, 255, 255, 50},
		false,
	)
}

func (g *Game) DrawBalls(screen *ebiten.Image) {
	for _, ball := range g.Balls {
		ballColor := color.RGBA{255, 255, 255, 255}
		
		if ball.IsPenetrating {
			ballColor = color.RGBA{255, 0, 255, 255}
			vector.DrawFilledCircle(
				screen,
				float32(ball.X),
				float32(ball.Y),
				float32(ball.Radius+3),
				color.RGBA{255, 0, 255, 100},
				false,
			)
		} else if g.PowerUpActive[PowerUpBallSpeedUp] {
			ballColor = color.RGBA{255, 100, 100, 255}
		}
		
		vector.DrawFilledCircle(
			screen,
			float32(ball.X),
			float32(ball.Y),
			float32(ball.Radius),
			ballColor,
			false,
		)
	}
}

func (g *Game) DrawBricks(screen *ebiten.Image) {
	for _, brick := range g.Bricks {
		if !brick.Active {
			continue
		}
		
		vector.DrawFilledRect(
			screen,
			float32(brick.X+1),
			float32(brick.Y+1),
			float32(brick.Width-2),
			float32(brick.Height-2),
			brick.Color,
			false,
		)
		
		vector.DrawFilledRect(
			screen,
			float32(brick.X+3),
			float32(brick.Y+3),
			float32(brick.Width-6),
			float32(brick.Height/2-3),
			color.RGBA{255, 255, 255, 40},
			false,
		)
		
		if brick.Type == BrickMultiHP && brick.HP > 0 {
			hpText := fmt.Sprintf("%d", brick.HP)
			textX := int(brick.X + brick.Width/2 - float64(len(hpText)*6))
			textY := int(brick.Y + brick.Height/2 + 5)
			text.Draw(screen, hpText, basicfont.Face7x13, textX, textY, color.White)
		}
		
		if brick.Type == BrickUnbreakable {
			lockText := "X"
			textX := int(brick.X + brick.Width/2 - 6)
			textY := int(brick.Y + brick.Height/2 + 5)
			text.Draw(screen, lockText, basicfont.Face7x13, textX, textY, color.White)
		}
	}
}

func (g *Game) DrawPowerUps(screen *ebiten.Image) {
	for _, powerUp := range g.PowerUps {
		if !powerUp.Active {
			continue
		}
		
		var powerColor color.Color
		var symbol string
		
		switch powerUp.Type {
		case PowerUpPaddleLong:
			powerColor = color.RGBA{0, 255, 128, 255}
			symbol = "L"
		case PowerUpPaddleShort:
			powerColor = color.RGBA{255, 128, 0, 255}
			symbol = "S"
		case PowerUpBallSpeedUp:
			powerColor = color.RGBA{255, 100, 100, 255}
			symbol = "F"
		case PowerUpExtraLife:
			powerColor = color.RGBA{255, 105, 180, 255}
			symbol = "+"
		case PowerUpPenetrate:
			powerColor = color.RGBA{255, 0, 255, 255}
			symbol = "P"
		case PowerUpMultiBall:
			powerColor = color.RGBA{30, 144, 255, 255}
			symbol = "M"
		}
		
		vector.DrawFilledRect(
			screen,
			float32(powerUp.X-powerUp.Width/2),
			float32(powerUp.Y-powerUp.Height/2),
			float32(powerUp.Width),
			float32(powerUp.Height),
			powerColor,
			false,
		)
		
		text.Draw(screen, symbol, basicfont.Face7x13, 
			int(powerUp.X-powerUp.Width/2+7), 
			int(powerUp.Y+5), 
			color.White)
	}
}

func (g *Game) DrawUI(screen *ebiten.Image) {
	scoreText := fmt.Sprintf("Score: %d", g.Score)
	text.Draw(screen, scoreText, basicfont.Face7x13, 20, 30, color.White)
	
	livesText := fmt.Sprintf("Lives: %d", g.Lives)
	text.Draw(screen, livesText, basicfont.Face7x13, ScreenWidth-90, 30, color.White)
	
	levelText := fmt.Sprintf("Level: %d", g.Level)
	text.Draw(screen, levelText, basicfont.Face7x13, ScreenWidth/2-40, 30, color.White)
	
	powerUpTexts := []string{}
	if g.PowerUpActive[PowerUpPaddleLong] {
		powerUpTexts = append(powerUpTexts, fmt.Sprintf("Long Paddle: %.1fs", g.PowerUpTimer[PowerUpPaddleLong]))
	}
	if g.PowerUpActive[PowerUpPaddleShort] {
		powerUpTexts = append(powerUpTexts, fmt.Sprintf("Short Paddle: %.1fs", g.PowerUpTimer[PowerUpPaddleShort]))
	}
	if g.PowerUpActive[PowerUpBallSpeedUp] {
		powerUpTexts = append(powerUpTexts, fmt.Sprintf("Speed Up: %.1fs", g.PowerUpTimer[PowerUpBallSpeedUp]))
	}
	if g.PowerUpActive[PowerUpPenetrate] {
		powerUpTexts = append(powerUpTexts, fmt.Sprintf("Penetrate: %.1fs", g.PowerUpTimer[PowerUpPenetrate]))
	}
	
	for i, txt := range powerUpTexts {
		text.Draw(screen, txt, basicfont.Face7x13, 20, 50+i*20, color.RGBA{0, 255, 128, 255})
	}
}

func (g *Game) DrawPausedOverlay(screen *ebiten.Image) {
	vector.DrawFilledRect(
		screen,
		0, 0,
		float32(ScreenWidth),
		float32(ScreenHeight),
		color.RGBA{0, 0, 0, 150},
		false,
	)
	
	title := "PAUSED"
	titleX := ScreenWidth/2 - len(title)*6
	text.Draw(screen, title, basicfont.Face7x13, titleX, ScreenHeight/2-40, color.White)
	
	subtitle := "Press ESC or Space to resume"
	subtitleX := ScreenWidth/2 - len(subtitle)*6
	text.Draw(screen, subtitle, basicfont.Face7x13, subtitleX, ScreenHeight/2+20, color.RGBA{0, 255, 128, 255})
}

func (g *Game) DrawGameOver(screen *ebiten.Image) {
	vector.DrawFilledRect(
		screen,
		0, 0,
		float32(ScreenWidth),
		float32(ScreenHeight),
		color.RGBA{0, 0, 0, 180},
		false,
	)
	
	title := "GAME OVER"
	titleX := ScreenWidth/2 - len(title)*6
	text.Draw(screen, title, basicfont.Face7x13, titleX, ScreenHeight/2-60, color.RGBA{255, 100, 100, 255})
	
	scoreText := fmt.Sprintf("Final Score: %d", g.Score)
	scoreX := ScreenWidth/2 - len(scoreText)*6
	text.Draw(screen, scoreText, basicfont.Face7x13, scoreX, ScreenHeight/2, color.White)
	
	levelText := fmt.Sprintf("Reached Level: %d", g.Level)
	levelX := ScreenWidth/2 - len(levelText)*6
	text.Draw(screen, levelText, basicfont.Face7x13, levelX, ScreenHeight/2+30, color.White)
	
	subtitle := "Press Enter for menu"
	subtitleX := ScreenWidth/2 - len(subtitle)*6
	text.Draw(screen, subtitle, basicfont.Face7x13, subtitleX, ScreenHeight/2+80, color.RGBA{0, 255, 128, 255})
}

func (g *Game) DrawVictory(screen *ebiten.Image) {
	vector.DrawFilledRect(
		screen,
		0, 0,
		float32(ScreenWidth),
		float32(ScreenHeight),
		color.RGBA{0, 0, 0, 180},
		false,
	)
	
	title := "VICTORY!"
	titleX := ScreenWidth/2 - len(title)*6
	text.Draw(screen, title, basicfont.Face7x13, titleX, ScreenHeight/2-80, color.RGBA{255, 215, 0, 255})
	
	scoreText := fmt.Sprintf("Final Score: %d", g.Score)
	scoreX := ScreenWidth/2 - len(scoreText)*6
	text.Draw(screen, scoreText, basicfont.Face7x13, scoreX, ScreenHeight/2-30, color.White)
	
	lifeText := fmt.Sprintf("Remaining Lives: %d", g.Lives)
	lifeX := ScreenWidth/2 - len(lifeText)*6
	text.Draw(screen, lifeText, basicfont.Face7x13, lifeX, ScreenHeight/2+10, color.White)
	
	bonus := g.Lives * 500
	g.Score += bonus
	bonusText := fmt.Sprintf("Life Bonus: +%d", bonus)
	bonusX := ScreenWidth/2 - len(bonusText)*6
	text.Draw(screen, bonusText, basicfont.Face7x13, bonusX, ScreenHeight/2+50, color.RGBA{0, 255, 128, 255})
	
	subtitle := "Press Enter for menu"
	subtitleX := ScreenWidth/2 - len(subtitle)*6
	text.Draw(screen, subtitle, basicfont.Face7x13, subtitleX, ScreenHeight/2+100, color.RGBA{0, 255, 128, 255})
}

func (g *Game) DrawLevelComplete(screen *ebiten.Image) {
	vector.DrawFilledRect(
		screen,
		0, 0,
		float32(ScreenWidth),
		float32(ScreenHeight),
		color.RGBA{0, 0, 0, 150},
		false,
	)
	
	title := fmt.Sprintf("Level %d Complete!", g.Level-1)
	titleX := ScreenWidth/2 - len(title)*6
	text.Draw(screen, title, basicfont.Face7x13, titleX, ScreenHeight/2-40, color.RGBA{0, 255, 128, 255})
	
	nextText := fmt.Sprintf("Get ready for Level %d", g.Level)
	nextX := ScreenWidth/2 - len(nextText)*6
	text.Draw(screen, nextText, basicfont.Face7x13, nextX, ScreenHeight/2+10, color.White)
	
	subtitle := "Press Enter to continue"
	subtitleX := ScreenWidth/2 - len(subtitle)*6
	text.Draw(screen, subtitle, basicfont.Face7x13, subtitleX, ScreenHeight/2+60, color.RGBA{0, 255, 128, 255})
}

func (g *Game) Layout(outsideWidth, outsideHeight int) (int, int) {
	return ScreenWidth, ScreenHeight
}

func main() {
	rand.Seed(time.Now().UnixNano())
	
	ebiten.SetWindowSize(ScreenWidth, ScreenHeight)
	ebiten.SetWindowTitle("Breakout")
	ebiten.SetWindowResizable(false)
	
	game := NewGame()
	
	if err := ebiten.RunGame(game); err != nil {
		fmt.Println("Game error:", err)
	}
}
