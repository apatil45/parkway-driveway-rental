'use client';

import { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import api from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from './LoadingSpinner';

interface FavoriteButtonProps{
    drivewayId: string;
    isFavorite: boolean;
    onToggle?: (newState: boolean) => void;

}

export default function FavoriteButton({
    drivewayId,isFavorite,onToggle}: FavoriteButtonProps) {
        const [isFavorited, setIsFavorited] = useState(isFavorite);
        const [loading, setLoading] = useState(false);

        // Sync with parent when it loads favorite status (e.g. after login)
        useEffect(() => {
            setIsFavorited(isFavorite);
        }, [isFavorite]);

        const {showToast} = useToast();
    
        const handleToggle = async () => {
            if(loading) return;

            setLoading(true);

            try{
                if(isFavorited){
                    await api.delete(`/favorites/${drivewayId}`);
                    setIsFavorited(false);
                    onToggle?.(false);
                    showToast('Driveway removed from favorites', 'success');

                }
                else{
                    await api.post(`/favorites`, {drivewayId});
                    setIsFavorited(true);
                    showToast('Driveway added to favorites', 'success');
                    onToggle?.(true);

                }
            
            }
            catch(error: any){
                const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update favorite, Try again.';
                showToast(errorMessage, 'error');

        }
        finally{
            setLoading(false);

        }
    };
    return(
        <button 
            onClick={handleToggle} disabled={loading} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
            ) : (
                isFavorited ? <HeartIconSolid className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6 text-gray-400 hover:text-red-500" />
            )}
        </button>
    )
}
