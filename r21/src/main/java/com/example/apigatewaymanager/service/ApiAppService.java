package com.example.apigatewaymanager.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.apigatewaymanager.common.ResultCode;
import com.example.apigatewaymanager.dto.ApiAppDTO;
import com.example.apigatewaymanager.entity.ApiApp;
import com.example.apigatewaymanager.exception.BusinessException;
import com.example.apigatewaymanager.mapper.ApiAppMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApiAppService {

    private final ApiAppMapper apiAppMapper;

    @Autowired
    public ApiAppService(ApiAppMapper apiAppMapper) {
        this.apiAppMapper = apiAppMapper;
    }

    @Transactional
    public ApiApp createApiApp(Long userId, ApiAppDTO apiAppDTO) {
        ApiApp apiApp = new ApiApp();
        apiApp.setUserId(userId);
        apiApp.setAppName(apiAppDTO.getAppName());
        apiApp.setAppDescription(apiAppDTO.getAppDescription());
        apiApp.setStatus(1);

        apiAppMapper.insert(apiApp);
        return apiApp;
    }

    public ApiApp getApiAppById(Long userId, Long appId) {
        ApiApp apiApp = apiAppMapper.selectById(appId);
        if (apiApp == null) {
            throw new BusinessException(ResultCode.APP_NOT_FOUND);
        }
        if (!apiApp.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.APP_NOT_OWNER);
        }
        return apiApp;
    }

    public Page<ApiApp> listApiApps(Long userId, Integer page, Integer size) {
        Page<ApiApp> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<ApiApp> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(ApiApp::getUserId, userId)
                   .orderByDesc(ApiApp::getCreateTime);
        return apiAppMapper.selectPage(pageParam, queryWrapper);
    }

    @Transactional
    public ApiApp updateApiApp(Long userId, Long appId, ApiAppDTO apiAppDTO) {
        ApiApp apiApp = getApiAppById(userId, appId);
        apiApp.setAppName(apiAppDTO.getAppName());
        apiApp.setAppDescription(apiAppDTO.getAppDescription());

        apiAppMapper.updateById(apiApp);
        return apiApp;
    }

    @Transactional
    public void deleteApiApp(Long userId, Long appId) {
        ApiApp apiApp = getApiAppById(userId, appId);
        apiAppMapper.deleteById(apiApp.getId());
    }

    @Transactional
    public void toggleApiAppStatus(Long userId, Long appId) {
        ApiApp apiApp = getApiAppById(userId, appId);
        apiApp.setStatus(apiApp.getStatus() == 1 ? 0 : 1);
        apiAppMapper.updateById(apiApp);
    }

    public void validateAppOwnership(Long userId, Long appId) {
        getApiAppById(userId, appId);
    }

    public ApiApp getAppById(Long appId) {
        ApiApp apiApp = apiAppMapper.selectById(appId);
        if (apiApp == null) {
            throw new BusinessException(ResultCode.APP_NOT_FOUND);
        }
        return apiApp;
    }
}
