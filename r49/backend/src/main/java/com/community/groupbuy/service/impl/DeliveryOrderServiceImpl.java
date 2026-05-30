package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.DeliveryCreateDTO;
import com.community.groupbuy.dto.DeliveryQueryDTO;
import com.community.groupbuy.entity.DeliveryItem;
import com.community.groupbuy.entity.DeliveryOrder;
import com.community.groupbuy.entity.WarehouseSort;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.DeliveryItemMapper;
import com.community.groupbuy.mapper.DeliveryOrderMapper;
import com.community.groupbuy.mapper.WarehouseSortMapper;
import com.community.groupbuy.service.DeliveryOrderService;
import com.community.groupbuy.vo.DeliveryItemVO;
import com.community.groupbuy.vo.DeliveryOrderVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryOrderServiceImpl implements DeliveryOrderService {

    private final DeliveryOrderMapper deliveryOrderMapper;
    private final DeliveryItemMapper deliveryItemMapper;
    private final WarehouseSortMapper warehouseSortMapper;

    @Override
    public PageResult<DeliveryOrderVO> page(DeliveryQueryDTO queryDTO) {
        LambdaQueryWrapper<DeliveryOrder> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(queryDTO.getDeliveryNo())) {
            wrapper.like(DeliveryOrder::getDeliveryNo, queryDTO.getDeliveryNo());
        }
        if (queryDTO.getRouteId() != null) {
            wrapper.eq(DeliveryOrder::getRouteId, queryDTO.getRouteId());
        }
        if (queryDTO.getDriverId() != null) {
            wrapper.eq(DeliveryOrder::getDriverId, queryDTO.getDriverId());
        }
        if (queryDTO.getActivityId() != null) {
            wrapper.eq(DeliveryOrder::getActivityId, queryDTO.getActivityId());
        }
        if (queryDTO.getDeliveryStatus() != null) {
            wrapper.eq(DeliveryOrder::getDeliveryStatus, queryDTO.getDeliveryStatus());
        }
        if (queryDTO.getStartTime() != null) {
            wrapper.ge(DeliveryOrder::getCreateTime, queryDTO.getStartTime());
        }
        if (queryDTO.getEndTime() != null) {
            wrapper.le(DeliveryOrder::getCreateTime, queryDTO.getEndTime());
        }
        wrapper.orderByDesc(DeliveryOrder::getCreateTime);

        Page<DeliveryOrder> page = deliveryOrderMapper.selectPage(
                new Page<>(queryDTO.getPageNum(), queryDTO.getPageSize()), wrapper);
        List<DeliveryOrderVO> voList = page.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(voList, page.getTotal(), queryDTO.getPageNum().longValue(), queryDTO.getPageSize().longValue());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createDelivery(DeliveryCreateDTO dto) {
        LambdaQueryWrapper<WarehouseSort> sortWrapper = new LambdaQueryWrapper<>();
        sortWrapper.eq(WarehouseSort::getActivityId, dto.getActivityId());
        WarehouseSort sort = warehouseSortMapper.selectOne(sortWrapper);
        if (sort == null || sort.getSortStatus() != 2) {
            throw new BusinessException("分拣未完成，无法创建配送单");
        }

        LambdaQueryWrapper<DeliveryOrder> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.eq(DeliveryOrder::getActivityId, dto.getActivityId());
        if (deliveryOrderMapper.selectCount(orderWrapper) > 0) {
            throw new BusinessException("该活动已创建配送单");
        }

        DeliveryOrder order = new DeliveryOrder();
        BeanUtils.copyProperties(dto, order);
        order.setDeliveryStatus(0);
        order.setShortageQuantity(0);
        deliveryOrderMapper.insert(order);

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            int totalQuantity = 0;
            for (DeliveryCreateDTO.DeliveryItemDTO itemDTO : dto.getItems()) {
                DeliveryItem item = new DeliveryItem();
                BeanUtils.copyProperties(itemDTO, item);
                item.setDeliveryId(order.getId());
                item.setActualQuantity(itemDTO.getPlannedQuantity());
                item.setShortageQuantity(0);
                deliveryItemMapper.insert(item);
                totalQuantity += itemDTO.getPlannedQuantity();
            }
            order.setTotalQuantity(totalQuantity);
            order.setTotalOrders((int) dto.getItems().stream()
                    .map(DeliveryCreateDTO.DeliveryItemDTO::getOrderId)
                    .distinct()
                    .count());
            deliveryOrderMapper.updateById(order);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void depart(Long id) {
        if (id == null) {
            throw new BusinessException("配送单ID不能为空");
        }
        DeliveryOrder order = deliveryOrderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("配送单不存在");
        }
        if (order.getDeliveryStatus() != 0) {
            throw new BusinessException("只有待发货状态才能发车");
        }
        order.setDeliveryStatus(1);
        order.setDepartureTime(LocalDateTime.now());
        deliveryOrderMapper.updateById(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void arrive(Long id) {
        if (id == null) {
            throw new BusinessException("配送单ID不能为空");
        }
        DeliveryOrder order = deliveryOrderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("配送单不存在");
        }
        if (order.getDeliveryStatus() != 1) {
            throw new BusinessException("只有配送中状态才能到达");
        }
        order.setDeliveryStatus(2);
        order.setArrivalTime(LocalDateTime.now());
        deliveryOrderMapper.updateById(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void complete(Long id) {
        if (id == null) {
            throw new BusinessException("配送单ID不能为空");
        }
        DeliveryOrder order = deliveryOrderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("配送单不存在");
        }
        if (order.getDeliveryStatus() != 2) {
            throw new BusinessException("只有已到达状态才能完成配送");
        }

        LambdaQueryWrapper<DeliveryItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(DeliveryItem::getDeliveryId, id);
        List<DeliveryItem> items = deliveryItemMapper.selectList(itemWrapper);

        int totalShortage = 0;
        for (DeliveryItem item : items) {
            if (item.getShortageQuantity() != null && item.getShortageQuantity() > 0) {
                if (!StringUtils.hasText(item.getShortageReason())) {
                    throw new BusinessException("商品[" + item.getProductName() + "]缺货必须填写原因");
                }
                totalShortage += item.getShortageQuantity();
            }
        }

        order.setDeliveryStatus(3);
        order.setShortageQuantity(totalShortage);
        deliveryOrderMapper.updateById(order);
    }

    @Override
    public DeliveryOrderVO getDetail(Long id) {
        if (id == null) {
            throw new BusinessException("配送单ID不能为空");
        }
        DeliveryOrder order = deliveryOrderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("配送单不存在");
        }
        DeliveryOrderVO vo = convertToVO(order);

        LambdaQueryWrapper<DeliveryItem> itemWrapper = new LambdaQueryWrapper<>();
        itemWrapper.eq(DeliveryItem::getDeliveryId, id);
        List<DeliveryItem> items = deliveryItemMapper.selectList(itemWrapper);
        List<DeliveryItemVO> itemVOList = items.stream()
                .map(this::convertToItemVO)
                .collect(Collectors.toList());
        vo.setItems(itemVOList);

        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancel(Long id) {
        if (id == null) {
            throw new BusinessException("配送单ID不能为空");
        }
        DeliveryOrder order = deliveryOrderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("配送单不存在");
        }
        if (order.getDeliveryStatus() != 0) {
            throw new BusinessException("只有待发货状态才能取消");
        }
        order.setDeliveryStatus(4);
        deliveryOrderMapper.updateById(order);
    }

    private DeliveryOrderVO convertToVO(DeliveryOrder order) {
        DeliveryOrderVO vo = new DeliveryOrderVO();
        BeanUtils.copyProperties(order, vo);
        vo.setDeliveryStatusName(getStatusName(order.getDeliveryStatus()));
        return vo;
    }

    private String getStatusName(Integer status) {
        if (status == null) {
            return "";
        }
        switch (status) {
            case 0:
                return "待发货";
            case 1:
                return "配送中";
            case 2:
                return "已到达";
            case 3:
                return "已完成";
            case 4:
                return "已取消";
            default:
                return "";
        }
    }

    private DeliveryItemVO convertToItemVO(DeliveryItem item) {
        DeliveryItemVO vo = new DeliveryItemVO();
        BeanUtils.copyProperties(item, vo);
        return vo;
    }
}
