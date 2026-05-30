package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.ProductQueryDTO;
import com.community.groupbuy.dto.ProductSaveDTO;
import com.community.groupbuy.entity.Product;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.ProductMapper;
import com.community.groupbuy.service.ProductService;
import com.community.groupbuy.vo.ProductVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductMapper productMapper;

    @Override
    public PageResult<ProductVO> page(ProductQueryDTO queryDTO, Long current, Long size) {
        Page<Product> page = new Page<>(current, size);
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(queryDTO.getProductName())) {
            wrapper.like(Product::getProductName, queryDTO.getProductName());
        }
        if (StringUtils.hasText(queryDTO.getProductCode())) {
            wrapper.like(Product::getProductCode, queryDTO.getProductCode());
        }
        if (queryDTO.getCategoryId() != null) {
            wrapper.eq(Product::getCategoryId, queryDTO.getCategoryId());
        }
        if (StringUtils.hasText(queryDTO.getBrand())) {
            wrapper.like(Product::getBrand, queryDTO.getBrand());
        }
        if (queryDTO.getStatus() != null) {
            wrapper.eq(Product::getStatus, queryDTO.getStatus());
        }
        wrapper.orderByDesc(Product::getCreateTime);

        Page<Product> productPage = productMapper.selectPage(page, wrapper);
        List<ProductVO> voList = productPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(voList, productPage.getTotal(), productPage.getCurrent(), productPage.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(ProductSaveDTO saveDTO) {
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Product::getProductCode, saveDTO.getProductCode());
        if (productMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("商品编码已存在");
        }

        Product product = new Product();
        BeanUtils.copyProperties(saveDTO, product);
        productMapper.insert(product);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(ProductSaveDTO saveDTO) {
        if (saveDTO.getId() == null) {
            throw new BusinessException("商品ID不能为空");
        }
        Product existingProduct = productMapper.selectById(saveDTO.getId());
        if (existingProduct == null) {
            throw new BusinessException("商品不存在");
        }

        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Product::getProductCode, saveDTO.getProductCode())
                .ne(Product::getId, saveDTO.getId());
        if (productMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("商品编码已存在");
        }

        Product product = new Product();
        BeanUtils.copyProperties(saveDTO, product);
        productMapper.updateById(product);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (id == null) {
            throw new BusinessException("商品ID不能为空");
        }
        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException("商品不存在");
        }
        productMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        if (id == null) {
            throw new BusinessException("商品ID不能为空");
        }
        if (status == null) {
            throw new BusinessException("状态不能为空");
        }
        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException("商品不存在");
        }
        product.setStatus(status);
        productMapper.updateById(product);
    }

    @Override
    public ProductVO getDetail(Long id) {
        if (id == null) {
            throw new BusinessException("商品ID不能为空");
        }
        Product product = productMapper.selectById(id);
        if (product == null) {
            throw new BusinessException("商品不存在");
        }
        return convertToVO(product);
    }

    private ProductVO convertToVO(Product product) {
        ProductVO vo = new ProductVO();
        BeanUtils.copyProperties(product, vo);
        return vo;
    }
}
