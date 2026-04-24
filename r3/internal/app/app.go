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

type FileBatchApp struct {
	app            fyne.App
	window         fyne.Window
	configService  *service.ConfigService
	fileService    *service.FileService
	logger         *utils.Logger
	files          []*model.FileInfo
	selectedFiles  []*model.FileInfo
	fileList       *widget.List
	logList        *widget.List
	progressBar    *widget.ProgressBar
	statusLabel    *widget.Label
	dirEntry       *widget.Entry
	typeEntry      *widget.Entry
	renamePrefix   *widget.Entry
	renameStartNum *widget.Entry
}

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

func (fba *FileBatchApp) Run() error {
	if err := fba.configService.Load(); err != nil {
		fba.logger.Error(fmt.Sprintf("加载配置失败: %v", err))
	}

	fba.app = app.New()
	fba.window = fba.app.NewWindow("本地文件批量处理工具")
	fba.window.Resize(fyne.NewSize(1200, 800))

	fba.buildUI()
	fba.window.ShowAndRun()

	return nil
}

func (fba *FileBatchApp) buildUI() {
	toolbar := widget.NewToolbar(
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

	leftPanel := fba.buildLeftPanel()
	rightPanel := fba.buildRightPanel()
	split := container.NewHSplit(leftPanel, rightPanel)
	split.SetOffset(0.6)

	fba.statusLabel = widget.NewLabel("就绪")
	fba.progressBar = widget.NewProgressBar()
	statusBar := container.NewBorder(nil, nil, nil, nil,
		container.NewVBox(fba.progressBar, fba.statusLabel))

	mainContainer := container.NewBorder(toolbar, statusBar, nil, nil, split)
	fba.window.SetContent(mainContainer)
}

func (fba *FileBatchApp) buildLeftPanel() fyne.CanvasObject {
	config := fba.configService.Get()

	fba.dirEntry = widget.NewEntry()
	fba.dirEntry.SetPlaceHolder("选择要扫描的目录...")
	fba.dirEntry.SetText(config.DefaultScanDir)

	dirBtn := widget.NewButton("浏览...", fba.selectFolder)

	fba.typeEntry = widget.NewEntry()
	fba.typeEntry.SetPlaceHolder("文件类型过滤，如: txt,jpg,png")
	if len(config.DefaultFileTypes) > 0 {
		fba.typeEntry.SetText(strings.Join(config.DefaultFileTypes, ","))
	}

	scanBtn := widget.NewButton("开始扫描", fba.scanFiles)
	scanBtn.Importance = widget.HighImportance

	filterContainer := container.NewBorder(nil, nil, nil, dirBtn, fba.dirEntry)
	typeContainer := container.NewBorder(nil, nil, widget.NewLabel("文件类型:"), nil, fba.typeEntry)
	controlContainer := container.NewVBox(filterContainer, typeContainer, scanBtn)

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
			sizeLabel.SetText(fba.formatSize(file.Size))
			typeLabel.SetText(file.FileType)
		},
	)

	selectAllBtn := widget.NewButton("全选", func() {
		for _, f := range fba.files {
			f.Selected = true
		}
		fba.updateSelectedFiles()
		fba.fileList.Refresh()
	})
	deselectAllBtn := widget.NewButton("取消全选", func() {
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

func (fba *FileBatchApp) buildRightPanel() fyne.CanvasObject {
	renameTab := fba.buildRenameTab()
	copyMoveTab := fba.buildCopyMoveTab()
	duplicateTab := fba.buildDuplicateTab()
	logTab := fba.buildLogTab()

	tabs := container.NewAppTabs(
		container.NewTabItem("批量重命名", renameTab),
		container.NewTabItem("复制/移动", copyMoveTab),
		container.NewTabItem("重复文件", duplicateTab),
		container.NewTabItem("处理日志", logTab),
	)

	return tabs
}

func (fba *FileBatchApp) buildRenameTab() fyne.CanvasObject {
	fba.renamePrefix = widget.NewEntry()
	fba.renamePrefix.SetPlaceHolder("文件名前缀，如: photo_")
	fba.renamePrefix.SetText("file_")

	fba.renameStartNum = widget.NewEntry()
	fba.renameStartNum.SetPlaceHolder("起始编号，如: 1")
	fba.renameStartNum.SetText("1")

	previewLabel := widget.NewLabel("预览: file_1.xxx, file_2.xxx...")

	renameBtn := widget.NewButton("开始重命名", fba.doRename)
	renameBtn.Importance = widget.HighImportance

	return container.NewVBox(
		widget.NewCard("批量重命名设置", "",
			container.NewVBox(
				widget.NewForm(
					widget.NewFormItem("文件名前缀:", fba.renamePrefix),
					widget.NewFormItem("起始编号:", fba.renameStartNum),
				),
				previewLabel,
				widget.NewSeparator(),
				renameBtn,
			),
		),
	)
}

func (fba *FileBatchApp) buildCopyMoveTab() fyne.CanvasObject {
	destEntry := widget.NewEntry()
	destEntry.SetPlaceHolder("目标目录...")

	destBtn := widget.NewButton("浏览...", func() {
		dialog.ShowFolderOpen(func(uri fyne.ListableURI, err error) {
			if err == nil && uri != nil {
				destEntry.SetText(uri.Path())
			}
		}, fba.window)
	})

	copyBtn := widget.NewButton("批量复制", func() {
		if destEntry.Text == "" {
			dialog.ShowError(fmt.Errorf("请选择目标目录"), fba.window)
			return
		}
		fba.doCopy(destEntry.Text)
	})
	copyBtn.Importance = widget.HighImportance

	moveBtn := widget.NewButton("批量移动", func() {
		if destEntry.Text == "" {
			dialog.ShowError(fmt.Errorf("请选择目标目录"), fba.window)
			return
		}
		fba.doMove(destEntry.Text)
	})

	return container.NewVBox(
		widget.NewCard("目标目录", "",
			container.NewBorder(nil, nil, nil, destBtn, destEntry),
		),
		widget.NewSeparator(),
		container.NewGridWithColumns(2, copyBtn, moveBtn),
	)
}

func (fba *FileBatchApp) buildDuplicateTab() fyne.CanvasObject {
	detectBtn := widget.NewButton("检测重复文件", fba.detectDuplicates)
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

	clearBtn := widget.NewButton("清空日志", func() {
		fba.logger.Clear()
		fba.logList.Refresh()
	})

	return container.NewBorder(nil, clearBtn, nil, nil, fba.logList)
}

func (fba *FileBatchApp) selectFolder() {
	dialog.ShowFolderOpen(func(uri fyne.ListableURI, err error) {
		if err == nil && uri != nil {
			fba.dirEntry.SetText(uri.Path())
		}
	}, fba.window)
}

func (fba *FileBatchApp) selectFiles() {
	fd := dialog.NewFileOpen(func(uri fyne.URIReadCloser, err error) {
		if err == nil && uri != nil {
			fba.logger.Info("选择文件: " + uri.URI().Path())
		}
	}, fba.window)
	fd.Show()
}

func (fba *FileBatchApp) scanFiles() {
	dir := fba.dirEntry.Text
	if dir == "" {
		dialog.ShowError(fmt.Errorf("请选择要扫描的目录"), fba.window)
		return
	}

	fileTypes := make([]string, 0)
	if fba.typeEntry.Text != "" {
		for _, t := range strings.Split(fba.typeEntry.Text, ",") {
			fileTypes = append(fileTypes, strings.TrimSpace(t))
		}
	}

	fba.statusLabel.SetText("正在扫描...")
	fba.progressBar.Show()
	fba.progressBar.SetValue(0)

	go func() {
		config := fba.configService.Get()
		files, err := fba.fileService.ScanDirectory(dir, config.ExcludeDirs, fileTypes)
		fba.window.Canvas().Refresh(fba.fileList)
		fba.app.SendNotification(&fyne.Notification{
			Title:   "扫描完成",
			Content: fmt.Sprintf("共找到 %d 个文件", len(files)),
		})

		fba.app.Driver().CanvasForObject(fba.window.Content()).Refresh(fba.fileList)
		fba.window.Content().Refresh()

		if err != nil {
			fba.app.Driver().CanvasForObject(fba.window.Content()).Refresh(nil)
			dialog.ShowError(err, fba.window)
			fba.statusLabel.SetText("扫描失败")
			return
		}

		fba.files = files
		fba.app.Driver().CanvasForObject(fba.window.Content()).Refresh(fba.fileList)
		fba.fileList.Refresh()
		fba.statusLabel.SetText(fmt.Sprintf("扫描完成，共 %d 个文件", len(files)))
		fba.progressBar.Hide()
	}()
}

func (fba *FileBatchApp) updateSelectedFiles() {
	fba.selectedFiles = make([]*model.FileInfo, 0)
	for _, f := range fba.files {
		if f.Selected {
			fba.selectedFiles = append(fba.selectedFiles, f)
		}
	}
	count := len(fba.selectedFiles)
	if count > 0 {
		fba.statusLabel.SetText(fmt.Sprintf("已选择 %d 个文件", count))
	} else {
		fba.statusLabel.SetText(fmt.Sprintf("共 %d 个文件", len(fba.files)))
	}
}

func (fba *FileBatchApp) doRename() {
	if len(fba.selectedFiles) == 0 {
		dialog.ShowError(fmt.Errorf("请先选择要重命名的文件"), fba.window)
		return
	}

	prefix := fba.renamePrefix.Text
	startNum := 1
	fmt.Sscanf(fba.renameStartNum.Text, "%d", &startNum)

	dialog.ShowConfirm("确认操作",
		fmt.Sprintf("确定要重命名 %d 个文件吗？\n格式: %s%d.xxx", len(fba.selectedFiles), prefix, startNum),
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

					dialog.ShowInformation("操作完成",
						fmt.Sprintf("总文件数: %d\n成功: %d\n失败: %d\n耗时: %v",
							result.TotalFiles, result.SuccessCount, result.FailCount, result.Duration),
						fba.window)
				}()
			}
		}, fba.window)
}

