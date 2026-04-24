package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"file-batch-tool/internal/model"
	"file-batch-tool/internal/service"
	"file-batch-tool/internal/utils"
)

// CLI 应用 - 命令行版本，无需 GUI 依赖
type CLIApp struct {
	configService model.ConfigManager
	fileService   model.FileOperator
	logger        model.Logger
	files         []*model.FileInfo
	selectedFiles []*model.FileInfo
}

func NewCLIApp() *CLIApp {
	configService := service.NewConfigService("config/config.yaml")
	logger, _ := utils.NewLogger("logs/cli_app.log")
	fileService := service.NewFileService(logger)

	return &CLIApp{
		configService: configService,
		fileService:   fileService,
		logger:        logger,
		files:         make([]*model.FileInfo, 0),
		selectedFiles: make([]*model.FileInfo, 0),
	}
}

func (app *CLIApp) Run() {
	fmt.Println("========================================")
	fmt.Println("  File Batch Tool - CLI Version")
	fmt.Println("  (No GUI required)")
	fmt.Println("========================================")
	fmt.Println()

	if err := app.configService.Load(); err != nil {
		fmt.Printf("Warning: Load config failed: %v\n", err)
	}

	reader := bufio.NewReader(os.Stdin)
	
	for {
		fmt.Println("\n--- Main Menu ---")
		fmt.Println("1. Scan Directory")
		fmt.Println("2. List Files")
		fmt.Println("3. Select Files by Type")
		fmt.Println("4. Batch Rename")
		fmt.Println("5. Batch Copy")
		fmt.Println("6. Batch Move")
		fmt.Println("7. Detect Duplicates")
		fmt.Println("8. View Logs")
		fmt.Println("9. Save Config")
		fmt.Println("0. Exit")
		fmt.Print("\nEnter choice: ")

		input, _ := reader.ReadString('\n')
		choice := strings.TrimSpace(input)

		switch choice {
		case "1":
			app.scanDirectory(reader)
		case "2":
			app.listFiles()
		case "3":
			app.selectByType(reader)
		case "4":
			app.batchRename(reader)
		case "5":
			app.batchCopy(reader)
		case "6":
			app.batchMove(reader)
		case "7":
			app.detectDuplicates()
		case "8":
			app.viewLogs()
		case "9":
			app.saveConfig()
		case "0":
			fmt.Println("Goodbye!")
			return
		default:
			fmt.Println("Invalid choice, try again.")
		}
	}
}

func (app *CLIApp) scanDirectory(reader *bufio.Reader) {
	fmt.Print("\nEnter directory path (or press Enter for current): ")
	dir, _ := reader.ReadString('\n')
	dir = strings.TrimSpace(dir)

	if dir == "" {
		dir, _ = os.Getwd()
	}

	config := app.configService.Get()

	fmt.Printf("Scanning directory: %s\n", dir)
	fmt.Println("This may take a moment...")

	files, err := app.fileService.ScanDirectory(dir, config.ExcludeDirs, []string{})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	app.files = files
	fmt.Printf("\n✅ Scan completed: %d files found\n", len(files))
}

func (app *CLIApp) listFiles() {
	if len(app.files) == 0 {
		fmt.Println("\n❌ No files scanned. Please scan a directory first.")
		return
	}

	fmt.Printf("\n📁 Files (%d total):\n", len(app.files))
	fmt.Println("----------------------------------------")

	maxShow := 50
	for i, file := range app.files {
		if i >= maxShow {
			fmt.Printf("\n... and %d more files\n", len(app.files)-maxShow)
			break
		}
		selected := " "
		if file.Selected {
			selected = "✓"
		}
		fmt.Printf("[%s] %s - %s\n", selected, file.Name, utils.FormatSize(file.Size))
	}
}

