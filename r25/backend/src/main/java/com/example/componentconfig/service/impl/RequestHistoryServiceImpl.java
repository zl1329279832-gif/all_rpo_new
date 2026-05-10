package com.example.componentconfig.service.impl;

import cn.hutool.core.util.StrUtil;
import com.example.componentconfig.common.PageResult;
import com.example.componentconfig.entity.RequestHistory;
import com.example.componentconfig.repository.RequestHistoryRepository;
import com.example.componentconfig.service.RequestHistoryService;
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
public class RequestHistoryServiceImpl implements RequestHistoryService {

    private final RequestHistoryRepository requestHistoryRepository;

    @Override
    public PageResult<RequestHistory> list(int current, int size, String keyword, String componentId) {
        Pageable pageable = PageRequest.of(current - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<RequestHistory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StrUtil.isNotBlank(keyword)) {
                Predicate componentNameLike = cb.like(root.get("componentName"), "%" + keyword + "%");
                Predicate urlLike = cb.like(root.get("url"), "%" + keyword + "%");
                predicates.add(cb.or(componentNameLike, urlLike));
            }

            if (StrUtil.isNotBlank(componentId)) {
                predicates.add(cb.equal(root.get("componentId"), componentId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<RequestHistory> page = requestHistoryRepository.findAll(spec, pageable);
        return PageResult.of(page.getContent(), page.getTotalElements(), current, size);
    }

    @Override
    public Optional<RequestHistory> getById(String id) {
        return requestHistoryRepository.findById(id);
    }

    @Override
    @Transactional
    public void clearAll() {
        requestHistoryRepository.deleteAll();
    }
}
