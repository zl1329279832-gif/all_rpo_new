package main

import (
	"airwar/internal/game"
	"log"
)

func main() {
	g, err := game.NewGame()
	if err != nil {
		log.Fatalf("Failed to create game: %v", err)
	}

	if err := g.Run(); err != nil {
		log.Fatalf("Game error: %v", err)
	}
}
