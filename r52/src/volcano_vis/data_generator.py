"""数据生成模块 - 生成火山地形、岩层、岩浆通道、断裂带、熔岩流、热力分布、植被数据"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, Tuple, Optional, List
from .utils import (
    gaussian_2d,
    gaussian_3d,
    perlin_noise_2d,
    smoothstep,
    normalize,
    distance_to_point,
    distance_to_line,
    create_grid,
    create_surface_grid,
)


@dataclass
class VolcanoParameters:
    """火山参数配置"""

    x_range: Tuple[float, float] = (-2000, 2000)
    y_range: Tuple[float, float] = (-2000, 2000)
    z_range: Tuple[float, float] = (-3000, 1000)
    surface_resolution: int = 150
    volume_resolution: int = 60

    volcano_height: float = 800.0
    volcano_base_radius: float = 1500.0
    crater_radius: float = 300.0
    crater_depth: float = 150.0

    magma_chamber_depth: float = -1500.0
    magma_chamber_radius: float = 400.0
    conduit_radius: float = 80.0

    magma_pressure: float = 0.7
    eruption_intensity: float = 0.6
    time_progress: float = 0.0
    lava_viscosity: float = 0.5

    num_lava_flows: int = 5
    num_fault_zones: int = 3
    num_rock_layers: int = 5

    seed: int = 42


@dataclass
class VolcanoDataset:
    """火山数据集"""

    params: VolcanoParameters
    surface_grid: Tuple[np.ndarray, np.ndarray]
    volume_grid: Tuple[np.ndarray, np.ndarray, np.ndarray]

    surface_elevation: np.ndarray
    surface_rock_type: np.ndarray
    surface_temperature: np.ndarray
    surface_vegetation: np.ndarray
    lava_flow_paths: List[np.ndarray]

    volume_rock_type: np.ndarray
    volume_temperature: np.ndarray
    volume_density: np.ndarray
    volume_fracture: np.ndarray

    magma_conduit_mask: np.ndarray
    fault_zones: List[Dict]
    rock_layers: List[Dict]

    hazard_zone: np.ndarray
    lava_thickness: np.ndarray


class VolcanoDataGenerator:
    """火山数据生成器"""

    def __init__(self, params: Optional[VolcanoParameters] = None):
        self.params = params or VolcanoParameters()
        np.random.seed(self.params.seed)

    def generate_all(self) -> VolcanoDataset:
        """生成所有火山数据"""
        X_surf, Y_surf, _ = create_surface_grid(
            self.params.x_range,
            self.params.y_range,
            self.params.surface_resolution,
        )

        X_vol, Y_vol, Z_vol, _ = create_grid(
            self.params.x_range,
            self.params.y_range,
            self.params.z_range,
            self.params.volume_resolution,
        )

        surface_elevation = self._generate_surface_elevation(X_surf, Y_surf)
        lava_flow_paths = self._generate_lava_flow_paths(
            X_surf, Y_surf, surface_elevation
        )
        lava_thickness = self._generate_lava_thickness(
            X_surf, Y_surf, lava_flow_paths
        )

        surface_rock_type = self._generate_surface_rock_type(X_surf, Y_surf, surface_elevation)
        surface_temperature = self._generate_surface_temperature(
            X_surf, Y_surf, surface_elevation, lava_thickness
        )
        surface_vegetation = self._generate_surface_vegetation(
            X_surf, Y_surf, surface_elevation, surface_temperature
        )

        volume_rock_type = self._generate_volume_rock_type(X_vol, Y_vol, Z_vol)
        volume_temperature = self._generate_volume_temperature(
            X_vol, Y_vol, Z_vol, volume_rock_type
        )
        volume_density = self._generate_volume_density(
            X_vol, Y_vol, Z_vol, volume_rock_type, volume_temperature
        )
        volume_fracture = self._generate_volume_fracture(X_vol, Y_vol, Z_vol)

        magma_conduit_mask = self._generate_magma_conduit(X_vol, Y_vol, Z_vol)
        fault_zones = self._generate_fault_zones(X_vol, Y_vol, Z_vol)
        rock_layers = self._generate_rock_layers(X_vol, Y_vol, Z_vol)

        hazard_zone = self._generate_hazard_zone(
            X_surf, Y_surf, surface_elevation, lava_flow_paths
        )

        return VolcanoDataset(
            params=self.params,
            surface_grid=(X_surf, Y_surf),
            volume_grid=(X_vol, Y_vol, Z_vol),
            surface_elevation=surface_elevation,
            surface_rock_type=surface_rock_type,
            surface_temperature=surface_temperature,
            surface_vegetation=surface_vegetation,
            lava_flow_paths=lava_flow_paths,
            volume_rock_type=volume_rock_type,
            volume_temperature=volume_temperature,
            volume_density=volume_density,
            volume_fracture=volume_fracture,
            magma_conduit_mask=magma_conduit_mask,
            fault_zones=fault_zones,
            rock_layers=rock_layers,
            hazard_zone=hazard_zone,
            lava_thickness=lava_thickness,
        )

    def _generate_surface_elevation(
        self, X: np.ndarray, Y: np.ndarray
    ) -> np.ndarray:
        """生成火山地形高程"""
        dist_from_center = np.sqrt(X**2 + Y**2)

        cone_slope = self.params.volcano_height / self.params.volcano_base_radius
        volcano_cone = self.params.volcano_height - dist_from_center * cone_slope
        volcano_cone = np.maximum(volcano_cone, 0)

        crater = np.zeros_like(volcano_cone)
        crater_mask = dist_from_center < self.params.crater_radius
        crater[crater_mask] = -self.params.crater_depth * (
            1 - (dist_from_center[crater_mask] / self.params.crater_radius) ** 2
        )

        terrain_noise = perlin_noise_2d(
            X, Y, scale=300.0, octaves=5, persistence=0.5, seed=self.params.seed
        )
        terrain_noise = terrain_noise * 80

        base_elevation = 50 + perlin_noise_2d(
            X, Y, scale=800.0, octaves=3, persistence=0.6, seed=self.params.seed + 1
        ) * 30

        elevation = base_elevation + volcano_cone + crater + terrain_noise
        elevation = np.maximum(elevation, 0)

        return elevation

    def _generate_lava_flow_paths(
        self, X: np.ndarray, Y: np.ndarray, elevation: np.ndarray
    ) -> List[np.ndarray]:
        """生成熔岩流路径（基于元胞自动机模拟）"""
        paths = []
        cx, cy = 0, 0
        crater_points = self._get_crater_edge_points()

        for i in range(self.params.num_lava_flows):
            path = self._simulate_lava_flow(
                X, Y, elevation, crater_points[i], start_idx=i
            )
            paths.append(path)

        return paths

    def _get_crater_edge_points(self) -> List[Tuple[float, float]]:
        """获取火山口边缘点"""
        points = []
        for i in range(self.params.num_lava_flows):
            angle = 2 * np.pi * i / self.params.num_lava_flows + np.random.uniform(-0.2, 0.2)
            r = self.params.crater_radius + np.random.uniform(0, 50)
            x = r * np.cos(angle)
            y = r * np.sin(angle)
            points.append((x, y))
        return points

    def _simulate_lava_flow(
        self,
        X: np.ndarray,
        Y: np.ndarray,
        elevation: np.ndarray,
        start_point: Tuple[float, float],
        start_idx: int = 0,
    ) -> np.ndarray:
        """模拟单条熔岩流路径"""
        path = [np.array(start_point)]
        current_pos = np.array(start_point)

        time_factor = self.params.time_progress
        max_steps = int(200 * time_factor + 20)
        flow_speed = 0.3 + 0.5 * self.params.eruption_intensity

        for _ in range(max_steps):
            x_idx = np.argmin(np.abs(X[0, :] - current_pos[0]))
            y_idx = np.argmin(np.abs(Y[:, 0] - current_pos[1]))

            x_idx = np.clip(x_idx, 1, X.shape[1] - 2)
            y_idx = np.clip(y_idx, 1, Y.shape[0] - 2)

            grad_x = (elevation[y_idx, x_idx + 1] - elevation[y_idx, x_idx - 1]) / 2
            grad_y = (elevation[y_idx + 1, x_idx] - elevation[y_idx - 1, x_idx]) / 2

            gradient = np.array([grad_x, grad_y])
            grad_mag = np.linalg.norm(gradient)

            if grad_mag > 1e-6:
                direction = -gradient / grad_mag
            else:
                angle = 2 * np.pi * start_idx / self.params.num_lava_flows
                direction = np.array([np.cos(angle), np.sin(angle)])

            noise = np.random.randn(2) * (0.2 + 0.3 * (1 - self.params.lava_viscosity))
            direction = direction + noise
            direction = direction / (np.linalg.norm(direction) + 1e-10)

            step_size = 20 + 30 * flow_speed
            current_pos = current_pos + direction * step_size

            dist_from_center = np.sqrt(current_pos[0] ** 2 + current_pos[1] ** 2)
            if dist_from_center > self.params.volcano_base_radius * 1.2:
                break

            path.append(current_pos.copy())

        return np.array(path)

    def _generate_lava_thickness(
        self, X: np.ndarray, Y: np.ndarray, paths: List[np.ndarray]
    ) -> np.ndarray:
        """生成熔岩厚度分布"""
        thickness = np.zeros_like(X)

        for path in paths:
            if len(path) < 2:
                continue

            for i in range(len(path) - 1):
                p1 = (path[i][0], path[i][1], 0)
                p2 = (path[i + 1][0], path[i + 1][1], 0)

                dist = distance_to_line(X, Y, np.zeros_like(X), p1, p2)

                progress = i / max(len(path) - 1, 1)
                base_thickness = 15 * (1 - progress * 0.7) * self.params.eruption_intensity
                thickness += base_thickness * np.exp(-(dist**2) / (2 * 60**2))

        thickness = np.minimum(thickness, 30)
        return thickness

    def _generate_surface_rock_type(
        self, X: np.ndarray, Y: np.ndarray, elevation: np.ndarray
    ) -> np.ndarray:
        """生成地表岩石类型分布
        0: 玄武岩 (低海拔)
        1: 安山岩 (中海拔)
        2: 流纹岩 (高海拔)
        3: 火山碎屑岩 (火山口附近)
        4: 熔岩 (活跃熔岩流)
        """
        rock_type = np.zeros_like(X, dtype=np.int32)

        dist_from_center = np.sqrt(X**2 + Y**2)
        norm_elev = normalize(elevation)

        rock_type[norm_elev < 0.3] = 0
        rock_type[(norm_elev >= 0.3) & (norm_elev < 0.7)] = 1
        rock_type[norm_elev >= 0.7] = 2

        crater_area = dist_from_center < self.params.crater_radius * 1.5
        rock_type[crater_area] = 3

        noise = perlin_noise_2d(X, Y, scale=150, octaves=3, seed=self.params.seed + 2)
        transitions = np.abs(noise) > 0.6
        rock_type[transitions] = np.random.choice([0, 1, 2], size=rock_type[transitions].shape)

        return rock_type

    def _generate_surface_temperature(
        self,
        X: np.ndarray,
        Y: np.ndarray,
        elevation: np.ndarray,
        lava_thickness: np.ndarray,
    ) -> np.ndarray:
        """生成地表温度分布"""
        dist_from_center = np.sqrt(X**2 + Y**2)

        base_temp = 20 - elevation * 0.006

        crater_heat = gaussian_2d(
            X, Y, 0, 0, self.params.crater_radius * 1.5, amplitude=200 * self.params.magma_pressure
        )

        lava_heat = np.zeros_like(base_temp)
        lava_mask = lava_thickness > 2
        lava_heat[lava_mask] = 300 + 500 * self.params.eruption_intensity
        lava_heat = lava_heat * (1 - 0.5 * self.params.time_progress)

        fumarole_heat = np.zeros_like(base_temp)
        for i in range(8):
            angle = 2 * np.pi * i / 8
            r = self.params.crater_radius * 1.2
            fx, fy = r * np.cos(angle), r * np.sin(angle)
            fumarole_heat += gaussian_2d(X, Y, fx, fy, 30, amplitude=80)

        temperature = base_temp + crater_heat + lava_heat + fumarole_heat * self.params.magma_pressure
        temperature = np.maximum(temperature, -10)

        return temperature

    def _generate_surface_vegetation(
        self,
        X: np.ndarray,
        Y: np.ndarray,
        elevation: np.ndarray,
        temperature: np.ndarray,
    ) -> np.ndarray:
        """生成地表植被覆盖"""
        dist_from_center = np.sqrt(X**2 + Y**2)

        elev_factor = smoothstep(50, 500, elevation) * smoothstep(1200, 300, elevation)

        temp_factor = smoothstep(0, 15, temperature) * smoothstep(35, 15, temperature)

        dist_factor = smoothstep(self.params.crater_radius * 2, self.params.volcano_base_radius * 0.8, dist_from_center)

        noise = perlin_noise_2d(X, Y, scale=200, octaves=4, seed=self.params.seed + 3)
        noise_factor = (noise + 1) / 2

        vegetation = elev_factor * temp_factor * dist_factor * noise_factor
        vegetation = np.clip(vegetation, 0, 1)

        recent_lava = self.params.time_progress < 0.3
        if recent_lava:
            lava_influence = gaussian_2d(
                X, Y, 0, 0, self.params.volcano_base_radius,
                amplitude=0.5 * (1 - self.params.time_progress)
            )
            vegetation = np.maximum(0, vegetation - lava_influence)

        return vegetation

    def _generate_volume_rock_type(
        self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray
    ) -> np.ndarray:
        """生成三维岩石类型分布
        0: 沉积层
        1: 变质层
        2: 火成岩 (老)
        3: 火成岩 (新)
        4: 岩浆房
        5: 岩浆通道
        """
        rock_type = np.zeros_like(X, dtype=np.int32)

        layer_depths = np.linspace(self.params.z_range[0], 0, self.params.num_rock_layers + 1)

        for i in range(self.params.num_rock_layers):
            z_min, z_max = layer_depths[i], layer_depths[i + 1]
            layer_mask = (Z >= z_min) & (Z < z_max)

            if i == 0:
                rock_type[layer_mask] = 0
            elif i == 1:
                rock_type[layer_mask] = 1
            else:
                rock_type[layer_mask] = 2

        noise_3d = np.zeros_like(X)
        nx, ny, nz = X.shape
        X_2d = X[:, :, 0]
        Y_2d = Y[:, :, 0]
        z_factor = (Z - self.params.z_range[0]) / np.max([1000, np.abs(self.params.z_range[0])])
        
        for scale in [500, 200, 100]:
            noise_2d = perlin_noise_2d(X_2d, Y_2d, scale=scale, octaves=3, seed=self.params.seed + 4 + int(scale))
            noise_3d += noise_2d[:, :, np.newaxis] * z_factor
        noise_3d = normalize(noise_3d)

        layer_transitions = np.abs(noise_3d - 0.5) < 0.05
        rock_type[layer_transitions] = np.random.choice(
            [0, 1, 2], size=rock_type[layer_transitions].shape
        )

        magma_chamber = gaussian_3d(
            X, Y, Z,
            0, 0, self.params.magma_chamber_depth,
            self.params.magma_chamber_radius,
            amplitude=1.0
        ) > 0.3
        rock_type[magma_chamber] = 4

        conduit_mask = self._generate_magma_conduit(X, Y, Z)
        rock_type[conduit_mask > 0.5] = 5

        return rock_type

    def _generate_magma_conduit(
        self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray
    ) -> np.ndarray:
        """生成岩浆通道"""
        conduit = np.zeros_like(X)

        z_levels = np.linspace(self.params.magma_chamber_depth, 0, 50)
        for z in z_levels:
            height_factor = (z - self.params.magma_chamber_depth) / (-self.params.magma_chamber_depth)
            current_radius = self.params.conduit_radius * (
                0.3 + 0.7 * height_factor
            ) * (1 + 0.3 * self.params.magma_pressure)

            wobble = 20 * np.sin(z * 0.01)
            dist_from_axis = np.sqrt((X - wobble) ** 2 + (Y + wobble * 0.5) ** 2)

            z_slice = np.abs(Z - z) < 30
            conduit[z_slice] = np.maximum(
                conduit[z_slice],
                np.exp(-(dist_from_axis[z_slice] ** 2) / (2 * current_radius**2)),
            )

        return conduit

    def _generate_volume_temperature(
        self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray, rock_type: np.ndarray
    ) -> np.ndarray:
        """生成三维温度分布"""
        geotherm = 20 + (self.params.z_range[0] - Z) * 0.03

        magma_heat = gaussian_3d(
            X, Y, Z,
            0, 0, self.params.magma_chamber_depth,
            self.params.magma_chamber_radius * 1.5,
            amplitude=800 * self.params.magma_pressure,
        )

        conduit_mask = self._generate_magma_conduit(X, Y, Z)
        conduit_heat = conduit_mask * 600 * self.params.magma_pressure

        for i in range(self.params.num_fault_zones):
            angle = 2 * np.pi * i / self.params.num_fault_zones + np.pi / self.params.num_fault_zones
            fault_heat = self._generate_fault_heat(X, Y, Z, angle)
            geotherm += fault_heat * 100 * self.params.magma_pressure

        temperature = geotherm + magma_heat + conduit_heat
        temperature = np.minimum(temperature, 1500)

        return temperature

    def _generate_fault_heat(
        self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray, angle: float
    ) -> np.ndarray:
        """生成断裂带附近的热量异常"""
        fx = np.cos(angle) * X + np.sin(angle) * Y
        dist_from_fault = np.abs(-np.sin(angle) * X + np.cos(angle) * Y)

        dip_factor = (Z - self.params.z_range[0]) / (0 - self.params.z_range[0])
        fault_width = 50 + 100 * dip_factor

        heat = np.exp(-(dist_from_fault**2) / (2 * fault_width**2))
        heat = heat * dip_factor

        return heat

    def _generate_volume_density(
        self,
        X: np.ndarray,
        Y: np.ndarray,
        Z: np.ndarray,
        rock_type: np.ndarray,
        temperature: np.ndarray,
    ) -> np.ndarray:
        """生成三维密度分布"""
        density_by_type = {
            0: 2.3,
            1: 2.7,
            2: 2.9,
            3: 2.8,
            4: 2.4,
            5: 2.5,
        }

        density = np.zeros_like(X)
        for rtype, base_density in density_by_type.items():
            density[rock_type == rtype] = base_density

        temp_effect = -(temperature - 20) * 0.0002
        density = density * (1 + temp_effect)

        pressure_effect = (self.params.z_range[0] - Z) * 0.00005
        density += pressure_effect

        return density

    def _generate_volume_fracture(
        self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray
    ) -> np.ndarray:
        """生成三维断裂/孔隙度分布"""
        fracture = np.zeros_like(X)

        for i in range(self.params.num_fault_zones):
            angle = 2 * np.pi * i / self.params.num_fault_zones
            dist_from_fault = np.abs(-np.sin(angle) * X + np.cos(angle) * Y)

            dip = np.pi / 4 + np.random.uniform(-0.2, 0.2)
            depth_factor = np.maximum(
                0,
                (
                    Z
                    - self.params.z_range[0]
                    - dist_from_fault * np.tan(dip)
                )
                / (0 - self.params.z_range[0]),
            )

            fault_fracture = np.exp(-(dist_from_fault**2) / (2 * 80**2)) * depth_factor
            fracture = np.maximum(fracture, fault_fracture)

        noise = np.zeros_like(X)
        X_2d = X[:, :, 0]
        Y_2d = Y[:, :, 0]
        for scale in [200, 100, 50]:
            noise_2d = perlin_noise_2d(
                X_2d, Y_2d, scale=scale, octaves=3, seed=self.params.seed + 10 + int(scale)
            )
            noise += noise_2d[:, :, np.newaxis]
        noise = normalize(noise)

        fracture = 0.3 * fracture + 0.1 * noise
        fracture = np.clip(fracture, 0, 1)

        return fracture

    def _generate_fault_zones(
        self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray
    ) -> List[Dict]:
        """生成断裂带数据"""
        fault_zones = []

        for i in range(self.params.num_fault_zones):
            angle = 2 * np.pi * i / self.params.num_fault_zones
            dip = np.pi / 4 + np.random.uniform(-0.3, 0.3)
            strike = angle + np.random.uniform(-0.2, 0.2)

            dist_from_fault = np.abs(-np.sin(strike) * X + np.cos(strike) * Y)
            depth_factor = (Z - self.params.z_range[0]) / (0 - self.params.z_range[0])
            fault_mask = (dist_from_fault < 100 * depth_factor) & (depth_factor > 0.1)

            fault_zones.append({
                "id": i,
                "strike": strike,
                "dip": dip,
                "mask": fault_mask,
                "displacement": 50 + 100 * np.random.random(),
                "fracture_density": 0.4 + 0.4 * np.random.random(),
            })

        return fault_zones

    def _generate_rock_layers(
        self, X: np.ndarray, Y: np.ndarray, Z: np.ndarray
    ) -> List[Dict]:
        """生成岩层数据"""
        rock_layers = []
        layer_depths = np.linspace(self.params.z_range[0], 0, self.params.num_rock_layers + 1)

        layer_names = [
            "深层沉积岩",
            "变质岩",
            "古老火成岩",
            "中期火成岩",
            "表层沉积物",
        ]
        layer_colors = [
            [0.6, 0.5, 0.4],
            [0.5, 0.4, 0.6],
            [0.4, 0.3, 0.3],
            [0.5, 0.35, 0.3],
            [0.7, 0.65, 0.55],
        ]

        for i in range(self.params.num_rock_layers):
            z_min, z_max = layer_depths[i], layer_depths[i + 1]
            layer_mask = (Z >= z_min) & (Z < z_max)

            thickness = z_max - z_min

            rock_layers.append({
                "id": i,
                "name": layer_names[i],
                "z_range": (z_min, z_max),
                "thickness": thickness,
                "mask": layer_mask,
                "color": layer_colors[i],
                "density": 2.3 + 0.5 * i / self.params.num_rock_layers,
            })

        return rock_layers

    def _generate_hazard_zone(
        self,
        X: np.ndarray,
        Y: np.ndarray,
        elevation: np.ndarray,
        lava_paths: List[np.ndarray],
    ) -> np.ndarray:
        """生成危险区域分布
        0: 安全区
        1: 警戒区
        2: 危险区
        3: 极危险区
        """
        hazard = np.zeros_like(X, dtype=np.int32)

        dist_from_center = np.sqrt(X**2 + Y**2)

        time_factor = self.params.time_progress
        intensity_factor = self.params.eruption_intensity

        hazard_radius_3 = self.params.crater_radius * (1.5 + intensity_factor)
        hazard_radius_2 = self.params.crater_radius * (3 + intensity_factor)
        hazard_radius_1 = self.params.volcano_base_radius * (0.7 + 0.3 * intensity_factor)

        hazard[dist_from_center < hazard_radius_1] = 1
        hazard[dist_from_center < hazard_radius_2] = 2
        hazard[dist_from_center < hazard_radius_3] = 3

        for path in lava_paths:
            if len(path) < 2:
                continue

            path_end_idx = int(len(path) * time_factor)
            if path_end_idx < 2:
                continue

            active_path = path[:path_end_idx]
            for i in range(len(active_path) - 1):
                p1 = (active_path[i][0], active_path[i][1], 0)
                p2 = (active_path[i + 1][0], active_path[i + 1][1], 0)

                dist = distance_to_line(X, Y, np.zeros_like(X), p1, p2)

                progress = i / max(len(active_path) - 1, 1)
                lava_hazard_width = 150 * (1 + 0.5 * intensity_factor) * (1 - progress * 0.3)

                hazard[dist < lava_hazard_width] = np.maximum(
                    hazard[dist < lava_hazard_width], 2
                )
                hazard[dist < lava_hazard_width * 0.5] = np.maximum(
                    hazard[dist < lava_hazard_width * 0.5], 3
                )

        return hazard

    def update_dynamic_parameters(
        self,
        params: VolcanoParameters,
        dataset: VolcanoDataset,
    ) -> VolcanoDataset:
        """更新动态参数并重新计算相关数据"""
        self.params = params
        X, Y = dataset.surface_grid
        X_vol, Y_vol, Z_vol = dataset.volume_grid

        lava_flow_paths = self._generate_lava_flow_paths(
            X, Y, dataset.surface_elevation
        )
        lava_thickness = self._generate_lava_thickness(X, Y, lava_flow_paths)

        dataset.lava_flow_paths = lava_flow_paths
        dataset.lava_thickness = lava_thickness
        dataset.surface_temperature = self._generate_surface_temperature(
            X, Y, dataset.surface_elevation, lava_thickness
        )
        dataset.surface_vegetation = self._generate_surface_vegetation(
            X, Y, dataset.surface_elevation, dataset.surface_temperature
        )
        dataset.volume_temperature = self._generate_volume_temperature(
            X_vol, Y_vol, Z_vol, dataset.volume_rock_type
        )
        dataset.hazard_zone = self._generate_hazard_zone(
            X, Y, dataset.surface_elevation, lava_flow_paths
        )

        return dataset
