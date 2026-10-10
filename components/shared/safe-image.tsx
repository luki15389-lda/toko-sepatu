"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  fallbackSrc?: string;
};

export function SafeImage({
  src,
  fallbackSrc = "/placeholder-shoe.svg",
  alt,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <Image
      {...props}
      alt={alt}
      src={failed || !src ? fallbackSrc : src}
      onError={() => setFailed(true)}
    />
  );
}