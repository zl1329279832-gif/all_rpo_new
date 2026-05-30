package com.community.groupbuy.service;

import com.community.groupbuy.vo.AfterSaleItemVO;

import java.util.List;

public interface AfterSaleItemService {

    List<AfterSaleItemVO> getItemsByAfterSaleId(Long afterSaleId);
}
