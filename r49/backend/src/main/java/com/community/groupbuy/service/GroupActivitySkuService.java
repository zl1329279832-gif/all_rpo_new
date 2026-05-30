package com.community.groupbuy.service;

import com.community.groupbuy.dto.ActivitySkuSaveDTO;
import com.community.groupbuy.vo.GroupActivitySkuVO;

import java.math.BigDecimal;
import java.util.List;

public interface GroupActivitySkuService {

    List<GroupActivitySkuVO> list(Long activityId);

    void add(ActivitySkuSaveDTO saveDTO);

    void update(ActivitySkuSaveDTO saveDTO);

    void delete(Long id);

    boolean decreaseStock(Long skuId, BigDecimal quantity);

    void releaseStock(Long skuId, BigDecimal quantity);

    boolean lockStock(Long skuId, BigDecimal quantity);

    void unlockStock(Long skuId, BigDecimal quantity);
}
