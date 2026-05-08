package com.example.apigatewaymanager.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.apigatewaymanager.common.ResultCode;
import com.example.apigatewaymanager.entity.ApiKey;
import com.example.apigatewaymanager.exception.BusinessException;
import com.example.apigatewaymanager.mapper.ApiKeyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyMapper apiKeyMapper;
    private final ApiAppService apiAppService;

    @Transactional
    public ApiKey generateApiKey(Long userId, Long appId) {
        apiAppService.validateAppOwnership(userId, appId);

        String apiKey = "ak_" + IdUtil.simpleUUID();
        String apiSecret = IdUtil.fastSimpleUUID() + IdUtil.fastSimpleUUID();

        ApiKey key = new ApiKey();
        key.setAppId(appId);
        key.setApiKey(apiKey);
        key.setApiSecret(apiSecret);
        key.setStatus(1);
        key.setTotalCalls(0L);

        apiKeyMapper.insert(key);
        return key;
    }

    public Page<ApiKey> listApiKeys(Long userId, Long appId, Integer page, Integer size) {
        apiAppService.validateAppOwnership(userId, appId);

        Page<ApiKey> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<ApiKey> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(ApiKey::getAppId, appId)
                   .orderByDesc(ApiKey::getCreateTime);
        return apiKeyMapper.selectPage(pageParam, queryWrapper);
    }

    public ApiKey getApiKeyById(Long userId, Long keyId) {
        ApiKey apiKey = apiKeyMapper.selectById(keyId);
        if (apiKey == null) {
            throw new BusinessException(ResultCode.API_KEY_NOT_FOUND);
        }
        return apiKey;
    }

    public ApiKey getByApiKey(String apiKey) {
        LambdaQueryWrapper<ApiKey> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(ApiKey::getApiKey, apiKey);
        ApiKey key = apiKeyMapper.selectOne(queryWrapper);
        if (key == null) {
            throw new BusinessException(ResultCode.API_KEY_NOT_FOUND);
        }
        return key;
    }

    @Transactional
    public void toggleApiKeyStatus(Long userId, Long keyId) {
        ApiKey apiKey = getApiKeyById(userId, keyId);
        apiKey.setStatus(apiKey.getStatus() == 1 ? 0 : 1);
        apiKeyMapper.updateById(apiKey);
    }

    @Transactional
    public void regenerateApiKey(Long userId, Long keyId) {
        ApiKey apiKey = getApiKeyById(userId, keyId);
        String newSecret = IdUtil.fastSimpleUUID() + IdUtil.fastSimpleUUID();
        apiKey.setApiSecret(newSecret);
        apiKeyMapper.updateById(apiKey);
    }

    @Transactional
    public void deleteApiKey(Long userId, Long keyId) {
        ApiKey apiKey = getApiKeyById(userId, keyId);
        apiKeyMapper.deleteById(apiKey.getId());
    }

    @Transactional
    public void incrementCallCount(Long keyId) {
        apiKeyMapper.incrementCallCount(keyId);
    }
}
