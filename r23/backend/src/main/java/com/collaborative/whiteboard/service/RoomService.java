package com.collaborative.whiteboard.service;

import com.collaborative.whiteboard.entity.Room;
import com.collaborative.whiteboard.entity.WhiteboardElement;
import com.collaborative.whiteboard.repository.RoomRepository;
import com.collaborative.whiteboard.repository.WhiteboardElementRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final WhiteboardElementRepository elementRepository;
    private final ObjectMapper objectMapper;

    public Room createRoom(String name, String description, String createdBy) {
        Room room = new Room();
        room.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        room.setName(name);
        room.setDescription(description);
        room.setCreatedBy(createdBy);
        return roomRepository.save(room);
    }

    public Optional<Room> getRoom(String roomId) {
        return roomRepository.findById(roomId);
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    @Transactional
    public void saveElement(String roomId, String elementId, String type, Object data, String userId) {
        try {
            WhiteboardElement element = elementRepository.findById(elementId).orElse(new WhiteboardElement());
            element.setId(elementId);
            element.setRoomId(roomId);
            element.setType(type);
            element.setData(objectMapper.writeValueAsString(data));
            element.setCreatedBy(element.getCreatedBy() != null ? element.getCreatedBy() : userId);
            elementRepository.save(element);
            log.debug("Saved element: {} in room: {}", elementId, roomId);
        } catch (JsonProcessingException e) {
            log.error("Error serializing element data", e);
        }
    }

    @Transactional
    public void deleteElement(String elementId) {
        elementRepository.deleteById(elementId);
        log.debug("Deleted element: {}", elementId);
    }

    public List<Map<String, Object>> getRoomElements(String roomId) {
        List<WhiteboardElement> elements = elementRepository.findByRoomId(roomId);
        return elements.stream().map(element -> {
            try {
                Map<String, Object> result = new HashMap<>();
                result.put("id", element.getId());
                result.put("type", element.getType());
                result.put("data", objectMapper.readValue(element.getData(), Map.class));
                result.put("createdBy", element.getCreatedBy());
                return result;
            } catch (JsonProcessingException e) {
                log.error("Error deserializing element data", e);
                return null;
            }
        }).filter(e -> e != null).toList();
    }
}
