package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.ReceiptQueryDTO;
import com.community.groupbuy.dto.ReceiptSaveDTO;
import com.community.groupbuy.vo.LeaderReceiptVO;

public interface LeaderReceiptService {

    PageResult<LeaderReceiptVO> page(ReceiptQueryDTO queryDTO);

    void createReceipt(ReceiptSaveDTO dto);

    void receipt(ReceiptSaveDTO dto);

    LeaderReceiptVO getDetail(Long id);
}
