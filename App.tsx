import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { CHARACTERS, initializeCharacterChat, initializeGroupChat, sendMessage } from './services/gemini';
import { Message, Sender, Session, Character } from './types';

// --- Constants ---
const STORAGE_KEY = 'mutsumi_chat_sessions_v4';
const USER_AVATAR_KEY = 'user_avatar_global';
const CHAR_AVATAR_KEY = 'char_avatars_map';
const GROUP_THEME_COLOR = '#6b4c9a'; // Starlight Purple for groups

// --- Icons ---
const Icons = {
  Send: () => <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>,
  Menu: () => <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>,
  Scan: () => <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7V5a2 2 0 012-2h2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 3h2a2 2 0 012 2v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 17v2a2 2 0 01-2 2h-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21H5a2 2 0 01-2-2v-2" /><circle cx="12" cy="12" r="3" /><path d="M12 16v3m0-14v3m4 5h3m-14 0h3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}/></svg>,
  User: () => <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Camera: () => <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>,
  Info: () => <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  // New Stylized Icons
  Cucumber: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M17.5 5.5c2.5 2.5 2.5 6.5 0 9l-8 8c-2.5 2.5-6.5 2.5-9 0s-2.5-6.5 0-9l8-8c2.5-2.5 6.5-2.5 9 0z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 11l.01 0M11 14l.01 0M14 11l.01 0M11 8l.01 0" />
    </svg>
  ),
  Tea: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M6 2v2M10 2v2M14 2v2" />
    </svg>
  )
};

// --- Utilities ---
const compressImage = (file: File, maxWidth = 600, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } 
        else { if (height > maxWidth) { width *= maxWidth / height; height = maxWidth; } }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', quality)); } 
        else { reject(new Error("Canvas context failed")); }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

// --- Visual Components ---

const AmbientBackground = ({ themeColor }: { themeColor: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeColorRef = useRef(themeColor);
  const currentRgbRef = useRef(hexToRgb(themeColor));

  useEffect(() => {
    themeColorRef.current = themeColor;
  }, [themeColor]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let animationId: number;
    
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.5,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      speed: Math.random() * 0.2 + 0.05,
      offset: Math.random() * 1000,
      opacity: Math.random() * 0.5 + 0.1,
      targetOpacity: Math.random() * 0.5 + 0.1
    }));

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      
      const targetRgb = hexToRgb(themeColorRef.current);
      const currentRgb = currentRgbRef.current;
      
      const lerpFactor = 0.05; 
      
      currentRgb.r += (targetRgb.r - currentRgb.r) * lerpFactor;
      currentRgb.g += (targetRgb.g - currentRgb.g) * lerpFactor;
      currentRgb.b += (targetRgb.b - currentRgb.b) * lerpFactor;
      
      const rgbString = `${Math.round(currentRgb.r)}, ${Math.round(currentRgb.g)}, ${Math.round(currentRgb.b)}`;

      ctx.fillStyle = `rgba(${rgbString}, 0.12)`; 
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += Math.sin(time * 0.001 + p.offset) * 0.5;
        p.y -= p.speed;
        
        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        p.opacity += (Math.sin(time * 0.002 + p.offset) * 0.005);
        p.opacity = Math.max(0.1, Math.min(0.6, p.opacity));

        ctx.beginPath();
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, `rgba(${rgbString}, 0.5)`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.globalAlpha = 1.0; 
      animationId = requestAnimationFrame(render);
    };

    render(0);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

const Avatar = ({ className = "", customSrc, character }: { className?: string, customSrc?: string | null, character?: Character }) => {
  const bgColor = character ? character.color : '#6b9c8a';
  const placeholder = character ? character.avatarPlaceholder : 'U';
  
  return (
    <div 
      className={`flex items-center justify-center backdrop-blur-sm font-serif border border-white/10 rounded-full overflow-hidden shadow-sm transition-colors duration-500 ${className}`}
      style={{ backgroundColor: `${bgColor}20`, color: bgColor, borderColor: `${bgColor}40` }}
    >
      {customSrc ? (
        <img src={customSrc} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs md:text-sm tracking-widest font-bold opacity-90">{placeholder}</span>
      )}
    </div>
  );
};

