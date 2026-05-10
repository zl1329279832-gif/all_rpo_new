package com.monitor.service;

import com.monitor.entity.Server;
import com.monitor.repository.ServerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ServerService {
    
    private final ServerRepository serverRepository;
    
    public ServerService(ServerRepository serverRepository) {
        this.serverRepository = serverRepository;
    }
    
    public List<Server> getAllServers() {
        return serverRepository.findAll();
    }
    
    public Optional<Server> getServerById(Long id) {
        return serverRepository.findById(id);
    }
    
    public Optional<Server> getServerByIpAddress(String ipAddress) {
        return serverRepository.findByIpAddress(ipAddress);
    }
    
    @Transactional
    public Server createServer(Server server) {
        if (serverRepository.existsByIpAddress(server.getIpAddress())) {
            throw new RuntimeException("IP地址已存在");
        }
        return serverRepository.save(server);
    }
    
    @Transactional
    public Server updateServer(Long id, Server serverDetails) {
        return serverRepository.findById(id).map(server -> {
            if (serverDetails.getIpAddress() != null && 
                !serverDetails.getIpAddress().equals(server.getIpAddress()) &&
                serverRepository.existsByIpAddressAndIdNot(serverDetails.getIpAddress(), id)) {
                throw new RuntimeException("IP地址已存在");
            }
            
            if (serverDetails.getName() != null) {
                server.setName(serverDetails.getName());
            }
            if (serverDetails.getIpAddress() != null) {
                server.setIpAddress(serverDetails.getIpAddress());
            }
            if (serverDetails.getHostname() != null) {
                server.setHostname(serverDetails.getHostname());
            }
            if (serverDetails.getOsType() != null) {
                server.setOsType(serverDetails.getOsType());
            }
            if (serverDetails.getOsVersion() != null) {
                server.setOsVersion(serverDetails.getOsVersion());
            }
            if (serverDetails.getCpuCores() != null) {
                server.setCpuCores(serverDetails.getCpuCores());
            }
            if (serverDetails.getTotalMemoryGb() != null) {
                server.setTotalMemoryGb(serverDetails.getTotalMemoryGb());
            }
            if (serverDetails.getTotalDiskGb() != null) {
                server.setTotalDiskGb(serverDetails.getTotalDiskGb());
            }
            if (serverDetails.getStatus() != null) {
                server.setStatus(serverDetails.getStatus());
            }
            if (serverDetails.getDescription() != null) {
                server.setDescription(serverDetails.getDescription());
            }
            
            return serverRepository.save(server);
        }).orElseThrow(() -> new RuntimeException("服务器不存在"));
    }
    
    @Transactional
    public Server updateServerHeartbeat(String ipAddress) {
        Optional<Server> serverOptional = serverRepository.findByIpAddress(ipAddress);
        if (serverOptional.isPresent()) {
            Server server = serverOptional.get();
            server.setLastHeartbeat(LocalDateTime.now());
            if ("OFFLINE".equals(server.getStatus())) {
                server.setStatus("ONLINE");
            }
            return serverRepository.save(server);
        }
        return null;
    }
    
    @Transactional
    public void deleteServer(Long id) {
        serverRepository.deleteById(id);
    }
}
