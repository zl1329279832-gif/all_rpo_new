"""动画模拟模块 - 熔岩流动、热力扩散、喷发动画"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass
from typing import Optional, List, Tuple, Callable, Dict
import pyvista as pv

from .data_generator import VolcanoDataset, VolcanoDataGenerator, VolcanoParameters
from .mesh_builder import MeshBuilder, MeshCollection
from .material_mapper import MaterialMapper


@dataclass
class AnimationFrame:
    """动画帧"""

    frame_index: int
    time: float
    dataset: VolcanoDataset
    meshes: MeshCollection
    camera_position: Optional[Tuple[float, float, float]] = None
    camera_focal_point: Optional[Tuple[float, float, float]] = None


@dataclass
class AnimationConfig:
    """动画配置"""

    num_frames: int = 100
    fps: int = 30
    start_time: float = 0.0
    end_time: float = 1.0
    loop: bool = False
    camera_path: Optional[List[Tuple[float, float, float]]] = None
    camera_focal_path: Optional[List[Tuple[float, float, float]]] = None


class VolcanoAnimator:
    """火山动画模拟器"""

    def __init__(
        self,
        data_generator: VolcanoDataGenerator,
        base_params: VolcanoParameters,
    ):
        self.data_generator = data_generator
        self.base_params = base_params
        self.params = base_params
        self.current_frame = 0

    def generate_frame(
        self,
        frame_index: int,
        config: AnimationConfig,
    ) -> AnimationFrame:
        """生成单帧动画"""

        t = config.start_time + (config.end_time - config.start_time) * (
            frame_index / max(config.num_frames - 1, 1)
        )

        params = self._interpolate_params(t)
        dataset = self.data_generator.generate_all()
        dataset = self.data_generator.update_dynamic_parameters(params, dataset)

        mesh_builder = MeshBuilder(dataset)
        meshes = mesh_builder.build_all()

        camera_pos = None
        camera_focal = None

        if config.camera_path is not None and len(config.camera_path) > 0:
            idx = min(frame_index, len(config.camera_path) - 1)
            camera_pos = config.camera_path[idx]

        if config.camera_focal_path is not None and len(config.camera_focal_path) > 0:
            idx = min(frame_index, len(config.camera_focal_path) - 1)
            camera_focal = config.camera_focal_path[idx]

        return AnimationFrame(
            frame_index=frame_index,
            time=t,
            dataset=dataset,
            meshes=meshes,
            camera_position=camera_pos,
            camera_focal_point=camera_focal,
        )

    def generate_all_frames(
        self,
        config: AnimationConfig,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> List[AnimationFrame]:
        """生成所有动画帧"""

        frames = []
        for i in range(config.num_frames):
            frame = self.generate_frame(i, config)
            frames.append(frame)

            if progress_callback is not None:
                progress_callback(i + 1, config.num_frames)

        return frames

    def _interpolate_params(self, t: float) -> VolcanoParameters:
        """根据时间插值参数"""

        params = VolcanoParameters()

        eruption_phase = self._get_eruption_phase(t)

        params.magma_pressure = self._interpolate_magma_pressure(t, eruption_phase)
        params.eruption_intensity = self._interpolate_eruption_intensity(t, eruption_phase)
        params.time_progress = t
        params.lava_viscosity = self._interpolate_lava_viscosity(t, eruption_phase)

        return params

    def _get_eruption_phase(self, t: float) -> str:
        """获取喷发阶段"""

        if t < 0.2:
            return "pre_eruption"
        elif t < 0.4:
            return "eruption_start"
        elif t < 0.7:
            return "main_eruption"
        elif t < 0.9:
            return "decline"
        else:
            return "post_eruption"

    def _interpolate_magma_pressure(self, t: float, phase: str) -> float:
        """插值岩浆压力"""

        base_pressure = self.base_params.magma_pressure

        if phase == "pre_eruption":
            return base_pressure * (0.6 + 0.4 * t / 0.2)
        elif phase == "eruption_start":
            phase_t = (t - 0.2) / 0.2
            return base_pressure * (1.0 + 0.3 * np.sin(phase_t * np.pi * 5))
        elif phase == "main_eruption":
            phase_t = (t - 0.4) / 0.3
            return base_pressure * (1.2 - 0.3 * phase_t + 0.1 * np.sin(phase_t * np.pi * 3))
        elif phase == "decline":
            phase_t = (t - 0.7) / 0.2
            return base_pressure * (0.9 - 0.3 * phase_t)
        else:
            phase_t = (t - 0.9) / 0.1
            return base_pressure * (0.6 - 0.2 * phase_t)

    def _interpolate_eruption_intensity(self, t: float, phase: str) -> float:
        """插值喷发强度"""

        base_intensity = self.base_params.eruption_intensity

        if phase == "pre_eruption":
            return base_intensity * 0.1 * (t / 0.2)
        elif phase == "eruption_start":
            phase_t = (t - 0.2) / 0.2
            return base_intensity * (0.2 + 0.8 * phase_t)
        elif phase == "main_eruption":
            phase_t = (t - 0.4) / 0.3
            return base_intensity * (1.0 + 0.2 * np.sin(phase_t * np.pi * 4))
        elif phase == "decline":
            phase_t = (t - 0.7) / 0.2
            return base_intensity * (1.2 - 0.7 * phase_t)
        else:
            phase_t = (t - 0.9) / 0.1
            return base_intensity * (0.5 - 0.4 * phase_t)

    def _interpolate_lava_viscosity(self, t: float, phase: str) -> float:
        """插值熔岩粘度"""

        base_viscosity = self.base_params.lava_viscosity

        if phase == "pre_eruption":
            return base_viscosity
        elif phase == "eruption_start":
            phase_t = (t - 0.2) / 0.2
            return base_viscosity * (1.0 - 0.3 * phase_t)
        elif phase == "main_eruption":
            phase_t = (t - 0.4) / 0.3
            return base_viscosity * (0.7 + 0.1 * phase_t)
        elif phase == "decline":
            phase_t = (t - 0.7) / 0.2
            return base_viscosity * (0.8 + 0.3 * phase_t)
        else:
            phase_t = (t - 0.9) / 0.1
            return base_viscosity * (1.1 + 0.2 * phase_t)

    def generate_eruption_particles(
        self,
        frame: AnimationFrame,
        num_particles: int = 500,
    ) -> pv.PolyData:
        """生成喷发粒子"""

        t = frame.time
        intensity = frame.dataset.params.eruption_intensity

        particles = []
        velocities = []

        for _ in range(num_particles):
            angle = np.random.uniform(0, 2 * np.pi)
            radius = np.random.uniform(0, self.params.crater_radius * 0.5)

            x = radius * np.cos(angle)
            y = radius * np.sin(angle)
            z = self.params.volcano_height * 0.9

            vel_angle = np.random.uniform(-np.pi / 4, np.pi / 4)
            vel_mag = 20 + 80 * intensity
            vz = vel_mag * np.cos(vel_angle)
            vxy = vel_mag * np.sin(vel_angle)

            vx = vxy * np.cos(angle) + np.random.randn() * 10
            vy = vxy * np.sin(angle) + np.random.randn() * 10
            vz = vz + np.random.randn() * 20

            age = np.random.uniform(0, t * 10)

            px = x + vx * age
            py = y + vy * age
            pz = z + vz * age - 4.9 * age**2

            if pz > 0:
                particles.append([px, py, pz])
                velocities.append([vx, vy, vz])

        if not particles:
            return pv.PolyData()

        particles = np.array(particles)
        poly = pv.PolyData(particles)

        ages = np.linalg.norm(particles[:, :2] - np.array([0, 0])[None, :], axis=1) / 100
        ages = np.clip(ages, 0, 1)

        poly.point_data["age"] = ages
        poly.point_data["size"] = 3 + 7 * (1 - ages)

        temp_colors = np.zeros((len(particles), 3))
        temp_colors[:, 0] = 1.0
        temp_colors[:, 1] = 0.8 * (1 - ages)
        temp_colors[:, 2] = 0.0
        poly.point_data["RGB"] = temp_colors

        return poly

    def generate_lava_flow_animation(
        self,
        frame: AnimationFrame,
        flow_index: int = 0,
    ) -> Optional[pv.PolyData]:
        """生成熔岩流动画"""

        if flow_index >= len(frame.meshes.lava_flow_meshes):
            return None

        flow_mesh = frame.meshes.lava_flow_meshes[flow_index]

        t = frame.time
        cool_factor = np.clip(1 - t * 0.3, 0.3, 1.0)

        colors = np.zeros((flow_mesh.n_points, 3))
        colors[:, 0] = 1.0
        colors[:, 1] = 0.4 * cool_factor * (1 - flow_mesh.point_data["progress"])
        colors[:, 2] = 0.0

        flow_mesh.point_data["RGB"] = colors
        flow_mesh.point_data["emissive"] = colors * 0.5

        return flow_mesh

    def generate_heat_diffusion(
        self,
        frame: AnimationFrame,
        num_levels: int = 5,
    ) -> List[pv.PolyData]:
        """生成热力扩散动画"""

        t = frame.time
        intensity = frame.dataset.params.eruption_intensity

        X, Y, Z = frame.dataset.volume_grid
        temp = frame.dataset.volume_temperature

        isosurfaces = []
        base_temp = 100 + 300 * intensity

        for i in range(num_levels):
            level_temp = base_temp * (1.0 - i * 0.15) * (1 + 0.2 * np.sin(t * np.pi * 2))

            try:
                grid = pv.StructuredGrid(X, Y, Z)
                grid.cell_data["temperature"] = temp.flatten(order="F")

                contour = grid.contour([level_temp], scalars="temperature")
                if contour.n_points > 0:
                    opacity = 0.3 * (1 - i / num_levels)

                    contour.point_data["RGB"] = np.tile(
                        np.array([1.0, 0.5 - i * 0.1, 0.0]),
                        (contour.n_points, 1),
                    )
                    contour.point_data["opacity"] = np.full(contour.n_points, opacity)
                    contour.point_data["temperature"] = np.full(
                        contour.n_points, level_temp
                    )

                    isosurfaces.append(contour)
            except Exception:
                continue

        return isosurfaces

    def generate_hazard_spread(
        self,
        frame: AnimationFrame,
    ) -> pv.PolyData:
        """生成危险区域扩散动画"""

        X, Y = frame.dataset.surface_grid
        elevation = frame.dataset.surface_elevation
        hazard = frame.dataset.hazard_zone

        mesh = pv.StructuredGrid(X, Y, elevation + 5)
        mesh = mesh.extract_surface()

        hazard_flat = hazard.flatten(order="F")
        colors = np.zeros((len(hazard_flat), 3))

        hazard_colors = np.array([
            [0.2, 0.8, 0.2],
            [1.0, 1.0, 0.0],
            [1.0, 0.5, 0.0],
            [1.0, 0.0, 0.0],
        ])

        for i in range(4):
            mask = hazard_flat == i
            colors[mask] = hazard_colors[i]

        mesh.point_data["RGB"] = colors
        mesh.point_data["hazard_level"] = hazard_flat

        opacity = np.where(hazard_flat > 0, 0.4 + 0.2 * hazard_flat, 0.0)
        mesh.point_data["opacity"] = opacity

        return mesh

    def create_camera_orbit(
        self,
        center: Tuple[float, float, float] = (0.0, 0.0, 400.0),
        distance: float = 4000.0,
        height: float = 1500.0,
        num_frames: int = 100,
    ) -> List[Tuple[float, float, float]]:
        """创建相机环绕路径"""

        path = []
        for i in range(num_frames):
            angle = 2 * np.pi * i / num_frames
            x = center[0] + distance * np.cos(angle)
            y = center[1] + distance * np.sin(angle)
            z = center[2] + height

            path.append((x, y, z))

        return path

    def create_zoom_animation(
        self,
        start_distance: float = 5000.0,
        end_distance: float = 1000.0,
        center: Tuple[float, float, float] = (0.0, 0.0, 400.0),
        angle: float = 0.0,
        height: float = 1000.0,
        num_frames: int = 100,
    ) -> List[Tuple[float, float, float]]:
        """创建变焦动画路径"""

        path = []
        for i in range(num_frames):
            t = i / max(num_frames - 1, 1)
            distance = start_distance * (1 - t) + end_distance * t

            x = center[0] + distance * np.cos(angle)
            y = center[1] + distance * np.sin(angle)
            z = center[2] + height * (1 - t * 0.5)

            path.append((x, y, z))

        return path

    def create_eruption_camera_path(
        self,
        num_frames: int = 100,
    ) -> Tuple[List[Tuple[float, float, float]], List[Tuple[float, float, float]]]:
        """创建喷发过程的相机路径和焦点路径"""

        camera_path = []
        focal_path = []

        for i in range(num_frames):
            t = i / max(num_frames - 1, 1)
            phase = self._get_eruption_phase(t)

            if phase == "pre_eruption":
                distance = 4000
                height = 1500
            elif phase == "eruption_start":
                distance = 4000 - 1500 * ((t - 0.2) / 0.2)
                height = 1500 - 500 * ((t - 0.2) / 0.2)
            elif phase == "main_eruption":
                distance = 2500
                height = 1000 + 500 * np.sin(((t - 0.4) / 0.3) * np.pi)
            elif phase == "decline":
                distance = 2500 + 1500 * ((t - 0.7) / 0.2)
                height = 1500
            else:
                distance = 4000
                height = 1500

            angle = 2 * np.pi * t * 0.3

            camera_path.append((
                distance * np.cos(angle),
                distance * np.sin(angle),
                height,
            ))

            focal_height = 400 + 800 * max(0, (t - 0.2) / 0.2) * (1 - max(0, (t - 0.7) / 0.3))
            focal_path.append((0.0, 0.0, focal_height))

        return camera_path, focal_path
