package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.entity.SysRole;
import com.community.groupbuy.service.SysRoleService;
import com.community.groupbuy.vo.SysRoleVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/system/role")
@RequiredArgsConstructor
public class SysRoleController {

    private final SysRoleService sysRoleService;

    @GetMapping("/page")
    public Result<PageResult<SysRoleVO>> page(@RequestParam(required = false) String roleName,
                                              @RequestParam(required = false) Integer status,
                                              @RequestParam(defaultValue = "1") Long current,
                                              @RequestParam(defaultValue = "10") Long size) {
        PageResult<SysRoleVO> pageResult = sysRoleService.page(roleName, status, current, size);
        return Result.success(pageResult);
    }

    @GetMapping("/list")
    public Result<List<SysRole>> list() {
        List<SysRole> roles = sysRoleService.list();
        return Result.success(roles);
    }

    @PostMapping
    public Result<Void> add(@Validated @RequestBody SysRole sysRole) {
        sysRoleService.add(sysRole);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@Validated @RequestBody SysRole sysRole) {
        sysRoleService.update(sysRole);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        sysRoleService.delete(id);
        return Result.success();
    }

    @DeleteMapping
    public Result<Void> deleteBatch(@RequestBody List<Long> ids) {
        sysRoleService.deleteBatch(ids);
        return Result.success();
    }

    @PutMapping("/{id}/permissions")
    public Result<Void> assignPermissions(@PathVariable Long id, @RequestBody List<Long> permissionIds) {
        sysRoleService.assignPermissions(id, permissionIds);
        return Result.success();
    }
}