func (app *CLIApp) selectByType(reader *bufio.Reader) {
	if len(app.files) == 0 {
		fmt.Println("\n❌ No files scanned. Please scan a directory first.")
		return
	}

	fmt.Print("\nEnter file types (comma separated, e.g., txt,jpg,png): ")
	typesStr, _ := reader.ReadString('\n')
	typesStr = strings.TrimSpace(typesStr)

	types := strings.Split(typesStr, ",")
	for i, t := range types {
		types[i] = strings.TrimSpace(strings.ToLower(t))
	}

	selectedCount := 0
	for _, file := range app.files {
		file.Selected = false
		for _, t := range types {
			if strings.EqualFold(file.FileType, t) {
				file.Selected = true
				selectedCount++
				break
			}
		}
	}

	app.updateSelectedFiles()
	fmt.Printf("\n✅ Selected %d files\n", selectedCount)
}

func (app *CLIApp) updateSelectedFiles() {
	app.selectedFiles = make([]*model.FileInfo, 0)
	for _, f := range app.files {
		if f.Selected {
			app.selectedFiles = append(app.selectedFiles, f)
		}
	}
}

func (app *CLIApp) batchRename(reader *bufio.Reader) {
	app.updateSelectedFiles()
	if len(app.selectedFiles) == 0 {
		fmt.Println("\n❌ No files selected. Please select files first.")
		return
	}

	fmt.Printf("\nSelected %d files\n", len(app.selectedFiles))
	fmt.Print("Enter prefix (e.g., photo_): ")
	prefix, _ := reader.ReadString('\n')
	prefix = strings.TrimSpace(prefix)

	fmt.Print("Enter start number (default: 1): ")
	startStr, _ := reader.ReadString('\n')
	startStr = strings.TrimSpace(startStr)
	
	startNum := 1
	if startStr != "" {
		fmt.Sscanf(startStr, "%d", &startNum)
	}

	fmt.Printf("\n⚠️  This will rename %d files!\n", len(app.selectedFiles))
	fmt.Print("Confirm? (yes/no): ")
	confirm, _ := reader.ReadString('\n')
	confirm = strings.TrimSpace(strings.ToLower(confirm))

	if confirm != "yes" && confirm != "y" {
		fmt.Println("Cancelled.")
		return
	}

	fmt.Println("\nProcessing...")
	progressChan := make(chan int, len(app.selectedFiles))

	go func() {
		for p := range progressChan {
			fmt.Printf("\rProgress: %d/%d", p, len(app.selectedFiles))
		}
	}()

	result := app.fileService.BatchRename(app.selectedFiles, prefix, startNum, progressChan)
	close(progressChan)

	fmt.Println("\n----------------------------------------")
	fmt.Println("✅ Operation completed!")
	fmt.Printf("   Total: %d\n", result.TotalFiles)
	fmt.Printf("   Success: %d\n", result.SuccessCount)
	fmt.Printf("   Failed: %d\n", result.FailCount)
	fmt.Printf("   Time: %v\n", result.Duration)

	if len(result.Errors) > 0 {
		fmt.Println("\nErrors:")
		for i, e := range result.Errors {
			if i >= 10 {
				fmt.Printf("   ... and %d more errors\n", len(result.Errors)-10)
				break
			}
			fmt.Printf("   - %s\n", e)
		}
	}
}

func (app *CLIApp) batchCopy(reader *bufio.Reader) {
	app.updateSelectedFiles()
	if len(app.selectedFiles) == 0 {
		fmt.Println("\n❌ No files selected. Please select files first.")
		return
	}

	fmt.Printf("\nSelected %d files\n", len(app.selectedFiles))
	fmt.Print("Enter destination directory: ")
	destDir, _ := reader.ReadString('\n')
	destDir = strings.TrimSpace(destDir)

	fmt.Printf("\n⚠️  This will copy %d files to %s!\n", len(app.selectedFiles), destDir)
	fmt.Print("Confirm? (yes/no): ")
	confirm, _ := reader.ReadString('\n')
	confirm = strings.TrimSpace(strings.ToLower(confirm))

	if confirm != "yes" && confirm != "y" {
		fmt.Println("Cancelled.")
		return
	}

	fmt.Println("\nProcessing...")
	progressChan := make(chan int, len(app.selectedFiles))

	go func() {
		for p := range progressChan {
			fmt.Printf("\rProgress: %d/%d", p, len(app.selectedFiles))
		}
	}()

	result := app.fileService.BatchCopy(app.selectedFiles, destDir, progressChan)
	close(progressChan)

	fmt.Println("\n----------------------------------------")
	fmt.Println("✅ Operation completed!")
	fmt.Printf("   Total: %d\n", result.TotalFiles)
	fmt.Printf("   Success: %d\n", result.SuccessCount)
	fmt.Printf("   Failed: %d\n", result.FailCount)
	fmt.Printf("   Time: %v\n", result.Duration)
}

