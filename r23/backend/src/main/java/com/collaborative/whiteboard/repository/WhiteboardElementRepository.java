package com.collaborative.whiteboard.repository;

import com.collaborative.whiteboard.entity.WhiteboardElement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WhiteboardElementRepository extends JpaRepository<WhiteboardElement, String> {
    List<WhiteboardElement> findByRoomId(String roomId);
}
