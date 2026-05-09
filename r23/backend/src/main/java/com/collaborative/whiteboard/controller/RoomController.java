package com.collaborative.whiteboard.controller;

import com.collaborative.whiteboard.dto.UserInfo;
import com.collaborative.whiteboard.entity.Room;
import com.collaborative.whiteboard.service.RoomService;
import com.collaborative.whiteboard.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoomController {

    private final RoomService roomService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Room> createRoom(@RequestBody Map<String, String> request) {
        String name = request.getOrDefault("name", "Untitled Room");
        String description = request.getOrDefault("description", "");
        String createdBy = request.getOrDefault("createdBy", "anonymous");
        
        Room room = roomService.createRoom(name, description, createdBy);
        return ResponseEntity.ok(room);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<Room> getRoom(@PathVariable String roomId) {
        return roomService.getRoom(roomId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/{roomId}/elements")
    public ResponseEntity<List<Map<String, Object>>> getRoomElements(@PathVariable String roomId) {
        return ResponseEntity.ok(roomService.getRoomElements(roomId));
    }

    @GetMapping("/{roomId}/users")
    public ResponseEntity<List<UserInfo>> getOnlineUsers(@PathVariable String roomId) {
        return ResponseEntity.ok(userService.getOnlineUsers(roomId));
    }

    @GetMapping("/{roomId}/init")
    public ResponseEntity<Map<String, Object>> getRoomInitialData(@PathVariable String roomId) {
        Map<String, Object> data = new HashMap<>();
        
        return roomService.getRoom(roomId)
                .map(room -> {
                    data.put("room", room);
                    data.put("elements", roomService.getRoomElements(roomId));
                    data.put("onlineUsers", userService.getOnlineUsers(roomId));
                    return ResponseEntity.ok(data);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
