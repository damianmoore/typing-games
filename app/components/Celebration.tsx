'use client';

import Confetti from 'react-confetti';
import useWindowSize from '../hooks/useWindowSize';

interface CelebrationProps {
  show: boolean;
}

export default function Celebration({ show }: CelebrationProps) {
  const { width, height } = useWindowSize();

  if (!show || !width || !height) return null;

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={500}
    />
  );
}