func (app *CLIApp) batchMove(reader *bufio.Reader) {
	app.updateSelectedFiles()
	if len(app.selectedFiles) == 0 {
		fmt.Println("\n❌ No files selected. Please select files first.")
		return
	}

	fmt.Printf("\nSelected %d files\n", len(app.selectedFiles))
	fmt.Print("Enter destination directory: ")
	destDir, _ := reader.ReadString('\n')
	destDir = strings.TrimSpace(destDir)

	fmt.Printf("\n⚠️  This will MOVE %d files to %s!\n", len(app.selectedFiles), destDir)
	fmt.Print("Confirm? (yes/no): ")
	confirm, _ := reader.ReadString('\n')
	confirm = strings.TrimSpace(strings.ToLower(confirm))

	if confirm != "yes" && confirm != "y" {
		fmt.Println("Cancelled.")
		return
	}

	fmt.Println("\nProcessing...")
	progressChan := make(chan int, len(app.selectedFiles))

	go func() {
		for p := range progressChan {
			fmt.Printf("\rProgress: %d/%d", p, len(app.selectedFiles))
		}
	}()

	result := app.fileService.BatchMove(app.selectedFiles, destDir, progressChan)
	close(progressChan)

	fmt.Println("\n----------------------------------------")
	fmt.Println("✅ Operation completed!")
	fmt.Printf("   Total: %d\n", result.TotalFiles)
	fmt.Printf("   Success: %d\n", result.SuccessCount)
	fmt.Printf("   Failed: %d\n", result.FailCount)
	fmt.Printf("   Time: %v\n", result.Duration)
}

func (app *CLIApp) detectDuplicates() {
	if len(app.files) == 0 {
		fmt.Println("\n❌ No files scanned. Please scan a directory first.")
		return
	}

	fmt.Println("\n🔍 Detecting duplicate files...")
	fmt.Println("   This may take a moment for large files...")

	duplicates := app.fileService.FindDuplicates(app.files)

	fmt.Println("\n----------------------------------------")
	if len(duplicates) == 0 {
		fmt.Println("✅ No duplicate files found!")
		return
	}

	fmt.Printf("⚠️  Found %d duplicate groups!\n", len(duplicates))
	fmt.Println("----------------------------------------")

	groupNum := 1
	for hash, files := range duplicates {
		if groupNum > 10 {
			fmt.Printf("\n... and %d more groups\n", len(duplicates)-10)
			break
		}
		
		fmt.Printf("\n📁 Duplicate Group %d (Hash: %s...):\n", groupNum, hash[:16])
		for _, f := range files {
			fmt.Printf("   - %s\n", f.Path)
		}
		groupNum++
	}
}

func (app *CLIApp) viewLogs() {
	logs := app.logger.GetLogs()
	if len(logs) == 0 {
		fmt.Println("\nNo logs yet.")
		return
	}

	fmt.Printf("\n📝 Logs (%d entries):\n", len(logs))
	fmt.Println("----------------------------------------")
	
	for i, log := range logs {
		if i >= 50 {
			fmt.Printf("\n... and %d more log entries\n", len(logs)-50)
			break
		}
		fmt.Println(log)
	}
}

func (app *CLIApp) saveConfig() {
	if err := app.configService.Save(); err != nil {
		fmt.Printf("\n❌ Save config failed: %v\n", err)
		return
	}
	fmt.Println("\n✅ Config saved to config/config.yaml")
}

func main() {
	// 检查是否有命令行参数
	if len(os.Args) > 1 {
		// 简单的命令行模式
		fmt.Println("Direct CLI mode")
		fmt.Printf("Args: %v\n", os.Args[1:])
		return
	}

	// 交互式模式
	app := NewCLIApp()
	app.Run()
}