// --- Chat Header Component ---
const ChatHeader = ({ 
  character, 
  session, 
  onToggleSidebar, 
  charAvatars 
}: { 
  character: Character | null, 
  session: Session | undefined, 
  onToggleSidebar: () => void,
  charAvatars: Record<string, string>
}) => {
  const isGroup = session?.type === 'group';
  const themeColor = character?.color || (isGroup ? GROUP_THEME_COLOR : '#6b9c8a');
  const title = character ? character.name : (session?.title || 'Chat');
  const subtitle = character ? character.band : (isGroup ? `${session?.members?.length || 0} Members` : 'Online');

  return (
    <div 
      className="absolute top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 md:px-6 backdrop-blur-xl border-b border-white/5 transition-colors duration-500"
      style={{ 
        backgroundColor: `rgba(0, 0, 0, 0.3)`, 
        borderBottomColor: `${themeColor}20` 
      }}
    >
       <div className="absolute bottom-0 left-0 right-0 h-[1px] opacity-30" style={{ background: `linear-gradient(90deg, transparent, ${themeColor}, transparent)` }}></div>

       <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <button onClick={onToggleSidebar} className="md:hidden text-white/70 hover:text-white transition-colors">
             <Icons.Menu />
          </button>
          
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="relative shrink-0">
               <Avatar 
                  character={character || undefined} 
                  customSrc={character ? charAvatars[character.id] : undefined}
                  className="w-9 h-9 md:w-10 md:h-10 border border-white/10"
               />
               <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black animate-pulse" style={{ backgroundColor: themeColor }}></span>
             </div>
             
             <div className="flex flex-col justify-center min-w-0">
                <h1 className="font-serif text-sm md:text-base font-bold text-white truncate leading-tight flex items-center gap-2">
                   {title}
                   {isGroup && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-sans tracking-wide">GROUP</span>}
                </h1>
                <p className="text-[10px] md:text-xs font-sans tracking-widest uppercase opacity-60 truncate flex items-center gap-2" style={{ color: themeColor }}>
                    {subtitle}
                </p>
             </div>
          </div>
       </div>

       <div className="flex items-center gap-3">
           <div className="hidden md:flex flex-col items-end mr-2">
               <span className="text-[9px] uppercase tracking-widest opacity-30 font-sans">Status</span>
               <span className="text-[10px] opacity-70 font-sans">Active</span>
           </div>
           <button className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors">
               <Icons.Info />
           </button>
       </div>
    </div>
  );
};

// --- Interactive Widgets ---

const WidgetWrapper = ({ color, title, children }: { color: string, title: string, children?: React.ReactNode }) => (
    <div className="mt-4 p-4 rounded-xl border relative overflow-hidden group backdrop-blur-md select-none transition-colors duration-500 hover:border-white/20" 
         style={{ backgroundColor: `${color}08`, borderColor: `${color}25` }}>
        <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 transition-colors duration-500" style={{ color }}>{title}</span>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-500" style={{ backgroundColor: color }}></div>
        </div>
        {children}
    </div>
);

const MutsumiGarden = ({ color }: { color: string }) => {
    const [cucumbers, setCucumbers] = useState<{id: number, left: number}[]>([]);
    
    const plant = () => {
        const id = Date.now();
        const left = Math.random() * 60 + 20; // Random horizontal pos
        setCucumbers(p => [...p, {id, left}]);
        setTimeout(() => setCucumbers(p => p.filter(c => c.id !== id)), 1000); // Remove after animation
    };

    return (
        <WidgetWrapper color={color} title="Greenhouse">
            <div className="flex items-center justify-center h-20 relative cursor-pointer active:scale-95 transition-transform" onClick={plant}>
                 <div className="w-12 h-12 text-white/80 hover:text-white transition-colors relative z-10 filter drop-shadow-lg">
                    <Icons.Cucumber />
                 </div>
                 {cucumbers.map(c => (
                     <div key={c.id} className="absolute bottom-4 animate-float-up-fade pointer-events-none" style={{ left: `${c.left}%` }}>
                         <span className="text-lg">🥒</span>
                     </div>
                 ))}
            </div>
        </WidgetWrapper>
    );
};

const SoyoTea = ({ color }: { color: string }) => {
    const [steams, setSteams] = useState<{id: number, left: number}[]>([]);
    
    const sip = () => {
        const id = Date.now();
        const left = Math.random() * 40 + 30;
        setSteams(p => [...p, {id, left}]);
        setTimeout(() => setSteams(p => p.filter(c => c.id !== id)), 1500);
    };

    return (
        <WidgetWrapper color={color} title="Tea Time">
            <div className="flex items-center justify-center h-20 relative cursor-pointer active:scale-95 transition-transform" onClick={sip}>
                 <div className="w-12 h-12 text-white/80 hover:text-white transition-colors relative z-10 filter drop-shadow-lg">
                    <Icons.Tea />
                 </div>
                 {steams.map(s => (
                     <div key={s.id} className="absolute bottom-10 animate-float-up-fade pointer-events-none opacity-50" style={{ left: `${s.left}%` }}>
                         <div className="w-1 h-3 bg-white/20 blur-[1px] rounded-full"></div>
                     </div>
                 ))}
            </div>
        </WidgetWrapper>
    );
};

const MortisGuitar = ({ color }: { color: string }) => {
    const [strum, setStrum] = useState(false);
    const handleClick = () => {
        setStrum(true);
        setTimeout(() => setStrum(false), 200);
    };
    return (
        <WidgetWrapper color={color} title="Seven-String">
            <div 
                onClick={handleClick}
                className={`h-20 flex items-center justify-center relative cursor-pointer overflow-hidden rounded-lg bg-black/40 border border-white/5 ${strum ? 'animate-shake' : ''}`}
            >
                <div className="absolute inset-0 flex justify-between px-8 items-center opacity-30">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className={`w-0.5 bg-red-900 h-full transition-transform duration-75 ${strum ? 'scale-x-150 translate-x-[1px]' : ''}`}></div>
                    ))}
                </div>
                {strum && <div className="absolute inset-0 bg-red-500/10 animate-slash"></div>}
                <span className={`text-2xl font-serif z-10 transition-colors ${strum ? 'text-red-500' : 'text-red-900'}`}>
                    {strum ? "SHRED" : "SILENCE"}
                </span>
            </div>
        </WidgetWrapper>
    );
};

