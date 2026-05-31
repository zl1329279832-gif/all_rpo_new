"""剖面切割模块 - 任意平面切割、正交剖面、等值面提取"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass
from typing import Optional, Tuple, List, Dict
import pyvista as pv

from .data_generator import VolcanoDataset
from .mesh_builder import MeshCollection
from .material_mapper import MaterialMapper


@dataclass
class ClipResult:
    """切割结果"""

    clipped_mesh: Optional[pv.DataSet]
    clip_surface: Optional[pv.PolyData]
    normal: np.ndarray
    origin: np.ndarray
    bounds: Tuple[float, float, float, float, float, float]


@dataclass
class ContourResult:
    """等值面结果"""

    contours: List[pv.PolyData]
    values: List[float]
    scalar_field: str


class VolcanoClipper:
    """火山剖面切割器"""

    def __init__(
        self,
        dataset: VolcanoDataset,
        meshes: MeshCollection,
        material_mapper: MaterialMapper,
    ):
        self.dataset = dataset
        self.params = dataset.params
        self.meshes = meshes
        self.material_mapper = material_mapper

    def clip_by_plane(
        self,
        origin: Tuple[float, float, float] = (0.0, 0.0, 0.0),
        normal: Tuple[float, float, float] = (1.0, 0.0, 0.0),
        invert: bool = False,
        show_clip_surface: bool = True,
    ) -> ClipResult:
        """任意平面切割"""

        normal = np.array(normal, dtype=np.float64)
        normal = normal / (np.linalg.norm(normal) + 1e-10)
        origin = np.array(origin, dtype=np.float64)

        if self.meshes.surface_mesh is None:
            return ClipResult(
                clipped_mesh=None,
                clip_surface=None,
                normal=normal,
                origin=origin,
                bounds=self._get_bounds(),
            )

        surface_clipped = self.meshes.surface_mesh.clip(
            normal=normal, origin=origin, invert=invert
        )

        volume_clipped = None
        if self.meshes.volume_mesh is not None:
            volume_clipped = self.meshes.volume_mesh.clip(
                normal=normal, origin=origin, invert=invert
            )

        if show_clip_surface and volume_clipped is not None:
            try:
                clip_surface = self.meshes.volume_mesh.slice(
                    normal=normal, origin=origin
                )
                self._apply_clip_surface_colors(clip_surface)
            except Exception:
                clip_surface = None
        else:
            clip_surface = None

        merged_mesh = self._merge_clipped_meshes(
            surface_clipped, volume_clipped, invert
        )

        return ClipResult(
            clipped_mesh=merged_mesh,
            clip_surface=clip_surface,
            normal=normal,
            origin=origin,
            bounds=self._get_bounds(),
        )

    def clip_x(
        self, x_value: float = 0.0, invert: bool = False
    ) -> ClipResult:
        """X轴正交剖面"""
        return self.clip_by_plane(
            origin=(x_value, 0.0, 0.0),
            normal=(1.0, 0.0, 0.0),
            invert=invert,
        )

    def clip_y(
        self, y_value: float = 0.0, invert: bool = False
    ) -> ClipResult:
        """Y轴正交剖面"""
        return self.clip_by_plane(
            origin=(0.0, y_value, 0.0),
            normal=(0.0, 1.0, 0.0),
            invert=invert,
        )

    def clip_z(
        self, z_value: float = 0.0, invert: bool = False
    ) -> ClipResult:
        """Z轴正交剖面"""
        return self.clip_by_plane(
            origin=(0.0, 0.0, z_value),
            normal=(0.0, 0.0, 1.0),
            invert=invert,
        )

    def clip_through_center(
        self, angle: float = 0.0, invert: bool = False
    ) -> ClipResult:
        """穿过中心的任意角度剖面

        Args:
            angle: 绕Z轴旋转角度（弧度）
        """
        normal = np.array([np.cos(angle), np.sin(angle), 0.0])
        return self.clip_by_plane(
            origin=(0.0, 0.0, 0.0),
            normal=tuple(normal),
            invert=invert,
        )

    def extract_contours(
        self,
        scalar_field: str = "temperature",
        values: Optional[List[float]] = None,
        num_contours: int = 10,
    ) -> ContourResult:
        """提取等值面"""

        if self.meshes.volume_mesh is None:
            return ContourResult(contours=[], values=[], scalar_field=scalar_field)

        mesh = self.meshes.volume_mesh

        if scalar_field not in mesh.array_names:
            return ContourResult(contours=[], values=[], scalar_field=scalar_field)

        if values is None:
            scalars = mesh[scalar_field]
            values = np.linspace(scalars.min(), scalars.max(), num_contours).tolist()

        contours = []
        for value in values:
            try:
                contour = mesh.contour([value], scalars=scalar_field)
                if contour.n_points > 0:
                    colormap = self.material_mapper.get_volume_colormap(scalar_field)
                    self._apply_contour_colors(contour, value, colormap)
                    contours.append(contour)
            except Exception:
                continue

        return ContourResult(
            contours=contours,
            values=values[: len(contours)],
            scalar_field=scalar_field,
        )

    def extract_isosurface(
        self,
        scalar_field: str = "temperature",
        value: float = 500.0,
    ) -> Optional[pv.PolyData]:
        """提取单值等值面"""
        result = self.extract_contours(scalar_field, values=[value])
        return result.contours[0] if result.contours else None

    def get_orthogonal_slices(
        self,
        x: Optional[float] = None,
        y: Optional[float] = None,
        z: Optional[float] = None,
    ) -> Dict[str, Optional[pv.PolyData]]:
        """获取正交切片组"""

        if self.meshes.volume_mesh is None:
            return {"x": None, "y": None, "z": None}

        x = x if x is not None else 0.0
        y = y if y is not None else 0.0
        z = z if z is not None else (self.params.z_range[0] + self.params.z_range[1]) / 2

        slices = {}

        try:
            slice_x = self.meshes.volume_mesh.slice(normal="x", origin=(x, 0, 0))
            self._apply_clip_surface_colors(slice_x)
            slices["x"] = slice_x
        except Exception:
            slices["x"] = None

        try:
            slice_y = self.meshes.volume_mesh.slice(normal="y", origin=(0, y, 0))
            self._apply_clip_surface_colors(slice_y)
            slices["y"] = slice_y
        except Exception:
            slices["y"] = None

        try:
            slice_z = self.meshes.volume_mesh.slice(normal="z", origin=(0, 0, z))
            self._apply_clip_surface_colors(slice_z)
            slices["z"] = slice_z
        except Exception:
            slices["z"] = None

        return slices

    def extract_profile_line(
        self,
        start: Tuple[float, float],
        end: Tuple[float, float],
        num_points: int = 200,
    ) -> Dict[str, np.ndarray]:
        """提取地形剖面线"""

        X, Y = self.dataset.surface_grid
        elevation = self.dataset.surface_elevation
        temperature = self.dataset.surface_temperature
        rock_type = self.dataset.surface_rock_type

        start = np.array(start)
        end = np.array(end)

        t = np.linspace(0, 1, num_points)
        points = start[None, :] + t[:, None] * (end - start)[None, :]

        elev_profile = np.zeros(num_points)
        temp_profile = np.zeros(num_points)
        rock_profile = np.zeros(num_points, dtype=np.int32)
        dist_profile = np.zeros(num_points)

        for i, (px, py) in enumerate(points):
            x_idx = np.clip(np.argmin(np.abs(X[0, :] - px)), 0, X.shape[1] - 1)
            y_idx = np.clip(np.argmin(np.abs(Y[:, 0] - py)), 0, Y.shape[0] - 1)

            elev_profile[i] = elevation[y_idx, x_idx]
            temp_profile[i] = temperature[y_idx, x_idx]
            rock_profile[i] = rock_type[y_idx, x_idx]
            dist_profile[i] = np.linalg.norm(points[i] - start)

        return {
            "distance": dist_profile,
            "elevation": elev_profile,
            "temperature": temp_profile,
            "rock_type": rock_profile,
            "points": points,
        }

    def extract_subsurface_profile(
        self,
        start: Tuple[float, float],
        end: Tuple[float, float],
        depth: float = -2000.0,
        num_points: int = 100,
        num_depths: int = 50,
    ) -> Dict[str, np.ndarray]:
        """提取地下剖面"""

        X_vol, Y_vol, Z_vol = self.dataset.volume_grid
        rock_type = self.dataset.volume_rock_type
        temperature = self.dataset.volume_temperature
        density = self.dataset.volume_density

        start = np.array(start)
        end = np.array(end)

        t = np.linspace(0, 1, num_points)
        z_levels = np.linspace(depth, 0, num_depths)

        points_2d = start[None, :] + t[:, None] * (end - start)[None, :]

        dist_profile = np.zeros(num_points)
        for i in range(num_points):
            dist_profile[i] = np.linalg.norm(points_2d[i] - start)

        profile_rock = np.zeros((num_depths, num_points), dtype=np.int32)
        profile_temp = np.zeros((num_depths, num_points))
        profile_dens = np.zeros((num_depths, num_points))

        for i, (px, py) in enumerate(points_2d):
            x_idx = np.clip(np.argmin(np.abs(X_vol[:, 0, 0] - px)), 0, X_vol.shape[0] - 1)
            y_idx = np.clip(np.argmin(np.abs(Y_vol[0, :, 0] - py)), 0, Y_vol.shape[1] - 1)

            profile_rock[:, i] = rock_type[y_idx, x_idx, ::-1]
            profile_temp[:, i] = temperature[y_idx, x_idx, ::-1]
            profile_dens[:, i] = density[y_idx, x_idx, ::-1]

        return {
            "distance": dist_profile,
            "depth": z_levels,
            "rock_type": profile_rock,
            "temperature": profile_temp,
            "density": profile_dens,
            "points_2d": points_2d,
        }

    def _apply_clip_surface_colors(self, clip_surface: pv.PolyData) -> None:
        """为切割面应用颜色"""

        if clip_surface is None or clip_surface.n_points == 0:
            return

        try:
            if "rock_type" in clip_surface.array_names:
                scalars = clip_surface["rock_type"]
                colormap = self.material_mapper.get_volume_colormap("rock_type")

                norm = np.clip(
                    (scalars - colormap.range[0])
                    / (colormap.range[1] - colormap.range[0] + 1e-10),
                    0,
                    1,
                )
                idx = (norm * (len(colormap.colors) - 1)).astype(np.int32)
                colors = colormap.colors[idx]

                clip_surface.point_data["RGB"] = colors
        except Exception:
            pass

    def _apply_contour_colors(
        self,
        contour: pv.PolyData,
        value: float,
        colormap,
    ) -> None:
        """为等值面应用颜色"""

        if contour.n_points == 0:
            return

        norm = np.clip(
            (value - colormap.range[0])
            / (colormap.range[1] - colormap.range[0] + 1e-10),
            0,
            1,
        )
        idx = int(norm * (len(colormap.colors) - 1))
        color = colormap.colors[idx]

        contour.point_data["RGB"] = np.tile(color, (contour.n_points, 1))
        contour.point_data["value"] = np.full(contour.n_points, value)

    def _merge_clipped_meshes(
        self,
        surface: Optional[pv.PolyData],
        volume: Optional[pv.DataSet],
        invert: bool,
    ) -> Optional[pv.DataSet]:
        """合并切割后的网格"""

        if surface is None and volume is None:
            return None

        if surface is not None and volume is None:
            return surface

        if surface is None and volume is not None:
            return volume

        try:
            blocks = pv.MultiBlock([surface, volume])
            return blocks
        except Exception:
            return surface

    def _get_bounds(self) -> Tuple[float, float, float, float, float, float]:
        """获取场景边界"""
        return (
            self.params.x_range[0],
            self.params.x_range[1],
            self.params.y_range[0],
            self.params.y_range[1],
            self.params.z_range[0],
            self.params.z_range[1],
        )

    def get_cross_section_view(
        self,
        angle: float = 0.0,
        show_layers: bool = True,
        show_faults: bool = True,
        show_magma: bool = True,
    ) -> List[pv.DataSet]:
        """获取完整的剖面视图"""

        clip_result = self.clip_through_center(angle=angle, invert=False)
        meshes = []

        if clip_result.clipped_mesh is not None:
            meshes.append(clip_result.clipped_mesh)

        if clip_result.clip_surface is not None:
            meshes.append(clip_result.clip_surface)

        if show_layers and self.meshes.rock_layer_meshes:
            for layer in self.meshes.rock_layer_meshes:
                clipped_layer = layer.clip(
                    normal=clip_result.normal,
                    origin=clip_result.origin,
                    invert=False,
                )
                if clipped_layer.n_points > 0:
                    meshes.append(clipped_layer)

        if show_faults and self.meshes.fault_meshes:
            for fault in self.meshes.fault_meshes:
                clipped_fault = fault.clip(
                    normal=clip_result.normal,
                    origin=clip_result.origin,
                    invert=False,
                )
                if clipped_fault.n_points > 0:
                    meshes.append(clipped_fault)

        if show_magma and self.meshes.magma_conduit_mesh is not None:
            clipped_magma = self.meshes.magma_conduit_mesh.clip(
                normal=clip_result.normal,
                origin=clip_result.origin,
                invert=False,
            )
            if clipped_magma.n_points > 0:
                meshes.append(clipped_magma)

        if show_magma and self.meshes.magma_chamber_mesh is not None:
            clipped_chamber = self.meshes.magma_chamber_mesh.clip(
                normal=clip_result.normal,
                origin=clip_result.origin,
                invert=False,
            )
            if clipped_chamber.n_points > 0:
                meshes.append(clipped_chamber)

        return meshes
