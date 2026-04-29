import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from typing import Dict, List, Optional, Any, Tuple
from utils.constants import COLOR_SCHEMES, DEFAULT_CONFIG


class Visualizer:
    """可视化类 - 负责创建各种图表"""

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or DEFAULT_CONFIG
        self.color_schemes = COLOR_SCHEMES

    def create_metric_card(self, 
                          title: str, 
                          value: Any, 
                          format_str: str = "{:,}",
                          delta: Optional[float] = None,
                          icon: str = "📊") -> Dict:
        """
        创建指标卡片数据
        
        Args:
            title: 指标标题
            value: 指标值
            format_str: 格式化字符串
            delta: 变化值(可选)
            icon: 图标
            
        Returns:
            指标卡片数据字典
        """
        try:
            formatted_value = format_str.format(value)
        except (ValueError, TypeError):
            formatted_value = str(value)

        return {
            'title': title,
            'value': formatted_value,
            'raw_value': value,
            'delta': delta,
            'icon': icon
        }

    def create_trend_chart(self,
                           data: pd.DataFrame,
                           x_col: str = 'period',
                           y_cols: List[str] = None,
                           title: str = '销售趋势分析',
                           yaxis_title: str = '金额',
                           show_grid: bool = True) -> go.Figure:
        """
        创建趋势折线图
        
        Args:
            data: 数据框
            x_col: X轴列名
            y_cols: Y轴列名列表
            title: 图表标题
            yaxis_title: Y轴标题
            show_grid: 是否显示网格
            
        Returns:
            Plotly Figure对象
        """
        if data is None or len(data) == 0:
            return self._create_empty_figure("暂无数据")

        if y_cols is None:
            y_cols = [col for col in data.columns if col != x_col]

        fig = go.Figure()

        colors = self.color_schemes['sequential']
        
        for i, y_col in enumerate(y_cols):
            color = colors[i % len(colors)]
            
            if y_col == 'revenue':
                name = '销售额'
            elif y_col == 'quantity':
                name = '销量'
            elif y_col == 'orders':
                name = '订单数'
            else:
                name = y_col

            fig.add_trace(
                go.Scatter(
                    x=data[x_col],
                    y=data[y_col],
                    mode='lines+markers',
                    name=name,
                    line=dict(color=color, width=3),
                    marker=dict(size=8, color=color),
                    hovertemplate='<b>%{x}</b><br>' + name + ': %{y:,.2f}<extra></extra>'
                )
            )

        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                xanchor='center',
                font=dict(size=18, color='#333')
            ),
            xaxis=dict(
                title='时间周期',
                showgrid=show_grid,
                gridcolor='#f0f0f0'
            ),
            yaxis=dict(
                title=yaxis_title,
                showgrid=show_grid,
                gridcolor='#f0f0f0',
                tickformat=','
            ),
            template=self.config['visualization']['template'],
            height=self.config['visualization']['height'],
            legend=dict(
                orientation='h',
                yanchor='bottom',
                y=1.02,
                xanchor='right',
                x=1
            ),
            hovermode='x unified'
        )

        return fig

    def create_bar_chart(self,
                         data: pd.DataFrame,
                         x_col: str,
                         y_col: str,
                         title: str = '柱状图',
                         orientation: str = 'v',
                         color_col: Optional[str] = None,
                         text_display: bool = True,
                         top_n: Optional[int] = None) -> go.Figure:
        """
        创建柱状图
        
        Args:
            data: 数据框
            x_col: X轴列名
            y_col: Y轴列名
            title: 图表标题
            orientation: 方向 ('v'=垂直, 'h'=水平)
            color_col: 颜色列名
            text_display: 是否显示数值标签
            top_n: 显示前N个
            
        Returns:
            Plotly Figure对象
        """
        if data is None or len(data) == 0:
            return self._create_empty_figure("暂无数据")

        plot_data = data.copy()
        
        if top_n:
            plot_data = plot_data.head(top_n)

        if orientation == 'h':
            plot_data = plot_data.sort_values(by=y_col, ascending=True)

        if color_col and color_col in plot_data.columns:
            fig = px.bar(
                plot_data,
                x=x_col if orientation == 'v' else y_col,
                y=y_col if orientation == 'v' else x_col,
                color=color_col,
                orientation=orientation,
                text_auto='.2s' if text_display else False,
                color_discrete_sequence=self.color_schemes['sequential']
            )
        else:
            fig = px.bar(
                plot_data,
                x=x_col if orientation == 'v' else y_col,
                y=y_col if orientation == 'v' else x_col,
                orientation=orientation,
                text_auto='.2s' if text_display else False,
                color_discrete_sequence=[self.color_schemes['primary']]
            )

        fig.update_traces(
            texttemplate='%{text}',
            textposition='outside'
        )

        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                xanchor='center',
                font=dict(size=18, color='#333')
            ),
            template=self.config['visualization']['template'],
            height=self.config['visualization']['height'],
            xaxis=dict(
                title=x_col if orientation == 'v' else y_col,
                tickangle=45 if orientation == 'v' and len(plot_data) > 5 else 0
            ),
            yaxis=dict(
                title=y_col if orientation == 'v' else x_col
            ),
            showlegend=False if not color_col else True
        )

        return fig

    def create_pie_chart(self,
                         data: pd.DataFrame,
                         name_col: str,
                         value_col: str,
                         title: str = '饼图',
                         hole: float = 0.4,
                         show_percentage: bool = True,
                         top_n: int = 8) -> go.Figure:
        """
        创建饼图/环形图
        
        Args:
            data: 数据框
            name_col: 名称列名
            value_col: 值列名
            title: 图表标题
            hole: 环形孔大小(0-1)
            show_percentage: 是否显示百分比
            top_n: 显示前N个, 剩余合并为"其他"
            
        Returns:
            Plotly Figure对象
        """
        if data is None or len(data) == 0:
            return self._create_empty_figure("暂无数据")

        plot_data = data.copy()
        
        if len(plot_data) > top_n:
            top_data = plot_data.head(top_n)
            other_value = plot_data.iloc[top_n:][value_col].sum()
            
            other_row = {name_col: '其他', value_col: other_value}
            plot_data = pd.concat([top_data, pd.DataFrame([other_row])], ignore_index=True)

        fig = px.pie(
            plot_data,
            names=name_col,
            values=value_col,
            hole=hole,
            color_discrete_sequence=self.color_schemes['sequential']
        )

        text_info = 'label+percent' if show_percentage else 'label'
        fig.update_traces(
            textposition='outside',
            textinfo=text_info,
            insidetextorientation='radial',
            hovertemplate='<b>%{label}</b><br>数量: %{value:,.2f}<br>占比: %{percent}<extra></extra>'
        )

        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                xanchor='center',
                font=dict(size=18, color='#333')
            ),
            template=self.config['visualization']['template'],
            height=self.config['visualization']['height'],
            showlegend=True,
            legend=dict(
                orientation='v',
                yanchor='middle',
                y=0.5,
                xanchor='right',
                x=1.2
            )
        )

        return fig

    def create_heatmap(self,
                       data: pd.DataFrame,
                       x_col: str,
                       y_col: str,
                       value_col: str,
                       title: str = '热力图',
                       aggfunc: str = 'sum') -> go.Figure:
        """
        创建热力图
        
        Args:
            data: 数据框
            x_col: X轴列名
            y_col: Y轴列名
            value_col: 值列名
            title: 图表标题
            aggfunc: 聚合函数
            
        Returns:
            Plotly Figure对象
        """
        if data is None or len(data) == 0:
            return self._create_empty_figure("暂无数据")

        pivot_table = pd.pivot_table(
            data,
            values=value_col,
            index=y_col,
            columns=x_col,
            aggfunc=aggfunc,
            fill_value=0
        )

        if len(pivot_table) == 0:
            return self._create_empty_figure("数据不足")

        fig = px.imshow(
            pivot_table,
            text_auto=True,
            aspect='auto',
            color_continuous_scale='Blues',
            labels=dict(
                x=x_col,
                y=y_col,
                color=value_col
            )
        )

        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                xanchor='center',
                font=dict(size=18, color='#333')
            ),
            template=self.config['visualization']['template'],
            height=self.config['visualization']['height'],
            xaxis=dict(tickangle=45)
        )

        return fig

    def create_combo_chart(self,
                           data: pd.DataFrame,
                           x_col: str,
                           bar_cols: List[str],
                           line_cols: List[str],
                           title: str = '组合图表',
                           secondary_y: bool = True) -> go.Figure:
        """
        创建组合图表(柱状+折线)
        
        Args:
            data: 数据框
            x_col: X轴列名
            bar_cols: 柱状图列名列表
            line_cols: 折线图列名列表
            title: 图表标题
            secondary_y: 是否使用双Y轴
            
        Returns:
            Plotly Figure对象
        """
        if data is None or len(data) == 0:
            return self._create_empty_figure("暂无数据")

        fig = make_subplots(
            specs=[[{"secondary_y": secondary_y}]],
            shared_xaxes=True
        )

        colors = self.color_schemes['sequential']

        for i, col in enumerate(bar_cols):
            color = colors[i % len(colors)]
            name = self._get_display_name(col)
            
            fig.add_trace(
                go.Bar(
                    x=data[x_col],
                    y=data[col],
                    name=name,
                    marker=dict(color=color),
                    hovertemplate='<b>%{x}</b><br>' + name + ': %{y:,.2f}<extra></extra>'
                ),
                secondary_y=False
            )

        for i, col in enumerate(line_cols):
            color = colors[(i + len(bar_cols)) % len(colors)]
            name = self._get_display_name(col)
            
            fig.add_trace(
                go.Scatter(
                    x=data[x_col],
                    y=data[col],
                    mode='lines+markers',
                    name=name,
                    line=dict(color=color, width=3),
                    marker=dict(size=8),
                    hovertemplate='<b>%{x}</b><br>' + name + ': %{y:,.2f}<extra></extra>'
                ),
                secondary_y=secondary_y
            )

        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                xanchor='center',
                font=dict(size=18, color='#333')
            ),
            template=self.config['visualization']['template'],
            height=self.config['visualization']['height'],
            legend=dict(
                orientation='h',
                yanchor='bottom',
                y=1.02,
                xanchor='right',
                x=1
            ),
            barmode='group'
        )

        fig.update_yaxes(title_text="数量/金额", secondary_y=False)
        if secondary_y:
            fig.update_yaxes(title_text="趋势指标", secondary_y=True)

        return fig

    def create_distribution_chart(self,
                                  data: pd.DataFrame,
                                  x_col: str,
                                  title: str = '分布图',
                                  nbins: int = 30) -> go.Figure:
        """
        创建分布图(直方图)
        
        Args:
            data: 数据框
            x_col: X轴列名
            title: 图表标题
            nbins: 分箱数量
            
        Returns:
            Plotly Figure对象
        """
        if data is None or len(data) == 0:
            return self._create_empty_figure("暂无数据")

        fig = px.histogram(
            data,
            x=x_col,
            nbins=nbins,
            marginal='box',
            color_discrete_sequence=[self.color_schemes['primary']],
            title=title
        )

        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                xanchor='center',
                font=dict(size=18, color='#333')
            ),
            template=self.config['visualization']['template'],
            height=self.config['visualization']['height'],
            xaxis=dict(title=x_col),
            yaxis=dict(title='频数'),
            showlegend=False
        )

        return fig

    def create_table_figure(self,
                            data: pd.DataFrame,
                            title: str = '数据表格',
                            max_rows: int = 50) -> go.Figure:
        """
        创建表格图表
        
        Args:
            data: 数据框
            title: 表格标题
            max_rows: 最大显示行数
            
        Returns:
            Plotly Figure对象
        """
        if data is None or len(data) == 0:
            return self._create_empty_figure("暂无数据")

        display_data = data.head(max_rows)

        fig = go.Figure(
            data=[
                go.Table(
                    header=dict(
                        values=list(display_data.columns),
                        fill_color=self.color_schemes['primary'],
                        font=dict(color='white', size=12),
                        align='left'
                    ),
                    cells=dict(
                        values=[display_data[col].tolist() for col in display_data.columns],
                        fill_color=[
                            ['#f8f9fa', '#ffffff'] * (len(display_data) // 2 + 1)
                        ],
                        align='left',
                        font=dict(size=11)
                    )
                )
            ]
        )

        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                xanchor='center',
                font=dict(size=18, color='#333')
            ),
            template=self.config['visualization']['template'],
            height=max(400, len(display_data) * 35 + 100)
        )

        return fig

    def _create_empty_figure(self, message: str = "暂无数据") -> go.Figure:
        """创建空图表"""
        fig = go.Figure()
        
        fig.add_annotation(
            text=message,
            xref="paper",
            yref="paper",
            showarrow=False,
            font=dict(size=20, color="#999")
        )

        fig.update_layout(
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            height=self.config['visualization']['height'],
            template=self.config['visualization']['template']
        )

        return fig

    def _get_display_name(self, col: str) -> str:
        """获取列名的显示名称"""
        name_mapping = {
            'revenue': '销售额',
            'quantity': '销量',
            'orders': '订单数',
            'profit': '利润',
            'percentage': '占比',
            'avg_order_value': '客单价',
            'profit_margin': '利润率'
        }
        return name_mapping.get(col, col)
