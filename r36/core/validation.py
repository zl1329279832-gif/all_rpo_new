import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from config.schemas import DATA_SCHEMAS, REQUIRED_FILES


@dataclass
class ValidationResult:
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    missing_columns: List[str] = field(default_factory=list)
    extra_columns: List[str] = field(default_factory=list)
    type_mismatches: Dict[str, str] = field(default_factory=dict)


@dataclass
class MissingDataReport:
    total_missing: int
    missing_by_column: Dict[str, int]
    missing_percentage: float
    rows_with_missing: int


@dataclass
class ValidationReport:
    overall_valid: bool
    results: Dict[str, ValidationResult]
    missing_reports: Dict[str, MissingDataReport]
    missing_files: List[str]
    quality_score: float


def validate_schema(df: pd.DataFrame, expected_schema: Dict[str, str]) -> ValidationResult:
    result = ValidationResult(is_valid=True)
    expected_columns = set(expected_schema.keys())
    actual_columns = set(df.columns.tolist())

    result.missing_columns = list(expected_columns - actual_columns)
    result.extra_columns = list(actual_columns - expected_columns)

    if result.missing_columns:
        result.is_valid = False
        result.errors.append(f"缺失字段: {', '.join(result.missing_columns)}")

    for col, expected_type in expected_schema.items():
        if col in df.columns:
            if not _check_type(df[col], expected_type):
                result.type_mismatches[col] = expected_type
                result.warnings.append(
                    f"字段 {col} 类型应为 {expected_type}，当前为 {df[col].dtype}"
                )

    return result


def _check_type(series: pd.Series, expected_type: str) -> bool:
    if expected_type == "string":
        return series.dtype == "object" or pd.api.types.is_string_dtype(series)
    elif expected_type == "int":
        return pd.api.types.is_integer_dtype(series)
    elif expected_type == "float":
        return pd.api.types.is_float_dtype(series) or pd.api.types.is_integer_dtype(series)
    elif expected_type in ["date", "datetime"]:
        return pd.api.types.is_datetime64_dtype(series) or pd.api.types.is_object_dtype(series)
    return True


def check_missing_values(df: pd.DataFrame) -> MissingDataReport:
    total_cells = len(df) * len(df.columns)
    missing_by_col = df.isnull().sum().to_dict()
    total_missing = sum(missing_by_col.values())
    missing_pct = (total_missing / total_cells * 100) if total_cells > 0 else 0
    rows_with_missing = df.isnull().any(axis=1).sum()

    return MissingDataReport(
        total_missing=total_missing,
        missing_by_column=missing_by_col,
        missing_percentage=missing_pct,
        rows_with_missing=rows_with_missing,
    )


def validate_all_datasets(data_dict: Dict[str, pd.DataFrame]) -> ValidationReport:
    results: Dict[str, ValidationResult] = {}
    missing_reports: Dict[str, MissingDataReport] = {}
    overall_valid = True
    total_score = 0
    score_count = 0

    loaded_files = set(data_dict.keys())
    missing_files = [f for f in REQUIRED_FILES if f not in loaded_files]

    for name, df in data_dict.items():
        if name in DATA_SCHEMAS:
            schema_result = validate_schema(df, DATA_SCHEMAS[name])
            results[name] = schema_result
            if not schema_result.is_valid:
                overall_valid = False

            missing_report = check_missing_values(df)
            missing_reports[name] = missing_report

            file_score = _calculate_quality_score(schema_result, missing_report)
            total_score += file_score
            score_count += 1

    if missing_files:
        overall_valid = False

    quality_score = (total_score / score_count) if score_count > 0 else 0

    return ValidationReport(
        overall_valid=overall_valid,
        results=results,
        missing_reports=missing_reports,
        missing_files=missing_files,
        quality_score=quality_score,
    )


def _calculate_quality_score(
    schema_result: ValidationResult, missing_report: MissingDataReport
) -> float:
    score = 100.0

    if schema_result.errors:
        score -= len(schema_result.errors) * 10

    if schema_result.warnings:
        score -= len(schema_result.warnings) * 3

    if missing_report.missing_percentage > 0:
        score -= min(missing_report.missing_percentage * 2, 30)

    return max(score, 0)


def get_validation_summary(report: ValidationReport) -> pd.DataFrame:
    summary = []
    for name, result in report.results.items():
        missing_report = report.missing_reports.get(name)
        summary.append({
            "数据表": name,
            "是否有效": "✅" if result.is_valid else "❌",
            "错误数": len(result.errors),
            "警告数": len(result.warnings),
            "缺失值": missing_report.total_missing if missing_report else 0,
            "缺失率%": round(missing_report.missing_percentage, 2) if missing_report else 0,
        })
    return pd.DataFrame(summary)
