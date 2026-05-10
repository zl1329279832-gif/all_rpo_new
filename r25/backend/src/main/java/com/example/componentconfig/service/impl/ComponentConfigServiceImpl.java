package com.example.componentconfig.service.impl;

import cn.hutool.core.util.StrUtil;
import com.example.componentconfig.common.PageResult;
import com.example.componentconfig.entity.ComponentConfig;
import com.example.componentconfig.repository.ComponentConfigRepository;
import com.example.componentconfig.service.ComponentConfigService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ComponentConfigServiceImpl implements ComponentConfigService {

    private final ComponentConfigRepository componentConfigRepository;

    @Override
    public PageResult<ComponentConfig> list(int current, int size, String keyword, String componentType) {
        Pageable pageable = PageRequest.of(current - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<ComponentConfig> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StrUtil.isNotBlank(keyword)) {
                Predicate nameLike = cb.like(root.get("name"), "%" + keyword + "%");
                Predicate descLike = cb.like(root.get("description"), "%" + keyword + "%");
                predicates.add(cb.or(nameLike, descLike));
            }

            if (StrUtil.isNotBlank(componentType)) {
                predicates.add(cb.equal(root.get("componentType"), componentType));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ComponentConfig> page = componentConfigRepository.findAll(spec, pageable);
        return PageResult.of(page.getContent(), page.getTotalElements(), current, size);
    }

    @Override
    public Optional<ComponentConfig> getById(String id) {
        return componentConfigRepository.findById(id);
    }

    @Override
    @Transactional
    public ComponentConfig create(ComponentConfig config) {
        return componentConfigRepository.save(config);
    }

    @Override
    @Transactional
    public ComponentConfig update(String id, ComponentConfig config) {
        ComponentConfig existing = componentConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("组件配置不存在"));

        existing.setName(config.getName());
        existing.setDescription(config.getDescription());
        existing.setComponentType(config.getComponentType());
        existing.setDefaultValue(config.getDefaultValue());
        existing.setIsRequired(config.getIsRequired());
        existing.setValidationRule(config.getValidationRule());
        existing.setPlaceholder(config.getPlaceholder());
        existing.setOptions(config.getOptions());
        existing.setApiUrl(config.getApiUrl());
        existing.setApiMethod(config.getApiMethod());
        existing.setApiHeaders(config.getApiHeaders());
        existing.setApiParams(config.getApiParams());

        return componentConfigRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(String id) {
        componentConfigRepository.deleteById(id);
    }
}
