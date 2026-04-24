package app

import (
	"file-batch-tool/internal/model"
	"file-batch-tool/internal/service"
	"file-batch-tool/internal/utils"
	"fmt"
	"strings"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"
)

// FileBatchApp 文件批量处理应用
type FileBatchApp struct {
	app            fyne.App
	window         fyne.Window
	configService  model.ConfigManager
	fileService    model.FileOperator
	logger         model.Logger
	files          []*model.FileInfo
	selectedFiles  []*model.FileInfo
	
	// UI组件
	fileList       *widget.List
	logList        *widget.List
	progressBar    *widget.ProgressBar
	statusLabel    *widget.Label
	dirEntry       *widget.Entry
	typeEntry      *widget.Entry
	renamePrefix   *widget.Entry
	renameStartNum *widget.Entry
}

// NewFileBatchApp 创建新的应用实例
func NewFileBatchApp() *FileBatchApp {
	configService := service.NewConfigService("config/config.yaml")
	logger, _ := utils.NewLogger("logs/app.log")
	fileService := service.NewFileService(logger)

	return &FileBatchApp{
		configService: configService,
		fileService:   fileService,
		logger:        logger,
		files:         make([]*model.FileInfo, 0),
		selectedFiles: make([]*model.FileInfo, 0),
	}
}

// Run 运行应用
func (fba *FileBatchApp) Run() error {
	if err := fba.configService.Load(); err != nil {
		fba.logger.Error(fmt.Sprintf("load config failed: %v", err))
	}

	fba.app = app.New()
	fba.window = fba.app.NewWindow("File Batch Tool - 文件批量处理工具")
	fba.window.Resize(fyne.NewSize(1200, 800))

	fba.buildUI()
	fba.window.ShowAndRun()

	return nil
}

// ==================== UI构建 ====================

// buildUI 构建主界面
func (fba *FileBatchApp) buildUI() {
	toolbar := fba.buildToolbar()
	leftPanel := fba.buildLeftPanel()
	rightPanel := fba.buildRightPanel()
	statusBar := fba.buildStatusBar()
	
	split := container.NewHSplit(leftPanel, rightPanel)
	split.SetOffset(0.6)

	mainContainer := container.NewBorder(toolbar, statusBar, nil, nil, split)
	fba.window.SetContent(mainContainer)
}

// buildToolbar 构建工具栏
func (fba *FileBatchApp) buildToolbar() fyne.CanvasObject {
	return widget.NewToolbar(
		widget.NewToolbarAction(theme.FolderOpenIcon(), fba.selectFolder),
		widget.NewToolbarSeparator(),
		widget.NewToolbarAction(theme.ContentAddIcon(), fba.selectFiles),
		widget.NewToolbarSeparator(),
		widget.NewToolbarAction(theme.MediaPlayIcon(), fba.scanFiles),
		widget.NewToolbarSeparator(),
		widget.NewToolbarAction(theme.DocumentSaveIcon(), fba.saveConfig),
		widget.NewToolbarSpacer(),
		widget.NewToolbarAction(theme.HelpIcon(), fba.showAbout),
	)
}

