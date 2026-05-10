package com.example.onlinecoursesystem.repository;

import com.example.onlinecoursesystem.entity.CourseMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseMaterialRepository extends JpaRepository<CourseMaterial, Long> {
    List<CourseMaterial> findByCourseIdOrderBySortOrderAsc(Long courseId);
    void deleteByCourseId(Long courseId);
}
