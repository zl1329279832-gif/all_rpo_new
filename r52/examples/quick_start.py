"""快速入门示例 - 火山地质结构三维可视化"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import numpy as np
import pyvista as pv
try:
    from pyvista.plotting.plotter import Plotter as _Plotter
    pv.Plotter = _Plotter
except (ImportError, AttributeError):
    pass
from volcano_vis import (
    VolcanoDataGenerator,
    VolcanoParameters,
    MeshBuilder,
    MaterialMapper,
    VolcanoClipper,
    VolcanoAnimator,
    LegendManager,
    ResultExporter,
    AnimationConfig,
)


def example_1_basic_visualization():
    """示例1: 基本火山可视化"""
    print("示例1: 基本火山可视化")
    print("-" * 50)

    params = VolcanoParameters(
        volcano_height=800,
        magma_pressure=0.7,
        eruption_intensity=0.6,
        time_progress=0.5,
    )

    generator = VolcanoDataGenerator(params)
    dataset = generator.generate_all()
    print(f"数据生成完成: 地表分辨率 {dataset.surface_grid[0].shape}")

    mesh_builder = MeshBuilder(dataset)
    meshes = mesh_builder.build_all()
    print(f"网格构建完成: {len(meshes.get_all_meshes())} 个网格")

    material_mapper = MaterialMapper(dataset)

    plotter = pv.Plotter(window_size=(1200, 800))
    plotter.set_background("white")

    colormap = material_mapper.get_surface_colormap("elevation")
    plotter.add_mesh(
        meshes.surface_mesh,
        scalars="elevation",
        cmap="terrain",
        show_scalar_bar=True,
        scalar_bar_args={"title": "高程 (m)"},
    )

    for lava_flow in meshes.lava_flow_meshes:
        plotter.add_mesh(
            lava_flow,
            color=(0.9, 0.2, 0.0),
            opacity=0.9,
            line_width=3,
        )

    if meshes.magma_chamber_mesh is not None:
        plotter.add_mesh(
            meshes.magma_chamber_mesh,
            color=(1.0, 0.2, 0.0),
            opacity=0.6,
        )

    if meshes.magma_conduit_mesh is not None:
        plotter.add_mesh(
            meshes.magma_conduit_mesh,
            color=(1.0, 0.3, 0.0),
            opacity=0.8,
        )

    legend_manager = LegendManager(dataset, material_mapper)
    legend_manager.add_axes(plotter)
    legend_manager.add_scale_bar(plotter, length=500)

    plotter.add_text(
        "火山三维可视化 - 外部视图",
        position="upper_left",
        font_size=14,
        color="black",
    )

    print("正在显示3D视图... (关闭窗口继续)")
    plotter.show()


def example_2_cross_section():
    """示例2: 剖面视图"""
    print("\n示例2: 剖面视图")
    print("-" * 50)

    params = VolcanoParameters(
        volcano_height=800,
        magma_pressure=0.8,
        eruption_intensity=0.7,
        time_progress=0.3,
    )

    generator = VolcanoDataGenerator(params)
    dataset = generator.generate_all()

    mesh_builder = MeshBuilder(dataset)
    meshes = mesh_builder.build_all()

    material_mapper = MaterialMapper(dataset)
    clipper = VolcanoClipper(dataset, meshes, material_mapper)

    clip_result = clipper.clip_through_center(angle=0.0, invert=False)

    plotter = pv.Plotter(window_size=(1200, 800))
    plotter.set_background("white")

    if clip_result.clipped_mesh is not None:
        if isinstance(clip_result.clipped_mesh, pv.MultiBlock):
            for i in range(clip_result.clipped_mesh.n_blocks):
                block = clip_result.clipped_mesh[i]
                if block is not None and block.n_points > 0:
                    if "elevation" in block.array_names:
                        plotter.add_mesh(
                            block,
                            scalars="elevation",
                            cmap="terrain",
                            opacity=0.8,
                        )
                    elif "rock_type" in block.array_names:
                        plotter.add_mesh(
                            block,
                            scalars="rock_type",
                            cmap="viridis",
                            opacity=0.6,
                        )
        else:
            plotter.add_mesh(
                clip_result.clipped_mesh,
                scalars="elevation",
                cmap="terrain",
                opacity=0.8,
            )

    if clip_result.clip_surface is not None:
        plotter.add_mesh(
            clip_result.clip_surface,
            scalars="rock_type",
            cmap="viridis",
            opacity=0.9,
            show_edges=True,
        )

    for layer in meshes.rock_layer_meshes:
        clipped = layer.clip(
            normal=clip_result.normal,
            origin=clip_result.origin,
            invert=False,
        )
        if clipped.n_points > 0:
            color = (
                layer.point_data["color_r"][0],
                layer.point_data["color_g"][0],
                layer.point_data["color_b"][0],
            )
            plotter.add_mesh(clipped, color=color, opacity=0.5, line_width=2)

    if meshes.magma_conduit_mesh is not None:
        clipped = meshes.magma_conduit_mesh.clip(
            normal=clip_result.normal,
            origin=clip_result.origin,
            invert=False,
        )
        if clipped.n_points > 0:
            plotter.add_mesh(clipped, color=(1.0, 0.2, 0.0), opacity=0.9)

    legend_manager = LegendManager(dataset, material_mapper)
    legend_manager.add_axes(plotter)
    legend_manager.add_scale_bar(plotter, length=500)

    plotter.add_text(
        "火山剖面视图 - YZ平面",
        position="upper_left",
        font_size=14,
        color="black",
    )

    print("正在显示剖面视图... (关闭窗口继续)")
    plotter.show()


def example_3_animation():
    """示例3: 生成动画帧"""
    print("\n示例3: 喷发动画模拟")
    print("-" * 50)

    base_params = VolcanoParameters(
        volcano_height=800,
        magma_pressure=0.6,
        eruption_intensity=0.5,
        time_progress=0.0,
    )

    generator = VolcanoDataGenerator(base_params)
    animator = VolcanoAnimator(generator, base_params)

    config = AnimationConfig(
        num_frames=10,
        fps=10,
        start_time=0.0,
        end_time=1.0,
    )

    print(f"生成 {config.num_frames} 帧动画...")
    frames = animator.generate_all_frames(
        config,
        progress_callback=lambda i, n: print(f"  帧 {i}/{n}"),
    )

    print(f"动画帧生成完成，共 {len(frames)} 帧")
    print(f"第5帧时间: {frames[4].time:.2f}, 喷发强度: {frames[4].dataset.params.eruption_intensity:.2f}")

    return frames


def example_4_export():
    """示例4: 结果导出"""
    print("\n示例4: 结果导出")
    print("-" * 50)

    params = VolcanoParameters(
        volcano_height=800,
        time_progress=0.6,
    )

    generator = VolcanoDataGenerator(params)
    dataset = generator.generate_all()

    mesh_builder = MeshBuilder(dataset)
    meshes = mesh_builder.build_all()

    exporter = ResultExporter()

    print("导出网格数据...")
    mesh_files = exporter.export_all_meshes(meshes.get_all_meshes(), prefix="volcano_")
    print(f"导出了 {len(mesh_files)} 个网格文件")

    print("导出数值数据...")
    data_to_export = {
        "surface_elevation": dataset.surface_elevation,
        "surface_temperature": dataset.surface_temperature,
        "hazard_zone": dataset.hazard_zone,
    }
    data_file = exporter.export_data(data_to_export, "volcano_data")
    print(f"数据已导出到: {data_file}")

    summary = exporter.get_export_summary()
    print(f"\n导出摘要:")
    print(f"  总网格数: {summary['total_meshes']}")
    print(f"  总数据文件: {summary['total_data']}")
    print(f"  输出目录: {summary['output_dir']}")


def example_5_hazard_analysis():
    """示例5: 危险区域分析"""
    print("\n示例5: 危险区域分析")
    print("-" * 50)

    for intensity in [0.3, 0.6, 0.9]:
        params = VolcanoParameters(
            eruption_intensity=intensity,
            time_progress=0.8,
            magma_pressure=0.5 + intensity * 0.4,
        )

        generator = VolcanoDataGenerator(params)
        dataset = generator.generate_all()

        hazard = dataset.hazard_zone
        total_area = hazard.size

        for level, name in enumerate(["安全区", "警戒区", "危险区", "极危险区"]):
            area_pct = np.sum(hazard == level) / total_area * 100
            print(f"  喷发强度 {intensity:.1f} - {name}: {area_pct:.1f}%")


def main():
    """主函数"""
    print("=" * 60)
    print("火山地质结构三维可视化 - 快速入门示例")
    print("=" * 60)

    try:
        example_1_basic_visualization()
        example_2_cross_section()
        example_3_animation()
        example_4_export()
        example_5_hazard_analysis()

        print("\n" + "=" * 60)
        print("所有示例运行完成!")
        print("=" * 60)

    except Exception as e:
        print(f"\n错误: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
