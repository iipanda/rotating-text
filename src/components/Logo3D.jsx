import { useRef, useState, Suspense, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text3D, Center } from '@react-three/drei'
import * as THREE from 'three'

export default function Logo3D({ 
  text = 'GHOST', 
  recording = false, 
  recordingRotation = 0,
  onBoundsCalculated,
  bevelType = 'chamfer',
  settings,
  materialPresets
}) {
  const groupRef = useRef()
  const centerRef = useRef()
  const domElementRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [rotation, setRotation] = useState({ x: 0.1, y: 0 })
  const previousMouseRef = useRef({ x: 0, y: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const { gl } = useThree()
  const alwaysReadable = Boolean(settings?.alwaysReadable)
  const bounceBack = Boolean(settings?.bounceBack)
  const bounceTimeRef = useRef(0)
  const bounceDirectionRef = useRef(1)

  const getReadableRotationY = (y) => {
    const twoPi = Math.PI * 2
    let normalized = y % twoPi
    if (normalized < 0) normalized += twoPi

    // If the text would be back-facing, flip 180deg.
    // This swap happens near edge-on angles, so it feels like a continuous spin.
    if (normalized > Math.PI / 2 && normalized < (3 * Math.PI) / 2) return y + Math.PI
    return y
  }

  useEffect(() => {
    domElementRef.current = gl?.domElement ?? null
  }, [gl])

  // Calculate bounds when text changes
  useEffect(() => {
    if (centerRef.current && onBoundsCalculated) {
      // Wait for geometry to be ready
      setTimeout(() => {
        if (centerRef.current) {
          const box = new THREE.Box3().setFromObject(centerRef.current)
          const size = new THREE.Vector3()
          box.getSize(size)
          
          // Calculate aspect ratio based on text bounds
          const aspectRatio = size.x / size.y
          onBoundsCalculated({ width: size.x, height: size.y, aspectRatio })
        }
      }, 100)
    }
  }, [text, onBoundsCalculated])

  useFrame(() => {
    if (groupRef.current) {
      if (recording) {
        // Use controlled rotation during recording
        groupRef.current.rotation.x = 0.1
        groupRef.current.rotation.y = alwaysReadable
          ? getReadableRotationY(recordingRotation)
          : recordingRotation
      } else {
        if (!isDragging) {
          // Auto-rotate when not dragging
          velocityRef.current.x *= 0.95
          velocityRef.current.y *= 0.95
          
          // Add slow auto-rotation based on duration setting
          const duration = settings?.rotationDuration || 3.5
          const dt = 0.016
          
          if (bounceBack) {
            // Bounce back mode: smooth easing
            bounceTimeRef.current = (bounceTimeRef.current + dt / duration) % 1
            // 0 -> PI/2 -> 0 -> -PI/2 -> 0
            const t = bounceTimeRef.current
            const bounceY = (Math.PI / 2) * Math.sin(t * Math.PI * 2)
            setRotation(prev => ({
              x: prev.x + velocityRef.current.x,
              y: bounceY
            }))
          } else {
            const autoRotateSpeed = (2 * Math.PI) / duration
            setRotation(prev => ({
              x: prev.x + velocityRef.current.x,
              y: prev.y + velocityRef.current.y + autoRotateSpeed * dt
            }))
          }
        }
        groupRef.current.rotation.x = rotation.x
        groupRef.current.rotation.y = alwaysReadable
          ? getReadableRotationY(rotation.y)
          : rotation.y
      }
    }
  })

  const handlePointerDown = (e) => {
    if (recording) return
    e.stopPropagation()
    setIsDragging(true)
    previousMouseRef.current = { x: e.clientX, y: e.clientY }
    if (domElementRef.current) domElementRef.current.style.cursor = 'grabbing'
  }

  const handlePointerUp = () => {
    if (recording) return
    setIsDragging(false)
    if (domElementRef.current) domElementRef.current.style.cursor = 'grab'
  }

  const handlePointerMove = (e) => {
    if (!isDragging || recording) return
    
    const deltaX = e.clientX - previousMouseRef.current.x
    const deltaY = e.clientY - previousMouseRef.current.y
    
    velocityRef.current = { x: deltaY * 0.002, y: deltaX * 0.002 }
    
    setRotation(prev => ({
      x: prev.x + deltaY * 0.005,
      y: prev.y + deltaX * 0.005
    }))
    
    previousMouseRef.current = { x: e.clientX, y: e.clientY }
  }

  // Calculate scale based on text length to keep it in view
  const scale = Math.min(1, 4 / Math.max(text.length, 1))

  return (
    <group 
      ref={groupRef} 
      scale={scale}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerOver={() => {
        if (!recording && domElementRef.current) domElementRef.current.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        if (!recording && domElementRef.current) domElementRef.current.style.cursor = 'auto'
      }}
    >
      <Suspense fallback={null}>
        <Center ref={centerRef} key={`${text}-${settings?.font}`}>
          <Text3D
            font={`/fonts/${settings?.font || 'inter'}_bold.json`}
            size={1}
            height={0.3}
            bevelEnabled
            bevelThickness={0.04}
            bevelSize={0.03}
            bevelSegments={bevelType === 'rounded' ? 8 : 1}
            curveSegments={24}
          >
            {text || ' '}
            <meshStandardMaterial
              color={settings?.color || '#ff4400'}
              metalness={materialPresets?.[settings?.material]?.metalness ?? 1}
              roughness={materialPresets?.[settings?.material]?.roughness ?? 0.15}
              envMapIntensity={materialPresets?.[settings?.material]?.envMapIntensity ?? 1.5}
            />
          </Text3D>
        </Center>
      </Suspense>
    </group>
  )
}
