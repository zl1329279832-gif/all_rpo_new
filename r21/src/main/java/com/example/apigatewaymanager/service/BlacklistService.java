package com.example.apigatewaymanager.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.apigatewaymanager.common.ResultCode;
import com.example.apigatewaymanager.dto.BlacklistDTO;
import com.example.apigatewaymanager.entity.Blacklist;
import com.example.apigatewaymanager.exception.BusinessException;
import com.example.apigatewaymanager.mapper.BlacklistMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
public class BlacklistService {

    private final BlacklistMapper blacklistMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public BlacklistService(BlacklistMapper blacklistMapper, RedisTemplate<String, Object> redisTemplate) {
        this.blacklistMapper = blacklistMapper;
        this.redisTemplate = redisTemplate;
    }

    private static final String BLACKLIST_KEY_PREFIX = "blacklist:";

    @Transactional
    public Blacklist addToBlacklist(BlacklistDTO blacklistDTO) {
        LambdaQueryWrapper<Blacklist> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Blacklist::getTargetType, blacklistDTO.getTargetType())
                   .eq(Blacklist::getTargetValue, blacklistDTO.getTargetValue());
        
        Blacklist existing = blacklistMapper.selectOne(queryWrapper);
        if (existing != null) {
            existing.setReason(blacklistDTO.getReason());
            existing.setExpireTime(blacklistDTO.getExpireTime());
            existing.setStatus(1);
            blacklistMapper.updateById(existing);
            cacheBlacklist(existing);
            return existing;
        }

        Blacklist blacklist = new Blacklist();
        blacklist.setTargetType(blacklistDTO.getTargetType());
        blacklist.setTargetValue(blacklistDTO.getTargetValue());
        blacklist.setReason(blacklistDTO.getReason());
        blacklist.setExpireTime(blacklistDTO.getExpireTime());
        blacklist.setStatus(1);

        blacklistMapper.insert(blacklist);
        cacheBlacklist(blacklist);
        return blacklist;
    }

    public Page<Blacklist> listBlacklists(Integer page, Integer size, Integer targetType) {
        Page<Blacklist> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Blacklist> queryWrapper = new LambdaQueryWrapper<>();
        
        if (targetType != null) {
            queryWrapper.eq(Blacklist::getTargetType, targetType);
        }
        queryWrapper.orderByDesc(Blacklist::getCreateTime);
        
        return blacklistMapper.selectPage(pageParam, queryWrapper);
    }

    public Blacklist getBlacklistById(Long id) {
        Blacklist blacklist = blacklistMapper.selectById(id);
        if (blacklist == null) {
            throw new BusinessException("黑名单记录不存在");
        }
        return blacklist;
    }

    @Transactional
    public void removeFromBlacklist(Long id) {
        Blacklist blacklist = getBlacklistById(id);
        blacklistMapper.deleteById(id);
        removeFromCache(blacklist);
    }

    @Transactional
    public void toggleBlacklistStatus(Long id) {
        Blacklist blacklist = getBlacklistById(id);
        blacklist.setStatus(blacklist.getStatus() == 1 ? 0 : 1);
        blacklistMapper.updateById(blacklist);
        
        if (blacklist.getStatus() == 1) {
            cacheBlacklist(blacklist);
        } else {
            removeFromCache(blacklist);
        }
    }

    public boolean isBlacklisted(Integer targetType, String targetValue) {
        String cacheKey = BLACKLIST_KEY_PREFIX + targetType + ":" + targetValue;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (Boolean) cached;
        }

        LambdaQueryWrapper<Blacklist> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Blacklist::getTargetType, targetType)
                   .eq(Blacklist::getTargetValue, targetValue)
                   .eq(Blacklist::getStatus, 1)
                   .and(wrapper -> wrapper
                       .isNull(Blacklist::getExpireTime)
                       .or()
                       .gt(Blacklist::getExpireTime, LocalDateTime.now()));
        
        Blacklist blacklist = blacklistMapper.selectOne(queryWrapper);
        boolean isBlacklisted = blacklist != null;
        
        if (isBlacklisted) {
            cacheBlacklist(blacklist);
        }
        
        return isBlacklisted;
    }

    private void cacheBlacklist(Blacklist blacklist) {
        String cacheKey = BLACKLIST_KEY_PREFIX + blacklist.getTargetType() + ":" + blacklist.getTargetValue();
        
        if (blacklist.getExpireTime() != null) {
            long ttl = java.time.Duration.between(LocalDateTime.now(), blacklist.getExpireTime()).toMillis();
            if (ttl > 0) {
                redisTemplate.opsForValue().set(cacheKey, true, ttl, TimeUnit.MILLISECONDS);
            }
        } else {
            redisTemplate.opsForValue().set(cacheKey, true);
        }
    }

    private void removeFromCache(Blacklist blacklist) {
        String cacheKey = BLACKLIST_KEY_PREFIX + blacklist.getTargetType() + ":" + blacklist.getTargetValue();
        redisTemplate.delete(cacheKey);
    }

    public void validateNotBlacklisted(Integer targetType, String targetValue) {
        if (isBlacklisted(targetType, targetValue)) {
            throw new BusinessException(ResultCode.BLACKLISTED);
        }
    }
}
