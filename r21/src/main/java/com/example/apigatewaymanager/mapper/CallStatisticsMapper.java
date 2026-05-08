package com.example.apigatewaymanager.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.apigatewaymanager.entity.CallStatistics;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CallStatisticsMapper extends BaseMapper<CallStatistics> {
}
