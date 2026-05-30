package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.DeliveryCreateDTO;
import com.community.groupbuy.dto.DeliveryQueryDTO;
import com.community.groupbuy.entity.DeliveryItem;
import com.community.groupbuy.service.DeliveryItemService;
import com.community.groupbuy.service.DeliveryOrderService;
import com.community.groupbuy.vo.DeliveryItemVO;
import com.community.groupbuy.vo.DeliveryOrderVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery/order")
@RequiredArgsConstructor
public class DeliveryOrderController {

    private final DeliveryOrderService deliveryOrderService;
    private final DeliveryItemService deliveryItemService;

    @GetMapping("/page")
    public Result<PageResult<DeliveryOrderVO>> page(DeliveryQueryDTO queryDTO) {
        PageResult<DeliveryOrderVO> pageResult = deliveryOrderService.page(queryDTO);
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<DeliveryOrderVO> getDetail(@PathVariable Long id) {
        DeliveryOrderVO detail = deliveryOrderService.getDetail(id);
        return Result.success(detail);
    }

    @PostMapping
    public Result<Void> create(@Validated @RequestBody DeliveryCreateDTO dto) {
        deliveryOrderService.createDelivery(dto);
        return Result.success();
    }

    @PutMapping("/{id}/depart")
    public Result<Void> depart(@PathVariable Long id) {
        deliveryOrderService.depart(id);
        return Result.success();
    }

    @PutMapping("/{id}/arrive")
    public Result<Void> arrive(@PathVariable Long id) {
        deliveryOrderService.arrive(id);
        return Result.success();
    }

    @PutMapping("/{id}/complete")
    public Result<Void> complete(@PathVariable Long id) {
        deliveryOrderService.complete(id);
        return Result.success();
    }

    @PutMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Long id) {
        deliveryOrderService.cancel(id);
        return Result.success();
    }

    @GetMapping("/{deliveryId}/items")
    public Result<List<DeliveryItemVO>> getItems(@PathVariable Long deliveryId) {
        List<DeliveryItemVO> items = deliveryItemService.getByDeliveryId(deliveryId);
        return Result.success(items);
    }

    @PutMapping("/{deliveryId}/items")
    public Result<Void> saveItems(@PathVariable Long deliveryId, @RequestBody List<DeliveryItem> items) {
        deliveryItemService.saveActualQuantity(deliveryId, items);
        return Result.success();
    }
}
