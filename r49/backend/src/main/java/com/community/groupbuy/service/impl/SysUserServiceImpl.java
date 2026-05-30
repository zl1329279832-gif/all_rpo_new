package com.community.groupbuy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.SysUserQueryDTO;
import com.community.groupbuy.dto.SysUserSaveDTO;
import com.community.groupbuy.entity.SysRole;
import com.community.groupbuy.entity.SysUser;
import com.community.groupbuy.entity.SysUserRole;
import com.community.groupbuy.exception.BusinessException;
import com.community.groupbuy.mapper.SysRoleMapper;
import com.community.groupbuy.mapper.SysUserMapper;
import com.community.groupbuy.mapper.SysUserRoleMapper;
import com.community.groupbuy.service.SysUserService;
import com.community.groupbuy.vo.SysUserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysUserServiceImpl implements SysUserService {

    private final SysUserMapper sysUserMapper;
    private final SysUserRoleMapper sysUserRoleMapper;
    private final SysRoleMapper sysRoleMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public PageResult<SysUserVO> page(SysUserQueryDTO queryDTO, Long current, Long size) {
        Page<SysUser> page = new Page<>(current, size);
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(queryDTO.getUsername())) {
            wrapper.like(SysUser::getUsername, queryDTO.getUsername());
        }
        if (StringUtils.hasText(queryDTO.getPhone())) {
            wrapper.like(SysUser::getPhone, queryDTO.getPhone());
        }
        if (queryDTO.getStatus() != null) {
            wrapper.eq(SysUser::getStatus, queryDTO.getStatus());
        }
        if (StringUtils.hasText(queryDTO.getStartTime())) {
            wrapper.ge(SysUser::getCreateTime, LocalDateTime.parse(queryDTO.getStartTime(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        if (StringUtils.hasText(queryDTO.getEndTime())) {
            wrapper.le(SysUser::getCreateTime, LocalDateTime.parse(queryDTO.getEndTime(), DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        wrapper.orderByDesc(SysUser::getCreateTime);

        Page<SysUser> userPage = sysUserMapper.selectPage(page, wrapper);
        List<SysUserVO> voList = userPage.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return PageResult.of(voList, userPage.getTotal(), userPage.getCurrent(), userPage.getSize());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(SysUserSaveDTO saveDTO) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, saveDTO.getUsername());
        if (sysUserMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("用户名已存在");
        }

        SysUser sysUser = new SysUser();
        sysUser.setUsername(saveDTO.getUsername());
        sysUser.setPassword(passwordEncoder.encode(saveDTO.getPassword() != null ? saveDTO.getPassword() : "123456"));
        sysUser.setNickname(saveDTO.getNickname());
        sysUser.setPhone(saveDTO.getPhone());
        sysUser.setEmail(saveDTO.getEmail());
        sysUser.setAvatar(saveDTO.getAvatar());
        sysUser.setStatus(saveDTO.getStatus() != null ? saveDTO.getStatus() : 0);
        sysUser.setRemark(saveDTO.getRemark());
        sysUserMapper.insert(sysUser);

        if (saveDTO.getRoleIds() != null && !saveDTO.getRoleIds().isEmpty()) {
            saveUserRoles(sysUser.getId(), saveDTO.getRoleIds());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(SysUserSaveDTO saveDTO) {
        if (saveDTO.getId() == null) {
            throw new BusinessException("用户ID不能为空");
        }
        SysUser existingUser = sysUserMapper.selectById(saveDTO.getId());
        if (existingUser == null) {
            throw new BusinessException("用户不存在");
        }

        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, saveDTO.getUsername())
                .ne(SysUser::getId, saveDTO.getId());
        if (sysUserMapper.selectCount(wrapper) > 0) {
            throw new BusinessException("用户名已存在");
        }

        SysUser sysUser = new SysUser();
        sysUser.setId(saveDTO.getId());
        sysUser.setUsername(saveDTO.getUsername());
        sysUser.setNickname(saveDTO.getNickname());
        sysUser.setPhone(saveDTO.getPhone());
        sysUser.setEmail(saveDTO.getEmail());
        sysUser.setAvatar(saveDTO.getAvatar());
        sysUser.setStatus(saveDTO.getStatus());
        sysUser.setRemark(saveDTO.getRemark());
        sysUserMapper.updateById(sysUser);

        LambdaQueryWrapper<SysUserRole> roleWrapper = new LambdaQueryWrapper<>();
        roleWrapper.eq(SysUserRole::getUserId, saveDTO.getId());
        sysUserRoleMapper.delete(roleWrapper);

        if (saveDTO.getRoleIds() != null && !saveDTO.getRoleIds().isEmpty()) {
            saveUserRoles(saveDTO.getId(), saveDTO.getRoleIds());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        if (id == null) {
            throw new BusinessException("用户ID不能为空");
        }
        if (id == 1) {
            throw new BusinessException("超级管理员不能删除");
        }
        sysUserMapper.deleteById(id);

        LambdaQueryWrapper<SysUserRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUserRole::getUserId, id);
        sysUserRoleMapper.delete(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteBatch(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new BusinessException("用户ID不能为空");
        }
        if (ids.contains(1L)) {
            throw new BusinessException("超级管理员不能删除");
        }
        sysUserMapper.deleteBatchIds(ids);

        LambdaQueryWrapper<SysUserRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(SysUserRole::getUserId, ids);
        sysUserRoleMapper.delete(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(Long id) {
        if (id == null) {
            throw new BusinessException("用户ID不能为空");
        }
        SysUser sysUser = sysUserMapper.selectById(id);
        if (sysUser == null) {
            throw new BusinessException("用户不存在");
        }
        sysUser.setPassword(passwordEncoder.encode("123456"));
        sysUserMapper.updateById(sysUser);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assignRoles(Long userId, List<Long> roleIds) {
        if (userId == null) {
            throw new BusinessException("用户ID不能为空");
        }
        SysUser sysUser = sysUserMapper.selectById(userId);
        if (sysUser == null) {
            throw new BusinessException("用户不存在");
        }

        LambdaQueryWrapper<SysUserRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUserRole::getUserId, userId);
        sysUserRoleMapper.delete(wrapper);

        if (roleIds != null && !roleIds.isEmpty()) {
            saveUserRoles(userId, roleIds);
        }
    }

    private void saveUserRoles(Long userId, List<Long> roleIds) {
        for (Long roleId : roleIds) {
            SysUserRole userRole = new SysUserRole();
            userRole.setUserId(userId);
            userRole.setRoleId(roleId);
            sysUserRoleMapper.insert(userRole);
        }
    }

    private SysUserVO convertToVO(SysUser sysUser) {
        SysUserVO vo = new SysUserVO();
        vo.setId(sysUser.getId());
        vo.setUsername(sysUser.getUsername());
        vo.setNickname(sysUser.getNickname());
        vo.setPhone(sysUser.getPhone());
        vo.setEmail(sysUser.getEmail());
        vo.setAvatar(sysUser.getAvatar());
        vo.setStatus(sysUser.getStatus());
        vo.setRemark(sysUser.getRemark());
        vo.setLoginIp(sysUser.getLoginIp());
        vo.setLoginTime(sysUser.getLoginTime());
        vo.setCreateTime(sysUser.getCreateTime());

        LambdaQueryWrapper<SysUserRole> roleWrapper = new LambdaQueryWrapper<>();
        roleWrapper.eq(SysUserRole::getUserId, sysUser.getId());
        List<SysUserRole> userRoles = sysUserRoleMapper.selectList(roleWrapper);
        List<Long> roleIds = userRoles.stream()
                .map(SysUserRole::getRoleId)
                .collect(Collectors.toList());
        vo.setRoleIds(roleIds);

        if (!roleIds.isEmpty()) {
            List<SysRole> roles = sysRoleMapper.selectBatchIds(roleIds);
            List<String> roleNames = roles.stream()
                    .map(SysRole::getRoleName)
                    .collect(Collectors.toList());
            vo.setRoleNames(roleNames);
        } else {
            vo.setRoleNames(new ArrayList<>());
        }

        return vo;
    }
}
