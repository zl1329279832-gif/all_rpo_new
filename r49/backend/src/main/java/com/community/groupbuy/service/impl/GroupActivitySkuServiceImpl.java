package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.community.groupbuy.dto.ActivitySkuSaveDTO;
import com.community.groupbuy.entity.GroupActivity;
import com.community.groupbuy.entity.GroupActivitySku;
import com.community.groupbuy.entity.Product;
import com.community.groupbuy.entity.ProductBatch;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.GroupActivityMapper;
import com.community.groupbuy.mapper.GroupActivitySkuMapper;
import com.community.groupbuy.mapper.ProductBatchMapper;
import com.community.groupbuy.mapper.ProductMapper;
import com.community.groupbuy.service.GroupActivitySkuService;
import com.community.groupbuy.vo.GroupActivitySkuVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupActivitySkuServiceImpl implements GroupActivitySkuService {

    private final GroupActivitySkuMapper groupActivitySkuMapper;
    private final GroupActivityMapper groupActivityMapper;
    private final ProductMapper productMapper;
    private final ProductBatchMapper productBatchMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String ACTIVITY_STOCK_KEY = "activity:stock:";
    private static final long CACHE_EXPIRE_HOURS = 24;

    @Override
    public List<GroupActivitySkuVO> list(Long activityId) {
        LambdaQueryWrapper<GroupActivitySku> wrapper = new LambdaQueryWrapper<>();
        if (activityId != null) {
            wrapper.eq(GroupActivitySku::getActivityId, activityId);
        }
        wrapper.orderByAsc(GroupActivitySku::getSort);
        List<GroupActivitySku> skuList = groupActivitySkuMapper.selectList(wrapper);

        return skuList.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(ActivitySkuSaveDTO saveDTO) {
        validateSku(saveDTO);

        GroupActivitySku sku = new GroupActivitySku();
        BeanUtils.copyProperties(saveDTO, sku);
        sku.setSoldStock(BigDecimal.ZERO);
        sku.setLockStock(BigDecimal.ZERO);
        groupActivitySkuMapper.insert(sku);

        updateStockCache(sku.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(ActivitySkuSaveDTO saveDTO) {
        if (saveDTO.getId() == null) {
            throw new BusinessException("SKU ID不能为空");
        }
        GroupActivitySku existingSku = groupActivitySkuMapper.selectById(saveDTO.getId());
        if (existingSku == null) {
            throw new BusinessException("SKU不存在");
        }

        validateSku(saveDTO);

        GroupActivitySku sku = new GroupActivitySku();
        BeanUtils.copyProperties(saveDTO, sku);
        groupActivitySkuMapper.updateById(sku);

        updateStockCache(sku.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (id == null) {
            throw new BusinessException("SKU ID不能为空");
        }
        GroupActivitySku sku = groupActivitySkuMapper.selectById(id);
        if (sku == null) {
            throw new BusinessException("SKU不存在");
        }
        if (sku.getSoldStock().compareTo(BigDecimal.ZERO) > 0 || sku.getLockStock().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException("SKU已有销售或锁定库存，无法删除");
        }
        groupActivitySkuMapper.deleteById(id);

        String stockKey = ACTIVITY_STOCK_KEY + id;
        redisTemplate.delete(stockKey);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean decreaseStock(Long skuId, BigDecimal quantity) {
        if (skuId == null) {
            throw new BusinessException("SKU ID不能为空");
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("扣减数量必须大于0");
        }

        GroupActivitySku sku = groupActivitySkuMapper.selectById(skuId);
        if (sku == null) {
            throw new BusinessException("SKU不存在");
        }

        BigDecimal availableStock = sku.getActivityStock().subtract(sku.getSoldStock()).subtract(sku.getLockStock());
        if (availableStock.compareTo(quantity) < 0) {
            throw new BusinessException("库存不足");
        }

        LambdaUpdateWrapper<GroupActivitySku> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(GroupActivitySku::getId, skuId)
                .eq(GroupActivitySku::getActivityStock, sku.getActivityStock())
                .eq(GroupActivitySku::getSoldStock, sku.getSoldStock())
                .eq(GroupActivitySku::getLockStock, sku.getLockStock())
                .setSql("sold_stock = sold_stock + " + quantity)
                .setSql("lock_stock = lock_stock - " + quantity);

        int affectedRows = groupActivitySkuMapper.update(null, updateWrapper);
        if (affectedRows == 0) {
            return false;
        }

        updateStockCache(skuId);
        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void releaseStock(Long skuId, BigDecimal quantity) {
        if (skuId == null) {
            throw new BusinessException("SKU ID不能为空");
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("释放数量必须大于0");
        }

        GroupActivitySku sku = groupActivitySkuMapper.selectById(skuId);
        if (sku == null) {
            throw new BusinessException("SKU不存在");
        }

        if (sku.getSoldStock().compareTo(quantity) < 0) {
            throw new BusinessException("已售库存不足，无法释放");
        }

        LambdaUpdateWrapper<GroupActivitySku> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(GroupActivitySku::getId, skuId)
                .eq(GroupActivitySku::getSoldStock, sku.getSoldStock())
                .setSql("sold_stock = sold_stock - " + quantity);

        groupActivitySkuMapper.update(null, updateWrapper);
        updateStockCache(skuId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean lockStock(Long skuId, BigDecimal quantity) {
        if (skuId == null) {
            throw new BusinessException("SKU ID不能为空");
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("锁定数量必须大于0");
        }

        GroupActivitySku sku = groupActivitySkuMapper.selectById(skuId);
        if (sku == null) {
            throw new BusinessException("SKU不存在");
        }

        BigDecimal availableStock = sku.getActivityStock().subtract(sku.getSoldStock()).subtract(sku.getLockStock());
        if (availableStock.compareTo(quantity) < 0) {
            throw new BusinessException("库存不足");
        }

        LambdaUpdateWrapper<GroupActivitySku> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(GroupActivitySku::getId, skuId)
                .eq(GroupActivitySku::getActivityStock, sku.getActivityStock())
                .eq(GroupActivitySku::getSoldStock, sku.getSoldStock())
                .eq(GroupActivitySku::getLockStock, sku.getLockStock())
                .setSql("lock_stock = lock_stock + " + quantity);

        int affectedRows = groupActivitySkuMapper.update(null, updateWrapper);
        if (affectedRows == 0) {
            return false;
        }

        updateStockCache(skuId);
        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unlockStock(Long skuId, BigDecimal quantity) {
        if (skuId == null) {
            throw new BusinessException("SKU ID不能为空");
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("解锁数量必须大于0");
        }

        GroupActivitySku sku = groupActivitySkuMapper.selectById(skuId);
        if (sku == null) {
            throw new BusinessException("SKU不存在");
        }

        if (sku.getLockStock().compareTo(quantity) < 0) {
            throw new BusinessException("锁定库存不足，无法解锁");
        }

        LambdaUpdateWrapper<GroupActivitySku> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(GroupActivitySku::getId, skuId)
                .eq(GroupActivitySku::getLockStock, sku.getLockStock())
                .setSql("lock_stock = lock_stock - " + quantity);

        groupActivitySkuMapper.update(null, updateWrapper);
        updateStockCache(skuId);
    }

    private void validateSku(ActivitySkuSaveDTO saveDTO) {
        GroupActivity activity = groupActivityMapper.selectById(saveDTO.getActivityId());
        if (activity == null) {
            throw new BusinessException("活动不存在");
        }

        Product product = productMapper.selectById(saveDTO.getProductId());
        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        ProductBatch batch = productBatchMapper.selectById(saveDTO.getProductBatchId());
        if (batch == null) {
            throw new BusinessException("商品批次不存在");
        }

        if (!batch.getProductId().equals(saveDTO.getProductId())) {
            throw new BusinessException("批次不属于该商品");
        }

        if (batch.getStockQuantity().compareTo(saveDTO.getActivityStock()) < 0) {
            throw new BusinessException("批次库存不足：" + product.getProductName());
        }
    }

    private void updateStockCache(Long skuId) {
        GroupActivitySku sku = groupActivitySkuMapper.selectById(skuId);
        if (sku != null) {
            String stockKey = ACTIVITY_STOCK_KEY + skuId;
            BigDecimal availableStock = sku.getActivityStock().subtract(sku.getSoldStock()).subtract(sku.getLockStock());
            redisTemplate.opsForValue().set(stockKey, availableStock, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
        }
    }

    private GroupActivitySkuVO convertToVO(GroupActivitySku sku) {
        GroupActivitySkuVO vo = new GroupActivitySkuVO();
        BeanUtils.copyProperties(sku, vo);
        Product product = productMapper.selectById(sku.getProductId());
        if (product != null) {
            vo.setProductName(product.getProductName());
            vo.setProductImage(product.getImage());
            vo.setProductSpec(product.getSpec());
        }
        ProductBatch batch = productBatchMapper.selectById(sku.getProductBatchId());
        if (batch != null) {
            vo.setBatchNo(batch.getBatchNo());
        }
        BigDecimal availableStock = sku.getActivityStock().subtract(sku.getSoldStock()).subtract(sku.getLockStock());
        vo.setAvailableStock(availableStock);
        return vo;
    }
}
