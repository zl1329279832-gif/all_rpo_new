package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.ActivitySkuSaveDTO;
import com.community.groupbuy.dto.GroupActivityQueryDTO;
import com.community.groupbuy.dto.GroupActivitySaveDTO;
import com.community.groupbuy.entity.GroupActivity;
import com.community.groupbuy.entity.GroupActivitySku;
import com.community.groupbuy.entity.Product;
import com.community.groupbuy.entity.ProductBatch;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.GroupActivityMapper;
import com.community.groupbuy.mapper.GroupActivitySkuMapper;
import com.community.groupbuy.mapper.ProductBatchMapper;
import com.community.groupbuy.mapper.ProductMapper;
import com.community.groupbuy.service.GroupActivityService;
import com.community.groupbuy.vo.GroupActivitySkuVO;
import com.community.groupbuy.vo.GroupActivityVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupActivityServiceImpl implements GroupActivityService {

    private final GroupActivityMapper groupActivityMapper;
    private final GroupActivitySkuMapper groupActivitySkuMapper;
    private final ProductMapper productMapper;
    private final ProductBatchMapper productBatchMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String HOT_ACTIVITY_KEY = "activity:hot:";
    private static final String ACTIVITY_STOCK_KEY = "activity:stock:";
    private static final long CACHE_EXPIRE_HOURS = 24;

    private static final int ACTIVITY_STATUS_DRAFT = 0;
    private static final int ACTIVITY_STATUS_PUBLISHED = 1;
    private static final int ACTIVITY_STATUS_ONGOING = 2;
    private static final int ACTIVITY_STATUS_ENDED = 3;
    private static final int ACTIVITY_STATUS_CANCELLED = 4;

    @Override
    public PageResult<GroupActivityVO> page(GroupActivityQueryDTO queryDTO, Long current, Long size) {
        Page<GroupActivity> page = new Page<>(current, size);
        LambdaQueryWrapper<GroupActivity> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(queryDTO.getActivityName())) {
            wrapper.like(GroupActivity::getActivityName, queryDTO.getActivityName());
        }
        if (StringUtils.hasText(queryDTO.getActivityCode())) {
            wrapper.like(GroupActivity::getActivityCode, queryDTO.getActivityCode());
        }
        if (queryDTO.getStatus() != null) {
            wrapper.eq(GroupActivity::getStatus, queryDTO.getStatus());
        }
        if (queryDTO.getStartDate() != null) {
            wrapper.ge(GroupActivity::getStartDate, queryDTO.getStartDate());
        }
        if (queryDTO.getEndDate() != null) {
            wrapper.le(GroupActivity::getEndDate, queryDTO.getEndDate());
        }
        wrapper.orderByDesc(GroupActivity::getCreateTime);

        Page<GroupActivity> activityPage = groupActivityMapper.selectPage(page, wrapper);
        List<GroupActivityVO> voList = activityPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(voList, activityPage.getTotal(), activityPage.getCurrent(), activityPage.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(GroupActivitySaveDTO saveDTO) {
        LambdaQueryWrapper<GroupActivity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GroupActivity::getActivityCode, saveDTO.getActivityCode());
        if (groupActivityMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("活动编码已存在");
        }

        if (saveDTO.getStartDate().isAfter(saveDTO.getEndDate())) {
            throw new BusinessException("开始时间不能晚于结束时间");
        }
        if (saveDTO.getCutOffTime().isAfter(saveDTO.getEndDate())) {
            throw new BusinessException("截单时间不能晚于结束时间");
        }

        GroupActivity activity = new GroupActivity();
        BeanUtils.copyProperties(saveDTO, activity);
        activity.setTotalSales(0);
        activity.setTotalAmount(BigDecimal.ZERO);
        groupActivityMapper.insert(activity);

        if (!CollectionUtils.isEmpty(saveDTO.getSkuList())) {
            for (ActivitySkuSaveDTO skuDTO : saveDTO.getSkuList()) {
                validateActivitySku(skuDTO);
                GroupActivitySku sku = new GroupActivitySku();
                BeanUtils.copyProperties(skuDTO, sku);
                sku.setActivityId(activity.getId());
                sku.setSoldStock(BigDecimal.ZERO);
                sku.setLockStock(BigDecimal.ZERO);
                groupActivitySkuMapper.insert(sku);
            }
        }

        if (activity.getStatus() == ACTIVITY_STATUS_PUBLISHED) {
            cacheHotActivity(activity.getId());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(GroupActivitySaveDTO saveDTO) {
        if (saveDTO.getId() == null) {
            throw new BusinessException("活动ID不能为空");
        }
        GroupActivity existingActivity = groupActivityMapper.selectById(saveDTO.getId());
        if (existingActivity == null) {
            throw new BusinessException("活动不存在");
        }

        LambdaQueryWrapper<GroupActivity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GroupActivity::getActivityCode, saveDTO.getActivityCode())
                .ne(GroupActivity::getId, saveDTO.getId());
        if (groupActivityMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("活动编码已存在");
        }

        if (saveDTO.getStartDate().isAfter(saveDTO.getEndDate())) {
            throw new BusinessException("开始时间不能晚于结束时间");
        }
        if (saveDTO.getCutOffTime().isAfter(saveDTO.getEndDate())) {
            throw new BusinessException("截单时间不能晚于结束时间");
        }

        GroupActivity activity = new GroupActivity();
        BeanUtils.copyProperties(saveDTO, activity);
        groupActivityMapper.updateById(activity);

        LambdaQueryWrapper<GroupActivitySku> skuWrapper = new LambdaQueryWrapper<>();
        skuWrapper.eq(GroupActivitySku::getActivityId, saveDTO.getId());
        groupActivitySkuMapper.delete(skuWrapper);

        if (!CollectionUtils.isEmpty(saveDTO.getSkuList())) {
            for (ActivitySkuSaveDTO skuDTO : saveDTO.getSkuList()) {
                validateActivitySku(skuDTO);
                GroupActivitySku sku = new GroupActivitySku();
                BeanUtils.copyProperties(skuDTO, sku);
                sku.setActivityId(saveDTO.getId());
                if (skuDTO.getId() != null) {
                    sku.setId(skuDTO.getId());
                }
                if (sku.getSoldStock() == null) {
                    sku.setSoldStock(BigDecimal.ZERO);
                }
                if (sku.getLockStock() == null) {
                    sku.setLockStock(BigDecimal.ZERO);
                }
                groupActivitySkuMapper.insert(sku);
            }
        }

        if (saveDTO.getStatus() == ACTIVITY_STATUS_PUBLISHED) {
            cacheHotActivity(saveDTO.getId());
        } else {
            deleteActivityCache(saveDTO.getId());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (id == null) {
            throw new BusinessException("活动ID不能为空");
        }
        GroupActivity activity = groupActivityMapper.selectById(id);
        if (activity == null) {
            throw new BusinessException("活动不存在");
        }
        if (activity.getStatus() == ACTIVITY_STATUS_ONGOING) {
            throw new BusinessException("进行中的活动不能删除");
        }

        LambdaQueryWrapper<GroupActivitySku> skuWrapper = new LambdaQueryWrapper<>();
        skuWrapper.eq(GroupActivitySku::getActivityId, id);
        groupActivitySkuMapper.delete(skuWrapper);

        groupActivityMapper.deleteById(id);
        deleteActivityCache(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        if (id == null) {
            throw new BusinessException("活动ID不能为空");
        }
        if (status == null) {
            throw new BusinessException("状态不能为空");
        }
        GroupActivity activity = groupActivityMapper.selectById(id);
        if (activity == null) {
            throw new BusinessException("活动不存在");
        }

        if (status == ACTIVITY_STATUS_CANCELLED && activity.getStatus() == ACTIVITY_STATUS_ONGOING) {
            throw new BusinessException("进行中的活动不能取消");
        }

        activity.setStatus(status);
        groupActivityMapper.updateById(activity);

        if (status == ACTIVITY_STATUS_PUBLISHED) {
            cacheHotActivity(id);
        } else {
            deleteActivityCache(id);
        }
    }

    @Override
    public GroupActivityVO getDetail(Long id) {
        if (id == null) {
            throw new BusinessException("活动ID不能为空");
        }

        String cacheKey = HOT_ACTIVITY_KEY + id;
        Object cachedObj = redisTemplate.opsForValue().get(cacheKey);
        if (cachedObj != null) {
            return (GroupActivityVO) cachedObj;
        }

        GroupActivity activity = groupActivityMapper.selectById(id);
        if (activity == null) {
            throw new BusinessException("活动不存在");
        }

        GroupActivityVO vo = convertToVO(activity);
        vo.setSkuList(getActivitySkuList(id));

        if (activity.getStatus() == ACTIVITY_STATUS_PUBLISHED || activity.getStatus() == ACTIVITY_STATUS_ONGOING) {
            redisTemplate.opsForValue().set(cacheKey, vo, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
        }

        return vo;
    }

    @Override
    public List<GroupActivitySkuVO> getActivitySkuList(Long activityId) {
        if (activityId == null) {
            throw new BusinessException("活动ID不能为空");
        }

        LambdaQueryWrapper<GroupActivitySku> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GroupActivitySku::getActivityId, activityId);
        wrapper.orderByAsc(GroupActivitySku::getSort);
        List<GroupActivitySku> skuList = groupActivitySkuMapper.selectList(wrapper);

        return skuList.stream()
                .map(this::convertToSkuVO)
                .collect(Collectors.toList());
    }

    @Override
    public void validateActivityStock(Long activityId) {
        List<GroupActivitySku> skuList = getActivitySkuEntityList(activityId);
        for (GroupActivitySku sku : skuList) {
            ProductBatch batch = productBatchMapper.selectById(sku.getProductBatchId());
            if (batch == null) {
                throw new BusinessException("商品批次不存在");
            }
            if (batch.getStockQuantity().compareTo(sku.getActivityStock()) < 0) {
                Product product = productMapper.selectById(sku.getProductId());
                String productName = product != null ? product.getProductName() : "未知商品";
                throw new BusinessException("商品库存不足：" + productName);
            }
        }
    }

    @Override
    public void validateCutOffTime(Long activityId) {
        GroupActivity activity = groupActivityMapper.selectById(activityId);
        if (activity == null) {
            throw new BusinessException("活动不存在");
        }
        if (activity.getCutOffTime() != null && LocalDateTime.now().isAfter(activity.getCutOffTime())) {
            throw new BusinessException("活动已截单，无法下单");
        }
        if (activity.getStatus() != ACTIVITY_STATUS_PUBLISHED && activity.getStatus() != ACTIVITY_STATUS_ONGOING) {
            throw new BusinessException("活动未开始或已结束");
        }
    }

    private void validateActivitySku(ActivitySkuSaveDTO skuDTO) {
        Product product = productMapper.selectById(skuDTO.getProductId());
        if (product == null) {
            throw new BusinessException("商品不存在");
        }

        ProductBatch batch = productBatchMapper.selectById(skuDTO.getProductBatchId());
        if (batch == null) {
            throw new BusinessException("商品批次不存在");
        }

        if (!batch.getProductId().equals(skuDTO.getProductId())) {
            throw new BusinessException("批次不属于该商品");
        }

        if (batch.getStockQuantity().compareTo(skuDTO.getActivityStock()) < 0) {
            throw new BusinessException("批次库存不足：" + product.getProductName());
        }
    }

    private List<GroupActivitySku> getActivitySkuEntityList(Long activityId) {
        LambdaQueryWrapper<GroupActivitySku> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(GroupActivitySku::getActivityId, activityId);
        return groupActivitySkuMapper.selectList(wrapper);
    }

    private void cacheHotActivity(Long activityId) {
        String cacheKey = HOT_ACTIVITY_KEY + activityId;
        GroupActivity activity = groupActivityMapper.selectById(activityId);
        if (activity != null) {
            GroupActivityVO vo = convertToVO(activity);
            vo.setSkuList(getActivitySkuList(activityId));
            redisTemplate.opsForValue().set(cacheKey, vo, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
        }

        List<GroupActivitySku> skuList = getActivitySkuEntityList(activityId);
        for (GroupActivitySku sku : skuList) {
            String stockKey = ACTIVITY_STOCK_KEY + sku.getId();
            BigDecimal availableStock = sku.getActivityStock().subtract(sku.getSoldStock()).subtract(sku.getLockStock());
            redisTemplate.opsForValue().set(stockKey, availableStock, CACHE_EXPIRE_HOURS, TimeUnit.HOURS);
        }
    }

    private void deleteActivityCache(Long activityId) {
        String cacheKey = HOT_ACTIVITY_KEY + activityId;
        redisTemplate.delete(cacheKey);

        List<GroupActivitySku> skuList = getActivitySkuEntityList(activityId);
        for (GroupActivitySku sku : skuList) {
            String stockKey = ACTIVITY_STOCK_KEY + sku.getId();
            redisTemplate.delete(stockKey);
        }
    }

    private GroupActivityVO convertToVO(GroupActivity activity) {
        GroupActivityVO vo = new GroupActivityVO();
        BeanUtils.copyProperties(activity, vo);
        vo.setStatusName(getStatusName(activity.getStatus()));
        return vo;
    }

    private String getStatusName(Integer status) {
        switch (status) {
            case ACTIVITY_STATUS_DRAFT:
                return "草稿";
            case ACTIVITY_STATUS_PUBLISHED:
                return "已发布";
            case ACTIVITY_STATUS_ONGOING:
                return "进行中";
            case ACTIVITY_STATUS_ENDED:
                return "已结束";
            case ACTIVITY_STATUS_CANCELLED:
                return "已取消";
            default:
                return "未知";
        }
    }

    private GroupActivitySkuVO convertToSkuVO(GroupActivitySku sku) {
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
