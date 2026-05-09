package com.collaborative.whiteboard.repository;

import com.collaborative.whiteboard.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

    Optional<RoomMember> findByRoomIdAndUserId(String roomId, String userId);

    List<RoomMember> findByRoomId(String roomId);

    void deleteByRoomIdAndUserId(String roomId, String userId);

    boolean existsByRoomIdAndUserId(String roomId, String userId);

    long countByRoomId(String roomId);
}
