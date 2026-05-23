import streamlit as st
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta


@dataclass
class Alert:
    alert_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    current_value: float
    threshold: float
    unit: str
    change_percent: float
    affected_entity: str
    entity_type: str
    trigger_reason: str
    trend_data: Optional[List[Dict[str, Any]]] = None
    detected_at: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "alert_id": self.alert_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "message": self.message,
            "current_value": round(self.current_value, 2),
            "threshold": round(self.threshold, 2),
            "unit": self.unit,
            "change_percent": round(self.change_percent, 2),
            "affected_entity": self.affected_entity,
            "entity_type": self.entity_type,
            "trigger_reason": self.trigger_reason,
            "detected_at": self.detected_at,
        }


@dataclass
class AlertReport:
    alerts: List[Alert]
    total_alerts: int
    critical_alerts: int
    warning_alerts: int
    info_alerts: int
    by_type: Dict[str, int]
    by_severity: Dict[str, int]
    store_health_scores: Dict[str, float]
    overall_health_score: float

    def to_dataframe(self) -> pd.DataFrame:
        data = []
        for alert in sorted(self.alerts, key=lambda x: {"critical": 0, "warning": 1, "info": 2}[x.severity]):
            data.append({
                "严重程度": {"critical": "🔴 严重", "warning": "🟡 警告", "info": "🔵 提示"}.get(alert.severity, alert.severity),
                "预警类型": alert.alert_type,
                "预警标题": alert.title,
                "实体类型": alert.entity_type,
                "实体名称": alert.affected_entity,
                "当前值": f"{alert.current_value:,.2f} {alert.unit}",
                "阈值": f"{alert.threshold:,.2f} {alert.unit}",
                "变化幅度": f"{alert.change_percent:+.1f}%",
                "触发原因": alert.trigger_reason,
                "检测时间": alert.detected_at,
            })
        return pd.DataFrame(data)

    def to_summary_dict(self) -> Dict[str, Any]:
        return {
            "total_alerts": self.total_alerts,
            "critical_alerts": self.critical_alerts,
            "warning_alerts": self.warning_alerts,
            "info_alerts": self.info_alerts,
            "by_type": self.by_type,
            "by_severity": self.by_severity,
            "overall_health_score": round(self.overall_health_score, 1),
            "store_health_scores": {k: round(v, 1) for k, v in self.store_health_scores.items()},
        }


DEFAULT_THRESHOLDS = {
    "revenue_decline_percent": -15.0,
    "refund_rate_high": 8.0,
    "gross_margin_low": 40.0,
    "aov_volatility_percent": 20.0,
    "member_repurchase_low": 30.0,
    "order_count_decline_percent": -10.0,
    "healthy_gross_margin_min": 50.0,
    "healthy_refund_rate_max": 3.0,
    "healthy_revenue_decline_max": -5.0,
}


def _get_revenue_field(df: pd.DataFrame) -> Optional[str]:
    for field in ["pay_amount", "total_amount", "subtotal"]:
        if field in df.columns:
            return field
    return None


