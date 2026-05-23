import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from typing import Dict, List, Optional, Tuple
from config.schemas import COLOR_PALETTE, CHART_COLORS


def _apply_chart_style(fig: go.Figure, title: str = "") -> go.Figure:
    fig.update_layout(
        template="plotly_white",
        title=dict(text=title, font=dict(size=18, color="#333"), x=0.5, xanchor="center"),
        margin=dict(l=50, r=30, t=60, b=50),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Inter, sans-serif", size=12),
        legend=dict(bgcolor="rgba(255,255,255,0.8)", borderwidth=0),
        hoverlabel=dict(bgcolor="white", font_size=12, font_family="Inter"),
    )
    fig.update_xaxes(
        showgrid=True,
        gridwidth=0.5,
        gridcolor="#e0e0e0",
        linecolor="#333",
        linewidth=1,
    )
    fig.update_yaxes(
        showgrid=True,
        gridwidth=0.5,
        gridcolor="#e0e0e0",
        linecolor="#333",
        linewidth=1,
    )
    return fig


def plot_revenue_trend(df: pd.DataFrame, freq: str = "D") -> go.Figure:
    if df.empty or "order_time" not in df.columns:
        return go.Figure()

    trend_df = df.copy()
    trend_df["period"] = trend_df["order_time"].dt.to_period(freq).dt.to_timestamp()

    grouped = (
        trend_df.groupby("period")
        .agg(营业额=("pay_amount", "sum"), 毛利=("item_gross_margin", "sum"), 订单数=("order_id", "nunique"))
        .reset_index()
    )

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=grouped["period"],
            y=grouped["营业额"],
            name="营业额",
            mode="lines+markers",
            line=dict(color=COLOR_PALETTE["primary"], width=3),
            marker=dict(size=8, color=COLOR_PALETTE["primary"]),
            hovertemplate="日期: %{x}<br>营业额: ¥%{y:,.2f}<extra></extra>",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=grouped["period"],
            y=grouped["毛利"],
            name="毛利",
            mode="lines+markers",
            line=dict(color=COLOR_PALETTE["secondary"], width=3, dash="dash"),
            marker=dict(size=8, color=COLOR_PALETTE["secondary"]),
            hovertemplate="日期: %{x}<br>毛利: ¥%{y:,.2f}<extra></extra>",
        )
    )

    fig.update_layout(
        yaxis_title="金额 (元)",
        xaxis_title="日期",
        hovermode="x unified",
    )
    return _apply_chart_style(fig, f"营业额与毛利趋势")


def plot_store_comparison(df: pd.DataFrame, metric: str = "营业额") -> go.Figure:
    if df.empty or "store_name" not in df.columns:
        return go.Figure()

    store_metrics = (
        df.groupby("store_name")
        .agg(
            营业额=("pay_amount", "sum"),
            毛利=("item_gross_margin", "sum"),
            订单数=("order_id", "nunique"),
            客单价=("pay_amount", lambda x: x.sum() / x.nunique()),
        )
        .reset_index()
        .sort_values(metric, ascending=True)
    )

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            y=store_metrics["store_name"],
            x=store_metrics[metric],
            orientation="h",
            marker=dict(
                color=store_metrics[metric],
                colorscale="Blues",
                showscale=False,
            ),
            hovertemplate=f"门店: %{{y}}<br>{metric}: %{{x:,.2f}}<extra></extra>",
            text=store_metrics[metric].apply(lambda x: f"¥{x:,.0f}" if metric in ["营业额", "毛利", "客单价"] else f"{x:,.0f}"),
            textposition="outside",
        )
    )

    fig.update_layout(
        xaxis_title=metric,
        yaxis_title="门店",
        height=400 + len(store_metrics) * 20,
    )
    return _apply_chart_style(fig, f"各门店{metric}对比")


