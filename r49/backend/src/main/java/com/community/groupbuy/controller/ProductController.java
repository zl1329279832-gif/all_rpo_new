package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.ProductQueryDTO;
import com.community.groupbuy.dto.ProductSaveDTO;
import com.community.groupbuy.service.ProductService;
import com.community.groupbuy.vo.ProductVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/product")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/page")
    public Result<PageResult<ProductVO>> page(ProductQueryDTO queryDTO,
                                              @RequestParam(defaultValue = "1") Long current,
                                              @RequestParam(defaultValue = "10") Long size) {
        PageResult<ProductVO> pageResult = productService.page(queryDTO, current, size);
        return Result.success(pageResult);
    }

    @PostMapping
    public Result<Void> add(@Validated @RequestBody ProductSaveDTO saveDTO) {
        productService.add(saveDTO);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@Validated @RequestBody ProductSaveDTO saveDTO) {
        productService.update(saveDTO);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        productService.updateStatus(id, status);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<ProductVO> getDetail(@PathVariable Long id) {
        ProductVO productVO = productService.getDetail(id);
        return Result.success(productVO);
    }
}
