package main

import (
	"log"
	"r1/config"
	"r1/handler"
	"r1/model"
	"r1/router"
	"r1/service"
)

func main() {
	cfg := config.LoadConfig()
	db, err := config.InitDB(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	log.Println("Database connected successfully")
	if err := db.AutoMigrate(
		&model.Rule{},
		&model.RuleVersion{},
		&model.Sample{},
		&model.BacktestTask{},
		&model.BacktestResult{},
		&model.RuleHitDetail{},
	); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	log.Println("Database migrated successfully")
	svc := service.NewService(db)
	h := handler.NewHandler(svc)
	r := router.SetupRouter(h)
	log.Printf("Server starting on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
