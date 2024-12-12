'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface ImageSlideshowProps {
  images: string[]
  interval?: number
  className?: string
}

const ImageSlideshow = ({ 
  images, 
  interval = 1000, 
  className = ''
}: ImageSlideshowProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className={`relative aspect-square ${className}`}>
      {images.map((index) => (
        <Image
          key={index}
          src={index}
          alt={`Slide ${index + 1}`}
          fill
          className={`object-contain ${
            currentSlide === images.indexOf(index) ? 'block' : 'hidden'
          }`}
          priority
        />
      ))}
    </div>
  )
}

export default ImageSlideshow 