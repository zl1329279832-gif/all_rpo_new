package com.example.componentconfig.controller;

import com.example.componentconfig.common.PageResult;
import com.example.componentconfig.common.Result;
import com.example.componentconfig.entity.ComponentConfig;
import com.example.componentconfig.service.ComponentConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "组件配置", description = "组件配置管理接口")
@RestController
@RequestMapping("/api/component")
@RequiredArgsConstructor
@CrossOrigin
public class ComponentConfigController {

    private final ComponentConfigService componentConfigService;

    @Operation(summary = "获取组件配置列表")
    @GetMapping("/list")
    public Result<PageResult<ComponentConfig>> list(
            @Parameter(description = "当前页码") @RequestParam(defaultValue = "1") int current,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "搜索关键字") @RequestParam(required = false) String keyword,
            @Parameter(description = "组件类型") @RequestParam(required = false) String componentType) {
        PageResult<ComponentConfig> result = componentConfigService.list(current, size, keyword, componentType);
        return Result.success(result);
    }

    @Operation(summary = "获取组件配置详情")
    @GetMapping("/{id}")
    public Result<ComponentConfig> getById(@Parameter(description = "组件ID") @PathVariable String id) {
        return componentConfigService.getById(id)
                .map(Result::success)
                .orElseGet(() -> Result.error("组件配置不存在"));
    }

    @Operation(summary = "创建组件配置")
    @PostMapping
    public Result<ComponentConfig> create(@RequestBody ComponentConfig config) {
        ComponentConfig created = componentConfigService.create(config);
        return Result.success("创建成功", created);
    }

    @Operation(summary = "更新组件配置")
    @PutMapping("/{id}")
    public Result<ComponentConfig> update(
            @Parameter(description = "组件ID") @PathVariable String id,
            @RequestBody ComponentConfig config) {
        ComponentConfig updated = componentConfigService.update(id, config);
        return Result.success("更新成功", updated);
    }

    @Operation(summary = "删除组件配置")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@Parameter(description = "组件ID") @PathVariable String id) {
        componentConfigService.delete(id);
        return Result.success("删除成功", null);
    }

    @Operation(summary = "保存组件配置（通用）")
    @PostMapping("/config")
    public Result<ComponentConfig> saveConfig(@RequestBody ComponentConfig config) {
        if (config.getId() != null && !config.getId().isEmpty()) {
            ComponentConfig updated = componentConfigService.update(config.getId(), config);
            return Result.success("更新成功", updated);
        } else {
            ComponentConfig created = componentConfigService.create(config);
            return Result.success("创建成功", created);
        }
    }
}
