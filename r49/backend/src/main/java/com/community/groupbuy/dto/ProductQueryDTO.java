package com.community.groupbuy.dto;

import lombok.Data;

@Data
public class ProductQueryDTO {

    private String productName;

    private String productCode;

    private Long categoryId;

    private String brand;

    private Integer status;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
