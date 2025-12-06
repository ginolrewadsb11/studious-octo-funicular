import { useState, useEffect, useMemo } from 'react'

const DATA_URL = 'https://raw.githubusercontent.com/ginolrewadsb11/studious-umbrella/main/vpn_report.json'
const SUBSCRIPTION_URL = 'https://raw.githubusercontent.com/ginolrewadsb11/studious-umbrella/main/bobi_vpn.txt'

const PROTOCOL_COLORS = {
  VLESS: { bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', text: 'text-cyan-300' },
  VMess: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-300' },
  Trojan: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300' },
  SS: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300' },
  Hysteria2: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
}

const QUICK_FILTERS = ['🇷🇺 RU', '🇩🇪 DE', '🇳🇱 NL', '🇺🇸 US', '🇫🇮 FI', '🇬🇧 GB']

// Fallback флаг для неизвестных стран
const UNKNOWN_FLAG = '/unknown-flag.png'

// Функция для получения флага по коду страны (используем flagcdn.com)
const getFlag = (code) => {
  if (!code) return UNKNOWN_FLAG
  const lowerCode = code.toLowerCase()
  return `https://flagcdn.com/48x36/${lowerCode}.png`
}

// Emoji флаги как fallback
const COUNTRY_FLAGS = {
  "RU": "🇷🇺", "DE": "🇩🇪", "NL": "🇳🇱", "US": "🇺🇸", "GB": "🇬🇧",
  "FR": "🇫🇷", "FI": "🇫🇮", "SE": "🇸🇪", "NO": "🇳🇴", "PL": "🇵🇱",
  "UA": "🇺🇦", "KZ": "🇰🇿", "BY": "🇧🇾", "LT": "🇱🇹", "LV": "🇱🇻",
  "EE": "🇪🇪", "CZ": "🇨🇿", "AT": "🇦🇹", "CH": "🇨🇭", "IT": "🇮🇹",
  "ES": "🇪🇸", "PT": "🇵🇹", "GR": "🇬🇷", "TR": "🇹🇷", "IL": "🇮🇱",
  "AE": "🇦🇪", "SG": "🇸🇬", "JP": "🇯🇵", "KR": "🇰🇷", "HK": "🇭🇰",
  "TW": "🇹🇼", "AU": "🇦🇺", "CA": "🇨🇦", "BR": "🇧🇷", "IN": "🇮🇳",
  "AM": "🇦🇲", "GE": "🇬🇪", "MD": "🇲🇩", "RO": "🇷🇴", "BG": "🇧🇬",
  "HU": "🇭🇺", "SK": "🇸🇰", "RS": "🇷🇸", "HR": "🇭🇷", "SI": "🇸🇮",
  "IE": "🇮🇪", "BE": "🇧🇪", "LU": "🇱🇺", "DK": "🇩🇰", "IS": "🇮🇸",
}

// Компонент флага с fallback на emoji
const FlagIcon = ({ code, size = 'normal' }) => {
  const sizeClass = size === 'large' ? 'w-12 h-9' : 'w-6 h-4'
  const flagUrl = getFlag(code)
  const emoji = COUNTRY_FLAGS[code] || '🌍'
  
  if (!code) return <span className={size === 'large' ? 'text-4xl' : 'text-xl'}>{emoji}</span>
  
  return (
    <img 
      src={flagUrl} 
      alt={code}
      className={`${sizeClass} object-cover rounded-sm`}
      onError={(e) => {
        e.target.style.display = 'none'
        e.target.nextSibling.style.display = 'inline'
      }}
    />
  )
}

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState('RU')
  const [protocolFilter, setProtocolFilter] = useState('')
  const [ispFilter, setIspFilter] = useState('')
  const [sortBy, setSortBy] = useState('country')
  
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showProtocolDropdown, setShowProtocolDropdown] = useState(false)
  const [showIspDropdown, setShowIspDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Modal state
  const [selectedKey, setSelectedKey] = useState(null)
  const [pingResult, setPingResult] = useState(null)
  const [isPinging, setIsPinging] = useState(false)

  useEffect(() => {
    fetch(DATA_URL)
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const getProtocol = (key) => {
    if (key.startsWith('vless://')) return 'VLESS'
    if (key.startsWith('vmess://')) return 'VMess'
    if (key.startsWith('trojan://')) return 'Trojan'
    if (key.startsWith('ss://')) return 'SS'
    if (key.startsWith('hysteria2://') || key.startsWith('hy2://')) return 'Hysteria2'
    return 'Unknown'
  }

  const countries = useMemo(() => {
    if (!data?.keys) return []
    const unique = [...new Set(data.keys.map(k => k.country_code))].filter(Boolean)
    return unique.sort()
  }, [data])

  const isps = useMemo(() => {
    if (!data?.keys) return []
    const unique = [...new Set(data.keys.map(k => k.isp))].filter(Boolean)
    return unique.sort()
  }, [data])

  const protocols = useMemo(() => {
    if (!data?.keys) return []
    const unique = [...new Set(data.keys.map(k => getProtocol(k.key)))]
    return unique.sort()
  }, [data])

  const filteredKeys = useMemo(() => {
    if (!data?.keys) return []
    
    let result = data.keys.filter(k => {
      if (countryFilter && k.country_code !== countryFilter) return false
      if (protocolFilter && getProtocol(k.key) !== protocolFilter) return false
      if (ispFilter && k.isp !== ispFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const searchable = `${k.country} ${k.isp} ${k.name} ${k.exit_ip} ${k.country_code}`.toLowerCase()
        if (!searchable.includes(q)) return false
      }
      return true
    })

    result.sort((a, b) => {
      switch (sortBy) {
        case 'latency': return a.latency_ms - b.latency_ms
        case 'speed': return b.speed_kbps - a.speed_kbps
        case 'country': return (a.country || '').localeCompare(b.country || '')
        case 'isp': return (a.isp || '').localeCompare(b.isp || '')
        default: return 0
      }
    })

    return result
  }, [data, countryFilter, protocolFilter, ispFilter, searchQuery, sortBy])

  const copyToClipboard = async (text, message = 'Скопировано!') => {
    try {
      await navigator.clipboard.writeText(text)
      setToast(message)
      setTimeout(() => setToast(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleQuickFilter = (filter) => {
    const code = filter.split(' ')[1]
    setCountryFilter(countryFilter === code ? '' : code)
  }

  const closeAllDropdowns = () => {
    setShowCountryDropdown(false)
    setShowProtocolDropdown(false)
    setShowIspDropdown(false)
    setShowSortDropdown(false)
  }

  // Извлечь хост и порт из VPN ключа
  const parseVpnKey = (key) => {
    try {
      if (key.startsWith('vmess://')) {
        const decoded = JSON.parse(atob(key.replace('vmess://', '')))
        return { host: decoded.add, port: decoded.port }
      }
      // vless, trojan, ss, hy2
      const url = new URL(key)
      return { host: url.hostname, port: url.port || 443 }
    } catch {
      return null
    }
  }

  // Пинг сервера (через fetch timing)
  const pingServer = async (keyData) => {
    setIsPinging(true)
    setPingResult(null)
    
    const parsed = parseVpnKey(keyData.key)
    if (!parsed) {
      setPingResult({ error: 'Не удалось распарсить ключ' })
      setIsPinging(false)
      return
    }

    // Используем несколько попыток для более точного результата
    const pings = []
    for (let i = 0; i < 3; i++) {
      const start = performance.now()
      try {
        // Пробуем подключиться к серверу через fetch (CORS может блокировать, но timing всё равно работает)
        await fetch(`https://${parsed.host}:${parsed.port}`, { 
          mode: 'no-cors',
          cache: 'no-store',
          signal: AbortSignal.timeout(5000)
        })
      } catch {}
      const end = performance.now()
      pings.push(Math.round(end - start))
      await new Promise(r => setTimeout(r, 100))
    }

    const avgPing = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length)
    const minPing = Math.min(...pings)
    const maxPing = Math.max(...pings)

    setPingResult({ avg: avgPing, min: minPing, max: maxPing, host: parsed.host, port: parsed.port })
    setIsPinging(false)
  }

  const openKeyModal = (key) => {
    setSelectedKey(key)
    setPingResult(null)
  }

  const closeModal = () => {
    setSelectedKey(null)
    setPingResult(null)
    setIsPinging(false)
  }

  if (loading) {
    return (
      <div className="font-display relative flex min-h-screen w-full flex-col bg-[#121629] bg-gradient-to-br from-[#23153C] to-[#121629] text-white">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full spinner mx-auto mb-4"></div>
            <p className="text-slate-400">Загрузка VPN ключей...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="font-display relative flex min-h-screen w-full flex-col bg-[#121629] bg-gradient-to-br from-[#23153C] to-[#121629] text-white">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">😔</p>
            <p className="text-white text-lg">Ошибка загрузки</p>
            <p className="text-slate-400">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="font-display relative flex min-h-screen w-full flex-col bg-[#121629] bg-gradient-to-br from-[#23153C] to-[#121629] text-white overflow-x-hidden" onClick={closeAllDropdowns}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 py-5 sm:px-8 md:px-12 lg:px-20 xl:px-40 flex flex-1 justify-center">
          <div className="layout-content-container flex flex-col w-full max-w-[1440px] flex-1">
            
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 p-4">
              <div className="flex flex-col gap-2">
                <p className="text-4xl font-black tracking-tighter sm:text-5xl">🐶 BobiVPN</p>
                <p className="text-base font-normal text-slate-400">Автоматически проверенные VPN ключи</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
              <div className="flex flex-col gap-2 rounded-lg p-6 border border-white/10 bg-black/20 backdrop-blur-md shadow-[0_0_20px_rgba(148,0,211,0.2)]">
                <p className="text-base font-medium text-slate-300">ключей</p>
                <p className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent text-5xl font-bold">{data?.working_count || 0}</p>
              </div>
              <div className="flex flex-col gap-2 rounded-lg p-6 border border-white/10 bg-black/20 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                <p className="text-base font-medium text-slate-300">стран</p>
                <p className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent text-5xl font-bold">{Object.keys(data?.countries || {}).length}</p>
              </div>
              <div className="flex flex-col gap-2 rounded-lg p-6 border border-white/10 bg-black/20 backdrop-blur-md shadow-[0_0_20px_rgba(255,0,255,0.2)]">
                <p className="text-base font-medium text-slate-300">Обновлено</p>
                <p className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent text-5xl font-bold">{data?.timestamp?.split(' ')[1] || '—'}</p>
              </div>
            </div>

            {/* Subscription Box */}
            <div className="p-4">
              <div className="flex flex-col items-stretch justify-start rounded-lg border border-cyan-400/30 bg-black/30 backdrop-blur-md shadow-[0_0_30px_rgba(0,255,255,0.2)] p-6 gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-cyan-400 text-2xl">download</span>
                  <p className="text-white text-lg font-bold">Ссылка на подписку</p>
                </div>
                <p className="text-slate-400 text-base">Добавь в Happ, v2rayNG или Hiddify</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <input 
                    className="font-mono flex-grow rounded-md border border-white/10 bg-black/20 px-4 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" 
                    readOnly 
                    type="text" 
                    value={SUBSCRIPTION_URL}
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(SUBSCRIPTION_URL, 'Ссылка скопирована!') }}
                    className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-10 px-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-sm font-medium transition-all hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-lg">content_copy</span>
                    <span className="truncate">Скопировать ссылку</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 p-4">
              {/* Search + Filters Row */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch">
                {/* Search - компактнее */}
                <div className="flex items-center rounded-xl h-10 border border-white/10 bg-black/20 backdrop-blur-md px-3 md:w-64">
                  <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                  <input 
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500 px-2" 
                    placeholder="Поиск..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 flex-wrap md:flex-nowrap">
                  {/* Country */}
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowCountryDropdown(!showCountryDropdown); setShowProtocolDropdown(false); setShowIspDropdown(false); setShowSortDropdown(false) }}
                      className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-all ${
                        countryFilter 
                          ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300' 
                          : 'bg-black/20 border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {countryFilter && <img src={getFlag(countryFilter)} alt="" className="w-5 h-3.5 rounded-sm object-cover" />}
                      <span>{countryFilter ? (data?.countries?.[countryFilter]?.name || countryFilter) : 'Страна'}</span>
                      <span className="material-symbols-outlined text-lg">expand_more</span>
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute top-12 left-0 z-50 bg-[#1e1e32] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto min-w-[180px] py-1">
                        <button onClick={() => { setCountryFilter(''); setShowCountryDropdown(false) }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 flex items-center gap-2">
                          <span className="w-5 text-center">🌍</span> Все страны
                        </button>
                        {countries.map(code => (
                          <button key={code} onClick={() => { setCountryFilter(code); setShowCountryDropdown(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 flex items-center gap-2 ${countryFilter === code ? 'text-cyan-300 bg-cyan-400/10' : 'text-slate-300'}`}>
                            <img src={getFlag(code)} alt="" className="w-5 h-3.5 rounded-sm object-cover" onError={(e) => e.target.src = UNKNOWN_FLAG} />
                            {data?.countries?.[code]?.name || code}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Protocol */}
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowProtocolDropdown(!showProtocolDropdown); setShowCountryDropdown(false); setShowIspDropdown(false); setShowSortDropdown(false) }}
                      className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-all ${
                        protocolFilter 
                          ? 'bg-purple-400/10 border-purple-400/30 text-purple-300' 
                          : 'bg-black/20 border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span>{protocolFilter || 'Протокол'}</span>
                      <span className="material-symbols-outlined text-lg">expand_more</span>
                    </button>
                    {showProtocolDropdown && (
                      <div className="absolute top-12 left-0 z-50 bg-[#1e1e32] border border-white/10 rounded-xl shadow-2xl min-w-[140px] py-1">
                        <button onClick={() => { setProtocolFilter(''); setShowProtocolDropdown(false) }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10">Все</button>
                        {protocols.map(p => (
                          <button key={p} onClick={() => { setProtocolFilter(p); setShowProtocolDropdown(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${protocolFilter === p ? 'text-purple-300 bg-purple-400/10' : 'text-slate-300'}`}>{p}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ISP */}
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowIspDropdown(!showIspDropdown); setShowCountryDropdown(false); setShowProtocolDropdown(false); setShowSortDropdown(false) }}
                      className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-all max-w-[160px] ${
                        ispFilter 
                          ? 'bg-pink-400/10 border-pink-400/30 text-pink-300' 
                          : 'bg-black/20 border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{ispFilter || 'Провайдер'}</span>
                      <span className="material-symbols-outlined text-lg shrink-0">expand_more</span>
                    </button>
                    {showIspDropdown && (
                      <div className="absolute top-12 left-0 z-50 bg-[#1e1e32] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto min-w-[200px] py-1">
                        <button onClick={() => { setIspFilter(''); setShowIspDropdown(false) }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10">Все провайдеры</button>
                        {isps.map(isp => (
                          <button key={isp} onClick={() => { setIspFilter(isp); setShowIspDropdown(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 truncate ${ispFilter === isp ? 'text-pink-300 bg-pink-400/10' : 'text-slate-300'}`}>{isp}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowSortDropdown(!showSortDropdown); setShowCountryDropdown(false); setShowProtocolDropdown(false); setShowIspDropdown(false) }}
                      className="flex h-10 items-center gap-2 rounded-xl bg-black/20 border border-white/10 px-3 text-sm text-slate-300 hover:bg-white/5 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">sort</span>
                      <span className="hidden sm:inline">{sortBy === 'country' ? 'Страна' : sortBy === 'latency' ? 'Пинг' : sortBy === 'speed' ? 'Скорость' : 'ISP'}</span>
                      <span className="material-symbols-outlined text-lg">expand_more</span>
                    </button>
                    {showSortDropdown && (
                      <div className="absolute top-12 right-0 z-50 bg-[#1e1e32] border border-white/10 rounded-xl shadow-2xl min-w-[140px] py-1">
                        <button onClick={() => { setSortBy('country'); setShowSortDropdown(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${sortBy === 'country' ? 'text-cyan-300' : 'text-slate-300'}`}>По стране</button>
                        <button onClick={() => { setSortBy('latency'); setShowSortDropdown(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${sortBy === 'latency' ? 'text-cyan-300' : 'text-slate-300'}`}>По пингу</button>
                        <button onClick={() => { setSortBy('speed'); setShowSortDropdown(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${sortBy === 'speed' ? 'text-cyan-300' : 'text-slate-300'}`}>По скорости</button>
                        <button onClick={() => { setSortBy('isp'); setShowSortDropdown(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${sortBy === 'isp' ? 'text-cyan-300' : 'text-slate-300'}`}>По провайдеру</button>
                      </div>
                    )}
                  </div>

                  {/* Clear filters */}
                  {(countryFilter || protocolFilter || ispFilter || searchQuery) && (
                    <button 
                      onClick={() => { setCountryFilter(''); setProtocolFilter(''); setIspFilter(''); setSearchQuery('') }}
                      className="flex h-10 items-center gap-1 rounded-xl bg-red-500/10 border border-red-500/30 px-3 text-sm text-red-300 hover:bg-red-500/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                      <span className="hidden sm:inline">Сброс</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Country Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {QUICK_FILTERS.map(filter => {
                  const code = filter.split(' ')[1]
                  const isActive = countryFilter === code
                  return (
                    <button 
                      key={filter}
                      onClick={() => handleQuickFilter(filter)}
                      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-all ${
                        isActive 
                          ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.2)]' 
                          : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                      }`}
                    >
                      <img src={getFlag(code)} alt="" className="w-4 h-3 rounded-sm object-cover" />
                      <span>{code}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Results Count */}
            <div className="px-4 py-2">
              <p className="text-base font-medium text-slate-300">Найдено: {filteredKeys.length} ключей</p>
            </div>

            {/* Keys Grid */}
            {filteredKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-4xl mb-4">😔</p>
                <p className="text-white text-lg">Ключи не найдены</p>
                <p className="text-slate-400 text-sm">Попробуйте изменить фильтры</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
                {filteredKeys.map((key, idx) => {
                  const protocol = getProtocol(key.key)
                  const colors = PROTOCOL_COLORS[protocol] || PROTOCOL_COLORS.VLESS
                  return (
                    <div 
                      key={idx} 
                      onClick={() => openKeyModal(key)}
                      className="flex flex-col rounded-lg border border-white/10 bg-black/20 backdrop-blur-md p-5 gap-4 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(0,255,255,0.25)] hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="h-12 flex items-center">
                            <img 
                              src={getFlag(key.country_code)} 
                              alt={key.country_code} 
                              className="w-16 h-12 object-cover rounded shadow-lg"
                              onError={(e) => e.target.src = UNKNOWN_FLAG}
                            />
                          </div>
                          <p className="text-lg font-bold text-white">{key.country || 'Unknown'}</p>
                          <p className="text-sm text-slate-400">{key.isp || 'Unknown ISP'}</p>
                        </div>
                        <div className={`rounded-full ${colors.bg} border ${colors.border} px-3 py-1 text-xs font-medium ${colors.text}`}>
                          {protocol}
                        </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/10 pt-3 text-sm">
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <span className="text-xs">Пинг</span>
                          <span className="font-bold text-white">{key.latency_ms}ms</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <span className="text-xs">Скорость</span>
                          <span className="font-bold text-white">{key.speed_kbps} KB/s</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <span className="text-xs">Exit IP</span>
                          <span className="font-mono text-xs text-white">{key.exit_ip?.split('.').slice(0,2).join('.')}.***</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(key.key, 'Ключ скопирован!') }}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-md h-10 px-4 bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                        <span>Копировать</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Key Detail Modal */}
      {selectedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
          <div 
            className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.2)] max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img 
                  src={getFlag(selectedKey.country_code)} 
                  alt={selectedKey.country_code} 
                  className="w-12 h-9 object-cover rounded shadow-lg"
                  onError={(e) => e.target.src = UNKNOWN_FLAG}
                />
                <div>
                  <p className="text-xl font-bold text-white">{selectedKey.country || 'Unknown'}</p>
                  <p className="text-sm text-slate-400">{selectedKey.isp || 'Unknown ISP'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* Protocol Badge */}
              {(() => {
                const protocol = getProtocol(selectedKey.key)
                const colors = PROTOCOL_COLORS[protocol] || PROTOCOL_COLORS.VLESS
                return (
                  <div className={`inline-flex rounded-full ${colors.bg} border ${colors.border} px-4 py-1.5 text-sm font-medium ${colors.text}`}>
                    {protocol}
                  </div>
                )
              })()}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Пинг (сервер)</p>
                  <p className="text-2xl font-bold text-cyan-300">{selectedKey.latency_ms}ms</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Скорость</p>
                  <p className="text-2xl font-bold text-pink-300">{selectedKey.speed_kbps} KB/s</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Exit IP</p>
                  <p className="text-lg font-mono text-white">{selectedKey.exit_ip || '—'}</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Код страны</p>
                  <p className="text-lg font-bold text-white">{selectedKey.country_code || '—'}</p>
                </div>
              </div>

              {/* Server Name */}
              {selectedKey.name && (
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Название сервера</p>
                  <p className="text-sm text-white break-all">{selectedKey.name}</p>
                </div>
              )}

              {/* Ping Test Section */}
              <div className="bg-gradient-to-r from-cyan-400/10 to-purple-500/10 rounded-lg p-4 border border-cyan-400/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">🏓 Тест пинга от тебя</p>
                  <button 
                    onClick={() => pingServer(selectedKey)}
                    disabled={isPinging}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isPinging 
                        ? 'bg-slate-600 text-slate-300 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                    }`}
                  >
                    {isPinging ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner"></div>
                        <span>Пингую...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">speed</span>
                        <span>Пинг</span>
                      </>
                    )}
                  </button>
                </div>
                
                {pingResult && (
                  <div className="space-y-2">
                    {pingResult.error ? (
                      <p className="text-red-400 text-sm">{pingResult.error}</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400">Сервер:</span>
                          <span className="font-mono text-cyan-300">{pingResult.host}:{pingResult.port}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="bg-black/30 rounded p-2 text-center">
                            <p className="text-xs text-slate-400">Мин</p>
                            <p className="text-lg font-bold text-green-400">{pingResult.min}ms</p>
                          </div>
                          <div className="bg-black/30 rounded p-2 text-center">
                            <p className="text-xs text-slate-400">Средний</p>
                            <p className="text-lg font-bold text-cyan-300">{pingResult.avg}ms</p>
                          </div>
                          <div className="bg-black/30 rounded p-2 text-center">
                            <p className="text-xs text-slate-400">Макс</p>
                            <p className="text-lg font-bold text-orange-400">{pingResult.max}ms</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {!pingResult && !isPinging && (
                  <p className="text-xs text-slate-500">Нажми "Пинг" чтобы проверить задержку от твоего устройства до сервера</p>
                )}
              </div>

              {/* Key */}
              <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                <p className="text-xs text-slate-400 mb-2">VPN Ключ</p>
                <p className="text-xs font-mono text-slate-300 break-all line-clamp-3">{selectedKey.key}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => copyToClipboard(selectedKey.key, 'Ключ скопирован!')}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-medium transition-all hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined">content_copy</span>
                  <span>Копировать ключ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-6 py-3 rounded-full font-medium shadow-[0_0_30px_rgba(0,255,255,0.4)] toast-animate z-[60]">
          {toast}
        </div>
      )}
    </div>
  )
}

export default App
