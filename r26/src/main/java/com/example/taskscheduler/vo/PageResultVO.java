package com.example.taskscheduler.vo;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class PageResultVO<T> implements Serializable {

    private List<T> records;

    private Long total;

    private Long size;

    private Long current;

    private Long pages;

    public static <T> PageResultVO<T> of(List<T> records, Long total, Long size, Long current, Long pages) {
        PageResultVO<T> result = new PageResultVO<>();
        result.setRecords(records);
        result.setTotal(total);
        result.setSize(size);
        result.setCurrent(current);
        result.setPages(pages);
        return result;
    }
}