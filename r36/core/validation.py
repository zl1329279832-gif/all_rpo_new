import streamlit as st
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from config.schemas import DATA_SCHEMAS, REQUIRED_FILES


PRIMARY_KEYS = {
    "stores": "store_id",
    "dishes": "dish_id",
    "members": "member_id",
    "promotions": "promotion_id",
    "orders": "order_id",
    "order_items": "order_item_id",
    "refunds": "refund_id",
    "business_hours": "hours_id",
    "ingredient_costs": "cost_id",
}

AMOUNT_FIELDS = [
    ("orders", ["total_amount", "discount_amount", "subtotal", "pay_amount"]),
    ("order_items", ["quantity", "unit_price", "subtotal", "cost"]),
    ("refunds", ["refund_amount"]),
    ("dishes", ["price", "cost"]),
    ("ingredient_costs", ["unit_price", "quantity", "total_cost"]),
    ("promotions", ["discount_value", "min_amount", "budget"]),
]

DATE_FIELDS = [
    ("orders", ["order_datetime", "order_time", "order_date"]),
    ("members", ["register_date"]),
    ("stores", ["open_date"]),
    ("promotions", ["start_date", "end_date"]),
    ("refunds", ["refund_time"]),
    ("ingredient_costs", ["date", "cost_date"]),
    ("business_hours", []),
]

REFERENTIAL_CHECKS = [
    ("orders", "store_id", "stores", "store_id"),
    ("orders", "member_id", "members", "member_id"),
    ("orders", "promotion_id", "promotions", "promotion_id"),
    ("order_items", "order_id", "orders", "order_id"),
    ("order_items", "dish_id", "dishes", "dish_id"),
    ("refunds", "order_id", "orders", "order_id"),
    ("refunds", "order_item_id", "order_items", "order_item_id"),
    ("refunds", "dish_id", "dishes", "dish_id"),
    ("business_hours", "store_id", "stores", "store_id"),
    ("ingredient_costs", "dish_id", "dishes", "dish_id"),
]


@dataclass
class DataQualityIssue:
    issue_type: str
    severity: str
    table_name: str
    column_name: Optional[str]
    description: str
    affected_rows: int
    sample_values: Optional[List[Any]] = None
    issue_id: str = ""

    def __post_init__(self):
        if not self.issue_id:
            self.issue_id = f"{self.table_name}_{self.column_name or 'global'}_{self.issue_type}"


@dataclass
class ValidationResult:
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    missing_columns: List[str] = field(default_factory=list)
    extra_columns: List[str] = field(default_factory=list)
    type_mismatches: Dict[str, str] = field(default_factory=dict)
    duplicate_keys: List[Any] = field(default_factory=list)
    duplicate_count: int = 0
    invalid_dates: int = 0
    invalid_dates_details: List[str] = field(default_factory=list)
    negative_amounts: int = 0
    negative_amount_details: List[str] = field(default_factory=list)
    abnormal_amounts: int = 0
    abnormal_amount_details: List[str] = field(default_factory=list)
    referential_failures: List[Dict[str, Any]] = field(default_factory=list)
    referential_failure_count: int = 0
    refund_mismatches: int = 0
    refund_mismatch_details: List[str] = field(default_factory=list)


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
    issues: List[DataQualityIssue]
    total_issues: int = 0
    critical_issues: int = 0
    warning_issues: int = 0

    def __post_init__(self):
        self.total_issues = len(self.issues)
        self.critical_issues = len([i for i in self.issues if i.severity == "critical"])
        self.warning_issues = len([i for i in self.issues if i.severity == "warning"])


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


def check_duplicate_primary_key(df: pd.DataFrame, table_name: str, result: ValidationResult) -> None:
    if table_name in PRIMARY_KEYS:
        pk = PRIMARY_KEYS[table_name]
        if pk in df.columns:
            duplicates = df[df.duplicated(subset=[pk], keep=False)][pk].unique().tolist()
            if duplicates:
                result.duplicate_keys = duplicates
                result.duplicate_count = len(duplicates)
                result.is_valid = False
                result.errors.append(f"主键 {pk} 存在重复值: {len(duplicates)} 个重复")


