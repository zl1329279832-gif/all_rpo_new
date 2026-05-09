package com.collaborative.whiteboard.controller;

import com.collaborative.whiteboard.dto.MemberDTO;
import com.collaborative.whiteboard.entity.RoomMember;
import com.collaborative.whiteboard.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms/{roomId}/members")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoomMemberController {

    private final PermissionService permissionService;

    @GetMapping
    public ResponseEntity<List<MemberDTO>> getRoomMembers(
            @PathVariable String roomId,
            @RequestParam(required = false) String userId) {
        if (!permissionService.isMember(roomId, userId)) {
            return ResponseEntity.status(403).build();
        }
        List<MemberDTO> members = permissionService.getRoomMembers(roomId).stream()
                .map(MemberDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(members);
    }

    @PostMapping("/invite")
    public ResponseEntity<MemberDTO> inviteMember(
            @PathVariable String roomId,
            @RequestBody Map<String, String> request,
            @RequestParam(required = false) String requesterId) {
        if (!permissionService.isOwner(roomId, requesterId)) {
            return ResponseEntity.status(403).build();
        }

        String userId = request.get("userId");
        String username = request.getOrDefault("username", "用户");
        String roleStr = request.getOrDefault("role", "VIEWER");

        RoomMember.Role role;
        try {
            role = RoomMember.Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            role = RoomMember.Role.VIEWER;
        }

        RoomMember member = permissionService.addMember(roomId, userId, username, role);
        return ResponseEntity.ok(MemberDTO.fromEntity(member));
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<MemberDTO> updateMemberRole(
            @PathVariable String roomId,
            @PathVariable String userId,
            @RequestBody Map<String, String> request,
            @RequestParam(required = false) String requesterId) {
        if (!permissionService.isOwner(roomId, requesterId)) {
            return ResponseEntity.status(403).build();
        }

        String roleStr = request.get("role");
        RoomMember.Role role;
        try {
            role = RoomMember.Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        RoomMember member = permissionService.updateMemberRole(roomId, userId, role);
        return ResponseEntity.ok(MemberDTO.fromEntity(member));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable String roomId,
            @PathVariable String userId,
            @RequestParam(required = false) String requesterId) {
        if (!permissionService.isOwner(roomId, requesterId)) {
            return ResponseEntity.status(403).build();
        }

        try {
            permissionService.removeMember(roomId, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<MemberDTO> getMyRole(
            @PathVariable String roomId,
            @RequestParam(required = false) String userId) {
        RoomMember.Role role = permissionService.getUserRole(roomId, userId);
        if (role == null) {
            return ResponseEntity.notFound().build();
        }

        MemberDTO dto = MemberDTO.builder()
                .userId(userId)
                .role(role.name())
                .build();
        return ResponseEntity.ok(dto);
    }
}
