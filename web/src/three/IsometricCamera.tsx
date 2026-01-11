import { useRef, useEffect, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  CAMERA_HEIGHT,
  CAMERA_DISTANCE,
  CAMERA_DIAGONAL_OFFSET,
  DRONE_HEIGHT,
  DRONE_ORBIT_RADIUS_X,
  DRONE_ORBIT_RADIUS_Z,
  DRONE_ORBIT_SPEED,
  DRONE_CENTER_X,
  DRONE_CENTER_Z,
} from './constants';
import { useGameStore } from '../stores/gameStore';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';

interface IsometricCameraProps {
  targetRef: MutableRefObject<[number, number, number]>;
  fov?: number;
}

// Reusable vectors to avoid garbage collection
const _targetVec = new THREE.Vector3();
const _offsetVec = new THREE.Vector3();

export function IsometricCamera({
  targetRef,
  fov = 50,
}: IsometricCameraProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControlsType>(null);
  const currentCameraRotation = useRef(0);

  // Track previous target position to calculate movement delta
  const prevTargetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const isInitializedRef = useRef(false);

  // Drone mode state
  const droneAngleRef = useRef(0);

  const cameraMode = useGameStore((s) => s.cameraMode);
  const setCameraMode = useGameStore((s) => s.setCameraMode);

  // Handle user interaction - switch to free mode (only if not in drone mode)
  const handleControlsStart = () => {
    if (cameraMode === 'follow') {
      setCameraMode('free');
    }
  };

  // Update orbit controls target when switching to free mode
  useEffect(() => {
    if (controlsRef.current && cameraMode === 'free') {
      const target = targetRef.current;
      controlsRef.current.target.set(target[0], target[1], target[2]);
      controlsRef.current.update();
    }
  }, [cameraMode, targetRef]);

  useFrame(() => {
    if (!cameraRef.current) return;

    const target = targetRef.current;
    const hasValidTarget = target[0] !== 0 || target[1] !== 0 || target[2] !== 0;

    // Drone mode OR no valid target (loading/transitioning states)
    if (cameraMode === 'drone' || !hasValidTarget) {
      // Update orbit angle
      droneAngleRef.current += DRONE_ORBIT_SPEED;

      // Calculate elliptical orbit position
      const x = DRONE_CENTER_X + DRONE_ORBIT_RADIUS_X * Math.cos(droneAngleRef.current);
      const z = DRONE_CENTER_Z + DRONE_ORBIT_RADIUS_Z * Math.sin(droneAngleRef.current);

      // Smooth camera position
      cameraRef.current.position.x += (x - cameraRef.current.position.x) * 0.02;
      cameraRef.current.position.y += (DRONE_HEIGHT - cameraRef.current.position.y) * 0.02;
      cameraRef.current.position.z += (z - cameraRef.current.position.z) * 0.02;

      // Look at center of map
      cameraRef.current.lookAt(DRONE_CENTER_X, 0, DRONE_CENTER_Z);

      // Update controls target
      if (controlsRef.current) {
        controlsRef.current.target.set(DRONE_CENTER_X, 0, DRONE_CENTER_Z);
      }

      return;
    }

    // From here, we have a valid target - reuse vector to avoid GC
    _targetVec.set(target[0], target[1], target[2]);

    // Initialize previous target on first frame
    if (!isInitializedRef.current) {
      prevTargetRef.current.copy(_targetVec);
      isInitializedRef.current = true;
    }

    // Calculate how much target moved since last frame (reuse _offsetVec)
    const deltaLength = _offsetVec.subVectors(_targetVec, prevTargetRef.current).length();

    // Detect teleport (large movement like death/respawn/player switch)
    const isTeleport = deltaLength > 100;

    if (cameraMode === 'follow') {
      const playerRotation = useGameStore.getState().currentPlayerRotation;

      // Smoothly interpolate camera rotation to follow player
      const rotationDiff = playerRotation - currentCameraRotation.current;
      const normalizedDiff = Math.atan2(Math.sin(rotationDiff), Math.cos(rotationDiff));
      currentCameraRotation.current += normalizedDiff * 0.05;

      // Camera orbits behind the player based on their facing direction
      // Add diagonal offset for a more dynamic view angle
      const orbitAngle = currentCameraRotation.current + Math.PI + CAMERA_DIAGONAL_OFFSET;

      // Calculate target camera position based on target and player rotation
      const targetCamX = target[0] + CAMERA_DISTANCE * Math.sin(orbitAngle);
      const targetCamY = target[1] + CAMERA_HEIGHT;
      const targetCamZ = target[2] + CAMERA_DISTANCE * Math.cos(orbitAngle);

      // Smoothly interpolate camera position to reduce jitter
      // Higher factor = more responsive, lower = smoother but laggy
      const smoothFactor = isTeleport ? 1 : 0.25;
      cameraRef.current.position.x += (targetCamX - cameraRef.current.position.x) * smoothFactor;
      cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * smoothFactor;
      cameraRef.current.position.z += (targetCamZ - cameraRef.current.position.z) * smoothFactor;

      // Always look at target (also smoothed)
      if (controlsRef.current) {
        controlsRef.current.target.x += (target[0] - controlsRef.current.target.x) * smoothFactor;
        controlsRef.current.target.y += (target[1] - controlsRef.current.target.y) * smoothFactor;
        controlsRef.current.target.z += (target[2] - controlsRef.current.target.z) * smoothFactor;
      }
      cameraRef.current.lookAt(
        controlsRef.current?.target.x ?? target[0],
        controlsRef.current?.target.y ?? target[1],
        controlsRef.current?.target.z ?? target[2]
      );
    } else {
      // Free mode: camera follows player while maintaining user's chosen angle/distance
      if (controlsRef.current) {
        if (isTeleport) {
          // Teleport: keep same relative offset from target (reuse _offsetVec)
          _offsetVec.subVectors(cameraRef.current.position, prevTargetRef.current);
          cameraRef.current.position.copy(_targetVec).add(_offsetVec);
          controlsRef.current.target.copy(_targetVec);
        } else {
          // Smooth follow - lerp camera and target
          const smoothFactor = 0.2;
          // Store offset before modifying target (reuse _offsetVec)
          _offsetVec.subVectors(cameraRef.current.position, controlsRef.current.target);

          // Smoothly move control target toward player
          controlsRef.current.target.x += (target[0] - controlsRef.current.target.x) * smoothFactor;
          controlsRef.current.target.y += (target[1] - controlsRef.current.target.y) * smoothFactor;
          controlsRef.current.target.z += (target[2] - controlsRef.current.target.z) * smoothFactor;

          // Move camera to maintain offset from target
          cameraRef.current.position.copy(controlsRef.current.target).add(_offsetVec);
        }

        controlsRef.current.update();
      }
    }

    // Store current target for next frame
    prevTargetRef.current.copy(_targetVec);
  });

  // Start at map center - camera will follow player once their data arrives
  const initialPosition: [number, number, number] = [
    DRONE_CENTER_X + CAMERA_DISTANCE,
    CAMERA_HEIGHT + 30,
    DRONE_CENTER_Z + CAMERA_DISTANCE,
  ];

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={initialPosition}
        fov={fov}
        near={20}
        far={10000}
      />
      <OrbitControls
        ref={controlsRef}
        camera={cameraRef.current ?? undefined}
        enableRotate={cameraMode !== 'drone'}
        enableZoom={cameraMode !== 'drone'}
        enablePan={false}
        minDistance={50}
        maxDistance={1000}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI / 2 - 0.035}
        onStart={handleControlsStart}
      />
    </>
  );
}
