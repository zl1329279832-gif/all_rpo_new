package com.collaborative.whiteboard.dto;

import com.collaborative.whiteboard.entity.RoomMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberDTO {

    private String userId;
    private String username;
    private String role;

    public static MemberDTO fromEntity(RoomMember member) {
        return MemberDTO.builder()
                .userId(member.getUserId())
                .username(member.getUsername())
                .role(member.getRole().name())
                .build();
    }
}
