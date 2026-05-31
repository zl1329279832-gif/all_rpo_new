import * as THREE from 'three';

export function createRoadGeometry(
  leftEdge: THREE.Vector3[],
  rightEdge: THREE.Vector3[],
  thickness: number = 1.2
): THREE.BufferGeometry {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const topOffset = 0;
  const bottomOffset = -thickness;

  const segmentCount = leftEdge.length - 1;

  for (let i = 0; i < leftEdge.length; i++) {
    const left = leftEdge[i];
    const right = rightEdge[i];
    const vCoord = i / segmentCount;

    vertices.push(left.x, left.y + topOffset, left.z);
    vertices.push(right.x, right.y + topOffset, right.z);
    vertices.push(left.x, left.y + bottomOffset, left.z);
    vertices.push(right.x, right.y + bottomOffset, right.z);

    uvs.push(0, vCoord * 50);
    uvs.push(1, vCoord * 50);
    uvs.push(0, vCoord * 50);
    uvs.push(1, vCoord * 50);

    const tangent = new THREE.Vector3();
    if (i < segmentCount) {
      const nextLeft = leftEdge[i + 1];
      tangent.subVectors(nextLeft, left).normalize();
    } else {
      const prevLeft = leftEdge[i - 1];
      tangent.subVectors(left, prevLeft).normalize();
    }
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    normals.push(0, 1, 0);
    normals.push(0, 1, 0);
    normals.push(0, 1, 0);
    normals.push(0, 1, 0);
  }

  for (let i = 0; i < segmentCount; i++) {
    const base = i * 4;

    indices.push(base, base + 1, base + 4);
    indices.push(base + 1, base + 5, base + 4);

    indices.push(base + 2, base + 6, base + 3);
    indices.push(base + 3, base + 6, base + 7);

    indices.push(base, base + 4, base + 2);
    indices.push(base + 2, base + 4, base + 6);

    indices.push(base + 1, base + 3, base + 5);
    indices.push(base + 3, base + 7, base + 5);

    if (i === 0) {
      indices.push(base, base + 2, base + 1);
      indices.push(base + 1, base + 2, base + 3);
    }

    if (i === segmentCount - 1) {
      indices.push(base + 4, base + 5, base + 6);
      indices.push(base + 5, base + 7, base + 6);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createCurbGeometry(
  leftEdge: THREE.Vector3[],
  rightEdge: THREE.Vector3[],
  height: number = 0.15,
  width: number = 0.3
): THREE.Group {
  const group = new THREE.Group();

  const createCurbSide = (edge: THREE.Vector3[], isLeft: boolean) => {
    const curbPoints: THREE.Vector3[] = [];
    const offset = isLeft ? -1 : 1;

    for (const point of edge) {
      curbPoints.push(new THREE.Vector3(
        point.x + offset * width * 0.5,
        point.y + height / 2,
        point.z
      ));
    }

    const CurveClass = (THREE as any).CatmullRomCurve3;
    const curve = new CurveClass(curbPoints);
    const tubeGeo = new THREE.TubeGeometry(curve, curbPoints.length * 2, height / 2, 6, false);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.9,
      metalness: 0.1
    });

    return new THREE.Mesh(tubeGeo, curbMat);
  };

  group.add(createCurbSide(leftEdge, true));
  group.add(createCurbSide(rightEdge, false));

  return group;
}

export function createDashedLineGeometry(
  points: THREE.Vector3[],
  dashSize: number = 1,
  gapSize: number = 1
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return geometry;
}

export function createGuardRailGeometry(
  leftEdge: THREE.Vector3[],
  rightEdge: THREE.Vector3[],
  height: number = 1,
  thickness: number = 0.12
): THREE.Group {
  const group = new THREE.Group();

  const createRail = (edge: THREE.Vector3[], offset: number) => {
    const railGroup = new THREE.Group();
    const topY = height;
    const midY = height * 0.5;

    const topPoints: THREE.Vector3[] = [];
    const midPoints: THREE.Vector3[] = [];

    for (const point of edge) {
      topPoints.push(new THREE.Vector3(point.x, point.y + topY, point.z));
      midPoints.push(new THREE.Vector3(point.x, point.y + midY, point.z));
    }

    const CurveClass = (THREE as any).CatmullRomCurve3;
    const topCurve = new CurveClass(topPoints);
    const midCurve = new CurveClass(midPoints);

    const tubeGeo1 = new THREE.TubeGeometry(topCurve, edge.length * 2, thickness / 2, 6, false);
    const tubeGeo2 = new THREE.TubeGeometry(midCurve, edge.length * 2, thickness / 2, 6, false);

    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.3
    });

    railGroup.add(new THREE.Mesh(tubeGeo1, material));
    railGroup.add(new THREE.Mesh(tubeGeo2, material));

    for (let i = 0; i < edge.length; i += 4) {
      const point = edge[i];
      const postGeo = new THREE.BoxGeometry(thickness * 1.2, height, thickness * 1.2);
      const post = new THREE.Mesh(postGeo, material);
      post.position.set(point.x, point.y + height / 2, point.z);
      post.castShadow = true;
      railGroup.add(post);
    }

    return railGroup;
  };

  group.add(createRail(leftEdge, 1));
  group.add(createRail(rightEdge, -1));

  return group;
}

