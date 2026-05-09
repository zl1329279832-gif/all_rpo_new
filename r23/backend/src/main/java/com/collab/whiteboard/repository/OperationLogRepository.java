package com.collab.whiteboard.repository;

import com.collab.whiteboard.entity.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, Long> {
    List<OperationLog> findByRoomIdOrderByCreatedAtAsc(String roomId);
    List<OperationLog> findByRoomIdAndCreatedAtBetweenOrderByCreatedAtAsc(String roomId, LocalDateTime start, LocalDateTime end);
    List<OperationLog> findByUserIdOrderByCreatedAtDesc(String userId);
}
