export interface IBlockState {
  x: number
  y: number
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacentMines: number
}
