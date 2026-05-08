package com.example.apigatewaymanager.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.apigatewaymanager.entity.ApiKey;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ApiKeyMapper extends BaseMapper<ApiKey> {
    @Update("UPDATE api_key SET total_calls = total_calls + 1 WHERE id = #{id}")
    int incrementCallCount(Long id);
}
