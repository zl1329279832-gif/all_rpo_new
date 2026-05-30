package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.entity.DeliveryRoute;
import com.community.groupbuy.vo.DeliveryRouteVO;

public interface DeliveryRouteService {

    PageResult<DeliveryRouteVO> page(String routeName, String routeCode, Integer status, Long current, Long size);

    void add(DeliveryRoute deliveryRoute);

    void update(DeliveryRoute deliveryRoute);

    void delete(Long id);

    void enable(Long id);

    void disable(Long id);
}