func (fba *FileBatchApp) doCopy(destDir string) {
	if len(fba.selectedFiles) == 0 {
		dialog.ShowError(fmt.Errorf("请先选择要复制的文件"), fba.window)
		return
	}

	dialog.ShowConfirm("确认操作",
		fmt.Sprintf("确定要复制 %d 个文件到 %s 吗？", len(fba.selectedFiles), destDir),
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

					dialog.ShowInformation("操作完成",
						fmt.Sprintf("总文件数: %d\n成功: %d\n失败: %d\n耗时: %v",
							result.TotalFiles, result.SuccessCount, result.FailCount, result.Duration),
						fba.window)
				}()
			}
		}, fba.window)
}

func (fba *FileBatchApp) doMove(destDir string) {
	if len(fba.selectedFiles) == 0 {
		dialog.ShowError(fmt.Errorf("请先选择要移动的文件"), fba.window)
		return
	}

	dialog.ShowConfirm("确认操作",
		fmt.Sprintf("确定要移动 %d 个文件到 %s 吗？", len(fba.selectedFiles), destDir),
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

					dialog.ShowInformation("操作完成",
						fmt.Sprintf("总文件数: %d\n成功: %d\n失败: %d\n耗时: %v",
							result.TotalFiles, result.SuccessCount, result.FailCount, result.Duration),
						fba.window)
				}()
			}
		}, fba.window)
}

