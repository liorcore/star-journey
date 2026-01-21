import type { ComponentType } from 'react';
import {
  Award,
  BookOpen,
  Camera,
  Cat,
  Cloud,
  Compass,
  Crown,
  Dog,
  Flame,
  Gamepad2,
  Gem,
  Heart,
  Moon,
  Music,
  Palette,
  Plane,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Sun,
  Sword,
  Trophy,
  Wand2,
  Zap,
} from 'lucide-react';

export type ParticipantIconKey =
  | 'rocket'
  | 'star'
  | 'sparkles'
  | 'trophy'
  | 'crown'
  | 'award'
  | 'shield'
  | 'sword'
  | 'wand'
  | 'gamepad'
  | 'music'
  | 'palette'
  | 'camera'
  | 'compass'
  | 'book'
  | 'sun'
  | 'moon'
  | 'cloud'
  | 'zap'
  | 'flame'
  | 'gem'
  | 'heart'
  | 'plane'
  | 'cat'
  | 'dog';

export const PARTICIPANT_ICONS: Array<{
  key: ParticipantIconKey;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { key: 'rocket', label: 'רקטה', Icon: Rocket },
  { key: 'star', label: 'כוכב', Icon: Star },
  { key: 'sparkles', label: 'ניצוצות', Icon: Sparkles },
  { key: 'trophy', label: 'גביע', Icon: Trophy },
  { key: 'crown', label: 'כתר', Icon: Crown },
  { key: 'award', label: 'פרס', Icon: Award },
  { key: 'shield', label: 'מגן', Icon: Shield },
  { key: 'sword', label: 'חרב', Icon: Sword },
  { key: 'wand', label: 'שרביט', Icon: Wand2 },
  { key: 'gamepad', label: 'גיימינג', Icon: Gamepad2 },
  { key: 'music', label: 'מוזיקה', Icon: Music },
  { key: 'palette', label: 'צבעים', Icon: Palette },
  { key: 'camera', label: 'מצלמה', Icon: Camera },
  { key: 'compass', label: 'מצפן', Icon: Compass },
  { key: 'book', label: 'ספר', Icon: BookOpen },
  { key: 'sun', label: 'שמש', Icon: Sun },
  { key: 'moon', label: 'ירח', Icon: Moon },
  { key: 'cloud', label: 'ענן', Icon: Cloud },
  { key: 'zap', label: 'ברק', Icon: Zap },
  { key: 'flame', label: 'אש', Icon: Flame },
  { key: 'gem', label: 'יהלום', Icon: Gem },
  { key: 'heart', label: 'לב', Icon: Heart },
  { key: 'plane', label: 'מטוס', Icon: Plane },
  { key: 'cat', label: 'חתול', Icon: Cat },
  { key: 'dog', label: 'כלב', Icon: Dog },
];

const ICON_MAP: Record<ParticipantIconKey, ComponentType<{ className?: string }>> =
  Object.fromEntries(PARTICIPANT_ICONS.map((x) => [x.key, x.Icon])) as Record<
    ParticipantIconKey,
    ComponentType<{ className?: string }>
  >;

export function isParticipantIconKey(value: string): value is ParticipantIconKey {
  return (value as ParticipantIconKey) in ICON_MAP;
}

export function normalizeParticipantIconKey(value: string): ParticipantIconKey {
  if (isParticipantIconKey(value)) return value;
  return PARTICIPANT_ICONS[0].key;
}

export function ParticipantIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  // Wrap so Tailwind `w-*/h-*` works for both SVG and emoji
  if (isParticipantIconKey(icon)) {
    const Icon = ICON_MAP[icon];
    return (
      <span className={className} aria-label="אייקון">
        <Icon className="w-full h-full" />
      </span>
    );
  }

  // Emoji / unicode icon
  return (
    <span className={className} aria-label="אייקון">
      <span className="w-full h-full inline-flex items-center justify-center leading-none select-none text-4xl">
        {icon}
      </span>
    </span>
  );
}