def _detect_revenue_decline(
    df: pd.DataFrame,
    store_id: Optional[str] = None,
    thresholds: Dict[str, float] = None,
) -> List[Alert]:
    alerts = []
    thresholds = thresholds or DEFAULT_THRESHOLDS
    
    revenue_field = _get_revenue_field(df)
    if not revenue_field or "order_time" not in df.columns:
        return alerts
    
    df_filtered = df.copy()
    if store_id and "store_id" in df.columns:
        df_filtered = df_filtered[df_filtered["store_id"] == store_id]
    
    if len(df_filtered) < 14:
        return alerts
    
    df_filtered = df_filtered.drop_duplicates("order_id")
    df_filtered = df_filtered.sort_values("order_time")
    
    latest_date = df_filtered["order_time"].max()
    current_start = latest_date - timedelta(days=7)
    previous_start = latest_date - timedelta(days=14)
    
    current_period = df_filtered[
        (df_filtered["order_time"] > current_start) & (df_filtered["order_time"] <= latest_date)
    ]
    previous_period = df_filtered[
        (df_filtered["order_time"] > previous_start) & (df_filtered["order_time"] <= current_start)
    ]
    
    current_revenue = current_period[revenue_field].sum()
    previous_revenue = previous_period[revenue_field].sum()
    
    if previous_revenue > 0:
        change_percent = (current_revenue - previous_revenue) / previous_revenue * 100
        
        if change_percent <= thresholds["revenue_decline_percent"]:
            entity_name = df_filtered["store_name"].iloc[0] if (store_id and "store_name" in df.columns) else "全部门店"
            
            if change_percent <= -30:
                severity = "critical"
            elif change_percent <= -15:
                severity = "warning"
            else:
                severity = "info"
            
            reason_parts = []
            if len(current_period) < len(previous_period) * 0.8:
                reason_parts.append("订单量显著减少")
            if current_period[revenue_field].mean() < previous_period[revenue_field].mean() * 0.9:
                reason_parts.append("客单价下降")
            if not reason_parts:
                reason_parts.append("整体消费疲软")
            
            alert = Alert(
                alert_id=f"revenue_decline_{store_id or 'all'}",
                alert_type="revenue_decline",
                severity=severity,
                title="营业额下降预警",
                message=f"{'当前门店' if store_id else '所有门店'}最近7天营业额较上周{change_percent:+.1f}%",
                current_value=current_revenue,
                threshold=previous_revenue * (1 + thresholds["revenue_decline_percent"] / 100),
                unit="元",
                change_percent=change_percent,
                affected_entity=entity_name,
                entity_type="门店" if store_id else "整体",
                trigger_reason="；".join(reason_parts),
            )
            alerts.append(alert)
    
    return alerts


def _detect_high_refund_rate(
    df: pd.DataFrame,
    cleaned_data: Dict[str, pd.DataFrame],
    store_id: Optional[str] = None,
    thresholds: Dict[str, float] = None,
) -> List[Alert]:
    alerts = []
    thresholds = thresholds or DEFAULT_THRESHOLDS
    
    if "refunds" not in cleaned_data or df.empty:
        return alerts
    
    refunds_df = cleaned_data["refunds"].copy()
    order_level = df.drop_duplicates("order_id")
    
    if store_id and "store_id" in order_level.columns:
        order_ids = set(order_level[order_level["store_id"] == store_id]["order_id"])
        refunds_filtered = refunds_df[refunds_df["order_id"].isin(order_ids)]
        orders_filtered = order_level[order_level["store_id"] == store_id]
    else:
        refunds_filtered = refunds_df
        orders_filtered = order_level
    
    if len(orders_filtered) == 0:
        return alerts
    
    total_orders = len(orders_filtered)
    refund_orders = refunds_filtered["order_id"].nunique()
    refund_rate = refund_orders / total_orders * 100
    
    if refund_rate >= thresholds["refund_rate_high"]:
        entity_name = "全部门店"
        if store_id and "store_name" in orders_filtered.columns:
            entity_name = orders_filtered["store_name"].iloc[0]
        
        if refund_rate >= 15:
            severity = "critical"
        elif refund_rate >= 8:
            severity = "warning"
        else:
            severity = "info"
        
        if "refund_reason" in refunds_filtered.columns or "reason" in refunds_filtered.columns:
            reason_col = "refund_reason" if "refund_reason" in refunds_filtered.columns else "reason"
            top_reasons = refunds_filtered[reason_col].value_counts().head(3).to_dict()
            reason_str = "；".join([f"{k}:{v}次" for k, v in top_reasons.items()])
        else:
            reason_str = "退款原因待分析"
        
        alert = Alert(
            alert_id=f"refund_rate_{store_id or 'all'}",
            alert_type="high_refund_rate",
            severity=severity,
            title="退款率过高预警",
            message=f"{entity_name}退款率达到{refund_rate:.1f}%，超过阈值{thresholds['refund_rate_high']:.1f}%",
            current_value=refund_rate,
            threshold=thresholds["refund_rate_high"],
            unit="%",
            change_percent=(refund_rate - thresholds["refund_rate_high"]) / max(thresholds["refund_rate_high"], 0.1) * 100,
            affected_entity=entity_name,
            entity_type="门店" if store_id else "整体",
            trigger_reason=f"主要退款原因: {reason_str}",
        )
        alerts.append(alert)
    
    return alerts


