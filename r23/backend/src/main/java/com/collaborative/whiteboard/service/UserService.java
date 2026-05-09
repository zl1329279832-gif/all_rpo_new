package com.collaborative.whiteboard.service;

import com.collaborative.whiteboard.dto.UserInfo;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String USER_KEY_PREFIX = "whiteboard:room:";
    private static final String[] COLORS = {
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
        "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
        "#BB8FCE", "#85C1E9", "#F8B500", "#00CED1"
    };

    private final Random random = new Random();

    public String getRandomColor() {
        return COLORS[random.nextInt(COLORS.length)];
    }

    public void userJoin(String roomId, String userId, String username) {
        String key = USER_KEY_PREFIX + roomId + ":users";
        UserInfo userInfo = new UserInfo(userId, username, getRandomColor(), System.currentTimeMillis());
        try {
            redisTemplate.opsForHash().put(key, userId, objectMapper.writeValueAsString(userInfo));
            log.debug("User {} joined room {}", userId, roomId);
        } catch (JsonProcessingException e) {
            log.error("Error serializing user info", e);
        }
    }

    public void userLeave(String roomId, String userId) {
        String key = USER_KEY_PREFIX + roomId + ":users";
        redisTemplate.opsForHash().delete(key, userId);
        log.debug("User {} left room {}", userId, roomId);
    }

    public List<UserInfo> getOnlineUsers(String roomId) {
        String key = USER_KEY_PREFIX + roomId + ":users";
        Set<Object> userIds = redisTemplate.opsForHash().keys(key);
        List<UserInfo> users = new ArrayList<>();

        for (Object userId : userIds) {
            Object userData = redisTemplate.opsForHash().get(key, userId);
            if (userData != null) {
                try {
                    UserInfo userInfo = objectMapper.readValue((String) userData, UserInfo.class);
                    users.add(userInfo);
                } catch (JsonProcessingException e) {
                    log.error("Error deserializing user info", e);
                }
            }
        }

        return users;
    }
}
