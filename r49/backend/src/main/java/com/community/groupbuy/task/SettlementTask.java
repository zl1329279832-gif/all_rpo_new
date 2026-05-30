package com.community.groupbuy.task;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.community.groupbuy.entity.UserOrder;
import com.community.groupbuy.mapper.UserOrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class SettlementTask {

    private final UserOrderMapper userOrderMapper;

    @Transactional(rollbackFor = Exception.class)
    public void settleCommission() {
        log.info("开始执行佣金结算定时任务，时间：{}", LocalDateTime.now());

        LambdaQueryWrapper<UserOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserOrder::getPayStatus, 1)
                .eq(UserOrder::getOrderStatus, 2)
                .eq(UserOrder::getDeleted, 0);

        List<UserOrder> orders = userOrderMapper.selectList(wrapper);

        if (orders.isEmpty()) {
            log.info("没有需要结算的订单");
            return;
        }

        Map<Long, List<UserOrder>> leaderOrdersMap = orders.stream()
                .filter(order -> order.getLeaderId() != null)
                .collect(Collectors.groupingBy(UserOrder::getLeaderId));

        for (Map.Entry<Long, List<UserOrder>> entry : leaderOrdersMap.entrySet()) {
            Long leaderId = entry.getKey();
            List<UserOrder> leaderOrders = entry.getValue();

            BigDecimal totalCommission = leaderOrders.stream()
                    .map(order -> order.getCommissionAmount() != null ? order.getCommissionAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            log.info("团长ID: {}, 需结算订单数: {}, 结算佣金总额: {}", leaderId, leaderOrders.size(), totalCommission);

            for (UserOrder order : leaderOrders) {
                order.setOrderStatus(3);
                userOrderMapper.updateById(order);
            }
        }

        log.info("佣金结算定时任务执行完成，时间：{}", LocalDateTime.now());
    }
}
