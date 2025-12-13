import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, Text, Html } from '@react-three/drei'
import { BOARD_CONFIG, getSpacePosition, getBuildingPosition } from '../utils/boardUtils'
import { useGameStore } from '../store/gameStore'

// Building component for houses/hotels
function Building({ position, houses, hasHotel }) {
  if (hasHotel) {
    return (
      <mesh position={[position.x, 0.4, position.z]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#cc0000" metalness={0.4} roughness={0.5} />
      </mesh>
    )
  }
  
  const housePositions = [
    [-0.25, 0, -0.25],
    [0.25, 0, -0.25],
    [-0.25, 0, 0.25],
    [0.25, 0, 0.25]
  ]
  
  return (
    <group position={[position.x, 0.2, position.z]}>
      {Array.from({ length: houses }).map((_, i) => (
        <mesh key={i} position={housePositions[i]} castShadow>
          <boxGeometry args={[0.3, 0.4, 0.3]} />
          <meshStandardMaterial color="#00aa00" metalness={0.3} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

// 3D Tile Info Popup
function TilePopup({ tile, position, property, players }) {
  const owner = property ? players.find(p => p.id === property.ownerId) : null
  
  return (
    <Html
      position={[0, 3, 0]}
      center
      style={{
        pointerEvents: 'none',
        transform: 'translateY(-50%)'
      }}
    >
      <div style={{
        background: 'linear-gradient(145deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 40, 0.95))',
        padding: '15px 20px',
        borderRadius: '12px',
        border: `2px solid ${tile.color || '#FFD700'}`,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        color: 'white',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        minWidth: '180px',
        textAlign: 'center',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '700',
          marginBottom: '8px',
          color: tile.color || '#FFD700'
        }}>
          {tile.name}
        </div>
        
        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>
          {tile.type.toUpperCase()}
        </div>
        
        {tile.price > 0 && (
          <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600' }}>
            Price: ${tile.price}
          </div>
        )}
        
        {tile.rent && tile.rent[0] > 0 && (
          <div style={{ fontSize: '12px', color: '#ddd', marginTop: '4px' }}>
            Rent: ${tile.rent[0]}
          </div>
        )}
        
        {owner && (
          <div style={{
            marginTop: '8px',
            padding: '6px 10px',
            background: owner.color,
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            Owner: {owner.name}
            {property.houses > 0 && ` (${property.houses} 🏠)`}
            {property.hasHotel && ' (🏨)'}
          </div>
        )}
        
        {tile.type === 'chest' && (
          <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px' }}>
            📦 Draw a card!
          </div>
        )}
        
        {tile.type === 'chance' && (
          <div style={{ fontSize: '11px', color: '#f97316', marginTop: '4px' }}>
            ❓ Draw a card!
          </div>
        )}
        
        {tile.type === 'tax' && (
          <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
            💰 Pay ${tile.rent[0]}
          </div>
        )}
      </div>
    </Html>
  )
}

// Interactive tile with hover detection
function InteractiveTile({ index, tile, pos, property, players, tileColor, isCorner }) {
  const [hovered, setHovered] = useState(false)
  const buildingPos = getBuildingPosition(index)
  
  return (
    <group 
      position={[pos.x, 0, pos.z]}
      onPointerEnter={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerLeave={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Main tile */}
      <RoundedBox
        args={[BOARD_CONFIG.spaceWidth - 0.15, 0.25, BOARD_CONFIG.spaceWidth - 0.15]}
        radius={0.05}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color={isCorner ? '#FFD700' : '#f5f5dc'}
          metalness={0.2}
          roughness={0.8}
          emissive={hovered ? '#444444' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </RoundedBox>
      
      {/* Color strip on property tiles */}
      {!isCorner && tile?.type === 'property' && (
        <mesh position={[0, 0.13, -0.7]} castShadow>
          <boxGeometry args={[BOARD_CONFIG.spaceWidth - 0.2, 0.1, 0.5]} />
          <meshStandardMaterial color={tileColor} metalness={0.3} roughness={0.5} />
        </mesh>
      )}
      
      {/* Space number */}
      <Text
        position={[0, 0.2, 0.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        color="#333333"
        anchorX="center"
        anchorY="middle"
      >
        {index}
      </Text>
      
      {/* Tile name */}
      {tile && (
        <Text
          position={[0, 0.2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.15}
          color="#555555"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.8}
        >
          {tile.name.length > 12 ? tile.name.slice(0, 10) + '...' : tile.name}
        </Text>
      )}
      
      {/* Price display */}
      {tile?.price > 0 && (
        <Text
          position={[0, 0.2, -0.35]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.18}
          color="#228B22"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          ${tile.price}
        </Text>
      )}
      
      {/* Building space */}
      <mesh position={[buildingPos.x, 0.05, buildingPos.z]}>
        <boxGeometry args={[0.8, 0.05, 0.8]} />
        <meshStandardMaterial 
          color="#3a3a3a" 
          metalness={0.5} 
          roughness={0.5}
          transparent
          opacity={0.5}
        />
      </mesh>
      
      {/* Buildings */}
      {property && (property.houses > 0 || property.hasHotel) && (
        <Building 
          position={{ x: buildingPos.x, z: buildingPos.z }}
          houses={property.houses}
          hasHotel={property.hasHotel}
        />
      )}
      
      {/* Hover popup */}
      {hovered && tile && (
        <TilePopup 
          tile={tile} 
          position={pos} 
          property={property}
          players={players}
        />
      )}
    </group>
  )
}

export default function Board() {
  const groupRef = useRef()
  const { tileData, properties, players } = useGameStore()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Center platform */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[18, 1.0, 18]} />
        <meshStandardMaterial color="#1a3d1a" metalness={0.2} roughness={0.8} />
      </mesh>
      
      {/* Inner platform */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[14, 0.1, 14]} />
        <meshStandardMaterial color="#2d5a2d" metalness={0.1} roughness={0.9} />
      </mesh>
      
      {/* MONOPOLY title */}
      <group position={[0, 0.15, 0]}>
        <Text
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={2.2}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          letterSpacing={0.15}
        >
          MONOPOLY
        </Text>
        <Text
          position={[0, 0, 2.5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.6}
          color="#C0C0C0"
          anchorX="center"
          anchorY="middle"
        >
          3D Edition
        </Text>
      </group>
      
      {/* Board spaces */}
      {Array.from({ length: BOARD_CONFIG.spaces }).map((_, index) => {
        const pos = getSpacePosition(index)
        const tile = tileData[index]
        const property = properties[index]
        const isCorner = index % 10 === 0
        const tileColor = tile?.color || BOARD_CONFIG.colors[Math.floor((index % 36) / 2) % BOARD_CONFIG.colors.length]
        
        return (
          <InteractiveTile
            key={index}
            index={index}
            tile={tile}
            pos={pos}
            property={property}
            players={players}
            tileColor={tileColor}
            isCorner={isCorner}
          />
        )
      })}
      
      {/* Corner labels */}
      <Text position={[-11, 0.5, 11]} rotation={[-Math.PI / 4, 0, Math.PI / 4]} fontSize={0.6} color="#FFD700" anchorX="center" fontWeight="bold">
        GO →
      </Text>
      <Text position={[11, 0.5, 11]} rotation={[-Math.PI / 4, 0, -Math.PI / 4]} fontSize={0.5} color="#FFD700" anchorX="center" fontWeight="bold">
        JAIL
      </Text>
      <Text position={[11, 0.5, -11]} rotation={[-Math.PI / 4, 0, Math.PI / 4]} fontSize={0.4} color="#FFD700" anchorX="center" fontWeight="bold">
        FREE
      </Text>
      <Text position={[-11, 0.5, -11]} rotation={[-Math.PI / 4, 0, -Math.PI / 4]} fontSize={0.4} color="#FF4444" anchorX="center" fontWeight="bold">
        GO TO JAIL
      </Text>
    </group>
  )
}