def check_invalid_dates(df: pd.DataFrame, table_name: str, result: ValidationResult) -> None:
    invalid_count = 0
    details = []
    
    for table_config in DATE_FIELDS:
        if table_config[0] == table_name:
            for date_col in table_config[1]:
                if date_col in df.columns:
                    try:
                        parsed = pd.to_datetime(df[date_col], errors="coerce")
                        invalid_mask = parsed.isna() & df[date_col].notna()
                        if invalid_mask.any():
                            n_invalid = invalid_mask.sum()
                            invalid_count += n_invalid
                            sample_invalid = df[invalid_mask][date_col].head(3).tolist()
                            details.append(f"{date_col}: {n_invalid} 个无效日期（如 {sample_invalid}）")
                    except Exception:
                        pass
    
    if invalid_count > 0:
        result.invalid_dates = invalid_count
        result.invalid_dates_details = details
        result.warnings.append(f"存在 {invalid_count} 个无效日期")


def check_abnormal_amounts(df: pd.DataFrame, table_name: str, result: ValidationResult) -> None:
    neg_count = 0
    abnormal_count = 0
    neg_details = []
    abnormal_details = []
    
    for table_config in AMOUNT_FIELDS:
        if table_config[0] == table_name:
            for amount_col in table_config[1]:
                if amount_col in df.columns:
                    numeric_col = pd.to_numeric(df[amount_col], errors="coerce")
                    
                    neg_mask = numeric_col < 0
                    if neg_mask.any():
                        n_neg = neg_mask.sum()
                        neg_count += n_neg
                        sample_neg = numeric_col[neg_mask].head(3).tolist()
                        neg_details.append(f"{amount_col}: {n_neg} 个负数（如 {sample_neg}）")
                    
                    if len(numeric_col.dropna()) > 0:
                        q1 = numeric_col.quantile(0.25)
                        q3 = numeric_col.quantile(0.75)
                        iqr = q3 - q1
                        upper_bound = q3 + 3 * iqr
                        abnormal_mask = numeric_col > upper_bound
                        if abnormal_mask.any():
                            n_abnormal = abnormal_mask.sum()
                            abnormal_count += n_abnormal
                            sample_abnormal = numeric_col[abnormal_mask].head(3).tolist()
                            abnormal_details.append(f"{amount_col}: {n_abnormal} 个异常大值（如 {sample_abnormal}）")
    
    if neg_count > 0:
        result.negative_amounts = neg_count
        result.negative_amount_details = neg_details
        result.errors.append(f"存在 {neg_count} 个负数金额")
    
    if abnormal_count > 0:
        result.abnormal_amounts = abnormal_count
        result.abnormal_amount_details = abnormal_details
        result.warnings.append(f"存在 {abnormal_count} 个异常大值金额")


def check_referential_integrity(data_dict: Dict[str, pd.DataFrame], results: Dict[str, ValidationResult]) -> None:
    for child_table, child_col, parent_table, parent_col in REFERENTIAL_CHECKS:
        if child_table in data_dict and parent_table in data_dict:
            child_df = data_dict[child_table]
            parent_df = data_dict[parent_table]
            
            if child_col in child_df.columns and parent_col in parent_df.columns:
                child_vals = child_df[child_col].dropna()
                parent_vals = set(parent_df[parent_col].dropna())
                
                if len(child_vals) > 0:
                    orphan_mask = ~child_vals.isin(parent_vals)
                    orphan_count = orphan_mask.sum()
                    
                    if orphan_count > 0:
                        orphan_values = child_vals[orphan_mask].unique().tolist()[:5]
                        failure_info = {
                            "child_table": child_table,
                            "child_column": child_col,
                            "parent_table": parent_table,
                            "parent_column": parent_col,
                            "orphan_count": orphan_count,
                            "sample_orphans": orphan_values,
                        }
                        
                        if child_table in results:
                            results[child_table].referential_failures.append(failure_info)
                            results[child_table].referential_failure_count += orphan_count
                            results[child_table].warnings.append(
                                f"{child_col} 有 {orphan_count} 个值在 {parent_table}.{parent_col} 中不存在"
                            )


