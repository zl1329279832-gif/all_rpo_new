package com.example.componentconfig.service;

import com.example.componentconfig.common.PageResult;
import com.example.componentconfig.entity.ComponentConfig;
import org.springframework.data.domain.Page;

import java.util.Optional;

public interface ComponentConfigService {
    PageResult<ComponentConfig> list(int current, int size, String keyword, String componentType);
    Optional<ComponentConfig> getById(String id);
    ComponentConfig create(ComponentConfig config);
    ComponentConfig update(String id, ComponentConfig config);
    void delete(String id);
}
