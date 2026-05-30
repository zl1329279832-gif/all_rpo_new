package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.entity.SysRole;
import com.community.groupbuy.entity.SysRolePermission;
import com.community.groupbuy.entity.SysUserRole;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.SysRoleMapper;
import com.community.groupbuy.mapper.SysRolePermissionMapper;
import com.community.groupbuy.mapper.SysUserRoleMapper;
import com.community.groupbuy.service.SysRoleService;
import com.community.groupbuy.vo.SysRoleVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysRoleServiceImpl implements SysRoleService {

    private final SysRoleMapper sysRoleMapper;
    private final SysRolePermissionMapper sysRolePermissionMapper;
    private final SysUserRoleMapper sysUserRoleMapper;

    @Override
    public PageResult<SysRoleVO> page(String roleName, Integer status, Long current, Long size) {
        Page<SysRole> page = new Page<>(current, size);
        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(roleName)) {
            wrapper.like(SysRole::getRoleName, roleName);
        }
        if (status != null) {
            wrapper.eq(SysRole::getStatus, status);
        }
        wrapper.orderByAsc(SysRole::getSort);

        Page<SysRole> rolePage = sysRoleMapper.selectPage(page, wrapper);
        List<SysRoleVO> voList = rolePage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(voList, rolePage.getTotal(), rolePage.getCurrent(), rolePage.getSize());
    }

    @Override
    public List<SysRole> list() {
        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysRole::getStatus, 0);
        wrapper.orderByAsc(SysRole::getSort);
        return sysRoleMapper.selectList(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(SysRole sysRole) {
        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysRole::getRoleCode, sysRole.getRoleCode());
        if (sysRoleMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("角色编码已存在");
        }
        sysRoleMapper.insert(sysRole);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(SysRole sysRole) {
        if (sysRole.getId() == null) {
            throw new BusinessException("角色ID不能为空");
        }
        SysRole existingRole = sysRoleMapper.selectById(sysRole.getId());
        if (existingRole == null) {
            throw new BusinessException("角色不存在");
        }

        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysRole::getRoleCode, sysRole.getRoleCode())
                .ne(SysRole::getId, sysRole.getId());
        if (sysRoleMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("角色编码已存在");
        }

        sysRoleMapper.updateById(sysRole);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (id == null) {
            throw new BusinessException("角色ID不能为空");
        }
        if (id == 1) {
            throw new BusinessException("超级管理员角色不能删除");
        }

        LambdaQueryWrapper<SysUserRole> userRoleWrapper = new LambdaQueryWrapper<>();
        userRoleWrapper.eq(SysUserRole::getRoleId, id);
        if (sysUserRoleMapper.selectCount(userRoleWrapper) > 0) {
            throw new BusinessException("该角色下存在用户，无法删除");
        }

        sysRoleMapper.deleteById(id);

        LambdaQueryWrapper<SysRolePermission> permissionWrapper = new LambdaQueryWrapper<>();
        permissionWrapper.eq(SysRolePermission::getRoleId, id);
        sysRolePermissionMapper.delete(permissionWrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteBatch(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new BusinessException("角色ID不能为空");
        }
        if (ids.contains(1L)) {
            throw new BusinessException("超级管理员角色不能删除");
        }

        LambdaQueryWrapper<SysUserRole> userRoleWrapper = new LambdaQueryWrapper<>();
        userRoleWrapper.in(SysUserRole::getRoleId, ids);
        if (sysUserRoleMapper.selectCount(userRoleWrapper) > 0) {
            throw new BusinessException("选中的角色下存在用户，无法删除");
        }

        sysRoleMapper.deleteBatchIds(ids);

        LambdaQueryWrapper<SysRolePermission> permissionWrapper = new LambdaQueryWrapper<>();
        permissionWrapper.in(SysRolePermission::getRoleId, ids);
        sysRolePermissionMapper.delete(permissionWrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assignPermissions(Long roleId, List<Long> permissionIds) {
        if (roleId == null) {
            throw new BusinessException("角色ID不能为空");
        }
        SysRole sysRole = sysRoleMapper.selectById(roleId);
        if (sysRole == null) {
            throw new BusinessException("角色不存在");
        }

        LambdaQueryWrapper<SysRolePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysRolePermission::getRoleId, roleId);
        sysRolePermissionMapper.delete(wrapper);

        if (permissionIds != null && !permissionIds.isEmpty()) {
            for (Long permissionId : permissionIds) {
                SysRolePermission rolePermission = new SysRolePermission();
                rolePermission.setRoleId(roleId);
                rolePermission.setPermissionId(permissionId);
                sysRolePermissionMapper.insert(rolePermission);
            }
        }
    }

    private SysRoleVO convertToVO(SysRole sysRole) {
        SysRoleVO vo = new SysRoleVO();
        vo.setId(sysRole.getId());
        vo.setRoleName(sysRole.getRoleName());
        vo.setRoleCode(sysRole.getRoleCode());
        vo.setSort(sysRole.getSort());
        vo.setStatus(sysRole.getStatus());
        vo.setRemark(sysRole.getRemark());
        vo.setCreateTime(sysRole.getCreateTime());

        LambdaQueryWrapper<SysRolePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysRolePermission::getRoleId, sysRole.getId());
        List<SysRolePermission> rolePermissions = sysRolePermissionMapper.selectList(wrapper);
        List<Long> permissionIds = rolePermissions.stream()
                .map(SysRolePermission::getPermissionId)
                .collect(Collectors.toList());
        vo.setPermissionIds(permissionIds);

        return vo;
    }
}
