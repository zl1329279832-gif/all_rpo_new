package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.ProductQueryDTO;
import com.community.groupbuy.dto.ProductSaveDTO;
import com.community.groupbuy.vo.ProductVO;

public interface ProductService {

    PageResult<ProductVO> page(ProductQueryDTO queryDTO, Long current, Long size);

    void add(ProductSaveDTO saveDTO);

    void update(ProductSaveDTO saveDTO);

    void delete(Long id);

    void updateStatus(Long id, Integer status);

    ProductVO getDetail(Long id);
}