// buildLeftPanel 构建左侧面板
func (fba *FileBatchApp) buildLeftPanel() fyne.CanvasObject {
	config := fba.configService.Get()

	fba.dirEntry = widget.NewEntry()
	fba.dirEntry.SetPlaceHolder("Select directory to scan...")
	fba.dirEntry.SetText(config.DefaultScanDir)

	dirBtn := widget.NewButton("Browse...", fba.selectFolder)

	fba.typeEntry = widget.NewEntry()
	fba.typeEntry.SetPlaceHolder("File types: txt,jpg,png")
	if len(config.DefaultFileTypes) > 0 {
		fba.typeEntry.SetText(strings.Join(config.DefaultFileTypes, ","))
	}

	scanBtn := widget.NewButton("Start Scan", fba.scanFiles)
	scanBtn.Importance = widget.HighImportance

	filterContainer := container.NewBorder(nil, nil, nil, dirBtn, fba.dirEntry)
	typeContainer := container.NewBorder(nil, nil, widget.NewLabel("File Types:"), nil, fba.typeEntry)
	controlContainer := container.NewVBox(filterContainer, typeContainer, scanBtn)

	// 文件列表
	fba.fileList = widget.NewList(
		func() int { return len(fba.files) },
		func() fyne.CanvasObject {
			return container.NewHBox(
				widget.NewCheck("", nil),
				widget.NewLabel("filename"),
				widget.NewLabel("size"),
				widget.NewLabel("type"),
			)
		},
		func(id widget.ListItemID, item fyne.CanvasObject) {
			box := item.(*fyne.Container)
			check := box.Objects[0].(*widget.Check)
			nameLabel := box.Objects[1].(*widget.Label)
			sizeLabel := box.Objects[2].(*widget.Label)
			typeLabel := box.Objects[3].(*widget.Label)

			file := fba.files[id]
			check.SetChecked(file.Selected)
			check.OnChanged = func(checked bool) {
				file.Selected = checked
				fba.updateSelectedFiles()
			}
			nameLabel.SetText(file.Name)
			sizeLabel.SetText(utils.FormatSize(file.Size))
			typeLabel.SetText(file.FileType)
		},
	)

	selectAllBtn := widget.NewButton("Select All", func() {
		for _, f := range fba.files {
			f.Selected = true
		}
		fba.updateSelectedFiles()
		fba.fileList.Refresh()
	})
	
	deselectAllBtn := widget.NewButton("Deselect All", func() {
		for _, f := range fba.files {
			f.Selected = false
		}
		fba.updateSelectedFiles()
		fba.fileList.Refresh()
	})

	btnContainer := container.NewGridWithColumns(2, selectAllBtn, deselectAllBtn)

	return container.NewBorder(
		container.NewVBox(
			widget.NewSeparator(),
			controlContainer,
			widget.NewSeparator(),
			btnContainer,
			widget.NewSeparator(),
		),
		nil, nil, nil, fba.fileList,
	)
}

// buildRightPanel 构建右侧面板
func (fba *FileBatchApp) buildRightPanel() fyne.CanvasObject {
	renameTab := fba.buildRenameTab()
	copyMoveTab := fba.buildCopyMoveTab()
	duplicateTab := fba.buildDuplicateTab()
	logTab := fba.buildLogTab()

	tabs := container.NewAppTabs(
		container.NewTabItem("Batch Rename", renameTab),
		container.NewTabItem("Copy/Move", copyMoveTab),
		container.NewTabItem("Duplicates", duplicateTab),
		container.NewTabItem("Logs", logTab),
	)

	return tabs
}

// buildRenameTab 构建重命名标签页
func (fba *FileBatchApp) buildRenameTab() fyne.CanvasObject {
	fba.renamePrefix = widget.NewEntry()
	fba.renamePrefix.SetPlaceHolder("Prefix: photo_")
	fba.renamePrefix.SetText("file_")

	fba.renameStartNum = widget.NewEntry()
	fba.renameStartNum.SetPlaceHolder("Start number: 1")
	fba.renameStartNum.SetText("1")

	previewLabel := widget.NewLabel("Preview: file_1.xxx, file_2.xxx...")

	renameBtn := widget.NewButton("Start Rename", fba.doRename)
	renameBtn.Importance = widget.HighImportance

	return container.NewVBox(
		widget.NewCard("Batch Rename Settings", "",
			container.NewVBox(
				widget.NewForm(
					widget.NewFormItem("File Prefix:", fba.renamePrefix),
					widget.NewFormItem("Start Number:", fba.renameStartNum),
				),
				previewLabel,
				widget.NewSeparator(),
				renameBtn,
			),
		),
	)
}

