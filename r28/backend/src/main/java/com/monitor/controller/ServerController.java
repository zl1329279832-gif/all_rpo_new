package com.monitor.controller;

import com.monitor.dto.ApiResponse;
import com.monitor.entity.Server;
import com.monitor.service.ServerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/servers")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ServerController {
    
    private final ServerService serverService;
    
    public ServerController(ServerService serverService) {
        this.serverService = serverService;
    }
    
    @GetMapping
    public ApiResponse<List<Server>> getAllServers() {
        return ApiResponse.success(serverService.getAllServers());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Server>> getServerById(@PathVariable Long id) {
        Optional<Server> server = serverService.getServerById(id);
        return server.map(value -> ResponseEntity.ok(ApiResponse.success(value)))
                     .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                             .body(ApiResponse.error("服务器不存在")));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<Server>> createServer(@RequestBody Server server) {
        try {
            Server created = serverService.createServer(server);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("服务器创建成功", created));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<Server>> updateServer(@PathVariable Long id, @RequestBody Server serverDetails) {
        try {
            Server updated = serverService.updateServer(id, serverDetails);
            return ResponseEntity.ok(ApiResponse.success("服务器更新成功", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<ApiResponse<Void>> deleteServer(@PathVariable Long id) {
        serverService.deleteServer(id);
        return ResponseEntity.ok(ApiResponse.success("服务器删除成功", null));
    }
}
