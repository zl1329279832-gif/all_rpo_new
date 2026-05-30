package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.entity.DeliveryRoute;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.DeliveryRouteMapper;
import com.community.groupbuy.service.DeliveryRouteService;
import com.community.groupbuy.vo.DeliveryRouteVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryRouteServiceImpl implements DeliveryRouteService {

    private final DeliveryRouteMapper deliveryRouteMapper;

    @Override
    public PageResult<DeliveryRouteVO> page(String routeName, String routeCode, Integer status, Long current, Long size) {
        LambdaQueryWrapper<DeliveryRoute> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(routeName)) {
            wrapper.like(DeliveryRoute::getRouteName, routeName);
        }
        if (StringUtils.hasText(routeCode)) {
            wrapper.eq(DeliveryRoute::getRouteCode, routeCode);
        }
        if (status != null) {
            wrapper.eq(DeliveryRoute::getStatus, status);
        }
        wrapper.orderByDesc(DeliveryRoute::getCreateTime);

        Page<DeliveryRoute> page = deliveryRouteMapper.selectPage(new Page<>(current, size), wrapper);
        List<DeliveryRouteVO> voList = page.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(voList, page.getTotal(), current, size);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(DeliveryRoute deliveryRoute) {
        LambdaQueryWrapper<DeliveryRoute> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DeliveryRoute::getRouteCode, deliveryRoute.getRouteCode());
        if (deliveryRouteMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("路线编码已存在");
        }
        if (deliveryRoute.getStatus() == null) {
            deliveryRoute.setStatus(1);
        }
        deliveryRouteMapper.insert(deliveryRoute);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(DeliveryRoute deliveryRoute) {
        if (deliveryRoute.getId() == null) {
            throw new BusinessException("路线ID不能为空");
        }
        DeliveryRoute existingRoute = deliveryRouteMapper.selectById(deliveryRoute.getId());
        if (existingRoute == null) {
            throw new BusinessException("路线不存在");
        }

        LambdaQueryWrapper<DeliveryRoute> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DeliveryRoute::getRouteCode, deliveryRoute.getRouteCode())
                .ne(DeliveryRoute::getId, deliveryRoute.getId());
        if (deliveryRouteMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("路线编码已存在");
        }

        deliveryRouteMapper.updateById(deliveryRoute);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (id == null) {
            throw new BusinessException("路线ID不能为空");
        }
        DeliveryRoute existingRoute = deliveryRouteMapper.selectById(id);
        if (existingRoute == null) {
            throw new BusinessException("路线不存在");
        }
        deliveryRouteMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void enable(Long id) {
        if (id == null) {
            throw new BusinessException("路线ID不能为空");
        }
        DeliveryRoute route = deliveryRouteMapper.selectById(id);
        if (route == null) {
            throw new BusinessException("路线不存在");
        }
        route.setStatus(1);
        deliveryRouteMapper.updateById(route);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void disable(Long id) {
        if (id == null) {
            throw new BusinessException("路线ID不能为空");
        }
        DeliveryRoute route = deliveryRouteMapper.selectById(id);
        if (route == null) {
            throw new BusinessException("路线不存在");
        }
        route.setStatus(0);
        deliveryRouteMapper.updateById(route);
    }

    private DeliveryRouteVO convertToVO(DeliveryRoute route) {
        DeliveryRouteVO vo = new DeliveryRouteVO();
        BeanUtils.copyProperties(route, vo);
        vo.setStatusName(route.getStatus() == 1 ? "启用" : "禁用");
        return vo;
    }
}
