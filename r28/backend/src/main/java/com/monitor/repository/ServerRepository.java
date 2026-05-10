package com.monitor.repository;

import com.monitor.entity.Server;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ServerRepository extends JpaRepository<Server, Long> {
    Optional<Server> findByIpAddress(String ipAddress);
    List<Server> findByStatus(String status);
    boolean existsByIpAddress(String ipAddress);
    boolean existsByIpAddressAndIdNot(String ipAddress, Long id);
}
