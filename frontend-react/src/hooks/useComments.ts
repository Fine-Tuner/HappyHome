import { useState, useEffect } from 'react';
import { Comment } from '../types/announcementDetail';
import { api } from '../api/client';

export const useComments = (announcementSn: string) => {
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedComments = localStorage.getItem('comments');
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, []);

  const handleAddComment = async (topicId: string, content: string) => {
    const contentId = `${topicId}-${content}`;
    if (!newComment[contentId]?.trim()) return;

    try {
      const response = await api.addComment(announcementSn, {
        contentId,
        content: newComment[contentId],
        author: '사용자'
      });

      const updatedComments = {
        ...comments,
        [contentId]: [...(comments[contentId] || []), response]
      };

      setComments(updatedComments);
      localStorage.setItem('comments', JSON.stringify(updatedComments));
      
      setNewComment(prev => ({
        ...prev,
        [contentId]: ''
      }));
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('댓글 추가에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (topicId: string, content: string, commentId: string) => {
    const contentId = `${topicId}-${content}`;
    
    try {
      await api.deleteComment(announcementSn, commentId);
      
      const updatedComments = {
        ...comments,
        [contentId]: (comments[contentId] || []).filter(c => c.id !== commentId)
      };

      setComments(updatedComments);
      localStorage.setItem('comments', JSON.stringify(updatedComments));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  return {
    comments,
    newComment,
    setNewComment,
    handleAddComment,
    handleDeleteComment
  };
}; 