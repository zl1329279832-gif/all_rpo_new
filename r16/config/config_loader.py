import os
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import fields

from .default_config import (
    ScannerConfig,
    RuleConfig,
    DEFAULT_CONFIG,
    DEFAULT_RULE_CONFIG
)


class ConfigLoader:
    SUPPORTED_FORMATS = [".json"]
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path
        self.config = ScannerConfig()
    
    def load(self, config_path: Optional[str] = None) -> ScannerConfig:
        path = config_path or self.config_path
        if path:
            self._load_from_file(path)
        return self.config
    
    def _load_from_file(self, path: str) -> None:
        file_path = Path(path)
        if not file_path.exists():
            raise FileNotFoundError(f"Config file not found: {path}")
        
        if file_path.suffix == ".json":
            self._load_json(file_path)
        else:
            raise ValueError(f"Unsupported config format: {file_path.suffix}")
    
    def _load_json(self, file_path: Path) -> None:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        self._apply_config_data(data)
    
    def _apply_config_data(self, data: Dict[str, Any]) -> None:
        for field in fields(ScannerConfig):
            if field.name in data:
                value = data[field.name]
                if field.name == "rules_config":
                    self._apply_rules_config(value)
                else:
                    setattr(self.config, field.name, value)
        
        if "ignore_patterns" in data:
            self.config.ignore_patterns = list(
                set(self.config.ignore_patterns + data["ignore_patterns"])
            )
        
        if "extra_ignore_patterns" in data:
            self.config.extra_ignore_patterns = data["extra_ignore_patterns"]
    
    def _apply_rules_config(self, rules_data: Dict[str, Any]) -> None:
        for rule_name, rule_data in rules_data.items():
            if rule_name in self.config.rules_config:
                existing = self.config.rules_config[rule_name]
                for key, value in rule_data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
            else:
                self.config.rules_config[rule_name] = RuleConfig(
                    name=rule_name,
                    **rule_data
                )
    
    @staticmethod
    def create_example_config(output_path: str) -> None:
        example_config = {
            "scan_path": "./src",
            "output_path": "./reports",
            "report_format": "markdown",
            "extra_ignore_patterns": [
                "**/generated/**",
                "**/migrations/**"
            ],
            "verbosity": 2,
            "fail_on_severity": "high",
            "max_workers": 8,
            "rules_config": {
                "large_file": {
                    "enabled": True,
                    "severity": "medium",
                    "threshold": 5242880,
                    "extra_config": {
                        "warning_size": 2097152,
                        "critical_size": 20971520
                    }
                },
                "todo_comment": {
                    "enabled": True,
                    "severity": "info",
                    "extra_config": {
                        "keywords": ["TODO", "FIXME", "HACK"]
                    }
                },
                "sensitive_info": {
                    "enabled": True,
                    "severity": "critical",
                    "extra_config": {
                        "patterns": [
                            ["api_key\\s*[=:]\\s*['\"]([A-Za-z0-9]{20,})['\"]", "API Key"],
                            ["password\\s*[=:]\\s*['\"]([^'\"]+)['\"]", "Password"]
                        ]
                    }
                }
            }
        }
        
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(example_config, f, indent=2, ensure_ascii=False)
    
    @staticmethod
    def merge_configs(
        base_config: ScannerConfig,
        cli_args: Dict[str, Any]
    ) -> ScannerConfig:
        merged = ScannerConfig()
        for field in fields(ScannerConfig):
            if hasattr(base_config, field.name):
                setattr(merged, field.name, getattr(base_config, field.name))
        
        for key, value in cli_args.items():
            if value is not None and hasattr(merged, key):
                if key == "ignore_patterns":
                    merged.ignore_patterns = list(
                        set(merged.ignore_patterns + value)
                    )
                elif key == "extra_ignore_patterns":
                    merged.extra_ignore_patterns = value
                elif key == "report_format":
                    merged.report_format = value
                elif key == "verbosity":
                    merged.verbosity = value
                elif key == "fail_on_severity":
                    merged.fail_on_severity = value
                elif key == "scan_path":
                    merged.scan_path = value
                elif key == "output_path":
                    merged.output_path = value
        
        return merged
