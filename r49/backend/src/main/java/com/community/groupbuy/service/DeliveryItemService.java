package com.community.groupbuy.service;

import com.community.groupbuy.entity.DeliveryItem;
import com.community.groupbuy.vo.DeliveryItemVO;

import java.util.List;

public interface DeliveryItemService {

    List<DeliveryItemVO> getByDeliveryId(Long deliveryId);

    void saveActualQuantity(Long deliveryId, List<DeliveryItem> items);
}