def check_refund_mismatches(data_dict: Dict[str, pd.DataFrame], results: Dict[str, ValidationResult]) -> None:
    if "refunds" in data_dict and "orders" in data_dict:
        refunds_df = data_dict["refunds"]
        orders_df = data_dict["orders"]
        
        if "order_id" in refunds_df.columns and "order_id" in orders_df.columns:
            refund_order_ids = set(refunds_df["order_id"].dropna().unique())
            order_ids = set(orders_df["order_id"].unique())
            
            missing_orders = refund_order_ids - order_ids
            if missing_orders:
                mismatch_count = len(missing_orders)
                sample_missing = list(missing_orders)[:5]
                
                if "refunds" in results:
                    results["refunds"].refund_mismatches = mismatch_count
                    results["refunds"].refund_mismatch_details = [
                        f"{mismatch_count} 个退款订单号在订单表中不存在（如 {sample_missing}）"
                    ]
                    results["refunds"].errors.append(
                        f"退款订单不匹配: {mismatch_count} 个退款订单找不到对应订单"
                    )


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


def _generate_issues_from_result(table_name: str, result: ValidationResult, missing_report: Optional[MissingDataReport]) -> List[DataQualityIssue]:
    issues = []
    
    if result.missing_columns:
        issues.append(DataQualityIssue(
            issue_type="missing_columns",
            severity="critical",
            table_name=table_name,
            column_name=None,
            description=f"缺失必要字段: {', '.join(result.missing_columns)}",
            affected_rows=0,
        ))
    
    if result.duplicate_count > 0:
        pk = PRIMARY_KEYS.get(table_name, "主键")
        issues.append(DataQualityIssue(
            issue_type="duplicate_primary_key",
            severity="critical",
            table_name=table_name,
            column_name=pk,
            description=f"主键存在 {result.duplicate_count} 个重复值",
            affected_rows=result.duplicate_count,
            sample_values=result.duplicate_keys[:5],
        ))
    
    if result.negative_amounts > 0:
        issues.append(DataQualityIssue(
            issue_type="negative_amount",
            severity="critical",
            table_name=table_name,
            column_name=None,
            description=f"存在 {result.negative_amounts} 个负数金额",
            affected_rows=result.negative_amounts,
            sample_values=result.negative_amount_details,
        ))
    
    if result.refund_mismatches > 0:
        issues.append(DataQualityIssue(
            issue_type="refund_mismatch",
            severity="critical",
            table_name=table_name,
            column_name="order_id",
            description=f"{result.refund_mismatches} 个退款订单无对应订单记录",
            affected_rows=result.refund_mismatches,
            sample_values=result.refund_mismatch_details,
        ))
    
    if result.referential_failure_count > 0:
        issues.append(DataQualityIssue(
            issue_type="referential_integrity",
            severity="warning",
            table_name=table_name,
            column_name=None,
            description=f"存在 {result.referential_failure_count} 个关联失败记录",
            affected_rows=result.referential_failure_count,
            sample_values=[f"{f['child_column']}->{f['parent_table']}" for f in result.referential_failures[:3]],
        ))
    
    if result.abnormal_amounts > 0:
        issues.append(DataQualityIssue(
            issue_type="abnormal_amount",
            severity="warning",
            table_name=table_name,
            column_name=None,
            description=f"存在 {result.abnormal_amounts} 个异常大值金额",
            affected_rows=result.abnormal_amounts,
            sample_values=result.abnormal_amount_details,
        ))
    
    if result.invalid_dates > 0:
        issues.append(DataQualityIssue(
            issue_type="invalid_date",
            severity="warning",
            table_name=table_name,
            column_name=None,
            description=f"存在 {result.invalid_dates} 个无效日期",
            affected_rows=result.invalid_dates,
            sample_values=result.invalid_dates_details,
        ))
    
    if result.type_mismatches:
        issues.append(DataQualityIssue(
            issue_type="type_mismatch",
            severity="warning",
            table_name=table_name,
            column_name=None,
            description=f"存在 {len(result.type_mismatches)} 个字段类型不匹配",
            affected_rows=0,
            sample_values=[f"{k}:{v}" for k, v in result.type_mismatches.items()],
        ))
    
    if missing_report and missing_report.total_missing > 0:
        if missing_report.missing_percentage > 5:
            severity = "warning"
        else:
            severity = "info"
        
        issues.append(DataQualityIssue(
            issue_type="missing_values",
            severity=severity,
            table_name=table_name,
            column_name=None,
            description=f"缺失 {missing_report.total_missing} 个值 ({missing_report.missing_percentage:.2f}%)，影响 {missing_report.rows_with_missing} 行",
            affected_rows=missing_report.rows_with_missing,
            sample_values=[f"{k}:{v}" for k, v in missing_report.missing_by_column.items() if v > 0][:5],
        ))
    
    return issues