const TomoriCollection = ({ color }: { color: string }) => {
    const items = ['🪨', '🍂', '💊', '🪲', '💎'];
    const [collection, setCollection] = useState<{id: number, char: string}[]>([]);
    
    const collect = () => {
        const item = items[Math.floor(Math.random() * items.length)];
        const id = Date.now();
        setCollection(prev => [...prev.slice(-4), { id, char: item }]);
    };

    return (
        <WidgetWrapper color={color} title="Collection">
            <div className="flex justify-between items-end h-12 mb-2 px-1 border-b border-white/5 pb-2">
                {collection.map((c) => (
                    <span key={c.id} className="animate-pop text-xl">{c.char}</span>
                ))}
            </div>
            <button onClick={collect} className="w-full py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded text-center text-white/60 transition-colors">
                寻找
            </button>
        </WidgetWrapper>
    );
};

const AnonSocial = ({ color }: { color: string }) => {
    const [likes, setLikes] = useState(1240);
    const [hearts, setHearts] = useState<{id:number, x:number, y: number}[]>([]);
    
    const post = (e: React.MouseEvent) => {
        setLikes(l => l + Math.floor(Math.random() * 50) + 10);
        const id = Date.now();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        // Generate multiple hearts
        const newHearts = Array.from({length: 3}, (_, i) => ({
            id: id + i,
            x: e.clientX - rect.left + (Math.random() * 40 - 20),
            y: e.clientY - rect.top
        }));
        
        setHearts(h => [...h, ...newHearts]);
        setTimeout(() => setHearts(h => h.filter(item => item.id < id)), 1000);
    };

    return (
        <WidgetWrapper color={color} title="Kitagram">
            <div className="relative overflow-hidden h-24 bg-black/20 rounded-lg flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform" onClick={post}>
                 <span className="text-2xl font-bold">{likes.toLocaleString()}</span>
                 <span className="text-[9px] opacity-60 uppercase tracking-widest">Likes</span>
                 {hearts.map(h => (
                     <span key={h.id} className="absolute text-pink-500 animate-float-up-fade pointer-events-none text-lg" style={{ left: h.x, top: h.y }}>♥</span>
                 ))}
            </div>
        </WidgetWrapper>
    );
};

const WidgetPlaceholder = ({ color, icon, label }: any) => (
    <WidgetWrapper color={color} title={label}>
        <div className="h-16 flex items-center justify-center text-3xl opacity-80 hover:scale-110 transition-transform cursor-pointer active:scale-90">{icon}</div>
    </WidgetWrapper>
);

const CharacterSpecialFeature = ({ charId, color }: { charId: string, color: string }) => {
    switch (charId) {
        case 'mutsumi': return <MutsumiGarden color={color} />;
        case 'mortis': return <MortisGuitar color={color} />;
        case 'tomori': return <TomoriCollection color={color} />;
        case 'anon': return <AnonSocial color={color} />;
        case 'rana': return <WidgetPlaceholder color={color} icon="🍵" label="Parfait" />;
        case 'soyo': return <SoyoTea color={color} />;
        case 'taki': return <WidgetPlaceholder color={color} icon="☕" label="Coffee" />;
        case 'sakiko': return <WidgetPlaceholder color={color} icon="🎹" label="Moonlight" />;
        case 'uika': return <WidgetPlaceholder color={color} icon="🌟" label="Stargaze" />;
        case 'umiri': return <WidgetPlaceholder color={color} icon="🍫" label="Energy" />;
        case 'nyamu': return <WidgetPlaceholder color={color} icon="📹" label="Stream" />;
        default: return null;
    }
};

// --- Group Creation Modal ---

