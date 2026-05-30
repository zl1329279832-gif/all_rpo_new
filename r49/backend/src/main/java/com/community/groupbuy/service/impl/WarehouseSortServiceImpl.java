package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.SortCreateDTO;
import com.community.groupbuy.dto.SortItemSaveDTO;
import com.community.groupbuy.dto.SortQueryDTO;
import com.community.groupbuy.entity.GroupActivity;
import com.community.groupbuy.entity.WarehouseSort;
import com.community.groupbuy.entity.WarehouseSortItem;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.GroupActivityMapper;
import com.community.groupbuy.mapper.WarehouseSortItemMapper;
import com.community.groupbuy.mapper.WarehouseSortMapper;
import com.community.groupbuy.service.WarehouseSortService;
import com.community.groupbuy.vo.WarehouseSortItemVO;
import com.community.groupbuy.vo.WarehouseSortVO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseSortServiceImpl implements WarehouseSortService {

    private final WarehouseSortMapper warehouseSortMapper;
    private final WarehouseSortItemMapper warehouseSortItemMapper;
    private final GroupActivityMapper groupActivityMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String SORT_NO_PREFIX = "SORT";
    private static final int SORT_STATUS_PENDING_PRINT = 0;
    private static final int SORT_STATUS_PENDING_SORT = 1;
    private static final int SORT_STATUS_SORTING = 2;
    private static final int SORT_STATUS_COMPLETED = 3;
    private static final int SORT_STATUS_CANCELLED = 4;

    @Override
    public PageResult<WarehouseSortVO> page(SortQueryDTO queryDTO, Long current, Long size) {
        Page<WarehouseSort> page = new Page<>(current, size);
        LambdaQueryWrapper<WarehouseSort> wrapper = buildQueryWrapper(queryDTO);
        Page<WarehouseSort> sortPage = warehouseSortMapper.selectPage(page, wrapper);
        List<WarehouseSortVO> voList = sortPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        return PageResult.of(voList, sortPage.getTotal(), sortPage.getCurrent(), sortPage.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createSort(SortCreateDTO createDTO, Long operatorId) {
        LambdaQueryWrapper<WarehouseSort> checkWrapper = new LambdaQueryWrapper<>();
        checkWrapper.eq(WarehouseSort::getActivityId, createDTO.getActivityId())
                .ne(WarehouseSort::getSortStatus, SORT_STATUS_CANCELLED);
        Long count = warehouseSortMapper.selectCount(checkWrapper);
        if (count != null && count > 0) {
            throw new BusinessException("该活动已创建分拣单，请勿重复创建");
        }

        GroupActivity activity = groupActivityMapper.selectById(createDTO.getActivityId());
        if (activity == null) {
            throw new BusinessException("活动不存在");
        }
        if (activity.getStatus() != 1) {
            throw new BusinessException("活动状态不正确");
        }

        String sortNo = generateSortNo();

        int totalQuantity = 0;
        int totalSkuCount = createDTO.getItems().size();
        List<WarehouseSortItem> sortItems = new ArrayList<>();

        for (SortItemSaveDTO itemDTO : createDTO.getItems()) {
            WarehouseSortItem sortItem = new WarehouseSortItem();
            sortItem.setActivitySkuId(itemDTO.getActivitySkuId());
            sortItem.setProductId(itemDTO.getProductId());
            sortItem.setProductName(itemDTO.getProductName());
            sortItem.setSpec(itemDTO.getSpec());
            sortItem.setPlannedQuantity(itemDTO.getPlannedQuantity());
            sortItem.setActualQuantity(itemDTO.getActualQuantity() != null ? itemDTO.getActualQuantity() : 0);
            sortItem.setDifferenceQuantity(itemDTO.getDifferenceQuantity() != null ? itemDTO.getDifferenceQuantity() : 0);
            sortItem.setDifferenceReason(itemDTO.getDifferenceReason());
            sortItems.add(sortItem);

            totalQuantity += itemDTO.getPlannedQuantity();
        }

        WarehouseSort sort = new WarehouseSort();
        sort.setSortNo(sortNo);
        sort.setActivityId(createDTO.getActivityId());
        sort.setWarehouseId(createDTO.getWarehouseId());
        sort.setOperatorId(operatorId);
        sort.setSortStatus(SORT_STATUS_PENDING_PRINT);
        sort.setTotalQuantity(totalQuantity);
        sort.setTotalSkuCount(totalSkuCount);
        warehouseSortMapper.insert(sort);

        for (WarehouseSortItem sortItem : sortItems) {
            sortItem.setSortId(sort.getId());
            warehouseSortItemMapper.insert(sortItem);
        }

        return sort.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void printSort(Long id) {
        WarehouseSort sort = warehouseSortMapper.selectById(id);
        if (sort == null) {
            throw new BusinessException("分拣单不存在");
        }
        if (sort.getSortStatus() != SORT_STATUS_PENDING_PRINT) {
            throw new BusinessException("仅待打印状态的分拣单可打印");
        }

        sort.setSortStatus(SORT_STATUS_PENDING_SORT);
        sort.setPrintTime(LocalDateTime.now());
        warehouseSortMapper.updateById(sort);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void startSort(Long id) {
        WarehouseSort sort = warehouseSortMapper.selectById(id);
        if (sort == null) {
            throw new BusinessException("分拣单不存在");
        }
        if (sort.getSortStatus() != SORT_STATUS_PENDING_SORT) {
            throw new BusinessException("仅待分拣状态的分拣单可开始分拣");
        }

        sort.setSortStatus(SORT_STATUS_SORTING);
        sort.setSortTime(LocalDateTime.now());
        warehouseSortMapper.updateById(sort);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void finishSort(Long id) {
        WarehouseSort sort = warehouseSortMapper.selectById(id);
        if (sort == null) {
            throw new BusinessException("分拣单不存在");
        }
        if (sort.getSortStatus() != SORT_STATUS_SORTING) {
            throw new BusinessException("仅分拣中状态的分拣单可完成");
        }

        LambdaQueryWrapper<WarehouseSortItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(WarehouseSortItem::getSortId, id);
        List<WarehouseSortItem> items = warehouseSortItemMapper.selectList(itemWrapper);

        for (WarehouseSortItem item : items) {
            if (item.getActualQuantity() == null || item.getActualQuantity() <= 0) {
                throw new BusinessException("商品【" + item.getProductName() + "】未填写实际分拣数量");
            }
        }

        sort.setSortStatus(SORT_STATUS_COMPLETED);
        warehouseSortMapper.updateById(sort);
    }

    @Override
    public WarehouseSortVO getSortDetail(Long id) {
        WarehouseSort sort = warehouseSortMapper.selectById(id);
        if (sort == null) {
            throw new BusinessException("分拣单不存在");
        }
        WarehouseSortVO vo = convertToVO(sort);

        LambdaQueryWrapper<WarehouseSortItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(WarehouseSortItem::getSortId, id);
        List<WarehouseSortItem> items = warehouseSortItemMapper.selectList(itemWrapper);
        List<WarehouseSortItemVO> itemVOList = items.stream()
                .map(this::convertToItemVO)
                .collect(Collectors.toList());
        vo.setItems(itemVOList);

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (id == null) {
            throw new BusinessException("分拣单ID不能为空");
        }
        WarehouseSort sort = warehouseSortMapper.selectById(id);
        if (sort == null) {
            throw new BusinessException("分拣单不存在");
        }
        if (sort.getSortStatus() == SORT_STATUS_SORTING || sort.getSortStatus() == SORT_STATUS_COMPLETED) {
            throw new BusinessException("分拣中或已完成的分拣单不可删除");
        }
        warehouseSortMapper.deleteById(id);

        LambdaQueryWrapper<WarehouseSortItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(WarehouseSortItem::getSortId, id);
        warehouseSortItemMapper.delete(itemWrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteBatch(List<Long> ids) {
        if (CollectionUtils.isEmpty(ids)) {
            throw new BusinessException("分拣单ID不能为空");
        }
        for (Long id : ids) {
            delete(id);
        }
    }

    private String generateSortNo() {
        String script = "local date = KEYS[1]\n" +
                "local key = 'sort:no:' .. date\n" +
                "local current = redis.call('incr', key)\n" +
                "if current == 1 then\n" +
                "    redis.call('expire', key, 86400)\n" +
                "end\n" +
                "return current";
        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>();
        redisScript.setScriptText(script);
        redisScript.setResultType(Long.class);

        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Long sequence = redisTemplate.execute(redisScript, Collections.singletonList(date), date);
        if (sequence == null) {
            sequence = System.currentTimeMillis() % 1000000;
        }
        return SORT_NO_PREFIX + date + String.format("%06d", sequence);
    }

    private LambdaQueryWrapper<WarehouseSort> buildQueryWrapper(SortQueryDTO queryDTO) {
        LambdaQueryWrapper<WarehouseSort> wrapper = new LambdaQueryWrapper<>();
        if (queryDTO.getActivityId() != null) {
            wrapper.eq(WarehouseSort::getActivityId, queryDTO.getActivityId());
        }
        if (queryDTO.getWarehouseId() != null) {
            wrapper.eq(WarehouseSort::getWarehouseId, queryDTO.getWarehouseId());
        }
        if (queryDTO.getSortStatus() != null) {
            wrapper.eq(WarehouseSort::getSortStatus, queryDTO.getSortStatus());
        }
        if (StringUtils.hasText(queryDTO.getSortNo())) {
            wrapper.like(WarehouseSort::getSortNo, queryDTO.getSortNo());
        }
        if (queryDTO.getStartTime() != null) {
            wrapper.ge(WarehouseSort::getCreateTime, queryDTO.getStartTime());
        }
        if (queryDTO.getEndTime() != null) {
            wrapper.le(WarehouseSort::getCreateTime, queryDTO.getEndTime());
        }
        wrapper.orderByDesc(WarehouseSort::getCreateTime);
        return wrapper;
    }

    private WarehouseSortVO convertToVO(WarehouseSort sort) {
        WarehouseSortVO vo = new WarehouseSortVO();
        vo.setId(sort.getId());
        vo.setSortNo(sort.getSortNo());
        vo.setActivityId(sort.getActivityId());
        vo.setWarehouseId(sort.getWarehouseId());
        vo.setOperatorId(sort.getOperatorId());
        vo.setSortStatus(sort.getSortStatus());
        vo.setSortStatusText(getSortStatusText(sort.getSortStatus()));
        vo.setPrintTime(sort.getPrintTime());
        vo.setSortTime(sort.getSortTime());
        vo.setTotalQuantity(sort.getTotalQuantity());
        vo.setTotalSkuCount(sort.getTotalSkuCount());
        vo.setCreateTime(sort.getCreateTime());
        return vo;
    }

    private WarehouseSortItemVO convertToItemVO(WarehouseSortItem item) {
        WarehouseSortItemVO vo = new WarehouseSortItemVO();
        vo.setId(item.getId());
        vo.setSortId(item.getSortId());
        vo.setActivitySkuId(item.getActivitySkuId());
        vo.setProductId(item.getProductId());
        vo.setProductName(item.getProductName());
        vo.setSpec(item.getSpec());
        vo.setPlannedQuantity(item.getPlannedQuantity());
        vo.setActualQuantity(item.getActualQuantity());
        vo.setDifferenceQuantity(item.getDifferenceQuantity());
        vo.setDifferenceReason(item.getDifferenceReason());
        return vo;
    }

    private String getSortStatusText(Integer status) {
        if (status == null) return "";
        switch (status) {
            case SORT_STATUS_PENDING_PRINT: return "待打印";
            case SORT_STATUS_PENDING_SORT: return "待分拣";
            case SORT_STATUS_SORTING: return "分拣中";
            case SORT_STATUS_COMPLETED: return "已完成";
            case SORT_STATUS_CANCELLED: return "已取消";
            default: return "未知";
        }
    }
}
