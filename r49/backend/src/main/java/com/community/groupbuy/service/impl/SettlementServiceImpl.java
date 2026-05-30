package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.SettlementAuditDTO;
import com.community.groupbuy.dto.SettlementCreateDTO;
import com.community.groupbuy.dto.SettlementQueryDTO;
import com.community.groupbuy.entity.Commission;
import com.community.groupbuy.entity.Product;
import com.community.groupbuy.entity.Settlement;
import com.community.groupbuy.entity.SettlementItem;
import com.community.groupbuy.entity.SysUser;
import com.community.groupbuy.entity.UserOrder;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.CommissionMapper;
import com.community.groupbuy.mapper.ProductMapper;
import com.community.groupbuy.mapper.SettlementItemMapper;
import com.community.groupbuy.mapper.SettlementMapper;
import com.community.groupbuy.mapper.SysUserMapper;
import com.community.groupbuy.mapper.UserOrderMapper;
import com.community.groupbuy.service.SettlementService;
import com.community.groupbuy.vo.SettlementExcelVO;
import com.community.groupbuy.vo.SettlementItemVO;
import com.community.groupbuy.vo.SettlementVO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettlementServiceImpl implements SettlementService {

    private final SettlementMapper settlementMapper;
    private final SettlementItemMapper settlementItemMapper;
    private final CommissionMapper commissionMapper;
    private final SysUserMapper sysUserMapper;
    private final UserOrderMapper userOrderMapper;
    private final ProductMapper productMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String SETTLEMENT_NO_KEY = "settlement:no:generator";
    private static final String SETTLEMENT_SUBMIT_LOCK_KEY = "settlement:submit:lock:";
    private static final String SETTLEMENT_NO_PREFIX = "ST";
    private static final String STATS_CACHE_KEY = "stats:commission:";

    private static final int SETTLEMENT_STATUS_PENDING = 0;
    private static final int SETTLEMENT_STATUS_APPROVED = 1;
    private static final int SETTLEMENT_STATUS_REJECTED = 2;
    private static final int SETTLEMENT_STATUS_SETTLED = 3;

    private static final int AUDIT_STATUS_PENDING = 0;
    private static final int AUDIT_STATUS_APPROVED = 1;
    private static final int AUDIT_STATUS_REJECTED = 2;

    private static final int COMMISSION_STATUS_PENDING = 0;
    private static final int COMMISSION_STATUS_SETTLED = 1;

    @Override
    public PageResult<SettlementVO> page(SettlementQueryDTO queryDTO, Long current, Long size) {
        Page<Settlement> page = new Page<>(current, size);
        LambdaQueryWrapper<Settlement> wrapper = buildQueryWrapper(queryDTO);
        Page<Settlement> settlementPage = settlementMapper.selectPage(page, wrapper);
        List<SettlementVO> voList = settlementPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        return PageResult.of(voList, settlementPage.getTotal(), settlementPage.getCurrent(), settlementPage.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createSettlement(SettlementCreateDTO createDTO) {
        if (CollectionUtils.isEmpty(createDTO.getCommissionIds())) {
            throw new BusinessException("请选择要结算的佣金");
        }

        String lockKey = SETTLEMENT_SUBMIT_LOCK_KEY + createDTO.getLeaderId();
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 5, TimeUnit.SECONDS);
        if (locked == null || !locked) {
            throw new BusinessException("请勿重复创建结算单");
        }

        try {
            checkPendingSettlement(createDTO.getLeaderId(), createDTO.getStartDate(), createDTO.getEndDate());

            List<Long> commissionIds = createDTO.getCommissionIds();
            List<Commission> commissions = commissionMapper.selectBatchIds(commissionIds);

            checkCommissions(commissions, commissionIds);

            BigDecimal totalAmount = BigDecimal.ZERO;
            BigDecimal totalCommission = BigDecimal.ZERO;
            for (Commission commission : commissions) {
                totalAmount = totalAmount.add(commission.getOrderAmount());
                totalCommission = totalCommission.add(commission.getCommissionAmount());
            }

            String settlementNo = generateSettlementNo();

            Settlement settlement = new Settlement();
            settlement.setSettlementNo(settlementNo);
            settlement.setLeaderId(createDTO.getLeaderId());
            settlement.setStartDate(createDTO.getStartDate());
            settlement.setEndDate(createDTO.getEndDate());
            settlement.setTotalOrders(commissions.size());
            settlement.setTotalAmount(totalAmount);
            settlement.setTotalCommission(totalCommission);
            settlement.setSettlementStatus(SETTLEMENT_STATUS_PENDING);
            settlement.setAuditStatus(AUDIT_STATUS_PENDING);
            settlement.setRemark(createDTO.getRemark());
            settlementMapper.insert(settlement);

            List<SettlementItem> settlementItems = new ArrayList<>();
            for (Commission commission : commissions) {
                SettlementItem item = new SettlementItem();
                item.setSettlementId(settlement.getId());
                item.setCommissionId(commission.getId());
                item.setOrderId(commission.getOrderId());
                item.setProductId(commission.getProductId());
                item.setOrderAmount(commission.getOrderAmount());
                item.setCommissionAmount(commission.getCommissionAmount());
                item.setSettleStatus(0);
                settlementItems.add(item);
            }

            for (SettlementItem item : settlementItems) {
                settlementItemMapper.insert(item);
            }

            return settlement.getId();
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void auditSettlement(SettlementAuditDTO auditDTO, Long auditorId) {
        Settlement settlement = settlementMapper.selectById(auditDTO.getId());
        if (settlement == null) {
            throw new BusinessException("结算单不存在");
        }
        if (settlement.getAuditStatus() != AUDIT_STATUS_PENDING) {
            throw new BusinessException("仅待审核的结算单可审核");
        }

        settlement.setAuditStatus(auditDTO.getAuditStatus());
        settlement.setAuditorId(auditorId);
        settlement.setAuditTime(LocalDateTime.now());

        if (auditDTO.getRemark() != null) {
            settlement.setRemark(auditDTO.getRemark());
        }

        if (auditDTO.getAuditStatus() == AUDIT_STATUS_APPROVED) {
            settlement.setSettlementStatus(SETTLEMENT_STATUS_APPROVED);
            checkCommissionOccupied(settlement.getId());
        } else if (auditDTO.getAuditStatus() == AUDIT_STATUS_REJECTED) {
            settlement.setSettlementStatus(SETTLEMENT_STATUS_REJECTED);
        }

        settlementMapper.updateById(settlement);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void completeSettlement(Long id) {
        Settlement settlement = settlementMapper.selectById(id);
        if (settlement == null) {
            throw new BusinessException("结算单不存在");
        }
        if (settlement.getSettlementStatus() != SETTLEMENT_STATUS_APPROVED) {
            throw new BusinessException("仅审核通过的结算单可完成结算");
        }

        settlement.setSettlementStatus(SETTLEMENT_STATUS_SETTLED);
        settlement.setSettleTime(LocalDateTime.now());
        settlementMapper.updateById(settlement);

        LambdaQueryWrapper<SettlementItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(SettlementItem::getSettlementId, id);
        List<SettlementItem> items = settlementItemMapper.selectList(itemWrapper);

        for (SettlementItem item : items) {
            Commission commission = commissionMapper.selectById(item.getCommissionId());
            if (commission != null && commission.getSettleStatus() == COMMISSION_STATUS_PENDING) {
                commission.setSettleStatus(COMMISSION_STATUS_SETTLED);
                commission.setSettleTime(LocalDateTime.now());
                commissionMapper.updateById(commission);
            }
            item.setSettleStatus(1);
            settlementItemMapper.updateById(item);
        }

        evictStatsCache();
    }

    @Override
    public SettlementVO getDetail(Long id) {
        Settlement settlement = settlementMapper.selectById(id);
        if (settlement == null) {
            throw new BusinessException("结算单不存在");
        }
        SettlementVO vo = convertToVO(settlement);

        LambdaQueryWrapper<SettlementItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(SettlementItem::getSettlementId, id);
        List<SettlementItem> items = settlementItemMapper.selectList(itemWrapper);
        List<SettlementItemVO> itemVOList = items.stream()
                .map(this::convertItemToVO)
                .collect(Collectors.toList());
        vo.setItems(itemVOList);

        return vo;
    }

    @Override
    public List<SettlementExcelVO> getSettlementExcelList(SettlementQueryDTO queryDTO) {
        LambdaQueryWrapper<Settlement> wrapper = buildQueryWrapper(queryDTO);
        List<Settlement> settlements = settlementMapper.selectList(wrapper);
        return settlements.stream()
                .map(this::convertToExcelVO)
                .collect(Collectors.toList());
    }

    private void checkPendingSettlement(Long leaderId, LocalDate startDate, LocalDate endDate) {
        LambdaQueryWrapper<Settlement> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Settlement::getLeaderId, leaderId);
        wrapper.eq(Settlement::getAuditStatus, AUDIT_STATUS_PENDING);
        wrapper.and(w -> w.between(Settlement::getStartDate, startDate, endDate)
                .or()
                .between(Settlement::getEndDate, startDate, endDate)
                .or()
                .and(w2 -> w2.le(Settlement::getStartDate, startDate)
                        .ge(Settlement::getEndDate, endDate)));
        Long count = settlementMapper.selectCount(wrapper);
        if (count > 0) {
            throw new BusinessException("该周期内存在待审核的结算单，请先处理");
        }
    }

    private void checkCommissions(List<Commission> commissions, List<Long> commissionIds) {
        if (commissions.size() != commissionIds.size()) {
            throw new BusinessException("部分佣金记录不存在");
        }

        for (Commission commission : commissions) {
            if (commission.getSettleStatus() != COMMISSION_STATUS_PENDING) {
                throw new BusinessException("佣金状态不正确，仅待结算的佣金可结算");
            }

            LambdaQueryWrapper<SettlementItem> itemWrapper = new LambdaQueryWrapper<>();
            itemWrapper.eq(SettlementItem::getCommissionId, commission.getId());
            Long existCount = settlementItemMapper.selectCount(itemWrapper);
            if (existCount > 0) {
                throw new BusinessException("佣金已在其他结算单中，不能重复结算");
            }
        }
    }

    private void checkCommissionOccupied(Long settlementId) {
        LambdaQueryWrapper<SettlementItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(SettlementItem::getSettlementId, settlementId);
        List<SettlementItem> items = settlementItemMapper.selectList(itemWrapper);

        for (SettlementItem item : items) {
            LambdaQueryWrapper<SettlementItem> otherWrapper = new LambdaQueryWrapper<>();
            otherWrapper.eq(SettlementItem::getCommissionId, item.getCommissionId());
            otherWrapper.ne(SettlementItem::getSettlementId, settlementId);
            Long count = settlementItemMapper.selectCount(otherWrapper);
            if (count > 0) {
                Commission commission = commissionMapper.selectById(item.getCommissionId());
                String commissionNo = commission != null ? commission.getCommissionNo() : item.getCommissionId().toString();
                throw new BusinessException("佣金已被其他结算单占用：" + commissionNo);
            }
        }
    }

    private String generateSettlementNo() {
        String script = "local date = KEYS[1]\n" +
                "local key = 'settlement:no:' .. date\n" +
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
        return SETTLEMENT_NO_PREFIX + date + String.format("%06d", sequence);
    }

    private void evictStatsCache() {
        Set<String> keys = redisTemplate.keys(STATS_CACHE_KEY + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    private LambdaQueryWrapper<Settlement> buildQueryWrapper(SettlementQueryDTO queryDTO) {
        LambdaQueryWrapper<Settlement> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(queryDTO.getSettlementNo())) {
            wrapper.like(Settlement::getSettlementNo, queryDTO.getSettlementNo());
        }
        if (queryDTO.getLeaderId() != null) {
            wrapper.eq(Settlement::getLeaderId, queryDTO.getLeaderId());
        }
        if (queryDTO.getSettlementStatus() != null) {
            wrapper.eq(Settlement::getSettlementStatus, queryDTO.getSettlementStatus());
        }
        if (queryDTO.getAuditStatus() != null) {
            wrapper.eq(Settlement::getAuditStatus, queryDTO.getAuditStatus());
        }
        if (queryDTO.getStartDate() != null) {
            wrapper.ge(Settlement::getStartDate, queryDTO.getStartDate());
        }
        if (queryDTO.getEndDate() != null) {
            wrapper.le(Settlement::getEndDate, queryDTO.getEndDate());
        }
        if (queryDTO.getCreateStartTime() != null) {
            wrapper.ge(Settlement::getCreateTime, queryDTO.getCreateStartTime());
        }
        if (queryDTO.getCreateEndTime() != null) {
            wrapper.le(Settlement::getCreateTime, queryDTO.getCreateEndTime());
        }
        wrapper.orderByDesc(Settlement::getCreateTime);
        return wrapper;
    }

    private SettlementVO convertToVO(Settlement settlement) {
        SettlementVO vo = new SettlementVO();
        vo.setId(settlement.getId());
        vo.setSettlementNo(settlement.getSettlementNo());
        vo.setLeaderId(settlement.getLeaderId());
        vo.setStartDate(settlement.getStartDate());
        vo.setEndDate(settlement.getEndDate());
        vo.setTotalOrders(settlement.getTotalOrders());
        vo.setTotalAmount(settlement.getTotalAmount());
        vo.setTotalCommission(settlement.getTotalCommission());
        vo.setSettlementStatus(settlement.getSettlementStatus());
        vo.setSettlementStatusText(getSettlementStatusText(settlement.getSettlementStatus()));
        vo.setAuditStatus(settlement.getAuditStatus());
        vo.setAuditStatusText(getAuditStatusText(settlement.getAuditStatus()));
        vo.setAuditorId(settlement.getAuditorId());
        vo.setAuditTime(settlement.getAuditTime());
        vo.setSettleTime(settlement.getSettleTime());
        vo.setRemark(settlement.getRemark());
        vo.setCreateTime(settlement.getCreateTime());

        SysUser leader = sysUserMapper.selectById(settlement.getLeaderId());
        if (leader != null) {
            vo.setLeaderName(leader.getNickname());
            vo.setLeaderPhone(leader.getPhone());
        }

        if (settlement.getAuditorId() != null) {
            SysUser auditor = sysUserMapper.selectById(settlement.getAuditorId());
            if (auditor != null) {
                vo.setAuditorName(auditor.getNickname());
            }
        }

        return vo;
    }

    private SettlementItemVO convertItemToVO(SettlementItem item) {
        SettlementItemVO vo = new SettlementItemVO();
        vo.setId(item.getId());
        vo.setSettlementId(item.getSettlementId());
        vo.setCommissionId(item.getCommissionId());
        vo.setOrderId(item.getOrderId());
        vo.setProductId(item.getProductId());
        vo.setOrderAmount(item.getOrderAmount());
        vo.setCommissionAmount(item.getCommissionAmount());
        vo.setSettleStatus(item.getSettleStatus());
        vo.setSettleStatusText(getItemSettleStatusText(item.getSettleStatus()));

        Commission commission = commissionMapper.selectById(item.getCommissionId());
        if (commission != null) {
            vo.setCommissionNo(commission.getCommissionNo());
        }

        UserOrder order = userOrderMapper.selectById(item.getOrderId());
        if (order != null) {
            vo.setOrderNo(order.getOrderNo());
        }

        Product product = productMapper.selectById(item.getProductId());
        if (product != null) {
            vo.setProductName(product.getProductName());
            vo.setProductImage(product.getImage());
        }

        return vo;
    }

    private SettlementExcelVO convertToExcelVO(Settlement settlement) {
        SettlementExcelVO vo = new SettlementExcelVO();
        vo.setSettlementNo(settlement.getSettlementNo());
        vo.setStartDate(settlement.getStartDate());
        vo.setEndDate(settlement.getEndDate());
        vo.setTotalOrders(settlement.getTotalOrders());
        vo.setTotalAmount(settlement.getTotalAmount());
        vo.setTotalCommission(settlement.getTotalCommission());
        vo.setSettlementStatusText(getSettlementStatusText(settlement.getSettlementStatus()));
        vo.setAuditStatusText(getAuditStatusText(settlement.getAuditStatus()));
        vo.setAuditTime(settlement.getAuditTime());
        vo.setSettleTime(settlement.getSettleTime());
        vo.setCreateTime(settlement.getCreateTime());

        SysUser leader = sysUserMapper.selectById(settlement.getLeaderId());
        if (leader != null) {
            vo.setLeaderName(leader.getNickname());
            vo.setLeaderPhone(leader.getPhone());
        }

        if (settlement.getAuditorId() != null) {
            SysUser auditor = sysUserMapper.selectById(settlement.getAuditorId());
            if (auditor != null) {
                vo.setAuditorName(auditor.getNickname());
            }
        }

        return vo;
    }

    private String getSettlementStatusText(Integer status) {
        if (status == null) return "";
        switch (status) {
            case SETTLEMENT_STATUS_PENDING: return "待审核";
            case SETTLEMENT_STATUS_APPROVED: return "审核通过";
            case SETTLEMENT_STATUS_REJECTED: return "审核拒绝";
            case SETTLEMENT_STATUS_SETTLED: return "已结算";
            default: return "未知";
        }
    }

    private String getAuditStatusText(Integer status) {
        if (status == null) return "";
        switch (status) {
            case AUDIT_STATUS_PENDING: return "待审核";
            case AUDIT_STATUS_APPROVED: return "审核通过";
            case AUDIT_STATUS_REJECTED: return "审核拒绝";
            default: return "未知";
        }
    }

    private String getItemSettleStatusText(Integer status) {
        if (status == null) return "";
        return status == 1 ? "已结算" : "待结算";
    }
}
