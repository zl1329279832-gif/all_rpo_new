"""网格构建模块 - 结构化网格、非结构化网格、多尺度网格构建"""

from __future__ import annotations

import numpy as np
import pyvista as pv
from dataclasses import dataclass
from typing import Optional, Tuple, Dict, List

from .data_generator import VolcanoDataset


@dataclass
class MeshCollection:
    """网格集合"""

    surface_mesh: Optional[pv.PolyData] = None
    volume_mesh: Optional[pv.StructuredGrid] = None
    lava_flow_meshes: List[pv.PolyData] = None
    magma_chamber_mesh: Optional[pv.PolyData] = None
    magma_conduit_mesh: Optional[pv.PolyData] = None
    fault_meshes: List[pv.PolyData] = None
    rock_layer_meshes: List[pv.PolyData] = None
    hazard_zone_mesh: Optional[pv.PolyData] = None

    def __post_init__(self):
        if self.lava_flow_meshes is None:
            self.lava_flow_meshes = []
        if self.fault_meshes is None:
            self.fault_meshes = []
        if self.rock_layer_meshes is None:
            self.rock_layer_meshes = []

    def get_all_meshes(self) -> Dict[str, pv.DataSet]:
        """获取所有网格字典"""
        meshes = {
            "surface": self.surface_mesh,
            "volume": self.volume_mesh,
            "magma_chamber": self.magma_chamber_mesh,
            "magma_conduit": self.magma_conduit_mesh,
            "hazard_zone": self.hazard_zone_mesh,
        }
        for i, mesh in enumerate(self.lava_flow_meshes):
            meshes[f"lava_flow_{i}"] = mesh
        for i, mesh in enumerate(self.fault_meshes):
            meshes[f"fault_{i}"] = mesh
        for i, mesh in enumerate(self.rock_layer_meshes):
            meshes[f"rock_layer_{i}"] = mesh
        return {k: v for k, v in meshes.items() if v is not None}


