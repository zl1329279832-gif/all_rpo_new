package com.example.componentconfig.config;

import cn.hutool.json.JSONUtil;
import com.example.componentconfig.entity.ComponentConfig;
import com.example.componentconfig.entity.OperationLog;
import com.example.componentconfig.entity.RequestHistory;
import com.example.componentconfig.repository.ComponentConfigRepository;
import com.example.componentconfig.repository.OperationLogRepository;
import com.example.componentconfig.repository.RequestHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ComponentConfigRepository componentConfigRepository;
    private final RequestHistoryRepository requestHistoryRepository;
    private final OperationLogRepository operationLogRepository;

    @Override
    @SuppressWarnings("deprecation")
    public void run(String... args) {
        if (componentConfigRepository.count() > 0) {
            log.info("数据库已存在数据，跳过初始化");
            return;
        }

        log.info("开始初始化示例数据...");

        ComponentConfig c1 = new ComponentConfig();
        c1.setName("用户名输入框");
        c1.setDescription("用于输入用户名的文本框组件");
        c1.setComponentType("input");
        c1.setDefaultValue("");
        c1.setIsRequired(true);
        c1.setValidationRule("^[a-zA-Z0-9_]{3,20}$");
        c1.setPlaceholder("请输入用户名");
        c1.setOptions("[]");
        c1.setApiUrl("https://jsonplaceholder.typicode.com/users");
        c1.setApiMethod("GET");
        c1.setApiHeaders("{}");
        c1.setApiParams("{}");

        ComponentConfig c2 = new ComponentConfig();
        c2.setName("性别选择");
        c2.setDescription("用户性别下拉选择框");
        c2.setComponentType("select");
        c2.setDefaultValue("");
        c2.setIsRequired(false);
        c2.setValidationRule("");
        c2.setPlaceholder("请选择性别");
        c2.setOptions("[{\"label\":\"男\",\"value\":\"male\"},{\"label\":\"女\",\"value\":\"female\"}]");
        c2.setApiUrl("");
        c2.setApiMethod("GET");
        c2.setApiHeaders("{}");
        c2.setApiParams("{}");

        ComponentConfig c3 = new ComponentConfig();
        c3.setName("用户状态");
        c3.setDescription("用户状态单选框");
        c3.setComponentType("radio");
        c3.setDefaultValue("active");
        c3.setIsRequired(true);
        c3.setValidationRule("");
        c3.setPlaceholder("");
        c3.setOptions("[{\"label\":\"激活\",\"value\":\"active\"},{\"label\":\"禁用\",\"value\":\"inactive\"}]");
        c3.setApiUrl("");
        c3.setApiMethod("GET");
        c3.setApiHeaders("{}");
        c3.setApiParams("{}");

        ComponentConfig c4 = new ComponentConfig();
        c4.setName("用户权限");
        c4.setDescription("用户权限多选框");
        c4.setComponentType("checkbox");
        c4.setDefaultValue("");
        c4.setIsRequired(false);
        c4.setValidationRule("");
        c4.setPlaceholder("");
        c4.setOptions("[{\"label\":\"查看\",\"value\":\"view\"},{\"label\":\"编辑\",\"value\":\"edit\"},{\"label\":\"删除\",\"value\":\"delete\"}]");
        c4.setApiUrl("");
        c4.setApiMethod("GET");
        c4.setApiHeaders("{}");
        c4.setApiParams("{}");

        ComponentConfig c5 = new ComponentConfig();
        c5.setName("用户备注");
        c5.setDescription("多行文本输入域");
        c5.setComponentType("textarea");
        c5.setDefaultValue("");
        c5.setIsRequired(false);
        c5.setValidationRule("");
        c5.setPlaceholder("请输入备注信息");
        c5.setOptions("[]");
        c5.setApiUrl("");
        c5.setApiMethod("POST");
        c5.setApiHeaders("{\"Content-Type\":\"application/json\"}");
        c5.setApiParams("{}");

        ComponentConfig c6 = new ComponentConfig();
        c6.setName("创建用户");
        c6.setDescription("创建用户API调用组件");
        c6.setComponentType("input");
        c6.setDefaultValue("");
        c6.setIsRequired(false);
        c6.setValidationRule("");
        c6.setPlaceholder("");
        c6.setOptions("[]");
        c6.setApiUrl("https://jsonplaceholder.typicode.com/users");
        c6.setApiMethod("POST");
        c6.setApiHeaders("{\"Content-Type\":\"application/json\"}");
        c6.setApiParams("{}");

        componentConfigRepository.saveAll(List.of(c1, c2, c3, c4, c5, c6));
        log.info("组件配置示例数据初始化完成");

        OperationLog log1 = new OperationLog();
        log1.setUserId("1");
        log1.setUsername("管理员");
        log1.setAction("新建");
        log1.setModule("组件");
        log1.setDetail("创建了组件「用户名称输入框");
        log1.setIp("192.168.1.1");

        OperationLog log2 = new OperationLog();
        log2.setUserId("1");
        log2.setUsername("管理员");
        log2.setAction("新建");
        log2.setModule("系统");
        log2.setDetail("系统初始化完成");
        log2.setIp("127.0.0.1");

        operationLogRepository.saveAll(List.of(log1, log2));
        log.info("操作日志示例数据初始化完成");
        log.info("数据初始化完成！");
    }
}
