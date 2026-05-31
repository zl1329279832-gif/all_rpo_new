"""材质映射模块 - 颜色映射、透明度、材质属性"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple, List
import pyvista as pv

from .data_generator import VolcanoDataset


@dataclass
class MaterialProperty:
    """材质属性"""

    color: Tuple[float, float, float]
    opacity: float = 1.0
    roughness: float = 0.5
    metallic: float = 0.0
    emissive: Tuple[float, float, float] = (0.0, 0.0, 0.0)


@dataclass
class ColormapConfig:
    """颜色映射配置"""

    name: str
    values: np.ndarray
    colors: np.ndarray
    range: Tuple[float, float]


class MaterialMapper:
    """火山材质映射器"""

    def __init__(self, dataset: VolcanoDataset):
        self.dataset = dataset
        self.params = dataset.params

        self._init_colormaps()
        self._init_materials()

    def _init_colormaps(self):
        """初始化颜色映射表"""

        self.rock_type_colors = np.array([
            [0.4, 0.35, 0.3],
            [0.5, 0.4, 0.35],
            [0.6, 0.5, 0.45],
            [0.7, 0.6, 0.5],
            [0.9, 0.3, 0.1],
            [1.0, 0.2, 0.0],
        ])
        self.rock_type_names = [
            "玄武岩",
            "安山岩",
            "流纹岩",
            "火山碎屑岩",
            "熔岩流",
            "岩浆通道",
        ]

        self.volume_rock_colors = np.array([
            [0.6, 0.55, 0.45],
            [0.5, 0.45, 0.6],
            [0.4, 0.35, 0.35],
            [0.45, 0.35, 0.3],
            [0.9, 0.2, 0.0],
            [1.0, 0.15, 0.0],
        ])
        self.volume_rock_names = [
            "沉积层",
            "变质层",
            "古老火成岩",
            "新火成岩",
            "岩浆房",
            "岩浆通道",
        ]

        self.hazard_colors = np.array([
            [0.2, 0.8, 0.2],
            [1.0, 1.0, 0.0],
            [1.0, 0.5, 0.0],
            [1.0, 0.0, 0.0],
        ])
        self.hazard_names = [
            "安全区",
            "警戒区",
            "危险区",
            "极危险区",
        ]

    def _init_materials(self):
        """初始化材质属性"""

        self.surface_material = MaterialProperty(
            color=(0.6, 0.55, 0.45),
            opacity=1.0,
            roughness=0.8,
            metallic=0.0,
        )

        self.lava_material = MaterialProperty(
            color=(0.9, 0.2, 0.0),
            opacity=0.95,
            roughness=0.3,
            metallic=0.1,
            emissive=(0.5, 0.1, 0.0),
        )

        self.magma_material = MaterialProperty(
            color=(1.0, 0.15, 0.0),
            opacity=0.8,
            roughness=0.2,
            metallic=0.2,
            emissive=(0.8, 0.1, 0.0),
        )

        self.rock_layer_materials = [
            MaterialProperty(color=tuple(c), opacity=0.9, roughness=0.9)
            for c in self.volume_rock_colors[:4]
        ]

        self.fault_material = MaterialProperty(
            color=(0.3, 0.3, 0.35),
            opacity=0.7,
            roughness=0.95,
            metallic=0.0,
        )

        self.vegetation_material = MaterialProperty(
            color=(0.2, 0.6, 0.2),
            opacity=0.8,
            roughness=0.9,
            metallic=0.0,
        )

    def get_surface_colormap(
        self, scalar_field: str = "elevation"
    ) -> ColormapConfig:
        """获取地表颜色映射"""

        if scalar_field == "elevation":
            elev = self.dataset.surface_elevation
            values = np.linspace(elev.min(), elev.max(), 256)
            colors = self._elevation_colormap(values)
            return ColormapConfig(
                name="地形高程",
                values=values,
                colors=colors,
                range=(float(elev.min()), float(elev.max())),
            )

        elif scalar_field == "rock_type":
            values = np.arange(len(self.rock_type_colors))
            return ColormapConfig(
                name="岩石类型",
                values=values,
                colors=self.rock_type_colors,
                range=(0, len(self.rock_type_colors) - 1),
            )

        elif scalar_field == "temperature":
            temp = self.dataset.surface_temperature
            values = np.linspace(temp.min(), temp.max(), 256)
            colors = self._temperature_colormap(values)
            return ColormapConfig(
                name="地表温度",
                values=values,
                colors=colors,
                range=(float(temp.min()), float(temp.max())),
            )

        elif scalar_field == "vegetation":
            veg = self.dataset.surface_vegetation
            values = np.linspace(0, 1, 256)
            colors = self._vegetation_colormap(values)
            return ColormapConfig(
                name="植被覆盖",
                values=values,
                colors=colors,
                range=(0.0, 1.0),
            )

        elif scalar_field == "lava_thickness":
            thick = self.dataset.lava_thickness
            values = np.linspace(0, thick.max(), 256)
            colors = self._lava_colormap(values)
            return ColormapConfig(
                name="熔岩厚度",
                values=values,
                colors=colors,
                range=(0.0, float(thick.max())),
            )

        elif scalar_field == "hazard_level":
            values = np.arange(len(self.hazard_colors))
            return ColormapConfig(
                name="危险等级",
                values=values,
                colors=self.hazard_colors,
                range=(0, len(self.hazard_colors) - 1),
            )

        else:
            elev = self.dataset.surface_elevation
            values = np.linspace(elev.min(), elev.max(), 256)
            colors = self._elevation_colormap(values)
            return ColormapConfig(
                name=scalar_field,
                values=values,
                colors=colors,
                range=(float(elev.min()), float(elev.max())),
            )

    def get_volume_colormap(
        self, scalar_field: str = "temperature"
    ) -> ColormapConfig:
        """获取体数据颜色映射"""

        if scalar_field == "rock_type":
            values = np.arange(len(self.volume_rock_colors))
            return ColormapConfig(
                name="岩石类型",
                values=values,
                colors=self.volume_rock_colors,
                range=(0, len(self.volume_rock_colors) - 1),
            )

        elif scalar_field == "temperature":
            temp = self.dataset.volume_temperature
            values = np.linspace(temp.min(), temp.max(), 256)
            colors = self._temperature_colormap(values)
            return ColormapConfig(
                name="地下温度",
                values=values,
                colors=colors,
                range=(float(temp.min()), float(temp.max())),
            )

        elif scalar_field == "density":
            dens = self.dataset.volume_density
            values = np.linspace(dens.min(), dens.max(), 256)
            colors = self._density_colormap(values)
            return ColormapConfig(
                name="岩石密度",
                values=values,
                colors=colors,
                range=(float(dens.min()), float(dens.max())),
            )

        elif scalar_field == "fracture":
            frac = self.dataset.volume_fracture
            values = np.linspace(0, 1, 256)
            colors = self._fracture_colormap(values)
            return ColormapConfig(
                name="断裂密度",
                values=values,
                colors=colors,
                range=(0.0, 1.0),
            )

        else:
            temp = self.dataset.volume_temperature
            values = np.linspace(temp.min(), temp.max(), 256)
            colors = self._temperature_colormap(values)
            return ColormapConfig(
                name=scalar_field,
                values=values,
                colors=colors,
                range=(float(temp.min()), float(temp.max())),
            )

    def _elevation_colormap(self, values: np.ndarray) -> np.ndarray:
        """高程颜色映射"""
        norm = (values - values.min()) / (values.max() - values.min() + 1e-10)

        colors = np.zeros((len(values), 3))

        colors[norm < 0.2] = np.array([0.6, 0.55, 0.45])
        mask = (norm >= 0.2) & (norm < 0.5)
        t = (norm[mask] - 0.2) / 0.3
        colors[mask] = np.array([0.6, 0.55, 0.45])[None, :] * (1 - t[:, None]) + \
                       np.array([0.5, 0.45, 0.35])[None, :] * t[:, None]

        mask = (norm >= 0.5) & (norm < 0.8)
        t = (norm[mask] - 0.5) / 0.3
        colors[mask] = np.array([0.5, 0.45, 0.35])[None, :] * (1 - t[:, None]) + \
                       np.array([0.4, 0.35, 0.3])[None, :] * t[:, None]

        colors[norm >= 0.8] = np.array([0.9, 0.9, 0.95])

        return colors

    def _temperature_colormap(self, values: np.ndarray) -> np.ndarray:
        """温度颜色映射 (从蓝色到红色到黄色到白色)"""
        norm = np.clip((values - values.min()) / (values.max() - values.min() + 1e-10), 0, 1)

        colors = np.zeros((len(values), 3))

        mask = norm < 0.25
        t = norm[mask] / 0.25
        colors[mask] = np.array([0.0, 0.0, 0.8])[None, :] * (1 - t[:, None]) + \
                       np.array([0.0, 0.5, 1.0])[None, :] * t[:, None]

        mask = (norm >= 0.25) & (norm < 0.5)
        t = (norm[mask] - 0.25) / 0.25
        colors[mask] = np.array([0.0, 0.5, 1.0])[None, :] * (1 - t[:, None]) + \
                       np.array([0.0, 1.0, 0.5])[None, :] * t[:, None]

        mask = (norm >= 0.5) & (norm < 0.75)
        t = (norm[mask] - 0.5) / 0.25
        colors[mask] = np.array([0.0, 1.0, 0.5])[None, :] * (1 - t[:, None]) + \
                       np.array([1.0, 0.5, 0.0])[None, :] * t[:, None]

        mask = norm >= 0.75
        t = (norm[mask] - 0.75) / 0.25
        colors[mask] = np.array([1.0, 0.5, 0.0])[None, :] * (1 - t[:, None]) + \
                       np.array([1.0, 1.0, 0.0])[None, :] * t[:, None]

        hot_mask = values > 500
        if np.any(hot_mask):
            t = np.clip((values[hot_mask] - 500) / 1000, 0, 1)
            colors[hot_mask] = np.array([1.0, 0.3, 0.0])[None, :] * (1 - t[:, None]) + \
                               np.array([1.0, 1.0, 1.0])[None, :] * t[:, None]

        return colors

    def _vegetation_colormap(self, values: np.ndarray) -> np.ndarray:
        """植被颜色映射"""
        colors = np.zeros((len(values), 3))

        t = np.clip(values, 0, 1)
        colors[:, 0] = 0.8 * (1 - t) + 0.1 * t
        colors[:, 1] = 0.6 * (1 - t) + 0.6 * t
        colors[:, 2] = 0.3 * (1 - t) + 0.1 * t

        return colors

    def _lava_colormap(self, values: np.ndarray) -> np.ndarray:
        """熔岩厚度颜色映射"""
        norm = values / (values.max() + 1e-10)

        colors = np.zeros((len(values), 3))
        t = np.clip(norm, 0, 1)

        colors[:, 0] = 1.0
        colors[:, 1] = 0.8 * (1 - t)
        colors[:, 2] = 0.0

        return colors

    def _density_colormap(self, values: np.ndarray) -> np.ndarray:
        """密度颜色映射"""
        norm = (values - values.min()) / (values.max() - values.min() + 1e-10)

        colors = np.zeros((len(values), 3))
        t = np.clip(norm, 0, 1)

        colors[:, 0] = 0.3 + 0.5 * t
        colors[:, 1] = 0.3 + 0.3 * t
        colors[:, 2] = 0.4 + 0.2 * (1 - t)

        return colors

    def _fracture_colormap(self, values: np.ndarray) -> np.ndarray:
        """断裂密度颜色映射"""
        colors = np.zeros((len(values), 3))
        t = np.clip(values, 0, 1)

        colors[:, 0] = 0.9 * (1 - t) + 0.3 * t
        colors[:, 1] = 0.9 * (1 - t) + 0.1 * t
        colors[:, 2] = 0.9 * (1 - t) + 0.1 * t

        return colors

    def get_opacity_transfer_function(
        self, field: str = "temperature"
    ) -> np.ndarray:
        """获取透明度传输函数"""

        if field == "temperature":
            temp = self.dataset.volume_temperature
            values = np.linspace(temp.min(), temp.max(), 256)
            opacity = np.zeros_like(values)

            mask = values > 500
            opacity[mask] = 0.8 * np.clip((values[mask] - 500) / 500, 0, 1)

            return opacity

        elif field == "magma":
            values = np.linspace(0, 1, 256)
            return 0.1 + 0.8 * values

        elif field == "rock_layers":
            return np.full(256, 0.7)

        else:
            return np.full(256, 0.3)

    def get_lava_animation_colors(self, time: float) -> np.ndarray:
        """获取熔岩动画颜色"""
        base_color = np.array([0.9, 0.2, 0.0])
        cool_factor = np.clip(1 - time * 0.5, 0.3, 1.0)

        colors = np.array([
            base_color * cool_factor,
            base_color * 0.8 * cool_factor,
            base_color * 0.6 * cool_factor,
            [0.5, 0.3, 0.2] * cool_factor,
        ])

        return colors

    def apply_material_to_mesh(
        self,
        mesh: pv.DataSet,
        material_type: str = "surface",
        scalar_field: Optional[str] = None,
    ) -> pv.DataSet:
        """将材质应用到网格"""

        if scalar_field is not None and scalar_field in mesh.array_names:
            if material_type == "surface":
                colormap = self.get_surface_colormap(scalar_field)
            elif material_type == "volume":
                colormap = self.get_volume_colormap(scalar_field)
            else:
                colormap = self.get_surface_colormap(scalar_field)

            scalars = mesh[scalar_field]
            norm = (scalars - colormap.range[0]) / (
                colormap.range[1] - colormap.range[0] + 1e-10
            )
            norm = np.clip(norm, 0, 1)

            idx = (norm * (len(colormap.colors) - 1)).astype(np.int32)
            colors = colormap.colors[idx]

            mesh.point_data["RGB"] = colors
            mesh.cell_data["RGB"] = colors[: mesh.n_cells] if mesh.n_cells > 0 else colors

        if material_type == "lava":
            mesh.point_data["emissive"] = np.tile(
                np.array([0.5, 0.1, 0.0]), (mesh.n_points, 1)
            )
        elif material_type == "magma":
            mesh.point_data["emissive"] = np.tile(
                np.array([0.8, 0.1, 0.0]), (mesh.n_points, 1)
            )

        return mesh

    def get_legend_items(self, field: str) -> List[Tuple[str, Tuple[float, float, float]]]:
        """获取图例项"""

        if field == "rock_type":
            return list(zip(self.rock_type_names, [tuple(c) for c in self.rock_type_colors]))
        elif field == "volume_rock":
            return list(zip(self.volume_rock_names, [tuple(c) for c in self.volume_rock_colors]))
        elif field == "hazard":
            return list(zip(self.hazard_names, [tuple(c) for c in self.hazard_colors]))
        else:
            return []

    def get_vegetation_overlay(
        self, opacity: float = 0.6
    ) -> Tuple[np.ndarray, np.ndarray]:
        """获取植被覆盖叠加层"""
        veg = self.dataset.surface_vegetation
        mask = veg > 0.1

        colors = np.zeros((len(veg.flatten()), 4))
        colors[:, 3] = veg.flatten() * opacity

        green_t = veg.flatten()[..., None]
        colors[:, 0] = 0.2 + 0.1 * green_t.flatten()
        colors[:, 1] = 0.5 + 0.3 * green_t.flatten()
        colors[:, 2] = 0.2 + 0.1 * green_t.flatten()

        return colors, mask
