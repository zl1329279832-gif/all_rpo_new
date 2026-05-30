package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.community.groupbuy.entity.OrderItem;
import com.community.groupbuy.mapper.OrderItemMapper;
import com.community.groupbuy.service.OrderItemService;
import com.community.groupbuy.vo.OrderItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderItemServiceImpl implements OrderItemService {

    private final OrderItemMapper orderItemMapper;

    @Override
    public List<OrderItemVO> getItemsByOrderId(Long orderId) {
        LambdaQueryWrapper<OrderItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderItem::getOrderId, orderId);
        wrapper.orderByAsc(OrderItem::getId);
        List<OrderItem> items = orderItemMapper.selectList(wrapper);
        return items.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    private OrderItemVO convertToVO(OrderItem item) {
        OrderItemVO vo = new OrderItemVO();
        vo.setId(item.getId());
        vo.setOrderId(item.getOrderId());
        vo.setActivitySkuId(item.getActivitySkuId());
        vo.setProductId(item.getProductId());
        vo.setProductName(item.getProductName());
        vo.setProductImage(item.getProductImage());
        vo.setSpec(item.getSpec());
        vo.setUnitPrice(item.getUnitPrice());
        vo.setQuantity(item.getQuantity());
        vo.setSubtotal(item.getSubtotal());
        vo.setCommissionAmount(item.getCommissionAmount());
        vo.setRefundStatus(item.getRefundStatus());
        vo.setRefundStatusText(getRefundStatusText(item.getRefundStatus()));
        vo.setRefundQuantity(item.getRefundQuantity());
        return vo;
    }

    private String getRefundStatusText(Integer status) {
        if (status == null) return "";
        switch (status) {
            case 0: return "未退款";
            case 1: return "退款中";
            case 2: return "已退款";
            default: return "未知";
        }
    }
}
