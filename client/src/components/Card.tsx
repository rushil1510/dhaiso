import React from 'react';
import type { ICard, Suit } from '../types';

interface CardProps {
  card: ICard | null; // null for face down or hidden
  onClick?: () => void;
  className?: string;
}

const suitSymbols: Record<Suit, string> = {
  'H': '♥',
  'D': '♦',
  'C': '♣',
  'S': '♠'
};

const suitColors: Record<Suit, string> = {
  'H': 'text-card-red',
  'D': 'text-card-red',
  'C': 'text-card-black',
  'S': 'text-card-black'
};

export const Card: React.FC<CardProps> = ({ card, onClick, className = '' }) => {
  if (!card) {
    return (
      <div 
        className={`w-20 h-32 bg-blue-800 rounded-lg border-2 border-white shadow-xl flex items-center justify-center ${className}`}
      >
        <div className="w-16 h-28 bg-blue-700 rounded border border-blue-600 opacity-50"></div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`w-20 h-32 bg-white rounded-lg border-2 border-gray-300 shadow-xl flex flex-col items-center justify-between p-2 cursor-pointer hover:-translate-y-4 transition-transform duration-200 ${className}`}
    >
      <div className={`text-2xl font-bold self-start ${suitColors[card.suit]}`}>
        {card.rank}
      </div>
      <div className={`text-5xl ${suitColors[card.suit]}`}>
        {suitSymbols[card.suit]}
      </div>
      <div className={`text-2xl font-bold self-end ${suitColors[card.suit]} transform rotate-180`}>
        {card.rank}
      </div>
    </div>
  );
};