def plot_dish_ranking(df: pd.DataFrame, top_n: int = 15, sort_by: str = "销售额") -> go.Figure:
    if df.empty:
        return go.Figure()

    ranked = df.sort_values(sort_by, ascending=True).tail(top_n)

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            y=ranked["dish_name"],
            x=ranked[sort_by],
            orientation="h",
            marker=dict(
                color=COLOR_PALETTE["secondary"],
                line=dict(width=0),
            ),
            hovertemplate=f"菜品: %{{y}}<br>{sort_by}: %{{x:,.2f}}<extra></extra>",
            text=ranked[sort_by].apply(lambda x: f"¥{x:,.0f}" if sort_by in ["销售额", "毛利"] else f"{x:,.0f}"),
            textposition="outside",
        )
    )

    fig.update_layout(
        xaxis_title=sort_by,
        yaxis_title="菜品名称",
        height=400 + top_n * 15,
    )
    return _apply_chart_style(fig, f"菜品{sort_by}排行TOP{top_n}")


def plot_category_distribution(df: pd.DataFrame) -> go.Figure:
    if df.empty or "category" not in df.columns:
        return go.Figure()

    category_sales = (
        df.groupby("category")["subtotal"].sum().reset_index().sort_values("subtotal", ascending=False)
    )

    fig = px.pie(
        category_sales,
        values="subtotal",
        names="category",
        hole=0.4,
        color_discrete_sequence=CHART_COLORS,
        hover_data={"subtotal": ":,.2f"},
    )

    fig.update_traces(
        textposition="inside",
        textinfo="percent+label",
        marker=dict(line=dict(color="white", width=2)),
        hovertemplate="品类: %{label}<br>销售额: ¥%{value:,.2f}<br>占比: %{percent}<extra></extra>",
    )

    return _apply_chart_style(fig, "品类销售占比")


def plot_profit_matrix(df: pd.DataFrame) -> go.Figure:
    if df.empty or "销售额" not in df.columns or "毛利率" not in df.columns:
        return go.Figure()

    avg_sales = df["销售额"].mean()
    avg_margin = df["毛利率"].mean()

    def _get_quadrant(row):
        if row["销售额"] >= avg_sales and row["毛利率"] >= avg_margin:
            return "明星菜品"
        elif row["销售额"] >= avg_sales and row["毛利率"] < avg_margin:
            return "薄利多销"
        elif row["销售额"] < avg_sales and row["毛利率"] >= avg_margin:
            return "潜力菜品"
        else:
            return "待优化"

    df_plot = df.copy()
    df_plot["战略定位"] = df_plot.apply(_get_quadrant, axis=1)

    color_map = {
        "明星菜品": COLOR_PALETTE["success"],
        "薄利多销": COLOR_PALETTE["primary"],
        "潜力菜品": COLOR_PALETTE["warning"],
        "待优化": COLOR_PALETTE["danger"],
    }

    fig = go.Figure()
    for q, color in color_map.items():
        subset = df_plot[df_plot["战略定位"] == q]
        if not subset.empty:
            fig.add_trace(
                go.Scatter(
                    x=subset["销售额"],
                    y=subset["毛利率"],
                    mode="markers",
                    name=q,
                    marker=dict(size=subset["销售数量"] / 20 + 8, color=color, opacity=0.8, line=dict(width=1, color="white")),
                    text=subset["dish_name"],
                    hovertemplate="菜品: %{text}<br>销售额: ¥%{x:,.0f}<br>毛利率: %{y:.1f}%<extra></extra>",
                )
            )

    fig.add_shape(
        type="line",
        x0=avg_sales,
        x1=avg_sales,
        y0=df_plot["毛利率"].min(),
        y1=df_plot["毛利率"].max(),
        line=dict(dash="dash", color="gray"),
    )
    fig.add_shape(
        type="line",
        y0=avg_margin,
        y1=avg_margin,
        x0=df_plot["销售额"].min(),
        x1=df_plot["销售额"].max(),
        line=dict(dash="dash", color="gray"),
    )

    fig.update_layout(
        xaxis_title="销售额 (元)",
        yaxis_title="毛利率 (%)",
        showlegend=True,
    )
    return _apply_chart_style(fig, "菜品利润矩阵分析")


