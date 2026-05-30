package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.SortCreateDTO;
import com.community.groupbuy.dto.SortQueryDTO;
import com.community.groupbuy.vo.WarehouseSortVO;

import java.util.List;

public interface WarehouseSortService {

    PageResult<WarehouseSortVO> page(SortQueryDTO queryDTO, Long current, Long size);

    Long createSort(SortCreateDTO createDTO, Long operatorId);

    void printSort(Long id);

    void startSort(Long id);

    void finishSort(Long id);

    WarehouseSortVO getSortDetail(Long id);

    void delete(Long id);

    void deleteBatch(List<Long> ids);
}
