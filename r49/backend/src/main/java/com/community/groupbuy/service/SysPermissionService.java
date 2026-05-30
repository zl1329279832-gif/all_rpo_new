package com.community.groupbuy.service;

import com.community.groupbuy.entity.SysPermission;

import java.util.List;

public interface SysPermissionService {

    List<SysPermission> tree();

    List<SysPermission> list();

    void add(SysPermission sysPermission);

    void update(SysPermission sysPermission);

    void delete(Long id);
}
