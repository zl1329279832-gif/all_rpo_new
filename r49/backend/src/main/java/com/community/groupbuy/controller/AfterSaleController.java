package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.AfterSaleApplyDTO;
import com.community.groupbuy.dto.AfterSaleAuditDTO;
import com.community.groupbuy.dto.AfterSaleQueryDTO;
import com.community.groupbuy.security.LoginUser;
import com.community.groupbuy.service.AfterSaleItemService;
import com.community.groupbuy.service.AfterSaleService;
import com.community.groupbuy.service.AuthService;
import com.community.groupbuy.vo.AfterSaleItemVO;
import com.community.groupbuy.vo.AfterSaleVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/after-sale")
@RequiredArgsConstructor
public class AfterSaleController {

    private final AfterSaleService afterSaleService;
    private final AfterSaleItemService afterSaleItemService;
    private final AuthService authService;

    @GetMapping("/page")
    public Result<PageResult<AfterSaleVO>> page(AfterSaleQueryDTO queryDTO,
                                                @RequestParam(defaultValue = "1") Long current,
                                                @RequestParam(defaultValue = "10") Long size) {
        PageResult<AfterSaleVO> pageResult = afterSaleService.page(queryDTO, current, size);
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<AfterSaleVO> getDetail(@PathVariable Long id) {
        AfterSaleVO detail = afterSaleService.getDetail(id);
        return Result.success(detail);
    }

    @GetMapping("/{id}/items")
    public Result<List<AfterSaleItemVO>> getItems(@PathVariable Long id) {
        List<AfterSaleItemVO> items = afterSaleItemService.getItemsByAfterSaleId(id);
        return Result.success(items);
    }

    @PostMapping
    public Result<Long> apply(@Validated @RequestBody AfterSaleApplyDTO applyDTO) {
        Long id = afterSaleService.applyAfterSale(applyDTO);
        return Result.success(id);
    }

    @PutMapping("/audit")
    public Result<Void> audit(@Validated @RequestBody AfterSaleAuditDTO auditDTO) {
        afterSaleService.auditAfterSale(auditDTO);
        return Result.success();
    }

    @PutMapping("/{id}/complete")
    public Result<Void> complete(@PathVariable Long id) {
        afterSaleService.completeAfterSale(id);
        return Result.success();
    }

    @GetMapping("/my")
    public Result<PageResult<AfterSaleVO>> getMyAfterSale(AfterSaleQueryDTO queryDTO,
                                                          @RequestParam(defaultValue = "1") Long current,
                                                          @RequestParam(defaultValue = "10") Long size) {
        LoginUser loginUser = authService.getCurrentUser();
        queryDTO.setUserId(loginUser.getId());
        PageResult<AfterSaleVO> pageResult = afterSaleService.page(queryDTO, current, size);
        return Result.success(pageResult);
    }
}
