package com.community.groupbuy.service;

import com.community.groupbuy.entity.ReceiptItem;
import com.community.groupbuy.vo.ReceiptItemVO;

import java.util.List;

public interface ReceiptItemService {

    List<ReceiptItemVO> getByReceiptId(Long receiptId);

    void saveActualQuantity(Long receiptId, List<ReceiptItem> items);
}
