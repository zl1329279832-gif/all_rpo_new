package com.community.groupbuy.controller;

import com.community.groupbuy.common.Result;
import com.community.groupbuy.entity.SysPermission;
import com.community.groupbuy.service.SysPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/system/permission")
@RequiredArgsConstructor
public class SysPermissionController {

    private final SysPermissionService sysPermissionService;

    @GetMapping("/tree")
    public Result<List<SysPermission>> tree() {
        List<SysPermission> tree = sysPermissionService.tree();
        return Result.success(tree);
    }

    @GetMapping("/list")
    public Result<List<SysPermission>> list() {
        List<SysPermission> permissions = sysPermissionService.list();
        return Result.success(permissions);
    }

    @PostMapping
    public Result<Void> add(@Validated @RequestBody SysPermission sysPermission) {
        sysPermissionService.add(sysPermission);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@Validated @RequestBody SysPermission sysPermission) {
        sysPermissionService.update(sysPermission);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        sysPermissionService.delete(id);
        return Result.success();
    }
}
