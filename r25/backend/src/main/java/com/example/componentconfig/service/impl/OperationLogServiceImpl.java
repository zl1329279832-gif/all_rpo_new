package com.example.componentconfig.service.impl;

import cn.hutool.core.util.StrUtil;
import com.example.componentconfig.common.PageResult;
import com.example.componentconfig.entity.OperationLog;
import com.example.componentconfig.repository.OperationLogRepository;
import com.example.componentconfig.service.OperationLogService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OperationLogServiceImpl implements OperationLogService {

    private final OperationLogRepository operationLogRepository;

    @Override
    public PageResult<OperationLog> list(int current, int size, String keyword, String module, String action, LocalDateTime startTime, LocalDateTime endTime) {
        Pageable pageable = PageRequest.of(current - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<OperationLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StrUtil.isNotBlank(keyword)) {
                Predicate usernameLike = cb.like(root.get("username"), "%" + keyword + "%");
                Predicate detailLike = cb.like(root.get("detail"), "%" + keyword + "%");
                predicates.add(cb.or(usernameLike, detailLike));
            }

            if (StrUtil.isNotBlank(module)) {
                predicates.add(cb.equal(root.get("module"), module));
            }

            if (StrUtil.isNotBlank(action)) {
                predicates.add(cb.equal(root.get("action"), action));
            }

            if (startTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startTime));
            }

            if (endTime != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endTime));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<OperationLog> page = operationLogRepository.findAll(spec, pageable);
        return PageResult.of(page.getContent(), page.getTotalElements(), current, size);
    }

    @Override
    public Optional<OperationLog> getById(String id) {
        return operationLogRepository.findById(id);
    }

    @Override
    @Transactional
    public void log(String userId, String username, String action, String module, String detail, String ip) {
        OperationLog log = new OperationLog();
        log.setUserId(userId);
        log.setUsername(username);
        log.setAction(action);
        log.setModule(module);
        log.setDetail(detail);
        log.setIp(ip);
        operationLogRepository.save(log);
    }
}
