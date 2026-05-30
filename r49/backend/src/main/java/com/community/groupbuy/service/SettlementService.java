package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.SettlementAuditDTO;
import com.community.groupbuy.dto.SettlementCreateDTO;
import com.community.groupbuy.dto.SettlementQueryDTO;
import com.community.groupbuy.vo.SettlementExcelVO;
import com.community.groupbuy.vo.SettlementVO;

import java.util.List;

public interface SettlementService {

    PageResult<SettlementVO> page(SettlementQueryDTO queryDTO, Long current, Long size);

    Long createSettlement(SettlementCreateDTO createDTO);

    void auditSettlement(SettlementAuditDTO auditDTO, Long auditorId);

    void completeSettlement(Long id);

    SettlementVO getDetail(Long id);

    List<SettlementExcelVO> getSettlementExcelList(SettlementQueryDTO queryDTO);
}
