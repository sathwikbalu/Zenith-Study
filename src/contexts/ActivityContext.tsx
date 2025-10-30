import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { activitiesAPI } from "@/lib/api";

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityContextType {
  activities: ActivityData[];
  currentStreak: number;
  longestStreak: number;
  addActivity: () => Promise<void>;
  loading: boolean;
}

const ActivityContext = createContext<ActivityContextType | undefined>(
  undefined
);

export const ActivityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch activities and streaks from backend
  useEffect(() => {
    const fetchActivities = async () => {
      if (user) {
        try {
          setLoading(true);
          // Fetch activities
          const fetchedActivities = await activitiesAPI.getAll();
          setActivities(fetchedActivities);

          // Fetch streaks
          const streaks = await activitiesAPI.getStreaks();
          setCurrentStreak(streaks.currentStreak);
          setLongestStreak(streaks.longestStreak);
        } catch (error) {
          console.error("Error fetching activities:", error);
          // Fallback to localStorage if API fails
          const storageKey = `zenith_activities_${user.id}`;
          const stored = localStorage.getItem(storageKey);

          if (stored) {
            const data = JSON.parse(stored);
            setActivities(data.activities);
            calculateStreaks(data.activities);
          } else {
            // Generate initial mock data
            const mockActivities = generateMockActivities();
            setActivities(mockActivities);
            calculateStreaks(mockActivities);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchActivities();
  }, [user]);

  const generateMockActivities = (): ActivityData[] => {
    const activities: ActivityData[] = [];
    const today = new Date();

    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Random activity with higher probability for recent dates
      const probability = i < 30 ? 0.8 : 0.5;
      if (Math.random() < probability) {
        activities.push({
          date: dateStr,
          count: Math.floor(Math.random() * 10) + 1,
        });
      }
    }

    return activities;
  };

  const calculateStreaks = (activityData: ActivityData[]) => {
    const sortedDates = activityData
      .map((a) => new Date(a.date))
      .sort((a, b) => b.getTime() - a.getTime());

    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate current streak
    for (let i = 0; i < sortedDates.length; i++) {
      const activityDate = new Date(sortedDates[i]);
      activityDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (activityDate.getTime() === expectedDate.getTime()) {
        current++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const diff = Math.floor(
          (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (diff === 1) {
          tempStreak++;
        } else {
          longest = Math.max(longest, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longest = Math.max(longest, tempStreak);

    setCurrentStreak(current);
    setLongestStreak(longest);
  };

  const addActivity = async () => {
    if (!user) return;

    try {
      // Add activity to backend
      const newActivity = await activitiesAPI.add();

      // Update local state
      const updatedActivities = [...activities, newActivity];
      setActivities(updatedActivities);

      // Recalculate streaks
      const streaks = await activitiesAPI.getStreaks();
      setCurrentStreak(streaks.currentStreak);
      setLongestStreak(streaks.longestStreak);
    } catch (error) {
      console.error("Error adding activity:", error);
      // Fallback to localStorage
      const today = new Date().toISOString().split("T")[0];
      const existingActivity = activities.find((a) => a.date === today);

      let updatedActivities: ActivityData[];
      if (existingActivity) {
        updatedActivities = activities.map((a) =>
          a.date === today ? { ...a, count: a.count + 1 } : a
        );
      } else {
        updatedActivities = [...activities, { date: today, count: 1 }];
      }

      setActivities(updatedActivities);
      calculateStreaks(updatedActivities);

      const storageKey = `zenith_activities_${user.id}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({ activities: updatedActivities })
      );
    }
  };

  return (
    <ActivityContext.Provider
      value={{ activities, currentStreak, longestStreak, addActivity, loading }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
};
