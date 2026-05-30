package com.community.groupbuy.controller;

import com.alibaba.excel.EasyExcel;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.common.Result;
import com.community.groupbuy.dto.SettlementAuditDTO;
import com.community.groupbuy.dto.SettlementCreateDTO;
import com.community.groupbuy.dto.SettlementQueryDTO;
import com.community.groupbuy.security.LoginUser;
import com.community.groupbuy.service.AuthService;
import com.community.groupbuy.service.SettlementService;
import com.community.groupbuy.vo.SettlementExcelVO;
import com.community.groupbuy.vo.SettlementVO;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/settlement")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;
    private final AuthService authService;

    @GetMapping("/page")
    public Result<PageResult<SettlementVO>> page(SettlementQueryDTO queryDTO,
                                                 @RequestParam(defaultValue = "1") Long current,
                                                 @RequestParam(defaultValue = "10") Long size) {
        PageResult<SettlementVO> pageResult = settlementService.page(queryDTO, current, size);
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<SettlementVO> getDetail(@PathVariable Long id) {
        SettlementVO detail = settlementService.getDetail(id);
        return Result.success(detail);
    }

    @PostMapping
    public Result<Long> create(@Validated @RequestBody SettlementCreateDTO createDTO) {
        Long id = settlementService.createSettlement(createDTO);
        return Result.success(id);
    }

    @PutMapping("/audit")
    public Result<Void> audit(@Validated @RequestBody SettlementAuditDTO auditDTO) {
        LoginUser loginUser = authService.getCurrentUser();
        settlementService.auditSettlement(auditDTO, loginUser.getId());
        return Result.success();
    }

    @PutMapping("/{id}/complete")
    public Result<Void> complete(@PathVariable Long id) {
        settlementService.completeSettlement(id);
        return Result.success();
    }

    @GetMapping("/export")
    public void export(SettlementQueryDTO queryDTO, HttpServletResponse response) throws IOException {
        List<SettlementExcelVO> list = settlementService.getSettlementExcelList(queryDTO);
        String fileName = "结算表_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + ".xlsx";
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + URLEncoder.encode(fileName, StandardCharsets.UTF_8.name()).replaceAll("\\+", "%20"));
        EasyExcel.write(response.getOutputStream(), SettlementExcelVO.class)
                .sheet("结算表")
                .doWrite(list);
    }

    @GetMapping("/my")
    public Result<PageResult<SettlementVO>> getMySettlement(SettlementQueryDTO queryDTO,
                                                            @RequestParam(defaultValue = "1") Long current,
                                                            @RequestParam(defaultValue = "10") Long size) {
        LoginUser loginUser = authService.getCurrentUser();
        queryDTO.setLeaderId(loginUser.getId());
        PageResult<SettlementVO> pageResult = settlementService.page(queryDTO, current, size);
        return Result.success(pageResult);
    }
}