// buildCopyMoveTab 构建复制移动标签页
func (fba *FileBatchApp) buildCopyMoveTab() fyne.CanvasObject {
	destEntry := widget.NewEntry()
	destEntry.SetPlaceHolder("Destination directory...")

	destBtn := widget.NewButton("Browse...", func() {
		dialog.ShowFolderOpen(func(uri fyne.ListableURI, err error) {
			if err == nil && uri != nil {
				destEntry.SetText(uri.Path())
			}
		}, fba.window)
	})

	copyBtn := widget.NewButton("Batch Copy", func() {
		if destEntry.Text == "" {
			dialog.ShowError(fmt.Errorf("please select destination directory"), fba.window)
			return
		}
		fba.doCopy(destEntry.Text)
	})
	copyBtn.Importance = widget.HighImportance

	moveBtn := widget.NewButton("Batch Move", func() {
		if destEntry.Text == "" {
			dialog.ShowError(fmt.Errorf("please select destination directory"), fba.window)
			return
		}
		fba.doMove(destEntry.Text)
	})

	return container.NewVBox(
		widget.NewCard("Destination Directory", "",
			container.NewBorder(nil, nil, nil, destBtn, destEntry),
		),
		widget.NewSeparator(),
		container.NewGridWithColumns(2, copyBtn, moveBtn),
	)
}

// buildDuplicateTab 构建重复文件标签页
func (fba *FileBatchApp) buildDuplicateTab() fyne.CanvasObject {
	detectBtn := widget.NewButton("Detect Duplicates", fba.detectDuplicates)
	detectBtn.Importance = widget.HighImportance

	resultList := widget.NewList(
		func() int { return 0 },
		func() fyne.CanvasObject { return widget.NewLabel("") },
		func(id widget.ListItemID, item fyne.CanvasObject) {},
	)

	return container.NewVBox(
		detectBtn,
		widget.NewSeparator(),
		resultList,
	)
}

// buildLogTab 构建日志标签页
func (fba *FileBatchApp) buildLogTab() fyne.CanvasObject {
	fba.logList = widget.NewList(
		func() int { return len(fba.logger.GetLogs()) },
		func() fyne.CanvasObject { return widget.NewLabel("") },
		func(id widget.ListItemID, item fyne.CanvasObject) {
			logs := fba.logger.GetLogs()
			if id < len(logs) {
				item.(*widget.Label).SetText(logs[id])
			}
		},
	)

	clearBtn := widget.NewButton("Clear Logs", func() {
		fba.logger.Clear()
		fba.logList.Refresh()
	})

	return container.NewBorder(nil, clearBtn, nil, nil, fba.logList)
}

// buildStatusBar 构建状态栏
func (fba *FileBatchApp) buildStatusBar() fyne.CanvasObject {
	fba.statusLabel = widget.NewLabel("Ready")
	fba.progressBar = widget.NewProgressBar()
	fba.progressBar.Hide()
	
	return container.NewBorder(nil, nil, nil, nil,
		container.NewVBox(fba.progressBar, fba.statusLabel))
}

// ==================== 事件处理 ====================

// selectFolder 选择文件夹
func (fba *FileBatchApp) selectFolder() {
	dialog.ShowFolderOpen(func(uri fyne.ListableURI, err error) {
		if err == nil && uri != nil {
			fba.dirEntry.SetText(uri.Path())
		}
	}, fba.window)
}

// selectFiles 选择文件
func (fba *FileBatchApp) selectFiles() {
	fd := dialog.NewFileOpen(func(uri fyne.URIReadCloser, err error) {
		if err == nil && uri != nil {
			fba.logger.Info("Selected file: " + uri.URI().Path())
		}
	}, fba.window)
	fd.Show()
}

