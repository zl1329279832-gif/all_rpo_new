package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.ProductBatchSaveDTO;
import com.community.groupbuy.service.ProductBatchService;
import com.community.groupbuy.vo.ProductBatchVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/product/batch")
@RequiredArgsConstructor
public class ProductBatchController {

    private final ProductBatchService productBatchService;

    @GetMapping("/page")
    public Result<PageResult<ProductBatchVO>> page(@RequestParam(required = false) Long productId,
                                                   @RequestParam(defaultValue = "1") Long current,
                                                   @RequestParam(defaultValue = "10") Long size) {
        PageResult<ProductBatchVO> pageResult = productBatchService.page(productId, current, size);
        return Result.success(pageResult);
    }

    @PostMapping
    public Result<Void> add(@Validated @RequestBody ProductBatchSaveDTO saveDTO) {
        productBatchService.add(saveDTO);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@Validated @RequestBody ProductBatchSaveDTO saveDTO) {
        productBatchService.update(saveDTO);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        productBatchService.delete(id);
        return Result.success();
    }

    @PutMapping("/{id}/stock-in")
    public Result<Void> stockIn(@PathVariable Long id, @RequestParam BigDecimal quantity) {
        productBatchService.stockIn(id, quantity);
        return Result.success();
    }

    @PutMapping("/{id}/stock-out")
    public Result<Void> stockOut(@PathVariable Long id, @RequestParam BigDecimal quantity) {
        productBatchService.stockOut(id, quantity);
        return Result.success();
    }
}
