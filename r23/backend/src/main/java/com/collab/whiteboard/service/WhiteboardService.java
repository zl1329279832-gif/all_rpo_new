package com.collab.whiteboard.service;

import com.collab.whiteboard.entity.WhiteboardElement;
import com.collab.whiteboard.repository.WhiteboardElementRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhiteboardService {

    private final WhiteboardElementRepository elementRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public <T> WhiteboardElement saveElement(String roomId, String elementId, 
            WhiteboardElement.ElementType type, T payload, String createdBy) {
        try {
            String data = objectMapper.writeValueAsString(payload);
            WhiteboardElement element = WhiteboardElement.builder()
                    .id(elementId)
                    .roomId(roomId)
                    .type(type)
                    .data(data)
                    .createdBy(createdBy)
                    .isDeleted(false)
                    .build();
            return elementRepository.save(element);
        } catch (JsonProcessingException e) {
            log.error("Error serializing element payload", e);
            throw new RuntimeException("Failed to serialize element", e);
        }
    }

    @Transactional
    public void deleteElement(String elementId) {
        elementRepository.findById(elementId).ifPresent(element -> {
            element.setIsDeleted(true);
            elementRepository.save(element);
        });
    }

    @Transactional
    public void clearRoomElements(String roomId) {
        elementRepository.findByRoomIdAndIsDeletedFalse(roomId).forEach(element -> {
            element.setIsDeleted(true);
            elementRepository.save(element);
        });
    }

    @Transactional(readOnly = true)
    public List<WhiteboardElement> getRoomElements(String roomId) {
        return elementRepository.findByRoomIdAndIsDeletedFalse(roomId);
    }

    @Transactional(readOnly = true)
    public Optional<WhiteboardElement> getElement(String elementId) {
        return elementRepository.findByIdAndIsDeletedFalse(elementId);
    }

    @Transactional
    public <T> WhiteboardElement updateElementData(String elementId, T payload) {
        return elementRepository.findById(elementId).map(element -> {
            try {
                element.setData(objectMapper.writeValueAsString(payload));
                return elementRepository.save(element);
            } catch (JsonProcessingException e) {
                log.error("Error serializing element payload", e);
                throw new RuntimeException("Failed to serialize element", e);
            }
        }).orElseThrow(() -> new RuntimeException("Element not found: " + elementId));
    }
}
