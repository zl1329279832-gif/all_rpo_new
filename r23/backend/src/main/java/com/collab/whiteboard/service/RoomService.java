package com.collab.whiteboard.service;

import com.collab.whiteboard.entity.Room;
import com.collab.whiteboard.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    @Transactional
    public Room createRoom(String name, String description, String createdBy) {
        Room room = Room.builder()
                .id(UUID.randomUUID().toString().substring(0, 8))
                .name(name)
                .description(description)
                .createdBy(createdBy)
                .isActive(true)
                .build();
        return roomRepository.save(room);
    }

    @Transactional(readOnly = true)
    public Optional<Room> getRoom(String roomId) {
        return roomRepository.findByIdAndIsActiveTrue(roomId);
    }

    @Transactional(readOnly = true)
    public List<Room> getAllActiveRooms() {
        return roomRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }

    @Transactional
    public void deactivateRoom(String roomId) {
        roomRepository.findById(roomId).ifPresent(room -> {
            room.setIsActive(false);
            roomRepository.save(room);
        });
    }

    @Transactional
    public Room updateRoom(String roomId, String name, String description) {
        return roomRepository.findById(roomId).map(room -> {
            room.setName(name);
            room.setDescription(description);
            return roomRepository.save(room);
        }).orElseThrow(() -> new RuntimeException("Room not found: " + roomId));
    }
}
