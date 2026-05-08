package com.example.apigatewaymanager.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.apigatewaymanager.dto.RateLimitDTO;
import com.example.apigatewaymanager.entity.RateLimit;
import com.example.apigatewaymanager.exception.BusinessException;
import com.example.apigatewaymanager.mapper.RateLimitMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.concurrent.TimeUnit;

@Service
public class RateLimitService {

    private final RateLimitMapper rateLimitMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public RateLimitService(RateLimitMapper rateLimitMapper, RedisTemplate<String, Object> redisTemplate) {
        this.rateLimitMapper = rateLimitMapper;
        this.redisTemplate = redisTemplate;
    }

    private static final String QPS_KEY_PREFIX = "rate_limit:qps:";
    private static final String DAILY_KEY_PREFIX = "rate_limit:daily:";
    private static final String MONTHLY_KEY_PREFIX = "rate_limit:monthly:";

    @Transactional
    public RateLimit createRateLimit(RateLimitDTO rateLimitDTO) {
        RateLimit rateLimit = new RateLimit();
        rateLimit.setTargetType(rateLimitDTO.getTargetType());
        rateLimit.setTargetValue(rateLimitDTO.getTargetValue());
        rateLimit.setLimitType(rateLimitDTO.getLimitType());
        rateLimit.setLimitValue(rateLimitDTO.getLimitValue());
        rateLimit.setRemark(rateLimitDTO.getRemark());
        rateLimit.setStatus(1);

        rateLimitMapper.insert(rateLimit);
        return rateLimit;
    }

    public Page<RateLimit> listRateLimits(Integer page, Integer size, Integer targetType) {
        Page<RateLimit> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<RateLimit> queryWrapper = new LambdaQueryWrapper<>();
        
        if (targetType != null) {
            queryWrapper.eq(RateLimit::getTargetType, targetType);
        }
        queryWrapper.orderByDesc(RateLimit::getCreateTime);
        
        return rateLimitMapper.selectPage(pageParam, queryWrapper);
    }

    public RateLimit getRateLimitById(Long id) {
        RateLimit rateLimit = rateLimitMapper.selectById(id);
        if (rateLimit == null) {
            throw new BusinessException("限流配置不存在");
        }
        return rateLimit;
    }

    @Transactional
    public RateLimit updateRateLimit(Long id, RateLimitDTO rateLimitDTO) {
        RateLimit rateLimit = getRateLimitById(id);
        rateLimit.setTargetType(rateLimitDTO.getTargetType());
        rateLimit.setTargetValue(rateLimitDTO.getTargetValue());
        rateLimit.setLimitType(rateLimitDTO.getLimitType());
        rateLimit.setLimitValue(rateLimitDTO.getLimitValue());
        rateLimit.setRemark(rateLimitDTO.getRemark());

        rateLimitMapper.updateById(rateLimit);
        return rateLimit;
    }

    @Transactional
    public void deleteRateLimit(Long id) {
        rateLimitMapper.deleteById(id);
    }

    @Transactional
    public void toggleRateLimitStatus(Long id) {
        RateLimit rateLimit = getRateLimitById(id);
        rateLimit.setStatus(rateLimit.getStatus() == 1 ? 0 : 1);
        rateLimitMapper.updateById(rateLimit);
    }

    public boolean checkRateLimit(Integer targetType, String targetValue) {
        LambdaQueryWrapper<RateLimit> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(RateLimit::getTargetType, targetType)
                   .eq(RateLimit::getTargetValue, targetValue)
                   .eq(RateLimit::getStatus, 1);
        
        RateLimit config = rateLimitMapper.selectOne(queryWrapper);
        
        if (config == null) {
            return true;
        }

        return switch (config.getLimitType()) {
            case 1 -> checkQpsLimit(config);
            case 2 -> checkDailyLimit(config);
            case 3 -> checkMonthlyLimit(config);
            default -> true;
        };
    }

    private boolean checkQpsLimit(RateLimit config) {
        String key = QPS_KEY_PREFIX + config.getTargetType() + ":" + config.getTargetValue();
        Long count = redisTemplate.opsForValue().increment(key);
        
        if (count != null && count == 1) {
            redisTemplate.expire(key, 1, TimeUnit.SECONDS);
        }
        
        return count == null || count <= config.getLimitValue();
    }

    private boolean checkDailyLimit(RateLimit config) {
        String key = DAILY_KEY_PREFIX + config.getTargetType() + ":" + config.getTargetValue() 
                    + ":" + LocalDate.now();
        Long count = redisTemplate.opsForValue().increment(key);
        
        if (count != null && count == 1) {
            redisTemplate.expire(key, 1, TimeUnit.DAYS);
        }
        
        return count == null || count <= config.getLimitValue();
    }

    private boolean checkMonthlyLimit(RateLimit config) {
        YearMonth yearMonth = YearMonth.now();
        String key = MONTHLY_KEY_PREFIX + config.getTargetType() + ":" + config.getTargetValue() 
                    + ":" + yearMonth;
        Long count = redisTemplate.opsForValue().increment(key);
        
        if (count != null && count == 1) {
            redisTemplate.expire(key, yearMonth.lengthOfMonth(), TimeUnit.DAYS);
        }
        
        return count == null || count <= config.getLimitValue();
    }
}
