package com.community.groupbuy.controller;

import com.community.groupbuy.common.Result;
import com.community.groupbuy.service.StatisticsService;
import com.community.groupbuy.vo.AfterSaleStatisticsVO;
import com.community.groupbuy.vo.BusinessOverviewVO;
import com.community.groupbuy.vo.LeaderPerformanceRankVO;
import com.community.groupbuy.vo.ProductSalesRankVO;
import com.community.groupbuy.vo.SalesTrendVO;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/overview")
    public Result<BusinessOverviewVO> getBusinessOverview() {
        BusinessOverviewVO overview = statisticsService.getBusinessOverview();
        return Result.success(overview);
    }

    @GetMapping("/sales-trend")
    public Result<List<SalesTrendVO>> getSalesTrend(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {
        List<SalesTrendVO> list = statisticsService.getSalesTrend(startDate, endDate);
        return Result.success(list);
    }

    @GetMapping("/product-rank")
    public Result<List<ProductSalesRankVO>> getProductSalesRank(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        List<ProductSalesRankVO> list = statisticsService.getProductSalesRank(startDate, endDate, limit);
        return Result.success(list);
    }

    @GetMapping("/leader-rank")
    public Result<List<LeaderPerformanceRankVO>> getLeaderPerformanceRank(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        List<LeaderPerformanceRankVO> list = statisticsService.getLeaderPerformanceRank(startDate, endDate, limit);
        return Result.success(list);
    }

    @GetMapping("/aftersale")
    public Result<AfterSaleStatisticsVO> getAfterSaleStatistics(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {
        AfterSaleStatisticsVO statistics = statisticsService.getAfterSaleStatistics(startDate, endDate);
        return Result.success(statistics);
    }
}
