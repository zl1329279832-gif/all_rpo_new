package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.ProductBatchSaveDTO;
import com.community.groupbuy.vo.ProductBatchVO;

import java.math.BigDecimal;

public interface ProductBatchService {

    PageResult<ProductBatchVO> page(Long productId, Long current, Long size);

    void add(ProductBatchSaveDTO saveDTO);

    void update(ProductBatchSaveDTO saveDTO);

    void delete(Long id);

    void stockIn(Long id, BigDecimal quantity);

    void stockOut(Long id, BigDecimal quantity);
}
