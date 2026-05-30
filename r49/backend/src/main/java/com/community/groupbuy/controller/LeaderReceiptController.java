package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.ReceiptQueryDTO;
import com.community.groupbuy.dto.ReceiptSaveDTO;
import com.community.groupbuy.entity.ReceiptItem;
import com.community.groupbuy.service.LeaderReceiptService;
import com.community.groupbuy.service.ReceiptItemService;
import com.community.groupbuy.vo.LeaderReceiptVO;
import com.community.groupbuy.vo.ReceiptItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leader/receipt")
@RequiredArgsConstructor
public class LeaderReceiptController {

    private final LeaderReceiptService leaderReceiptService;
    private final ReceiptItemService receiptItemService;

    @GetMapping("/page")
    public Result<PageResult<LeaderReceiptVO>> page(ReceiptQueryDTO queryDTO) {
        PageResult<LeaderReceiptVO> pageResult = leaderReceiptService.page(queryDTO);
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<LeaderReceiptVO> getDetail(@PathVariable Long id) {
        LeaderReceiptVO detail = leaderReceiptService.getDetail(id);
        return Result.success(detail);
    }

    @PostMapping
    public Result<Void> create(@Validated @RequestBody ReceiptSaveDTO dto) {
        leaderReceiptService.createReceipt(dto);
        return Result.success();
    }

    @PostMapping("/receipt")
    public Result<Void> receipt(@Validated @RequestBody ReceiptSaveDTO dto) {
        leaderReceiptService.receipt(dto);
        return Result.success();
    }

    @GetMapping("/{receiptId}/items")
    public Result<List<ReceiptItemVO>> getItems(@PathVariable Long receiptId) {
        List<ReceiptItemVO> items = receiptItemService.getByReceiptId(receiptId);
        return Result.success(items);
    }

    @PutMapping("/{receiptId}/items")
    public Result<Void> saveItems(@PathVariable Long receiptId, @RequestBody List<ReceiptItem> items) {
        receiptItemService.saveActualQuantity(receiptId, items);
        return Result.success();
    }
}
