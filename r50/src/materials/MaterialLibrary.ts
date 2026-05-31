import * as THREE from 'three'
import { TextureManager } from './TextureManager'

export class MaterialLibrary {
  private static textureManager = TextureManager.getInstance()

  static get greyTileRoof(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x707070,
        roughness: 0.9,
        metalness: 0.1,
        repeat: { x: 12, y: 6 }
      },
      'roof_tile'
    )
  }

  static get redWoodColumn(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x8b1a1a,
        roughness: 0.6,
        metalness: 0.1,
        repeat: { x: 1, y: 4 }
      },
      'red_paint'
    )
  }

  static get darkWoodBeam(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x4a2810,
        roughness: 0.7,
        metalness: 0.1,
        repeat: { x: 2, y: 1 }
      },
      'wood'
    )
  }

  static get brickWall(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x7a6a5a,
        roughness: 0.95,
        metalness: 0.05,
        repeat: { x: 4, y: 8 }
      },
      'brick_wall'
    )
  }

  static get stoneFloor(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x6a6a68,
        roughness: 0.9,
        metalness: 0.05,
        repeat: { x: 16, y: 16 }
      },
      'stone_floor'
    )
  }

  static get stoneStep(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x6b6b68,
        roughness: 0.85,
        metalness: 0.05,
        repeat: { x: 4, y: 2 }
      },
      'stone'
    )
  }

  static get latticeWindow(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x8b4513,
        roughness: 0.7,
        metalness: 0.1,
        repeat: { x: 2, y: 2 }
      },
      'lattice'
    )
  }

  static get goldDecorative(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0xffd700,
        roughness: 0.3,
        metalness: 0.8
      },
      'gold_paint'
    )
  }

  static get woodRailing(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x654321,
        roughness: 0.7,
        metalness: 0.1,
        repeat: { x: 1, y: 1 }
      },
      'wood'
    )
  }

  static get lanternPaper(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0xff4444,
        roughness: 0.5,
        metalness: 0.1,
        emissive: 0xff2200,
        emissiveIntensity: 0.5
      }
    )
  }

  static get lanternFrame(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x3d2817,
        roughness: 0.6,
        metalness: 0.3
      }
    )
  }

  static get treeTrunk(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x4a3728,
        roughness: 0.9,
        metalness: 0.0,
        repeat: { x: 1, y: 2 }
      },
      'wood'
    )
  }

  static get treeLeaves(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x2d5a27,
      roughness: 0.8,
      metalness: 0.0,
      transparent: true,
      opacity: 0.95
    })
  }

  static get stoneFoundation(): THREE.MeshStandardMaterial {
    return this.textureManager.createMaterial(
      {
        color: 0x707070,
        roughness: 0.9,
        metalness: 0.05,
        repeat: { x: 8, y: 4 }
      },
      'stone'
    )
  }

  static get whitePlaster(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xf5f0e6,
      roughness: 0.95,
      metalness: 0.0
    })
  }

  static get darkPaint(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
      metalness: 0.2
    })
  }
}
