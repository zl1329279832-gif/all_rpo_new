package com.community.groupbuy.controller;

import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.ActivitySkuSaveDTO;
import com.community.groupbuy.service.GroupActivitySkuService;
import com.community.groupbuy.vo.GroupActivitySkuVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/activity/sku")
@RequiredArgsConstructor
public class GroupActivitySkuController {

    private final GroupActivitySkuService groupActivitySkuService;

    @GetMapping("/list")
    public Result<List<GroupActivitySkuVO>> list(@RequestParam(required = false) Long activityId) {
        List<GroupActivitySkuVO> skuList = groupActivitySkuService.list(activityId);
        return Result.success(skuList);
    }

    @PostMapping
    public Result<Void> add(@Validated @RequestBody ActivitySkuSaveDTO saveDTO) {
        groupActivitySkuService.add(saveDTO);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@Validated @RequestBody ActivitySkuSaveDTO saveDTO) {
        groupActivitySkuService.update(saveDTO);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        groupActivitySkuService.delete(id);
        return Result.success();
    }

    @PutMapping("/{id}/decrease-stock")
    public Result<Boolean> decreaseStock(@PathVariable Long id, @RequestParam BigDecimal quantity) {
        boolean success = groupActivitySkuService.decreaseStock(id, quantity);
        return Result.success(success);
    }

    @PutMapping("/{id}/release-stock")
    public Result<Void> releaseStock(@PathVariable Long id, @RequestParam BigDecimal quantity) {
        groupActivitySkuService.releaseStock(id, quantity);
        return Result.success();
    }

    @PutMapping("/{id}/lock-stock")
    public Result<Boolean> lockStock(@PathVariable Long id, @RequestParam BigDecimal quantity) {
        boolean success = groupActivitySkuService.lockStock(id, quantity);
        return Result.success(success);
    }

    @PutMapping("/{id}/unlock-stock")
    public Result<Void> unlockStock(@PathVariable Long id, @RequestParam BigDecimal quantity) {
        groupActivitySkuService.unlockStock(id, quantity);
        return Result.success();
    }
}
