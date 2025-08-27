import { useState, useTransition } from 'react';

/**
 * React 19-style optimistic updates for dice rolls
 * Provides immediate feedback while dice animation plays
 */
export const useOptimisticRoll = (onRollComplete) => {
  const [isPending, startTransition] = useTransition();
  const [optimisticResult, setOptimisticResult] = useState(null);
  const [actualResult, setActualResult] = useState(null);

  const rollWithOptimisticFeedback = (rollData) => {
    // Immediately show optimistic result
    const immediateResult = {
      ...rollData,
      isOptimistic: true,
      timestamp: Date.now()
    };
    
    setOptimisticResult(immediateResult);
    
    // Start the actual roll in a transition
    startTransition(() => {
      // Simulate dice roll delay
      setTimeout(() => {
        const finalResult = {
          ...rollData,
          isOptimistic: false,
          timestamp: Date.now()
        };
        
        setActualResult(finalResult);
        setOptimisticResult(null);
        
        if (onRollComplete) {
          onRollComplete(finalResult);
        }
      }, 1000); // 1 second for dice animation
    });
  };

  const currentResult = actualResult || optimisticResult;
  
  return {
    rollWithOptimisticFeedback,
    currentResult,
    isPending,
    isOptimistic: !!optimisticResult
  };
};