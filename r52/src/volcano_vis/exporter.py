"""结果导出模块 - 图像导出、网格导出、动画导出"""

from __future__ import annotations

import os
import numpy as np
from dataclasses import dataclass
from typing import Optional, List, Dict, Callable
import pyvista as pv
from pathlib import Path

from .animator import AnimationFrame, AnimationConfig


@dataclass
class ExportConfig:
    """导出配置"""

    output_dir: str = "exports"
    create_subdirs: bool = True

    image_format: str = "png"
    image_dpi: int = 300
    image_width: int = 1920
    image_height: int = 1080
    transparent_background: bool = False

    mesh_format: str = "vtk"
    include_scalars: bool = True
    binary: bool = True

    animation_format: str = "mp4"
    animation_fps: int = 30
    animation_quality: int = 10
    frame_prefix: str = "frame_"

    data_format: str = "npz"
    compression: bool = True


class ResultExporter:
    """结果导出器"""

    def __init__(self, config: Optional[ExportConfig] = None):
        self.config = config or ExportConfig()
        self._ensure_dirs()

    def _ensure_dirs(self) -> None:
        """确保输出目录存在"""
        base_dir = Path(self.config.output_dir)
        base_dir.mkdir(parents=True, exist_ok=True)

        if self.config.create_subdirs:
            (base_dir / "images").mkdir(exist_ok=True)
            (base_dir / "animations").mkdir(exist_ok=True)
            (base_dir / "meshes").mkdir(exist_ok=True)
            (base_dir / "data").mkdir(exist_ok=True)

    def _get_path(self, subdir: str, filename: str) -> str:
        """获取完整输出路径"""
        if self.config.create_subdirs:
            path = Path(self.config.output_dir) / subdir / filename
        else:
            path = Path(self.config.output_dir) / filename

        return str(path)

    def export_image(
        self,
        plotter: pv.Plotter,
        filename: str,
        viewup: Optional[Tuple[float, float, float]] = None,
        camera_position: Optional[Tuple[float, float, float]] = None,
        focal_point: Optional[Tuple[float, float, float]] = None,
    ) -> str:
        """导出图像"""

        if not filename.endswith(f".{self.config.image_format}"):
            filename = f"{filename}.{self.config.image_format}"

        filepath = self._get_path("images", filename)

        if camera_position is not None:
            plotter.camera_position = camera_position
        if focal_point is not None:
            plotter.camera.focal_point = focal_point
        if viewup is not None:
            plotter.camera.viewup = viewup

        plotter.screenshot(
            filepath,
            window_size=(self.config.image_width, self.config.image_height),
            return_img=False,
            transparent_background=self.config.transparent_background,
        )

        return filepath

    def export_mesh(
        self,
        mesh: pv.DataSet,
        filename: str,
        format: Optional[str] = None,
    ) -> str:
        """导出网格"""

        if format is None:
            format = self.config.mesh_format

        if not filename.endswith(f".{format}"):
            filename = f"{filename}.{format}"

        filepath = self._get_path("meshes", filename)

        supported_formats = ["vtk", "vtp", "vtu", "stl", "ply", "obj", "vtr"]
        if format not in supported_formats:
            raise ValueError(f"不支持的网格格式: {format}. 支持: {supported_formats}")

        if format == "vtk":
            mesh.save(filepath, binary=self.config.binary)
        elif format == "vtp":
            if isinstance(mesh, pv.PolyData):
                mesh.save(filepath, binary=self.config.binary)
            else:
                mesh.extract_surface().save(filepath, binary=self.config.binary)
        elif format == "vtu":
            if isinstance(mesh, pv.UnstructuredGrid):
                mesh.save(filepath, binary=self.config.binary)
            else:
                mesh.cast_to_unstructured_grid().save(filepath, binary=self.config.binary)
        elif format == "stl":
            if isinstance(mesh, pv.PolyData):
                mesh.save(filepath, binary=self.config.binary)
            else:
                mesh.extract_surface().save(filepath, binary=self.config.binary)
        elif format == "ply":
            if isinstance(mesh, pv.PolyData):
                mesh.save(filepath)
            else:
                mesh.extract_surface().save(filepath)
        elif format == "obj":
            if isinstance(mesh, pv.PolyData):
                mesh.save(filepath)
            else:
                mesh.extract_surface().save(filepath)

        return filepath

    def export_all_meshes(
        self,
        meshes: Dict[str, pv.DataSet],
        prefix: str = "",
    ) -> Dict[str, str]:
        """导出所有网格"""

        exported = {}
        for name, mesh in meshes.items():
            if mesh is None:
                continue

            filename = f"{prefix}{name}"
            try:
                path = self.export_mesh(mesh, filename)
                exported[name] = path
            except Exception as e:
                print(f"导出网格 {name} 失败: {e}")

        return exported

    def export_animation(
        self,
        frames: List[AnimationFrame],
        filename: str,
        render_frame_func: Callable[[AnimationFrame, pv.Plotter], None],
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> str:
        """导出动画"""

        if not filename.endswith(f".{self.config.animation_format}"):
            filename = f"{filename}.{self.config.animation_format}"

        filepath = self._get_path("animations", filename)

        plotter = pv.Plotter(off_screen=True)
        plotter.window_size = (self.config.image_width, self.config.image_height)

        if self.config.animation_format == "gif":
            plotter.open_gif(filepath)
        else:
            plotter.open_movie(
                filepath,
                framerate=self.config.animation_fps,
                quality=self.config.animation_quality,
            )

        for i, frame in enumerate(frames):
            plotter.clear()

            render_frame_func(frame, plotter)

            if frame.camera_position is not None:
                plotter.camera_position = frame.camera_position
            if frame.camera_focal_point is not None:
                plotter.camera.focal_point = frame.camera_focal_point

            plotter.write_frame()

            if progress_callback is not None:
                progress_callback(i + 1, len(frames))

        plotter.close()

        return filepath

    def export_frames(
        self,
        frames: List[AnimationFrame],
        render_frame_func: Callable[[AnimationFrame, pv.Plotter], None],
        output_prefix: str = "frame",
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> List[str]:
        """导出动画帧为序列图像"""

        exported_files = []
        plotter = pv.Plotter(off_screen=True)
        plotter.window_size = (self.config.image_width, self.config.image_height)

        for i, frame in enumerate(frames):
            plotter.clear()

            render_frame_func(frame, plotter)

            if frame.camera_position is not None:
                plotter.camera_position = frame.camera_position
            if frame.camera_focal_point is not None:
                plotter.camera.focal_point = frame.camera_focal_point

            filename = f"{output_prefix}_{i:04d}.{self.config.image_format}"
            filepath = self._get_path("animations", filename)

            plotter.screenshot(
                filepath,
                return_img=False,
                transparent_background=self.config.transparent_background,
            )
            exported_files.append(filepath)

            if progress_callback is not None:
                progress_callback(i + 1, len(frames))

        plotter.close()

        return exported_files

    def export_data(
        self,
        data: Dict[str, np.ndarray],
        filename: str,
    ) -> str:
        """导出数值数据"""

        if not filename.endswith(f".{self.config.data_format}"):
            filename = f"{filename}.{self.config.data_format}"

        filepath = self._get_path("data", filename)

        if self.config.data_format == "npz":
            if self.config.compression:
                np.savez_compressed(filepath, **data)
            else:
                np.savez(filepath, **data)
        elif self.config.data_format == "npy":
            if len(data) == 1:
                key = list(data.keys())[0]
                np.save(filepath, data[key])
            else:
                for key, arr in data.items():
                    single_filename = f"{Path(filename).stem}_{key}.npy"
                    single_filepath = self._get_path("data", single_filename)
                    np.save(single_filepath, arr)

        return filepath

    def export_screenshot_sequence(
        self,
        plotter: pv.Plotter,
        camera_positions: List[Tuple[float, float, float]],
        filename_prefix: str = "screenshot",
        focal_points: Optional[List[Tuple[float, float, float]]] = None,
    ) -> List[str]:
        """导出一系列不同视角的截图"""

        exported_files = []

        for i, cam_pos in enumerate(camera_positions):
            plotter.camera_position = cam_pos

            if focal_points is not None and i < len(focal_points):
                plotter.camera.focal_point = focal_points[i]

            filename = f"{filename_prefix}_{i:03d}.{self.config.image_format}"
            filepath = self.export_image(plotter, filename)
            exported_files.append(filepath)

        return exported_files

    def export_cross_section_images(
        self,
        plotter: pv.Plotter,
        angles: List[float],
        clip_function: Callable[[float], None],
        render_function: Callable[[], None],
        filename_prefix: str = "cross_section",
    ) -> List[str]:
        """导出不同角度的剖面图"""

        exported_files = []

        for i, angle in enumerate(angles):
            plotter.clear()

            clip_function(angle)
            render_function()

            filename = f"{filename_prefix}_{int(np.degrees(angle)):03d}deg.{self.config.image_format}"
            filepath = self.export_image(plotter, filename)
            exported_files.append(filepath)

        return exported_files

    def export_orthogonal_views(
        self,
        plotter: pv.Plotter,
        render_function: Callable[[], None],
        filename_prefix: str = "view",
    ) -> Dict[str, str]:
        """导出正交视图"""

        views = {
            "top": ([0, 0, 1], [0, 1, 0]),
            "bottom": ([0, 0, -1], [0, 1, 0]),
            "front": ([1, 0, 0], [0, 0, 1]),
            "back": ([-1, 0, 0], [0, 0, 1]),
            "left": ([0, 1, 0], [0, 0, 1]),
            "right": ([0, -1, 0], [0, 0, 1]),
            "iso": ([1, 1, 1], [0, 0, 1]),
        }

        exported = {}

        for view_name, (view_dir, view_up) in views.items():
            plotter.clear()
            render_function()

            plotter.camera_position = [
                (view_dir[0] * 5000, view_dir[1] * 5000, view_dir[2] * 5000),
                (0, 0, 400),
                view_up,
            ]

            filename = f"{filename_prefix}_{view_name}.{self.config.image_format}"
            filepath = self.export_image(plotter, filename)
            exported[view_name] = filepath

        return exported

    def create_report(
        self,
        image_files: List[str],
        data_files: List[str],
        mesh_files: List[str],
        output_filename: str = "export_report.txt",
    ) -> str:
        """创建导出报告"""

        filepath = self._get_path("", output_filename)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write("=" * 60 + "\n")
            f.write("火山可视化导出报告\n")
            f.write("=" * 60 + "\n\n")

            f.write(f"导出时间: {np.datetime64('now')}\n")
            f.write(f"输出目录: {self.config.output_dir}\n\n")

            f.write("-" * 60 + "\n")
            f.write("导出的图像文件:\n")
            f.write("-" * 60 + "\n")
            for img in image_files:
                f.write(f"  - {img}\n")
            f.write(f"共 {len(image_files)} 个图像文件\n\n")

            f.write("-" * 60 + "\n")
            f.write("导出的数据文件:\n")
            f.write("-" * 60 + "\n")
            for data_file in data_files:
                f.write(f"  - {data_file}\n")
            f.write(f"共 {len(data_files)} 个数据文件\n\n")

            f.write("-" * 60 + "\n")
            f.write("导出的网格文件:\n")
            f.write("-" * 60 + "\n")
            for mesh in mesh_files:
                f.write(f"  - {mesh}\n")
            f.write(f"共 {len(mesh_files)} 个网格文件\n\n")

            f.write("=" * 60 + "\n")
            f.write("导出配置:\n")
            f.write("=" * 60 + "\n")
            f.write(f"图像格式: {self.config.image_format}\n")
            f.write(f"图像分辨率: {self.config.image_width}x{self.config.image_height}\n")
            f.write(f"图像DPI: {self.config.image_dpi}\n")
            f.write(f"网格格式: {self.config.mesh_format}\n")
            f.write(f"动画格式: {self.config.animation_format}\n")
            f.write(f"动画FPS: {self.config.animation_fps}\n")
            f.write(f"数据格式: {self.config.data_format}\n")

        return filepath

    def get_export_summary(self) -> Dict:
        """获取导出摘要"""

        base_dir = Path(self.config.output_dir)
        summary = {
            "output_dir": str(base_dir),
            "images": [],
            "animations": [],
            "meshes": [],
            "data": [],
        }

        if base_dir.exists():
            if self.config.create_subdirs:
                for ext in ["*.png", "*.jpg", "*.jpeg", "*.bmp"]:
                    summary["images"].extend(
                        [str(p) for p in (base_dir / "images").glob(ext)]
                    )
                for ext in ["*.mp4", "*.gif", "*.avi", "*.mov"]:
                    summary["animations"].extend(
                        [str(p) for p in (base_dir / "animations").glob(ext)]
                    )
                for ext in ["*.vtk", "*.vtp", "*.vtu", "*.stl", "*.ply", "*.obj"]:
                    summary["meshes"].extend(
                        [str(p) for p in (base_dir / "meshes").glob(ext)]
                    )
                for ext in ["*.npz", "*.npy", "*.csv", "*.txt"]:
                    summary["data"].extend(
                        [str(p) for p in (base_dir / "data").glob(ext)]
                    )

        summary["total_images"] = len(summary["images"])
        summary["total_animations"] = len(summary["animations"])
        summary["total_meshes"] = len(summary["meshes"])
        summary["total_data"] = len(summary["data"])

        return summary