@st.cache_data(ttl=3600, show_spinner="正在校验数据...")
def validate_all_datasets(data_dict: Dict[str, pd.DataFrame]) -> ValidationReport:
    results: Dict[str, ValidationResult] = {}
    missing_reports: Dict[str, MissingDataReport] = {}
    all_issues: List[DataQualityIssue] = []
    overall_valid = True
    total_score = 0
    score_count = 0

    loaded_files = set(data_dict.keys())
    missing_files = [f for f in REQUIRED_FILES if f not in loaded_files]

    for name, df in data_dict.items():
        if name in DATA_SCHEMAS:
            result = validate_schema(df, DATA_SCHEMAS[name])
            
            check_duplicate_primary_key(df, name, result)
            check_invalid_dates(df, name, result)
            check_abnormal_amounts(df, name, result)
            
            results[name] = result
            
            if not result.is_valid:
                overall_valid = False

            missing_report = check_missing_values(df)
            missing_reports[name] = missing_report

            file_score = _calculate_quality_score(result, missing_report)
            total_score += file_score
            score_count += 1
            
            issues = _generate_issues_from_result(name, result, missing_report)
            all_issues.extend(issues)

    check_referential_integrity(data_dict, results)
    check_refund_mismatches(data_dict, results)
    
    for name, result in results.items():
        if result.referential_failure_count > 0 or result.refund_mismatches > 0:
            missing_report = missing_reports.get(name)
            new_issues = _generate_issues_from_result(name, result, None)
            for issue in new_issues:
                if issue.issue_type in ["referential_integrity", "refund_mismatch"]:
                    all_issues.append(issue)

    if missing_files:
        overall_valid = False
        for missing_file in missing_files:
            all_issues.append(DataQualityIssue(
                issue_type="missing_file",
                severity="warning",
                table_name=missing_file,
                column_name=None,
                description="缺失必要的数据文件",
                affected_rows=0,
            ))

    quality_score = (total_score / score_count) if score_count > 0 else 0

    return ValidationReport(
        overall_valid=overall_valid,
        results=results,
        missing_reports=missing_reports,
        missing_files=missing_files,
        quality_score=quality_score,
        issues=all_issues,
    )


def _calculate_quality_score(
    schema_result: ValidationResult, missing_report: MissingDataReport
) -> float:
    score = 100.0

    if schema_result.errors:
        score -= len(schema_result.errors) * 10
    
    if schema_result.duplicate_count > 0:
        score -= min(schema_result.duplicate_count * 5, 20)
    
    if schema_result.negative_amounts > 0:
        score -= min(schema_result.negative_amounts * 2, 15)
    
    if schema_result.refund_mismatches > 0:
        score -= min(schema_result.refund_mismatches * 3, 15)

    if schema_result.warnings:
        score -= len(schema_result.warnings) * 3
    
    if schema_result.referential_failure_count > 0:
        score -= min(schema_result.referential_failure_count * 0.5, 10)
    
    if schema_result.abnormal_amounts > 0:
        score -= min(schema_result.abnormal_amounts * 0.5, 10)
    
    if schema_result.invalid_dates > 0:
        score -= min(schema_result.invalid_dates * 0.5, 10)

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
            "主键重复": result.duplicate_count,
            "关联失败": result.referential_failure_count,
            "异常金额": result.negative_amounts + result.abnormal_amounts,
            "无效日期": result.invalid_dates,
            "缺失值": missing_report.total_missing if missing_report else 0,
            "缺失率%": round(missing_report.missing_percentage, 2) if missing_report else 0,
        })
    return pd.DataFrame(summary)


def get_issues_by_severity(report: ValidationReport, severity: str) -> List[DataQualityIssue]:
    return [i for i in report.issues if i.severity == severity]


def get_issues_dataframe(report: ValidationReport) -> pd.DataFrame:
    data = []
    for issue in report.issues:
        data.append({
            "严重程度": {"critical": "🔴 严重", "warning": "🟡 警告", "info": "🔵 提示"}.get(issue.severity, issue.severity),
            "问题类型": issue.issue_type,
            "数据表": issue.table_name,
            "字段": issue.column_name or "-",
            "描述": issue.description,
            "影响行数": issue.affected_rows,
            "示例": ", ".join([str(v) for v in (issue.sample_values or [])])[:100],
        })
    return pd.DataFrame(data)
