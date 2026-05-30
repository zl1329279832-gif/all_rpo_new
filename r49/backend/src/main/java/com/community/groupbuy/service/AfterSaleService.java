package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.AfterSaleApplyDTO;
import com.community.groupbuy.dto.AfterSaleAuditDTO;
import com.community.groupbuy.dto.AfterSaleQueryDTO;
import com.community.groupbuy.vo.AfterSaleVO;

public interface AfterSaleService {

    PageResult<AfterSaleVO> page(AfterSaleQueryDTO queryDTO, Long current, Long size);

    Long applyAfterSale(AfterSaleApplyDTO applyDTO);

    void auditAfterSale(AfterSaleAuditDTO auditDTO);

    void completeAfterSale(Long id);

    AfterSaleVO getDetail(Long id);
}
