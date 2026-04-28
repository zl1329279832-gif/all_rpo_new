from typing import Dict, List, Type, Optional, Any
from .base_rule import BaseRule


class RuleRegistry:
    _rules: Dict[str, Type[BaseRule]] = {}
    _instances: Dict[str, BaseRule] = {}
    
    @classmethod
    def register(cls, rule_class: Type[BaseRule]) -> Type[BaseRule]:
        rule_name = rule_class.name
        cls._rules[rule_name] = rule_class
        return rule_class
    
    @classmethod
    def get_rule_class(cls, rule_name: str) -> Optional[Type[BaseRule]]:
        return cls._rules.get(rule_name)
    
    @classmethod
    def get_rule(cls, rule_name: str) -> Optional[BaseRule]:
        if rule_name in cls._instances:
            return cls._instances[rule_name]
        
        rule_class = cls.get_rule_class(rule_name)
        if rule_class:
            instance = rule_class()
            cls._instances[rule_name] = instance
            return instance
        return None
    
    @classmethod
    def get_all_rule_names(cls) -> List[str]:
        return list(cls._rules.keys())
    
    @classmethod
    def get_all_rules(cls) -> List[BaseRule]:
        rules = []
        for rule_name in cls._rules:
            rule = cls.get_rule(rule_name)
            if rule:
                rules.append(rule)
        return rules
    
    @classmethod
    def create_all_rules(cls, configs: Dict[str, Any] = None) -> Dict[str, BaseRule]:
        configs = configs or {}
        rules = {}
        
        for rule_name, rule_class in cls._rules.items():
            rule_config = configs.get(rule_name, {})
            enabled = rule_config.get('enabled', True)
            
            if enabled:
                rule = rule_class()
                rule.enabled = enabled
                
                if 'severity' in rule_config:
                    from .base_rule import RuleSeverity
                    rule.severity = RuleSeverity.from_string(rule_config['severity'])
                
                if 'exclude_patterns' in rule_config:
                    rule.exclude_patterns = rule_config['exclude_patterns']
                
                if 'extra_config' in rule_config:
                    rule.extra_config = rule_config['extra_config']
                
                rules[rule_name] = rule
        
        return rules
    
    @classmethod
    def clear_instances(cls) -> None:
        cls._instances.clear()
    
    @classmethod
    def register_from_module(cls, module) -> None:
        import inspect
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if (issubclass(obj, BaseRule) 
                and obj is not BaseRule 
                and hasattr(obj, 'name') 
                and obj.name != 'base_rule'):
                cls.register(obj)


def register_rule(rule_class: Type[BaseRule]) -> Type[BaseRule]:
    return RuleRegistry.register(rule_class)


def get_rule(rule_name: str) -> Optional[BaseRule]:
    return RuleRegistry.get_rule(rule_name)


def get_all_rules() -> List[BaseRule]:
    return RuleRegistry.get_all_rules()
