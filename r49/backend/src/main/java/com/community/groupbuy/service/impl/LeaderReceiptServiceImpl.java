package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.ReceiptQueryDTO;
import com.community.groupbuy.dto.ReceiptSaveDTO;
import com.community.groupbuy.entity.DeliveryItem;
import com.community.groupbuy.entity.DeliveryOrder;
import com.community.groupbuy.entity.LeaderReceipt;
import com.community.groupbuy.entity.ReceiptItem;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.DeliveryItemMapper;
import com.community.groupbuy.mapper.DeliveryOrderMapper;
import com.community.groupbuy.mapper.LeaderReceiptMapper;
import com.community.groupbuy.mapper.ReceiptItemMapper;
import com.community.groupbuy.service.LeaderReceiptService;
import com.community.groupbuy.vo.LeaderReceiptVO;
import com.community.groupbuy.vo.ReceiptItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderReceiptServiceImpl implements LeaderReceiptService {

    private final LeaderReceiptMapper leaderReceiptMapper;
    private final ReceiptItemMapper receiptItemMapper;
    private final DeliveryOrderMapper deliveryOrderMapper;

    @Override
    public PageResult<LeaderReceiptVO> page(ReceiptQueryDTO queryDTO) {
        LambdaQueryWrapper<LeaderReceipt> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(queryDTO.getReceiptNo())) {
            wrapper.like(LeaderReceipt::getReceiptNo, queryDTO.getReceiptNo());
        }
        if (queryDTO.getLeaderId() != null) {
            wrapper.eq(LeaderReceipt::getLeaderId, queryDTO.getLeaderId());
        }
        if (queryDTO.getDeliveryId() != null) {
            wrapper.eq(LeaderReceipt::getDeliveryId, queryDTO.getDeliveryId());
        }
        if (queryDTO.getActivityId() != null) {
            wrapper.eq(LeaderReceipt::getActivityId, queryDTO.getActivityId());
        }
        if (queryDTO.getReceiptStatus() != null) {
            wrapper.eq(LeaderReceipt::getReceiptStatus, queryDTO.getReceiptStatus());
        }
        if (queryDTO.getStartTime() != null) {
            wrapper.ge(LeaderReceipt::getCreateTime, queryDTO.getStartTime());
        }
        if (queryDTO.getEndTime() != null) {
            wrapper.le(LeaderReceipt::getCreateTime, queryDTO.getEndTime());
        }
        wrapper.orderByDesc(LeaderReceipt::getCreateTime);

        Page<LeaderReceipt> page = leaderReceiptMapper.selectPage(
                new Page<>(queryDTO.getPageNum(), queryDTO.getPageSize()), wrapper);
        List<LeaderReceiptVO> voList = page.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(voList, page.getTotal(), queryDTO.getPageNum().longValue(), queryDTO.getPageSize().longValue());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createReceipt(ReceiptSaveDTO dto) {
        DeliveryOrder deliveryOrder = deliveryOrderMapper.selectById(dto.getDeliveryId());
        if (deliveryOrder == null) {
            throw new BusinessException("配送单不存在");
        }
        if (deliveryOrder.getDeliveryStatus() != 3) {
            throw new BusinessException("配送未完成，无法创建签收单");
        }

        LambdaQueryWrapper<LeaderReceipt> receiptWrapper = new LambdaQueryWrapper<>();
        receiptWrapper.eq(LeaderReceipt::getDeliveryId, dto.getDeliveryId())
                .eq(LeaderReceipt::getLeaderId, dto.getLeaderId());
        if (leaderReceiptMapper.selectCount(receiptWrapper) > 0) {
            throw new BusinessException("该配送单已创建签收单");
        }

        LeaderReceipt receipt = new LeaderReceipt();
        BeanUtils.copyProperties(dto, receipt);
        receipt.setReceiptStatus(0);
        leaderReceiptMapper.insert(receipt);

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (ReceiptSaveDTO.ReceiptItemDTO itemDTO : dto.getItems()) {
                ReceiptItem item = new ReceiptItem();
                BeanUtils.copyProperties(itemDTO, item);
                item.setReceiptId(receipt.getId());
                item.setActualQuantity(itemDTO.getPlannedQuantity());
                item.setDifferenceQuantity(0);
                receiptItemMapper.insert(item);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void receipt(ReceiptSaveDTO dto) {
        if (dto.getId() == null) {
            throw new BusinessException("签收单ID不能为空");
        }
        LeaderReceipt receipt = leaderReceiptMapper.selectById(dto.getId());
        if (receipt == null) {
            throw new BusinessException("签收单不存在");
        }
        if (receipt.getReceiptStatus() != 0) {
            throw new BusinessException("只有待签收状态才能签收");
        }

        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new BusinessException("签收明细不能为空");
        }

        int totalDifference = 0;
        boolean hasDifference = false;

        for (ReceiptSaveDTO.ReceiptItemDTO itemDTO : dto.getItems()) {
            if (itemDTO.getId() == null) {
                throw new BusinessException("明细ID不能为空");
            }
            ReceiptItem existingItem = receiptItemMapper.selectById(itemDTO.getId());
            if (existingItem == null) {
                throw new BusinessException("签收明细不存在");
            }
            if (!existingItem.getReceiptId().equals(receipt.getId())) {
                throw new BusinessException("明细不属于当前签收单");
            }

            if (itemDTO.getActualQuantity() == null || itemDTO.getActualQuantity() < 0) {
                throw new BusinessException("实际数量不能为空且不能为负数");
            }

            int difference = existingItem.getPlannedQuantity() - itemDTO.getActualQuantity();
            if (difference < 0) {
                difference = Math.abs(difference);
            }

            if (difference > 0) {
                hasDifference = true;
                if (!StringUtils.hasText(itemDTO.getDifferenceReason())) {
                    throw new BusinessException("商品[" + existingItem.getProductName() + "]有差异必须填写原因");
                }
                totalDifference += difference;
            }

            existingItem.setActualQuantity(itemDTO.getActualQuantity());
            existingItem.setDifferenceQuantity(difference);
            existingItem.setDifferenceReason(itemDTO.getDifferenceReason());
            receiptItemMapper.updateById(existingItem);
        }

        receipt.setReceiptStatus(hasDifference ? 2 : 1);
        receipt.setReceiptTime(LocalDateTime.now());
        receipt.setDifferenceQuantity(totalDifference);
        receipt.setDifferenceRemark(dto.getDifferenceRemark());
        leaderReceiptMapper.updateById(receipt);
    }

    @Override
    public LeaderReceiptVO getDetail(Long id) {
        if (id == null) {
            throw new BusinessException("签收单ID不能为空");
        }
        LeaderReceipt receipt = leaderReceiptMapper.selectById(id);
        if (receipt == null) {
            throw new BusinessException("签收单不存在");
        }
        LeaderReceiptVO vo = convertToVO(receipt);

        LambdaQueryWrapper<ReceiptItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(ReceiptItem::getReceiptId, id);
        List<ReceiptItem> items = receiptItemMapper.selectList(itemWrapper);
        List<ReceiptItemVO> itemVOList = items.stream()
                .map(this::convertToItemVO)
                .collect(Collectors.toList());
        vo.setItems(itemVOList);

        return vo;
    }

    private LeaderReceiptVO convertToVO(LeaderReceipt receipt) {
        LeaderReceiptVO vo = new LeaderReceiptVO();
        BeanUtils.copyProperties(receipt, vo);
        vo.setReceiptStatusName(getStatusName(receipt.getReceiptStatus()));
        return vo;
    }

    private String getStatusName(Integer status) {
        if (status == null) {
            return "";
        }
        switch (status) {
            case 0:
                return "待签收";
            case 1:
                return "已签收";
            case 2:
                return "有差异";
            default:
                return "";
        }
    }

    private ReceiptItemVO convertToItemVO(ReceiptItem item) {
        ReceiptItemVO vo = new ReceiptItemVO();
        BeanUtils.copyProperties(item, vo);
        return vo;
    }
}
