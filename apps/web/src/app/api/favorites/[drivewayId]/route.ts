import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@parkway/database';
import { createApiResponse, createApiError } from '@parkway/shared';
import { requireAuth } from '@/lib/auth-middleware';
import { logger } from '@/lib/logger';
export const dynamic ='force-dynamic';
export const runtime ='nodejs';


export async function DELETE(req: NextRequest, { params }: { params: Promise<{ drivewayId: string }> }) {
    try {
        const authResult = await requireAuth(req);
        if (!authResult.success) {
          return authResult.error!;
        }

        const userId = authResult.userId!;

        const { drivewayId } = await params;

        const favorite = await prisma.favorite.findUnique({
            where: {userId_drivewayId: {userId: userId, drivewayId: drivewayId}}

        });

        if(!favorite){
            return NextResponse.json(createApiError('Favorite not found', 404, 'NOT_FOUND'), {status: 404});
        
        }


        await prisma.favorite.delete({
            where: {userId_drivewayId: {userId: userId, drivewayId: drivewayId}}

        }
        );

        return NextResponse.json(createApiResponse(null, 'Favorite deleted successfully', 200), {status: 200});
    
        
        
    }
   



    catch(error){
        logger.error('Delete favorite error',{}, error instanceof Error ? error: undefined);
        return NextResponse.json(
            createApiError('Failed to delete favorite', 500, 'INTERNAL_ERROR'), 
            {status: 500});

    }    
}


