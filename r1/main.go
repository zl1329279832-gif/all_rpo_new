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

	// 尝试自动迁移，如果失败也继续运行
	err = db.AutoMigrate(
		&model.Rule{},
		&model.RuleVersion{},
		&model.Sample{},
		&model.BacktestTask{},
		&model.BacktestResult{},
		&model.RuleHitDetail{},
	)
	if err != nil {
		log.Printf("Warning: Auto migrate failed (you may need to run sql/schema.sql manually): %v", err)
	} else {
		log.Println("Database migrated successfully")
	}

	svc := service.NewService(db)
	h := handler.NewHandler(svc)
	r := router.SetupRouter(h)

	log.Printf("Server starting on port %s", cfg.ServerPort)
	log.Printf("Health check: http://localhost:%s/health", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