def _detect_low_gross_margin(
    df: pd.DataFrame,
    store_id: Optional[str] = None,
    thresholds: Dict[str, float] = None,
) -> List[Alert]:
    alerts = []
    thresholds = thresholds or DEFAULT_THRESHOLDS
    
    if "item_gross_margin" not in df.columns or "subtotal" not in df.columns:
        return alerts
    
    df_filtered = df.copy()
    if store_id and "store_id" in df.columns:
        df_filtered = df_filtered[df_filtered["store_id"] == store_id]
    
    if len(df_filtered) < 10:
        return alerts
    
    total_margin = df_filtered["item_gross_margin"].sum()
    total_revenue = df_filtered["subtotal"].sum()
    
    if total_revenue > 0:
        gross_margin_rate = total_margin / total_revenue * 100
        
        if gross_margin_rate < thresholds["gross_margin_low"]:
            entity_name = "全部门店"
            if store_id and "store_name" in df_filtered.columns:
                entity_name = df_filtered["store_name"].iloc[0]
            
            if gross_margin_rate < 25:
                severity = "critical"
            elif gross_margin_rate < 40:
                severity = "warning"
            else:
                severity = "info"
            
            reason_parts = []
            
            if "dish_cost" in df_filtered.columns and "price" in df_filtered.columns:
                avg_cost_ratio = (df_filtered["dish_cost"] / df_filtered["price"] * 100).mean()
                if avg_cost_ratio > 50:
                    reason_parts.append(f"原料成本占比过高（平均{avg_cost_ratio:.1f}%）")
            
            if "category" in df_filtered.columns:
                category_margin = df_filtered.groupby("category").agg(
                    margin=("item_gross_margin", "sum"),
                    revenue=("subtotal", "sum")
                )
                category_margin["rate"] = category_margin["margin"] / category_margin["revenue"] * 100
                low_margin_cats = category_margin[category_margin["rate"] < 30].index.tolist()
                if low_margin_cats:
                    reason_parts.append(f"低毛利品类占比较大: {', '.join(low_margin_cats[:3])}")
            
            if not reason_parts:
                reason_parts.append("建议检查菜品定价策略和原料成本")
            
            alert = Alert(
                alert_id=f"low_margin_{store_id or 'all'}",
                alert_type="low_gross_margin",
                severity=severity,
                title="毛利率偏低预警",
                message=f"{entity_name}毛利率仅{gross_margin_rate:.1f}%，低于阈值{thresholds['gross_margin_low']:.1f}%",
                current_value=gross_margin_rate,
                threshold=thresholds["gross_margin_low"],
                unit="%",
                change_percent=(gross_margin_rate - thresholds["gross_margin_low"]) / max(thresholds["gross_margin_low"], 0.1) * 100,
                affected_entity=entity_name,
                entity_type="门店" if store_id else "整体",
                trigger_reason="；".join(reason_parts),
            )
            alerts.append(alert)
    
    return alerts


