import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Cylinder } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import { getSpacePosition, getPlayerOffset } from '../utils/boardUtils'

const AnimatedGroup = animated.group

export default function Player({ player, isCurrentPlayer, isInJail, isHidden }) {
  const meshRef = useRef()
  
  // Get target position
  const spacePos = getSpacePosition(player.position)
  const offset = getPlayerOffset(player.id - 1)
  
  // Smooth position animation
  const { position } = useSpring({
    position: [spacePos.x + offset.x, 0.8, spacePos.z + offset.z],
    config: { tension: 180, friction: 18 }
  })
  
  // Animation for current player
  useFrame((state) => {
    if (meshRef.current && isCurrentPlayer && !isHidden) {
      meshRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.15
    }
  })
  
  // Hide player during FPV (camera is at player position)
  if (isHidden) {
    return null
  }
  
  return (
    <AnimatedGroup position={position}>
      <group ref={meshRef}>
        {/* Player piece body */}
        <Cylinder
          args={[0.3, 0.4, 0.8, 16]}
          castShadow
        >
          <meshStandardMaterial 
            color={player.color}
            metalness={0.6}
            roughness={0.4}
            emissive={isCurrentPlayer ? player.color : '#000000'}
            emissiveIntensity={isCurrentPlayer ? 0.3 : 0}
          />
        </Cylinder>
        
        {/* Player piece top */}
        <Sphere
          args={[0.35, 16, 16]}
          position={[0, 0.5, 0]}
          castShadow
        >
          <meshStandardMaterial 
            color={player.color}
            metalness={0.6}
            roughness={0.4}
            emissive={isCurrentPlayer ? player.color : '#000000'}
            emissiveIntensity={isCurrentPlayer ? 0.3 : 0}
          />
        </Sphere>
        
        {/* Jail indicator */}
        {isInJail && (
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
          </mesh>
        )}
        
        {/* Glow effect for current player */}
        {isCurrentPlayer && (
          <pointLight
            position={[0, 1, 0]}
            intensity={1}
            distance={3}
            color={player.color}
          />
        )}
      </group>
    </AnimatedGroup>
  )
}
