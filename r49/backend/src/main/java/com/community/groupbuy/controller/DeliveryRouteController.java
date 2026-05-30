package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.entity.DeliveryRoute;
import com.community.groupbuy.service.DeliveryRouteService;
import com.community.groupbuy.vo.DeliveryRouteVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery/route")
@RequiredArgsConstructor
public class DeliveryRouteController {

    private final DeliveryRouteService deliveryRouteService;

    @GetMapping("/page")
    public Result<PageResult<DeliveryRouteVO>> page(@RequestParam(required = false) String routeName,
                                                    @RequestParam(required = false) String routeCode,
                                                    @RequestParam(required = false) Integer status,
                                                    @RequestParam(defaultValue = "1") Long current,
                                                    @RequestParam(defaultValue = "10") Long size) {
        PageResult<DeliveryRouteVO> pageResult = deliveryRouteService.page(routeName, routeCode, status, current, size);
        return Result.success(pageResult);
    }

    @PostMapping
    public Result<Void> add(@Validated @RequestBody DeliveryRoute deliveryRoute) {
        deliveryRouteService.add(deliveryRoute);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@Validated @RequestBody DeliveryRoute deliveryRoute) {
        deliveryRouteService.update(deliveryRoute);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        deliveryRouteService.delete(id);
        return Result.success();
    }

    @DeleteMapping
    public Result<Void> deleteBatch(@RequestBody List<Long> ids) {
        for (Long id : ids) {
            deliveryRouteService.delete(id);
        }
        return Result.success();
    }

    @PutMapping("/{id}/enable")
    public Result<Void> enable(@PathVariable Long id) {
        deliveryRouteService.enable(id);
        return Result.success();
    }

    @PutMapping("/{id}/disable")
    public Result<Void> disable(@PathVariable Long id) {
        deliveryRouteService.disable(id);
        return Result.success();
    }
}