def _detect_aov_volatility(
    df: pd.DataFrame,
    store_id: Optional[str] = None,
    thresholds: Dict[str, float] = None,
) -> List[Alert]:
    alerts = []
    thresholds = thresholds or DEFAULT_THRESHOLDS
    
    revenue_field = _get_revenue_field(df)
    if not revenue_field or "order_time" not in df.columns:
        return alerts
    
    df_filtered = df.copy().drop_duplicates("order_id")
    if store_id and "store_id" in df_filtered.columns:
        df_filtered = df_filtered[df_filtered["store_id"] == store_id]
    
    if len(df_filtered) < 14:
        return alerts
    
    df_filtered = df_filtered.sort_values("order_time")
    df_filtered["date"] = df_filtered["order_time"].dt.date
    
    daily_aov = df_filtered.groupby("date")[revenue_field].mean()
    
    if len(daily_aov) >= 7:
        recent_week = daily_aov.tail(7)
        prior_week = daily_aov.head(-7).tail(7)
        
        if len(prior_week) >= 5 and len(recent_week) >= 5:
            recent_mean = recent_week.mean()
            prior_mean = prior_week.mean()
            
            if prior_mean > 0:
                volatility = abs(recent_mean - prior_mean) / prior_mean * 100
                
                if volatility >= thresholds["aov_volatility_percent"]:
                    entity_name = "全部门店"
                    if store_id and "store_name" in df_filtered.columns:
                        entity_name = df_filtered["store_name"].iloc[0]
                    
                    change_direction = "上升" if recent_mean > prior_mean else "下降"
                    if volatility >= 40:
                        severity = "critical"
                    elif volatility >= 20:
                        severity = "warning"
                    else:
                        severity = "info"
                    
                    change_percent = (recent_mean - prior_mean) / prior_mean * 100
                    
                    alert = Alert(
                        alert_id=f"aov_volatility_{store_id or 'all'}",
                        alert_type="aov_volatility",
                        severity=severity,
                        title="客单价异常波动预警",
                        message=f"{entity_name}客单价最近一周较上周{change_direction}{change_percent:+.1f}%",
                        current_value=recent_mean,
                        threshold=prior_mean * (1 - thresholds["aov_volatility_percent"] / 100),
                        unit="元",
                        change_percent=change_percent,
                        affected_entity=entity_name,
                        entity_type="门店" if store_id else "整体",
                        trigger_reason=f"客单价从上周{prior_mean:,.1f}元{change_direction}至{recent_mean:,.1f}元",
                    )
                    alerts.append(alert)
    
    return alerts


def _calculate_store_health_score(
    store_df: pd.DataFrame,
    store_refunds: Optional[pd.DataFrame],
    thresholds: Dict[str, float] = None,
) -> float:
    thresholds = thresholds or DEFAULT_THRESHOLDS
    score = 100.0
    
    if "item_gross_margin" in store_df.columns and "subtotal" in store_df.columns:
        total_margin = store_df["item_gross_margin"].sum()
        total_revenue = store_df["subtotal"].sum()
        if total_revenue > 0:
            margin_rate = total_margin / total_revenue * 100
            if margin_rate < thresholds["healthy_gross_margin_min"]:
                score -= (thresholds["healthy_gross_margin_min"] - margin_rate) * 0.8
            elif margin_rate >= 60:
                score += 5
    
    if store_refunds is not None:
        order_level = store_df.drop_duplicates("order_id")
        if len(order_level) > 0:
            refund_rate = store_refunds["order_id"].nunique() / len(order_level) * 100
            if refund_rate > thresholds["healthy_refund_rate_max"]:
                score -= (refund_rate - thresholds["healthy_refund_rate_max"]) * 1.5
            elif refund_rate < 1:
                score += 3
    
    revenue_field = _get_revenue_field(store_df)
    if revenue_field and "order_time" in store_df.columns:
        order_level = store_df.drop_duplicates("order_id").sort_values("order_time")
        if len(order_level) >= 14:
            latest = order_level["order_time"].max()
            week_ago = latest - timedelta(days=7)
            two_week_ago = latest - timedelta(days=14)
            
            current = order_level[order_level["order_time"] > week_ago][revenue_field].sum()
            prior = order_level[(order_level["order_time"] > two_week_ago) & (order_level["order_time"] <= week_ago)][revenue_field].sum()
            
            if prior > 0:
                change = (current - prior) / prior * 100
                if change < thresholds["healthy_revenue_decline_max"]:
                    score -= abs(change - thresholds["healthy_revenue_decline_max"]) * 0.5
                elif change > 10:
                    score += 4
    
    if "order_id" in store_df.columns:
        order_count = store_df["order_id"].nunique()
        if order_count < 50:
            score -= 5
        elif order_count > 500:
            score += 3
    
    return max(0, min(100, score))


