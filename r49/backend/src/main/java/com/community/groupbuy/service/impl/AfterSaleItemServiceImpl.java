package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.community.groupbuy.entity.AfterSaleItem;
import com.community.groupbuy.mapper.AfterSaleItemMapper;
import com.community.groupbuy.service.AfterSaleItemService;
import com.community.groupbuy.vo.AfterSaleItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AfterSaleItemServiceImpl implements AfterSaleItemService {

    private final AfterSaleItemMapper afterSaleItemMapper;

    @Override
    public List<AfterSaleItemVO> getItemsByAfterSaleId(Long afterSaleId) {
        LambdaQueryWrapper<AfterSaleItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AfterSaleItem::getAfterSaleId, afterSaleId);
        wrapper.orderByAsc(AfterSaleItem::getId);
        List<AfterSaleItem> items = afterSaleItemMapper.selectList(wrapper);
        return items.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    private AfterSaleItemVO convertToVO(AfterSaleItem item) {
        AfterSaleItemVO vo = new AfterSaleItemVO();
        vo.setId(item.getId());
        vo.setAfterSaleId(item.getAfterSaleId());
        vo.setOrderItemId(item.getOrderItemId());
        vo.setProductId(item.getProductId());
        vo.setProductName(item.getProductName());
        vo.setSpec(item.getSpec());
        vo.setQuantity(item.getQuantity());
        vo.setRefundAmount(item.getRefundAmount());
        vo.setRefundStatus(item.getRefundStatus());
        vo.setRefundStatusName(getRefundStatusName(item.getRefundStatus()));
        vo.setCreateTime(item.getCreateTime());
        vo.setUpdateTime(item.getUpdateTime());
        return vo;
    }

    private String getRefundStatusName(Integer status) {
        if (status == null) return "";
        switch (status) {
            case 0: return "未退款";
            case 1: return "退款中";
            case 2: return "已退款";
            default: return "未知";
        }
    }
}
