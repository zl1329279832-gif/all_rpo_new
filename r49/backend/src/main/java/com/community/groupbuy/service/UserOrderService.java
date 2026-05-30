package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.OrderCreateDTO;
import com.community.groupbuy.dto.OrderQueryDTO;
import com.community.groupbuy.vo.UserOrderVO;

import java.util.List;

public interface UserOrderService {

    PageResult<UserOrderVO> page(OrderQueryDTO queryDTO, Long current, Long size);

    String createOrder(OrderCreateDTO createDTO, Long userId);

    void cancelOrder(Long id, String cancelReason);

    void payOrder(Long id);

    UserOrderVO getOrderDetail(Long id);

    List<UserOrderVO> getUserOrderList(Long userId, Integer orderStatus);

    void delete(Long id);

    void deleteBatch(List<Long> ids);
}