// scanFiles 扫描文件
func (fba *FileBatchApp) scanFiles() {
	dir := fba.dirEntry.Text
	if dir == "" {
		dialog.ShowError(fmt.Errorf("please select directory to scan"), fba.window)
		return
	}

	fileTypes := make([]string, 0)
	if fba.typeEntry.Text != "" {
		for _, t := range strings.Split(fba.typeEntry.Text, ",") {
			fileTypes = append(fileTypes, strings.TrimSpace(t))
		}
	}

	fba.statusLabel.SetText("Scanning...")
	fba.progressBar.Show()
	fba.progressBar.SetValue(0)

	go func() {
		config := fba.configService.Get()
		files, err := fba.fileService.ScanDirectory(dir, config.ExcludeDirs, fileTypes)
		
		if err != nil {
			dialog.ShowError(err, fba.window)
			fba.statusLabel.SetText("Scan failed")
			fba.progressBar.Hide()
			return
		}

		fba.files = files
		fba.fileList.Refresh()
		fba.statusLabel.SetText(fmt.Sprintf("Scan completed: %d files", len(files)))
		fba.progressBar.Hide()
		
		// 发送通知
		fba.app.SendNotification(&fyne.Notification{
			Title:   "Scan Complete",
			Content: fmt.Sprintf("Found %d files", len(files)),
		})
	}()
}

// updateSelectedFiles 更新选中文件列表
func (fba *FileBatchApp) updateSelectedFiles() {
	fba.selectedFiles = make([]*model.FileInfo, 0)
	for _, f := range fba.files {
		if f.Selected {
			fba.selectedFiles = append(fba.selectedFiles, f)
		}
	}
	count := len(fba.selectedFiles)
	if count > 0 {
		fba.statusLabel.SetText(fmt.Sprintf("Selected %d files", count))
	} else {
		fba.statusLabel.SetText(fmt.Sprintf("Total %d files", len(fba.files)))
	}
}

// ==================== 批量操作 ====================

// doRename 执行批量重命名
func (fba *FileBatchApp) doRename() {
	if len(fba.selectedFiles) == 0 {
		dialog.ShowError(fmt.Errorf("please select files to rename"), fba.window)
		return
	}

	prefix := fba.renamePrefix.Text
	startNum := 1
	fmt.Sscanf(fba.renameStartNum.Text, "%d", &startNum)

	dialog.ShowConfirm("Confirm",
		fmt.Sprintf("Are you sure to rename %d files?\nFormat: %s%d.xxx", len(fba.selectedFiles), prefix, startNum),
		func(confirmed bool) {
			if confirmed {
				go func() {
					progressChan := make(chan int)
					go func() {
						total := len(fba.selectedFiles)
						for p := range progressChan {
							fba.progressBar.SetValue(float64(p) / float64(total))
						}
					}()

					fba.progressBar.Show()
					result := fba.fileService.BatchRename(fba.selectedFiles, prefix, startNum, progressChan)
					close(progressChan)
					fba.progressBar.Hide()
					fba.logList.Refresh()

					dialog.ShowInformation("Complete",
						fmt.Sprintf("Total: %d\nSuccess: %d\nFailed: %d\nTime: %v",
							result.TotalFiles, result.SuccessCount, result.FailCount, result.Duration),
						fba.window)
				}()
			}
		}, fba.window)
}

// doCopy 执行批量复制
func (fba *FileBatchApp) doCopy(destDir string) {
	if len(fba.selectedFiles) == 0 {
		dialog.ShowError(fmt.Errorf("please select files to copy"), fba.window)
		return
	}

	dialog.ShowConfirm("Confirm",
		fmt.Sprintf("Are you sure to copy %d files to %s?", len(fba.selectedFiles), destDir),
		func(confirmed bool) {
			if confirmed {
				go func() {
					progressChan := make(chan int)
					go func() {
						total := len(fba.selectedFiles)
						for p := range progressChan {
							fba.progressBar.SetValue(float64(p) / float64(total))
						}
					}()

					fba.progressBar.Show()
					result := fba.fileService.BatchCopy(fba.selectedFiles, destDir, progressChan)
					close(progressChan)
					fba.progressBar.Hide()
					fba.logList.Refresh()

					dialog.ShowInformation("Complete",
						fmt.Sprintf("Total: %d\nSuccess: %d\nFailed: %d\nTime: %v",
							result.TotalFiles, result.SuccessCount, result.FailCount, result.Duration),
						fba.window)
				}()
			}
		}, fba.window)
}

