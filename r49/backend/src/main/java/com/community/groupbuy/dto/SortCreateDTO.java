package com.community.groupbuy.dto;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class SortCreateDTO {

    @NotNull(message = "活动ID不能为空")
    private Long activityId;

    @NotNull(message = "仓库ID不能为空")
    private Long warehouseId;

    private String remark;

    @NotEmpty(message = "分拣明细不能为空")
    private List<SortItemSaveDTO> items;
}
