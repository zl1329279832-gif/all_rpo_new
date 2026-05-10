package com.example.onlinecoursesystem.service;

import com.example.onlinecoursesystem.dto.CourseDTO;
import com.example.onlinecoursesystem.entity.Course;
import com.example.onlinecoursesystem.entity.CourseEnrollment;
import com.example.onlinecoursesystem.entity.CourseMaterial;
import com.example.onlinecoursesystem.entity.User;
import com.example.onlinecoursesystem.repository.CourseEnrollmentRepository;
import com.example.onlinecoursesystem.repository.CourseMaterialRepository;
import com.example.onlinecoursesystem.repository.CourseRepository;
import com.example.onlinecoursesystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseEnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseMaterialRepository materialRepository;

    @Cacheable(value = "courses", key = "'all'")
    public List<CourseDTO> getAllCourses() {
        List<Course> courses = courseRepository.findByStatus(1);
        return courses.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Cacheable(value = "course", key = "#id")
    public CourseDTO getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        return convertToDTO(course);
    }

    public CourseDTO createCourse(Course course, Long teacherId) {
        course.setTeacherId(teacherId);
        course.setStatus(1);
        Course saved = courseRepository.save(course);
        return convertToDTO(saved);
    }

    @CacheEvict(value = {"courses", "course"}, key = "#id")
    public CourseDTO updateCourse(Long id, Course courseDetails, Long teacherId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        if (!course.getTeacherId().equals(teacherId)) {
            throw new RuntimeException("无权修改此课程");
        }
        
        course.setTitle(courseDetails.getTitle());
        course.setDescription(courseDetails.getDescription());
        course.setCoverImage(courseDetails.getCoverImage());
        course.setCategory(courseDetails.getCategory());
        
        Course saved = courseRepository.save(course);
        return convertToDTO(saved);
    }

    @Transactional
    @CacheEvict(value = {"courses", "course"}, key = "#id")
    public void deleteCourse(Long id, Long teacherId) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        if (!course.getTeacherId().equals(teacherId)) {
            throw new RuntimeException("无权删除此课程");
        }
        
        materialRepository.deleteByCourseId(id);
        courseRepository.delete(course);
    }

    public List<CourseDTO> getTeacherCourses(Long teacherId) {
        List<Course> courses = courseRepository.findByTeacherId(teacherId);
        return courses.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<CourseDTO> getStudentEnrolledCourses(Long studentId) {
        List<CourseEnrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        List<Long> courseIds = enrollments.stream()
                .filter(e -> e.getStatus() == 1)
                .map(CourseEnrollment::getCourseId)
                .collect(Collectors.toList());
        
        return courseRepository.findAllById(courseIds).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CourseEnrollment enrollCourse(Long courseId, Long studentId) {
        if (enrollmentRepository.existsByCourseIdAndStudentId(courseId, studentId)) {
            throw new RuntimeException("已经选修过此课程");
        }
        
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setCourseId(courseId);
        enrollment.setStudentId(studentId);
        enrollment.setEnrolledAt(LocalDateTime.now());
        enrollment.setProgress(0);
        enrollment.setStatus(1);
        
        return enrollmentRepository.save(enrollment);
    }

    public void unenrollCourse(Long courseId, Long studentId) {
        CourseEnrollment enrollment = enrollmentRepository
                .findByCourseIdAndStudentId(courseId, studentId)
                .orElseThrow(() -> new RuntimeException("未选修此课程"));
        
        enrollment.setStatus(0);
        enrollmentRepository.save(enrollment);
    }

    public List<CourseMaterial> getCourseMaterials(Long courseId) {
        return materialRepository.findByCourseIdOrderBySortOrderAsc(courseId);
    }

    public CourseMaterial addCourseMaterial(CourseMaterial material) {
        return materialRepository.save(material);
    }

    public void deleteCourseMaterial(Long materialId, Long teacherId) {
        CourseMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("资料不存在"));
        
        Course course = courseRepository.findById(material.getCourseId())
                .orElseThrow(() -> new RuntimeException("课程不存在"));
        
        if (!course.getTeacherId().equals(teacherId)) {
            throw new RuntimeException("无权删除此资料");
        }
        
        materialRepository.delete(material);
    }

    private CourseDTO convertToDTO(Course course) {
        CourseDTO dto = new CourseDTO();
        dto.setId(course.getId());
        dto.setTeacherId(course.getTeacherId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setCoverImage(course.getCoverImage());
        dto.setCategory(course.getCategory());
        dto.setStatus(course.getStatus());
        dto.setCreatedAt(course.getCreatedAt());
        dto.setUpdatedAt(course.getUpdatedAt());
        
        userRepository.findById(course.getTeacherId()).ifPresent(teacher -> 
            dto.setTeacherName(teacher.getNickname())
        );
        
        return dto;
    }
}
