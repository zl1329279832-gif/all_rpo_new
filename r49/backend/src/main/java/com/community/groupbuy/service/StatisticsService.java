package com.community.groupbuy.service;

import com.community.groupbuy.vo.AfterSaleStatisticsVO;
import com.community.groupbuy.vo.BusinessOverviewVO;
import com.community.groupbuy.vo.LeaderPerformanceRankVO;
import com.community.groupbuy.vo.ProductSalesRankVO;
import com.community.groupbuy.vo.SalesTrendVO;

import java.time.LocalDate;
import java.util.List;

public interface StatisticsService {

    BusinessOverviewVO getBusinessOverview();

    List<SalesTrendVO> getSalesTrend(LocalDate startDate, LocalDate endDate);

    List<ProductSalesRankVO> getProductSalesRank(LocalDate startDate, LocalDate endDate, Integer limit);

    List<LeaderPerformanceRankVO> getLeaderPerformanceRank(LocalDate startDate, LocalDate endDate, Integer limit);

    AfterSaleStatisticsVO getAfterSaleStatistics(LocalDate startDate, LocalDate endDate);
}
