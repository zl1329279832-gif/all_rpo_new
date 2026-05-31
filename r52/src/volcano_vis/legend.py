"""图例说明模块 - 颜色条、标注、地质图例"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass
from typing import Optional, List, Tuple, Dict
import pyvista as pv

from .data_generator import VolcanoDataset
from .material_mapper import MaterialMapper, ColormapConfig


@dataclass
class LegendItem:
    """图例项"""

    label: str
    color: Tuple[float, float, float]
    opacity: float = 1.0
    description: Optional[str] = None


@dataclass
class ColorbarConfig:
    """颜色条配置"""

    title: str
    colormap: ColormapConfig
    position: Tuple[float, float] = (0.85, 0.1)
    width: float = 0.1
    height: float = 0.75
    label_font_size: int = 10
    title_font_size: int = 12
    n_labels: int = 5


class LegendManager:
    """火山图例管理器"""

    def __init__(
        self,
        dataset: VolcanoDataset,
        material_mapper: MaterialMapper,
    ):
        self.dataset = dataset
        self.params = dataset.params
        self.material_mapper = material_mapper

    def get_rock_type_legend(self) -> List[LegendItem]:
        """获取岩石类型图例"""
        items = []
        legend_data = self.material_mapper.get_legend_items("rock_type")

        descriptions = [
            "基性火山岩，常见于低海拔区域",
            "中性火山岩，形成于中海拔",
            "酸性火山岩，分布于高海拔",
            "火山喷发碎屑物质",
            "正在流动的熔岩",
            "火山通道中的岩浆",
        ]

        for (name, color), desc in zip(legend_data, descriptions):
            items.append(
                LegendItem(
                    label=name,
                    color=color,
                    opacity=0.9,
                    description=desc,
                )
            )

        return items

    def get_volume_rock_legend(self) -> List[LegendItem]:
        """获取地下岩石类型图例"""
        items = []
        legend_data = self.material_mapper.get_legend_items("volume_rock")

        descriptions = [
            "表层沉积物，未固结",
            "区域变质作用形成",
            "早期岩浆活动形成",
            "较新的岩浆侵入体",
            "深部熔融岩浆储库",
            "岩浆上升通道",
        ]

        for (name, color), desc in zip(legend_data, descriptions):
            items.append(
                LegendItem(
                    label=name,
                    color=color,
                    opacity=0.8,
                    description=desc,
                )
            )

        return items

    def get_hazard_legend(self) -> List[LegendItem]:
        """获取危险等级图例"""
        items = []
        legend_data = self.material_mapper.get_legend_items("hazard")

        descriptions = [
            "无火山活动影响区域",
            "需关注火山活动动态",
            "可能受到熔岩流或火山灰影响",
            "极高危险，需立即撤离",
        ]

        for (name, color), desc in zip(legend_data, descriptions):
            items.append(
                LegendItem(
                    label=name,
                    color=color,
                    opacity=0.7,
                    description=desc,
                )
            )

        return items

    def get_structural_legend(self) -> List[LegendItem]:
        """获取地质构造图例"""
        items = [
            LegendItem(
                label="岩浆房",
                color=(0.9, 0.2, 0.0),
                opacity=0.8,
                description="地下熔融岩浆聚集区域",
            ),
            LegendItem(
                label="岩浆通道",
                color=(1.0, 0.15, 0.0),
                opacity=0.9,
                description="岩浆上升至地表的通道",
            ),
            LegendItem(
                label="断裂带",
                color=(0.3, 0.3, 0.35),
                opacity=0.7,
                description="岩石破裂并发生位移的区域",
            ),
            LegendItem(
                label="熔岩流",
                color=(0.95, 0.3, 0.0),
                opacity=0.95,
                description="喷出地表的熔融岩浆",
            ),
            LegendItem(
                label="火山口",
                color=(0.7, 0.6, 0.5),
                opacity=1.0,
                description="火山顶部的喷发出口",
            ),
        ]
        return items

    def get_vegetation_legend(self) -> List[LegendItem]:
        """获取植被覆盖图例"""
        items = [
            LegendItem(
                label="无植被",
                color=(0.8, 0.6, 0.3),
                opacity=0.8,
                description="裸岩或火山灰覆盖区域",
            ),
            LegendItem(
                label="稀疏植被",
                color=(0.5, 0.65, 0.3),
                opacity=0.8,
                description="草本和灌木零星分布",
            ),
            LegendItem(
                label="中等覆盖",
                color=(0.35, 0.6, 0.25),
                opacity=0.8,
                description="森林和灌丛交错分布",
            ),
            LegendItem(
                label="茂密植被",
                color=(0.2, 0.5, 0.15),
                opacity=0.8,
                description="成熟森林，植被覆盖率高",
            ),
        ]
        return items

    def add_colorbar(
        self,
        plotter: pv.Plotter,
        scalar_field: str = "elevation",
        surface_type: str = "surface",
        config: Optional[ColorbarConfig] = None,
    ) -> None:
        """向绘图器添加颜色条"""

        if surface_type == "surface":
            colormap = self.material_mapper.get_surface_colormap(scalar_field)
        else:
            colormap = self.material_mapper.get_volume_colormap(scalar_field)

        if config is None:
            config = ColorbarConfig(
                title=colormap.name,
                colormap=colormap,
            )

        cmap = self._create_lookup_table(colormap)

        plotter.add_scalar_bar(
            title=config.title,
            n_labels=config.n_labels,
            position_x=config.position[0],
            position_y=config.position[1],
            width=config.width,
            height=config.height,
            label_font_size=config.label_font_size,
            title_font_size=config.title_font_size,
            cmap=cmap,
            clim=colormap.range,
        )

    def add_legend(
        self,
        plotter: pv.Plotter,
        legend_items: List[LegendItem],
        position: str = "upper right",
        size: Tuple[float, float] = (0.2, 0.3),
        title: Optional[str] = None,
    ) -> None:
        """向绘图器添加图例"""

        legend_entries = []
        for item in legend_items:
            entry = [item.label, list(item.color)]
            legend_entries.append(entry)

        if legend_entries:
            plotter.add_legend(
                legend_entries,
                bcolor=(0.95, 0.95, 0.95),
                border=True,
                size=size,
                loc=position,
            )

            if title is not None:
                plotter.add_text(
                    title,
                    position="upper_right",
                    font_size=10,
                    color=(0.1, 0.1, 0.1),
                )

    def add_annotation(
        self,
        plotter: pv.Plotter,
        text: str,
        position: Tuple[float, float, float],
        font_size: int = 12,
        color: Tuple[float, float, float] = (0.0, 0.0, 0.0),
        show_point: bool = True,
        point_color: Optional[Tuple[float, float, float]] = None,
    ) -> None:
        """添加标注"""

        if show_point:
            if point_color is None:
                point_color = color
            sphere = pv.Sphere(radius=20, center=position)
            plotter.add_mesh(sphere, color=point_color, opacity=0.8)

        plotter.add_point_labels(
            [position],
            [text],
            font_size=font_size,
            text_color=color,
            point_size=0,
            shape=None,
            show_points=False,
        )

    def add_geological_annotations(
        self,
        plotter: pv.Plotter,
        show_magma_chamber: bool = True,
        show_crater: bool = True,
        show_flows: bool = True,
        show_faults: bool = True,
    ) -> None:
        """添加标准地质标注"""

        if show_magma_chamber:
            self.add_annotation(
                plotter,
                "岩浆房",
                (0.0, 0.0, self.params.magma_chamber_depth),
                font_size=14,
                color=(0.8, 0.2, 0.0),
                show_point=True,
                point_color=(1.0, 0.3, 0.0),
            )

        if show_crater:
            self.add_annotation(
                plotter,
                "火山口",
                (0.0, 0.0, self.params.volcano_height * 0.8),
                font_size=14,
                color=(0.5, 0.3, 0.2),
                show_point=True,
                point_color=(0.7, 0.5, 0.4),
            )

        if show_flows and self.dataset.lava_flow_paths:
            for i, path in enumerate(self.dataset.lava_flow_paths):
                if len(path) > 5:
                    mid_idx = len(path) // 2
                    pos = (path[mid_idx][0], path[mid_idx][1], 100.0)
                    self.add_annotation(
                        plotter,
                        f"熔岩流 {i+1}",
                        pos,
                        font_size=10,
                        color=(0.9, 0.3, 0.0),
                        show_point=False,
                    )

        if show_faults and self.dataset.fault_zones:
            for i, fault in enumerate(self.dataset.fault_zones):
                angle = fault["strike"]
                x = 500 * np.cos(angle)
                y = 500 * np.sin(angle)
                self.add_annotation(
                    plotter,
                    f"断裂带 {i+1}",
                    (x, y, -500.0),
                    font_size=10,
                    color=(0.2, 0.2, 0.3),
                    show_point=False,
                )

    def add_scale_bar(
        self,
        plotter: pv.Plotter,
        length: float = 500.0,
        position: str = "lower left",
        label: Optional[str] = None,
    ) -> None:
        """添加比例尺"""

        if label is None:
            label = f"{int(length)} m"

        plotter.add_scale_bar(
            length=length,
            location=position,
            font_size=10,
            fmt=label,
        )

    def add_axes(self, plotter: pv.Plotter, view_size: float = 0.1) -> None:
        """添加坐标轴"""
        plotter.add_axes(
            x_color="red",
            y_color="green",
            z_color="blue",
            line_width=2,
            labels_off=False,
        )
        plotter.show_bounds(
            grid="front",
            location="outer",
            ticks="both",
            show_xaxis=True,
            show_yaxis=True,
            show_zaxis=True,
            xtitle="X (m)",
            ytitle="Y (m)",
            ztitle="Z (m)",
            font_size=10,
        )

    def add_title(
        self,
        plotter: pv.Plotter,
        title: str,
        subtitle: Optional[str] = None,
        font_size: int = 16,
    ) -> None:
        """添加标题"""

        full_title = title
        if subtitle:
            full_title = f"{title}\n{subtitle}"

        plotter.add_text(
            full_title,
            position="upper_left",
            font_size=font_size,
            color=(0.1, 0.1, 0.1),
        )

    def add_time_stamp(
        self,
        plotter: pv.Plotter,
        time: float,
        total_time: float = 1.0,
        position: str = "lower_right",
    ) -> None:
        """添加时间戳"""

        stage = self._get_eruption_stage(time)
        time_text = f"时间: {time:.2f} / {total_time:.2f}\n阶段: {stage}"

        plotter.add_text(
            time_text,
            position=position,
            font_size=10,
            color=(0.1, 0.1, 0.1),
        )

    def _create_lookup_table(self, colormap: ColormapConfig) -> np.ndarray:
        """创建颜色查找表"""
        return colormap.colors

    def _get_eruption_stage(self, t: float) -> str:
        """获取喷发阶段名称"""
        if t < 0.2:
            return "喷发前"
        elif t < 0.4:
            return "喷发开始"
        elif t < 0.7:
            return "主喷发期"
        elif t < 0.9:
            return "喷发减弱"
        else:
            return "喷发后"

    def create_legend_figure(self) -> Dict[str, List[LegendItem]]:
        """创建完整的图例字典"""
        return {
            "地表岩石类型": self.get_rock_type_legend(),
            "地下岩石类型": self.get_volume_rock_legend(),
            "危险等级": self.get_hazard_legend(),
            "地质构造": self.get_structural_legend(),
            "植被覆盖": self.get_vegetation_legend(),
        }

    def get_colormap_configs(self) -> Dict[str, ColorbarConfig]:
        """获取所有颜色条配置"""
        configs = {}

        for field in ["elevation", "rock_type", "temperature", "vegetation", "lava_thickness", "hazard_level"]:
            colormap = self.material_mapper.get_surface_colormap(field)
            configs[f"surface_{field}"] = ColorbarConfig(
                title=colormap.name,
                colormap=colormap,
            )

        for field in ["rock_type", "temperature", "density", "fracture"]:
            colormap = self.material_mapper.get_volume_colormap(field)
            configs[f"volume_{field}"] = ColorbarConfig(
                title=colormap.name,
                colormap=colormap,
            )

        return configs
