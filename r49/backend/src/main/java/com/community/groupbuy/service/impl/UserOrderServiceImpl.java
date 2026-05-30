package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.OrderCreateDTO;
import com.community.groupbuy.dto.OrderQueryDTO;
import com.community.groupbuy.entity.Commission;
import com.community.groupbuy.entity.GroupActivity;
import com.community.groupbuy.entity.GroupActivitySku;
import com.community.groupbuy.entity.OrderItem;
import com.community.groupbuy.entity.UserOrder;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.CommissionMapper;
import com.community.groupbuy.mapper.GroupActivityMapper;
import com.community.groupbuy.mapper.GroupActivitySkuMapper;
import com.community.groupbuy.mapper.OrderItemMapper;
import com.community.groupbuy.mapper.UserOrderMapper;
import com.community.groupbuy.service.UserOrderService;
import com.community.groupbuy.vo.OrderItemVO;
import com.community.groupbuy.vo.UserOrderVO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserOrderServiceImpl implements UserOrderService {

    private final UserOrderMapper userOrderMapper;
    private final OrderItemMapper orderItemMapper;
    private final GroupActivityMapper groupActivityMapper;
    private final GroupActivitySkuMapper groupActivitySkuMapper;
    private final CommissionMapper commissionMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String ORDER_NO_KEY = "order:no:generator";
    private static final String ORDER_SUBMIT_LOCK_KEY = "order:submit:lock:";
    private static final String ORDER_NO_PREFIX = "ORD";
    private static final int ORDER_STATUS_PENDING_PAY = 0;
    private static final int ORDER_STATUS_PAID = 1;
    private static final int ORDER_STATUS_CANCELLED = 2;
    private static final int ORDER_STATUS_COMPLETED = 3;

    @Override
    public PageResult<UserOrderVO> page(OrderQueryDTO queryDTO, Long current, Long size) {
        Page<UserOrder> page = new Page<>(current, size);
        LambdaQueryWrapper<UserOrder> wrapper = buildQueryWrapper(queryDTO);
        Page<UserOrder> orderPage = userOrderMapper.selectPage(page, wrapper);
        List<UserOrderVO> voList = orderPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        return PageResult.of(voList, orderPage.getTotal(), orderPage.getCurrent(), orderPage.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String createOrder(OrderCreateDTO createDTO, Long userId) {
        String lockKey = ORDER_SUBMIT_LOCK_KEY + userId + ":" + createDTO.getActivityId();
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 5, TimeUnit.SECONDS);
        if (locked == null || !locked) {
            throw new BusinessException("请勿重复提交订单");
        }

        try {
            GroupActivity activity = groupActivityMapper.selectById(createDTO.getActivityId());
            if (activity == null) {
                throw new BusinessException("活动不存在");
            }
            if (activity.getCutOffTime() != null && LocalDateTime.now().isAfter(activity.getCutOffTime())) {
                throw new BusinessException("活动已截单，无法下单");
            }
            if (activity.getStatus() != 1) {
                throw new BusinessException("活动未开始或已结束");
            }

            List<Long> skuIds = createDTO.getItems().stream()
                    .map(OrderCreateDTO.OrderItemDTO::getActivitySkuId)
                    .collect(Collectors.toList());
            List<GroupActivitySku> skuList = groupActivitySkuMapper.selectBatchIds(skuIds);
            Map<Long, GroupActivitySku> skuMap = skuList.stream()
                    .collect(Collectors.toMap(GroupActivitySku::getId, sku -> sku));

            for (OrderCreateDTO.OrderItemDTO itemDTO : createDTO.getItems()) {
                GroupActivitySku sku = skuMap.get(itemDTO.getActivitySkuId());
                if (sku == null) {
                    throw new BusinessException("商品SKU不存在");
                }
                if (sku.getStatus() != 1) {
                    throw new BusinessException("商品已下架");
                }
                BigDecimal availableStock = sku.getActivityStock().subtract(sku.getSoldStock()).subtract(sku.getLockStock());
                if (availableStock.compareTo(BigDecimal.valueOf(itemDTO.getQuantity())) < 0) {
                    throw new BusinessException("商品库存不足：" + itemDTO.getProductName());
                }
            }

            String orderNo = generateOrderNo();

            BigDecimal totalAmount = BigDecimal.ZERO;
            BigDecimal commissionAmount = BigDecimal.ZERO;
            List<OrderItem> orderItems = new ArrayList<>();

            for (OrderCreateDTO.OrderItemDTO itemDTO : createDTO.getItems()) {
                GroupActivitySku sku = skuMap.get(itemDTO.getActivitySkuId());
                BigDecimal subtotal = itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
                BigDecimal itemCommission = itemDTO.getCommissionAmount() != null ? itemDTO.getCommissionAmount()
                        : subtotal.multiply(sku.getCommissionRate());

                totalAmount = totalAmount.add(subtotal);
                commissionAmount = commissionAmount.add(itemCommission);

                OrderItem orderItem = new OrderItem();
                orderItem.setActivitySkuId(itemDTO.getActivitySkuId());
                orderItem.setProductId(itemDTO.getProductId());
                orderItem.setProductName(itemDTO.getProductName());
                orderItem.setProductImage(itemDTO.getProductImage());
                orderItem.setSpec(itemDTO.getSpec());
                orderItem.setUnitPrice(itemDTO.getUnitPrice());
                orderItem.setQuantity(itemDTO.getQuantity());
                orderItem.setSubtotal(subtotal);
                orderItem.setCommissionAmount(itemCommission);
                orderItem.setRefundStatus(0);
                orderItem.setRefundQuantity(0);
                orderItems.add(orderItem);

                sku.setLockStock(sku.getLockStock().add(BigDecimal.valueOf(itemDTO.getQuantity())));
                groupActivitySkuMapper.updateById(sku);
            }

            BigDecimal discountAmount = createDTO.getDiscountAmount() != null ? createDTO.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal payAmount = totalAmount.subtract(discountAmount);

            UserOrder order = new UserOrder();
            order.setOrderNo(orderNo);
            order.setUserId(userId);
            order.setActivityId(createDTO.getActivityId());
            order.setLeaderId(createDTO.getLeaderId());
            order.setTotalAmount(totalAmount);
            order.setPayAmount(payAmount);
            order.setDiscountAmount(discountAmount);
            order.setCommissionAmount(commissionAmount);
            order.setPayStatus(0);
            order.setOrderStatus(ORDER_STATUS_PENDING_PAY);
            order.setReceiverName(createDTO.getReceiverName());
            order.setReceiverPhone(createDTO.getReceiverPhone());
            order.setDeliveryAddress(createDTO.getDeliveryAddress());
            order.setRemark(createDTO.getRemark());
            userOrderMapper.insert(order);

            for (OrderItem orderItem : orderItems) {
                orderItem.setOrderId(order.getId());
                orderItemMapper.insert(orderItem);
            }

            return orderNo;
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelOrder(Long id, String cancelReason) {
        UserOrder order = userOrderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        if (order.getOrderStatus() != ORDER_STATUS_PENDING_PAY) {
            throw new BusinessException("仅待支付订单可取消");
        }

        order.setOrderStatus(ORDER_STATUS_CANCELLED);
        order.setCancelTime(LocalDateTime.now());
        order.setCancelReason(cancelReason);
        userOrderMapper.updateById(order);

        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(OrderItem::getOrderId, id);
        List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);

        for (OrderItem item : orderItems) {
            GroupActivitySku sku = groupActivitySkuMapper.selectById(item.getActivitySkuId());
            if (sku != null) {
                sku.setLockStock(sku.getLockStock().subtract(BigDecimal.valueOf(item.getQuantity())));
                groupActivitySkuMapper.updateById(sku);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void payOrder(Long id) {
        UserOrder order = userOrderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        if (order.getOrderStatus() != ORDER_STATUS_PENDING_PAY) {
            throw new BusinessException("订单状态不正确，无法支付");
        }

        order.setOrderStatus(ORDER_STATUS_PAID);
        order.setPayStatus(1);
        order.setPayTime(LocalDateTime.now());
        userOrderMapper.updateById(order);

        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(OrderItem::getOrderId, id);
        List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);

        for (OrderItem item : orderItems) {
            GroupActivitySku sku = groupActivitySkuMapper.selectById(item.getActivitySkuId());
            if (sku != null) {
                sku.setLockStock(sku.getLockStock().subtract(BigDecimal.valueOf(item.getQuantity())));
                sku.setSoldStock(sku.getSoldStock().add(BigDecimal.valueOf(item.getQuantity())));
                groupActivitySkuMapper.updateById(sku);
            }

            generateCommission(order, item);
        }

        GroupActivity activity = groupActivityMapper.selectById(order.getActivityId());
        if (activity != null) {
            activity.setTotalSales(activity.getTotalSales() + 1);
            activity.setTotalAmount(activity.getTotalAmount().add(order.getPayAmount()));
            groupActivityMapper.updateById(activity);
        }
    }

    @Override
    public UserOrderVO getOrderDetail(Long id) {
        UserOrder order = userOrderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        UserOrderVO vo = convertToVO(order);
        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(OrderItem::getOrderId, id);
        List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);
        List<OrderItemVO> itemVOList = orderItems.stream()
                .map(this::convertToItemVO)
                .collect(Collectors.toList());
        vo.setItems(itemVOList);
        return vo;
    }

    @Override
    public List<UserOrderVO> getUserOrderList(Long userId, Integer orderStatus) {
        LambdaQueryWrapper<UserOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrder::getUserId, userId);
        if (orderStatus != null) {
            wrapper.eq(UserOrder::getOrderStatus, orderStatus);
        }
        wrapper.orderByDesc(UserOrder::getCreateTime);
        List<UserOrder> orders = userOrderMapper.selectList(wrapper);
        return orders.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (id == null) {
            throw new BusinessException("订单ID不能为空");
        }
        UserOrder order = userOrderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        if (order.getOrderStatus() != ORDER_STATUS_CANCELLED && order.getOrderStatus() != ORDER_STATUS_COMPLETED) {
            throw new BusinessException("仅已取消或已完成的订单可删除");
        }
        userOrderMapper.deleteById(id);

        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(OrderItem::getOrderId, id);
        orderItemMapper.delete(itemWrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteBatch(List<Long> ids) {
        if (CollectionUtils.isEmpty(ids)) {
            throw new BusinessException("订单ID不能为空");
        }
        for (Long id : ids) {
            delete(id);
        }
    }

    private void generateCommission(UserOrder order, OrderItem item) {
        String commissionNo = "CM" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + String.format("%06d", (int) (Math.random() * 1000000));
        Commission commission = new Commission();
        commission.setCommissionNo(commissionNo);
        commission.setOrderId(order.getId());
        commission.setOrderItemId(item.getId());
        commission.setLeaderId(order.getLeaderId());
        commission.setActivityId(order.getActivityId());
        commission.setProductId(item.getProductId());
        commission.setOrderAmount(item.getSubtotal());
        commission.setCommissionAmount(item.getCommissionAmount());
        commission.setSettleStatus(0);
        commissionMapper.insert(commission);
    }

    private String generateOrderNo() {
        String script = "local date = KEYS[1]\n" +
                "local key = 'order:no:' .. date\n" +
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
        return ORDER_NO_PREFIX + date + String.format("%06d", sequence);
    }

    private LambdaQueryWrapper<UserOrder> buildQueryWrapper(OrderQueryDTO queryDTO) {
        LambdaQueryWrapper<UserOrder> wrapper = new LambdaQueryWrapper<>();
        if (queryDTO.getUserId() != null) {
            wrapper.eq(UserOrder::getUserId, queryDTO.getUserId());
        }
        if (queryDTO.getActivityId() != null) {
            wrapper.eq(UserOrder::getActivityId, queryDTO.getActivityId());
        }
        if (queryDTO.getLeaderId() != null) {
            wrapper.eq(UserOrder::getLeaderId, queryDTO.getLeaderId());
        }
        if (queryDTO.getOrderStatus() != null) {
            wrapper.eq(UserOrder::getOrderStatus, queryDTO.getOrderStatus());
        }
        if (queryDTO.getPayStatus() != null) {
            wrapper.eq(UserOrder::getPayStatus, queryDTO.getPayStatus());
        }
        if (StringUtils.hasText(queryDTO.getOrderNo())) {
            wrapper.like(UserOrder::getOrderNo, queryDTO.getOrderNo());
        }
        if (StringUtils.hasText(queryDTO.getReceiverPhone())) {
            wrapper.like(UserOrder::getReceiverPhone, queryDTO.getReceiverPhone());
        }
        if (queryDTO.getStartTime() != null) {
            wrapper.ge(UserOrder::getCreateTime, queryDTO.getStartTime());
        }
        if (queryDTO.getEndTime() != null) {
            wrapper.le(UserOrder::getCreateTime, queryDTO.getEndTime());
        }
        wrapper.orderByDesc(UserOrder::getCreateTime);
        return wrapper;
    }

    private UserOrderVO convertToVO(UserOrder order) {
        UserOrderVO vo = new UserOrderVO();
        vo.setId(order.getId());
        vo.setOrderNo(order.getOrderNo());
        vo.setUserId(order.getUserId());
        vo.setActivityId(order.getActivityId());
        vo.setLeaderId(order.getLeaderId());
        vo.setTotalAmount(order.getTotalAmount());
        vo.setPayAmount(order.getPayAmount());
        vo.setDiscountAmount(order.getDiscountAmount());
        vo.setCommissionAmount(order.getCommissionAmount());
        vo.setPayStatus(order.getPayStatus());
        vo.setPayStatusText(getPayStatusText(order.getPayStatus()));
        vo.setOrderStatus(order.getOrderStatus());
        vo.setOrderStatusText(getOrderStatusText(order.getOrderStatus()));
        vo.setPayTime(order.getPayTime());
        vo.setCancelTime(order.getCancelTime());
        vo.setCancelReason(order.getCancelReason());
        vo.setReceiverName(order.getReceiverName());
        vo.setReceiverPhone(order.getReceiverPhone());
        vo.setDeliveryAddress(order.getDeliveryAddress());
        vo.setRemark(order.getRemark());
        vo.setCreateTime(order.getCreateTime());
        return vo;
    }

    private OrderItemVO convertToItemVO(OrderItem item) {
        OrderItemVO vo = new OrderItemVO();
        vo.setId(item.getId());
        vo.setOrderId(item.getOrderId());
        vo.setActivitySkuId(item.getActivitySkuId());
        vo.setProductId(item.getProductId());
        vo.setProductName(item.getProductName());
        vo.setProductImage(item.getProductImage());
        vo.setSpec(item.getSpec());
        vo.setUnitPrice(item.getUnitPrice());
        vo.setQuantity(item.getQuantity());
        vo.setSubtotal(item.getSubtotal());
        vo.setCommissionAmount(item.getCommissionAmount());
        vo.setRefundStatus(item.getRefundStatus());
        vo.setRefundStatusText(getRefundStatusText(item.getRefundStatus()));
        vo.setRefundQuantity(item.getRefundQuantity());
        return vo;
    }

    private String getOrderStatusText(Integer status) {
        if (status == null) return "";
        switch (status) {
            case ORDER_STATUS_PENDING_PAY: return "待支付";
            case ORDER_STATUS_PAID: return "已支付";
            case ORDER_STATUS_CANCELLED: return "已取消";
            case ORDER_STATUS_COMPLETED: return "已完成";
            default: return "未知";
        }
    }

    private String getPayStatusText(Integer status) {
        if (status == null) return "";
        return status == 1 ? "已支付" : "未支付";
    }

    private String getRefundStatusText(Integer status) {
        if (status == null) return "";
        switch (status) {
            case 0: return "未退款";
            case 1: return "退款中";
            case 2: return "已退款";
            default: return "未知";
        }
    }
}
