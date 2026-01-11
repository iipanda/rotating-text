import { forwardRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import Logo3D from './Logo3D'

function SceneContent({ text, recording, recordingRotation, onBoundsCalculated, settings, materialPresets }) {
  return (
    <>
      {!recording && <color attach="background" args={['#000000']} />}
      
      <directionalLight
        position={[5, 3, 2]}
        intensity={settings.lightIntensity}
        color={settings.color}
      />
      
      <pointLight
        position={[-3, 0, -4]}
        intensity={settings.lightIntensity * 0.375}
        color={settings.color}
      />
      
      <Logo3D 
        text={text} 
        recording={recording} 
        recordingRotation={recordingRotation}
        onBoundsCalculated={onBoundsCalculated}
        bevelType={settings.bevelType}
        settings={settings}
        materialPresets={materialPresets}
      />
      
      <Environment preset="night" environmentIntensity={0.3} />
      
      <EffectComposer>
        <Bloom
          luminanceThreshold={settings.bloomThreshold}
          luminanceSmoothing={0.9}
          intensity={settings.bloomIntensity}
          radius={0.9}
        />
        {!recording && <Vignette eskil={false} offset={0.1} darkness={0.85} />}
      </EffectComposer>
    </>
  )
}

const Scene = forwardRef(function Scene({ text, recording, recordingRotation, onBoundsCalculated, settings, materialPresets }, ref) {
  return (
    <Canvas
      ref={ref}
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ background: '#000000' }}
      gl={{ 
        antialias: true, 
        toneMapping: 3, 
        toneMappingExposure: 0.8,
        preserveDrawingBuffer: true,
        alpha: true,
        autoClear: true
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      <SceneContent 
        text={text}
        recording={recording}
        recordingRotation={recordingRotation}
        onBoundsCalculated={onBoundsCalculated}
        settings={settings}
        materialPresets={materialPresets}
      />
    </Canvas>
  )
})

export default Scene