const GroupCreateModal = ({ onClose, onCreate }: { onClose: () => void, onCreate: (members: string[], title: string) => void }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const chars = Object.values(CHARACTERS).filter(c => !c.hidden);

    const toggleChar = (id: string) => {
        if (selected.includes(id)) setSelected(selected.filter(s => s !== id));
        else setSelected([...selected, id]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#1a201e] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-white font-serif text-lg">Create Group</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icons.X /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Group Name</label>
                        <input 
                            value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#6b4c9a] font-sans"
                            placeholder="e.g., MyGO Meeting"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Members ({selected.length})</label>
                        <div className="grid grid-cols-5 gap-2">
                            {chars.map(c => (
                                <button 
                                    key={c.id} onClick={() => toggleChar(c.id)}
                                    className={`aspect-square rounded-lg relative overflow-hidden border transition-all ${selected.includes(c.id) ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-80'}`}
                                    style={{ borderColor: selected.includes(c.id) ? c.color : 'transparent' }}
                                >
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: c.color }}></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: c.color }}>{c.avatarPlaceholder}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-white/5 flex justify-end">
                    <button 
                        onClick={() => onCreate(selected, title || "New Group")}
                        disabled={selected.length < 2}
                        className="px-6 py-2 rounded-lg bg-[#6b4c9a] text-white text-sm font-bold hover:bg-[#5a3b8a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Sidebar ---

const Sidebar = ({ 
  activeCharacterId, 
  onSelectCharacter,
  userAvatar,
  onUploadUserAvatar,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateGroup,
  onDeleteSession,
  onUploadCharAvatar,
  charAvatars
}: { 
  activeCharacterId: string | null, 
  onSelectCharacter: (id: string) => void,
  userAvatar: string | null,
  onUploadUserAvatar: () => void,
  sessions: Session[],
  currentSessionId: string | null,
  onSelectSession: (session: Session) => void,
  onCreateGroup: () => void,
  onDeleteSession: (id: string) => void,
  onUploadCharAvatar: (id: string) => void,
  charAvatars: Record<string, string>
}) => {
  const activeCharacter = activeCharacterId ? CHARACTERS[activeCharacterId] : null;
  const bands = ['MyGO!!!!!', 'Ave Mujica'];
  const charactersByBand = Object.values(CHARACTERS).filter(c => !c.hidden).reduce((acc, char) => {
    if (!acc[char.band]) acc[char.band] = []; acc[char.band].push(char); return acc;
  }, {} as Record<string, Character[]>);

  // Easter Egg Logic
  const clickCountRef = useRef(0);
  const [shake, setShake] = useState(false);

  const handleAvatarClick = () => {
      if (activeCharacterId === 'mutsumi') {
          clickCountRef.current += 1;
          if (clickCountRef.current >= 10) {
              setShake(true);
              setTimeout(() => {
                  onSelectCharacter('mortis');
                  setShake(false);
                  clickCountRef.current = 0;
              }, 500);
          }
      } else if (activeCharacterId === 'mortis') {
           clickCountRef.current += 1;
           if (clickCountRef.current >= 10) {
              setShake(true);
              setTimeout(() => {
                  onSelectCharacter('mutsumi');
                  setShake(false);
                  clickCountRef.current = 0;
              }, 500);
           }
      }
  };

  return (
    <div className="flex flex-col h-full p-4 text-gray-300 overflow-y-auto custom-scrollbar relative z-10">
      {/* Header / Avatar */}
      <div className="flex flex-col items-center pt-4 mb-6">
         <div className="relative group">
             <div 
                onClick={handleAvatarClick}
                className={`w-24 h-24 rounded-full border-2 p-1 relative shadow-lg transition-all duration-500 cursor-pointer ${shake ? 'animate-shake' : 'active:scale-95'}`}
                style={{ 
                    borderColor: activeCharacter ? `${activeCharacter.color}40` : `${GROUP_THEME_COLOR}40`, 
                    backgroundColor: activeCharacter ? `${activeCharacter.color}10` : `${GROUP_THEME_COLOR}10` 
                }}
             >
                 <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black/20">
                     {activeCharacter ? (
                         <div className="w-full h-full">
                             {charAvatars[activeCharacter.id] ? (
                                <img src={charAvatars[activeCharacter.id]} alt={activeCharacter.name} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-3xl font-serif font-bold opacity-80 transition-colors duration-500" style={{ color: activeCharacter.color }}>{activeCharacter.avatarPlaceholder}</span>
                                </div>
                             )}
                         </div>
                     ) : (
                         <Icons.Users />
                     )}
                 </div>
             </div>
             
             {/* Upload Trigger (Only for single characters) */}
             {activeCharacter && (
                 <button 
                     onClick={(e) => { e.stopPropagation(); onUploadCharAvatar(activeCharacter.id); }}
                     className="absolute bottom-0 right-0 p-2 bg-black/60 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 text-white z-20"
                     title="Change Avatar"
                 >
                     <Icons.Camera />
                 </button>
             )}
         </div>
         
         <h2 className="mt-3 font-serif text-lg font-bold transition-colors duration-500" style={{ color: activeCharacter?.color || 'white' }}>
            {activeCharacter ? activeCharacter.name : 'Group Chat'}
         </h2>
      </div>

      <div className="h-px w-full bg-white/5 mb-6"></div>

      {/* Character List */}
      <div className="space-y-6 mb-6">
          {bands.map(band => (
             <div key={band}>
                  <div className="flex items-center gap-2 mb-2 px-1 opacity-90">
                    <div className="h-px flex-1 bg-white/10"></div>
                    <h3 className="text-[9px] font-serif uppercase tracking-[0.15em] text-white/40">{band}</h3>
                    <div className="h-px flex-1 bg-white/10"></div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                      {charactersByBand[band]?.map(char => (
                          <button
                            key={char.id}
                            onClick={() => onSelectCharacter(char.id)}
                            className={`aspect-square rounded-lg flex items-center justify-center transition-all border relative group overflow-hidden active:scale-90 duration-200 ${activeCharacterId === char.id ? 'scale-105 shadow-md opacity-100' : 'opacity-60 hover:opacity-100'}`}
                            style={{ 
                                backgroundColor: activeCharacterId === char.id ? `${char.color}20` : 'transparent',
                                borderColor: activeCharacterId === char.id ? char.color : 'rgba(255,255,255,0.08)',
                            }}
                          >
                               {charAvatars[char.id] ? (
                                   <img src={charAvatars[char.id]} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                               ) : (
                                   <span className="text-[10px] font-bold z-10 transition-colors duration-300" style={{ color: activeCharacterId === char.id ? char.color : '#9ca3af' }}>{char.avatarPlaceholder}</span>
                               )}
                          </button>
                      ))}
                  </div>
             </div>
          ))}
      </div>

      {/* Special Widget */}
      {activeCharacter && <CharacterSpecialFeature charId={activeCharacter.id} color={activeCharacter.color} />}

      <div className="h-px w-full bg-white/5 my-6"></div>

      {/* Groups List */}
      <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-serif uppercase tracking-widest opacity-60 px-1 transition-colors duration-500" style={{ color: GROUP_THEME_COLOR }}>Groups</h3>
              <button onClick={onCreateGroup} className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white"><Icons.Plus /></button>
          </div>
          <div className="space-y-1">
              {sessions.filter(s => s.type === 'group').map(s => (
                  <div key={s.id} className="group relative flex items-center">
                      <button 
                        onClick={() => onSelectSession(s)}
                        className="w-full text-left p-2 pr-8 rounded-md text-xs transition-colors flex items-center gap-2 relative overflow-hidden hover:bg-white/5"
                        style={currentSessionId === s.id ? { backgroundColor: `${GROUP_THEME_COLOR}15`, borderLeft: `2px solid ${GROUP_THEME_COLOR}`, color: 'white' } : { borderLeft: '2px solid transparent', color: '#9ca3af' }}
                      >
                          <span className="truncate">{s.title}</span>
                      </button>
                      <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteSession(s.id); }} 
                          className="absolute right-2 p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-all z-50"
                          title="Delete"
                      >
                          <Icons.Trash />
                      </button>
                  </div>
              ))}
              {sessions.filter(s => s.type === 'group').length === 0 && (
                  <div className="text-[10px] text-white/20 px-2 py-1 italic">No active groups</div>
              )}
          </div>
      </div>
      
      {/* DM History */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-[10px] font-serif uppercase tracking-widest mb-2 opacity-60 px-1">Direct Messages</h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
            {sessions.filter(s => s.type === 'single').map(s => {
                const char = s.characterId ? CHARACTERS[s.characterId] : null;
                const color = char?.color || '#666';
                const isCurrent = currentSessionId === s.id;
                return (
                    <div key={s.id} className="group relative flex items-center">
                        <button 
                            onClick={() => onSelectSession(s)}
                            className={`w-full text-left p-2 pr-8 rounded-md text-xs transition-colors flex items-center gap-2 relative overflow-hidden hover:bg-white/5`}
                            style={isCurrent ? { backgroundColor: `${color}15`, borderLeft: `2px solid ${color}`, color: 'white' } : { borderLeft: '2px solid transparent', color: '#9ca3af' }}
                        >
                            <div className="w-1.5 h-1.5 rounded-full shrink-0 overflow-hidden" style={{ backgroundColor: color }}>
                                {char && charAvatars[char.id] && <img src={charAvatars[char.id]} className="w-full h-full object-cover" />}
                            </div>
                            <span className="truncate z-10">{char?.name || 'Chat'}</span>
                        </button>
                        <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteSession(s.id); }} 
                            className="absolute right-2 p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-all z-50"
                            title="Delete"
                        >
                            <Icons.Trash />
                        </button>
                    </div>
                );
            })}
        </div>
      </div>

      <div className="mt-auto pt-4 text-center">
           <a href="https://b23.tv/5v3enDD" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/20 hover:text-white/50 transition-colors block mb-2">
               Bilibili @-Alisss-
           </a>
           <div className="pt-2 border-t border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors" onClick={onUploadUserAvatar}>
               <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                       {userAvatar ? <img src={userAvatar} alt="Me" className="w-full h-full object-cover" /> : <Icons.User />}
                   </div>
                   <span className="text-xs text-gray-400">User</span>
               </div>
           </div>
      </div>
    </div>
  );
};

