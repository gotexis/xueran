import { Player } from './types'

// 统一处理所有角色的特殊信息生成
export const generateSpecialInfo = (player: Player, players: Player[], remainingRoles?: string[], isFalseInfo: boolean = false) => {
  switch (player.role.name) {
    case '洗衣妇':
      return handleWasherwomanInfo(player, players, isFalseInfo)
    case '图书管理员':
      return handleLibrarianInfo(player, players, isFalseInfo)
    case '调查员':
      return handleInvestigatorInfo(player, players, isFalseInfo)
    case '厨师':
      return handleChefInfo(players, isFalseInfo)
    case '共情者':
      return handleEmpathInfo(player, players, isFalseInfo)
    case '小恶魔':
      return remainingRoles ? handleDemonInfo(remainingRoles, isFalseInfo) : undefined
    default:
      return undefined
  }
}

// 处理洗衣妇的特殊信息
export const handleWasherwomanInfo = (washerwoman: Player, players: Player[], isFalseInfo: boolean = false) => {
  const townsfolkPlayers = players.filter(p => 
    p.role.type === 'townsfolk' && 
    p.role.name !== '洗衣妇'
  )
  
  if (townsfolkPlayers.length === 0) return undefined
  
  if (!isFalseInfo) {
    const randomTownsfolk = townsfolkPlayers[Math.floor(Math.random() * townsfolkPlayers.length)]
    const nonTownsfolkPlayers = players.filter(p => 
      p.number !== washerwoman.number && 
      p.number !== randomTownsfolk.number
    )
    const randomOther = nonTownsfolkPlayers[Math.floor(Math.random() * nonTownsfolkPlayers.length)]
    
    const selectedPlayers = [randomTownsfolk, randomOther].sort(() => Math.random() - 0.5)
    return `${selectedPlayers[0].number}，${selectedPlayers[1].number}出${randomTownsfolk.role.name}`
  } else {
    // 生成错误信息 - 只能选择村民角色
    const availablePlayers = players.filter(p => p.number !== washerwoman.number)
    const randomPlayer1 = availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
    const randomPlayer2 = availablePlayers.filter(p => p.number !== randomPlayer1.number)[Math.floor(Math.random() * (availablePlayers.length - 1))]
    const townsfolkRoles = Array.from(new Set(players.filter(p => p.role.type === 'townsfolk').map(p => p.role.name)))
    const randomTownsfolkRole = townsfolkRoles[Math.floor(Math.random() * townsfolkRoles.length)]
    return `${randomPlayer1.number}，${randomPlayer2.number}出${randomTownsfolkRole}`
  }
}

// 处理图书管理员的特殊信息
export const handleLibrarianInfo = (librarian: Player, players: Player[], isFalseInfo: boolean = false) => {
  const outsiderPlayers = players.filter(p => p.role.type === 'outsider')
  
  if (outsiderPlayers.length === 0 && !isFalseInfo) return '没有外来者'
  
  if (!isFalseInfo) {
    const randomOutsider = outsiderPlayers[Math.floor(Math.random() * outsiderPlayers.length)]
    const nonOutsiderPlayers = players.filter(p => 
      p.number !== librarian.number && 
      p.number !== randomOutsider.number
    )
    const randomOther = nonOutsiderPlayers[Math.floor(Math.random() * nonOutsiderPlayers.length)]
    
    const selectedPlayers = [randomOutsider, randomOther].sort(() => Math.random() - 0.5)
    return `${selectedPlayers[0].number}，${selectedPlayers[1].number}出${randomOutsider.role.name}`
  } else {
    // 生成错误信息 - 只能选择外来者角色
    const availablePlayers = players.filter(p => p.number !== librarian.number)
    const randomPlayer1 = availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
    const randomPlayer2 = availablePlayers.filter(p => p.number !== randomPlayer1.number)[Math.floor(Math.random() * (availablePlayers.length - 1))]
    const outsiderRoles = Array.from(new Set(players.filter(p => p.role.type === 'outsider').map(p => p.role.name)))
    const randomOutsiderRole = outsiderRoles[Math.floor(Math.random() * outsiderRoles.length)]
    return `${randomPlayer1.number}，${randomPlayer2.number}出${randomOutsiderRole}`
  }
}

