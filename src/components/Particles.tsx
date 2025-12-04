'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: string;
  size: number;
  delay: number;
  duration: number;
}

export function Particles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Gerar partículas aleatórias
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      const particleCount = 15; // Número de partículas

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          size: Math.random() * 40 + 20, // Tamanho entre 20px e 60px
          delay: Math.random() * 20, // Delay entre 0s e 20s
          duration: Math.random() * 10 + 15, // Duração entre 15s e 25s
        });
      }

      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <div className="particles-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: particle.left,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
