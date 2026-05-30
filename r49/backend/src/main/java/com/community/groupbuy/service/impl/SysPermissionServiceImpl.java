package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.community.groupbuy.entity.SysPermission;
import com.community.groupbuy.entity.SysRolePermission;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.SysPermissionMapper;
import com.community.groupbuy.mapper.SysRolePermissionMapper;
import com.community.groupbuy.service.SysPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysPermissionServiceImpl implements SysPermissionService {

    private final SysPermissionMapper sysPermissionMapper;
    private final SysRolePermissionMapper sysRolePermissionMapper;

    @Override
    public List<SysPermission> tree() {
        List<SysPermission> allPermissions = sysPermissionMapper.selectList(
                new LambdaQueryWrapper<SysPermission>().orderByAsc(SysPermission::getSort)
        );

        Map<Long, List<SysPermission>> childrenMap = allPermissions.stream()
                .collect(Collectors.groupingBy(p -> p.getParentId() == null ? 0L : p.getParentId()));

        List<SysPermission> rootPermissions = allPermissions.stream()
                .filter(p -> p.getParentId() == null || p.getParentId() == 0)
                .collect(Collectors.toList());

        buildTree(rootPermissions, childrenMap);

        return rootPermissions;
    }

    @Override
    public List<SysPermission> list() {
        LambdaQueryWrapper<SysPermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(SysPermission::getSort);
        return sysPermissionMapper.selectList(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(SysPermission sysPermission) {
        if (sysPermission.getParentId() == null) {
            sysPermission.setParentId(0L);
        }
        if (sysPermission.getSort() == null) {
            sysPermission.setSort(0);
        }
        sysPermissionMapper.insert(sysPermission);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(SysPermission sysPermission) {
        if (sysPermission.getId() == null) {
            throw new BusinessException("权限ID不能为空");
        }
        SysPermission existingPermission = sysPermissionMapper.selectById(sysPermission.getId());
        if (existingPermission == null) {
            throw new BusinessException("权限不存在");
        }

        if (sysPermission.getId().equals(sysPermission.getParentId())) {
            throw new BusinessException("不能将自己设为父级权限");
        }

        sysPermissionMapper.updateById(sysPermission);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (id == null) {
            throw new BusinessException("权限ID不能为空");
        }

        LambdaQueryWrapper<SysPermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysPermission::getParentId, id);
        if (sysPermissionMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("该权限下存在子权限，无法删除");
        }

        LambdaQueryWrapper<SysRolePermission> rolePermissionWrapper = new LambdaQueryWrapper<>();
        rolePermissionWrapper.eq(SysRolePermission::getPermissionId, id);
        if (sysRolePermissionMapper.selectCount(rolePermissionWrapper) > 0) {
            throw new BusinessException("该权限已分配给角色，无法删除");
        }

        sysPermissionMapper.deleteById(id);
    }

    private void buildTree(List<SysPermission> permissions, Map<Long, List<SysPermission>> childrenMap) {
        for (SysPermission permission : permissions) {
            List<SysPermission> children = childrenMap.getOrDefault(permission.getId(), new ArrayList<>());
            if (!children.isEmpty()) {
                buildTree(children, childrenMap);
            }
        }
    }
}
