package com.collaborative.whiteboard.controller;

import com.collaborative.whiteboard.dto.UserInfo;
import com.collaborative.whiteboard.entity.Room;
import com.collaborative.whiteboard.service.PermissionService;
import com.collaborative.whiteboard.service.RoomService;
import com.collaborative.whiteboard.service.UndoRedoService;
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
    private final PermissionService permissionService;
    private final UndoRedoService undoRedoService;

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

    @PutMapping("/{roomId}")
    public ResponseEntity<Room> updateRoom(
            @PathVariable String roomId,
            @RequestBody Map<String, String> request,
            @RequestParam(required = false) String userId) {
        if (!permissionService.isOwner(roomId, userId)) {
            return ResponseEntity.status(403).build();
        }

        return roomService.getRoom(roomId)
                .map(room -> {
                    if (request.containsKey("name")) {
                        room.setName(request.get("name"));
                    }
                    if (request.containsKey("description")) {
                        room.setDescription(request.get("description"));
                    }
                    return ResponseEntity.ok(room);
                })
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

    @GetMapping("/{roomId}/permissions")
    public ResponseEntity<Map<String, Object>> getUserPermissions(
            @PathVariable String roomId,
            @RequestParam(required = false) String userId) {
        Map<String, Object> permissions = new HashMap<>();
        permissions.put("isOwner", permissionService.isOwner(roomId, userId));
        permissions.put("canEdit", permissionService.canEdit(roomId, userId));
        permissions.put("canView", permissionService.canView(roomId, userId));
        permissions.put("role", permissionService.getUserRole(roomId, userId));
        permissions.put("canUndo", undoRedoService.canUndo(roomId));
        permissions.put("canRedo", undoRedoService.canRedo(roomId));
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/{roomId}/init")
    public ResponseEntity<Map<String, Object>> getRoomInitialData(
            @PathVariable String roomId,
            @RequestParam(required = false) String userId) {
        Map<String, Object> data = new HashMap<>();

        return roomService.getRoom(roomId)
                .map(room -> {
                    data.put("room", room);
                    data.put("elements", roomService.getRoomElements(roomId));
                    data.put("onlineUsers", userService.getOnlineUsers(roomId));
                    data.put("permissions", getPermissionsMap(roomId, userId));
                    return ResponseEntity.ok(data);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> getPermissionsMap(String roomId, String userId) {
        Map<String, Object> permissions = new HashMap<>();
        permissions.put("isOwner", permissionService.isOwner(roomId, userId));
        permissions.put("canEdit", permissionService.canEdit(roomId, userId));
        permissions.put("canView", permissionService.canView(roomId, userId));
        permissions.put("role", permissionService.getUserRole(roomId, userId));
        return permissions;
    }
}
