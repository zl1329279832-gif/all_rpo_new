"""工具函数模块"""

from __future__ import annotations

import numpy as np
from typing import Tuple, Optional


def gaussian_2d(
    x: np.ndarray,
    y: np.ndarray,
    x0: float = 0.0,
    y0: float = 0.0,
    sigma_x: float = 1.0,
    sigma_y: Optional[float] = None,
    amplitude: float = 1.0,
) -> np.ndarray:
    """2D高斯函数"""
    if sigma_y is None:
        sigma_y = sigma_x
    return amplitude * np.exp(
        -((x - x0) ** 2) / (2 * sigma_x**2)
        - ((y - y0) ** 2) / (2 * sigma_y**2)
    )


def gaussian_3d(
    x: np.ndarray,
    y: np.ndarray,
    z: np.ndarray,
    x0: float = 0.0,
    y0: float = 0.0,
    z0: float = 0.0,
    sigma: float = 1.0,
    amplitude: float = 1.0,
) -> np.ndarray:
    """3D高斯函数"""
    return amplitude * np.exp(
        -((x - x0) ** 2 + (y - y0) ** 2 + (z - z0) ** 2) / (2 * sigma**2)
    )


def perlin_noise_2d(
    x: np.ndarray,
    y: np.ndarray,
    scale: float = 100.0,
    octaves: int = 4,
    persistence: float = 0.5,
    lacunarity: float = 2.0,
    seed: Optional[int] = None,
) -> np.ndarray:
    """简化的2D Perlin噪声生成"""
    if seed is not None:
        np.random.seed(seed)

    noise = np.zeros_like(x, dtype=np.float64)
    amplitude = 1.0
    frequency = 1.0
    max_value = 0.0

    for _ in range(octaves):
        nx = x / scale * frequency
        ny = y / scale * frequency

        xi = np.floor(nx).astype(np.int32)
        yi = np.floor(ny).astype(np.int32)
        xf = nx - xi
        yf = ny - yi

        u = fade(xf)
        v = fade(yf)

        rng = np.random.default_rng(seed)
        aa = hash_coords(xi, yi, rng)
        ab = hash_coords(xi, yi + 1, rng)
        ba = hash_coords(xi + 1, yi, rng)
        bb = hash_coords(xi + 1, yi + 1, rng)

        x1 = lerp(aa, ba, u)
        x2 = lerp(ab, bb, u)
        y1 = lerp(x1, x2, v)

        noise += y1 * amplitude
        max_value += amplitude
        amplitude *= persistence
        frequency *= lacunarity

    return noise / max_value


def fade(t: np.ndarray) -> np.ndarray:
    """Perlin噪声淡入淡出函数"""
    return t * t * t * (t * (t * 6 - 15) + 10)


def lerp(a: np.ndarray, b: np.ndarray, t: np.ndarray) -> np.ndarray:
    """线性插值"""
    return a + t * (b - a)


def hash_coords(x: np.ndarray, y: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """坐标哈希"""
    h = (x * 374761393 + y * 668265263).astype(np.int64)
    h = (h ^ (h >> 13)) * 1274126177
    h = h ^ (h >> 16)
    return (h % 1000) / 1000.0 * 2 - 1


def distance_to_point(
    x: np.ndarray, y: np.ndarray, z: np.ndarray, px: float, py: float, pz: float
) -> np.ndarray:
    """计算到点的距离"""
    return np.sqrt((x - px) ** 2 + (y - py) ** 2 + (z - pz) ** 2)


def distance_to_line(
    x: np.ndarray,
    y: np.ndarray,
    z: np.ndarray,
    p1: Tuple[float, float, float],
    p2: Tuple[float, float, float],
) -> np.ndarray:
    """计算到线段的距离"""
    x1, y1, z1 = p1
    x2, y2, z2 = p2

    dx, dy, dz = x2 - x1, y2 - y1, z2 - z1
    denom = dx**2 + dy**2 + dz**2

    if denom == 0:
        return distance_to_point(x, y, z, x1, y1, z1)

    t = ((x - x1) * dx + (y - y1) * dy + (z - z1) * dz) / denom
    t = np.clip(t, 0, 1)

    px = x1 + t * dx
    py = y1 + t * dy
    pz = z1 + t * dz

    return np.sqrt((x - px) ** 2 + (y - py) ** 2 + (z - pz) ** 2)


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> np.ndarray:
    """平滑阶跃函数"""
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def normalize(arr: np.ndarray) -> np.ndarray:
    """归一化数组到[0,1]"""
    arr_min, arr_max = arr.min(), arr.max()
    if arr_max - arr_min < 1e-10:
        return np.zeros_like(arr)
    return (arr - arr_min) / (arr_max - arr_min)


def create_grid(
    x_range: Tuple[float, float],
    y_range: Tuple[float, float],
    z_range: Tuple[float, float],
    resolution: int = 50,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Tuple[float, float, float]]:
    """创建三维网格"""
    x = np.linspace(x_range[0], x_range[1], resolution)
    y = np.linspace(y_range[0], y_range[1], resolution)
    z = np.linspace(z_range[0], z_range[1], resolution)

    X, Y, Z = np.meshgrid(x, y, z, indexing="ij")
    spacing = (
        (x_range[1] - x_range[0]) / (resolution - 1),
        (y_range[1] - y_range[0]) / (resolution - 1),
        (z_range[1] - z_range[0]) / (resolution - 1),
    )

    return X, Y, Z, spacing


def create_surface_grid(
    x_range: Tuple[float, float],
    y_range: Tuple[float, float],
    resolution: int = 100,
) -> Tuple[np.ndarray, np.ndarray, Tuple[float, float]]:
    """创建二维表面网格"""
    x = np.linspace(x_range[0], x_range[1], resolution)
    y = np.linspace(y_range[0], y_range[1], resolution)

    X, Y = np.meshgrid(x, y, indexing="ij")
    spacing = (
        (x_range[1] - x_range[0]) / (resolution - 1),
        (y_range[1] - y_range[0]) / (resolution - 1),
    )

    return X, Y, spacing
