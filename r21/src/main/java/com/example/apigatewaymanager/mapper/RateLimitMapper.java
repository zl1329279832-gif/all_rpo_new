package com.example.apigatewaymanager.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.apigatewaymanager.entity.RateLimit;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RateLimitMapper extends BaseMapper<RateLimit> {
}
