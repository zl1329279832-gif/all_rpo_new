package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.GroupActivityQueryDTO;
import com.community.groupbuy.dto.GroupActivitySaveDTO;
import com.community.groupbuy.vo.GroupActivitySkuVO;
import com.community.groupbuy.vo.GroupActivityVO;

import java.util.List;

public interface GroupActivityService {

    PageResult<GroupActivityVO> page(GroupActivityQueryDTO queryDTO, Long current, Long size);

    void create(GroupActivitySaveDTO saveDTO);

    void update(GroupActivitySaveDTO saveDTO);

    void delete(Long id);

    void updateStatus(Long id, Integer status);

    GroupActivityVO getDetail(Long id);

    List<GroupActivitySkuVO> getActivitySkuList(Long activityId);

    void validateActivityStock(Long activityId);

    void validateCutOffTime(Long activityId);
}