export function createCarGeometry(type: 'car' | 'suv' | 'truck'): { body: THREE.BufferGeometry; wheels: THREE.BufferGeometry[] } {
  const wheelGeos: THREE.BufferGeometry[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);

  for (let i = 0; i < 4; i++) {
    wheelGeos.push(wheelGeo.clone());
  }

  let bodyGeo: THREE.BufferGeometry;

  const ShapeClass = (THREE as any).Shape;

  if (type === 'car') {
    const bodyShape = new ShapeClass();
    bodyShape.moveTo(-0.5, -1.8);
    bodyShape.lineTo(0.5, -1.8);
    bodyShape.lineTo(0.5, -1.2);
    bodyShape.lineTo(0.3, 1.2);
    bodyShape.lineTo(-0.3, 1.2);
    bodyShape.lineTo(-0.5, -1.2);
    bodyShape.closePath();

    const extrudeSettings = { depth: 1, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08 };
    bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    bodyGeo.rotateX(-Math.PI / 2);
    bodyGeo.translate(0, 0.5, 0);
  } else if (type === 'suv') {
    const bodyShape = new ShapeClass();
    bodyShape.moveTo(-0.6, -2);
    bodyShape.lineTo(0.6, -2);
    bodyShape.lineTo(0.6, -1.6);
    bodyShape.lineTo(0.4, 1.6);
    bodyShape.lineTo(-0.4, 1.6);
    bodyShape.lineTo(-0.6, -1.6);
    bodyShape.closePath();

    const extrudeSettings = { depth: 1.2, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08 };
    bodyGeo = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    bodyGeo.rotateX(-Math.PI / 2);
    bodyGeo.translate(0, 0.6, 0);
  } else {
    bodyGeo = new THREE.BoxGeometry(1.8, 1.8, 4.5);
    bodyGeo.translate(0, 0.9, 0);
  }

  return { body: bodyGeo, wheels: wheelGeos };
}

export function createStreetLightGeometry(): { pole: THREE.Mesh; lamp: THREE.Mesh; light: THREE.PointLight } {
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 7, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9, roughness: 0.2 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 3.5;

  const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6);
  armGeo.rotateZ(Math.PI / 2.5);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.position.set(1.2, 6, 0);
  pole.add(arm);

  const lampGeo = new THREE.SphereGeometry(0.25, 12, 8);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    emissive: 0xffff88,
    emissiveIntensity: 0.3
  });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.set(2.5, 5.8, 0);
  pole.add(lamp);

  const light = new THREE.PointLight(0xffffcc, 0, 25, 2);
  light.position.set(2.5, 5.5, 0);
  light.castShadow = false;

  return { pole, lamp, light };
}

export function createBuildingGeometry(width: number, height: number, depth: number, style: string): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);

  let material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

  if (style === 'office') {
    material = new THREE.MeshPhysicalMaterial({
      color: 0xaabbcc,
      metalness: 0.1,
      roughness: 0.3,
      transparent: true,
      opacity: 0.7,
      transmission: 0.5,
      reflectivity: 0.5
    });
  } else if (style === 'residential') {
    material = new THREE.MeshStandardMaterial({
      color: 0xddccaa,
      roughness: 0.8
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      color: 0x8899aa,
      metalness: 0.2,
      roughness: 0.6
    });
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = height / 2;

  return mesh;
}

export function createRoadSignGeometry(text: string): THREE.Group {
  const group = new THREE.Group();

  const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 5, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 2.5;
  group.add(pole);

  const signGeo = new THREE.BoxGeometry(2.5, 1, 0.1);
  const signMat = new THREE.MeshStandardMaterial({
    color: 0x1a5fb4,
    side: THREE.DoubleSide,
    metalness: 0.1
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.y = 5;
  sign.castShadow = true;
  group.add(sign);

  const frameGeo = new THREE.BoxGeometry(2.7, 1.2, 0.05);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.y = 5;
  frame.position.z = -0.03;
  group.add(frame);

  return group;
}

export function createTreeGeometry(): THREE.Group {
  const group = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 2, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1;
  trunk.castShadow = true;
  group.add(trunk);

  const foliageGeo = new THREE.SphereGeometry(1.5, 8, 6);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });
  const foliage = new THREE.Mesh(foliageGeo, foliageMat);
  foliage.position.y = 3.5;
  foliage.castShadow = true;
  group.add(foliage);

  return group;
}
