package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.CommissionQueryDTO;
import com.community.groupbuy.entity.Commission;
import com.community.groupbuy.entity.GroupActivity;
import com.community.groupbuy.entity.OrderItem;
import com.community.groupbuy.entity.Product;
import com.community.groupbuy.entity.SysUser;
import com.community.groupbuy.entity.UserOrder;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.CommissionMapper;
import com.community.groupbuy.mapper.GroupActivityMapper;
import com.community.groupbuy.mapper.OrderItemMapper;
import com.community.groupbuy.mapper.ProductMapper;
import com.community.groupbuy.mapper.SettlementItemMapper;
import com.community.groupbuy.mapper.SysUserMapper;
import com.community.groupbuy.mapper.UserOrderMapper;
import com.community.groupbuy.service.CommissionService;
import com.community.groupbuy.vo.CommissionStatisticsVO;
import com.community.groupbuy.vo.CommissionVO;
import com.community.groupbuy.vo.LeaderSettlementStatsVO;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommissionServiceImpl implements CommissionService {

    private final CommissionMapper commissionMapper;
    private final UserOrderMapper userOrderMapper;
    private final OrderItemMapper orderItemMapper;
    private final GroupActivityMapper groupActivityMapper;
    private final ProductMapper productMapper;
    private final SysUserMapper sysUserMapper;
    private final SettlementItemMapper settlementItemMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String COMMISSION_NO_KEY = "commission:no:generator";
    private static final String COMMISSION_SETTLE_LOCK_KEY = "commission:settle:lock:";
    private static final String COMMISSION_NO_PREFIX = "CM";
    private static final String STATS_CACHE_KEY = "stats:commission:";

    private static final int SETTLE_STATUS_PENDING = 0;
    private static final int SETTLE_STATUS_SETTLED = 1;
    private static final int SETTLE_STATUS_CANCELLED = 2;

    private static final int ORDER_STATUS_COMPLETED = 3;

    @Override
    public PageResult<CommissionVO> page(CommissionQueryDTO queryDTO, Long current, Long size) {
        Page<Commission> page = new Page<>(current, size);
        LambdaQueryWrapper<Commission> wrapper = buildQueryWrapper(queryDTO);
        Page<Commission> commissionPage = commissionMapper.selectPage(page, wrapper);
        List<CommissionVO> voList = commissionPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        return PageResult.of(voList, commissionPage.getTotal(), commissionPage.getCurrent(), commissionPage.getSize());
    }

    @Override
    public List<CommissionVO> getLeaderCommissionList(Long leaderId, Integer settleStatus) {
        LambdaQueryWrapper<Commission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Commission::getLeaderId, leaderId);
        if (settleStatus != null) {
            wrapper.eq(Commission::getSettleStatus, settleStatus);
        }
        wrapper.orderByDesc(Commission::getCreateTime);
        List<Commission> commissions = commissionMapper.selectList(wrapper);
        return commissions.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    @SuppressWarnings("unchecked")
    public CommissionStatisticsVO getCommissionStatistics(Long leaderId) {
        String cacheKey = STATS_CACHE_KEY + (leaderId != null ? leaderId : "all");
        CommissionStatisticsVO cached = (CommissionStatisticsVO) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        CommissionStatisticsVO vo = new CommissionStatisticsVO();
        LambdaQueryWrapper<Commission> wrapper = new LambdaQueryWrapper<>();
        if (leaderId != null) {
            wrapper.eq(Commission::getLeaderId, leaderId);
        }

        List<Commission> allCommissions = commissionMapper.selectList(wrapper);

        vo.setTotalCount((long) allCommissions.size());
        vo.setTotalAmount(allCommissions.stream()
                .map(Commission::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<Commission> pendingList = allCommissions.stream()
                .filter(c -> SETTLE_STATUS_PENDING == c.getSettleStatus())
                .collect(Collectors.toList());
        vo.setPendingSettleCount((long) pendingList.size());
        vo.setPendingSettleAmount(pendingList.stream()
                .map(Commission::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<Commission> settledList = allCommissions.stream()
                .filter(c -> SETTLE_STATUS_SETTLED == c.getSettleStatus())
                .collect(Collectors.toList());
        vo.setSettledCount((long) settledList.size());
        vo.setSettledAmount(settledList.stream()
                .map(Commission::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<Commission> cancelledList = allCommissions.stream()
                .filter(c -> SETTLE_STATUS_CANCELLED == c.getSettleStatus())
                .collect(Collectors.toList());
        vo.setCancelledCount((long) cancelledList.size());
        vo.setCancelledAmount(cancelledList.stream()
                .map(Commission::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        redisTemplate.opsForValue().set(cacheKey, vo, 30, TimeUnit.MINUTES);
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void generateCommission(Long orderId) {
        UserOrder order = userOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        if (order.getOrderStatus() != ORDER_STATUS_COMPLETED) {
            throw new BusinessException("仅已完成的订单可生成佣金");
        }

        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(OrderItem::getOrderId, orderId);
        List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);

        for (OrderItem item : orderItems) {
            LambdaQueryWrapper<Commission> existingWrapper = new LambdaQueryWrapper<>();
            existingWrapper.eq(Commission::getOrderItemId, item.getId());
            Long existingCount = commissionMapper.selectCount(existingWrapper);
            if (existingCount > 0) {
                continue;
            }

            String commissionNo = generateCommissionNo();
            Commission commission = new Commission();
            commission.setCommissionNo(commissionNo);
            commission.setOrderId(orderId);
            commission.setOrderItemId(item.getId());
            commission.setLeaderId(order.getLeaderId());
            commission.setActivityId(order.getActivityId());
            commission.setProductId(item.getProductId());
            commission.setOrderAmount(item.getSubtotal());
            if (item.getSubtotal() != null && item.getSubtotal().compareTo(BigDecimal.ZERO) > 0) {
                commission.setCommissionRate(item.getCommissionAmount().divide(item.getSubtotal(), 4, BigDecimal.ROUND_HALF_UP));
            } else {
                commission.setCommissionRate(BigDecimal.ZERO);
            }
            commission.setCommissionAmount(item.getCommissionAmount());
            commission.setSettleStatus(SETTLE_STATUS_PENDING);
            commissionMapper.insert(commission);
        }

        evictStatsCache();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void settleCommission(Long id) {
        String lockKey = COMMISSION_SETTLE_LOCK_KEY + id;
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 5, TimeUnit.SECONDS);
        if (locked == null || !locked) {
            throw new BusinessException("请勿重复结算佣金");
        }

        try {
            Commission commission = commissionMapper.selectById(id);
            if (commission == null) {
                throw new BusinessException("佣金记录不存在");
            }
            if (commission.getSettleStatus() != SETTLE_STATUS_PENDING) {
                throw new BusinessException("仅待结算的佣金可结算");
            }

            LambdaQueryWrapper<com.community.groupbuy.entity.SettlementItem> itemWrapper = new LambdaQueryWrapper<>();
            itemWrapper.eq(com.community.groupbuy.entity.SettlementItem::getCommissionId, id);
            Long existCount = settlementItemMapper.selectCount(itemWrapper);
            if (existCount > 0) {
                throw new BusinessException("该佣金已在其他结算单中，无法重复结算");
            }

            commission.setSettleStatus(SETTLE_STATUS_SETTLED);
            commission.setSettleTime(LocalDateTime.now());
            commissionMapper.updateById(commission);

            evictStatsCache();
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    @Override
    public List<LeaderSettlementStatsVO> getLeaderSettlementStats() {
        LambdaQueryWrapper<SysUser> userWrapper = new LambdaQueryWrapper<>();
        userWrapper.eq(SysUser::getStatus, 1);
        List<SysUser> leaders = sysUserMapper.selectList(userWrapper);

        List<LeaderSettlementStatsVO> result = new ArrayList<>();
        for (SysUser leader : leaders) {
            LeaderSettlementStatsVO stats = new LeaderSettlementStatsVO();
            stats.setLeaderId(leader.getId());
            stats.setLeaderName(leader.getNickname());

            LambdaQueryWrapper<Commission> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Commission::getLeaderId, leader.getId());
            List<Commission> commissions = commissionMapper.selectList(wrapper);

            if (CollectionUtils.isEmpty(commissions)) {
                continue;
            }

            stats.setTotalOrders(commissions.size());
            stats.setTotalAmount(commissions.stream()
                    .map(Commission::getOrderAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            stats.setTotalCommission(commissions.stream()
                    .map(Commission::getCommissionAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));

            List<Commission> pendingList = commissions.stream()
                    .filter(c -> SETTLE_STATUS_PENDING == c.getSettleStatus())
                    .collect(Collectors.toList());
            stats.setPendingSettleCount(pendingList.size());
            stats.setPendingSettleAmount(pendingList.stream()
                    .map(Commission::getCommissionAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));

            List<Commission> settledList = commissions.stream()
                    .filter(c -> SETTLE_STATUS_SETTLED == c.getSettleStatus())
                    .collect(Collectors.toList());
            stats.setSettledCount(settledList.size());
            stats.setSettledAmount(settledList.stream()
                    .map(Commission::getCommissionAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));

            result.add(stats);
        }

        return result;
    }

    private String generateCommissionNo() {
        String script = "local date = KEYS[1]\n" +
                "local key = 'commission:no:' .. date\n" +
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
        return COMMISSION_NO_PREFIX + date + String.format("%06d", sequence);
    }

    private void evictStatsCache() {
        Set<String> keys = redisTemplate.keys(STATS_CACHE_KEY + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    private LambdaQueryWrapper<Commission> buildQueryWrapper(CommissionQueryDTO queryDTO) {
        LambdaQueryWrapper<Commission> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(queryDTO.getCommissionNo())) {
            wrapper.like(Commission::getCommissionNo, queryDTO.getCommissionNo());
        }
        if (queryDTO.getOrderId() != null) {
            wrapper.eq(Commission::getOrderId, queryDTO.getOrderId());
        }
        if (queryDTO.getLeaderId() != null) {
            wrapper.eq(Commission::getLeaderId, queryDTO.getLeaderId());
        }
        if (queryDTO.getActivityId() != null) {
            wrapper.eq(Commission::getActivityId, queryDTO.getActivityId());
        }
        if (queryDTO.getProductId() != null) {
            wrapper.eq(Commission::getProductId, queryDTO.getProductId());
        }
        if (queryDTO.getSettleStatus() != null) {
            wrapper.eq(Commission::getSettleStatus, queryDTO.getSettleStatus());
        }
        if (queryDTO.getStartTime() != null) {
            wrapper.ge(Commission::getCreateTime, queryDTO.getStartTime());
        }
        if (queryDTO.getEndTime() != null) {
            wrapper.le(Commission::getCreateTime, queryDTO.getEndTime());
        }
        wrapper.orderByDesc(Commission::getCreateTime);
        return wrapper;
    }

    private CommissionVO convertToVO(Commission commission) {
        CommissionVO vo = new CommissionVO();
        vo.setId(commission.getId());
        vo.setCommissionNo(commission.getCommissionNo());
        vo.setOrderId(commission.getOrderId());
        vo.setOrderItemId(commission.getOrderItemId());
        vo.setLeaderId(commission.getLeaderId());
        vo.setActivityId(commission.getActivityId());
        vo.setProductId(commission.getProductId());
        vo.setOrderAmount(commission.getOrderAmount());
        vo.setCommissionRate(commission.getCommissionRate());
        vo.setCommissionAmount(commission.getCommissionAmount());
        vo.setSettleStatus(commission.getSettleStatus());
        vo.setSettleStatusText(getSettleStatusText(commission.getSettleStatus()));
        vo.setSettleTime(commission.getSettleTime());
        vo.setCreateTime(commission.getCreateTime());

        UserOrder order = userOrderMapper.selectById(commission.getOrderId());
        if (order != null) {
            vo.setOrderNo(order.getOrderNo());
        }

        SysUser leader = sysUserMapper.selectById(commission.getLeaderId());
        if (leader != null) {
            vo.setLeaderName(leader.getNickname());
        }

        GroupActivity activity = groupActivityMapper.selectById(commission.getActivityId());
        if (activity != null) {
            vo.setActivityName(activity.getActivityName());
        }

        Product product = productMapper.selectById(commission.getProductId());
        if (product != null) {
            vo.setProductName(product.getProductName());
            vo.setProductImage(product.getImage());
        }

        return vo;
    }

    private String getSettleStatusText(Integer status) {
        if (status == null) return "";
        switch (status) {
            case SETTLE_STATUS_PENDING: return "待结算";
            case SETTLE_STATUS_SETTLED: return "已结算";
            case SETTLE_STATUS_CANCELLED: return "已取消";
            default: return "未知";
        }
    }
}
