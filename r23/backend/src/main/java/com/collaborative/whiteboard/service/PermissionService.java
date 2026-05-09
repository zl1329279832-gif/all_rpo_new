package com.collaborative.whiteboard.service;

import com.collaborative.whiteboard.entity.RoomMember;
import com.collaborative.whiteboard.repository.RoomMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final RoomMemberRepository memberRepository;

    public RoomMember.Role getUserRole(String roomId, String userId) {
        return memberRepository.findByRoomIdAndUserId(roomId, userId)
                .map(RoomMember::getRole)
                .orElse(null);
    }

    public boolean isOwner(String roomId, String userId) {
        RoomMember.Role role = getUserRole(roomId, userId);
        return role == RoomMember.Role.OWNER;
    }

    public boolean canEdit(String roomId, String userId) {
        RoomMember.Role role = getUserRole(roomId, userId);
        return role == RoomMember.Role.OWNER || role == RoomMember.Role.EDITOR;
    }

    public boolean canView(String roomId, String userId) {
        RoomMember.Role role = getUserRole(roomId, userId);
        return role != null;
    }

    @Transactional
    public RoomMember addMember(String roomId, String userId, String username, RoomMember.Role role) {
        Optional<RoomMember> existing = memberRepository.findByRoomIdAndUserId(roomId, userId);
        if (existing.isPresent()) {
            RoomMember member = existing.get();
            member.setUsername(username);
            member.setRole(role);
            return memberRepository.save(member);
        }

        RoomMember member = new RoomMember();
        member.setRoomId(roomId);
        member.setUserId(userId);
        member.setUsername(username);
        member.setRole(role);
        return memberRepository.save(member);
    }

    @Transactional
    public RoomMember updateMemberRole(String roomId, String userId, RoomMember.Role newRole) {
        RoomMember member = memberRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (member.getRole() == RoomMember.Role.OWNER && newRole != RoomMember.Role.OWNER) {
            throw new RuntimeException("Cannot demote owner");
        }

        member.setRole(newRole);
        return memberRepository.save(member);
    }

    @Transactional
    public void removeMember(String roomId, String userId) {
        RoomMember member = memberRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (member.getRole() == RoomMember.Role.OWNER) {
            throw new RuntimeException("Cannot remove owner");
        }

        memberRepository.deleteByRoomIdAndUserId(roomId, userId);
    }

    public List<RoomMember> getRoomMembers(String roomId) {
        return memberRepository.findByRoomId(roomId);
    }

    public boolean isMember(String roomId, String userId) {
        return memberRepository.existsByRoomIdAndUserId(roomId, userId);
    }
}
