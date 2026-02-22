"use client";

import { useState, useEffect, useCallback } from "react";

interface TypewriterTextProps {
  prefix: string;
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export default function TypewriterText({
  prefix,
  words,
  typingSpeed = 120,
  deletingSpeed = 60,
  pauseDuration = 2000,
}: TypewriterTextProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const currentWord = words[wordIndex];

  const tick = useCallback(() => {
    if (isDeleting) {
      setDisplayText((prev) => prev.slice(0, -1));
      if (displayText.length === 0) {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      }
    } else {
      setDisplayText(currentWord.slice(0, displayText.length + 1));
    }
  }, [isDeleting, displayText, currentWord, words.length]);

  useEffect(() => {
    const isComplete = !isDeleting && displayText === currentWord;
    const isEmpty = isDeleting && displayText.length === 0;

    const delay = isEmpty
      ? typingSpeed
      : isComplete
        ? pauseDuration
        : isDeleting
          ? deletingSpeed
          : typingSpeed;

    const timer = setTimeout(() => {
      if (isComplete) {
        setIsDeleting(true);
      } else {
        tick();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    displayText,
    isDeleting,
    currentWord,
    tick,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
  ]);

  return (
    <>
      {prefix}{" "}
      <span className="relative">
        <span className="bg-gradient-to-r from-blue-600 via-violet-500 to-purple-600 dark:from-blue-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
          {displayText}
        </span>
        <span className="animate-blink ml-[1px] inline-block w-[3px] sm:w-[4px] h-[0.85em] align-middle bg-blue-500 dark:bg-blue-400 rounded-sm" />
      </span>
    </>
  );
}
