package com.example.componentconfig.repository;

import com.example.componentconfig.entity.RequestHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface RequestHistoryRepository extends JpaRepository<RequestHistory, String>, JpaSpecificationExecutor<RequestHistory> {
    void deleteAll();
}
