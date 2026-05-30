package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.ProductBatchSaveDTO;
import com.community.groupbuy.entity.Product;
import com.community.groupbuy.entity.ProductBatch;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.ProductBatchMapper;
import com.community.groupbuy.mapper.ProductMapper;
import com.community.groupbuy.service.ProductBatchService;
import com.community.groupbuy.vo.ProductBatchVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductBatchServiceImpl implements ProductBatchService {

    private final ProductBatchMapper productBatchMapper;
    private final ProductMapper productMapper;

    @Override
    public PageResult<ProductBatchVO> page(Long productId, Long current, Long size) {
        Page<ProductBatch> page = new Page<>(current, size);
        LambdaQueryWrapper<ProductBatch> wrapper = new LambdaQueryWrapper<>();

        if (productId != null) {
            wrapper.eq(ProductBatch::getProductId, productId);
        }
        wrapper.orderByDesc(ProductBatch::getCreateTime);

        Page<ProductBatch> batchPage = productBatchMapper.selectPage(page, wrapper);
        List<ProductBatchVO> voList = batchPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(voList, batchPage.getTotal(), batchPage.getCurrent(), batchPage.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(ProductBatchSaveDTO saveDTO) {
        Product product = productMapper.selectById(saveDTO.getProductId());
        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        LambdaQueryWrapper<ProductBatch> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductBatch::getBatchNo, saveDTO.getBatchNo());
        if (productBatchMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("批次号已存在");
        }

        ProductBatch batch = new ProductBatch();
        BeanUtils.copyProperties(saveDTO, batch);
        productBatchMapper.insert(batch);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(ProductBatchSaveDTO saveDTO) {
        if (saveDTO.getId() == null) {
            throw new BusinessException("批次ID不能为空");
        }
        ProductBatch existingBatch = productBatchMapper.selectById(saveDTO.getId());
        if (existingBatch == null) {
            throw new BusinessException("批次不存在");
        }

        Product product = productMapper.selectById(saveDTO.getProductId());
        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        LambdaQueryWrapper<ProductBatch> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductBatch::getBatchNo, saveDTO.getBatchNo())
                .ne(ProductBatch::getId, saveDTO.getId());
        if (productBatchMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("批次号已存在");
        }

        ProductBatch batch = new ProductBatch();
        BeanUtils.copyProperties(saveDTO, batch);
        productBatchMapper.updateById(batch);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (id == null) {
            throw new BusinessException("批次ID不能为空");
        }
        ProductBatch batch = productBatchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException("批次不存在");
        }
        if (batch.getStockQuantity().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException("批次库存不为零，无法删除");
        }
        productBatchMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void stockIn(Long id, BigDecimal quantity) {
        if (id == null) {
            throw new BusinessException("批次ID不能为空");
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("入库数量必须大于0");
        }
        ProductBatch batch = productBatchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException("批次不存在");
        }
        batch.setStockQuantity(batch.getStockQuantity().add(quantity));
        productBatchMapper.updateById(batch);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void stockOut(Long id, BigDecimal quantity) {
        if (id == null) {
            throw new BusinessException("批次ID不能为空");
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("出库数量必须大于0");
        }
        ProductBatch batch = productBatchMapper.selectById(id);
        if (batch == null) {
            throw new BusinessException("批次不存在");
        }
        if (batch.getStockQuantity().compareTo(quantity) < 0) {
            throw new BusinessException("库存不足");
        }
        batch.setStockQuantity(batch.getStockQuantity().subtract(quantity));
        productBatchMapper.updateById(batch);
    }

    private ProductBatchVO convertToVO(ProductBatch batch) {
        ProductBatchVO vo = new ProductBatchVO();
        BeanUtils.copyProperties(batch, vo);
        Product product = productMapper.selectById(batch.getProductId());
        if (product != null) {
            vo.setProductName(product.getProductName());
            vo.setProductCode(product.getProductCode());
        }
        return vo;
    }
}
