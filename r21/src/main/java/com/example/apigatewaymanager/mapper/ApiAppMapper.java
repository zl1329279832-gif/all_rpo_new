package com.example.apigatewaymanager.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.apigatewaymanager.entity.ApiApp;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ApiAppMapper extends BaseMapper<ApiApp> {
}
