package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.community.groupbuy.dto.SortItemSaveDTO;
import com.community.groupbuy.entity.WarehouseSort;
import com.community.groupbuy.entity.WarehouseSortItem;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.WarehouseSortItemMapper;
import com.community.groupbuy.mapper.WarehouseSortMapper;
import com.community.groupbuy.service.WarehouseSortItemService;
import com.community.groupbuy.vo.WarehouseSortItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseSortItemServiceImpl implements WarehouseSortItemService {

    private final WarehouseSortItemMapper warehouseSortItemMapper;
    private final WarehouseSortMapper warehouseSortMapper;

    private static final int SORT_STATUS_SORTING = 2;

    @Override
    public List<WarehouseSortItemVO> getItemsBySortId(Long sortId) {
        LambdaQueryWrapper<WarehouseSortItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WarehouseSortItem::getSortId, sortId);
        wrapper.orderByAsc(WarehouseSortItem::getId);
        List<WarehouseSortItem> items = warehouseSortItemMapper.selectList(wrapper);
        return items.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveSortResult(List<SortItemSaveDTO> items) {
        if (CollectionUtils.isEmpty(items)) {
            throw new BusinessException("分拣明细不能为空");
        }

        Long sortId = items.get(0).getId() != null ?
                getSortIdFromItemId(items.get(0).getId()) : null;

        if (sortId != null) {
            WarehouseSort sort = warehouseSortMapper.selectById(sortId);
            if (sort == null) {
                throw new BusinessException("分拣单不存在");
            }
            if (sort.getSortStatus() != SORT_STATUS_SORTING) {
                throw new BusinessException("仅分拣中状态可保存分拣结果");
            }
        }

        for (SortItemSaveDTO itemDTO : items) {
            if (itemDTO.getId() == null) {
                continue;
            }

            WarehouseSortItem item = warehouseSortItemMapper.selectById(itemDTO.getId());
            if (item == null) {
                continue;
            }

            Integer actualQuantity = itemDTO.getActualQuantity() != null ? itemDTO.getActualQuantity() : 0;
            Integer plannedQuantity = item.getPlannedQuantity() != null ? item.getPlannedQuantity() : 0;
            Integer differenceQuantity = actualQuantity - plannedQuantity;

            item.setActualQuantity(actualQuantity);
            item.setDifferenceQuantity(differenceQuantity);
            item.setDifferenceReason(itemDTO.getDifferenceReason());
            warehouseSortItemMapper.updateById(item);
        }
    }

    private Long getSortIdFromItemId(Long itemId) {
        WarehouseSortItem item = warehouseSortItemMapper.selectById(itemId);
        return item != null ? item.getSortId() : null;
    }

    private WarehouseSortItemVO convertToVO(WarehouseSortItem item) {
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
}