def plot_rfm_scatter(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        return go.Figure()

    color_map = {
        "重要价值客户": COLOR_PALETTE["success"],
        "重要发展客户": COLOR_PALETTE["primary"],
        "重要保持客户": COLOR_PALETTE["info"],
        "重要挽留客户": COLOR_PALETTE["warning"],
        "新客户": COLOR_PALETTE["teal"],
        "一般客户": COLOR_PALETTE["purple"],
        "流失客户": COLOR_PALETTE["danger"],
    }

    fig = go.Figure()
    for segment in df["客户分层"].unique():
        subset = df[df["客户分层"] == segment]
        fig.add_trace(
            go.Scatter3d(
                x=subset["Recency"],
                y=subset["Frequency"],
                z=subset["Monetary"],
                mode="markers",
                name=segment,
                marker=dict(size=6, color=color_map.get(segment, "#999"), opacity=0.7),
                text=subset["member_id"],
                hovertemplate="会员: %{text}<br>最近购买: %{x}天<br>购买频次: %{y}<br>消费金额: ¥%{z:,.0f}<extra></extra>",
            )
        )

    fig.update_layout(
        scene=dict(
            xaxis_title="最近购买 (天)",
            yaxis_title="购买频次",
            zaxis_title="消费金额 (元)",
        ),
        height=600,
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return _apply_chart_style(fig, "客户RFM价值3D分布")


def plot_customer_segment_bar(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        return go.Figure()

    segment_counts = (
        df["客户分层"].value_counts().reset_index()
    )
    segment_counts.columns = ["客户分层", "会员数"]
    segment_counts["占比"] = segment_counts["会员数"] / segment_counts["会员数"].sum() * 100

    color_order = [
        "重要价值客户",
        "重要发展客户",
        "重要保持客户",
        "重要挽留客户",
        "新客户",
        "一般客户",
        "流失客户",
    ]
    color_map = {
        "重要价值客户": COLOR_PALETTE["success"],
        "重要发展客户": COLOR_PALETTE["primary"],
        "重要保持客户": COLOR_PALETTE["info"],
        "重要挽留客户": COLOR_PALETTE["warning"],
        "新客户": COLOR_PALETTE["teal"],
        "一般客户": COLOR_PALETTE["purple"],
        "流失客户": COLOR_PALETTE["danger"],
    }
    segment_counts = segment_counts[segment_counts["客户分层"].isin(color_order)]

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=segment_counts["客户分层"],
            y=segment_counts["会员数"],
            marker=dict(color=[color_map.get(x, "#999") for x in segment_counts["客户分层"]]),
            text=segment_counts.apply(lambda r: f"{r['会员数']} ({r['占比']:.1f}%)", axis=1),
            textposition="outside",
            hovertemplate="%{x}<br>会员数: %{y}人<extra></extra>",
        )
    )

    fig.update_layout(
        xaxis_title="客户分层",
        yaxis_title="会员数量",
    )
    return _apply_chart_style(fig, "客户分层分布")


def plot_promotion_roi(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        return go.Figure()

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=df["优惠金额"],
            y=df["ROI"],
            mode="markers",
            marker=dict(
                size=df["使用订单数"] / 5 + 10,
                color=df["实际收入"],
                colorscale="Viridis",
                showscale=True,
                colorbar=dict(title="实际收入"),
            ),
            text=df["promotion_name"],
            hovertemplate="活动: %{text}<br>优惠投入: ¥%{x:,.0f}<br>ROI: %{y:.2f}<extra></extra>",
        )
    )

    fig.add_shape(
        type="line",
        y0=0,
        y1=0,
        x0=df["优惠金额"].min(),
        x1=df["优惠金额"].max(),
        line=dict(dash="dash", color="red"),
    )

    fig.update_layout(
        xaxis_title="优惠投入金额 (元)",
        yaxis_title="投资回报率 (ROI)",
    )
    return _apply_chart_style(fig, "促销活动ROI分析")


