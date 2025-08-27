import { useState, useCallback, useRef } from 'react';
import { useLongPress } from '../utils/touchUtils';

/**
 * Custom hook for managing action info popup state and interactions
 */
export const useActionInfo = () => {
  const [popupState, setPopupState] = useState({
    isVisible: false,
    position: null,
    actionData: null
  });
  
  const longPressTimeoutRef = useRef(null);

  const showPopup = useCallback((actionData, event) => {
    // Get position from touch or mouse event
    let clientX, clientY;
    
    if (event.touches && event.touches[0]) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if (event.clientX !== undefined) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      // Fallback: get position from the target element
      const rect = event.target.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    setPopupState({
      isVisible: true,
      position: { x: clientX, y: clientY },
      actionData
    });
  }, []);

  const hidePopup = useCallback(() => {
    setPopupState({
      isVisible: false,
      position: null,
      actionData: null
    });
  }, []);

  /**
   * Creates long press handlers for a weapon action
   */
  const createWeaponLongPressHandlers = useCallback((weapon, character) => {
    const actionData = {
      type: 'weapon',
      name: weapon.name,
      description: weapon.description,
      weapon: weapon
    };

    return useLongPress(
      (event) => showPopup(actionData, event),
      {
        threshold: 500, // 500ms for long press
        onStart: () => {
          // Optional: Add visual feedback when long press starts
          console.log('Long press started for weapon:', weapon.name);
        },
        onCancel: () => {
          // Long press was cancelled
          console.log('Long press cancelled for weapon:', weapon.name);
        }
      }
    );
  }, [showPopup]);

  /**
   * Creates long press handlers for an ability action
   */
  const createAbilityLongPressHandlers = useCallback((ability, character) => {
    // Ensure ability object has ability_name for the popup component
    const abilityWithName = {
      ...ability,
      ability_name: ability.ability_name || ability.name
    };
    
    const actionData = {
      type: 'ability',
      name: ability.ability_name || ability.name,
      description: ability.ability_data?.description || ability.description,
      ability: abilityWithName
    };

    return useLongPress(
      (event) => showPopup(actionData, event),
      {
        threshold: 500,
        onStart: () => {
          console.log('Long press started for ability:', ability.ability_name || ability.name);
        },
        onCancel: () => {
          console.log('Long press cancelled for ability:', ability.ability_name || ability.name);
        }
      }
    );
  }, [showPopup]);

  /**
   * Creates long press handlers for a general action (skills, saves, etc.)
   */
  const createActionLongPressHandlers = useCallback((actionInfo) => {
    const actionData = {
      type: 'other',
      name: actionInfo.name,
      description: actionInfo.description || `${actionInfo.name} - ${actionInfo.type}`,
      actionInfo
    };

    return useLongPress(
      (event) => showPopup(actionData, event),
      {
        threshold: 500,
        onStart: () => {
          console.log('Long press started for action:', actionInfo.name);
        },
        onCancel: () => {
          console.log('Long press cancelled for action:', actionInfo.name);
        }
      }
    );
  }, [showPopup]);

  return {
    popupState,
    showPopup,
    hidePopup,
    createWeaponLongPressHandlers,
    createAbilityLongPressHandlers,
    createActionLongPressHandlers
  };
};