// 处理调查员的特殊信息
export const handleInvestigatorInfo = (investigator: Player, players: Player[], isFalseInfo: boolean = false) => {
  const minionPlayers = players.filter(p => p.role.type === 'minion')
  
  if (minionPlayers.length === 0 && !isFalseInfo) return '没有爪牙'
  
  if (!isFalseInfo) {
    const randomMinion = minionPlayers[Math.floor(Math.random() * minionPlayers.length)]
    const nonMinionPlayers = players.filter(p => 
      p.number !== investigator.number && 
      p.number !== randomMinion.number
    )
    const randomOther = nonMinionPlayers[Math.floor(Math.random() * nonMinionPlayers.length)]
    
    const selectedPlayers = [randomMinion, randomOther].sort(() => Math.random() - 0.5)
    return `${selectedPlayers[0].number}，${selectedPlayers[1].number}出${randomMinion.role.name}`
  } else {
    // 生成错误信息 - 只能选择爪牙角色
    const availablePlayers = players.filter(p => p.number !== investigator.number)
    const randomPlayer1 = availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
    const randomPlayer2 = availablePlayers.filter(p => p.number !== randomPlayer1.number)[Math.floor(Math.random() * (availablePlayers.length - 1))]
    const minionRoles = Array.from(new Set(players.filter(p => p.role.type === 'minion').map(p => p.role.name)))
    const randomMinionRole = minionRoles[Math.floor(Math.random() * minionRoles.length)]
    return `${randomPlayer1.number}，${randomPlayer2.number}出${randomMinionRole}`
  }
}

// 处理厨师的特殊信息
export const handleChefInfo = (players: Player[], isFalseInfo: boolean = false) => {
  if (!isFalseInfo) {
    let evilPairs = 0
    const totalPlayers = players.length
    
    for (let i = 0; i < totalPlayers; i++) {
      const currentPlayer = players[i]
      const nextPlayer = players[(i + 1) % totalPlayers]
      
      const isCurrentEvil = currentPlayer.role.type === 'demon' || 
                           currentPlayer.role.type === 'minion' || 
                           currentPlayer.role.name === '隐士'
      const isNextEvil = nextPlayer.role.type === 'demon' || 
                        nextPlayer.role.type === 'minion' || 
                        nextPlayer.role.name === '隐士'
      
      if (isCurrentEvil && isNextEvil) {
        evilPairs++
      }
    }
    
    return `邪恶玩家(隐士?)相邻数量：${evilPairs}`
  } else {
    // 生成错误信息，权重偏向较小的数字
    const weights = [0.3, 0.3, 0.3, 0.1] // 对应 0,1,2,3 的概率
    const random = Math.random()
    let falseCount = 0
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i]
      if (random < sum) {
        falseCount = i
        break
      }
    }
    return `邪恶玩家(隐士?)相邻数量：${falseCount}`
  }
}

// 处理共情者的特殊信息
export const handleEmpathInfo = (empath: Player, players: Player[], isFalseInfo: boolean = false) => {
  const empathIndex = players.findIndex(p => p.number === empath.number)
  const totalPlayers = players.length
  
  let leftPlayer = null
  for (let i = 1; i <= totalPlayers; i++) {
    const index = (empathIndex - i + totalPlayers) % totalPlayers
    if (!players[index].isDead) {
      leftPlayer = players[index]
      break
    }
  }
  
  let rightPlayer = null
  for (let i = 1; i <= totalPlayers; i++) {
    const index = (empathIndex + i) % totalPlayers
    if (!players[index].isDead) {
      rightPlayer = players[index]
      break
    }
  }
  
  if (!isFalseInfo) {
    const evilCount = [leftPlayer, rightPlayer].filter(player => 
      player && (player.role.type === 'demon' || player.role.type === 'minion')
    ).length
    
    return `左边${leftPlayer?.number}号和右边${rightPlayer?.number}号中有${evilCount}个邪恶玩家`
  } else {
    // 生成错误信息
    const trueEvilCount = [leftPlayer, rightPlayer].filter(player => 
      player && (player.role.type === 'demon' || player.role.type === 'minion')
    ).length
    
    // 确保假信息与真实信息不同
    let falseCount
    do {
      falseCount = Math.floor(Math.random() * 3) // 0, 1, or 2
    } while (falseCount === trueEvilCount)
    
    return `左边${leftPlayer?.number}号和右边${rightPlayer?.number}号中有${falseCount}个邪恶玩家`
  }
}

// 处理恶魔的特殊信息
export const handleDemonInfo = (remainingRoles: string[], isFalseInfo: boolean = false) => {
  if (!isFalseInfo) {
    return `未使用善良角色：${remainingRoles.join('，')}`
  } else {
    // 生成错误信息 - 随机打乱角色顺序或替换一些角色
    const shuffledRoles = [...remainingRoles].sort(() => Math.random() - 0.5)
    return `未使用善良角色：${shuffledRoles.join('，')}`
  }
} 