def plot_refund_by_reason(df: pd.DataFrame) -> go.Figure:
    if df.empty:
        return go.Figure()

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=df["reason"],
            y=df["退款金额"],
            marker=dict(color=COLOR_PALETTE["danger"]),
            text=df["退款金额"].apply(lambda x: f"¥{x:,.0f}"),
            textposition="outside",
            hovertemplate="原因: %{x}<br>退款金额: ¥%{y:,.0f}<extra></extra>",
        )
    )

    fig.update_layout(
        xaxis_title="退款原因",
        yaxis_title="退款金额 (元)",
    )
    return _apply_chart_style(fig, "退款原因分析")


def plot_hourly_heatmap(df: pd.DataFrame) -> go.Figure:
    if df.empty or "order_hour" not in df.columns or "day_of_week" not in df.columns:
        return go.Figure()

    heatmap_data = (
        df.groupby(["day_of_week", "order_hour"])["order_id"]
        .nunique()
        .reset_index()
        .pivot(index="day_of_week", columns="order_hour", values="order_id")
        .fillna(0)
    )

    day_names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    heatmap_data.index = [day_names[d] if d < 7 else str(d) for d in heatmap_data.index]

    fig = go.Figure(
        data=go.Heatmap(
            z=heatmap_data.values,
            x=heatmap_data.columns,
            y=heatmap_data.index,
            colorscale="YlOrRd",
            hovertemplate="时段: %{y} %{x}:00<br>订单数: %{z}<extra></extra>",
        )
    )

    fig.update_layout(
        xaxis_title="小时",
        yaxis_title="星期",
    )
    return _apply_chart_style(fig, "营业时段订单热力图")


def plot_anomaly_bars(df: pd.DataFrame, metric: str = "营业额") -> go.Figure:
    if df.empty or "状态" not in df.columns:
        return go.Figure()

    color_map = {"正常": COLOR_PALETTE["success"], "异常偏高": COLOR_PALETTE["warning"], "异常偏低": COLOR_PALETTE["danger"], "异常": COLOR_PALETTE["danger"]}

    fig = go.Figure()
    for status in df["状态"].unique():
        subset = df[df["状态"] == status]
        fig.add_trace(
            go.Bar(
                x=subset["store_name"],
                y=subset[metric],
                name=status,
                marker=dict(color=color_map.get(status, "#999")),
                text=subset[metric].apply(lambda x: f"¥{x:,.0f}"),
                textposition="outside",
                hovertemplate=f"门店: %{{x}}<br>{metric}: %{{y:,.0f}}<br>状态: %{{data.name}}<extra></extra>",
            )
        )

    fig.update_layout(
        xaxis_title="门店",
        yaxis_title=metric,
        barmode="stack",
        showlegend=True,
    )
    return _apply_chart_style(fig, f"门店{metric}异常检测")


def plot_dish_combination(df: pd.DataFrame, top_n: int = 10) -> go.Figure:
    if df.empty:
        return go.Figure()

    top = df.head(top_n).sort_values("支持度", ascending=True)

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            y=top["菜品组合"],
            x=top["支持度"],
            orientation="h",
            marker=dict(color=COLOR_PALETTE["purple"]),
            text=top["支持度"].apply(lambda x: f"{x:.1f}%"),
            textposition="outside",
            hovertemplate="组合: %{y}<br>支持度: %{x:.2f}%<extra></extra>",
        )
    )

    fig.update_layout(
        xaxis_title="支持度 (%)",
        yaxis_title="菜品组合",
        height=400 + top_n * 25,
    )
    return _apply_chart_style(fig, f"热门菜品组合TOP{top_n}")
