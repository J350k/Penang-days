import * as THREE from 'three';

const _anchor = new THREE.Vector3();
const _desiredPos = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

export class ThirdPersonCameraRig {
  public yaw = 0;
  public pitch = 0.28;
  private currentDistance = 4.2;
  private smoothedPos = new THREE.Vector3();
  private smoothedLook = new THREE.Vector3();
  private initialized = false;

  public resetToPlayer(x: number, y: number, z: number, yaw: number): void {
    this.yaw = yaw;
    this.pitch = 0.24;
    this.currentDistance = 2.65;
    _anchor.set(x, y + 1.48, z);
    const offsetDist = 2.65;
    const horiz = Math.cos(this.pitch) * offsetDist;
    this.smoothedPos.set(
      _anchor.x + Math.sin(this.yaw) * horiz,
      _anchor.y + Math.sin(this.pitch) * offsetDist,
      _anchor.z + Math.cos(this.yaw) * horiz
    );
    this.smoothedLook.copy(_anchor);
    this.initialized = true;
  }

  public applyLookDelta(dx: number, dy: number, sensitivity: number = 1.0): void {
    this.yaw -= dx * 0.0045 * sensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch + dy * 0.0038 * sensitivity, -0.22, 0.92);
  }

  public update(
    camera: THREE.PerspectiveCamera,
    targetX: number,
    targetY: number,
    targetZ: number,
    obstacles: THREE.Object3D[],
    dt: number,
    isIndoors: boolean,
    isMounted: boolean = false
  ): void {
    _anchor.set(targetX, targetY + (isMounted ? 1.65 : 1.48), targetZ);

    const maxDist = isMounted ? 6.6 : isIndoors ? 2.65 : 4.6;
    const horiz = Math.cos(this.pitch) * maxDist;
    _desiredPos.set(
      _anchor.x + Math.sin(this.yaw) * horiz,
      Math.max(targetY + 0.45, _anchor.y + Math.sin(this.pitch) * maxDist),
      _anchor.z + Math.cos(this.yaw) * horiz
    );

    // Wall pull-in raycast so camera never clips behind shophouse walls
    _dir.subVectors(_desiredPos, _anchor);
    const targetDist = _dir.length();
    let clampedDist = targetDist;
    if (targetDist > 0.1 && obstacles.length > 0) {
      _dir.divideScalar(targetDist);
      _raycaster.set(_anchor, _dir);
      _raycaster.near = 0.2;
      _raycaster.far = targetDist;
      const hits = _raycaster.intersectObjects(obstacles, false);
      if (hits.length > 0) {
        clampedDist = Math.max(0.95, hits[0].distance - 0.28);
      }
    }

    const distDamp = 1 - Math.exp(-16 * dt);
    this.currentDistance += (clampedDist - this.currentDistance) * distDamp;

    _desiredPos.copy(_anchor).addScaledVector(_dir, this.currentDistance);

    if (!this.initialized) {
      this.smoothedPos.copy(_desiredPos);
      this.smoothedLook.copy(_anchor);
      this.initialized = true;
    } else {
      const followDamp = 1 - Math.exp(-14 * dt);
      this.smoothedPos.lerp(_desiredPos, followDamp);
      this.smoothedLook.lerp(_anchor, followDamp);
    }

    camera.position.copy(this.smoothedPos);
    camera.lookAt(this.smoothedLook);
  }
}
