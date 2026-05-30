package com.community.groupbuy.service;

import com.community.groupbuy.common.PageResult;
import com.community.groupbuy.dto.SysUserQueryDTO;
import com.community.groupbuy.dto.SysUserSaveDTO;
import com.community.groupbuy.vo.SysUserVO;

import java.util.List;

public interface SysUserService {

    PageResult<SysUserVO> page(SysUserQueryDTO queryDTO, Long current, Long size);

    void add(SysUserSaveDTO saveDTO);

    void update(SysUserSaveDTO saveDTO);

    void delete(Long id);

    void deleteBatch(List<Long> ids);

    void resetPassword(Long id);

    void assignRoles(Long userId, List<Long> roleIds);
}