@st.cache_data(ttl=300, show_spinner="正在检测预警...", hash_funcs={AlertReport: lambda x: x.to_summary_dict(), Alert: lambda x: x.to_dict()})
def detect_all_alerts(
    merged_df: pd.DataFrame,
    cleaned_data: Dict[str, pd.DataFrame],
    thresholds: Optional[Dict[str, float]] = None,
) -> AlertReport:
    thresholds = thresholds or DEFAULT_THRESHOLDS
    all_alerts = []
    
    if merged_df is None or merged_df.empty:
        return AlertReport(
            alerts=[], total_alerts=0, critical_alerts=0, warning_alerts=0, info_alerts=0,
            by_type={}, by_severity={}, store_health_scores={}, overall_health_score=0
        )
    
    all_alerts.extend(_detect_revenue_decline(merged_df, None, thresholds))
    all_alerts.extend(_detect_high_refund_rate(merged_df, cleaned_data, None, thresholds))
    all_alerts.extend(_detect_low_gross_margin(merged_df, None, thresholds))
    all_alerts.extend(_detect_aov_volatility(merged_df, None, thresholds))
    
    store_health_scores = {}
    if "store_id" in merged_df.columns:
        for store_id in merged_df["store_id"].dropna().unique():
            store_df = merged_df[merged_df["store_id"] == store_id]
            
            store_refunds = None
            if "refunds" in cleaned_data:
                store_orders = set(store_df["order_id"].unique())
                store_refunds = cleaned_data["refunds"][cleaned_data["refunds"]["order_id"].isin(store_orders)]
            
            store_health_scores[str(store_id)] = _calculate_store_health_score(
                store_df, store_refunds, thresholds
            )
            
            all_alerts.extend(_detect_revenue_decline(merged_df, store_id, thresholds))
            all_alerts.extend(_detect_high_refund_rate(merged_df, cleaned_data, store_id, thresholds))
            all_alerts.extend(_detect_low_gross_margin(merged_df, store_id, thresholds))
    
    total_alerts = len(all_alerts)
    critical_alerts = len([a for a in all_alerts if a.severity == "critical"])
    warning_alerts = len([a for a in all_alerts if a.severity == "warning"])
    info_alerts = len([a for a in all_alerts if a.severity == "info"])
    
    by_type = {}
    by_severity = {"critical": critical_alerts, "warning": warning_alerts, "info": info_alerts}
    
    for alert in all_alerts:
        by_type[alert.alert_type] = by_type.get(alert.alert_type, 0) + 1
    
    if store_health_scores:
        overall_health_score = sum(store_health_scores.values()) / len(store_health_scores)
    else:
        overall_health_score = _calculate_store_health_score(merged_df, cleaned_data.get("refunds"), thresholds)
    
    return AlertReport(
        alerts=all_alerts,
        total_alerts=total_alerts,
        critical_alerts=critical_alerts,
        warning_alerts=warning_alerts,
        info_alerts=info_alerts,
        by_type=by_type,
        by_severity=by_severity,
        store_health_scores=store_health_scores,
        overall_health_score=overall_health_score,
    )


def get_alert_summary(alert_report: AlertReport) -> pd.DataFrame:
    data = []
    for alert_type, count in alert_report.by_type.items():
        type_names = {
            "revenue_decline": "📉 营业额下降",
            "high_refund_rate": "💰 退款率过高",
            "low_gross_margin": "📊 毛利率偏低",
            "aov_volatility": "💹 客单价波动",
        }
        data.append({
            "预警类型": type_names.get(alert_type, alert_type),
            "预警数量": count,
        })
    return pd.DataFrame(data)
