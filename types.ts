
export enum Sender {
  USER = 'USER',
  CHARACTER = 'CHARACTER',
  SYSTEM = 'SYSTEM'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  image?: string; // Base64 encoded image data
  characterId?: string; // For group chats: which character sent this specific message
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isInitializing: boolean;
}

export interface Character {
  id: string;
  name: string;     // Display Name (e.g., "若叶 睦")
  romaji: string;   // ID/Romaji (e.g., "Mutsumi")
  band: 'MyGO!!!!!' | 'Ave Mujica';
  description: string;
  color: string;    // Hex accent color
  systemInstruction: string;
  avatarPlaceholder: string; // Initials like "WM"
  hidden?: boolean; // If true, does not appear in the standard contact list
}

export interface Session {
  id: string;
  type: 'single' | 'group';
  characterId?: string; // For single chat
  members?: string[];   // For group chat (list of character IDs)
  title: string;
  lastModified: number;
  messages: Message[];
}
