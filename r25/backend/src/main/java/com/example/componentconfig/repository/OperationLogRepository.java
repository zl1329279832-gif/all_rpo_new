package com.example.componentconfig.repository;

import com.example.componentconfig.entity.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, String>, JpaSpecificationExecutor<OperationLog> {
}