func (fba *FileBatchApp) detectDuplicates() {
	if len(fba.files) == 0 {
		dialog.ShowError(fmt.Errorf("请先扫描文件"), fba.window)
		return
	}

	fba.statusLabel.SetText("正在检测重复文件...")
	go func() {
		duplicates := fba.fileService.FindDuplicates(fba.files)
		fba.logList.Refresh()
		fba.statusLabel.SetText("重复文件检测完成")

		msg := fmt.Sprintf("发现 %d 组重复文件", len(duplicates))
		for hash, files := range duplicates {
			msg += fmt.Sprintf("\n\nHash: %s\n", hash[:16])
			for _, f := range files {
				msg += fmt.Sprintf("- %s\n", f.Path)
			}
		}
		dialog.ShowInformation("重复文件检测结果", msg, fba.window)
	}()
}

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

	fba.logger.Info("配置已保存")
	dialog.ShowInformation("保存成功", "配置已保存到 config/config.yaml", fba.window)
}

func (fba *FileBatchApp) showAbout() {
	dialog.ShowInformation("关于",
		"本地文件批量处理工具 v1.0\n\n"+
			"功能特性:\n"+
			"- 文件夹扫描\n"+
			"- 文件类型筛选\n"+
			"- 批量重命名\n"+
			"- 批量复制/移动\n"+
			"- 重复文件检测\n"+
			"- 操作日志记录\n\n"+
			"技术栈: Go 1.22+ + Fyne",
		fba.window)
}

func (fba *FileBatchApp) formatSize(size int64) string {
	const unit = 1024
	if size < unit {
		return fmt.Sprintf("%d B", size)
	}
	div, exp := int64(unit), 0
	for n := size / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(size)/float64(div), "KMGTPE"[exp])
}
