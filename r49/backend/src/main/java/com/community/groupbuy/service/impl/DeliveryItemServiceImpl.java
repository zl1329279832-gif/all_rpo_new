package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.community.groupbuy.entity.DeliveryItem;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.DeliveryItemMapper;
import com.community.groupbuy.mapper.DeliveryOrderMapper;
import com.community.groupbuy.service.DeliveryItemService;
import com.community.groupbuy.vo.DeliveryItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryItemServiceImpl implements DeliveryItemService {

    private final DeliveryItemMapper deliveryItemMapper;
    private final DeliveryOrderMapper deliveryOrderMapper;

    @Override
    public List<DeliveryItemVO> getByDeliveryId(Long deliveryId) {
        if (deliveryId == null) {
            throw new BusinessException("配送单ID不能为空");
        }
        LambdaQueryWrapper<DeliveryItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DeliveryItem::getDeliveryId, deliveryId);
        List<DeliveryItem> items = deliveryItemMapper.selectList(wrapper);
        return items.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveActualQuantity(Long deliveryId, List<DeliveryItem> items) {
        if (deliveryId == null) {
            throw new BusinessException("配送单ID不能为空");
        }
        if (deliveryOrderMapper.selectById(deliveryId) == null) {
            throw new BusinessException("配送单不存在");
        }
        if (items == null || items.isEmpty()) {
            throw new BusinessException("配送明细不能为空");
        }

        for (DeliveryItem item : items) {
            if (item.getId() == null) {
                throw new BusinessException("明细ID不能为空");
            }
            DeliveryItem existingItem = deliveryItemMapper.selectById(item.getId());
            if (existingItem == null) {
                throw new BusinessException("配送明细不存在");
            }
            if (!existingItem.getDeliveryId().equals(deliveryId)) {
                throw new BusinessException("明细不属于当前配送单");
            }

            if (item.getActualQuantity() == null || item.getActualQuantity() < 0) {
                throw new BusinessException("实际数量不能为空且不能为负数");
            }

            int shortage = existingItem.getPlannedQuantity() - item.getActualQuantity();
            if (shortage < 0) {
                shortage = 0;
            }

            if (shortage > 0 && !StringUtils.hasText(item.getShortageReason())) {
                throw new BusinessException("商品[" + existingItem.getProductName() + "]缺货必须填写原因");
            }

            existingItem.setActualQuantity(item.getActualQuantity());
            existingItem.setShortageQuantity(shortage);
            existingItem.setShortageReason(item.getShortageReason());
            deliveryItemMapper.updateById(existingItem);
        }
    }

    private DeliveryItemVO convertToVO(DeliveryItem item) {
        DeliveryItemVO vo = new DeliveryItemVO();
        BeanUtils.copyProperties(item, vo);
        return vo;
    }
}
