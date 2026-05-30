package com.community.groupbuy.service;

import com.community.groupbuy.vo.OrderItemVO;

import java.util.List;

public interface OrderItemService {

    List<OrderItemVO> getItemsByOrderId(Long orderId);
}
