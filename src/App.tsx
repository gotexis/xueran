import { useState, useEffect } from 'react'
import { Player, Role, PlayerCounts } from './types'
import { 
  playerCountData, 
  townsfolkRoles, 
  outsiderRoles, 
  minionRoles, 
  translations,
  FIRST_NIGHT_ORDER,
  OTHER_NIGHTS_ORDER 
} from './constants'
import { generateSpecialInfo } from './specialRoleInfoHandlers'

// 角色标签组件
const RoleTags = ({ 
  players, 
  excludedRoles, 
  onRoleClick 
}: { 
  players: Player[]; 
  excludedRoles: Set<string>;
  onRoleClick: (role: string) => void;
}) => {
  const activeRoles = new Set(players.map(p => p.role.name))
  
  const allRoles = [
    { type: 'townsfolk', roles: townsfolkRoles },
    { type: 'outsider', roles: outsiderRoles },
    { type: 'minion', roles: minionRoles },
    { type: 'demon', roles: ['小恶魔'] }
  ]

  return (
    <div className="mb-4 bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="flex flex-wrap gap-2">
        {allRoles.map(({ type, roles }) => (
          roles.map(role => (
            <span
              key={role}
              onClick={() => onRoleClick(role)}
              className={`px-2 py-1 rounded-full text-sm whitespace-nowrap cursor-pointer hover:opacity-80 ${
                excludedRoles.has(role) ? 'opacity-50 ' : '' }${
                activeRoles.has(role)
                  ? type === 'townsfolk' ? 'bg-blue-900 text-blue-200' :
                    type === 'outsider' ? 'bg-green-900 text-green-200' :
                    type === 'minion' ? 'bg-red-900 text-red-200' :
                    'bg-purple-900 text-purple-200'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {role}
            </span>
          ))
        ))}
      </div>
    </div>
  )
}

// 被排除的角色标签组件
const ExcludedRoleTags = ({ 
  excludedRoles,
  onRoleClick 
}: { 
  excludedRoles: Set<string>;
  onRoleClick: (role: string) => void;
}) => {
  if (excludedRoles.size === 0) return null;

  const excludedRolesList = Array.from(excludedRoles);
  
  return (
    <div className="mb-4 bg-gray-100 rounded-lg p-4 shadow-md border border-gray-200">
      <h3 className="text-sm text-gray-600 mb-2">已排除的角色</h3>
      <div className="flex flex-wrap gap-2">
        {excludedRolesList.map(role => (
          <span
            key={role}
            onClick={() => onRoleClick(role)}
            className="px-2 py-1 rounded-full text-sm whitespace-nowrap cursor-pointer bg-gray-300 text-gray-600 hover:opacity-80"
          >
            {role}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [counts, setCounts] = useState<PlayerCounts>(() => {
    const saved = localStorage.getItem('bloodOnTheClock_counts')
    return saved ? JSON.parse(saved) : {
      townsfolk: 3,
      outsider: 0,
      minion: 1,
      demon: 1
    }
  })
  
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('bloodOnTheClock_players')
    return saved ? JSON.parse(saved) : []
  })

  const [excludedRoles, setExcludedRoles] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('bloodOnTheClock_excludedRoles')
    return new Set(saved ? JSON.parse(saved) : ['小精灵', '变态'])
  })

  const [showPlayerView, setShowPlayerView] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)
  const [sortType, setSortType] = useState<'id' | 'firstNight' | 'otherNights'>('id')
  const [showSpecialInfo, setShowSpecialInfo] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null)
  const [poisonedPlayer, setPoisonedPlayer] = useState<number | null>(() => {
    const saved = localStorage.getItem('bloodOnTheClock_poisonedPlayer')
    return saved ? JSON.parse(saved) : null
  })
  const [infoModalPlayer, setInfoModalPlayer] = useState<number | null>(null)
  const [tempSpecialInfo, setTempSpecialInfo] = useState<string>('')

  // 保存状态到localStorage
  useEffect(() => {
    localStorage.setItem('bloodOnTheClock_counts', JSON.stringify(counts))
  }, [counts])

  useEffect(() => {
    localStorage.setItem('bloodOnTheClock_players', JSON.stringify(players))
  }, [players])

  useEffect(() => {
    localStorage.setItem('bloodOnTheClock_excludedRoles', JSON.stringify(Array.from(excludedRoles)))
  }, [excludedRoles])

  useEffect(() => {
    localStorage.setItem('bloodOnTheClock_poisonedPlayer', JSON.stringify(poisonedPlayer))
  }, [poisonedPlayer])

  // 重置游戏状态
  const resetGame = () => {
    if (!window.confirm('确定要重置游戏吗？这将清除所有游戏数据。')) {
      return
    }
    setCounts({
      townsfolk: 3,
      outsider: 0,
      minion: 1,
      demon: 1
    })
    setPlayers([])
    setExcludedRoles(new Set(['小精灵', '变态']))
    setPoisonedPlayer(null)
    setShowPlayerView(false)
    setSelectedPlayer(null)
    setSortType('id')
    setShowSpecialInfo(false)
    setActiveTooltip(null)
    setInfoModalPlayer(null)
    setTempSpecialInfo('')
    
    // 清除localStorage
    localStorage.removeItem('bloodOnTheClock_counts')
    localStorage.removeItem('bloodOnTheClock_players')
    localStorage.removeItem('bloodOnTheClock_excludedRoles')
    localStorage.removeItem('bloodOnTheClock_poisonedPlayer')
  }

  // 从预设中选择玩家数量
  const handlePresetSelect = (totalPlayers: number) => {
    const preset = playerCountData.find(data => data[0] === totalPlayers)
    if (preset) {
      setCounts({
        townsfolk: preset[1],
        outsider: preset[2],
        minion: preset[3],
        demon: preset[4]
      })
    }
  }

  // 处理角色点击
  const handleRoleClick = (roleName: string) => {
    setExcludedRoles(prev => {
      const newExcluded = new Set(prev);
      if (newExcluded.has(roleName)) {
        newExcluded.delete(roleName);
      } else {
        newExcluded.add(roleName);
      }
      return newExcluded;
    });
  }

  // 修改随机选择角色的逻辑
  const createGame = () => {
    // 过滤掉被排除的角色
    const availableTownsfolk = townsfolkRoles.filter(role => !excludedRoles.has(role))
    const availableOutsiders = outsiderRoles.filter(role => !excludedRoles.has(role))
    const availableMinions = minionRoles.filter(role => !excludedRoles.has(role))
    const isDemonExcluded = excludedRoles.has('小恶魔')

    if (
      availableTownsfolk.length < counts.townsfolk ||
      availableOutsiders.length < counts.outsider ||
      availableMinions.length < counts.minion ||
      isDemonExcluded
    ) {
      alert('可用角色不足，请减少排除的角色数量或调整玩家配置')
      return
    }

    // 随机选择村民
    const shuffledVillagers = [...availableTownsfolk]
      .sort(() => Math.random() - 0.5)
      .slice(0, counts.townsfolk)
      .map(name => ({ name, type: 'townsfolk' as const }))
    
    // 随机选择外来者
    const shuffledOutsiders = [...availableOutsiders]
      .sort(() => Math.random() - 0.5)
      .slice(0, counts.outsider)
      .map(name => ({ name, type: 'outsider' as const }))
    
    // 随机选择爪牙
    const shuffledMinions = [...availableMinions]
      .sort(() => Math.random() - 0.5)
      .slice(0, counts.minion)
      .map(name => ({ name, type: 'minion' as const }))
    
    // 恶魔固定为小恶魔
    const demon = { name: '小恶魔', type: 'demon' as const }
    
    let selectedRoles: Role[] = [...shuffledVillagers, ...shuffledOutsiders, ...shuffledMinions, demon]
    
    // 处理男爵特殊规则
    if (selectedRoles.some(role => role.name === '男爵')) {
      const villagerIndices = selectedRoles
        .map((role, index) => role.type === 'townsfolk' ? index : -1)
        .filter(index => index !== -1)
      
      // 获取未使用的外来者
      const unusedOutsiders = outsiderRoles
        .filter(name => !selectedRoles.some(role => role.name === name))
      
      // 随机选择两个村民转换为外来者
      for (let i = 0; i < 2 && villagerIndices.length > 0 && unusedOutsiders.length > 0; i++) {
        const randomVillagerIndex = Math.floor(Math.random() * villagerIndices.length)
        const villagerIndex = villagerIndices[randomVillagerIndex]
        
        const randomOutsiderIndex = Math.floor(Math.random() * unusedOutsiders.length)
        const newOutsider = unusedOutsiders[randomOutsiderIndex]
        
        selectedRoles[villagerIndex] = { name: newOutsider, type: 'outsider' }
        
        // 从可选列表中移除已使用的选项
        villagerIndices.splice(randomVillagerIndex, 1)
        unusedOutsiders.splice(randomOutsiderIndex, 1)
      }
    }
    
    // 打乱角色顺序
    selectedRoles.sort(() => Math.random() - 0.5)
    
    // 创建玩家数组
    const newPlayers: Player[] = selectedRoles.map((role, index) => ({
      number: index + 1,
      role,
      isDead: false
    }))
    
    // 修改酒鬼处理逻辑
    const drunkPlayer = newPlayers.find(player => player.role.name === '酒鬼')
    if (drunkPlayer) {
      const unusedVillagers = townsfolkRoles
        .filter(name => 
          !selectedRoles.some(role => role.name === name) && 
          !excludedRoles.has(name) &&
          name !== '酒鬼'
        )
      if (unusedVillagers.length > 0) {
        const randomVillager = unusedVillagers[Math.floor(Math.random() * unusedVillagers.length)]
        drunkPlayer.drunkRole = { name: randomVillager, type: 'townsfolk' }
        
        // 为酒鬼生成其"以为自己是"的角色对应的特殊信息
        drunkPlayer.specialInfo = generateSpecialInfo(
          { ...drunkPlayer, role: drunkPlayer.drunkRole },
          newPlayers,
          undefined,
          true
        )
      }
    }
    
    // 在创建完 selectedRoles 后，找出未使用的村民和外来者角色
    const usedRoles = new Set(selectedRoles.map(role => role.name))
    const remainingRoles = [...townsfolkRoles, ...outsiderRoles]
      .filter(role => 
        !usedRoles.has(role) && 
        !excludedRoles.has(role) &&
        role !== '小精灵' && 
        role !== '酒鬼'
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3) // 随机选择3个未使用的角色
    
    // 在设置 setPlayers 之前，随机选择一个好人作为"柱子"
    const goodPlayers = newPlayers.filter(p => 
      p.role.type === 'townsfolk' || p.role.type === 'outsider'
    )
    
    if (goodPlayers.length > 0) {
      const pillarPlayer = goodPlayers[Math.floor(Math.random() * goodPlayers.length)]
      pillarPlayer.isPillar = true // 标记为"柱子"
    }

    setPlayers(newPlayers)
    
    // 为所有有特殊信息的角色生成信息
    newPlayers.forEach(player => {
      if (player.role.name !== '酒鬼') { // 酒鬼已经处理过了
        player.specialInfo = generateSpecialInfo(
          player,
          newPlayers,
          player.role.name === '小恶魔' ? remainingRoles : undefined,
          poisonedPlayer === player.number
        )
      }
    })
  }

  const updateEmpathInfo = (empath: Player, playersList: Player[], isFalseInfo: boolean = false) => {
    empath.specialInfo = generateSpecialInfo(empath, playersList, undefined, isFalseInfo)
  }

  // 修改死亡状态变更的处理函数
  const handlePlayerDeathChange = (player: Player) => {
    const newPlayers = [...players]
    const playerIndex = newPlayers.findIndex(p => p.number === player.number)
    newPlayers[playerIndex] = {...player, isDead: !player.isDead}
    
    // 更新共情者信息
    const empath = newPlayers.find(p => p.role.name === '共情者')
    if (empath) {
      updateEmpathInfo(empath, newPlayers, poisonedPlayer === empath.number)
    }
    
    setPlayers(newPlayers)
  }

  // 添加排序函数
  const getSortedPlayers = () => {
    const sortedPlayers = [...players]
    
    if (sortType === 'id') {
      return sortedPlayers.sort((a, b) => a.number - b.number)
    }
    
    const orderList = sortType === 'firstNight' ? FIRST_NIGHT_ORDER : OTHER_NIGHTS_ORDER
    
    return sortedPlayers.sort((a, b) => {
      // 特殊处理爪牙和恶魔在第一夜的顺序
      if (sortType === 'firstNight') {
        if (a.role.type === 'minion' && b.role.type !== 'minion') return -1
        if (a.role.type !== 'minion' && b.role.type === 'minion') return 1
        if (a.role.type === 'demon' && b.role.type !== 'demon') return -2
        if (a.role.type !== 'demon' && b.role.type === 'demon') return 2
      }
      
      const aIndex = orderList.indexOf(a.role.name)
      const bIndex = orderList.indexOf(b.role.name)
      
      // 如果角色不在行动顺序中，排到最后
      if (aIndex === -1 && bIndex === -1) return a.number - b.number
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      
      return aIndex - bIndex
    })
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeTooltip !== null && !(event.target as Element).closest('.tooltip-trigger')) {
        setActiveTooltip(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeTooltip])

  const handlePoisonToggle = (playerNumber: number) => {
    // 找到对应的玩家
    const player = players.find(p => p.number === playerNumber)
    
    // 如果是邪恶阵营(爪牙或恶魔)，不允许中毒
    if (player && (player.role.type === 'minion' || player.role.type === 'demon')) {
      return
    }
    
    const newPoisonedPlayer = poisonedPlayer === playerNumber ? null : playerNumber
    setPoisonedPlayer(newPoisonedPlayer)

    // 创建新的玩家数组
    const newPlayers = [...players]
    const targetPlayer = newPlayers.find(p => p.number === playerNumber)
    
    if (targetPlayer) {
      // 只重新生成目标玩家的特殊信息
      if (targetPlayer.role.name === '酒鬼' && targetPlayer.drunkRole) {
        targetPlayer.specialInfo = generateSpecialInfo(
          { ...targetPlayer, role: targetPlayer.drunkRole },
          newPlayers,
          undefined,
          true // 酒鬼永远获得错误信息
        )
      } else {
        targetPlayer.specialInfo = generateSpecialInfo(
          targetPlayer,
          newPlayers,
          targetPlayer.role.name === '小恶魔' ? 
            [...townsfolkRoles, ...outsiderRoles]
              .filter(role => 
                !players.some(player => player.role.name === role) && 
                !excludedRoles.has(role) &&
                role !== '小精灵' && 
                role !== '酒鬼'
              )
              .sort(() => Math.random() - 0.5)
              .slice(0, 3) 
            : undefined,
          newPoisonedPlayer === targetPlayer.number
        )
      }
    }

    setPlayers(newPlayers)
  }

  const handleInfoModalOpen = (player: Player) => {
    setInfoModalPlayer(player.number)
    
    let info = player.specialInfo || ''
    
    setTempSpecialInfo(info)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6 bg-white rounded-lg p-4 shadow-md border border-gray-200 ">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl text-white px-2 bg-gradient-to-r from-blue-500 to-purple-500">
              Exis的血染-暗流涌动DM工具箱
            </h1>
            {players.length > 0 && (
              <button
                onClick={resetGame}
                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 rounded transition-colors text-white shadow-md text-sm"
              >
                重置游戏
              </button>
            )}
          </div>

          {/* 只在非玩家视图且有玩家时显示角色标签 */}
          {!showPlayerView && players.length > 0 && (
            <>
              <RoleTags players={players} excludedRoles={excludedRoles} onRoleClick={handleRoleClick} />
              <ExcludedRoleTags excludedRoles={excludedRoles} onRoleClick={handleRoleClick} />
            </>
          )}

          <div className="flex flex-wrap items-center gap-4 justify-center mb-4">
            {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map(type => (
              <div key={type} className="flex-shrink-0">
                <div className="relative flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    {translations[type]}
                  </span>
                  <input
                    type="number" 
                    value={counts[type]} 
                    disabled={type === 'demon'}
                    onChange={e => setCounts({...counts, [type]: parseInt(e.target.value) || 0})}
                    className="rounded-r-md block w-16 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                  />
                </div>
              </div>
            ))}

            <div className="flex-shrink-0">
              <select
                onChange={(e) => handlePresetSelect(parseInt(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">选择玩家数量</option>
                {playerCountData.map(([total]) => (
                  <option key={total} value={total}>{total}人局</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <button 
              onClick={createGame}
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded transition-colors text-white shadow-md text-sm"
            >
              创建游戏
            </button>

            {players.length > 0 && (
              <button 
                onClick={() => setShowPlayerView(true)}
                className="px-4 py-1.5 bg-green-500 hover:bg-green-600 rounded transition-colors text-white shadow-md text-sm"
              >
                进入玩家视图
              </button>
            )}
          </div>
        </div>

        {showPlayerView && players.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full m-4">
              <h2 className="text-xl font-bold mb-4 text-center">选择你的座位号</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                {players.map(player => (
                  <button
                    key={player.number}
                    onClick={() => setSelectedPlayer(player.number)}
                    className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200"
                  >
                    {player.number}号
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPlayerView(false)}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                关闭玩家视图
              </button>
            </div>
          </div>
        )}

        {selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full m-4">
              {(() => {
                const player = players.find(p => p.number === selectedPlayer)
                if (!player) return null
                
                const displayRole = player.role.name === '酒鬼' && player.drunkRole
                  ? player.drunkRole.name
                  : player.role.name

                const isEvil = player.role.type === 'minion' || player.role.type === 'demon'
                const evilTeammates = isEvil ? players.filter(p => 
                  (p.role.type === 'minion' || p.role.type === 'demon') && 
                  p.number !== player.number
                ) : []

                return (
                  <>
                    <h2 className="text-xl font-bold mb-4 text-center">{selectedPlayer}号玩家的角色</h2>
                    <div className="text-center mb-4">
                      <p className="text-2xl mb-2">{displayRole}</p>
                      <p className="text-lg text-gray-600 mb-4">
                        {translations[player.role.name === '酒鬼' ? 'townsfolk' : player.role.type]}
                      </p>
                      
                      {/* 只对坏人显示特殊信息 */}
                      {isEvil && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                          {/* 显示玩家自己的特殊信息 */}
                          {player.specialInfo && (
                            <div className="mb-4">
                              <h3 className="font-bold mb-2">你的特殊信息：</h3>
                              <p>{player.specialInfo}</p>
                            </div>
                          )}
                          
                          {/* 如果是爪牙，显示恶魔的特殊信息 */}
                          {player.role.type === 'minion' && (
                            <div className="mb-4">
                              <h3 className="font-bold mb-2">恶魔的特殊信息：</h3>
                              <p>{players.find(p => p.role.type === 'demon')?.specialInfo || '无'}</p>
                            </div>
                          )}
                          
                          {/* 显示邪恶阵营信息 */}
                          {evilTeammates.length > 0 && (
                            <div>
                              <h3 className="font-bold mb-2">你的邪恶队友：</h3>
                              <ul className="list-disc list-inside">
                                {evilTeammates.map(teammate => (
                                  <li key={teammate.number}>
                                    {teammate.number}号 - {teammate.role.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      关闭
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {!showPlayerView && players.length > 0 && (
          <>
            <div className="mb-4 flex justify-between items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <div className="flex space-x-2">
                {[
                  { value: 'id', label: '按座位号排序' },
                  { value: 'firstNight', label: '首夜行动顺序' },
                  { value: 'otherNights', label: 'night行动顺序' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortType(option.value as 'id' | 'firstNight' | 'otherNights')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      sortType === option.value
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">显示特殊信息</span>
                <button
                  onClick={() => setShowSpecialInfo(!showSpecialInfo)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSpecialInfo ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSpecialInfo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className={`overflow-x-auto rounded-lg border border-gray-200 ${infoModalPlayer ? 'hidden' : ''}`}>
              <table className="w-full border-collapse bg-white relative">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 border-b border-gray-200">序号</th>
                    <th className="px-4 py-2 border-b border-gray-200">角色</th>
                    <th className="px-4 py-2 border-b border-gray-200">阵营</th>
                    {showSpecialInfo && (
                      <th className="px-4 py-2 border-b border-gray-200">特殊信息</th>
                    )}
                    <th className="px-4 py-2 border-b border-gray-200 w-16">死亡</th>
                    <th className="px-4 py-2 border-b border-gray-200 w-16">中毒</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedPlayers().map(player => {
                    const isInActionOrder = sortType === 'id' || (
                      sortType === 'firstNight' 
                        ? FIRST_NIGHT_ORDER.includes(player.role.name)
                        : OTHER_NIGHTS_ORDER.includes(player.role.name)
                    )
                    
                    return (
                      <tr 
                        key={player.number} 
                        className={`hover:bg-gray-50 border-b border-gray-200 ${
                          player.isDead ? 'opacity-50' : ''
                        } ${!isInActionOrder ? 'opacity-40' : ''}`}
                      >
                        <td 
                          className="px-4 py-1.5 text-center cursor-pointer relative"
                          onClick={() => handleInfoModalOpen(player)}
                        >
                          <div className={`inline-block ${player.specialInfo ? 'border-b-2 border-dotted border-blue-500' : ''}`}>
                            {player.number}
                          </div>
                        </td>
                        <td className="px-4 py-1.5 text-center whitespace-nowrap relative">
                          <div 
                            className={`inline-flex items-center justify-center ${
                              player.specialInfo ? 'border-b-2 border-dotted border-blue-500 hover:border-blue-700 cursor-pointer' : ''
                            }`}
                            onClick={() => player.specialInfo && setActiveTooltip(activeTooltip === player.number ? null : player.number)}
                          >
                            {player.role.name}
                            {player.drunkRole && ` (以为是${player.drunkRole.name})`}
                            {player.isPillar && ' (柱子)'}
                          </div>
                          {activeTooltip === player.number && player.specialInfo && (
                            <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] left-1/2 transform -translate-x-1/2 mt-1"
                              style={{
                                bottom: 'calc(100% + 5px)',
                                marginBottom: '5px'
                              }}
                            >
                              {player.specialInfo}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-1.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-sm whitespace-nowrap ${
                            player.role.type === 'townsfolk' ? 'bg-blue-900 text-blue-200' :
                            player.role.type === 'outsider' ? 'bg-green-900 text-green-200' :
                            player.role.type === 'minion' ? 'bg-red-900 text-red-200' :
                            'bg-purple-900 text-purple-200'
                          }`}>
                            {translations[player.role.type]}
                          </span>
                        </td>
                        {showSpecialInfo && (
                          <td className="px-4 py-1.5 text-center">
                            <div className="text-sm whitespace-nowrap">
                              {player.specialInfo || '-'}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-1.5 text-center">
                          <button
                            onClick={() => handlePlayerDeathChange(player)}
                            className={`w-6 h-6 rounded-full border-2 inline-flex items-center justify-center transition-colors text-lg leading-none ${
                              player.isDead 
                                ? 'border-red-500 text-red-500 bg-red-50' 
                                : 'border-gray-300 text-gray-300 hover:border-red-500 hover:text-red-500'
                            }`}
                          >
                            {player.isDead ? '×' : ''}
                          </button>
                        </td>
                        <td className="px-4 py-1.5 text-center">
                          {player.role.type !== 'minion' && player.role.type !== 'demon' && (
                            <button
                              onClick={() => handlePoisonToggle(player.number)}
                              className={`w-6 h-6 rounded-full border-2 inline-flex items-center justify-center transition-colors ${
                                poisonedPlayer === player.number
                                  ? 'border-purple-500 text-purple-500 bg-purple-50'
                                  : 'border-gray-300 text-gray-300 hover:border-purple-500 hover:text-purple-500'
                              }`}
                            >
                              {poisonedPlayer === player.number ? '☠️' : ''}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map(type => {
              const total = players.filter(p => p.role.type === type).length
              const alive = players.filter(p => p.role.type === type && !p.isDead).length
              return (
                <div 
                  key={type}
                  className={`p-4 rounded-lg border ${
                    type === 'townsfolk' ? 'bg-blue-900/50 border-blue-700' :
                    type === 'outsider' ? 'bg-green-900/50 border-green-700' :
                    type === 'minion' ? 'bg-red-900/50 border-red-700' :
                    'bg-purple-900/50 border-purple-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold mb-1">{translations[type]}</div>
                    <div className="text-sm">
                      存活: {alive} / {total}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {infoModalPlayer && (
        <>
          <div className="fixed inset-0 bg-black z-40" />
          
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full m-4 relative">
              {(() => {
                const player = players.find(p => p.number === infoModalPlayer)
                if (!player) return null
                
                const displayRole = player.role.name === '酒鬼' && player.drunkRole
                  ? player.drunkRole.name
                  : player.role.name

                return (
                  <>
                    <h2 className="text-xl font-bold mb-4 text-center">{infoModalPlayer}号玩家信息</h2>
                    <div className="text-center mb-4">
                      <p className="text-2xl mb-2">{displayRole}</p>
                      <p className="text-lg text-gray-600 mb-4">
                        {translations[player.role.name === '酒鬼' ? 'townsfolk' : player.role.type]}
                      </p>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          特殊信息 (DM需要考虑中毒 / 醉酒)
                        </label>
                        <textarea
                          value={tempSpecialInfo}
                          onChange={(e) => setTempSpecialInfo(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
                          placeholder="输入特殊信息..."
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setInfoModalPlayer(null)}
                        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        关闭
                      </button>
                      <button
                        onClick={() => setTempSpecialInfo('')}
                        className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-red-600"
                      >
                        清空
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </>
      )}
    </div>
    </div>
  )
}

