package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.community.groupbuy.entity.ReceiptItem;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.LeaderReceiptMapper;
import com.community.groupbuy.mapper.ReceiptItemMapper;
import com.community.groupbuy.service.ReceiptItemService;
import com.community.groupbuy.vo.ReceiptItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReceiptItemServiceImpl implements ReceiptItemService {

    private final ReceiptItemMapper receiptItemMapper;
    private final LeaderReceiptMapper leaderReceiptMapper;

    @Override
    public List<ReceiptItemVO> getByReceiptId(Long receiptId) {
        if (receiptId == null) {
            throw new BusinessException("签收单ID不能为空");
        }
        LambdaQueryWrapper<ReceiptItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReceiptItem::getReceiptId, receiptId);
        List<ReceiptItem> items = receiptItemMapper.selectList(wrapper);
        return items.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveActualQuantity(Long receiptId, List<ReceiptItem> items) {
        if (receiptId == null) {
            throw new BusinessException("签收单ID不能为空");
        }
        if (leaderReceiptMapper.selectById(receiptId) == null) {
            throw new BusinessException("签收单不存在");
        }
        if (items == null || items.isEmpty()) {
            throw new BusinessException("签收明细不能为空");
        }

        for (ReceiptItem item : items) {
            if (item.getId() == null) {
                throw new BusinessException("明细ID不能为空");
            }
            ReceiptItem existingItem = receiptItemMapper.selectById(item.getId());
            if (existingItem == null) {
                throw new BusinessException("签收明细不存在");
            }
            if (!existingItem.getReceiptId().equals(receiptId)) {
                throw new BusinessException("明细不属于当前签收单");
            }

            if (item.getActualQuantity() == null || item.getActualQuantity() < 0) {
                throw new BusinessException("实际数量不能为空且不能为负数");
            }

            int difference = existingItem.getPlannedQuantity() - item.getActualQuantity();
            if (difference < 0) {
                difference = Math.abs(difference);
            }

            if (difference > 0 && !StringUtils.hasText(item.getDifferenceReason())) {
                throw new BusinessException("商品[" + existingItem.getProductName() + "]有差异必须填写原因");
            }

            existingItem.setActualQuantity(item.getActualQuantity());
            existingItem.setDifferenceQuantity(difference);
            existingItem.setDifferenceReason(item.getDifferenceReason());
            receiptItemMapper.updateById(existingItem);
        }
    }

    private ReceiptItemVO convertToVO(ReceiptItem item) {
        ReceiptItemVO vo = new ReceiptItemVO();
        BeanUtils.copyProperties(item, vo);
        return vo;
    }
}
