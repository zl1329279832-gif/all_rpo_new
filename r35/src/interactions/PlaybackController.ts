import { SceneManager } from '@/scene/SceneManager';
import { RenderLoop } from '@/scene/RenderLoop';
import type { TrackPoint, ForkliftData } from '@/types';
import { ForkliftBuilder } from '@/models/Forklift';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export class PlaybackController {
  private static instance: PlaybackController;
  private sceneManager: SceneManager;
  private renderLoop: RenderLoop;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private playbackSpeed: number = 1;
  private tracks: Map<string, TrackPoint[]> = new Map();
  private trackLines: Map<string, THREE.Line> = new Map();
  private currentForkliftId: string | null = null;
  private originalForkliftPositions: Map<string, THREE.Vector3> = new Map();
  private updateCallback: (() => void) | null = null;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private onPlayStateChange: ((isPlaying: boolean) => void) | null = null;

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
    this.renderLoop = RenderLoop.getInstance();
  }

  static getInstance(): PlaybackController {
    if (!PlaybackController.instance) {
      PlaybackController.instance = new PlaybackController();
    }
    return PlaybackController.instance;
  }

  loadTrack(forkliftId: string, trackPoints: TrackPoint[]): void {
    this.clearTrack(forkliftId);
    this.tracks.set(forkliftId, trackPoints);

    if (trackPoints.length > 1) {
      const line = ForkliftBuilder.createTrackLine(
        trackPoints.map(p => ({ x: p.position.x, y: p.position.y, z: p.position.z }))
      );
      line.name = `track_${forkliftId}`;
      this.sceneManager.helpersGroup.add(line);
      this.trackLines.set(forkliftId, line);
    }

    this.currentForkliftId = forkliftId;
    this.currentTime = 0;

    const forklift = this.sceneManager.forkliftsGroup.getObjectByName(`forklift_${forkliftId}`);
    if (forklift) {
      this.originalForkliftPositions.set(forkliftId, forklift.position.clone());
    }
  }

  play(): void {
    if (this.isPlaying || !this.currentForkliftId) return;

    this.isPlaying = true;
    this.updateCallback = () => this.update();
    this.renderLoop.addCallback(this.updateCallback);

    if (this.onPlayStateChange) {
      this.onPlayStateChange(true);
    }
  }

  pause(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    if (this.updateCallback) {
      this.renderLoop.removeCallback(this.updateCallback);
      this.updateCallback = null;
    }

    if (this.onPlayStateChange) {
      this.onPlayStateChange(false);
    }
  }

  stop(): void {
    this.pause();
    this.currentTime = 0;
    this.updateForkliftPosition();

    if (this.onTimeUpdate) {
      this.onTimeUpdate(0);
    }
  }

  seek(time: number): void {
    const track = this.getCurrentTrack();
    if (!track) return;

    const maxTime = this.getTrackDuration();
    this.currentTime = Math.max(0, Math.min(time, maxTime));
    this.updateForkliftPosition();

    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTime);
    }
  }

  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.1, Math.min(10, speed));
  }

  getSpeed(): number {
    return this.playbackSpeed;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getTrackDuration(): number {
    const track = this.getCurrentTrack();
    if (!track || track.length < 2) return 0;
    return track[track.length - 1].timestamp - track[0].timestamp;
  }

  isPlaybackActive(): boolean {
    return this.isPlaying;
  }

  getCurrentForkliftId(): string | null {
    return this.currentForkliftId;
  }

  setOnTimeUpdate(callback: (time: number) => void): void {
    this.onTimeUpdate = callback;
  }

  setOnPlayStateChange(callback: (isPlaying: boolean) => void): void {
    this.onPlayStateChange = callback;
  }

  private update(): void {
    const delta = this.renderLoop instanceof RenderLoop ? 16 : 16;
    this.currentTime += delta * this.playbackSpeed;

    const maxTime = this.getTrackDuration();
    if (this.currentTime >= maxTime) {
      this.currentTime = maxTime;
      this.pause();
    }

    this.updateForkliftPosition();

    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTime);
    }
  }

  private updateForkliftPosition(): void {
    if (!this.currentForkliftId) return;

    const track = this.getCurrentTrack();
    if (!track || track.length < 2) return;

    const startTime = track[0].timestamp;
    const targetTime = startTime + this.currentTime;

    let prevPoint = track[0];
    let nextPoint = track[track.length - 1];

    for (let i = 0; i < track.length - 1; i++) {
      if (track[i].timestamp <= targetTime && track[i + 1].timestamp >= targetTime) {
        prevPoint = track[i];
        nextPoint = track[i + 1];
        break;
      }
    }

    const timeRange = nextPoint.timestamp - prevPoint.timestamp;
    const t = timeRange > 0 ? (targetTime - prevPoint.timestamp) / timeRange : 0;

    const position = {
      x: this.lerp(prevPoint.position.x, nextPoint.position.x, t),
      y: this.lerp(prevPoint.position.y, nextPoint.position.y, t),
      z: this.lerp(prevPoint.position.z, nextPoint.position.z, t),
    };
    const rotation = this.lerpAngle(prevPoint.rotation, nextPoint.rotation, t);

    const forklift = this.sceneManager.forkliftsGroup.getObjectByName(
      `forklift_${this.currentForkliftId}`
    );
    if (forklift) {
      forklift.position.set(position.x, position.y, position.z);
      forklift.rotation.y = rotation;
    }

    this.updateTrailPoint(position);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpAngle(a: number, b: number, t: number): number {
    const diff = b - a;
    const adjusted = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
    return a + adjusted * t;
  }

  private trailPoints: THREE.Vector3[] = [];
  private trailLine: THREE.Line | null = null;

  private updateTrailPoint(position: { x: number; y: number; z: number }): void {
    this.trailPoints.push(new THREE.Vector3(position.x, position.y + 0.1, position.z));

    if (this.trailPoints.length > 100) {
      this.trailPoints.shift();
    }

    if (this.trailPoints.length > 2) {
      if (!this.trailLine) {
        const geometry = new THREE.BufferGeometry().setFromPoints(this.trailPoints);
        const material = new THREE.LineBasicMaterial({
          color: 0x1890ff,
          transparent: true,
          opacity: 0.6,
        });
        this.trailLine = new THREE.Line(geometry, material);
        this.trailLine.name = 'playback_trail';
        this.sceneManager.helpersGroup.add(this.trailLine);
      } else {
        (this.trailLine.geometry as THREE.BufferGeometry).setFromPoints(this.trailPoints);
        (this.trailLine.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
      }
    }
  }

  private getCurrentTrack(): TrackPoint[] | null {
    if (!this.currentForkliftId) return null;
    return this.tracks.get(this.currentForkliftId) || null;
  }

  private clearTrack(forkliftId: string): void {
    const line = this.trackLines.get(forkliftId);
    if (line) {
      this.sceneManager.helpersGroup.remove(line);
      (line.geometry as THREE.BufferGeometry).dispose();
      (line.material as THREE.Material).dispose();
      this.trackLines.delete(forkliftId);
    }

    this.tracks.delete(forkliftId);

    const originalPos = this.originalForkliftPositions.get(forkliftId);
    if (originalPos) {
      const forklift = this.sceneManager.forkliftsGroup.getObjectByName(`forklift_${forkliftId}`);
      if (forklift) {
        forklift.position.copy(originalPos);
      }
      this.originalForkliftPositions.delete(forkliftId);
    }

    this.clearTrail();
  }

  private clearTrail(): void {
    if (this.trailLine) {
      this.sceneManager.helpersGroup.remove(this.trailLine);
      (this.trailLine.geometry as THREE.BufferGeometry).dispose();
      (this.trailLine.material as THREE.Material).dispose();
      this.trailLine = null;
    }
    this.trailPoints = [];
  }

  clearAllTracks(): void {
    this.pause();
    this.tracks.forEach((_, id) => this.clearTrack(id));
    this.currentForkliftId = null;
    this.currentTime = 0;
  }

  dispose(): void {
    this.clearAllTracks();
    this.onTimeUpdate = null;
    this.onPlayStateChange = null;
  }
}
