package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.SortCreateDTO;
import com.community.groupbuy.dto.SortQueryDTO;
import com.community.groupbuy.security.LoginUser;
import com.community.groupbuy.service.AuthService;
import com.community.groupbuy.service.WarehouseSortService;
import com.community.groupbuy.vo.WarehouseSortVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warehouse/sort")
@RequiredArgsConstructor
public class WarehouseSortController {

    private final WarehouseSortService warehouseSortService;
    private final AuthService authService;

    @GetMapping("/page")
    public Result<PageResult<WarehouseSortVO>> page(SortQueryDTO queryDTO,
                                                    @RequestParam(defaultValue = "1") Long current,
                                                    @RequestParam(defaultValue = "10") Long size) {
        PageResult<WarehouseSortVO> pageResult = warehouseSortService.page(queryDTO, current, size);
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<WarehouseSortVO> getDetail(@PathVariable Long id) {
        WarehouseSortVO sortDetail = warehouseSortService.getSortDetail(id);
        return Result.success(sortDetail);
    }

    @PostMapping
    public Result<Long> create(@Validated @RequestBody SortCreateDTO createDTO) {
        LoginUser loginUser = authService.getCurrentUser();
        Long sortId = warehouseSortService.createSort(createDTO, loginUser.getId());
        return Result.success(sortId);
    }

    @PutMapping("/{id}/print")
    public Result<Void> print(@PathVariable Long id) {
        warehouseSortService.printSort(id);
        return Result.success();
    }

    @PutMapping("/{id}/start")
    public Result<Void> start(@PathVariable Long id) {
        warehouseSortService.startSort(id);
        return Result.success();
    }

    @PutMapping("/{id}/finish")
    public Result<Void> finish(@PathVariable Long id) {
        warehouseSortService.finishSort(id);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        warehouseSortService.delete(id);
        return Result.success();
    }

    @DeleteMapping
    public Result<Void> deleteBatch(@RequestBody List<Long> ids) {
        warehouseSortService.deleteBatch(ids);
        return Result.success();
    }
}
