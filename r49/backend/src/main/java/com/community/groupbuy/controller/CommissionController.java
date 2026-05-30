package com.community.groupbuy.controller;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.CommissionQueryDTO;
import com.community.groupbuy.security.LoginUser;
import com.community.groupbuy.service.AuthService;
import com.community.groupbuy.service.CommissionService;
import com.community.groupbuy.vo.CommissionStatisticsVO;
import com.community.groupbuy.vo.CommissionVO;
import com.community.groupbuy.vo.LeaderSettlementStatsVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/commission")
@RequiredArgsConstructor
public class CommissionController {

    private final CommissionService commissionService;
    private final AuthService authService;

    @GetMapping("/page")
    public Result<PageResult<CommissionVO>> page(CommissionQueryDTO queryDTO,
                                                 @RequestParam(defaultValue = "1") Long current,
                                                 @RequestParam(defaultValue = "10") Long size) {
        PageResult<CommissionVO> pageResult = commissionService.page(queryDTO, current, size);
        return Result.success(pageResult);
    }

    @GetMapping("/my")
    public Result<List<CommissionVO>> getMyCommission(@RequestParam(required = false) Integer settleStatus) {
        LoginUser loginUser = authService.getCurrentUser();
        List<CommissionVO> list = commissionService.getLeaderCommissionList(loginUser.getId(), settleStatus);
        return Result.success(list);
    }

    @GetMapping("/statistics")
    public Result<CommissionStatisticsVO> getStatistics(@RequestParam(required = false) Long leaderId) {
        CommissionStatisticsVO statistics = commissionService.getCommissionStatistics(leaderId);
        return Result.success(statistics);
    }

    @GetMapping("/leader-stats")
    public Result<List<LeaderSettlementStatsVO>> getLeaderSettlementStats() {
        List<LeaderSettlementStatsVO> stats = commissionService.getLeaderSettlementStats();
        return Result.success(stats);
    }

    @PostMapping("/generate/{orderId}")
    public Result<Void> generateCommission(@PathVariable Long orderId) {
        commissionService.generateCommission(orderId);
        return Result.success();
    }

    @PutMapping("/{id}/settle")
    public Result<Void> settleCommission(@PathVariable Long id) {
        commissionService.settleCommission(id);
        return Result.success();
    }
}
