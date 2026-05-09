package com.collab.whiteboard.repository;

import com.collab.whiteboard.entity.WhiteboardElement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WhiteboardElementRepository extends JpaRepository<WhiteboardElement, String> {
    List<WhiteboardElement> findByRoomIdAndIsDeletedFalse(String roomId);
    Optional<WhiteboardElement> findByIdAndIsDeletedFalse(String id);
    void deleteByRoomId(String roomId);
}