// doMove 执行批量移动
func (fba *FileBatchApp) doMove(destDir string) {
	if len(fba.selectedFiles) == 0 {
		dialog.ShowError(fmt.Errorf("please select files to move"), fba.window)
		return
	}

	dialog.ShowConfirm("Confirm",
		fmt.Sprintf("Are you sure to move %d files to %s?", len(fba.selectedFiles), destDir),
		func(confirmed bool) {
			if confirmed {
				go func() {
					progressChan := make(chan int)
					go func() {
						total := len(fba.selectedFiles)
						for p := range progressChan {
							fba.progressBar.SetValue(float64(p) / float64(total))
						}
					}()

					fba.progressBar.Show()
					result := fba.fileService.BatchMove(fba.selectedFiles, destDir, progressChan)
					close(progressChan)
					fba.progressBar.Hide()
					fba.logList.Refresh()

					dialog.ShowInformation("Complete",
						fmt.Sprintf("Total: %d\nSuccess: %d\nFailed: %d\nTime: %v",
							result.TotalFiles, result.SuccessCount, result.FailCount, result.Duration),
						fba.window)
				}()
			}
		}, fba.window)
}

// detectDuplicates 检测重复文件
func (fba *FileBatchApp) detectDuplicates() {
	if len(fba.files) == 0 {
		dialog.ShowError(fmt.Errorf("please scan files first"), fba.window)
		return
	}

	fba.statusLabel.SetText("Detecting duplicates...")
	go func() {
		duplicates := fba.fileService.FindDuplicates(fba.files)
		fba.logList.Refresh()
		fba.statusLabel.SetText("Duplicate detection completed")

		msg := fmt.Sprintf("Found %d duplicate groups", len(duplicates))
		for hash, files := range duplicates {
			msg += fmt.Sprintf("\n\nHash: %s\n", hash[:16])
			for _, f := range files {
				msg += fmt.Sprintf("- %s\n", f.Path)
			}
		}
		dialog.ShowInformation("Duplicate Results", msg, fba.window)
	}()
}

// ==================== 其他功能 ====================

// saveConfig 保存配置
func (fba *FileBatchApp) saveConfig() {
	config := fba.configService.Get()
	config.DefaultScanDir = fba.dirEntry.Text
	if fba.typeEntry.Text != "" {
		config.DefaultFileTypes = strings.Split(fba.typeEntry.Text, ",")
		for i, t := range config.DefaultFileTypes {
			config.DefaultFileTypes[i] = strings.TrimSpace(t)
		}
	}

	if err := fba.configService.Save(); err != nil {
		dialog.ShowError(err, fba.window)
		return
	}

	fba.logger.Info("Config saved")
	dialog.ShowInformation("Success", "Configuration saved to config/config.yaml", fba.window)
}

// showAbout 显示关于
func (fba *FileBatchApp) showAbout() {
	dialog.ShowInformation("About",
		"File Batch Tool v2.0 - Optimized\n\n"+
			"Features:\n"+
			"- Directory scanning (optimized)\n"+
			"- File type filtering\n"+
			"- Batch rename\n"+
			"- Batch copy/move (parallel)\n"+
			"- Duplicate file detection (parallel)\n"+
			"- Operation log\n\n"+
			"Optimizations:\n"+
			"- Buffered IO for faster file operations\n"+
			"- Worker pool for parallel processing\n"+
			"- Interface-based architecture for extensibility\n"+
			"- Better error handling\n\n"+
			"Tech Stack: Go 1.22+ + Fyne",
		fba.window)
}
