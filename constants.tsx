import { Stratagem, Direction } from './types';
import React from 'react';

// Icons as simple SVGs components for reusability
export const Icons = {
  ArrowUp: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 4l-8 8h6v8h4v-8h6z" />
    </svg>
  ),
  ArrowDown: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 20l8-8h-6v-8h-4v8h-6z" />
    </svg>
  ),
  ArrowLeft: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4 12l8 8v-6h8v-4h-8v-6z" />
    </svg>
  ),
  ArrowRight: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20 12l-8-8v6h-8v4h8v6z" />
    </svg>
  ),
};

// Helper to create stratagems
const createStrat = (id: string, name: string, type: Stratagem['type'], codeStr: string): Stratagem => {
  const map: Record<string, Direction> = { U: 'UP', D: 'DOWN', L: 'LEFT', R: 'RIGHT' };
  const code = codeStr.split('').map(c => map[c]);
  return { id, name, type, code };
};

export const STRATAGEMS: Stratagem[] = [
  // Offensive
  createStrat('s_reinforce', '增援', 'Mission', 'UDRLU'),
  createStrat('s_sos', 'SOS 救援信标', 'Mission', 'UDRU'),
  createStrat('s_resupply', '补给', 'Supply', 'DDUR'),
  createStrat('s_eagle_airstrike', '飞鹰空袭', 'Offensive', 'URDR'),
  createStrat('s_eagle_500kg', '飞鹰500kg炸弹', 'Offensive', 'URDDD'),
  createStrat('s_eagle_cluster', '飞鹰集束炸弹', 'Offensive', 'URDDR'),
  createStrat('s_orbital_precision', '轨道精准攻击', 'Offensive', 'RRU'),
  createStrat('s_orbital_railcannon', '轨道轨道炮打击', 'Offensive', 'RULDR'),
  createStrat('s_orbital_laser', '轨道激光', 'Offensive', 'RDULR'),
  createStrat('s_hellbomb', '地狱火炸弹', 'Mission', 'DULDURDU'),
  
  // Defensive / Support
  createStrat('s_autocannon', 'AC-8 机炮', 'Supply', 'DLDDUR'),
  createStrat('s_railgun', 'RS-422 磁轨炮', 'Supply', 'DRDUUL'),
  createStrat('s_shield_backpack', 'SH-32 护盾生成包', 'Supply', 'DULDR'),
  createStrat('s_quasar', 'LAS-99 类星体加农炮', 'Supply', 'DDULR'),
  createStrat('s_sentry_autocannon', 'A/AC-8 自动机炮哨戒', 'Defensive', 'DURULU'),
  createStrat('s_sentry_mortar', 'A/M-12 迫击炮哨戒', 'Defensive', 'DURRD'),
  createStrat('s_jump_pack', 'LIFT-850 喷射背包', 'Supply', 'DUUDU'),
  createStrat('s_eat', 'EAT-17 消耗性反坦克武器', 'Supply', 'DDLUR'),
];

export const THEME = {
  yellow: '#FFE600',
  red: '#FF2E2E',
  black: '#0F0F0F',
  grey: '#4A4A4A',
  darkGrey: '#1F1F1F',
};
