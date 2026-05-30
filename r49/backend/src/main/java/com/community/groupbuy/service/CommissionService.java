package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.CommissionQueryDTO;
import com.community.groupbuy.vo.CommissionStatisticsVO;
import com.community.groupbuy.vo.CommissionVO;
import com.community.groupbuy.vo.LeaderSettlementStatsVO;

import java.util.List;

public interface CommissionService {

    PageResult<CommissionVO> page(CommissionQueryDTO queryDTO, Long current, Long size);

    List<CommissionVO> getLeaderCommissionList(Long leaderId, Integer settleStatus);

    CommissionStatisticsVO getCommissionStatistics(Long leaderId);

    void generateCommission(Long orderId);

    void settleCommission(Long id);

    List<LeaderSettlementStatsVO> getLeaderSettlementStats();
}
