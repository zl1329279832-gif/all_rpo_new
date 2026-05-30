package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.community.groupbuy.entity.AfterSale;
import com.community.groupbuy.entity.Commission;
import com.community.groupbuy.entity.OrderItem;
import com.community.groupbuy.entity.Product;
import com.community.groupbuy.entity.SysUser;
import com.community.groupbuy.entity.UserOrder;
import com.community.groupbuy.mapper.AfterSaleMapper;
import com.community.groupbuy.mapper.CommissionMapper;
import com.community.groupbuy.mapper.OrderItemMapper;
import com.community.groupbuy.mapper.ProductMapper;
import com.community.groupbuy.mapper.SysUserMapper;
import com.community.groupbuy.mapper.UserOrderMapper;
import com.community.groupbuy.service.StatisticsService;
import com.community.groupbuy.vo.AfterSaleStatisticsVO;
import com.community.groupbuy.vo.BusinessOverviewVO;
import com.community.groupbuy.vo.LeaderPerformanceRankVO;
import com.community.groupbuy.vo.ProductSalesRankVO;
import com.community.groupbuy.vo.SalesTrendVO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final UserOrderMapper userOrderMapper;
    private final OrderItemMapper orderItemMapper;
    private final CommissionMapper commissionMapper;
    private final AfterSaleMapper afterSaleMapper;
    private final ProductMapper productMapper;
    private final SysUserMapper sysUserMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String STATS_CACHE_PREFIX = "stats:";
    private static final int CACHE_EXPIRE_MINUTES = 30;

    private static final int ORDER_STATUS_COMPLETED = 3;
    private static final int ORDER_STATUS_PAID = 1;

    private static final int AFTER_SALE_STATUS_PENDING = 0;
    private static final int AFTER_SALE_STATUS_APPROVED = 1;
    private static final int AFTER_SALE_STATUS_REJECTED = 2;
    private static final int AFTER_SALE_STATUS_COMPLETED = 3;
    private static final int AFTER_SALE_STATUS_CANCELLED = 4;

    private static final int AFTER_SALE_TYPE_REFUND = 1;
    private static final int AFTER_SALE_TYPE_RETURN_REFUND = 2;

    private static final int COMMISSION_STATUS_PENDING = 0;
    private static final int COMMISSION_STATUS_SETTLED = 1;

    private static final int USER_ROLE_LEADER = 2;

    @Override
    @SuppressWarnings("unchecked")
    public BusinessOverviewVO getBusinessOverview() {
        String cacheKey = STATS_CACHE_PREFIX + "overview";
        BusinessOverviewVO cached = (BusinessOverviewVO) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        BusinessOverviewVO vo = new BusinessOverviewVO();

        LambdaQueryWrapper<SysUser> userWrapper = new LambdaQueryWrapper<>();
        userWrapper.eq(SysUser::getStatus, 1);
        vo.setTotalUsers(sysUserMapper.selectCount(userWrapper));

        LambdaQueryWrapper<SysUser> leaderWrapper = new LambdaQueryWrapper<>();
        leaderWrapper.eq(SysUser::getStatus, 1);
        vo.setTotalLeaders(sysUserMapper.selectCount(leaderWrapper));

        LambdaQueryWrapper<Product> productWrapper = new LambdaQueryWrapper<>();
        productWrapper.eq(Product::getStatus, 1);
        vo.setTotalProducts(productMapper.selectCount(productWrapper));

        LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.in(UserOrder::getOrderStatus, ORDER_STATUS_PAID, ORDER_STATUS_COMPLETED);
        List<UserOrder> allOrders = userOrderMapper.selectList(orderWrapper);
        vo.setTotalOrders((long) allOrders.size());
        vo.setTotalSalesAmount(allOrders.stream()
                .map(UserOrder::getPayAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        LambdaQueryWrapper<Commission> commissionWrapper = new LambdaQueryWrapper<>();
        List<Commission> allCommissions = commissionMapper.selectList(commissionWrapper);
        vo.setTotalCommission(allCommissions.stream()
                .map(Commission::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = LocalDateTime.of(today, LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(today, LocalTime.MAX);
        LambdaQueryWrapper<UserOrder> todayOrderWrapper = new LambdaQueryWrapper<>();
        todayOrderWrapper.in(UserOrder::getOrderStatus, ORDER_STATUS_PAID, ORDER_STATUS_COMPLETED);
        todayOrderWrapper.between(UserOrder::getCreateTime, todayStart, todayEnd);
        List<UserOrder> todayOrders = userOrderMapper.selectList(todayOrderWrapper);
        vo.setTodayOrders((long) todayOrders.size());
        vo.setTodaySalesAmount(todayOrders.stream()
                .map(UserOrder::getPayAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        LambdaQueryWrapper<AfterSale> afterSaleWrapper = new LambdaQueryWrapper<>();
        afterSaleWrapper.eq(AfterSale::getAfterSaleStatus, AFTER_SALE_STATUS_PENDING);
        vo.setPendingAfterSaleCount(afterSaleMapper.selectCount(afterSaleWrapper));

        LambdaQueryWrapper<Commission> pendingCommissionWrapper = new LambdaQueryWrapper<>();
        pendingCommissionWrapper.eq(Commission::getSettleStatus, COMMISSION_STATUS_PENDING);
        List<Commission> pendingCommissions = commissionMapper.selectList(pendingCommissionWrapper);
        vo.setPendingSettleAmount(pendingCommissions.stream()
                .map(Commission::getCommissionAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        redisTemplate.opsForValue().set(cacheKey, vo, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        return vo;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<SalesTrendVO> getSalesTrend(LocalDate startDate, LocalDate endDate) {
        String cacheKey = STATS_CACHE_PREFIX + "trend:" + startDate + ":" + endDate;
        List<SalesTrendVO> cached = (List<SalesTrendVO>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        if (startDate == null) {
            startDate = LocalDate.now().minusDays(6);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);

        LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.in(UserOrder::getOrderStatus, ORDER_STATUS_PAID, ORDER_STATUS_COMPLETED);
        orderWrapper.between(UserOrder::getCreateTime, start, end);
        List<UserOrder> orders = userOrderMapper.selectList(orderWrapper);

        LambdaQueryWrapper<Commission> commissionWrapper = new LambdaQueryWrapper<>();
        commissionWrapper.between(Commission::getCreateTime, start, end);
        List<Commission> commissions = commissionMapper.selectList(commissionWrapper);

        Map<LocalDate, List<UserOrder>> orderDateMap = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getCreateTime().toLocalDate()));
        Map<LocalDate, List<Commission>> commissionDateMap = commissions.stream()
                .collect(Collectors.groupingBy(c -> c.getCreateTime().toLocalDate()));

        List<SalesTrendVO> result = new ArrayList<>();
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            SalesTrendVO vo = new SalesTrendVO();
            vo.setDate(current);

            List<UserOrder> dayOrders = orderDateMap.getOrDefault(current, new ArrayList<>());
            vo.setOrderCount((long) dayOrders.size());
            vo.setSalesAmount(dayOrders.stream()
                    .map(UserOrder::getPayAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));

            List<Commission> dayCommissions = commissionDateMap.getOrDefault(current, new ArrayList<>());
            vo.setCommissionAmount(dayCommissions.stream()
                    .map(Commission::getCommissionAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));

            result.add(vo);
            current = current.plusDays(1);
        }

        redisTemplate.opsForValue().set(cacheKey, result, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        return result;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<ProductSalesRankVO> getProductSalesRank(LocalDate startDate, LocalDate endDate, Integer limit) {
        String cacheKey = STATS_CACHE_PREFIX + "product_rank:" + startDate + ":" + endDate + ":" + limit;
        List<ProductSalesRankVO> cached = (List<ProductSalesRankVO>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        if (startDate == null) {
            startDate = LocalDate.now().minusDays(29);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        if (limit == null || limit <= 0) {
            limit = 10;
        }

        LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);

        LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.in(UserOrder::getOrderStatus, ORDER_STATUS_PAID, ORDER_STATUS_COMPLETED);
        orderWrapper.between(UserOrder::getCreateTime, start, end);
        List<Long> orderIds = userOrderMapper.selectList(orderWrapper).stream()
                .map(UserOrder::getId)
                .collect(Collectors.toList());

        if (orderIds.isEmpty()) {
            return new ArrayList<>();
        }

        LambdaQueryWrapper<OrderItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.in(OrderItem::getOrderId, orderIds);
        List<OrderItem> orderItems = orderItemMapper.selectList(itemWrapper);

        Map<Long, ProductSalesSummary> productSummaryMap = new HashMap<>();
        for (OrderItem item : orderItems) {
            ProductSalesSummary summary = productSummaryMap.getOrDefault(item.getProductId(), new ProductSalesSummary());
            summary.productId = item.getProductId();
            summary.productName = item.getProductName();
            summary.productImage = item.getProductImage();
            summary.salesQuantity += item.getQuantity();
            summary.salesAmount = summary.salesAmount.add(item.getSubtotal());
            productSummaryMap.put(item.getProductId(), summary);
        }

        List<ProductSalesRankVO> result = productSummaryMap.values().stream()
                .sorted(Comparator.comparing(ProductSalesSummary::getSalesAmount).reversed())
                .limit(limit)
                .map(summary -> {
                    ProductSalesRankVO vo = new ProductSalesRankVO();
                    vo.setProductId(summary.productId);
                    vo.setProductName(summary.productName);
                    vo.setProductImage(summary.productImage);
                    vo.setSalesQuantity((long) summary.salesQuantity);
                    vo.setSalesAmount(summary.salesAmount);
                    return vo;
                })
                .collect(Collectors.toList());

        for (int i = 0; i < result.size(); i++) {
            result.get(i).setRank(i + 1);
        }

        redisTemplate.opsForValue().set(cacheKey, result, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        return result;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<LeaderPerformanceRankVO> getLeaderPerformanceRank(LocalDate startDate, LocalDate endDate, Integer limit) {
        String cacheKey = STATS_CACHE_PREFIX + "leader_rank:" + startDate + ":" + endDate + ":" + limit;
        List<LeaderPerformanceRankVO> cached = (List<LeaderPerformanceRankVO>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        if (startDate == null) {
            startDate = LocalDate.now().minusDays(29);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        if (limit == null || limit <= 0) {
            limit = 10;
        }

        LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);

        LambdaQueryWrapper<Commission> commissionWrapper = new LambdaQueryWrapper<>();
        commissionWrapper.between(Commission::getCreateTime, start, end);
        List<Commission> commissions = commissionMapper.selectList(commissionWrapper);

        Map<Long, LeaderPerformanceSummary> leaderSummaryMap = new HashMap<>();
        for (Commission commission : commissions) {
            LeaderPerformanceSummary summary = leaderSummaryMap.getOrDefault(commission.getLeaderId(), new LeaderPerformanceSummary());
            summary.leaderId = commission.getLeaderId();
            summary.orderCount++;
            summary.salesAmount = summary.salesAmount.add(commission.getOrderAmount());
            summary.commissionAmount = summary.commissionAmount.add(commission.getCommissionAmount());
            leaderSummaryMap.put(commission.getLeaderId(), summary);
        }

        List<Long> leaderIds = new ArrayList<>(leaderSummaryMap.keySet());
        if (!leaderIds.isEmpty()) {
            List<SysUser> leaders = sysUserMapper.selectBatchIds(leaderIds);
            Map<Long, SysUser> leaderMap = leaders.stream()
                    .collect(Collectors.toMap(SysUser::getId, u -> u));
            for (LeaderPerformanceSummary summary : leaderSummaryMap.values()) {
                SysUser leader = leaderMap.get(summary.leaderId);
                if (leader != null) {
                    summary.leaderName = leader.getNickname();
                    summary.leaderPhone = leader.getPhone();
                }
            }
        }

        List<LeaderPerformanceRankVO> result = leaderSummaryMap.values().stream()
                .sorted(Comparator.comparing(LeaderPerformanceSummary::getSalesAmount).reversed())
                .limit(limit)
                .map(summary -> {
                    LeaderPerformanceRankVO vo = new LeaderPerformanceRankVO();
                    vo.setLeaderId(summary.leaderId);
                    vo.setLeaderName(summary.leaderName);
                    vo.setLeaderPhone(summary.leaderPhone);
                    vo.setOrderCount((long) summary.orderCount);
                    vo.setSalesAmount(summary.salesAmount);
                    vo.setCommissionAmount(summary.commissionAmount);
                    return vo;
                })
                .collect(Collectors.toList());

        for (int i = 0; i < result.size(); i++) {
            result.get(i).setRank(i + 1);
        }

        redisTemplate.opsForValue().set(cacheKey, result, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        return result;
    }

    @Override
    @SuppressWarnings("unchecked")
    public AfterSaleStatisticsVO getAfterSaleStatistics(LocalDate startDate, LocalDate endDate) {
        String cacheKey = STATS_CACHE_PREFIX + "aftersale:" + startDate + ":" + endDate;
        AfterSaleStatisticsVO cached = (AfterSaleStatisticsVO) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        if (startDate == null) {
            startDate = LocalDate.now().minusDays(29);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        LocalDateTime start = LocalDateTime.of(startDate, LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, LocalTime.MAX);

        LambdaQueryWrapper<AfterSale> wrapper = new LambdaQueryWrapper<>();
        wrapper.between(AfterSale::getCreateTime, start, end);
        List<AfterSale> afterSales = afterSaleMapper.selectList(wrapper);

        AfterSaleStatisticsVO vo = new AfterSaleStatisticsVO();
        vo.setTotalCount((long) afterSales.size());

        vo.setPendingAuditCount(afterSales.stream()
                .filter(a -> AFTER_SALE_STATUS_PENDING == a.getAfterSaleStatus())
                .count());
        vo.setApprovedCount(afterSales.stream()
                .filter(a -> AFTER_SALE_STATUS_APPROVED == a.getAfterSaleStatus())
                .count());
        vo.setRejectedCount(afterSales.stream()
                .filter(a -> AFTER_SALE_STATUS_REJECTED == a.getAfterSaleStatus())
                .count());
        vo.setCompletedCount(afterSales.stream()
                .filter(a -> AFTER_SALE_STATUS_COMPLETED == a.getAfterSaleStatus())
                .count());
        vo.setCancelledCount(afterSales.stream()
                .filter(a -> AFTER_SALE_STATUS_CANCELLED == a.getAfterSaleStatus())
                .count());

        vo.setTotalRefundAmount(afterSales.stream()
                .filter(a -> AFTER_SALE_STATUS_COMPLETED == a.getAfterSaleStatus())
                .map(AfterSale::getRefundAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        vo.setRefundCount(afterSales.stream()
                .filter(a -> AFTER_SALE_TYPE_REFUND == a.getAfterSaleType())
                .count());
        vo.setReturnRefundCount(afterSales.stream()
                .filter(a -> AFTER_SALE_TYPE_RETURN_REFUND == a.getAfterSaleType())
                .count());

        redisTemplate.opsForValue().set(cacheKey, vo, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        return vo;
    }

    private static class ProductSalesSummary {
        Long productId;
        String productName;
        String productImage;
        int salesQuantity;
        BigDecimal salesAmount = BigDecimal.ZERO;

        public BigDecimal getSalesAmount() {
            return salesAmount;
        }
    }

    private static class LeaderPerformanceSummary {
        Long leaderId;
        String leaderName;
        String leaderPhone;
        int orderCount;
        BigDecimal salesAmount = BigDecimal.ZERO;
        BigDecimal commissionAmount = BigDecimal.ZERO;

        public BigDecimal getSalesAmount() {
            return salesAmount;
        }
    }
}
