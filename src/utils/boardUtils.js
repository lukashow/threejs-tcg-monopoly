// Board configuration for 40 spaces (like Monopoly)
export const BOARD_CONFIG = {
  spaces: 40,
  boardSize: 22,
  spaceWidth: 2.2,
  colors: [
    '#8B4513', '#D2691E', '#F4A460', '#DEB887',
    '#87CEEB', '#4682B4', '#1E90FF', '#4169E1',
    '#90EE90', '#32CD32', '#228B22', '#006400',
    '#FFD700', '#FFA500', '#FF8C00', '#FF6347',
    '#DDA0DD', '#DA70D6', '#BA55D3', '#9370DB'
  ]
}

// Calculate position for each space on the board
export const getSpacePosition = (index) => {
  const { boardSize, spaceWidth, spaces } = BOARD_CONFIG
  const spacesPerSide = spaces / 4
  const halfBoard = boardSize / 2
  
  // Bottom row (0-9): moving right to left (START is bottom-left)
  if (index < spacesPerSide) {
    return {
      x: -halfBoard + (index * spaceWidth),
      z: halfBoard
    }
  }
  // Right column (10-19): moving bottom to top
  else if (index < spacesPerSide * 2) {
    const offset = index - spacesPerSide
    return {
      x: halfBoard,
      z: halfBoard - (offset * spaceWidth)
    }
  }
  // Top row (20-29): moving right to left
  else if (index < spacesPerSide * 3) {
    const offset = index - spacesPerSide * 2
    return {
      x: halfBoard - (offset * spaceWidth),
      z: -halfBoard
    }
  }
  // Left column (30-39): moving top to bottom
  else {
    const offset = index - spacesPerSide * 3
    return {
      x: -halfBoard,
      z: -halfBoard + (offset * spaceWidth)
    }
  }
}

// Get player offset within a space (for multiple players on same space)
export const getPlayerOffset = (playerIndex) => {
  const offsets = [
    { x: -0.4, z: -0.4 },
    { x: 0.4, z: -0.4 },
    { x: -0.4, z: 0.4 },
    { x: 0.4, z: 0.4 }
  ]
  return offsets[playerIndex] || { x: 0, z: 0 }
}

// Get the forward direction for a tile (for FPV camera)
export const getTileDirection = (index) => {
  const spacesPerSide = BOARD_CONFIG.spaces / 4
  
  // Bottom row: facing right (movement direction)
  if (index < spacesPerSide) {
    return { x: 1, z: 0 }
  }
  // Right column: facing up (negative z)
  else if (index < spacesPerSide * 2) {
    return { x: 0, z: -1 }
  }
  // Top row: facing left (negative x)
  else if (index < spacesPerSide * 3) {
    return { x: -1, z: 0 }
  }
  // Left column: facing down (positive z)
  else {
    return { x: 0, z: 1 }
  }
}

// Get building position offset (inner side of tile)
export const getBuildingPosition = (index) => {
  const spacesPerSide = BOARD_CONFIG.spaces / 4
  const offset = 1.2
  
  // Bottom row: building on top (negative z)
  if (index < spacesPerSide) {
    return { x: 0, z: -offset }
  }
  // Right column: building on left (negative x)
  else if (index < spacesPerSide * 2) {
    return { x: -offset, z: 0 }
  }
  // Top row: building on bottom (positive z)
  else if (index < spacesPerSide * 3) {
    return { x: 0, z: offset }
  }
  // Left column: building on right (positive x)
  else {
    return { x: offset, z: 0 }
  }
}
