package com.chat.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chat.dto.LoginDTO;
import com.chat.dto.RegisterDTO;
import com.chat.entity.User;
import com.chat.vo.LoginVO;
import com.chat.vo.UserVO;

import java.util.List;

public interface UserService extends IService<User> {

    LoginVO login(LoginDTO dto);

    void register(RegisterDTO dto);

    void logout(Long userId);

    UserVO getUserInfo(Long userId);

    List<UserVO> searchUsers(String keyword);

    void updateOnlineStatus(Long userId, boolean online);

    boolean isOnline(Long userId);

    List<UserVO> getOnlineUsers();
}