class MeshBuilder:
    """火山网格构建器"""

    def __init__(self, dataset: VolcanoDataset):
        self.dataset = dataset
        self.params = dataset.params

    def build_all(self) -> MeshCollection:
        """构建所有网格"""
        meshes = MeshCollection()

        meshes.surface_mesh = self.build_surface_mesh()
        meshes.volume_mesh = self.build_volume_mesh()
        meshes.lava_flow_meshes = self.build_lava_flow_meshes()
        meshes.magma_chamber_mesh = self.build_magma_chamber_mesh()
        meshes.magma_conduit_mesh = self.build_magma_conduit_mesh()
        meshes.fault_meshes = self.build_fault_meshes()
        meshes.rock_layer_meshes = self.build_rock_layer_meshes()
        meshes.hazard_zone_mesh = self.build_hazard_zone_mesh()

        return meshes

    def build_surface_mesh(self) -> pv.PolyData:
        """构建地表网格"""
        X, Y = self.dataset.surface_grid
        elevation = self.dataset.surface_elevation

        mesh = pv.StructuredGrid(X, Y, elevation)
        mesh = mesh.extract_surface(algorithm='dataset_surface')

        mesh.point_data["elevation"] = elevation.flatten(order="F")
        mesh.point_data["rock_type"] = self.dataset.surface_rock_type.flatten(order="F")
        mesh.point_data["temperature"] = self.dataset.surface_temperature.flatten(order="F")
        mesh.point_data["vegetation"] = self.dataset.surface_vegetation.flatten(order="F")
        mesh.point_data["lava_thickness"] = self.dataset.lava_thickness.flatten(order="F")
        mesh.point_data["hazard_level"] = self.dataset.hazard_zone.flatten(order="F")

        mesh.compute_normals(inplace=True)

        return mesh

    def build_volume_mesh(self) -> pv.StructuredGrid:
        """构建体网格"""
        X, Y, Z = self.dataset.volume_grid

        mesh = pv.StructuredGrid(X, Y, Z)

        mesh.point_data["rock_type"] = self.dataset.volume_rock_type.flatten(order="F")
        mesh.point_data["temperature"] = self.dataset.volume_temperature.flatten(order="F")
        mesh.point_data["density"] = self.dataset.volume_density.flatten(order="F")
        mesh.point_data["fracture"] = self.dataset.volume_fracture.flatten(order="F")
        mesh.point_data["magma_conduit"] = self.dataset.magma_conduit_mask.flatten(order="F")

        return mesh

    def build_lava_flow_meshes(self) -> List[pv.PolyData]:
        """构建熔岩流网格"""
        meshes = []
        X, Y = self.dataset.surface_grid
        elevation = self.dataset.surface_elevation

        for path in self.dataset.lava_flow_paths:
            if len(path) < 2:
                continue

            time_factor = self.params.time_progress
            active_length = int(len(path) * time_factor)
            if active_length < 2:
                continue

            active_path = path[:active_length]

            points_3d = np.zeros((len(active_path), 3))
            points_3d[:, :2] = active_path

            for i, (px, py) in enumerate(active_path):
                x_idx = np.argmin(np.abs(X[0, :] - px))
                y_idx = np.argmin(np.abs(Y[:, 0] - py))
                x_idx = np.clip(x_idx, 0, X.shape[1] - 1)
                y_idx = np.clip(y_idx, 0, Y.shape[0] - 1)
                points_3d[i, 2] = elevation[y_idx, x_idx] + 5

            line = pv.lines_from_points(points_3d)

            thickness = np.linspace(30, 10, len(points_3d))
            line.point_data["thickness"] = thickness
            line.point_data["progress"] = np.linspace(1, 0, len(points_3d))
            line.point_data["temperature"] = np.linspace(800, 300, len(points_3d))

            tube = line.tube(radius=15, n_sides=12)
            tube.point_data["thickness"] = tube.point_data["thickness"]
            tube.point_data["progress"] = tube.point_data["progress"]
            tube.point_data["temperature"] = tube.point_data["temperature"]

            meshes.append(tube)

        return meshes

    def build_magma_chamber_mesh(self) -> Optional[pv.PolyData]:
        """构建岩浆房网格"""
        X, Y, Z = self.dataset.volume_grid

        chamber_mask = self.dataset.volume_rock_type == 4
        if not np.any(chamber_mask):
            return None

        values = np.zeros_like(X)
        values[chamber_mask] = 1

        grid = pv.StructuredGrid(X, Y, Z)
        grid.point_data["chamber"] = values.flatten(order="F")

        try:
            contour = grid.contour([0.5], scalars="chamber")
            if contour.n_points > 0:
                contour.point_data["temperature"] = np.interp(
                    contour.points[:, 2],
                    [self.params.magma_chamber_depth, 0],
                    [1200, 800],
                )
                return contour
        except Exception:
            pass

        sphere = pv.Sphere(
            radius=self.params.magma_chamber_radius * 0.8,
            center=(0, 0, self.params.magma_chamber_depth),
            theta_resolution=30,
            phi_resolution=30,
        )
        sphere.point_data["temperature"] = np.full(sphere.n_points, 1000.0)

        return sphere

    def build_magma_conduit_mesh(self) -> Optional[pv.PolyData]:
        """构建岩浆通道网格"""
        conduit_mask = self.dataset.magma_conduit_mask
        if not np.any(conduit_mask > 0.5):
            return None

        X, Y, Z = self.dataset.volume_grid

        points = []
        z_levels = np.linspace(self.params.magma_chamber_depth, 0, 30)
        for z in z_levels:
            height_factor = (z - self.params.magma_chamber_depth) / (-self.params.magma_chamber_depth)
            radius = self.params.conduit_radius * (
                0.3 + 0.7 * height_factor
            ) * (1 + 0.3 * self.params.magma_pressure)

            wobble = 20 * np.sin(z * 0.01)
            points.append([wobble, -wobble * 0.5, z])

        points = np.array(points)
        line = pv.lines_from_points(points)
        tube = line.tube(radius=self.params.conduit_radius * 0.6, n_sides=16)

        tube.point_data["temperature"] = np.interp(
            tube.points[:, 2],
            [self.params.magma_chamber_depth, 0],
            [1200, 900],
        )
        tube.point_data["pressure"] = np.interp(
            tube.points[:, 2],
            [self.params.magma_chamber_depth, 0],
            [self.params.magma_pressure * 100, self.params.magma_pressure * 50],
        )

        return tube

    def build_fault_meshes(self) -> List[pv.PolyData]:
        """构建断裂带网格"""
        meshes = []
        X, Y, Z = self.dataset.volume_grid

        for fault in self.dataset.fault_zones:
            strike = fault["strike"]
            dip = fault["dip"]

            normal = np.array([
                -np.sin(strike) * np.sin(dip),
                np.cos(strike) * np.sin(dip),
                -np.cos(dip),
            ])

            origin = np.array([0, 0, self.params.z_range[0] / 2])

            bounds = [
                self.params.x_range[0], self.params.x_range[1],
                self.params.y_range[0], self.params.y_range[1],
                self.params.z_range[0], self.params.z_range[1],
            ]

            plane = pv.Plane(
                center=origin,
                direction=normal,
                i_size=self.params.x_range[1] - self.params.x_range[0],
                j_size=self.params.z_range[1] - self.params.z_range[0],
                i_resolution=20,
                j_resolution=20,
            )

            plane = plane.clip_box(bounds, invert=False)

            plane.cell_data["fracture_density"] = np.full(
                plane.n_cells, fault["fracture_density"]
            )
            plane.cell_data["displacement"] = np.full(
                plane.n_cells, fault["displacement"]
            )
            plane.point_data["fault_id"] = np.full(plane.n_points, fault["id"])

            meshes.append(plane)

        return meshes

    def build_rock_layer_meshes(self) -> List[pv.PolyData]:
        """构建岩层网格"""
        meshes = []
        X, Y, Z = self.dataset.volume_grid

        for layer in self.dataset.rock_layers:
            z_min, z_max = layer["z_range"]

            layer_mid = (z_min + z_max) / 2
            surface = pv.StructuredGrid(
                X[:, :, 0], Y[:, :, 0], np.full_like(X[:, :, 0], layer_mid)
            )
            surface = surface.extract_surface(algorithm='dataset_surface')

            noise = self._layer_noise(X[:, :, 0], Y[:, :, 0], layer["id"])
            surface.points[:, 2] += noise.flatten(order="F") * 20

            surface.point_data["layer_id"] = np.full(surface.n_points, layer["id"])
            surface.point_data["density"] = np.full(surface.n_points, layer["density"])
            surface.point_data["thickness"] = np.full(surface.n_points, layer["thickness"])

            color = np.array(layer["color"])
            surface.point_data["color_r"] = np.full(surface.n_points, color[0])
            surface.point_data["color_g"] = np.full(surface.n_points, color[1])
            surface.point_data["color_b"] = np.full(surface.n_points, color[2])

            meshes.append(surface)

        return meshes

    def build_hazard_zone_mesh(self) -> pv.PolyData:
        """构建危险区域网格"""
        X, Y = self.dataset.surface_grid
        elevation = self.dataset.surface_elevation
        hazard = self.dataset.hazard_zone

        mesh = pv.StructuredGrid(X, Y, elevation + 10)
        mesh = mesh.extract_surface(algorithm='dataset_surface')

        mesh.point_data["hazard_level"] = hazard.flatten(order="F")
        mesh.point_data["elevation"] = elevation.flatten(order="F")

        return mesh

    def _layer_noise(self, X: np.ndarray, Y: np.ndarray, layer_id: int) -> np.ndarray:
        """生成岩层界面噪声"""
        from .utils import perlin_noise_2d

        noise = perlin_noise_2d(
            X, Y,
            scale=400 + layer_id * 50,
            octaves=4,
            persistence=0.5,
            seed=self.params.seed + 20 + layer_id,
        )

        return noise

    def build_multiscale_surface(
        self,
        refinement_regions: Optional[List[Tuple[float, float, float]]] = None,
    ) -> pv.PolyData:
        """构建多尺度地表网格

        Args:
            refinement_regions: 需要细化的区域列表 [(x, y, radius), ...]
        """
        X, Y = self.dataset.surface_grid
        elevation = self.dataset.surface_elevation

        if refinement_regions is None:
            refinement_regions = [
                (0, 0, self.params.crater_radius * 2),
            ]

        mesh = pv.StructuredGrid(X, Y, elevation)
        mesh = mesh.extract_surface(algorithm='dataset_surface')

        for (cx, cy, radius) in refinement_regions:
            dist = np.sqrt(
                (mesh.points[:, 0] - cx) ** 2 + (mesh.points[:, 1] - cy) ** 2
            )
            refine_mask = dist < radius

            if np.any(refine_mask):
                try:
                    subset = mesh.extract_points(np.where(refine_mask)[0])
                    if subset.n_cells > 0:
                        subset = subset.subdivide(1, subfilter="linear")
                except Exception:
                    pass

        mesh.point_data["elevation"] = elevation.flatten(order="F")
        mesh.point_data["rock_type"] = self.dataset.surface_rock_type.flatten(order="F")
        mesh.point_data["temperature"] = self.dataset.surface_temperature.flatten(order="F")

        return mesh

    def build_unstructured_volume(self) -> pv.UnstructuredGrid:
        """构建非结构化体网格"""
        X, Y, Z = self.dataset.volume_grid

        structured = pv.StructuredGrid(X, Y, Z)
        unstructured = structured.cast_to_unstructured_grid()

        unstructured.cell_data["rock_type"] = self.dataset.volume_rock_type.flatten(order="F")
        unstructured.cell_data["temperature"] = self.dataset.volume_temperature.flatten(order="F")
        unstructured.cell_data["density"] = self.dataset.volume_density.flatten(order="F")
        unstructured.cell_data["fracture"] = self.dataset.volume_fracture.flatten(order="F")

        return unstructured
