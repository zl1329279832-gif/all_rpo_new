package com.example.componentconfig.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "component_config")
public class ComponentConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "component_type", nullable = false, length = 50)
    private String componentType;

    @Column(name = "default_value", length = 500)
    private String defaultValue;

    @Column(name = "is_required")
    private Boolean isRequired = false;

    @Column(name = "validation_rule", length = 500)
    private String validationRule;

    @Column(name = "placeholder", length = 200)
    private String placeholder;

    @Column(name = "options", columnDefinition = "TEXT")
    private String options;

    @Column(name = "api_url", length = 500)
    private String apiUrl;

    @Column(name = "api_method", length = 10)
    private String apiMethod;

    @Column(name = "api_headers", columnDefinition = "TEXT")
    private String apiHeaders;

    @Column(name = "api_params", columnDefinition = "TEXT")
    private String apiParams;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
