package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.entity.SysRole;
import com.community.groupbuy.vo.SysRoleVO;

import java.util.List;

public interface SysRoleService {

    PageResult<SysRoleVO> page(String roleName, Integer status, Long current, Long size);

    List<SysRole> list();

    void add(SysRole sysRole);

    void update(SysRole sysRole);

    void delete(Long id);

    void deleteBatch(List<Long> ids);

    void assignPermissions(Long roleId, List<Long> permissionIds);
}
