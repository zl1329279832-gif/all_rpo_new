package com.example.componentconfig.common;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {
    private List<T> records;
    private long total;
    private int current;
    private int size;
    private int pages;

    public static <T> PageResult<T> of(List<T> records, long total, int current, int size) {
        int pages = (int) Math.ceil((double) total / size);
        return new PageResult<>(records, total, current, size, pages);
    }
}
