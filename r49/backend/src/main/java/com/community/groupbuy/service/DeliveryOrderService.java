package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.DeliveryCreateDTO;
import com.community.groupbuy.dto.DeliveryQueryDTO;
import com.community.groupbuy.vo.DeliveryOrderVO;

public interface DeliveryOrderService {

    PageResult<DeliveryOrderVO> page(DeliveryQueryDTO queryDTO);

    void createDelivery(DeliveryCreateDTO dto);

    void depart(Long id);

    void arrive(Long id);

    void complete(Long id);

    DeliveryOrderVO getDetail(Long id);

    void cancel(Long id);
}