const App = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [draftCharacterId, setDraftCharacterId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [charAvatars, setCharAvatars] = useState<Record<string, string>>({});
  const [tempCharIdForAvatar, setTempCharIdForAvatar] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const chatImageInputRef = useRef<HTMLInputElement>(null);
  const userAvatarInputRef = useRef<HTMLInputElement>(null);
  const charAvatarInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  // Determine active character: Draft takes precedence over null session, else session's char
  const activeCharacterId = draftCharacterId || (currentSession?.type === 'single' ? currentSession.characterId : null);
  const activeCharacter = activeCharacterId ? CHARACTERS[activeCharacterId] : null;
  const themeColor = activeCharacter?.color || (currentSession?.type === 'group' ? GROUP_THEME_COLOR : '#6b9c8a');

  useEffect(() => {
    const storedSessions = localStorage.getItem(STORAGE_KEY);
    const storedUserAvatar = localStorage.getItem(USER_AVATAR_KEY);
    const storedCharAvatars = localStorage.getItem(CHAR_AVATAR_KEY);

    if (storedUserAvatar) setUserAvatar(storedUserAvatar);
    if (storedCharAvatars) setCharAvatars(JSON.parse(storedCharAvatars));

    if (storedSessions) {
        try {
            const parsed = JSON.parse(storedSessions);
            setSessions(parsed);
            if (parsed.length > 0) {
                const first = parsed[0];
                setCurrentSessionId(first.id);
                if (first.type === 'single' && first.characterId) {
                    initializeCharacterChat(first.characterId, first.messages);
                } else if (first.type === 'group' && first.members) {
                    initializeGroupChat(first.members, first.messages);
                }
            } else {
                // No sessions? Enter draft mode for default char
                setDraftCharacterId('mutsumi');
                initializeCharacterChat('mutsumi', []);
            }
        } catch (e) {
            setDraftCharacterId('mutsumi');
            initializeCharacterChat('mutsumi', []);
        }
    } else {
        setDraftCharacterId('mutsumi');
        initializeCharacterChat('mutsumi', []);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, isSending, draftCharacterId]);

  const handleSendMessage = async () => {
      if (!inputText.trim() && !isSending) return;
      // Must have either a valid session OR be in draft mode
      if (!currentSessionId && !draftCharacterId) return;
      
      const text = inputText;
      setInputText("");
      setIsSending(true);

      const userMsg: Message = {
          id: Date.now().toString(),
          text: text,
          sender: Sender.USER,
          timestamp: new Date()
      };

      let activeSessionId = currentSessionId;

      // If in draft mode, create session NOW
      if (!activeSessionId && draftCharacterId) {
          const newSessionId = Date.now().toString();
          const newSession: Session = {
              id: newSessionId,
              type: 'single',
              characterId: draftCharacterId,
              title: CHARACTERS[draftCharacterId].name,
              lastModified: Date.now(),
              messages: [userMsg]
          };
          setSessions(prev => [newSession, ...prev]);
          setCurrentSessionId(newSessionId);
          setDraftCharacterId(null);
          activeSessionId = newSessionId;
      } else {
          // Append to existing
          setSessions(prev => prev.map(s => 
              s.id === activeSessionId 
              ? { ...s, messages: [...s.messages, userMsg], lastModified: Date.now() }
              : s
          ));
      }

      try {
          const responses = await sendMessage(text);
          setSessions(prev => prev.map(s => 
              s.id === activeSessionId
              ? { ...s, messages: [...s.messages, ...responses], lastModified: Date.now() }
              : s
          ));
      } catch (error) {
          console.error("Send failed", error);
      } finally {
          setIsSending(false);
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || (!currentSessionId && !draftCharacterId)) return;

      try {
          setIsSending(true);
          const base64 = await compressImage(file);
          
          const userMsg: Message = {
              id: Date.now().toString(),
              text: "",
              sender: Sender.USER,
              timestamp: new Date(),
              image: base64
          };

          let activeSessionId = currentSessionId;
          
          // Create session from draft if needed
          if (!activeSessionId && draftCharacterId) {
              const newSessionId = Date.now().toString();
              const newSession: Session = {
                  id: newSessionId,
                  type: 'single',
                  characterId: draftCharacterId,
                  title: CHARACTERS[draftCharacterId].name,
                  lastModified: Date.now(),
                  messages: [userMsg]
              };
              setSessions(prev => [newSession, ...prev]);
              setCurrentSessionId(newSessionId);
              setDraftCharacterId(null);
              activeSessionId = newSessionId;
          } else {
              setSessions(prev => prev.map(s => 
                s.id === activeSessionId 
                ? { ...s, messages: [...s.messages, userMsg], lastModified: Date.now() }
                : s
              ));
          }
          
          const responses = await sendMessage("", base64);

          setSessions(prev => prev.map(s => 
            s.id === activeSessionId 
            ? { ...s, messages: [...s.messages, ...responses], lastModified: Date.now() }
            : s
          ));
      } catch (error) {
          console.error("Image upload failed", error);
      } finally {
          setIsSending(false);
          if (chatImageInputRef.current) chatImageInputRef.current.value = "";
      }
  };

  const handleSelectSession = async (session: Session) => {
      if (currentSessionId === session.id) {
          setIsSidebarOpen(false);
          return;
      }
      
      setCurrentSessionId(session.id);
      setDraftCharacterId(null); // Clear draft
      setIsSidebarOpen(false);
      
      try {
          if (session.type === 'group' && session.members) {
              await initializeGroupChat(session.members, session.messages);
          } else if (session.characterId) {
              await initializeCharacterChat(session.characterId, session.messages);
          }
      } catch (e) {
          console.error("Failed to switch session", e);
      }
  };

  const handleSelectCharacter = (charId: string) => {
      const existing = sessions.find(s => s.type === 'single' && s.characterId === charId);
      if (existing) {
          handleSelectSession(existing);
      } else {
          // Enter Draft Mode instead of creating session immediately
          setCurrentSessionId(null);
          setDraftCharacterId(charId);
          setIsSidebarOpen(false);
          initializeCharacterChat(charId, []);
      }
  };

  const handleCreateGroup = (members: string[], title: string) => {
      const newSession: Session = {
          id: Date.now().toString(),
          type: 'group',
          members,
          title,
          lastModified: Date.now(),
          messages: []
      };
      setSessions(prev => [newSession, ...prev]);
      handleSelectSession(newSession);
      setShowGroupModal(false);
  };

  const handleDeleteSession = (id: string) => {
      setSessions(prev => {
          const filtered = prev.filter(s => s.id !== id);
          if (currentSessionId === id) {
              if (filtered.length > 0) {
                 // Switch to next available session
                 // We can't easily call async handleSelectSession inside reducer, so we force state update
                 // and handle effect elsewhere or just clear ID
                 setCurrentSessionId(null);
                 setDraftCharacterId('mutsumi');
              } else {
                 setCurrentSessionId(null);
                 setDraftCharacterId('mutsumi');
              }
          }
          return filtered;
      });
  };
  
  const handleUserAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const base64 = await compressImage(file, 150);
          setUserAvatar(base64);
          localStorage.setItem(USER_AVATAR_KEY, base64);
      }
  };

  const handleCharAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && tempCharIdForAvatar) {
          const base64 = await compressImage(file, 150);
          const updated = { ...charAvatars, [tempCharIdForAvatar]: base64 };
          setCharAvatars(updated);
          localStorage.setItem(CHAR_AVATAR_KEY, JSON.stringify(updated));
          setTempCharIdForAvatar(null);
      }
  };

  const displayMessages = currentSession ? currentSession.messages : [];
  // If in draft mode with no session, messages are empty
  
  return (
    <div className="flex h-screen bg-[#0a0c0b] text-gray-100 font-sans overflow-hidden relative selection:bg-white/20">
        <AmbientBackground themeColor={themeColor} />

        {isSidebarOpen && (
            <div 
                className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

        <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-black/40 backdrop-blur-2xl transform transition-transform duration-300 border-r border-white/5 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
             <Sidebar 
                activeCharacterId={activeCharacterId || null}
                onSelectCharacter={handleSelectCharacter}
                userAvatar={userAvatar}
                onUploadUserAvatar={() => userAvatarInputRef.current?.click()}
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onCreateGroup={() => setShowGroupModal(true)}
                onDeleteSession={handleDeleteSession}
                onUploadCharAvatar={(id) => { setTempCharIdForAvatar(id); charAvatarInputRef.current?.click(); }}
                charAvatars={charAvatars}
             />
        </div>

        <div className="flex-1 flex flex-col relative md:ml-72 h-full w-full">
            <ChatHeader 
                character={activeCharacter || null} 
                session={currentSession}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                charAvatars={charAvatars}
            />
            
            <div className="flex-1 overflow-y-auto p-4 pt-20 pb-24 custom-scrollbar space-y-6" onClick={() => setIsSidebarOpen(false)}>
                {!currentSession && !draftCharacterId && (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4">
                        <Icons.Scan />
                        <p className="text-sm font-serif tracking-widest">SELECT A FREQUENCY</p>
                    </div>
                )}
                
                {/* Show placeholder if in draft mode with no messages */}
                {draftCharacterId && !currentSession && displayMessages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4 animate-fade-in">
                          <div className="w-24 h-24 mb-4 rounded-full overflow-hidden flex items-center justify-center bg-white/5 grayscale opacity-50">
                               {activeCharacter && charAvatars[activeCharacter.id] ? (
                                   <img src={charAvatars[activeCharacter.id]} className="w-full h-full object-cover" />
                               ) : (
                                   <span className="text-4xl font-serif font-bold">{activeCharacter?.avatarPlaceholder}</span>
                               )}
                          </div>
                          <p className="text-sm font-serif tracking-widest">Start a conversation with {activeCharacter?.name}</p>
                     </div>
                )}

                {displayMessages.map((msg, idx) => {
                    const isUser = msg.sender === Sender.USER;
                    const showAvatar = !isUser && (idx === 0 || displayMessages[idx-1].sender === Sender.USER || displayMessages[idx-1].characterId !== msg.characterId);
                    const msgChar = !isUser && msg.characterId ? CHARACTERS[msg.characterId] : activeCharacter;

                    return (
                        <div key={msg.id} className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in-up`}>
                             <div className="w-8 h-8 shrink-0 flex flex-col items-center">
                                 {!isUser && showAvatar && (
                                     <Avatar 
                                        character={msgChar || undefined}
                                        customSrc={msgChar ? charAvatars[msgChar.id] : undefined}
                                        className="w-8 h-8 text-[10px]" 
                                     />
                                 )}
                             </div>

                             <div className={`max-w-[75%] md:max-w-[60%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                                 {!isUser && showAvatar && currentSession?.type === 'group' && (
                                     <span className="text-[10px] opacity-50 ml-1" style={{ color: msgChar?.color }}>{msgChar?.name}</span>
                                 )}
                                 
                                 <div 
                                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm backdrop-blur-sm border border-white/5
                                        ${isUser ? 'bg-white/10 text-white rounded-br-sm' : 'bg-black/40 text-gray-200 rounded-bl-sm'}
                                    `}
                                    style={!isUser && msgChar ? { borderLeft: `2px solid ${msgChar.color}` } : {}}
                                 >
                                     {msg.image && (
                                         <img src={msg.image} alt="Attached" className="max-w-full rounded-lg mb-2" />
                                     )}
                                     {msg.text}
                                 </div>
                                 <span className="text-[9px] opacity-30 px-1">
                                     {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </span>
                             </div>
                        </div>
                    );
                })}
                {isSending && (
                    <div className="flex items-end gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-white/5"></div>
                        <div className="px-4 py-3 bg-black/20 rounded-2xl rounded-bl-sm">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                <div 
                    className="max-w-4xl mx-auto flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl transition-all duration-300"
                    style={{
                        borderColor: isInputFocused ? `${themeColor}60` : 'rgba(255, 255, 255, 0.1)',
                        boxShadow: isInputFocused ? `0 0 25px -5px ${themeColor}40` : 'none',
                        transform: isInputFocused ? 'scale(1.01)' : 'scale(1)'
                    }}
                >
                    <button 
                        onClick={() => chatImageInputRef.current?.click()}
                        className="p-2.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        disabled={isSending || (!currentSessionId && !draftCharacterId)}
                    >
                        <Icons.Plus />
                    </button>
                    
                    <input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder={activeCharacter ? `Message ${activeCharacter.name}...` : "Message..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base placeholder-white/30 text-white px-2 outline-none font-sans"
                        disabled={isSending || (!currentSessionId && !draftCharacterId)}
                    />

                    <button 
                        onClick={handleSendMessage}
                        disabled={(!inputText.trim() && !isSending) || (!currentSessionId && !draftCharacterId)}
                        className={`p-2.5 rounded-full transition-all duration-300 ${inputText.trim() ? 'bg-white text-black shadow-lg hover:scale-105' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                        style={inputText.trim() && activeCharacter ? { backgroundColor: activeCharacter.color, color: '#fff' } : {}}
                    >
                        <Icons.Send />
                    </button>
                </div>
            </div>
        </div>

        {showGroupModal && (
            <GroupCreateModal 
                onClose={() => setShowGroupModal(false)} 
                onCreate={handleCreateGroup}
            />
        )}
        
        <input type="file" ref={chatImageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        <input type="file" ref={userAvatarInputRef} className="hidden" accept="image/*" onChange={handleUserAvatarUpload} />
        <input type="file" ref={charAvatarInputRef} className="hidden" accept="image/*" onChange={handleCharAvatarUpload} />
    </div>
  );
};

export default App;