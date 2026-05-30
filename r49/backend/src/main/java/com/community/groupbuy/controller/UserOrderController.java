package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.OrderCreateDTO;
import com.community.groupbuy.dto.OrderQueryDTO;
import com.community.groupbuy.security.LoginUser;
import com.community.groupbuy.service.AuthService;
import com.community.groupbuy.service.OrderItemService;
import com.community.groupbuy.service.UserOrderService;
import com.community.groupbuy.vo.OrderItemVO;
import com.community.groupbuy.vo.UserOrderVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class UserOrderController {

    private final UserOrderService userOrderService;
    private final OrderItemService orderItemService;
    private final AuthService authService;

    @GetMapping("/page")
    public Result<PageResult<UserOrderVO>> page(OrderQueryDTO queryDTO,
                                                @RequestParam(defaultValue = "1") Long current,
                                                @RequestParam(defaultValue = "10") Long size) {
        PageResult<UserOrderVO> pageResult = userOrderService.page(queryDTO, current, size);
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<UserOrderVO> getDetail(@PathVariable Long id) {
        UserOrderVO orderDetail = userOrderService.getOrderDetail(id);
        return Result.success(orderDetail);
    }

    @GetMapping("/{id}/items")
    public Result<List<OrderItemVO>> getOrderItems(@PathVariable Long id) {
        List<OrderItemVO> items = orderItemService.getItemsByOrderId(id);
        return Result.success(items);
    }

    @GetMapping("/my")
    public Result<List<UserOrderVO>> getMyOrders(@RequestParam(required = false) Integer orderStatus) {
        LoginUser loginUser = authService.getCurrentUser();
        List<UserOrderVO> orders = userOrderService.getUserOrderList(loginUser.getId(), orderStatus);
        return Result.success(orders);
    }

    @PostMapping
    public Result<String> create(@Validated @RequestBody OrderCreateDTO createDTO) {
        LoginUser loginUser = authService.getCurrentUser();
        String orderNo = userOrderService.createOrder(createDTO, loginUser.getId());
        return Result.success(orderNo);
    }

    @PutMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Long id, @RequestBody(required = false) Map<String, String> params) {
        String cancelReason = params != null ? params.get("cancelReason") : null;
        userOrderService.cancelOrder(id, cancelReason);
        return Result.success();
    }

    @PutMapping("/{id}/pay")
    public Result<Void> pay(@PathVariable Long id) {
        userOrderService.payOrder(id);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        userOrderService.delete(id);
        return Result.success();
    }

    @DeleteMapping
    public Result<Void> deleteBatch(@RequestBody List<Long> ids) {
        userOrderService.deleteBatch(ids);
        return Result.success();
    }
}
