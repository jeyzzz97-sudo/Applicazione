import { useState, useEffect } from 'react';
import { db, doc, onSnapshot, setDoc, serverTimestamp } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Task, AppState } from '../types';
import { defaultRoutine } from '../utils/helpers';

export const useRoutineData = (dateISO: string) => {
  const { user } = useAuth();
  const [routine, setRoutine] = useState<Task[]>([]);
  const [state, setState] = useState<AppState>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const configRef = doc(db, 'users', user.uid, 'data', 'config');
    const unsubConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        setRoutine(snap.data().tasks);
      } else {
        const initialRoutine = defaultRoutine();
        setRoutine(initialRoutine);
        setDoc(configRef, { tasks: initialRoutine, updatedAt: serverTimestamp() });
      }
      setLoading(false);
    });

    return () => unsubConfig();
  }, [user]);

  useEffect(() => {
    if (!user || !dateISO) return;

    const stateRef = doc(db, 'users', user.uid, 'states', dateISO);
    const unsubState = onSnapshot(stateRef, (snap) => {
      if (snap.exists()) {
        setState(snap.data().checks || {});
      } else {
        setState({});
      }
    });

    return () => unsubState();
  }, [user, dateISO]);

  const saveConfig = async (newRoutine: Task[]) => {
    if (!user) return;
    setRoutine(newRoutine);
    await setDoc(doc(db, 'users', user.uid, 'data', 'config'), { tasks: newRoutine, updatedAt: serverTimestamp() });
  };

  const saveState = async (newState: AppState) => {
    if (!user) return;
    setState(newState);
    await setDoc(doc(db, 'users', user.uid, 'states', dateISO), { checks: newState, updatedAt: serverTimestamp() });
  };

  return { routine, state, saveConfig, saveState, loading };
};
