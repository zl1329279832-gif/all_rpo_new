package com.community.groupbuy.controller;

import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.SortItemSaveDTO;
import com.community.groupbuy.service.WarehouseSortItemService;
import com.community.groupbuy.vo.WarehouseSortItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/warehouse/sort/item")
@RequiredArgsConstructor
public class WarehouseSortItemController {

    private final WarehouseSortItemService warehouseSortItemService;

    @GetMapping("/list/{sortId}")
    public Result<List<WarehouseSortItemVO>> getItemsBySortId(@PathVariable Long sortId) {
        List<WarehouseSortItemVO> items = warehouseSortItemService.getItemsBySortId(sortId);
        return Result.success(items);
    }

    @PutMapping("/save")
    public Result<Void> saveSortResult(@Validated @RequestBody List<SortItemSaveDTO> items) {
        warehouseSortItemService.saveSortResult(items);
        return Result.success();
    }
}
