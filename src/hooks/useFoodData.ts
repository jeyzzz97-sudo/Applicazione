import { useState, useEffect } from 'react';
import { db, doc, onSnapshot, setDoc, serverTimestamp } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Meal, MealPlan } from '../types';

export const useFoodData = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const mealsRef = doc(db, 'users', user.uid, 'data', 'meals');
    const unsubMeals = onSnapshot(mealsRef, (snap) => {
      if (snap.exists()) {
        setMeals(snap.data().items || []);
      } else {
        setMeals([]);
      }
    });

    const foodRef = doc(db, 'users', user.uid, 'data', 'foodPlan');
    const unsubFood = onSnapshot(foodRef, (snap) => {
      if (snap.exists()) {
        setMealPlan(snap.data().plan || {});
      } else {
        setMealPlan({});
      }
      setLoading(false);
    });

    return () => {
      unsubMeals();
      unsubFood();
    };
  }, [user]);

  const saveMeals = async (newMeals: Meal[]) => {
    if (!user) return;
    setMeals(newMeals);
    await setDoc(doc(db, 'users', user.uid, 'data', 'meals'), { items: newMeals, updatedAt: serverTimestamp() });
  };

  const saveMealPlan = async (newPlan: MealPlan) => {
    if (!user) return;
    setMealPlan(newPlan);
    await setDoc(doc(db, 'users', user.uid, 'data', 'foodPlan'), { plan: newPlan, updatedAt: serverTimestamp() });
  };

  return { meals, mealPlan, saveMeals, saveMealPlan, loading };
};
