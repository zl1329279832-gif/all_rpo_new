package com.collab.whiteboard.repository;

import com.collab.whiteboard.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, String> {
    Optional<Room> findByIdAndIsActiveTrue(String id);
    List<Room> findByIsActiveTrueOrderByCreatedAtDesc();
}
