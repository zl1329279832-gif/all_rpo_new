package com.community.groupbuy.service;

import com.community.groupbuy.dto.SortItemSaveDTO;
import com.community.groupbuy.vo.WarehouseSortItemVO;

import java.util.List;

public interface WarehouseSortItemService {

    List<WarehouseSortItemVO> getItemsBySortId(Long sortId);

    void saveSortResult(List<SortItemSaveDTO> items);
}
