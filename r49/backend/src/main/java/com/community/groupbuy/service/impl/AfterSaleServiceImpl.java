package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.AfterSaleApplyDTO;
import com.community.groupbuy.dto.AfterSaleAuditDTO;
import com.community.groupbuy.dto.AfterSaleQueryDTO;
import com.community.groupbuy.entity.AfterSale;
import com.community.groupbuy.entity.AfterSaleItem;
import com.community.groupbuy.entity.Commission;
import com.community.groupbuy.entity.GroupActivity;
import com.community.groupbuy.entity.GroupActivitySku;
import com.community.groupbuy.entity.OrderItem;
import com.community.groupbuy.entity.SysUser;
import com.community.groupbuy.entity.UserOrder;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.AfterSaleItemMapper;
import com.community.groupbuy.mapper.AfterSaleMapper;
import com.community.groupbuy.mapper.CommissionMapper;
import com.community.groupbuy.mapper.GroupActivityMapper;
import com.community.groupbuy.mapper.GroupActivitySkuMapper;
import com.community.groupbuy.mapper.OrderItemMapper;
import com.community.groupbuy.mapper.SysUserMapper;
import com.community.groupbuy.mapper.UserOrderMapper;
import com.community.groupbuy.service.AfterSaleItemService;
import com.community.groupbuy.service.AfterSaleService;
import com.community.groupbuy.vo.AfterSaleItemVO;
import com.community.groupbuy.vo.AfterSaleVO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AfterSaleServiceImpl implements AfterSaleService {

    private final AfterSaleMapper afterSaleMapper;
    private final AfterSaleItemMapper afterSaleItemMapper;
    private final AfterSaleItemService afterSaleItemService;
    private final UserOrderMapper userOrderMapper;
    private final OrderItemMapper orderItemMapper;
    private final CommissionMapper commissionMapper;
    private final GroupActivityMapper groupActivityMapper;
    private final GroupActivitySkuMapper groupActivitySkuMapper;
    private final SysUserMapper sysUserMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String AFTER_SALE_SUBMIT_LOCK_KEY = "aftersale:submit:lock:";
    private static final String AFTER_SALE_NO_PREFIX = "AS";

    private static final int AFTER_SALE_TYPE_REFUND = 1;
    private static final int AFTER_SALE_TYPE_RETURN_REFUND = 2;

    private static final int AFTER_SALE_STATUS_PENDING = 0;
    private static final int AFTER_SALE_STATUS_APPROVED = 1;
    private static final int AFTER_SALE_STATUS_REJECTED = 2;
    private static final int AFTER_SALE_STATUS_COMPLETED = 3;
    private static final int AFTER_SALE_STATUS_CANCELLED = 4;

    @Override
    public PageResult<AfterSaleVO> page(AfterSaleQueryDTO queryDTO, Long current, Long size) {
        Page<AfterSale> page = new Page<>(current, size);
        LambdaQueryWrapper<AfterSale> wrapper = buildQueryWrapper(queryDTO);
        Page<AfterSale> afterSalePage = afterSaleMapper.selectPage(page, wrapper);
        List<AfterSaleVO> voList = afterSalePage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        return PageResult.of(voList, afterSalePage.getTotal(), afterSalePage.getCurrent(), afterSalePage.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long applyAfterSale(AfterSaleApplyDTO applyDTO) {
        String lockKey = AFTER_SALE_SUBMIT_LOCK_KEY + applyDTO.getOrderId();
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 5, TimeUnit.SECONDS);
        if (locked == null || !locked) {
            throw new BusinessException("请勿重复提交售后申请");
        }

        try {
            UserOrder order = userOrderMapper.selectById(applyDTO.getOrderId());
            if (order == null) {
                throw new BusinessException("订单不存在");
            }
            if (order.getOrderStatus() != 1 && order.getOrderStatus() != 3) {
                throw new BusinessException("仅已支付或已完成的订单可申请售后");
            }

            List<Long> orderItemIds = applyDTO.getItems().stream()
                    .map(AfterSaleApplyDTO.AfterSaleItemDTO::getOrderItemId)
                    .collect(Collectors.toList());

            checkDuplicateAfterSale(orderItemIds);

            LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
            itemWrapper.in(OrderItem::getId, orderItemIds);
            List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);
            Map<Long, OrderItem> orderItemMap = orderItems.stream()
                    .collect(Collectors.toMap(OrderItem::getId, item -> item));

            BigDecimal totalRefundAmount = BigDecimal.ZERO;
            for (AfterSaleApplyDTO.AfterSaleItemDTO itemDTO : applyDTO.getItems()) {
                OrderItem orderItem = orderItemMap.get(itemDTO.getOrderItemId());
                if (orderItem == null) {
                    throw new BusinessException("订单项不存在");
                }
                if (orderItem.getRefundStatus() == 2) {
                    throw new BusinessException("商品已退款，不可重复申请：" + orderItem.getProductName());
                }
                BigDecimal maxRefund = orderItem.getSubtotal();
                if (itemDTO.getRefundAmount().compareTo(maxRefund) > 0) {
                    throw new BusinessException("退款金额不能超过实付金额：" + orderItem.getProductName());
                }
                totalRefundAmount = totalRefundAmount.add(itemDTO.getRefundAmount());
            }

            if (totalRefundAmount.compareTo(order.getPayAmount()) > 0) {
                throw new BusinessException("总退款金额不能超过订单实付金额");
            }

            String afterSaleNo = generateAfterSaleNo();

            AfterSale afterSale = new AfterSale();
            afterSale.setAfterSaleNo(afterSaleNo);
            afterSale.setOrderId(applyDTO.getOrderId());
            afterSale.setUserId(applyDTO.getUserId());
            afterSale.setLeaderId(order.getLeaderId());
            afterSale.setActivityId(order.getActivityId());
            afterSale.setAfterSaleType(applyDTO.getAfterSaleType());
            afterSale.setAfterSaleStatus(AFTER_SALE_STATUS_PENDING);
            afterSale.setRefundAmount(totalRefundAmount);
            afterSale.setApplyReason(applyDTO.getApplyReason());
            afterSale.setApplyTime(LocalDateTime.now());
            afterSaleMapper.insert(afterSale);

            List<AfterSaleItem> afterSaleItems = new ArrayList<>();
            for (AfterSaleApplyDTO.AfterSaleItemDTO itemDTO : applyDTO.getItems()) {
                AfterSaleItem afterSaleItem = new AfterSaleItem();
                afterSaleItem.setAfterSaleId(afterSale.getId());
                afterSaleItem.setOrderItemId(itemDTO.getOrderItemId());
                afterSaleItem.setProductId(itemDTO.getProductId());
                afterSaleItem.setProductName(itemDTO.getProductName());
                afterSaleItem.setSpec(itemDTO.getSpec());
                afterSaleItem.setQuantity(itemDTO.getQuantity());
                afterSaleItem.setRefundAmount(itemDTO.getRefundAmount());
                afterSaleItem.setRefundStatus(1);
                afterSaleItems.add(afterSaleItem);

                OrderItem orderItem = orderItemMap.get(itemDTO.getOrderItemId());
                orderItem.setRefundStatus(1);
                orderItem.setRefundQuantity(orderItem.getRefundQuantity() + itemDTO.getQuantity());
                orderItemMapper.updateById(orderItem);
            }

            for (AfterSaleItem item : afterSaleItems) {
                afterSaleItemMapper.insert(item);
            }

            return afterSale.getId();
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void auditAfterSale(AfterSaleAuditDTO auditDTO) {
        AfterSale afterSale = afterSaleMapper.selectById(auditDTO.getId());
        if (afterSale == null) {
            throw new BusinessException("售后单不存在");
        }
        if (afterSale.getAfterSaleStatus() != AFTER_SALE_STATUS_PENDING) {
            throw new BusinessException("仅待审核的售后单可审核");
        }

        afterSale.setAfterSaleStatus(auditDTO.getAfterSaleStatus());
        afterSale.setAuditRemark(auditDTO.getAuditRemark());
        afterSale.setAuditTime(LocalDateTime.now());

        if (auditDTO.getRefundAmount() != null) {
            afterSale.setRefundAmount(auditDTO.getRefundAmount());
        }

        afterSaleMapper.updateById(afterSale);

        if (auditDTO.getAfterSaleStatus() == AFTER_SALE_STATUS_APPROVED) {
            processApprovedAfterSale(afterSale);
        } else if (auditDTO.getAfterSaleStatus() == AFTER_SALE_STATUS_REJECTED) {
            processRejectedAfterSale(afterSale);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void completeAfterSale(Long id) {
        AfterSale afterSale = afterSaleMapper.selectById(id);
        if (afterSale == null) {
            throw new BusinessException("售后单不存在");
        }
        if (afterSale.getAfterSaleStatus() != AFTER_SALE_STATUS_APPROVED) {
            throw new BusinessException("仅审核通过的售后单可完成");
        }

        afterSale.setAfterSaleStatus(AFTER_SALE_STATUS_COMPLETED);
        afterSale.setCompleteTime(LocalDateTime.now());
        afterSaleMapper.updateById(afterSale);

        LambdaQueryWrapper<AfterSaleItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(AfterSaleItem::getAfterSaleId, id);
        List<AfterSaleItem> items = afterSaleItemMapper.selectList(itemWrapper);

        for (AfterSaleItem item : items) {
            item.setRefundStatus(2);
            afterSaleItemMapper.updateById(item);

            OrderItem orderItem = orderItemMapper.selectById(item.getOrderItemId());
            if (orderItem != null) {
                orderItem.setRefundStatus(2);
                orderItemMapper.updateById(orderItem);
            }
        }
    }

    @Override
    public AfterSaleVO getDetail(Long id) {
        AfterSale afterSale = afterSaleMapper.selectById(id);
        if (afterSale == null) {
            throw new BusinessException("售后单不存在");
        }
        AfterSaleVO vo = convertToVO(afterSale);
        List<AfterSaleItemVO> items = afterSaleItemService.getItemsByAfterSaleId(id);
        vo.setItems(items);
        return vo;
    }

    private void checkDuplicateAfterSale(List<Long> orderItemIds) {
        LambdaQueryWrapper<AfterSaleItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(AfterSaleItem::getOrderItemId, orderItemIds);
        wrapper.ne(AfterSaleItem::getRefundStatus, 0);
        List<AfterSaleItem> existingItems = afterSaleItemMapper.selectList(wrapper);
        if (!CollectionUtils.isEmpty(existingItems)) {
            throw new BusinessException("存在已申请售后的订单项，请勿重复申请");
        }
    }

    private void processApprovedAfterSale(AfterSale afterSale) {
        if (afterSale.getAfterSaleType() == AFTER_SALE_TYPE_RETURN_REFUND) {
            returnStock(afterSale);
        }
        deductCommission(afterSale);
    }

    private void returnStock(AfterSale afterSale) {
        LambdaQueryWrapper<AfterSaleItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(AfterSaleItem::getAfterSaleId, afterSale.getId());
        List<AfterSaleItem> items = afterSaleItemMapper.selectList(itemWrapper);

        for (AfterSaleItem item : items) {
            OrderItem orderItem = orderItemMapper.selectById(item.getOrderItemId());
            if (orderItem != null && orderItem.getActivitySkuId() != null) {
                GroupActivitySku sku = groupActivitySkuMapper.selectById(orderItem.getActivitySkuId());
                if (sku != null) {
                    sku.setSoldStock(sku.getSoldStock().subtract(BigDecimal.valueOf(item.getQuantity())));
                    sku.setActivityStock(sku.getActivityStock().add(BigDecimal.valueOf(item.getQuantity())));
                    groupActivitySkuMapper.updateById(sku);
                }
            }
        }
    }

    private void deductCommission(AfterSale afterSale) {
        LambdaQueryWrapper<AfterSaleItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(AfterSaleItem::getAfterSaleId, afterSale.getId());
        List<AfterSaleItem> items = afterSaleItemMapper.selectList(itemWrapper);

        for (AfterSaleItem item : items) {
            LambdaQueryWrapper<Commission> commissionWrapper = new LambdaQueryWrapper<>();
            commissionWrapper.eq(Commission::getOrderItemId, item.getOrderItemId());
            commissionWrapper.eq(Commission::getSettleStatus, 0);
            Commission commission = commissionMapper.selectOne(commissionWrapper);
            if (commission != null) {
                commission.setSettleStatus(2);
                commissionMapper.updateById(commission);
            }
        }
    }

    private void processRejectedAfterSale(AfterSale afterSale) {
        LambdaQueryWrapper<AfterSaleItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(AfterSaleItem::getAfterSaleId, afterSale.getId());
        List<AfterSaleItem> items = afterSaleItemMapper.selectList(itemWrapper);

        for (AfterSaleItem item : items) {
            item.setRefundStatus(0);
            afterSaleItemMapper.updateById(item);

            OrderItem orderItem = orderItemMapper.selectById(item.getOrderItemId());
            if (orderItem != null) {
                orderItem.setRefundStatus(0);
                orderItem.setRefundQuantity(orderItem.getRefundQuantity() - item.getQuantity());
                orderItemMapper.updateById(orderItem);
            }
        }
    }

    private String generateAfterSaleNo() {
        return AFTER_SALE_NO_PREFIX + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + String.format("%06d", (int) (Math.random() * 1000000));
    }

    private LambdaQueryWrapper<AfterSale> buildQueryWrapper(AfterSaleQueryDTO queryDTO) {
        LambdaQueryWrapper<AfterSale> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(queryDTO.getAfterSaleNo())) {
            wrapper.like(AfterSale::getAfterSaleNo, queryDTO.getAfterSaleNo());
        }
        if (queryDTO.getOrderId() != null) {
            wrapper.eq(AfterSale::getOrderId, queryDTO.getOrderId());
        }
        if (queryDTO.getUserId() != null) {
            wrapper.eq(AfterSale::getUserId, queryDTO.getUserId());
        }
        if (queryDTO.getLeaderId() != null) {
            wrapper.eq(AfterSale::getLeaderId, queryDTO.getLeaderId());
        }
        if (queryDTO.getActivityId() != null) {
            wrapper.eq(AfterSale::getActivityId, queryDTO.getActivityId());
        }
        if (queryDTO.getAfterSaleType() != null) {
            wrapper.eq(AfterSale::getAfterSaleType, queryDTO.getAfterSaleType());
        }
        if (queryDTO.getAfterSaleStatus() != null) {
            wrapper.eq(AfterSale::getAfterSaleStatus, queryDTO.getAfterSaleStatus());
        }
        if (queryDTO.getStartTime() != null) {
            wrapper.ge(AfterSale::getApplyTime, queryDTO.getStartTime());
        }
        if (queryDTO.getEndTime() != null) {
            wrapper.le(AfterSale::getApplyTime, queryDTO.getEndTime());
        }
        wrapper.orderByDesc(AfterSale::getCreateTime);
        return wrapper;
    }

    private AfterSaleVO convertToVO(AfterSale afterSale) {
        AfterSaleVO vo = new AfterSaleVO();
        vo.setId(afterSale.getId());
        vo.setAfterSaleNo(afterSale.getAfterSaleNo());
        vo.setOrderId(afterSale.getOrderId());
        vo.setUserId(afterSale.getUserId());
        vo.setLeaderId(afterSale.getLeaderId());
        vo.setActivityId(afterSale.getActivityId());
        vo.setAfterSaleType(afterSale.getAfterSaleType());
        vo.setAfterSaleTypeName(getAfterSaleTypeName(afterSale.getAfterSaleType()));
        vo.setAfterSaleStatus(afterSale.getAfterSaleStatus());
        vo.setAfterSaleStatusName(getAfterSaleStatusName(afterSale.getAfterSaleStatus()));
        vo.setRefundAmount(afterSale.getRefundAmount());
        vo.setApplyReason(afterSale.getApplyReason());
        vo.setAuditRemark(afterSale.getAuditRemark());
        vo.setApplyTime(afterSale.getApplyTime());
        vo.setAuditTime(afterSale.getAuditTime());
        vo.setCompleteTime(afterSale.getCompleteTime());
        vo.setCreateTime(afterSale.getCreateTime());
        vo.setUpdateTime(afterSale.getUpdateTime());

        UserOrder order = userOrderMapper.selectById(afterSale.getOrderId());
        if (order != null) {
            vo.setOrderNo(order.getOrderNo());
        }

        SysUser user = sysUserMapper.selectById(afterSale.getUserId());
        if (user != null) {
            vo.setUserName(user.getNickname());
        }

        SysUser leader = sysUserMapper.selectById(afterSale.getLeaderId());
        if (leader != null) {
            vo.setLeaderName(leader.getNickname());
        }

        GroupActivity activity = groupActivityMapper.selectById(afterSale.getActivityId());
        if (activity != null) {
            vo.setActivityName(activity.getActivityName());
        }

        return vo;
    }

    private String getAfterSaleTypeName(Integer type) {
        if (type == null) return "";
        switch (type) {
            case AFTER_SALE_TYPE_REFUND: return "仅退款";
            case AFTER_SALE_TYPE_RETURN_REFUND: return "退货退款";
            default: return "未知";
        }
    }

    private String getAfterSaleStatusName(Integer status) {
        if (status == null) return "";
        switch (status) {
            case AFTER_SALE_STATUS_PENDING: return "待审核";
            case AFTER_SALE_STATUS_APPROVED: return "审核通过";
            case AFTER_SALE_STATUS_REJECTED: return "审核拒绝";
            case AFTER_SALE_STATUS_COMPLETED: return "已完成";
            case AFTER_SALE_STATUS_CANCELLED: return "已取消";
            default: return "未知";
        }
    }
}
