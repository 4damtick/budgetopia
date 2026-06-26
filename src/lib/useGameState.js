import { useState, useEffect, useCallback } from 'react';
import {
  getProfile, saveProfile, getTransactions, getBuildings, getCategories,
  getTotalPoints, getCityLevel, isOnboarded, setOnboarded,
} from './localStorage';

export default function useGameState() {
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [cityLevel, setCityLevel] = useState(1);
  const [onboarded, setOnboardedState] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setTransactions(getTransactions());
    setBuildings(getBuildings());
    setTotalPoints(getTotalPoints());
    setCityLevel(getCityLevel());
    setOnboardedState(isOnboarded());
  }, []);

  const refresh = useCallback(() => {
    setProfile(getProfile());
    setTransactions(getTransactions());
    setBuildings(getBuildings());
    setTotalPoints(getTotalPoints());
    setCityLevel(getCityLevel());
  }, []);

  const updateProfile = useCallback((data) => {
    const merged = { ...profile, ...data };
    saveProfile(merged);
    setProfile(merged);
  }, [profile]);

  const completeOnboarding = useCallback(() => {
    setOnboarded();
    setOnboardedState(true);
  }, []);

  return { profile, transactions, buildings, totalPoints, cityLevel, onboarded,
    updateProfile, completeOnboarding, refresh };
}