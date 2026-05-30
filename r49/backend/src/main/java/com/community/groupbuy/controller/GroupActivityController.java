package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.GroupActivityQueryDTO;
import com.community.groupbuy.dto.GroupActivitySaveDTO;
import com.community.groupbuy.service.GroupActivityService;
import com.community.groupbuy.vo.GroupActivitySkuVO;
import com.community.groupbuy.vo.GroupActivityVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
@RequiredArgsConstructor
public class GroupActivityController {

    private final GroupActivityService groupActivityService;

    @GetMapping("/page")
    public Result<PageResult<GroupActivityVO>> page(GroupActivityQueryDTO queryDTO,
                                                    @RequestParam(defaultValue = "1") Long current,
                                                    @RequestParam(defaultValue = "10") Long size) {
        PageResult<GroupActivityVO> pageResult = groupActivityService.page(queryDTO, current, size);
        return Result.success(pageResult);
    }

    @PostMapping
    public Result<Void> create(@Validated @RequestBody GroupActivitySaveDTO saveDTO) {
        groupActivityService.create(saveDTO);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@Validated @RequestBody GroupActivitySaveDTO saveDTO) {
        groupActivityService.update(saveDTO);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        groupActivityService.delete(id);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        groupActivityService.updateStatus(id, status);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<GroupActivityVO> getDetail(@PathVariable Long id) {
        GroupActivityVO activityVO = groupActivityService.getDetail(id);
        return Result.success(activityVO);
    }

    @GetMapping("/{id}/sku-list")
    public Result<List<GroupActivitySkuVO>> getActivitySkuList(@PathVariable Long id) {
        List<GroupActivitySkuVO> skuList = groupActivityService.getActivitySkuList(id);
        return Result.success(skuList);
    }

    @PostMapping("/{id}/validate-stock")
    public Result<Void> validateActivityStock(@PathVariable Long id) {
        groupActivityService.validateActivityStock(id);
        return Result.success();
    }

    @PostMapping("/{id}/validate-cutoff")
    public Result<Void> validateCutOffTime(@PathVariable Long id) {
        groupActivityService.validateCutOffTime(id);
        return Result.success();
    }
}
