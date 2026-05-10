package com.example.onlinecoursesystem.repository;

import com.example.onlinecoursesystem.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {
    Optional<AssignmentSubmission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);
    List<AssignmentSubmission> findByStudentId(Long studentId);
    
    @Query("SELECT s FROM AssignmentSubmission s WHERE s.assignmentId IN :assignmentIds")
    List<AssignmentSubmission> findByAssignmentIdIn(@Param("assignmentIds") List<Long> assignmentIds);
}
