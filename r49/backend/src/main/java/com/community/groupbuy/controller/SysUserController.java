package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.SysUserQueryDTO;
import com.community.groupbuy.dto.SysUserSaveDTO;
import com.community.groupbuy.service.SysUserService;
import com.community.groupbuy.vo.SysUserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/system/user")
@RequiredArgsConstructor
public class SysUserController {

    private final SysUserService sysUserService;

    @GetMapping("/page")
    public Result<PageResult<SysUserVO>> page(SysUserQueryDTO queryDTO,
                                              @RequestParam(defaultValue = "1") Long current,
                                              @RequestParam(defaultValue = "10") Long size) {
        PageResult<SysUserVO> pageResult = sysUserService.page(queryDTO, current, size);
        return Result.success(pageResult);
    }

    @PostMapping
    public Result<Void> add(@Validated @RequestBody SysUserSaveDTO saveDTO) {
        sysUserService.add(saveDTO);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@Validated @RequestBody SysUserSaveDTO saveDTO) {
        sysUserService.update(saveDTO);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        sysUserService.delete(id);
        return Result.success();
    }

    @DeleteMapping
    public Result<Void> deleteBatch(@RequestBody List<Long> ids) {
        sysUserService.deleteBatch(ids);
        return Result.success();
    }

    @PutMapping("/reset-password/{id}")
    public Result<Void> resetPassword(@PathVariable Long id) {
        sysUserService.resetPassword(id);
        return Result.success();
    }

    @PutMapping("/{id}/roles")
    public Result<Void> assignRoles(@PathVariable Long id, @RequestBody List<Long> roleIds) {
        sysUserService.assignRoles(id, roleIds);
        return Result.success();
    }
}
