'use client';

import { useState, useEffect } from 'react';
import { questUserApi } from '@/lib/api/quest';
import QuestBanner from './QuestBanner';

export default function QuestSection() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    setLoading(true);
    try {
      const idToken = localStorage.getItem('idToken');
      if (!idToken) {
        console.log('No token found');
        setLoading(false);
        return;
      }

      const data = await questUserApi.getMyContents(idToken);
      setQuests(data.contents || []);
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (quests.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 px-4">
      <h2 className="text-xl font-bold mb-4">📝 나의 Quest</h2>
      <div className="space-y-3">
        {quests.map((quest, index) => (
          <QuestBanner 
            key={quest.assignmentId} 
            quest={quest} 
            index={index}
            onComplete={loadQuests}
          />
        ))}
      </div>
    </div>
  );
}