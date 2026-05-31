"""火山地质结构三维可视化包"""

__version__ = "1.0.0"
__author__ = "VolcanoVis Team"

from .data_generator import VolcanoDataGenerator, VolcanoParameters, VolcanoDataset
from .mesh_builder import MeshBuilder, MeshCollection
from .material_mapper import MaterialMapper, MaterialProperty, ColormapConfig
from .clipper import VolcanoClipper, ClipResult, ContourResult
from .animator import VolcanoAnimator, AnimationFrame, AnimationConfig
from .legend import LegendManager, LegendItem, ColorbarConfig
from .exporter import ResultExporter, ExportConfig

__all__ = [
    "VolcanoDataGenerator",
    "VolcanoParameters",
    "VolcanoDataset",
    "MeshBuilder",
    "MeshCollection",
    "MaterialMapper",
    "MaterialProperty",
    "ColormapConfig",
    "VolcanoClipper",
    "ClipResult",
    "ContourResult",
    "VolcanoAnimator",
    "AnimationFrame",
    "AnimationConfig",
    "LegendManager",
    "LegendItem",
    "ColorbarConfig",
    "ResultExporter",
    "ExportConfig",
]
