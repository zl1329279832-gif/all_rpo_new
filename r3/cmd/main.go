package main

import (
	"file-batch-tool/internal/app"
	"log"
)

func main() {
	batchApp := app.NewFileBatchApp()
	if err := batchApp.Run(); err != nil {
		log.Fatalf("应用启动失败: %v", err)
	}
}
