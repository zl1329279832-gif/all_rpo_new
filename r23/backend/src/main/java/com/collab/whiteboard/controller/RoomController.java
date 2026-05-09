package com.collab.whiteboard.controller;

import com.collab.whiteboard.entity.Room;
import com.collab.whiteboard.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

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
        return ResponseEntity.ok(roomService.getAllActiveRooms());
    }

    @PutMapping("/{roomId}")
    public ResponseEntity<Room> updateRoom(@PathVariable String roomId, @RequestBody Map<String, String> request) {
        String name = request.getOrDefault("name", "");
        String description = request.getOrDefault("description", "");
        return ResponseEntity.ok(roomService.updateRoom(roomId, name, description));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deactivateRoom(@PathVariable String roomId) {
        roomService.deactivateRoom(roomId);
        return ResponseEntity.noContent().build();
    }
}
